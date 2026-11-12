import { applyD1Migrations, env } from "cloudflare:test";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import type { DadosDoServico, Servico } from "../../compartilhado/servico";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getServico, onRequestPut as putServico } from "../../functions/api/servicos/[id]";
import {
  onRequestDelete as deleteApresentacao,
  onRequestGet as getApresentacao,
  onRequestPut as putApresentacao,
} from "../../functions/api/servicos/[id]/apresentacao";
import { onRequestGet as getServicos, onRequestPost as postServico } from "../../functions/api/servicos/index";
import { onRequestGet as getExportar } from "../../functions/api/exportar/[arquivo]";
import { onRequestPost as postOportunidade } from "../../functions/api/oportunidades/index";
import { onRequestPost as postProposta } from "../../functions/api/propostas";
import { onRequestGet as getReuniao } from "../../functions/api/reunioes/[id]";
import { onRequestPut as putAndamento } from "../../functions/api/reunioes/[id]/andamento";
import { onRequestGet as getProposta } from "../../functions/api/reunioes/[id]/proposta";
import { onRequestPut as putVariaveis } from "../../functions/api/reunioes/[id]/variaveis";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { variaveisIniciais, type SessaoProposta } from "../../compartilhado/proposta";
import type { FichaCompleta } from "../../compartilhado/oportunidade";
import { encerrarDiagnostica } from "../diagnostica";
import { criarDiagnostica } from "../oportunidades";
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

// Apresentação em HTML (Task 3) -----------------------------------------------------

const HTML = "<!doctype html><html><body><h1>Proposta</h1><script>parent.postMessage({ mectria: 1, tipo: 'pronta', slides: 1 }, '*')</script></body></html>";
const dp = { id: "desenvolvimento-de-produto" };
const enviar = (email: string, corpoEnviado: unknown, params = dp) => chamar(g(putApresentacao), email, { metodo: "PUT", corpo: corpoEnviado, params });
const ler = (versao: number | string, email = "clo@mectria.com", params = dp) => chamar(g(getApresentacao), email, { params, busca: `?v=${versao}` });
const chavesNoKv = async (id: string) => (await env.APRESENTACOES.list({ prefix: `apresentacao/${id}/` })).keys.map((k) => k.name);

test("o diretor envia a apresentação; o GET devolve o mesmo HTML com o cabeçalho sandbox allow-scripts, sem allow-same-origin", async () => {
  const r = await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML });
  expect(r.status).toBe(200);
  expect(await corpo(r)).toMatchObject({
    id: dp.id,
    apresentacao: { arquivo: "dp.html", bytes: new TextEncoder().encode(HTML).length, versao: 1, enviadaPor: "Diana Diretora" },
  });
  const lida = await ler(1);
  expect(lida.status).toBe(200);
  expect(await lida.text()).toBe(HTML);
  expect(lida.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  const csp = lida.headers.get("Content-Security-Policy") ?? "";
  expect(csp).toMatch(/^sandbox allow-scripts;/);
  expect(csp).not.toContain("allow-same-origin");
  expect(csp).toContain("connect-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");
  expect(lida.headers.get("X-Content-Type-Options")).toBe("nosniff");
});

test("enviar de novo soma a versão (1, 2); remover deixa a apresentação null e o GET dá 404; enviar depois dá versão 3", async () => {
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML });
  expect(await corpo(await enviar("dir@mectria.com", { arquivo: "dp-v2.htm", html: HTML.replace("Proposta", "Proposta 2") }))).toMatchObject({
    apresentacao: { arquivo: "dp-v2.htm", versao: 2 },
  });
  const removida = await chamar(g(deleteApresentacao), "dir@mectria.com", { metodo: "DELETE", params: dp });
  expect(removida.status).toBe(200);
  expect(await corpo(removida)).toMatchObject({ id: dp.id, apresentacao: null });
  expect((await ler(2, "dir@mectria.com")).status).toBe(404);
  expect(await chavesNoKv(dp.id)).toEqual([]);
  expect(await corpo(await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML }))).toMatchObject({ apresentacao: { versao: 3 } });
});

test("arquivo com mais de 5 MB dá 400 com a mensagem", async () => {
  const grande = `<html>${"a".repeat(5 * 1024 * 1024)}</html>`;
  const r = await enviar("dir@mectria.com", { arquivo: "grande.html", html: grande });
  expect(r.status).toBe(400);
  expect(await corpo(r)).toMatchObject({ mensagem: "A apresentação passa de 5 MB. Diminua as imagens e envie de novo." });
});

test("arquivo sem <html dá 400", async () => {
  const semHtml = await enviar("dir@mectria.com", { arquivo: "dp.html", html: "<h1>Oi</h1>" });
  expect(semHtml.status).toBe(400);
  expect(await corpo(semHtml)).toMatchObject({ mensagem: "Envie um arquivo .html." });
  expect((await enviar("dir@mectria.com", { arquivo: "dp.pdf", html: HTML })).status).toBe(400);
  expect((await enviar("dir@mectria.com", { arquivo: "dp.html" })).status).toBe(400);
});

test("o closer lê, mas não envia nem remove (403)", async () => {
  expect((await enviar("clo@mectria.com", { arquivo: "dp.html", html: HTML })).status).toBe(403);
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML });
  expect((await chamar(g(deleteApresentacao), "clo@mectria.com", { metodo: "DELETE", params: dp })).status).toBe(403);
  expect((await ler(1, "hun@mectria.com")).status).toBe(200);
});

test("PUT para serviço que não existe dá 404 e não grava no KV", async () => {
  const r = await enviar("dir@mectria.com", { arquivo: "x.html", html: HTML }, { id: "nao-existe" });
  expect(r.status).toBe(404);
  expect(await chavesNoKv("nao-existe")).toEqual([]);
  expect((await chamar(g(deleteApresentacao), "dir@mectria.com", { metodo: "DELETE", params: { id: "nao-existe" } })).status).toBe(404);
});

// O serviço do banco na proposta, na diagnóstica e no CSV (Task 5) --------------------

/** Uma diagnóstica de Desenho Técnico concluída, com a proposta marcada para o Carlos. */
async function propostaDeDesenhoTecnico() {
  const closer = (await env.DB.prepare("SELECT id, nome, email, cargo, ativo FROM pessoas WHERE email = 'clo@mectria.com'").first<{ id: number }>())!;
  const hunter = (await env.DB.prepare("SELECT id, nome, email, cargo, ativo FROM pessoas WHERE email = 'hun@mectria.com'").first())! as never;
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Traço Fino", contato: "Rui", telefone: "34999990000", servico: "desenho-tecnico", closerId: closer.id, dataHora: "2026-11-13T10:00", formato: "online" },
    hunter,
  );
  await env.DB.prepare("INSERT INTO fichas (reuniao_id, pergunta_id, resposta) VALUES (?1, 'dt-pecas', '40 peças')").bind(reuniao.id).run();
  await encerrarDiagnostica(env.DB, reuniao.id, { resultado: "proposta_marcada", dataHora: "2099-11-18T14:00", formato: "online", quemDecide: "Bia" }, closer as never);
  const p = await env.DB.prepare("SELECT id FROM reunioes WHERE tipo = 'proposta'").first<{ id: number }>();
  return { diagnostica: { id: String(reuniao.id) }, proposta: { id: String(p!.id) } };
}

const dtDaCarta = () => servicosDaCarta().find((s) => s.id === "desenho-tecnico")!;

test("a sessão da proposta traz o serviço do banco; editar a âncora muda o serviço da sessão", async () => {
  const { proposta } = await propostaDeDesenhoTecnico();
  const antes = await corpo<SessaoProposta>(await chamar(g(getProposta), "clo@mectria.com", { params: proposta }));
  expect(antes.servico).toMatchObject({ id: "desenho-tecnico", nome: "Desenho Técnico", apresentacao: null, roteiro: null });
  expect(antes.variaveis.escopo).toContain(dtDaCarta().entregamos[0]);
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), ancoraValor: "um escritório de desenho" }, params: { id: "desenho-tecnico" } });
  const depois = await corpo<SessaoProposta>(await chamar(g(getProposta), "clo@mectria.com", { params: proposta }));
  expect(depois.servico?.ancoraValor).toBe("um escritório de desenho");
});

test("andamento com interações é gravado e volta na sessão", async () => {
  const { proposta } = await propostaDeDesenhoTecnico();
  const interacoes = { dores: ["Desenho desatualizado"], precoEtapa: 2, calculadora: { "horas-paradas": 10 } };
  const andamento = { sala: [{ nome: "Bia", decide: true }], pactos: [], tempos: { capa: 5 }, slide: 3, interacoes };
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: andamento, params: proposta })).status).toBe(200);
  const sessao = await corpo<SessaoProposta>(await chamar(g(getProposta), "clo@mectria.com", { params: proposta }));
  expect(sessao.andamento).toEqual(andamento);
  const ruim = { ...andamento, interacoes: { dores: Array.from({ length: 21 }, (_, i) => `D${i}`), precoEtapa: 0, calculadora: {} } };
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: ruim, params: proposta })).status).toBe(400);
});

test("andamento com id de slide fora do exemplo é aceito; slide 60 dá 400", async () => {
  const { proposta } = await propostaDeDesenhoTecnico();
  const andamento = { sala: [], pactos: [], tempos: { "abertura-dt": 40, "preco-2": 10 }, slide: 59 };
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: andamento, params: proposta })).status).toBe(200);
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: { ...andamento, slide: 60 }, params: proposta })).status).toBe(400);
  expect((await chamar(g(putAndamento), "clo@mectria.com", { metodo: "PUT", corpo: { ...andamento, tempos: { "Slide Um": 1 } }, params: proposta })).status).toBe(400);
});

test("marcar diagnóstica com serviço inativo dá 400; o que não existe também", async () => {
  const closer = await env.DB.prepare("SELECT id FROM pessoas WHERE email = 'clo@mectria.com'").first<{ id: number }>();
  const nova = { empresa: "Inativa", contato: "Ana", telefone: "34999990000", closerId: closer!.id, dataHora: "2099-01-05T10:00", formato: "online" };
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), situacao: "inativo" }, params: { id: "desenho-tecnico" } });
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...nova, servico: "desenho-tecnico" } })).status).toBe(400);
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...nova, servico: "foguete" } })).status).toBe(400);
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...nova, servico: "emissao-de-carbono" } })).status).toBe(201);
  const propostaAMao = { empresa: "À Mão", contato: "Ana", telefone: "34999990000", servico: "desenho-tecnico", valor: "5.000,00", apresentadaEm: hojeEmSaoPaulo(), quemDecide: "Ana" };
  expect((await chamar(g(postProposta), "clo@mectria.com", { corpo: propostaAMao })).status).toBe(400);
});

test("a preparação de uma proposta cujo serviço foi inativado continua salvando", async () => {
  const { proposta } = await propostaDeDesenhoTecnico();
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), situacao: "inativo" }, params: { id: "desenho-tecnico" } });
  const variaveis = { ...variaveisIniciais("desenho-tecnico", dtDaCarta()), valor: 300000, prazo: "20 dias", equipe: "Rui" };
  expect((await chamar(g(putVariaveis), "clo@mectria.com", { metodo: "PUT", corpo: variaveis, params: proposta })).status).toBe(200);
  expect((await chamar(g(putVariaveis), "clo@mectria.com", { metodo: "PUT", corpo: { ...variaveis, servico: "foguete" }, params: proposta })).status).toBe(400);
});

test("a ficha traz as perguntas do serviço, também a inativa", async () => {
  const { diagnostica } = await propostaDeDesenhoTecnico();
  const perguntas = dtDaCarta().perguntas.map((p, i) => (i === 0 ? { ...p, inativa: true } : p));
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), perguntas }, params: { id: "desenho-tecnico" } });
  const ficha = await corpo<FichaCompleta>(await chamar(g(getReuniao), "clo@mectria.com", { params: diagnostica }));
  expect(ficha.perguntasDoServico).toEqual(perguntas);
  const paraProjetos = await corpo<FichaCompleta>(await chamar(g(getReuniao), "dir@mectria.com", { params: diagnostica }));
  expect(paraProjetos.perguntasDoServico[0]).toMatchObject({ id: "dt-pecas", inativa: true });
});

test("o CSV usa o nome do serviço do banco, também para o inativo; o tudo.json traz os serviços", async () => {
  const propostaAMao = { empresa: "Traço Grosso", contato: "Ana", telefone: "34999990000", servico: "desenho-tecnico", valor: "5.000,00", apresentadaEm: hojeEmSaoPaulo(), quemDecide: "Ana" };
  expect((await chamar(g(postProposta), "clo@mectria.com", { corpo: propostaAMao })).status).toBe(201);
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), nome: "Desenho Técnico 2D", situacao: "inativo" }, params: { id: "desenho-tecnico" } });
  const pedido = (arquivo: string) => chamar(g(getExportar), "dir@mectria.com", { params: { arquivo } });
  const csv = await (await pedido("historico.csv")).text();
  expect(csv).toContain("Traço Grosso;Desenho Técnico 2D;");
  const tudo = await corpo<{ tabelas: { servicos: { id: string }[] } }>(await pedido("tudo.json"));
  expect(tudo.tabelas.servicos).toHaveLength(12);
});

test("a proposta de uma oportunidade que já existe aceita o serviço dela, mesmo inativado; outro inativo, não", async () => {
  const closer = await env.DB.prepare("SELECT id FROM pessoas WHERE email = 'clo@mectria.com'").first<{ id: number }>();
  const hunter = (await env.DB.prepare("SELECT id, nome, email, cargo, ativo FROM pessoas WHERE email = 'hun@mectria.com'").first())! as never;
  const { oportunidade } = await criarDiagnostica(
    env.DB,
    { empresa: "Desenho Antigo", contato: "Ana", telefone: "34999990000", servico: "desenho-tecnico", closerId: closer!.id, dataHora: "2099-01-05T10:00", formato: "online" },
    hunter,
  );
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(dtDaCarta()), situacao: "inativo" }, params: { id: "desenho-tecnico" } });
  const nr12 = servicosDaCarta().find((s) => s.id === "nr-12")!;
  await chamar(g(putServico), "dir@mectria.com", { metodo: "PUT", corpo: { ...dadosDe(nr12), situacao: "inativo" }, params: { id: "nr-12" } });
  const corpoDaProposta = { oportunidadeId: oportunidade.id, valor: "5.000,00", apresentadaEm: hojeEmSaoPaulo(), quemDecide: "Ana" };
  expect((await chamar(g(postProposta), "clo@mectria.com", { corpo: { ...corpoDaProposta, servico: "nr-12" } })).status).toBe(400);
  expect((await chamar(g(postProposta), "clo@mectria.com", { corpo: { ...corpoDaProposta, servico: "desenho-tecnico" } })).status).toBe(201);
});

test("cada versão fica na chave dela: depois da v2, a v1 ainda abre no endereço dela; depois da v3, não", async () => {
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML });
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML.replace("Proposta", "Proposta 2") });
  expect(await (await ler(2)).text()).toContain("Proposta 2");
  expect(await (await ler(1)).text()).toBe(HTML);
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML.replace("Proposta", "Proposta 3") });
  expect((await ler(1)).status).toBe(404);
  expect(await (await ler(3)).text()).toContain("Proposta 3");
  expect(await chavesNoKv(dp.id)).toEqual([`apresentacao/${dp.id}/2`, `apresentacao/${dp.id}/3`]);
});

test("GET sem ?v, com ?v inválido ou de uma versão que não existe dá 404 sem cache", async () => {
  await enviar("dir@mectria.com", { arquivo: "dp.html", html: HTML });
  const semVersao = await chamar(g(getApresentacao), "clo@mectria.com", { params: dp });
  expect(semVersao.status).toBe(404);
  expect(semVersao.headers.get("Cache-Control")).toBe("no-store");
  expect((await ler("abc")).status).toBe(404);
  const futura = await ler(9);
  expect(futura.status).toBe(404);
  expect(futura.headers.get("Cache-Control")).toBe("no-store");
});
