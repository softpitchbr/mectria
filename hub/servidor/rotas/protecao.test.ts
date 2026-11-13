import { applyD1Migrations, env } from "cloudflare:test";
import { onRequest } from "../../functions/api/_middleware";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.exec("DELETE FROM pessoas");
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

/** Passa pelo middleware como o diretor e diz se a rota seria chamada. */
async function passar(metodo: string, cabecalhos: Record<string, string>, caminho = "/api/pessoas") {
  const request = new Request(`http://localhost:8788${caminho}`, {
    method: metodo,
    headers: { "X-Dev-Email": "dir@mectria.com", ...cabecalhos },
    body: metodo === "GET" ? undefined : '{"nome":"Xx","email":"x@mectria.com","cargo":"diretor","p":"="}',
  });
  let chegou = false;
  const ambiente: Env = { ...env, AMBIENTE: "dev" };
  const contexto = {
    request,
    env: ambiente,
    params: {},
    data: {} as DadosApi,
    functionPath: "/api/pessoas",
    waitUntil() {},
    passThroughOnException() {},
    next: async () => {
      chegou = true;
      return new Response("ok");
    },
  };
  const resposta = await onRequest(contexto as never);
  return { chegou, resposta };
}

test("formulário de outro site (text/plain) não grava nada", async () => {
  const { chegou, resposta } = await passar("POST", { "Content-Type": "text/plain" });
  expect(chegou).toBe(false);
  expect(resposta.status).toBe(403);
  expect(await resposta.json()).toMatchObject({ erro: "sem_permissao" });
});

test("pedido com Origin de outro site é recusado mesmo em JSON", async () => {
  const { chegou } = await passar("POST", { "Content-Type": "application/json", Origin: "https://malicioso.exemplo" });
  expect(chegou).toBe(false);
});

test("pedido marcado como cross-site pelo navegador é recusado", async () => {
  const { chegou } = await passar("PATCH", { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" });
  expect(chegou).toBe(false);
});

test("pedido do próprio hub passa", async () => {
  const { chegou } = await passar("POST", {
    "Content-Type": "application/json; charset=utf-8",
    Origin: "http://localhost:8788",
    "Sec-Fetch-Site": "same-origin",
  });
  expect(chegou).toBe(true);
});

test("leitura (GET) não exige Content-Type", async () => {
  const { chegou } = await passar("GET", {});
  expect(chegou).toBe(true);
});

test("a apresentação em HTML não abre a API dentro do iframe (navegação em quadro), só o próprio arquivo", async () => {
  for (const destino of ["iframe", "frame", "embed", "object"]) {
    const { chegou, resposta } = await passar("GET", { "Sec-Fetch-Dest": destino, "Sec-Fetch-Mode": "navigate" }, "/api/oportunidades");
    expect(chegou).toBe(false);
    expect(resposta.status).toBe(403);
  }
  expect((await passar("GET", { "Sec-Fetch-Dest": "iframe", "Sec-Fetch-Mode": "navigate" }, "/api/servicos/desenho-tecnico/apresentacao")).chegou).toBe(true);
  expect((await passar("GET", { "Sec-Fetch-Dest": "iframe" }, "/api/servicos/desenho-tecnico/apresentacao/outra")).chegou).toBe(false);
  expect((await passar("GET", { "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors" }, "/api/oportunidades")).chegou).toBe(true);
  expect((await passar("GET", { "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate" }, "/api/exportar/historico.csv")).chegou).toBe(true);
  expect((await passar("GET", {}, "/api/oportunidades")).chegou).toBe(true);
});

test("a apresentação da diagnóstica também abre em quadro; o resto da API, não", async () => {
  expect((await passar("GET", { "Sec-Fetch-Dest": "iframe", "Sec-Fetch-Mode": "navigate" }, "/api/apresentacoes/diagnostica")).chegou).toBe(true);
  expect((await passar("GET", { "Sec-Fetch-Dest": "iframe", "Sec-Fetch-Mode": "navigate" }, "/api/apresentacoes")).chegou).toBe(false);
  expect((await passar("GET", { "Sec-Fetch-Dest": "iframe" }, "/api/apresentacoes/diagnostica/outra")).chegou).toBe(false);
});
