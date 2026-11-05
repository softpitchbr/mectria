import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { rotinaDoDia } from "../rotina";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getLigacoes, onRequestPost as postLigacao } from "../../functions/api/ligacoes";
import { onRequestPost as postOportunidade } from "../../functions/api/oportunidades/index";
import { onRequestPost as postConfirmacao } from "../../functions/api/reunioes/[id]/confirmacao";
import { onRequestGet as getReagendamentos } from "../../functions/api/reagendamentos";
import { onRequestPost as postReagendar } from "../../functions/api/oportunidades/[id]/reagendar";
import { onRequestPost as postEncerrar } from "../../functions/api/reunioes/[id]/encerrar";
import { criarDiagnostica } from "../oportunidades";
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

test("o hunter que marcou e o closer dono confirmam; outro hunter recebe 403; corpo inválido dá 400", async () => {
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Alfa", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2099-01-05T10:00", formato: "online" },
    hunter,
  );
  const params = { id: String(reuniao.id) };
  expect((await chamar(g(postConfirmacao), "hun2@mectria.com", { corpo: { fup: 1 }, params })).status).toBe(403);
  expect((await chamar(g(postConfirmacao), "hun@mectria.com", { corpo: { fup: 4 }, params })).status).toBe(400);
  expect(await corpo(await chamar(g(postConfirmacao), "hun@mectria.com", { corpo: { fup: 1 }, params }))).toMatchObject({ fupsConfirmacao: 1 });
  expect((await chamar(g(postConfirmacao), "hun@mectria.com", { corpo: { fup: 3 }, params })).status).toBe(409);
  expect(await corpo(await chamar(g(postConfirmacao), "clo@mectria.com", { corpo: { confirmada: true }, params }))).toHaveProperty("confirmadaEm");
});

test("não compareceu e reagendar pelas rotas; Projetos e outro hunter recebem 403", async () => {
  const { oportunidade, reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Gama", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2099-01-05T10:00", formato: "online" },
    hunter,
  );
  expect((await chamar(g(postEncerrar), "hun@mectria.com", { corpo: { resultado: "nao_compareceu" }, params: { id: String(reuniao.id) } })).status).toBe(200);
  expect((await corpo<{ empresa: string }[]>(await chamar(g(getReagendamentos), "hun@mectria.com"))).map((r) => r.empresa)).toEqual(["Gama"]);
  expect((await chamar(g(getReagendamentos), "pro@mectria.com")).status).toBe(403);
  const params = { id: String(oportunidade.id) };
  expect((await chamar(g(postReagendar), "hun2@mectria.com", { corpo: { dataHora: "2099-01-06T10:00", formato: "online" }, params })).status).toBe(403);
  expect((await chamar(g(postReagendar), "hun@mectria.com", { corpo: { dataHora: "amanhã", formato: "online" }, params })).status).toBe(400);
  expect((await chamar(g(postReagendar), "hun@mectria.com", { corpo: { dataHora: "2099-01-06T10:00", formato: "online" }, params })).status).toBe(201);
  expect((await chamar(g(postReagendar), "hun@mectria.com", { corpo: { dataHora: "2099-01-06T11:00", formato: "online" }, params })).status).toBe(409);
});

test("confirmar a diagnóstica pela rota atualiza a rotina do hunter no dia", async () => {
  const hoje = hojeEmSaoPaulo();
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Rotina", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: `${hoje}T23:00`, formato: "online" },
    hunter,
  );
  await rotinaDoDia(env.DB, hunter, hoje);
  const feitoEm = () =>
    env.DB.prepare("SELECT feito_em FROM rotinas WHERE pessoa_id = ? AND dia = ? AND chave = ?").bind(hunter.id, hoje, `confirmar:${reuniao.id}`).first("feito_em");
  expect(await feitoEm()).toBeNull();
  await chamar(g(postConfirmacao), "hun@mectria.com", { corpo: { confirmada: true }, params: { id: String(reuniao.id) } });
  expect(await feitoEm()).not.toBeNull();
});
