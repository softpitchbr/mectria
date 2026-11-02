import { applyD1Migrations, env } from "cloudflare:test";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet, onRequestPost } from "../../functions/api/pessoas/index";
import { onRequestPatch } from "../../functions/api/pessoas/[id]";
import { buscarPorEmail, criar } from "../pessoas";
import type { DadosApi, Env, Pessoa } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;

let diretor: Pessoa;
let closer: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.exec("DELETE FROM pessoas");
  diretor = await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  closer = await criar(env.DB, { nome: "Carla Closer", email: "clo@mectria.com", cargo: "closer" });
});

async function chamar(manipulador: Manipulador, email: string, corpo?: unknown, params: Record<string, string> = {}) {
  const request = new Request("http://localhost/api/pessoas", {
    method: corpo === undefined ? "GET" : "POST",
    headers: { "X-Dev-Email": email, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const ambiente: Env = { ...env, AMBIENTE: "dev" };
  const data = {} as DadosApi;
  const base = { request, env: ambiente, params, data, functionPath: "/api/pessoas", waitUntil() {}, passThroughOnException() {} };
  const contextoRota = { ...base, next: async () => new Response(null, { status: 404 }) };
  const contextoMiddleware = { ...base, next: async () => manipulador(contextoRota as never) };
  return onRequest(contextoMiddleware as never);
}

const patch = (email: string, id: number, corpo: unknown) => chamar(onRequestPatch as Manipulador, email, corpo, { id: String(id) });

test("closer chamando GET /api/pessoas recebe 403", async () => {
  const r = await chamar(onRequestGet as Manipulador, "clo@mectria.com");
  expect(r.status).toBe(403);
  expect(await r.json()).toMatchObject({ erro: "sem_acesso" });
});

test("closer não cria nem altera pessoas", async () => {
  const novo = await chamar(onRequestPost as Manipulador, "clo@mectria.com", { nome: "X", email: "x@mectria.com", cargo: "hunter" });
  expect(novo.status).toBe(403);
  const mudanca = await patch("clo@mectria.com", closer.id, { cargo: "diretor" });
  expect(mudanca.status).toBe(403);
});

test("diretor lista as pessoas", async () => {
  const r = await chamar(onRequestGet as Manipulador, "dir@mectria.com");
  expect(r.status).toBe(200);
  expect(((await r.json()) as Pessoa[]).map((p) => p.email)).toEqual(["clo@mectria.com", "dir@mectria.com"]);
});

test("diretor cria pessoa com e-mail normalizado e o repetido dá conflito", async () => {
  const r = await chamar(onRequestPost as Manipulador, "dir@mectria.com", { nome: "Rita", email: " Rita@MecTRIA.com ", cargo: "projetos" });
  expect(r.status).toBe(201);
  expect(await r.json()).toMatchObject({ nome: "Rita", email: "rita@mectria.com", cargo: "projetos", ativo: true });

  const repetida = await chamar(onRequestPost as Manipulador, "dir@mectria.com", { nome: "Rita 2", email: "RITA@mectria.com", cargo: "hunter" });
  expect(repetida.status).toBe(409);
  expect(await repetida.json()).toEqual({ erro: "conflito", mensagem: "Já existe uma pessoa com esse e-mail." });
});

test.each([
  [{ nome: "Rita", email: "rita@mectria.com", cargo: "gerente" }],
  [{ nome: "R", email: "rita@mectria.com", cargo: "hunter" }],
  [{ nome: "Rita", email: "rita@", cargo: "hunter" }],
  [{ nome: "Rita", email: "rita @mectria.com", cargo: "hunter" }],
  ["texto solto"],
])("dados inválidos dão 400 invalido: %j", async (corpo) => {
  const r = await chamar(onRequestPost as Manipulador, "dir@mectria.com", corpo);
  expect(r.status).toBe(400);
  expect(await r.json()).toMatchObject({ erro: "invalido" });
});

test("o diretor desativando a si mesmo recebe conflito e continua ativo", async () => {
  const r = await patch("dir@mectria.com", diretor.id, { ativo: false });
  expect(r.status).toBe(409);
  expect(await r.json()).toEqual({ erro: "conflito", mensagem: "Você não pode desativar o seu próprio acesso." });
  expect((await buscarPorEmail(env.DB, "dir@mectria.com"))?.ativo).toBe(true);
});

test("último diretor: A desativa B, depois não pode deixar de ser diretor", async () => {
  const b = await criar(env.DB, { nome: "Bruno Diretor", email: "dirb@mectria.com", cargo: "diretor" });
  const desativar = await patch("dir@mectria.com", b.id, { ativo: false });
  expect(desativar.status).toBe(200);
  expect(await desativar.json()).toMatchObject({ id: b.id, ativo: false });

  const rebaixar = await patch("dir@mectria.com", diretor.id, { cargo: "closer" });
  expect(rebaixar.status).toBe(409);
  expect(await rebaixar.json()).toEqual({ erro: "ultimo_diretor", mensagem: "O time precisa de pelo menos um diretor comercial ativo." });
  expect((await buscarPorEmail(env.DB, "dir@mectria.com"))?.cargo).toBe("diretor");
});

test("com outro diretor ativo, um diretor pode passar para outro cargo", async () => {
  await criar(env.DB, { nome: "Bruno Diretor", email: "dirb@mectria.com", cargo: "diretor" });
  const r = await patch("dir@mectria.com", diretor.id, { cargo: "closer" });
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ cargo: "closer" });
});

test("diretor muda cargo e reativa outra pessoa", async () => {
  await patch("dir@mectria.com", closer.id, { ativo: false });
  const r = await patch("dir@mectria.com", closer.id, { ativo: true, cargo: "hunter", nome: "  Carla Hunter " });
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ nome: "Carla Hunter", cargo: "hunter", ativo: true });
});

test("PATCH com dados inválidos ou vazio dá 400", async () => {
  expect((await patch("dir@mectria.com", closer.id, { ativo: "sim" })).status).toBe(400);
  expect((await patch("dir@mectria.com", closer.id, { cargo: "gerente" })).status).toBe(400);
  expect((await patch("dir@mectria.com", closer.id, {})).status).toBe(400);
});

test("PATCH de id inexistente dá 404", async () => {
  const r = await patch("dir@mectria.com", 999, { ativo: false });
  expect(r.status).toBe(404);
  expect(await r.json()).toMatchObject({ erro: "nao_encontrado" });
  expect((await patch("dir@mectria.com", Number.NaN, { ativo: false })).status).toBe(404);
});
