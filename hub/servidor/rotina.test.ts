import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { criarDiagnostica } from "./oportunidades";
import { registrarProposta, registrarResultado, registrarToque } from "./followup";
import { contarLigacoes, historicoDeRotina, marcarItem, registrarLigacao, resumoDoTime, rotinaDoDia } from "./rotina";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let hunter: Pessoa;
let closer: Pessoa;
let closer2: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  closer2 = await criar(env.DB, { nome: "Bruna Closer", email: "clo2@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

const proposta = (empresa: string, apresentadaEm: string) => ({
  empresa,
  servico: "climatizacao",
  valor: 1000000,
  apresentadaEm,
  quemDecide: "Sócio",
});

const chaves = (dia: { itens: { chave: string }[] }) => dia.itens.map((i) => i.chave);

test("rotina fixa do hunter e contador de ligações", async () => {
  let dia = await rotinaDoDia(env.DB, hunter, "2026-11-16");
  expect(chaves(dia)).toEqual(["ligacoes", "whatsapp-tentativas", "registrar-diagnosticas"]);
  expect(dia.itens[0]).toMatchObject({ feito: false, automatico: true, contagem: { feitas: 0, meta: 2 } });

  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "nao_atendeu");
  dia = await rotinaDoDia(env.DB, hunter, "2026-11-16");
  expect(dia.itens[0]).toMatchObject({ feito: true, contagem: { feitas: 1, meta: 2 } });
  expect(dia).toMatchObject({ feitos: 1, total: 3 });

  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "atendeu");
  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "marcou");
  expect(await contarLigacoes(env.DB, hunter.id, "2026-11-16")).toEqual({ total: 3, naoAtendeu: 1, atendeu: 1, marcou: 1, meta: 2 });
  expect(await contarLigacoes(env.DB, hunter.id, "2026-11-17")).toEqual({ total: 0, naoAtendeu: 0, atendeu: 0, marcou: 0, meta: 2 });
});

test("closer ganha um item por toque do dia, e o toque feito marca o item", async () => {
  const { toques } = await registrarProposta(env.DB, proposta("Alfa", "2026-11-13"), closer);
  let dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(chaves(dia)).toEqual([
    "confirmar-reunioes",
    "hipotese-de-dor",
    "briefings",
    "resultado-reunioes",
    `toque:${toques[0].id}`,
    `toque:${toques[1].id}`,
  ]);
  const item = dia.itens.find((i) => i.chave === `toque:${toques[0].id}`)!;
  expect(item).toMatchObject({ titulo: "D0 · WhatsApp + e-mail · Alfa", automatico: true, feito: false, link: `/follow-up?toque=${toques[0].id}` });

  await registrarToque(env.DB, toques[0].id, { canal: "WhatsApp", resultado: "ok" }, closer);
  dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === `toque:${toques[0].id}`)).toMatchObject({ feito: true });
});

test("reunião do dia vira item de confirmar", async () => {
  await criarDiagnostica(
    env.DB,
    { empresa: "Beta", contato: "Bia", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-16T14:30", formato: "online" },
    hunter,
  );
  const dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  const item = dia.itens.find((i) => i.chave.startsWith("reuniao:"))!;
  expect(item).toMatchObject({ titulo: "Confirmar a diagnóstica com Beta às 14:30", automatico: false, origem: "gerado" });
});

test("proposta encerrada não gera item", async () => {
  const { proposta: p } = await registrarProposta(env.DB, proposta("Encerrada", "2026-11-09"), closer);
  expect(chaves(await rotinaDoDia(env.DB, closer, "2026-11-16")).filter((c) => c.startsWith("toque:")).length).toBeGreaterThan(0);
  await registrarResultado(env.DB, p.oportunidadeId, { resultado: "perdida", motivo: "Preço" }, closer);
  expect(chaves(await rotinaDoDia(env.DB, closer, "2026-11-16")).filter((c) => c.startsWith("toque:"))).toEqual([]);
});

test("marcar item manual e recusar automático ou inexistente", async () => {
  const { toques } = await registrarProposta(env.DB, proposta("Gama", "2026-11-16"), closer);
  const dia = await marcarItem(env.DB, closer, "2026-11-16", "confirmar-reunioes", true);
  expect(dia.itens.find((i) => i.chave === "confirmar-reunioes")).toMatchObject({ feito: true });
  expect((await marcarItem(env.DB, closer, "2026-11-16", "confirmar-reunioes", false)).itens[0].feito).toBe(false);
  await expect(marcarItem(env.DB, closer, "2026-11-16", `toque:${toques[0].id}`, true)).rejects.toThrow("item_automatico");
  await expect(marcarItem(env.DB, closer, "2026-11-16", "nao-existe", true)).rejects.toThrow("item_inexistente");
});

test("histórico só com dias úteis, do mais recente para o mais antigo", async () => {
  await rotinaDoDia(env.DB, hunter, "2026-11-17");
  await marcarItem(env.DB, hunter, "2026-11-17", "whatsapp-tentativas", true);
  expect(await historicoDeRotina(env.DB, hunter.id, "2026-11-18", 5)).toEqual([
    { dia: "2026-11-18", feitos: 0, total: 0 },
    { dia: "2026-11-17", feitos: 1, total: 3 },
    { dia: "2026-11-16", feitos: 0, total: 0 },
    { dia: "2026-11-13", feitos: 0, total: 0 },
    { dia: "2026-11-12", feitos: 0, total: 0 },
  ]);
});

test("resumo do time: hunters e closers ativos, atrasados só de propostas em follow-up", async () => {
  await registrarProposta(env.DB, proposta("Atrasada", "2026-11-09"), closer);
  const { proposta: encerrada } = await registrarProposta(env.DB, proposta("Encerrada", "2026-11-09"), closer2);
  await registrarResultado(env.DB, encerrada.oportunidadeId, { resultado: "nutricao" }, closer2);

  const resumo = await resumoDoTime(env.DB, "2026-11-18");
  expect(resumo.map((r) => [r.pessoa.nome, r.atrasados, r.rotina.total])).toEqual([
    ["Bruna Closer", 0, 4],
    ["Carlos Closer", 4, 8],
    ["Hugo Hunter", 0, 3],
  ]);
  // O resumo não grava a rotina de ninguém: o histórico continua "não abriu".
  expect((await historicoDeRotina(env.DB, closer.id, "2026-11-18", 1))[0]).toEqual({ dia: "2026-11-18", feitos: 0, total: 0 });
});

test("toque feito hoje antes de abrir a rotina aparece como feito", async () => {
  const hoje = hojeEmSaoPaulo();
  const { toques } = await registrarProposta(env.DB, proposta("Antes", hoje), closer);
  await registrarToque(env.DB, toques[0].id, { canal: "WhatsApp", resultado: "Mandei" }, closer);
  const dia = await rotinaDoDia(env.DB, closer, hoje);
  expect(dia.itens.find((i) => i.chave === `toque:${toques[0].id}`)).toMatchObject({ feito: true });
});
