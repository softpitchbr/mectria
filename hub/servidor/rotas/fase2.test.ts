import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestGet as getCloser } from "../../functions/api/closers";
import { onRequestGet as getFollowup } from "../../functions/api/followup";
import { onRequestGet as getLigacoes, onRequestPost as postLigacao } from "../../functions/api/ligacoes";
import { onRequestGet as getNumeros } from "../../functions/api/numeros/mes";
import { onRequestPatch as patchOportunidade } from "../../functions/api/oportunidades/[id]";
import { onRequestPost as postResultado } from "../../functions/api/oportunidades/[id]/resultado";
import { onRequestGet as getOportunidades, onRequestPost as postOportunidade } from "../../functions/api/oportunidades/index";
import { onRequestPost as postProposta } from "../../functions/api/propostas";
import { onRequestGet as getReunioes } from "../../functions/api/reunioes/index";
import { onRequestPut as putItem } from "../../functions/api/rotina/[chave]";
import { onRequestGet as getHistorico } from "../../functions/api/rotina/historico";
import { onRequestGet as getRotina } from "../../functions/api/rotina/index";
import { onRequestGet as getResumo } from "../../functions/api/time/resumo";
import { onRequestPatch as patchToque } from "../../functions/api/toques/[id]";
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

const novaDiagnostica = (empresa: string) => ({
  empresa,
  contato: "Ana Souza",
  telefone: "(34) 99999-0000",
  servico: "climatizacao",
  closerId: closer.id,
  dataHora: `${hoje}T15:00`,
  formato: "online",
});

const novaProposta = (empresa: string, valor = "12.500,00") => ({
  empresa,
  contato: "Ana",
  servico: "climatizacao",
  valor,
  apresentadaEm: hoje,
  quemDecide: "Ana (sócia)",
});

test("projetos recebe 403 sem_permissao em follow-up, rotina e oportunidades", async () => {
  for (const m of [getFollowup, getRotina, getOportunidades, getReunioes]) {
    const r = await chamar(g(m), "pro@mectria.com");
    expect(r.status).toBe(403);
    expect(await corpo(r)).toMatchObject({ erro: "sem_permissao" });
  }
});

test("hunter cria diagnóstica, vê só a dele, e não registra proposta", async () => {
  const criada = await chamar(g(postOportunidade), "hun@mectria.com", { corpo: novaDiagnostica("Alfa") });
  expect(criada.status).toBe(201);
  expect(await corpo(criada)).toMatchObject({ oportunidade: { empresa: "Alfa", situacao: "diagnostica_marcada" }, reuniao: { tipo: "diagnostica" } });
  await chamar(g(postOportunidade), "clo@mectria.com", { corpo: novaDiagnostica("Do closer") });

  const lista = await corpo<{ empresa: string }[]>(await chamar(g(getOportunidades), "hun@mectria.com"));
  expect(lista.map((o) => o.empresa)).toEqual(["Alfa"]);
  const reunioes = await corpo<{ empresa: string }[]>(await chamar(g(getReunioes), "hun@mectria.com"));
  expect(reunioes.map((r) => r.empresa)).toEqual(["Alfa"]);

  expect((await chamar(g(postProposta), "hun@mectria.com", { corpo: novaProposta("Alfa") })).status).toBe(403);
});

test("diagnóstica com closer que não é closer ativo ou com serviço desconhecido dá 400", async () => {
  const hugo = await env.DB.prepare("SELECT id FROM pessoas WHERE email = 'hun@mectria.com'").first<{ id: number }>();
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...novaDiagnostica("X"), closerId: hugo!.id } })).status).toBe(400);
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...novaDiagnostica("X"), servico: "solda" } })).status).toBe(400);
  expect((await chamar(g(postOportunidade), "hun@mectria.com", { corpo: { ...novaDiagnostica("X"), dataHora: "amanhã" } })).status).toBe(400);
});

test("closer registra proposta com valor brasileiro e recebe 7 toques", async () => {
  const r = await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Beta") });
  expect(r.status).toBe(201);
  const { proposta, toques } = await corpo<{ proposta: { valor: number }; toques: unknown[] }>(r);
  expect(proposta.valor).toBe(1250000);
  expect(toques).toHaveLength(7);
});

test("valor que não é dinheiro, ou apresentação no futuro, dá 400", async () => {
  for (const valor of ["abc", "-10", "0"]) {
    const r = await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Gama", valor) });
    expect(r.status).toBe(400);
    expect(await corpo(r)).toMatchObject({ erro: "invalido" });
  }
  const futuro = await chamar(g(postProposta), "clo@mectria.com", { corpo: { ...novaProposta("Gama"), apresentadaEm: "2099-01-02" } });
  expect(futuro.status).toBe(400);
});

test("closer não registra toque de proposta de outro closer até assumir", async () => {
  const r = await chamar(g(postProposta), "clo2@mectria.com", { corpo: novaProposta("Da Clara") });
  const { proposta, toques } = await corpo<{ proposta: { oportunidadeId: number }; toques: { id: number }[] }>(r);
  const toque = { metodo: "PATCH", corpo: { canal: "WhatsApp", resultado: "Mandei a proposta" }, params: { id: String(toques[0].id) } };

  expect((await chamar(g(patchToque), "clo@mectria.com", toque)).status).toBe(403);
  const assumida = await chamar(g(patchOportunidade), "clo@mectria.com", {
    metodo: "PATCH",
    corpo: { assumir: true },
    params: { id: String(proposta.oportunidadeId) },
  });
  expect(assumida.status).toBe(200);
  expect(await corpo(assumida)).toMatchObject({ closerId: closer.id });
  expect((await chamar(g(patchToque), "clo@mectria.com", toque)).status).toBe(200);
});

test("toque registrado duas vezes dá 409 conflito", async () => {
  const { toques } = await corpo<{ toques: { id: number }[] }>(await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Delta") }));
  const toque = { metodo: "PATCH", corpo: { canal: "Ligação", resultado: "Falou que decide sexta" }, params: { id: String(toques[0].id) } };
  expect((await chamar(g(patchToque), "clo@mectria.com", toque)).status).toBe(200);
  const segunda = await chamar(g(patchToque), "clo@mectria.com", toque);
  expect(segunda.status).toBe(409);
  expect(await corpo(segunda)).toEqual({ erro: "conflito", mensagem: "Esse toque já foi registrado." });
  expect((await chamar(g(patchToque), "clo@mectria.com", { ...toque, params: { id: "99999" } })).status).toBe(404);
});

test("rotina: PUT de item automático dá 409; de item manual, devolve o dia com o item feito", async () => {
  const { toques } = await corpo<{ toques: { id: number }[] }>(await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Épsilon") }));
  const auto = await chamar(g(putItem), "clo@mectria.com", { metodo: "PUT", corpo: { feito: true }, params: { chave: `toque:${toques[0].id}` } });
  expect(auto.status).toBe(409);
  expect(await corpo(auto)).toEqual({ erro: "conflito", mensagem: "Esse item se marca sozinho." });

  const manual = await chamar(g(putItem), "clo@mectria.com", { metodo: "PUT", corpo: { feito: true }, params: { chave: "confirmar-reunioes" } });
  expect(manual.status).toBe(200);
  const dia = await corpo<{ itens: { chave: string; feito: boolean }[] }>(manual);
  expect(dia.itens.find((i) => i.chave === "confirmar-reunioes")?.feito).toBe(true);

  expect((await chamar(g(putItem), "clo@mectria.com", { metodo: "PUT", corpo: { feito: true }, params: { chave: "nao-existe" } })).status).toBe(404);
  expect((await chamar(g(getHistorico), "clo@mectria.com")).status).toBe(200);
});

test("hunter conta ligações; closer não", async () => {
  const r = await chamar(g(postLigacao), "hun@mectria.com", { corpo: { resultado: "nao_atendeu" } });
  expect(await corpo(r)).toMatchObject({ total: 1, naoAtendeu: 1, meta: 2 });
  expect(await corpo(await chamar(g(getLigacoes), "hun@mectria.com"))).toMatchObject({ total: 1 });
  expect((await chamar(g(postLigacao), "hun@mectria.com", { corpo: { resultado: "talvez" } })).status).toBe(400);
  expect((await chamar(g(postLigacao), "clo@mectria.com", { corpo: { resultado: "atendeu" } })).status).toBe(403);
});

test("resumo do time é só do diretor", async () => {
  expect((await chamar(g(getResumo), "clo@mectria.com")).status).toBe(403);
  const r = await chamar(g(getResumo), "dir@mectria.com");
  expect(r.status).toBe(200);
  const resumo = await corpo<{ pessoas: { pessoa: { nome: string } }[]; reunioesDaSemana: unknown[] }>(r);
  expect(resumo.pessoas.map((p) => p.pessoa.nome)).toEqual(["Carlos Closer", "Clara Closer", "Hugo Hunter"]);
  expect(resumo.reunioesDaSemana).toEqual([]);
});

test("resultado: perdida sem motivo dá 400; com Preço, 200 e situação perdida", async () => {
  const { proposta } = await corpo<{ proposta: { oportunidadeId: number } }>(await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Zeta") }));
  const params = { id: String(proposta.oportunidadeId) };
  expect((await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "perdida" }, params })).status).toBe(400);
  expect((await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "ganha" }, params })).status).toBe(400);
  expect((await chamar(g(postResultado), "clo2@mectria.com", { corpo: { resultado: "perdida", motivo: "Preço" }, params })).status).toBe(403);
  const r = await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "perdida", motivo: "Preço" }, params });
  expect(r.status).toBe(200);
  expect(await corpo(r)).toMatchObject({ situacao: "perdida", motivoPerda: "Preço" });
});

test("closers da lista e números do mês", async () => {
  const closers = await corpo<{ nome: string }[]>(await chamar(g(getCloser), "hun@mectria.com"));
  expect(closers.map((c) => c.nome)).toEqual(["Carlos Closer", "Clara Closer", "Diana Diretora"]);
  await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Eta") });
  expect(await corpo(await chamar(g(getNumeros), "clo@mectria.com"))).toEqual({ propostas: 1, ganhas: 0, pactosPorReuniao: null });
  expect((await chamar(g(getNumeros), "hun@mectria.com")).status).toBe(403);
});

test("histórico conta o toque e a ligação feitos depois de abrir a rotina", async () => {
  await chamar(g(getRotina), "clo@mectria.com");
  const { toques } = await corpo<{ toques: { id: number }[] }>(await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Teta") }));
  await chamar(g(getRotina), "clo@mectria.com");
  await chamar(g(patchToque), "clo@mectria.com", { metodo: "PATCH", corpo: { canal: "WhatsApp", resultado: "ok" }, params: { id: String(toques[0].id) } });
  const [hojeC] = await corpo<{ feitos: number }[]>(await chamar(g(getHistorico), "clo@mectria.com"));
  expect(hojeC.feitos).toBe(1);

  await chamar(g(getRotina), "hun@mectria.com");
  await chamar(g(postLigacao), "hun@mectria.com", { corpo: { resultado: "atendeu" } });
  const [hojeH] = await corpo<{ feitos: number }[]>(await chamar(g(getHistorico), "hun@mectria.com"));
  expect(hojeH.feitos).toBe(1);
});

test("resultado de proposta já encerrada dá 409; assumir oportunidade encerrada também", async () => {
  const { proposta } = await corpo<{ proposta: { oportunidadeId: number } }>(await chamar(g(postProposta), "clo@mectria.com", { corpo: novaProposta("Iota") }));
  const params = { id: String(proposta.oportunidadeId) };
  await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "perdida", motivo: "Preço" }, params });
  const segunda = await chamar(g(postResultado), "clo@mectria.com", { corpo: { resultado: "ganha", valor: "5,00" }, params });
  expect(segunda.status).toBe(409);
  expect(await corpo(segunda)).toEqual({ erro: "conflito", mensagem: "Essa proposta já foi encerrada." });
  const assumir = await chamar(g(patchOportunidade), "clo2@mectria.com", { metodo: "PATCH", corpo: { assumir: true }, params });
  expect(assumir.status).toBe(409);
});

test("projetos não lista closers", async () => {
  expect((await chamar(g(getCloser), "pro@mectria.com")).status).toBe(403);
});
