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
 * que a versão do servidor quando o painel reabre.
 */
export function useAndamento(reuniaoId: number, inicial: Andamento | null, intervalo = 5000) {
  const local = useRef<Guardado | null | undefined>(undefined);
  if (local.current === undefined) local.current = lerLocal(reuniaoId);
  const [andamento, setAndamento] = useState<Andamento | null>(() => local.current?.andamento ?? null);
  const [estado, setEstado] = useState<EstadoRascunho>(() => (local.current?.pendente ? "salvando" : "salvo"));
  const [aviso, setAviso] = useState("");
  const emAndamento = useRef<Promise<boolean> | null>(null);

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

  const mudar = useCallback(
    (f: (a: Andamento) => Andamento) => {
      const g = local.current;
      if (!g) return;
      local.current = { andamento: f(g.andamento), pendente: true, versao: g.versao + 1 };
      gravarLocal(reuniaoId, local.current);
      setAndamento(local.current.andamento);
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
      } catch (e) {
        if (!(e instanceof ErroApi)) throw e;
        if (e.status === 400) {
          setAviso(`O andamento não foi salvo: ${e.mensagem}`);
        } else {
          if (e.status === 0) setEstado("sem_internet");
          else if (e.status === 401 || e.status === 403) {
            setEstado("sem_permissao");
            setAviso(e.mensagem);
          } else setEstado("salvando");
          return false;
        }
      }
      const atual = local.current!;
      if (atual.versao === versao) local.current = { ...atual, pendente: false };
      gravarLocal(reuniaoId, local.current!);
      setEstado(local.current!.pendente ? "salvando" : "salvo");
      return true;
    },
    [reuniaoId],
  );

  /** Manda o que está pendente; espera o envio em andamento e repete até não sobrar nada. Devolve se conseguiu. */
  const sincronizar = useCallback(
    async (opcoes: { keepalive?: boolean } = {}): Promise<boolean> => {
      for (let volta = 0; volta < 5; volta++) {
        if (emAndamento.current) {
          await emAndamento.current.catch(() => false);
          continue;
        }
        if (!local.current?.pendente) return true;
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
      return !local.current?.pendente;
    },
    [rodada],
  );

  useEffect(() => {
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
  }, [sincronizar, intervalo]);

  return { andamento, mudar, estado, aviso, sincronizar };
}
