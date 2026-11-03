import { applyD1Migrations, env } from "cloudflare:test";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestPost as postEncerrar } from "../../functions/api/reunioes/[id]/encerrar";
import { onRequestPost as postIniciar } from "../../functions/api/reunioes/[id]/iniciar";
import { onRequestPut as putAndamento } from "../../functions/api/reunioes/[id]/andamento";
import { onRequestGet as getProposta } from "../../functions/api/reunioes/[id]/proposta";
import { onRequestPut as putVariaveis } from "../../functions/api/reunioes/[id]/variaveis";
import { variaveisIniciais } from "../../compartilhado/proposta";
import { hojeEmSaoPaulo, diasDepois } from "../../compartilhado/datas";
import { encerrarDiagnostica } from "../diagnostica";
import { criarDiagnostica } from "../oportunidades";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;
const g = (m: unknown) => m as Manipulador;
let params: { id: string };
let diagnostica: { id: string };

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["pendencias", "anotacoes", "fichas", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  const closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Clara Closer", email: "clo2@mectria.com", cargo: "closer" });
  const hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  await criar(env.DB, { nome: "Paulo Projetos", email: "pro@mectria.com", cargo: "projetos" });
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Usinagem Alfa", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-13T10:00", formato: "online" },
    hunter,
  );
  diagnostica = { id: String(reuniao.id) };
  await encerrarDiagnostica(env.DB, reuniao.id, { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Bia" }, closer);
  const p = await env.DB.prepare("SELECT id FROM reunioes WHERE tipo = 'proposta'").first<{ id: number }>();
  params = { id: String(p!.id) };
});

async function chamar(manipulador: Manipulador, email: string, opcoes: { metodo?: string; corpo?: unknown } = {}) {
  const metodo = opcoes.metodo ?? (opcoes.corpo === undefined ? "GET" : "POST");
  const request = new Request("http://localhost:8788/api/x", {
    method: metodo,
    headers: { "X-Dev-Email": email, "Content-Type": "application/json" },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
  });
  const ambiente: Env = { ...env, AMBIENTE: "dev" };
  const base = { request, env: ambiente, params, data: {} as DadosApi, functionPath: "/api/x", waitUntil() {}, passThroughOnException() {} };
  const rota = { ...base, next: async () => new Response(null, { status: 404 }) };
  return onRequest({ ...base, next: async () => manipulador(rota as never) } as never);
}
const corpo = async <T = Record<string, unknown>>(r: Response) => (await r.json()) as T;

const amanha = () => diasDepois(hojeEmSaoPaulo(), 1);
const ontem = () => diasDepois(hojeEmSaoPaulo(), -1);

test("o closer dono lê a sessão, salva variáveis e andamento e encerra; de novo dá 409", async () => {
  const sessao = await corpo<{ variaveis: { servico: string }; andamento: { sala: unknown[] } }>(await chamar(g(getProposta), "clo@mectria.com"));
  expect(sessao.variaveis.servico).toBe("climatizacao");
  expect(sessao.andamento.sala).toEqual([{ nome: "Bia", decide: true }, { nome: "Ana", decide: false }]);
  const variaveis = { ...variaveisIniciais("climatizacao"), valor: 1250000, prazo: "45 dias", equipe: "Rui" };
  expect((await chamar(g(putVariaveis), "clo@mectria.com", { metodo: "PUT", corpo: variaveis })).status).toBe(200);
  const andamento = { sala: [{ nome: "Bia", decide: true }], pactos: [{ id: "agenda", minuto: 1 }], tempos: { capa: 30 }, slide: 1 };
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: andamento })).status).toBe(200);
  expect((await chamar(g(postIniciar), "clo@mectria.com", {})).status).toBe(200);
  const fim = await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { desfecho: "decidir", valor: 1250000, dataDecisao: amanha(), quemDecide: "Bia" } });
  expect(fim.status).toBe(200);
  expect(await corpo(fim)).toMatchObject({ reuniao: { situacao: "concluida", desfecho: "decidir" }, propostaId: expect.any(Number) });
  const denovo = await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { desfecho: "ganho", valor: 1250000 } });
  expect(denovo.status).toBe(409);
  expect(await corpo(denovo)).toEqual({ erro: "conflito", mensagem: "Essa reunião já foi encerrada." });
});

test("outro closer e projetos recebem 403; o diretor passa", async () => {
  expect((await chamar(g(getProposta), "clo2@mectria.com")).status).toBe(403);
  expect((await chamar(g(getProposta), "pro@mectria.com")).status).toBe(403);
  expect((await chamar(g(getProposta), "dir@mectria.com")).status).toBe(200);
});

test("dados inválidos dão 400", async () => {
  const variaveis = { ...variaveisIniciais("climatizacao"), servico: "foguete" };
  expect((await chamar(g(putVariaveis), "clo@mectria.com", { metodo: "PUT", corpo: variaveis })).status).toBe(400);
  const andamento = { sala: [], pactos: [{ id: "xyz", minuto: 1 }], tempos: {}, slide: 0 };
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: andamento })).status).toBe(400);
  const r = await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { desfecho: "decidir", valor: 1250000, dataDecisao: ontem(), quemDecide: "Bia" } });
  expect(r.status).toBe(400);
  expect(await corpo(r)).toMatchObject({ mensagem: "A data da decisão não pode ser antes de hoje." });
  expect((await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { desfecho: "perdido", valor: 1, motivo: "Porque sim" } })).status).toBe(400);
});

test("GET da proposta numa diagnóstica dá 400", async () => {
  params = diagnostica;
  const r = await chamar(g(getProposta), "clo@mectria.com");
  expect(r.status).toBe(400);
  expect(await corpo(r)).toEqual({ erro: "invalido", mensagem: "Essa reunião não é uma proposta." });
});
