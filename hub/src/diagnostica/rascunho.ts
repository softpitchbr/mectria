import { useCallback, useEffect, useRef, useState } from "react";
import type { Anotacao, Respostas } from "../../compartilhado/diagnostica";
import { api, ErroApi } from "../api/cliente";

export type EstadoRascunho = "salvo" | "salvando" | "sem_internet";

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
    local.current.pendentesRespostas.length || local.current.pendentesAnotacoes.length ? "salvando" : "salvo",
  );
  const enviando = useRef(false);

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
      setEstado((e) => (e === "sem_internet" ? e : "salvando"));
    },
    [guardar],
  );

  const anotar = useCallback(
    (a: Anotacao) => {
      const g = local.current;
      g.anotacoes = [...g.anotacoes, a];
      g.pendentesAnotacoes = [...g.pendentesAnotacoes, a.idCliente];
      guardar();
      setEstado((e) => (e === "sem_internet" ? e : "salvando"));
    },
    [guardar],
  );

  const sincronizar = useCallback(async () => {
    const g = local.current;
    if (enviando.current || (!g.pendentesRespostas.length && !g.pendentesAnotacoes.length)) return;
    enviando.current = true;
    const ids = [...g.pendentesRespostas];
    const enviadas = ids.map((id) => ({ perguntaId: id, resposta: g.respostas[id] ?? "" }));
    try {
      if (enviadas.length) {
        await api(`/api/reunioes/${reuniaoId}/respostas`, { method: "PUT", body: JSON.stringify({ respostas: enviadas }) });
        // Sai da fila só o que não mudou enquanto ia.
        g.pendentesRespostas = g.pendentesRespostas.filter((id) => enviadas.find((e) => e.perguntaId === id)?.resposta !== g.respostas[id]);
      }
      for (const idCliente of [...g.pendentesAnotacoes]) {
        const a = g.anotacoes.find((x) => x.idCliente === idCliente);
        if (a) await api(`/api/reunioes/${reuniaoId}/anotacoes`, { method: "POST", body: JSON.stringify(a) });
        g.pendentesAnotacoes = g.pendentesAnotacoes.filter((x) => x !== idCliente);
      }
      gravarLocal(reuniaoId, g);
      setEstado(g.pendentesRespostas.length || g.pendentesAnotacoes.length ? "salvando" : "salvo");
    } catch (e) {
      gravarLocal(reuniaoId, g);
      setEstado(e instanceof ErroApi && e.status === 0 ? "sem_internet" : "salvando");
    } finally {
      enviando.current = false;
    }
  }, [reuniaoId]);

  useEffect(() => {
    const id = setInterval(() => void sincronizar(), intervalo);
    const aoVoltar = () => void sincronizar();
    window.addEventListener("online", aoVoltar);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", aoVoltar);
    };
  }, [sincronizar, intervalo]);

  return { respostas, anotacoes, responder, anotar, estado, sincronizar };
}
