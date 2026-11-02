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
