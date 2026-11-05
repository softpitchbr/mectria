import { useCallback, useEffect, useRef, useState } from "react";
import type { Andamento } from "../../compartilhado/proposta";
import { api, ErroApi } from "../api/cliente";
import type { EstadoRascunho } from "../diagnostica/rascunho";

interface Guardado {
  andamento: Andamento;
  pendente: boolean;
  /** Sobe a cada mudança: o envio só tira da fila a versão que mandou. */
  versao: number;
}

const chave = (reuniaoId: number) => `hub-proposta-${reuniaoId}`;

function lerLocal(reuniaoId: number): Guardado | null {
  try {
    const texto = localStorage.getItem(chave(reuniaoId));
    return texto ? (JSON.parse(texto) as Guardado) : null;
  } catch {
    return null;
  }
}

function gravarLocal(reuniaoId: number, g: Guardado) {
  try {
    localStorage.setItem(chave(reuniaoId), JSON.stringify(g));
  } catch {
    // Sem armazenamento: segue só na memória desta aba.
  }
}

/**
 * Andamento da reunião de proposta (sala, pactos, tempos e slide): fica no computador na hora e vai inteiro
 * para o servidor a cada `intervalo` ms. Sem internet, guarda e avisa; o que está pendente aqui vale mais
 * que a versão do servidor quando o painel reabre. Inativo (a reunião está aberta em outra aba), não manda nada.
 */
export function useAndamento(reuniaoId: number, inicial: Andamento | null, intervalo = 5000, ativo = true) {
  const local = useRef<Guardado | null | undefined>(undefined);
  if (local.current === undefined) local.current = lerLocal(reuniaoId);
  const [andamento, setAndamento] = useState<Andamento | null>(() => local.current?.andamento ?? null);
  const [estado, setEstado] = useState<EstadoRascunho>(() => (local.current?.pendente ? "salvando" : "salvo"));
  const [aviso, setAviso] = useState("");
  const avisoDePermissao = useRef("");
  const emAndamento = useRef<Promise<boolean> | null>(null);
  /** A maior versão que o servidor já confirmou, e a última mudança que não foi só de tempo. */
  const confirmada = useRef(local.current?.pendente ? -1 : (local.current?.versao ?? 0));
  const ultimaVisivel = useRef(local.current?.versao ?? 0);

  // Quando o servidor responde (uma vez): o pendente do computador vale mais; senão, vale o servidor.
  const juntou = useRef(false);
  useEffect(() => {
    if (!inicial || juntou.current) return;
    juntou.current = true;
    if (local.current?.pendente) return;
    local.current = { andamento: inicial, pendente: false, versao: local.current?.versao ?? 0 };
    gravarLocal(reuniaoId, local.current);
    setAndamento(inicial);
  }, [inicial, reuniaoId]);

  /** Muda o andamento. `silencioso` (o tempo que corre a cada segundo) não troca o "Salvo" por "Salvando…". */
  const mudar = useCallback(
    (f: (a: Andamento) => Andamento, opcoes: { silencioso?: boolean } = {}) => {
      const g = local.current;
      if (!g) return;
      local.current = { andamento: f(g.andamento), pendente: true, versao: g.versao + 1 };
      gravarLocal(reuniaoId, local.current);
      setAndamento(local.current.andamento);
      if (opcoes.silencioso) return;
      ultimaVisivel.current = local.current.versao;
      setEstado((e) => (e === "sem_internet" || e === "sem_permissao" ? e : "salvando"));
    },
    [reuniaoId],
  );

  const rodada = useCallback(
    async (keepalive: boolean): Promise<boolean> => {
      const g = local.current;
      if (!g?.pendente) return true;
      const versao = g.versao;
      try {
        await api(`/api/reunioes/${reuniaoId}/andamento`, { method: "PUT", body: JSON.stringify(g.andamento), ...(keepalive ? { keepalive: true } : {}) });
        // A permissão voltou (entrou de novo): o aviso dela some; o de algo recusado fica.
        setAviso((atual) => (atual && atual === avisoDePermissao.current ? "" : atual));
      } catch (e) {
        if (!(e instanceof ErroApi)) throw e;
        if (e.status === 0) {
          setEstado("sem_internet");
          return false;
        }
        if (e.status === 401 || e.status === 403) {
          setEstado("sem_permissao");
          avisoDePermissao.current = e.mensagem;
          setAviso(e.mensagem);
          return false;
        }
        // 409: a reunião já foi encerrada (o envio atrasado não importa mais). 400 e 404: sai da fila com aviso.
        if (e.status === 400 || e.status === 404) setAviso(`O andamento não foi salvo: ${e.mensagem}`);
        else if (e.status !== 409) {
          setEstado("salvando");
          return false;
        }
      }
      confirmada.current = Math.max(confirmada.current, versao);
      const atual = local.current!;
      if (atual.versao === versao) local.current = { ...atual, pendente: false };
      gravarLocal(reuniaoId, local.current!);
      setEstado(confirmada.current >= ultimaVisivel.current ? "salvo" : "salvando");
      return true;
    },
    [reuniaoId],
  );

  /**
   * Manda o que está pendente até o servidor confirmar a versão do momento da chamada (o relógio pode
   * continuar mudando o tempo enquanto isso). Espera o envio em andamento. Devolve se conseguiu.
   */
  const sincronizar = useCallback(
    async (opcoes: { keepalive?: boolean } = {}): Promise<boolean> => {
      const alvo = local.current?.versao ?? 0;
      for (let volta = 0; volta < 5; volta++) {
        if (emAndamento.current) {
          await emAndamento.current.catch(() => false);
          continue;
        }
        if (!local.current?.pendente || confirmada.current >= alvo) return true;
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
      return !local.current?.pendente || confirmada.current >= alvo;
    },
    [rodada],
  );

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => {
      if (!emAndamento.current) void sincronizar();
    }, intervalo);
    const aoVoltar = () => void sincronizar();
    const aoSair = () => void sincronizar({ keepalive: true });
    window.addEventListener("online", aoVoltar);
    window.addEventListener("pagehide", aoSair);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", aoVoltar);
      window.removeEventListener("pagehide", aoSair);
      void sincronizar();
    };
  }, [sincronizar, intervalo, ativo]);

  return { andamento, mudar, estado, aviso, sincronizar };
}
