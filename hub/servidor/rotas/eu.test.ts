import { applyD1Migrations, env } from "cloudflare:test";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet } from "../../functions/api/eu";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.exec("DELETE FROM pessoas");
});

async function chamarEu(cabecalhos: Record<string, string>, extra: Partial<Env> = {}) {
  const request = new Request("http://localhost/api/eu", { headers: cabecalhos });
  const ambiente: Env = { ...env, AMBIENTE: "dev", ...extra };
  const data = {} as DadosApi;
  const base = { request, env: ambiente, params: {}, data, functionPath: "/api/eu", waitUntil() {}, passThroughOnException() {} };
  const contextoEu = { ...base, next: async () => new Response(null, { status: 404 }) };
  const contextoMiddleware = { ...base, next: async () => onRequestGet(contextoEu as never) };
  return onRequest(contextoMiddleware as never);
}

test("sem identidade, 401 sem_identidade", async () => {
  const r = await chamarEu({});
  expect(r.status).toBe(401);
  expect(await r.json()).toMatchObject({ erro: "sem_identidade" });
});

test("e-mail não cadastrado, 403 sem_acesso", async () => {
  const r = await chamarEu({ "X-Dev-Email": "ninguem@mectria.com" });
  expect(r.status).toBe(403);
  expect(await r.json()).toMatchObject({ erro: "sem_acesso" });
});

test("pessoa ativa, 200 com nome, e-mail e cargo", async () => {
  await criar(env.DB, { nome: "Carla Closer", email: "carla@mectria.com", cargo: "closer" });
  const r = await chamarEu({ "X-Dev-Email": " Carla@MecTRIA.com " });
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ nome: "Carla Closer", email: "carla@mectria.com", cargo: "closer" });
});

test("pessoa desativada, 403 sem_acesso", async () => {
  const p = await criar(env.DB, { nome: "Ex", email: "ex@mectria.com", cargo: "hunter" });
  await env.DB.prepare("UPDATE pessoas SET ativo = 0 WHERE id = ?").bind(p.id).run();
  const r = await chamarEu({ "X-Dev-Email": "ex@mectria.com" });
  expect(r.status).toBe(403);
  expect(await r.json()).toMatchObject({ erro: "sem_acesso" });
});

test("DIRETOR_INICIAL com a tabela vazia entra como diretor e fica gravado", async () => {
  const r = await chamarEu({ "X-Dev-Email": "Diretor.Inicial@MecTRIA.com" }, { DIRETOR_INICIAL: "diretor.inicial@mectria.com" });
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ nome: "Diretor Inicial", email: "diretor.inicial@mectria.com", cargo: "diretor" });
  const gravada = await env.DB.prepare("SELECT cargo FROM pessoas WHERE email = 'diretor.inicial@mectria.com'").first();
  expect(gravada).toEqual({ cargo: "diretor" });
});

test("DIRETOR_INICIAL não entra quando já existe diretor ativo", async () => {
  await criar(env.DB, { nome: "Outra Diretora", email: "outra@mectria.com", cargo: "diretor" });
  const r = await chamarEu({ "X-Dev-Email": "diretor.inicial@mectria.com" }, { DIRETOR_INICIAL: "diretor.inicial@mectria.com" });
  expect(r.status).toBe(403);
});
