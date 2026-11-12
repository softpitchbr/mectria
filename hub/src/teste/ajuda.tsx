import { render } from "@testing-library/react";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import App from "../App";

type RespostaFalsa = { status?: number; corpo: unknown };

/** Troca o fetch por respostas fixas por caminho (o resto dá 404; GET /api/servicos dá a carta e GET /api/apresentacoes, a diagnóstica sem arquivo). */
export function fingirApi(rotas: Record<string, RespostaFalsa | ((init?: RequestInit) => RespostaFalsa)>) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const caminho = new URL(url, "http://localhost").pathname;
    // Os serviços (GET /api/servicos) respondem a carta, a não ser que o teste defina outra lista.
    const ehGet = (init?.method ?? "GET") === "GET";
    const padrao =
      caminho === "/api/servicos" && ehGet
        ? { corpo: servicosDaCarta() }
        : caminho === "/api/apresentacoes" && ehGet
          ? { corpo: [{ id: "diagnostica", apresentacao: null }] }
          : undefined;
    const rota = rotas[`${init?.method ?? "GET"} ${caminho}`] ?? rotas[caminho] ?? padrao;
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

/** Números do mês sem nada registrado (GET /api/time/numeros). */
export const NUMEROS_VAZIOS = {
  mes: "2026-11",
  propostas: 0,
  ganhas: 0,
  perdidas: 0,
  conversao: null,
  valorVendido: 0,
  tempoMedioDias: null,
  pactosPorReuniao: null,
  objecoes: [],
  porCloser: [],
  rotina: [],
};

/** Renderiza o app inteiro já no caminho pedido. */
export function abrir(caminho: string) {
  window.history.replaceState({}, "", caminho);
  return render(<App />);
}
