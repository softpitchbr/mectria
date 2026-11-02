import { render } from "@testing-library/react";
import App from "../App";

type RespostaFalsa = { status?: number; corpo: unknown };

/** Troca o fetch por respostas fixas por caminho (o resto dá 404). */
export function fingirApi(rotas: Record<string, RespostaFalsa | ((init?: RequestInit) => RespostaFalsa)>) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const caminho = new URL(url, "http://localhost").pathname;
    const rota = rotas[`${init?.method ?? "GET"} ${caminho}`] ?? rotas[caminho];
    const r = typeof rota === "function" ? rota(init) : rota;
    if (!r) return new Response(JSON.stringify({ erro: "nao_encontrado", mensagem: "Não encontrado." }), { status: 404 });
    return new Response(JSON.stringify(r.corpo), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", falso);
  return falso;
}

export const PESSOAS = {
  hunter: { id: 1, nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" },
  closer: { id: 2, nome: "Vinícius Miguel", email: "clo@mectria.com", cargo: "closer" },
  diretor: { id: 3, nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" },
  projetos: { id: 4, nome: "Paulo Projetos", email: "pro@mectria.com", cargo: "projetos" },
} as const;

/** Renderiza o app inteiro já no caminho pedido. */
export function abrir(caminho: string) {
  window.history.replaceState({}, "", caminho);
  return render(<App />);
}
