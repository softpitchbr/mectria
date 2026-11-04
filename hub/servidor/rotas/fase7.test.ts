import { applyD1Migrations, env } from "cloudflare:test";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getLigacoes, onRequestPost as postLigacao } from "../../functions/api/ligacoes";
import { onRequestPost as postOportunidade } from "../../functions/api/oportunidades/index";
import { criar } from "../pessoas";
import type { DadosApi, Env, Pessoa } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;

let closer: Pessoa;
let hunter: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "fichas", "pendencias", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  await criar(env.DB, { nome: "Helena Hunter", email: "hun2@mectria.com", cargo: "hunter" });
  await criar(env.DB, { nome: "Paulo Projetos", email: "pro@mectria.com", cargo: "projetos" });
});

async function chamar(
  manipulador: Manipulador,
  email: string,
  opcoes: { metodo?: string; corpo?: unknown; params?: Record<string, string>; busca?: string } = {},
) {
  const metodo = opcoes.metodo ?? (opcoes.corpo === undefined ? "GET" : "POST");
  const request = new Request(`http://localhost:8788/api/x${opcoes.busca ?? ""}`, {
    method: metodo,
    headers: { "X-Dev-Email": email, "Content-Type": "application/json" },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
  });
  const ambiente: Env = { ...env, AMBIENTE: "dev" };
  const base = { request, env: ambiente, params: opcoes.params ?? {}, data: {} as DadosApi, functionPath: "/api/x", waitUntil() {}, passThroughOnException() {} };
  const rota = { ...base, next: async () => new Response(null, { status: 404 }) };
  return onRequest({ ...base, next: async () => manipulador(rota as never) } as never);
}

const g = (m: unknown) => m as Manipulador;
const corpo = async <T = Record<string, unknown>>(r: Response) => (await r.json()) as T;

test("POST /api/ligacoes aceita conexão e recusa outro valor; GET traz as conexões da semana", async () => {
  expect((await chamar(g(postLigacao), "hun@mectria.com", { corpo: { resultado: "conexao" } })).status).toBe(200);
  expect((await chamar(g(postLigacao), "hun@mectria.com", { corpo: { resultado: "quase" } })).status).toBe(400);
  const c = await corpo(await chamar(g(getLigacoes), "hun@mectria.com"));
  expect(c).toMatchObject({ conexao: 1, conexoesSemana: 1, metaConexoesSemana: 8 });
  expect(closer.id).toBeGreaterThan(0);
  expect(hunter.id).toBeGreaterThan(0);
});

test("observação com mais de 1.000 caracteres dá 400", async () => {
  const nova = { empresa: "Obs", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2099-01-05T10:00", formato: "online" };
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...nova, observacoes: "a".repeat(1001) } })).status).toBe(400);
  const ok = await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...nova, observacoes: "Prefere WhatsApp." } });
  expect(ok.status).toBe(201);
  expect(await corpo(ok)).toMatchObject({ reuniao: { observacoes: "Prefere WhatsApp." } });
});
