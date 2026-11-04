import { applyD1Migrations, env } from "cloudflare:test";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getFicha } from "../../functions/api/reunioes/[id]";
import { onRequestPost as postAnotacao } from "../../functions/api/reunioes/[id]/anotacoes";
import { onRequestPost as postBriefing } from "../../functions/api/reunioes/[id]/briefing";
import { onRequestPost as postEncerrar } from "../../functions/api/reunioes/[id]/encerrar";
import { onRequestPost as postIniciar } from "../../functions/api/reunioes/[id]/iniciar";
import { onRequestPut as putRespostas } from "../../functions/api/reunioes/[id]/respostas";
import { registrarProposta } from "../followup";
import { criarDiagnostica } from "../oportunidades";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;
const g = (m: unknown) => m as Manipulador;
let params: { id: string };

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
  params = { id: String(reuniao.id) };
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

test("o closer dono abre, inicia e grava; o hunter que marcou também conduz (fase 6)", async () => {
  expect((await chamar(g(postIniciar), "clo@mectria.com", {})).status).toBe(200);
  expect((await chamar(g(putRespostas), "clo@mectria.com", { metodo: "PUT", corpo: { respostas: [{ perguntaId: "c-dor", resposta: "calor" }] } })).status).toBe(200);
  const ficha = await corpo<{ respostas: Record<string, string>; reuniao: { situacao: string } }>(await chamar(g(getFicha), "clo@mectria.com"));
  expect(ficha).toMatchObject({ respostas: { "c-dor": "calor" }, reuniao: { situacao: "em_andamento" } });

  // Fase 6: a diagnóstica normalmente é do hunter com um projetista; quem marcou lê e grava a ficha.
  const doHunter = await corpo<Record<string, unknown>>(await chamar(g(getFicha), "hun@mectria.com"));
  expect(doHunter.respostas).toEqual({ "c-dor": "calor" });
  expect((await chamar(g(putRespostas), "hun@mectria.com", { metodo: "PUT", corpo: { respostas: [] } })).status).toBe(200);
});

test("outro closer recebe 403; Projetos só lê a ficha da diagnóstica; o diretor passa", async () => {
  expect((await chamar(g(getFicha), "clo2@mectria.com")).status).toBe(403);
  // Fase 6: Projetos lê a ficha e o briefing da diagnóstica, mas não mexe na reunião.
  expect((await chamar(g(getFicha), "pro@mectria.com")).status).toBe(200);
  expect((await chamar(g(postIniciar), "pro@mectria.com", {})).status).toBe(403);
  expect((await chamar(g(postIniciar), "dir@mectria.com", {})).status).toBe(200);
});

test("PUT de respostas repetido não duplica e respeita os limites", async () => {
  const pedido = { metodo: "PUT", corpo: { respostas: [{ perguntaId: "g-resultado", resposta: "26 °C" }] } };
  await chamar(g(putRespostas), "clo@mectria.com", pedido);
  await chamar(g(putRespostas), "clo@mectria.com", pedido);
  const ficha = await corpo<{ respostas: Record<string, string> }>(await chamar(g(getFicha), "clo@mectria.com"));
  expect(Object.keys(ficha.respostas)).toEqual(["g-resultado"]);
  const longa = { metodo: "PUT", corpo: { respostas: [{ perguntaId: "x", resposta: "a".repeat(2001) }] } };
  expect((await chamar(g(putRespostas), "clo@mectria.com", longa)).status).toBe(400);
  const muitas = { metodo: "PUT", corpo: { respostas: Array.from({ length: 201 }, (_, i) => ({ perguntaId: `p${i}`, resposta: "x" })) } };
  expect((await chamar(g(putRespostas), "clo@mectria.com", muitas)).status).toBe(400);
});

test("anotação técnica pela rota vira pendência; marcação inválida dá 400", async () => {
  const nota = { idCliente: "n-1", minuto: 4, passo: "cl-area", marcacao: "tecnico", texto: "Pé-direito de 9 m" };
  expect((await chamar(g(postAnotacao), "clo@mectria.com", { corpo: nota })).status).toBe(200);
  expect((await chamar(g(postAnotacao), "clo@mectria.com", { corpo: { ...nota, idCliente: "n-2", marcacao: "urgente" } })).status).toBe(400);
  const ficha = await corpo<{ pendencias: unknown[] }>(await chamar(g(getFicha), "clo@mectria.com"));
  expect(ficha.pendencias).toHaveLength(1);
});

test("encerrar: sem resultado 400; certo 200; de novo 409", async () => {
  expect((await chamar(g(postEncerrar), "clo@mectria.com", { corpo: {} })).status).toBe(400);
  expect((await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { resultado: "nao_qualificou", motivo: "Porque sim" } })).status).toBe(400);
  const ok = await chamar(g(postEncerrar), "clo@mectria.com", {
    corpo: { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Ana" },
  });
  expect(ok.status).toBe(200);
  const denovo = await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { resultado: "nao_qualificou", motivo: "Outro" } });
  expect(denovo.status).toBe(409);
  expect(await corpo(denovo)).toEqual({ erro: "conflito", mensagem: "Essa reunião já foi encerrada." });
  expect((await chamar(g(postBriefing), "clo@mectria.com", {})).status).toBe(200);
});

test("diagnóstica de oportunidade que já passou dela: iniciar e encerrar dão 409", async () => {
  const closer = (await env.DB.prepare("SELECT * FROM pessoas WHERE email = 'clo@mectria.com'").first())!;
  const op = (await env.DB.prepare("SELECT oportunidade_id FROM reunioes WHERE id = ?").bind(Number(params.id)).first<{ oportunidade_id: number }>())!;
  await registrarProposta(env.DB, { oportunidadeId: op.oportunidade_id, servico: "climatizacao", valor: 900000, apresentadaEm: "2026-11-10", quemDecide: "Ana" }, closer as never);
  const iniciar = await chamar(g(postIniciar), "clo@mectria.com", {});
  expect(iniciar.status).toBe(409);
  expect(await corpo(iniciar)).toEqual({ erro: "conflito", mensagem: "Essa oportunidade já passou da diagnóstica." });
  const encerrar = await chamar(g(postEncerrar), "clo@mectria.com", { corpo: { resultado: "nao_qualificou", motivo: "Outro" } });
  expect(encerrar.status).toBe(409);
  expect(await corpo(encerrar)).toEqual({ erro: "conflito", mensagem: "Essa oportunidade já passou da diagnóstica." });
});
