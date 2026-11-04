import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestPost as postResultado } from "../../functions/api/oportunidades/[id]/resultado";
import { onRequestPost as postAdiar } from "../../functions/api/reativacao/[id]/adiar";
import { onRequestPost as postPerdida } from "../../functions/api/reativacao/[id]/perdida";
import { onRequestPost as postReuniao } from "../../functions/api/reativacao/[id]/reuniao";
import { onRequestGet as getReativacao } from "../../functions/api/reativacao/index";
import { onRequestGet as getNumerosDoTime } from "../../functions/api/time/numeros";
import { onRequestGet as getExportar } from "../../functions/api/exportar/[arquivo]";
import { onRequestPost as postApagar } from "../../functions/api/oportunidades/[id]/apagar-dados-pessoais";
import { registrarProposta } from "../followup";
import { criar } from "../pessoas";
import type { DadosApi, Env, Pessoa } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;

let closer: Pessoa;
const hoje = hojeEmSaoPaulo();

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Clara Closer", email: "clo2@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
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

async function propostaEmFollowup(empresa: string): Promise<string> {
  const { proposta } = await registrarProposta(
    env.DB,
    { empresa, contato: "Ana", servico: "climatizacao", valor: 1250000, apresentadaEm: hoje, quemDecide: "Ana" },
    closer,
  );
  return String(proposta.oportunidadeId);
}

test("rotas da reativação: nutrição com o mês, lista, adia, marca reunião e perde; hunter recebe 403; mês inválido dá 400", async () => {
  const id = await propostaEmFollowup("Alfa");
  const params = { id };
  expect((await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "nutricao", retomarEm: "2020-01-01" }, params })).status).toBe(400);
  expect((await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "nutricao", retomarEm: `${hoje.slice(0, 7)}-01` }, params })).status).toBe(200);

  const lista = await chamar(g(getReativacao), "clo@mectria.com");
  expect((await corpo<{ oportunidade: { empresa: string } }[]>(lista)).map((i) => i.oportunidade.empresa)).toEqual(["Alfa"]);
  expect((await chamar(g(getReativacao), "hun@mectria.com")).status).toBe(403);
  expect((await chamar(g(getReativacao), "clo2@mectria.com").then((r) => corpo<unknown[]>(r))).length).toBe(0);

  expect((await chamar(g(postAdiar), "clo@mectria.com", { corpo: { retomarEm: "amanhã" }, params })).status).toBe(400);
  expect((await chamar(g(postAdiar), "clo2@mectria.com", { corpo: { retomarEm: "2099-01-01" }, params })).status).toBe(403);
  expect((await chamar(g(postAdiar), "clo@mectria.com", { corpo: { retomarEm: "2099-01-01" }, params })).status).toBe(200);
  expect(await chamar(g(getReativacao), "clo@mectria.com").then((r) => corpo<unknown[]>(r))).toEqual([]);

  expect((await chamar(g(postReuniao), "clo@mectria.com", { corpo: { dataHora: "ontem", formato: "online" }, params })).status).toBe(400);
  const marcada = await chamar(g(postReuniao), "clo@mectria.com", { corpo: { dataHora: `${hoje}T15:00`, formato: "online" }, params });
  expect(marcada.status).toBe(201);
  expect(await corpo(marcada)).toMatchObject({ oportunidade: { situacao: "diagnostica_marcada" }, reuniao: { tipo: "diagnostica" } });
  expect((await chamar(g(postReuniao), "clo@mectria.com", { corpo: { dataHora: `${hoje}T16:00`, formato: "online" }, params })).status).toBe(409);
  expect((await chamar(g(postPerdida), "clo@mectria.com", { corpo: { motivo: "Preço" }, params })).status).toBe(409);
  expect((await chamar(g(postPerdida), "clo@mectria.com", { corpo: { motivo: "Preço" }, params: { id: "999" } })).status).toBe(404);
});

test("números do time: só o diretor acessa, o mês padrão é o atual e mês inválido dá 400", async () => {
  expect((await chamar(g(getNumerosDoTime), "clo@mectria.com")).status).toBe(403);
  expect((await chamar(g(getNumerosDoTime), "pro@mectria.com")).status).toBe(403);
  const r = await chamar(g(getNumerosDoTime), "dir@mectria.com");
  expect(r.status).toBe(200);
  expect(await corpo(r)).toMatchObject({ mes: hoje.slice(0, 7), propostas: 0, conversao: null });
  expect(await corpo(await chamar(g(getNumerosDoTime), "dir@mectria.com", { busca: "?mes=2026-10" }))).toMatchObject({ mes: "2026-10" });
  expect((await chamar(g(getNumerosDoTime), "dir@mectria.com", { busca: "?mes=2026-13" })).status).toBe(400);
});

test("exportações e LGPD: só o diretor; CSV e JSON com o nome do arquivo", async () => {
  const id = await propostaEmFollowup("Alfa");
  for (const email of ["clo@mectria.com", "pro@mectria.com", "hun@mectria.com"]) {
    expect((await chamar(g(getExportar), email, { params: { arquivo: "historico.csv" } })).status).toBe(403);
    expect((await chamar(g(postApagar), email, { corpo: {}, params: { id } })).status).toBe(403);
  }
  const csv = await chamar(g(getExportar), "dir@mectria.com", { params: { arquivo: "historico.csv" }, busca: `?mes=${hoje.slice(0, 7)}` });
  expect(csv.status).toBe(200);
  expect(csv.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
  expect(csv.headers.get("Content-Disposition")).toBe(`attachment; filename="historico-${hoje.slice(0, 7)}.csv"`);
  expect(await csv.text()).toContain("Alfa;");
  expect((await chamar(g(getExportar), "dir@mectria.com", { params: { arquivo: "historico.csv" }, busca: "?mes=2026-13" })).status).toBe(400);
  const json = await chamar(g(getExportar), "dir@mectria.com", { params: { arquivo: "tudo.json" } });
  expect(json.headers.get("Content-Disposition")).toBe(`attachment; filename="hub-mectria-${hoje}.json"`);
  expect(Object.keys((await corpo<{ tabelas: object }>(json)).tabelas)).toContain("oportunidades");
  expect((await chamar(g(getExportar), "dir@mectria.com", { params: { arquivo: "outro.txt" } })).status).toBe(404);

  expect((await chamar(g(postApagar), "dir@mectria.com", { corpo: {}, params: { id } })).status).toBe(200);
  expect((await chamar(g(postApagar), "dir@mectria.com", { corpo: {}, params: { id: "999" } })).status).toBe(404);
});
