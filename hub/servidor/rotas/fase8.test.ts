import { applyD1Migrations, env } from "cloudflare:test";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import type { DadosDoServico, Servico } from "../../compartilhado/servico";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getServico, onRequestPut as putServico } from "../../functions/api/servicos/[id]";
import { onRequestGet as getServicos, onRequestPost as postServico } from "../../functions/api/servicos/index";
import { criar } from "../pessoas";
import type { DadosApi, Env } from "../tipos";

type Manipulador = (contexto: never) => Response | Promise<Response>;
const g = (m: unknown) => m as Manipulador;
const corpo = async <T = Record<string, unknown>>(r: Response) => (await r.json()) as T;

/** Volta os serviços ao estado da migração 0008. */
async function restaurarCarta() {
  await env.DB.exec("DELETE FROM servicos");
  await env.DB.batch(
    servicosDaCarta().map((s, i) =>
      env.DB
        .prepare(
          `INSERT INTO servicos (id, ordem, nome, sigla, resumo, dores, entregamos, fica_com_cliente, ancora_valor, situacao, perguntas)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
        )
        .bind(s.id, i + 1, s.nome, s.sigla, s.resumo, JSON.stringify(s.dores), JSON.stringify(s.entregamos), JSON.stringify(s.ficaComCliente), s.ancoraValor, s.situacao, JSON.stringify(s.perguntas)),
    ),
  );
}

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["pendencias", "anotacoes", "fichas", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  await restaurarCarta();
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
  await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
});

async function chamar(manipulador: Manipulador, email: string, opcoes: { metodo?: string; corpo?: unknown; params?: Record<string, string> } = {}) {
  const metodo = opcoes.metodo ?? (opcoes.corpo === undefined ? "GET" : "POST");
  const request = new Request("http://localhost:8788/api/x", {
    method: metodo,
    headers: { "X-Dev-Email": email, "Content-Type": "application/json" },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
  });
  const ambiente: Env = { ...env, AMBIENTE: "dev" };
  const base = { request, env: ambiente, params: opcoes.params ?? {}, data: {} as DadosApi, functionPath: "/api/x", waitUntil() {}, passThroughOnException() {} };
  const rota = { ...base, next: async () => new Response(null, { status: 404 }) };
  return onRequest({ ...base, next: async () => manipulador(rota as never) } as never);
}

const NOVO: DadosDoServico = {
  nome: "Serviço Novo",
  sigla: "sn",
  resumo: "Um serviço criado pelo diretor.",
  dores: ["Dor um", "Dor dois"],
  entregamos: ["Projeto"],
  ficaComCliente: ["Execução"],
  ancoraValor: "um escritório de engenharia",
  situacao: "ativo",
  perguntas: [{ id: "sn-area", tipo: "curto", texto: "Qual é a área?", bloco: "parametros" }],
  roteiro: null,
};

const dadosDe = (s: Servico): DadosDoServico => {
  const { id: _id, apresentacao: _a, ...dados } = s;
  return dados;
};

test("o hunter lista os serviços, mas não cria nem edita (403)", async () => {
  const lista = await chamar(g(getServicos), "hun@mectria.com");
  expect(lista.status).toBe(200);
  expect(await corpo<Servico[]>(lista)).toHaveLength(12);
  expect((await chamar(g(postServico), "hun@mectria.com", { corpo: NOVO })).status).toBe(403);
  expect((await chamar(g(putServico), "clo@mectria.com", { metodo: "PUT", corpo: NOVO, params: { id: "desenho-tecnico" } })).status).toBe(403);
});

test("o diretor cria Serviço Novo, que vai para o fim da lista, com id servico-novo", async () => {
  const r = await chamar(g(postServico), "dir@mectria.com", { corpo: NOVO });
  expect(r.status).toBe(201);
  expect(await corpo(r)).toMatchObject({ id: "servico-novo", sigla: "SN", apresentacao: null, perguntas: NOVO.perguntas });
  const outro = await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, nome: "Serviço Novo!" } });
  expect(await corpo(outro)).toMatchObject({ id: "servico-novo-2" });
  const lista = await corpo<Servico[]>(await chamar(g(getServicos), "dir@mectria.com"));
  expect(lista.slice(-2).map((s) => s.id)).toEqual(["servico-novo", "servico-novo-2"]);
  const salvo = await env.DB.prepare("SELECT atualizado_por FROM servicos WHERE id = 'servico-novo'").first<{ atualizado_por: string }>();
  expect(salvo?.atualizado_por).toBe("Diana Diretora");
});

test("nome repetido, sem acento ou maiúscula, dá 409", async () => {
  await chamar(g(postServico), "dir@mectria.com", { corpo: NOVO });
  const r = await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, nome: "servico novo" } });
  expect(r.status).toBe(409);
  expect(await corpo(r)).toMatchObject({ mensagem: "Já existe um serviço com esse nome." });
  const dt = servicosDaCarta().find((s) => s.id === "desenho-tecnico")!;
  const renomear = await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dt), nome: "DESENVOLVIMENTO DE PRODUTO" }, params: { id: dt.id } });
  expect(renomear.status).toBe(409);
});

test("o diretor edita a âncora e inativa o serviço", async () => {
  const dt = servicosDaCarta().find((s) => s.id === "desenho-tecnico")!;
  const r = await chamar(g(putServico), "dir@mectria.com", {
    metodo: "PUT",
    corpo: { ...dadosDe(dt), ancoraValor: "um escritório de projetos", situacao: "inativo" },
    params: { id: dt.id },
  });
  expect(r.status).toBe(200);
  expect(await corpo(r)).toMatchObject({ id: "desenho-tecnico", nome: "Desenho Técnico", ancoraValor: "um escritório de projetos", situacao: "inativo" });
  expect(await corpo(await chamar(g(getServico), "hun@mectria.com", { params: { id: dt.id } }))).toMatchObject({ situacao: "inativo" });
});

test("pergunta com o id de uma pergunta da base dá 400", async () => {
  const r = await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, perguntas: [{ id: "c-dor", tipo: "texto", texto: "Qual é a dor?", bloco: "escopo" }] } });
  expect(r.status).toBe(400);
  const repetida = { id: "sn-a", tipo: "curto", texto: "A?", bloco: "escopo" };
  expect((await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, perguntas: [repetida, repetida] } })).status).toBe(400);
});

test("pergunta de opções sem opções dá 400", async () => {
  const semOpcoes = { id: "sn-tipo", tipo: "opcoes", texto: "Qual tipo?", bloco: "escopo" };
  expect((await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, perguntas: [semOpcoes] } })).status).toBe(400);
  const r = await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, perguntas: [{ ...semOpcoes, opcoes: ["A", "B"], inativa: true }] } });
  expect(r.status).toBe(201);
  expect(await corpo(r)).toMatchObject({ perguntas: [{ id: "sn-tipo", opcoes: ["A", "B"], inativa: true }] });
});

test("roteiro com 41 slides ou tempo 0 dá 400", async () => {
  const slide = (i: number, tempo = 2) => ({ id: `s-${i}`, titulo: `Slide ${i}`, fala: "Fala.", pacto: null, tempo });
  const muitos = Array.from({ length: 41 }, (_, i) => slide(i));
  expect((await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, roteiro: muitos } })).status).toBe(400);
  expect((await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, roteiro: [slide(1, 0)] } })).status).toBe(400);
  expect((await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, roteiro: [{ ...slide(1), pacto: "talvez" }] } })).status).toBe(400);
  const ok = await chamar(g(postServico), "dir@mectria.com", { corpo: { ...NOVO, roteiro: [{ ...slide(1), pacto: "valor", dica: "Dica." }] } });
  expect(ok.status).toBe(201);
  expect(await corpo(ok)).toMatchObject({ roteiro: [{ id: "s-1", pacto: "valor", tempo: 2, dica: "Dica." }] });
});

test("GET de um serviço que não existe dá 404", async () => {
  expect((await chamar(g(getServico), "hun@mectria.com", { params: { id: "nao-existe" } })).status).toBe(404);
  expect((await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: NOVO, params: { id: "nao-existe" } })).status).toBe(404);
});
