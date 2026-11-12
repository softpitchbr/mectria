import { applyD1Migrations, env } from "cloudflare:test";
import { urlDaApresentacaoGeral, type ApresentacaoGeral } from "../../compartilhado/servico";
import { onRequest } from "../../functions/api/_middleware";
import {
  onRequestDelete as deleteGeral,
  onRequestGet as getGeral,
  onRequestPut as putGeral,
} from "../../functions/api/apresentacoes/[id]";
import { onRequestGet as getGerais } from "../../functions/api/apresentacoes/index";
import { onRequestPut as putApresentacaoDoServico } from "../../functions/api/servicos/[id]/apresentacao";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;
const g = (m: unknown) => m as Manipulador;
const corpo = async <T = Record<string, unknown>>(r: Response) => (await r.json()) as T;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.exec("DELETE FROM pessoas");
  await env.DB.exec("UPDATE apresentacoes_gerais SET apresentacao = NULL, apresentacao_versao = 0");
  await env.DB.exec("UPDATE servicos SET apresentacao = NULL, apresentacao_versao = 0");
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
});

async function chamar(manipulador: Manipulador, email: string, opcoes: { metodo?: string; corpo?: unknown; params?: Record<string, string>; busca?: string } = {}) {
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

const HTML = "<!doctype html><html><body>Diagnóstica</body></html>";
const diag = { id: "diagnostica" };
const enviar = (email: string, html = HTML, params = diag) => chamar(g(putGeral), email, { metodo: "PUT", corpo: { arquivo: "diagnostica.html", html }, params });

test("o diretor envia a apresentação da diagnóstica; o hunter lê a lista e o HTML com o cabeçalho isolado", async () => {
  expect(await corpo(await chamar(g(getGerais), "hun@mectria.com"))).toEqual([{ id: "diagnostica", apresentacao: null }]);
  const r = await enviar("dir@mectria.com");
  expect(r.status).toBe(200);
  const geral = await corpo<ApresentacaoGeral>(r);
  expect(geral).toMatchObject({ id: "diagnostica", apresentacao: { arquivo: "diagnostica.html", versao: 1, enviadaPor: "Diana Diretora" } });
  expect(urlDaApresentacaoGeral(geral)).toBe("/api/apresentacoes/diagnostica?v=1");
  expect(await corpo(await chamar(g(getGerais), "hun@mectria.com"))).toEqual([geral]);
  const lida = await chamar(g(getGeral), "hun@mectria.com", { params: diag, busca: "?v=1" });
  expect(lida.status).toBe(200);
  expect(await lida.text()).toBe(HTML);
  expect(lida.headers.get("Content-Security-Policy")).toMatch(/^sandbox allow-scripts;/);
  const removida = await chamar(g(deleteGeral), "dir@mectria.com", { metodo: "DELETE", params: diag });
  expect(await corpo(removida)).toEqual({ id: "diagnostica", apresentacao: null });
  expect((await chamar(g(getGeral), "hun@mectria.com", { params: diag, busca: "?v=1" })).status).toBe(404);
});

test("a versão da diagnóstica fica na chave dela e não mistura com a de um serviço", async () => {
  await enviar("dir@mectria.com");
  await chamar(g(putApresentacaoDoServico), "dir@mectria.com", { metodo: "PUT", corpo: { arquivo: "dp.html", html: HTML.replace("Diagnóstica", "Proposta") }, params: { id: "desenvolvimento-de-produto" } });
  expect((await env.APRESENTACOES.list({ prefix: "geral/diagnostica/" })).keys.map((k) => k.name)).toEqual(["geral/diagnostica/1"]);
  expect(await (await chamar(g(getGeral), "clo@mectria.com", { params: diag, busca: "?v=1" })).text()).toContain("Diagnóstica");
});

test("o closer não envia nem remove (403)", async () => {
  expect((await enviar("clo@mectria.com")).status).toBe(403);
  expect((await chamar(g(deleteGeral), "hun@mectria.com", { metodo: "DELETE", params: diag })).status).toBe(403);
});

test("id que não é diagnostica dá 404", async () => {
  expect((await enviar("dir@mectria.com", HTML, { id: "portfolio" })).status).toBe(404);
  expect((await chamar(g(getGeral), "clo@mectria.com", { params: { id: "portfolio" }, busca: "?v=1" })).status).toBe(404);
  expect((await env.APRESENTACOES.list({ prefix: "geral/portfolio/" })).keys).toEqual([]);
});
