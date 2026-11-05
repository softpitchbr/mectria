import { useCallback, useEffect, useRef, useState } from "react";
import type { Anotacao, Respostas } from "../../compartilhado/diagnostica";
import { api, ErroApi } from "../api/cliente";

export type EstadoRascunho = "salvo" | "salvando" | "sem_internet" | "sem_permissao";

interface Guardado {
  respostas: Respostas;
  anotacoes: Anotacao[];
  pendentesRespostas: string[];
  pendentesAnotacoes: string[];
}

const chave = (reuniaoId: number) => `hub-diagnostica-${reuniaoId}`;

function lerLocal(reuniaoId: number): Guardado | null {
  try {
    const texto = localStorage.getItem(chave(reuniaoId));
    return texto ? (JSON.parse(texto) as Guardado) : null;
  } catch {
    return null;
  }
}

const temPendencia = (g: Guardado) => g.pendentesRespostas.length > 0 || g.pendentesAnotacoes.length > 0;

function gravarLocal(reuniaoId: number, g: Guardado) {
  try {
    localStorage.setItem(chave(reuniaoId), JSON.stringify(g));
  } catch {
    // Sem armazenamento: segue só na memória desta aba.
  }
}

/**
 * Rascunho da diagnóstica: tudo fica no computador na hora e vai para o servidor a cada `intervalo` ms.
 * Sem internet, guarda e avisa; quando volta, manda o que faltou (spec, seções 8 e 9).
 */
export function useRascunho(reuniaoId: number, inicial: { respostas: Respostas; anotacoes: Anotacao[] } | null, intervalo = 5000) {
  const local = useRef<Guardado>(lerLocal(reuniaoId) ?? { respostas: {}, anotacoes: [], pendentesRespostas: [], pendentesAnotacoes: [] });
  const [respostas, setRespostas] = useState<Respostas>(local.current.respostas);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(local.current.anotacoes);
  const [estado, setEstado] = useState<EstadoRascunho>(
    temPendencia(local.current) ? "salvando" : "salvo",
  );

  const guardar = useCallback(() => {
    gravarLocal(reuniaoId, local.current);
    setRespostas({ ...local.current.respostas });
    setAnotacoes([...local.current.anotacoes]);
  }, [reuniaoId]);

  // Quando o servidor responde (uma vez), junta: o que está pendente aqui vale mais que a versão do servidor.
  const juntou = useRef(false);
  useEffect(() => {
    if (!inicial || juntou.current) return;
    juntou.current = true;
    const g = local.current;
    const pendentes = new Set(g.pendentesRespostas);
    const respostasJuntas: Respostas = { ...inicial.respostas };
    for (const [id, texto] of Object.entries(g.respostas)) if (pendentes.has(id)) respostasJuntas[id] = texto;
    const jaTem = new Set(inicial.anotacoes.map((a) => a.idCliente));
    g.respostas = respostasJuntas;
    g.anotacoes = [...inicial.anotacoes, ...g.anotacoes.filter((a) => !jaTem.has(a.idCliente))];
    guardar();
  }, [inicial, guardar]);

  const responder = useCallback(
    (perguntaId: string, texto: string) => {
      const g = local.current;
      g.respostas = { ...g.respostas, [perguntaId]: texto };
      if (!g.pendentesRespostas.includes(perguntaId)) g.pendentesRespostas = [...g.pendentesRespostas, perguntaId];
      guardar();
      setEstado((e) => (e === "sem_internet" || e === "sem_permissao" ? e : "salvando"));
    },
    [guardar],
  );

  const anotar = useCallback(
    (a: Anotacao) => {
      const g = local.current;
      g.anotacoes = [...g.anotacoes, a];
      g.pendentesAnotacoes = [...g.pendentesAnotacoes, a.idCliente];
      guardar();
      setEstado((e) => (e === "sem_internet" || e === "sem_permissao" ? e : "salvando"));
    },
    [guardar],
  );

  const [aviso, setAviso] = useState("");
  const avisoDePermissao = useRef("");
  const emAndamento = useRef<Promise<boolean> | null>(null);

  /**
   * Uma rodada de envio. Devolve false quando parou por um erro (sem internet, sem permissão ou o servidor falhou).
   * O que o servidor recusa por ser inválido (400) sai da fila com um aviso, para não travar o resto.
   */
  const rodada = useCallback(
    async (keepalive: boolean): Promise<boolean> => {
      const g = local.current;
      const init = keepalive ? { keepalive: true } : {};
      const parou = (e: unknown): false => {
        if (!(e instanceof ErroApi)) throw e;
        if (e.status === 0) setEstado("sem_internet");
        else if (e.status === 401 || e.status === 403) {
          setEstado("sem_permissao");
          avisoDePermissao.current = e.mensagem;
          setAviso(e.mensagem);
        } else setEstado("salvando");
        return false;
      };
      const recusado = (e: unknown) => e instanceof ErroApi && e.status === 400;

      const enviadas = g.pendentesRespostas.map((id) => ({ perguntaId: id, resposta: g.respostas[id] ?? "" }));
      if (enviadas.length) {
        try {
          await api(`/api/reunioes/${reuniaoId}/respostas`, { method: "PUT", body: JSON.stringify({ respostas: enviadas }), ...init });
        } catch (e) {
          if (!recusado(e)) {
            gravarLocal(reuniaoId, g);
            return parou(e);
          }
          setAviso(`Essas respostas não foram salvas: ${(e as ErroApi).mensagem}`);
        }
        // Sai da fila só o que não mudou enquanto ia.
        g.pendentesRespostas = g.pendentesRespostas.filter((id) => enviadas.find((x) => x.perguntaId === id)?.resposta !== g.respostas[id]);
      }
      // Cada anotação vai sozinha: uma recusada não segura as outras.
      for (const idCliente of [...g.pendentesAnotacoes]) {
        const a = g.anotacoes.find((x) => x.idCliente === idCliente);
        try {
          if (a) await api(`/api/reunioes/${reuniaoId}/anotacoes`, { method: "POST", body: JSON.stringify(a), ...init });
        } catch (e) {
          if (!recusado(e)) {
            gravarLocal(reuniaoId, g);
            return parou(e);
          }
          setAviso(`Essa anotação não foi salva: ${(e as ErroApi).mensagem}`);
        }
        g.pendentesAnotacoes = g.pendentesAnotacoes.filter((x) => x !== idCliente);
      }
      gravarLocal(reuniaoId, g);
      setEstado(temPendencia(g) ? "salvando" : "salvo");
      // A permissão voltou (entrou de novo): o aviso dela some; o de algo recusado fica.
      setAviso((atual) => (atual && atual === avisoDePermissao.current ? "" : atual));
      return true;
    },
    [reuniaoId],
  );

  /**
   * Manda tudo o que está pendente. Se já há um envio em andamento, espera por ele e continua até a fila
   * esvaziar. Devolve true só quando nada ficou para trás no computador.
   */
  const sincronizar = useCallback(
    async (opcoes: { keepalive?: boolean } = {}): Promise<boolean> => {
      for (let volta = 0; volta < 5; volta++) {
        if (emAndamento.current) {
          await emAndamento.current.catch(() => false);
          continue;
        }
        if (!temPendencia(local.current)) return true;
        const envio = rodada(opcoes.keepalive ?? false);
        emAndamento.current = envio;
        let foi: boolean;
        try {
          foi = await envio;
        } finally {
          emAndamento.current = null;
        }
        if (!foi) return false;
      }
      return !temPendencia(local.current);
    },
    [rodada],
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (!emAndamento.current) void sincronizar();
    }, intervalo);
    const aoVoltar = () => void sincronizar();
    // Ao fechar ou trocar de página, tenta mandar o que faltou (keepalive deixa o pedido terminar).
    const aoSair = () => void sincronizar({ keepalive: true });
    window.addEventListener("online", aoVoltar);
    window.addEventListener("pagehide", aoSair);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", aoVoltar);
      window.removeEventListener("pagehide", aoSair);
      // Saiu do painel: o que estava pendente vai agora (e continua guardado no computador se não for).
      void sincronizar();
    };
  }, [sincronizar, intervalo]);

  return { respostas, anotacoes, responder, anotar, estado, aviso, sincronizar };
}
