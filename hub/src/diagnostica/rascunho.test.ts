import { act, renderHook } from "@testing-library/react";
import { useRascunho } from "./rascunho";

type Chamada = { url: string; metodo: string; corpo: unknown };

function fetchQue(responde: () => "ok" | "cai") {
  const chamadas: Chamada[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      chamadas.push({ url, metodo: init?.method ?? "GET", corpo: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (responde() === "cai") throw new TypeError("Failed to fetch");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return chamadas;
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

test("responde, espera 5 s e manda só o que mudou", async () => {
  const chamadas = fetchQue(() => "ok");
  const { result } = renderHook(() => useRascunho(7, { respostas: { "g-resultado": "26 °C" }, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  expect(result.current.estado).toBe("salvando");
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(chamadas).toEqual([{ url: "/api/reunioes/7/respostas", metodo: "PUT", corpo: { respostas: [{ perguntaId: "c-dor", resposta: "calor" }] } }]);
  expect(result.current.estado).toBe("salvo");
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(chamadas).toHaveLength(1);
});

test("anotação vai uma vez só", async () => {
  const chamadas = fetchQue(() => "ok");
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.anotar({ idCliente: "n-1", minuto: 3, passo: "c-dor", marcacao: "tecnico", texto: "Pé-direito de 9 m" }));
  expect(result.current.anotacoes).toHaveLength(1);
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(chamadas.filter((c) => c.url === "/api/reunioes/7/anotacoes")).toHaveLength(1);
});

test("sem internet guarda e mostra sem_internet; quando volta, manda e fica salvo", async () => {
  let rede: "ok" | "cai" = "cai";
  const chamadas = fetchQue(() => rede);
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(result.current.estado).toBe("sem_internet");
  expect(JSON.parse(localStorage.getItem("hub-diagnostica-7")!).respostas).toEqual({ "c-dor": "calor" });
  rede = "ok";
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(result.current.estado).toBe("salvo");
  expect(chamadas.at(-1)).toMatchObject({ metodo: "PUT", corpo: { respostas: [{ perguntaId: "c-dor", resposta: "calor" }] } });
});

test("abrir de novo recupera o rascunho do localStorage antes do servidor responder", () => {
  fetchQue(() => "ok");
  localStorage.setItem(
    "hub-diagnostica-7",
    JSON.stringify({ respostas: { "c-dor": "calor" }, anotacoes: [], pendentesRespostas: ["c-dor"], pendentesAnotacoes: [] }),
  );
  const { result, rerender } = renderHook(({ inicial }) => useRascunho(7, inicial), {
    initialProps: { inicial: null as null | { respostas: Record<string, string>; anotacoes: never[] } },
  });
  expect(result.current.respostas["c-dor"]).toBe("calor");
  rerender({ inicial: { respostas: { "c-dor": "versão velha do servidor", "g-resultado": "26 °C" }, anotacoes: [] } });
  expect(result.current.respostas).toEqual({ "c-dor": "calor", "g-resultado": "26 °C" });
});

test("localStorage bloqueado não quebra", async () => {
  fetchQue(() => "ok");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("bloqueado");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("bloqueado");
  });
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  expect(result.current.respostas["c-dor"]).toBe("calor");
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(result.current.estado).toBe("salvo");
  vi.restoreAllMocks();
});

/** fetch que responde conforme a função; "preso" segura o pedido até soltar(). */
function fetchControlado(responde: (c: Chamada) => "ok" | "cai" | "preso" | { status: number; erro: string; mensagem: string }) {
  const chamadas: Chamada[] = [];
  const presos: (() => void)[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const c = { url, metodo: init?.method ?? "GET", corpo: init?.body ? JSON.parse(String(init.body)) : undefined };
      chamadas.push(c);
      const r = responde(c);
      if (r === "cai") throw new TypeError("Failed to fetch");
      if (r === "preso") await new Promise<void>((solta) => presos.push(solta));
      if (typeof r === "object") return new Response(JSON.stringify({ erro: r.erro, mensagem: r.mensagem }), { status: r.status, headers: { "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return { chamadas, soltar: () => presos.splice(0).forEach((s) => s()) };
}

test("sincronizar espera o envio em andamento e só volta quando tudo chegou ao servidor", async () => {
  let primeira = true;
  const { chamadas, soltar } = fetchControlado(() => {
    if (primeira) {
      primeira = false;
      return "preso";
    }
    return "ok";
  });
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  act(() => result.current.responder("e-custos", "R$ 4 mil por mês"));
  let voltou: boolean | undefined;
  let promessa!: Promise<boolean>;
  act(() => {
    promessa = result.current.sincronizar();
    void promessa.then((v) => (voltou = v));
  });
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(voltou).toBeUndefined();
  await act(async () => {
    soltar();
    await promessa;
  });
  expect(voltou).toBe(true);
  expect(chamadas.at(-1)).toMatchObject({ metodo: "PUT", corpo: { respostas: [{ perguntaId: "e-custos", resposta: "R$ 4 mil por mês" }] } });
  expect(result.current.estado).toBe("salvo");
});

test("sincronizar devolve false quando não conseguiu falar com o servidor", async () => {
  fetchControlado(() => "cai");
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  let conseguiu: boolean | undefined;
  await act(async () => {
    conseguiu = await result.current.sincronizar();
  });
  expect(conseguiu).toBe(false);
});

test("anotação recusada pelo servidor (400) sai da fila, avisa e não trava as seguintes", async () => {
  const { chamadas } = fetchControlado((c) =>
    (c.corpo as { idCliente?: string } | undefined)?.idCliente === "n-longa" ? { status: 400, erro: "invalido", mensagem: "Escreva a anotação (até 2.000 caracteres)." } : "ok",
  );
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.anotar({ idCliente: "n-longa", minuto: 3, passo: "c-dor", marcacao: null, texto: "x".repeat(2001) }));
  act(() => result.current.anotar({ idCliente: "n-tec", minuto: 4, passo: "c-dor", marcacao: "tecnico", texto: "Pé-direito de 9 m" }));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  await act(() => vi.advanceTimersByTimeAsync(15000));
  const notas = chamadas.filter((c) => c.url === "/api/reunioes/7/anotacoes").map((c) => (c.corpo as { idCliente: string }).idCliente);
  expect(notas).toEqual(["n-longa", "n-tec"]);
  expect(result.current.estado).toBe("salvo");
  expect(result.current.aviso).toBe("Essa anotação não foi salva: Escreva a anotação (até 2.000 caracteres).");
});

test("sem permissão (403) vira um estado visível, não fica em salvando", async () => {
  fetchControlado(() => ({ status: 403, erro: "sem_permissao", mensagem: "Essa reunião é de outro closer." }));
  const { result } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(result.current.estado).toBe("sem_permissao");
  expect(result.current.aviso).toBe("Essa reunião é de outro closer.");
});

test("ao desmontar (sair do painel), manda o que estava pendente", async () => {
  const { chamadas } = fetchControlado(() => "ok");
  const { result, unmount } = renderHook(() => useRascunho(7, { respostas: {}, anotacoes: [] }));
  act(() => result.current.responder("c-dor", "calor"));
  unmount();
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(chamadas).toEqual([expect.objectContaining({ metodo: "PUT", corpo: { respostas: [{ perguntaId: "c-dor", resposta: "calor" }] } })]);
});
