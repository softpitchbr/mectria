import { act, renderHook } from "@testing-library/react";
import type { Andamento } from "../../compartilhado/proposta";
import { useAndamento } from "./andamento";

type Chamada = { url: string; metodo: string; corpo: unknown };

function fetchControlado(responde: () => "ok" | "cai" | "preso") {
  const chamadas: Chamada[] = [];
  const presos: (() => void)[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      chamadas.push({ url, metodo: init?.method ?? "GET", corpo: init?.body ? JSON.parse(String(init.body)) : undefined });
      const r = responde();
      if (r === "cai") throw new TypeError("Failed to fetch");
      if (r === "preso") await new Promise<void>((solta) => presos.push(solta));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
  return { chamadas, soltar: () => presos.splice(0).forEach((s) => s()) };
}

const SERVIDOR: Andamento = { sala: [{ nome: "Bia", decide: true }], pactos: [], tempos: {}, slide: 0 };

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

test("andamento muda, espera 5 s e manda o estado inteiro", async () => {
  const { chamadas } = fetchControlado(() => "ok");
  const { result } = renderHook(() => useAndamento(9, SERVIDOR));
  act(() => result.current.mudar((a) => ({ ...a, slide: 2 })));
  expect(result.current.andamento?.slide).toBe(2);
  expect(result.current.estado).toBe("salvando");
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(chamadas).toEqual([{ url: "/api/reunioes/9/andamento", metodo: "PUT", corpo: { ...SERVIDOR, slide: 2 } }]);
  expect(result.current.estado).toBe("salvo");
  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(chamadas).toHaveLength(1);
});

test("painel recarregado volta no mesmo slide, com os pactos", () => {
  fetchControlado(() => "ok");
  const noComputador: Andamento = { ...SERVIDOR, slide: 4, pactos: [{ id: "agenda", minuto: 2 }] };
  localStorage.setItem("hub-proposta-9", JSON.stringify({ andamento: noComputador, pendente: true, versao: 3 }));
  const { result, rerender } = renderHook(({ inicial }) => useAndamento(9, inicial), { initialProps: { inicial: null as Andamento | null } });
  expect(result.current.andamento).toEqual(noComputador);
  rerender({ inicial: SERVIDOR });
  expect(result.current.andamento).toEqual(noComputador);
});

test("sem nada pendente no computador, vale o servidor", () => {
  fetchControlado(() => "ok");
  localStorage.setItem("hub-proposta-9", JSON.stringify({ andamento: { ...SERVIDOR, slide: 7 }, pendente: false, versao: 1 }));
  const { result, rerender } = renderHook(({ inicial }) => useAndamento(9, inicial), { initialProps: { inicial: null as Andamento | null } });
  rerender({ inicial: { ...SERVIDOR, slide: 3 } });
  expect(result.current.andamento?.slide).toBe(3);
});

test("sincronizar espera o envio em andamento e manda o que mudou durante ele", async () => {
  let primeira = true;
  const { chamadas, soltar } = fetchControlado(() => {
    if (primeira) {
      primeira = false;
      return "preso";
    }
    return "ok";
  });
  const { result } = renderHook(() => useAndamento(9, SERVIDOR));
  act(() => result.current.mudar((a) => ({ ...a, slide: 1 })));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  act(() => result.current.mudar((a) => ({ ...a, slide: 2 })));
  let promessa!: Promise<boolean>;
  act(() => {
    promessa = result.current.sincronizar();
  });
  let conseguiu: boolean | undefined;
  await act(async () => {
    soltar();
    conseguiu = await promessa;
  });
  expect(conseguiu).toBe(true);
  expect(chamadas.at(-1)?.corpo).toMatchObject({ slide: 2 });
  expect(result.current.estado).toBe("salvo");
});

test("sem internet, sincronizar devolve false e o estado mostra sem internet", async () => {
  fetchControlado(() => "cai");
  const { result } = renderHook(() => useAndamento(9, SERVIDOR));
  act(() => result.current.mudar((a) => ({ ...a, slide: 1 })));
  let conseguiu: boolean | undefined;
  await act(async () => {
    conseguiu = await result.current.sincronizar();
  });
  expect(conseguiu).toBe(false);
  expect(result.current.estado).toBe("sem_internet");
  expect(JSON.parse(localStorage.getItem("hub-proposta-9")!)).toMatchObject({ andamento: { slide: 1 }, pendente: true });
});
