import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { registrarConfirmacao } from "./confirmacao";
import { encerrarDiagnostica } from "./diagnostica";
import { criarDiagnostica } from "./oportunidades";
import { reagendarDiagnostica } from "./reagendamento";
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
  // Fase 7: a rotina do hunter vem em blocos; o cold call mostra as conexões da semana (meta 8).
  expect(chaves(dia)).toEqual(["leads-em-conversa", "cold-call"]);
  expect(dia.itens[1]).toMatchObject({ feito: false, automatico: true, contagem: { feitas: 0, meta: 8 } });

  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "nao_atendeu");
  dia = await rotinaDoDia(env.DB, hunter, "2026-11-16");
  expect(dia.itens[1]).toMatchObject({ feito: true, contagem: { feitas: 0, meta: 8 } });
  expect(dia).toMatchObject({ feitos: 1, total: 2 });

  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "atendeu");
  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "marcou");
  expect(await contarLigacoes(env.DB, hunter.id, "2026-11-16")).toEqual({ total: 3, naoAtendeu: 1, atendeu: 1, marcou: 1, meta: 2, conexao: 0, conexoesSemana: 1, metaConexoesSemana: 8 });
  expect(await contarLigacoes(env.DB, hunter.id, "2026-11-17")).toEqual({ total: 0, naoAtendeu: 0, atendeu: 0, marcou: 0, meta: 2, conexao: 0, conexoesSemana: 1, metaConexoesSemana: 8 });
});

test("closer ganha um item por toque do dia, e o toque feito marca o item", async () => {
  const { toques } = await registrarProposta(env.DB, proposta("Alfa", "2026-11-13"), closer);
  let dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(chaves(dia)).toEqual(["fup-negociacao", `toque:${toques[0].id}`, `toque:${toques[1].id}`, "fup-ap-sem-lead", "construir-propostas-sem-lead"]);
  const item = dia.itens.find((i) => i.chave === `toque:${toques[0].id}`)!;
  expect(item).toMatchObject({ titulo: "D0 · WhatsApp · Alfa", automatico: true, feito: false });

  await registrarToque(env.DB, toques[0].id, { canal: "WhatsApp", resultado: "ok" }, closer);
  dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === `toque:${toques[0].id}`)).toMatchObject({ feito: true });
});

test("proposta encerrada não gera item", async () => {
  const { proposta: p } = await registrarProposta(env.DB, proposta("Encerrada", "2026-11-09"), closer);
  expect(chaves(await rotinaDoDia(env.DB, closer, "2026-11-16")).filter((c) => c.startsWith("toque:")).length).toBeGreaterThan(0);
  await registrarResultado(env.DB, p.oportunidadeId, { resultado: "perdida", motivo: "Preço" }, closer);
  expect(chaves(await rotinaDoDia(env.DB, closer, "2026-11-16")).filter((c) => c.startsWith("toque:"))).toEqual([]);
});

test("marcar item manual e recusar automático ou inexistente", async () => {
  const { toques } = await registrarProposta(env.DB, proposta("Gama", "2026-11-16"), closer);
  const dia = await marcarItem(env.DB, closer, "2026-11-16", "fup-negociacao", true);
  expect(dia.itens.find((i) => i.chave === "fup-negociacao")).toMatchObject({ feito: true });
  expect((await marcarItem(env.DB, closer, "2026-11-16", "fup-negociacao", false)).itens[0].feito).toBe(false);
  await expect(marcarItem(env.DB, closer, "2026-11-16", `toque:${toques[0].id}`, true)).rejects.toThrow("item_automatico");
  await expect(marcarItem(env.DB, closer, "2026-11-16", "nao-existe", true)).rejects.toThrow("item_inexistente");
});

test("histórico só com dias úteis, do mais recente para o mais antigo", async () => {
  await rotinaDoDia(env.DB, hunter, "2026-11-17");
  await marcarItem(env.DB, hunter, "2026-11-17", "leads-em-conversa", true);
  expect(await historicoDeRotina(env.DB, hunter.id, "2026-11-18", 5)).toEqual([
    { dia: "2026-11-18", feitos: 0, total: 0 },
    { dia: "2026-11-17", feitos: 1, total: 2 },
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
    // Fase 7: rotina em blocos (closer sem lead: as 3 tarefas feitas sozinhas; hunter: conversa e cold call).
    ["Bruna Closer", 0, 3],
    ["Carlos Closer", 5, 8],
    ["Hugo Hunter", 0, 2],
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

test("volume: closer com 15 propostas inteiras vencidas ainda tem rotina", async () => {
  for (let i = 0; i < 15; i++) await registrarProposta(env.DB, proposta(`Vencida ${i}`, "2026-10-01"), closer);
  const dia = await rotinaDoDia(env.DB, closer, "2026-11-18");
  // Reunião numa quinta (01/10): D0, SEXTA, LIGACAO e D7, 4 toques por proposta.
  expect(dia.itens.filter((i) => i.chave.startsWith("toque:"))).toHaveLength(60);
  const denovo = await rotinaDoDia(env.DB, closer, "2026-11-18");
  expect(denovo.total).toBe(63);
});

test("o link do item de toque abre a proposta", async () => {
  const { proposta: p, toques } = await registrarProposta(env.DB, proposta("Link", "2026-11-13"), closer);
  const dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === `toque:${toques[1].id}`)?.link).toBe(`/follow-up?proposta=${p.id}`);
});

test("o dia de hoje entra no histórico mesmo em feriado", async () => {
  await rotinaDoDia(env.DB, hunter, "2026-11-02");
  await marcarItem(env.DB, hunter, "2026-11-02", "leads-em-conversa", true);
  const h = await historicoDeRotina(env.DB, hunter.id, "2026-11-02", 3);
  expect(h).toEqual([
    { dia: "2026-11-02", feitos: 1, total: 2 },
    { dia: "2026-10-30", feitos: 0, total: 0 },
    { dia: "2026-10-29", feitos: 0, total: 0 },
  ]);
});

test("conexão e marcou contam na semana; atendeu e não atendeu não", async () => {
  await registrarLigacao(env.DB, hunter.id, "2026-11-09", "conexao");
  await registrarLigacao(env.DB, hunter.id, "2026-11-10", "marcou");
  await registrarLigacao(env.DB, hunter.id, "2026-11-11", "atendeu");
  await registrarLigacao(env.DB, hunter.id, "2026-11-11", "nao_atendeu");
  await registrarLigacao(env.DB, hunter.id, "2026-11-06", "conexao");
  const c = await contarLigacoes(env.DB, hunter.id, "2026-11-11");
  expect(c).toMatchObject({ total: 2, conexao: 0, atendeu: 1, naoAtendeu: 1, conexoesSemana: 2, metaConexoesSemana: 8 });
  expect((await contarLigacoes(env.DB, hunter.id, "2026-11-09")).conexao).toBe(1);
});

test("conexão de domingo conta na semana que termina no domingo", async () => {
  await registrarLigacao(env.DB, hunter.id, "2026-11-15", "conexao");
  expect((await contarLigacoes(env.DB, hunter.id, "2026-11-15")).conexoesSemana).toBe(1);
  expect((await contarLigacoes(env.DB, hunter.id, "2026-11-16")).conexoesSemana).toBe(0);
});

test("resumo do time traz as conexões da semana dos hunters", async () => {
  await registrarLigacao(env.DB, hunter.id, "2026-11-10", "conexao");
  await registrarLigacao(env.DB, hunter.id, "2026-11-11", "marcou");
  const resumo = await resumoDoTime(env.DB, "2026-11-11");
  expect(resumo.find((r) => r.pessoa.id === hunter.id)?.conexoesSemana).toBe(2);
  expect(resumo.find((r) => r.pessoa.id === closer.id)?.conexoesSemana).toBeUndefined();
});

const blocos = (dia: { blocos?: { id: string }[] }) => (dia.blocos ?? []).map((b) => b.id);
const doBloco = (dia: { itens: { chave: string; bloco?: string }[] }, bloco: string) => dia.itens.filter((i) => i.bloco === bloco).map((i) => i.chave);

test("rotina do closer em 4 blocos na ordem fechamento, AP, construção, reativação", async () => {
  const dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(blocos(dia)).toEqual(["fechamento", "ap", "construcao", "reativacao"]);
  expect(dia.blocos?.[0]).toMatchObject({ titulo: "Fechamento e negociação" });
  expect(dia.blocos?.[0].orientacao).toContain("senso de urgência");
});

test("bloco sem lead tem a tarefa feita; com lead, a tarefa espera o closer", async () => {
  let dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === "fup-negociacao-sem-lead")).toMatchObject({ feito: true, automatico: true, bloco: "fechamento" });
  expect(dia.itens.find((i) => i.chave === "construir-propostas-sem-lead")).toMatchObject({ feito: true, automatico: true });

  await registrarProposta(env.DB, proposta("Em negociação", "2026-11-13"), closer);
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Em construção", contato: "Bia", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-12T10:00", formato: "online" },
    hunter,
  );
  await encerrarDiagnostica(env.DB, reuniao.id, { resultado: "proposta_marcada", dataHora: "2026-11-20T10:00", formato: "online", quemDecide: "Bia" }, closer);
  dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === "fup-negociacao")).toMatchObject({ feito: false, automatico: false });
  expect(dia.itens.find((i) => i.chave === "construir-propostas")).toMatchObject({ feito: false, automatico: false, bloco: "construcao" });
  expect(dia.itens.find((i) => i.chave === "fup-ap-sem-lead")).toMatchObject({ feito: true, automatico: true, bloco: "ap" });
  expect(chaves(dia)).not.toContain("fup-negociacao-sem-lead");
  expect(doBloco(dia, "fechamento").filter((c) => c.startsWith("toque:")).length).toBeGreaterThan(0);
});

test("as reuniões do dia não entram na rotina do closer", async () => {
  await criarDiagnostica(
    env.DB,
    { empresa: "Beta", contato: "Bia", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-16T14:30", formato: "online" },
    hunter,
  );
  expect(chaves(await rotinaDoDia(env.DB, closer, "2026-11-16")).filter((c) => c.startsWith("reuniao:"))).toEqual([]);
});

test("rotina do hunter em 4 blocos: cold call com as conexões da semana, confirmações e reagendamentos", async () => {
  await registrarLigacao(env.DB, hunter.id, "2026-11-16", "conexao");
  const { reuniao: hoje } = await criarDiagnostica(
    env.DB,
    { empresa: "Confirma", contato: "Ana", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-16T15:00", formato: "online" },
    hunter,
  );
  const faltou = await criarDiagnostica(
    env.DB,
    { empresa: "Faltou", contato: "Ana", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-13T15:00", formato: "online" },
    hunter,
  );
  await encerrarDiagnostica(env.DB, faltou.reuniao.id, { resultado: "nao_compareceu" }, hunter);

  let dia = await rotinaDoDia(env.DB, hunter, "2026-11-16");
  expect(blocos(dia)).toEqual(["conversa", "reagendamentos", "cold-call", "confirmacoes"]);
  expect(dia.itens.find((i) => i.chave === "cold-call")).toMatchObject({ feito: true, automatico: true, contagem: { feitas: 1, meta: 8 } });
  expect(dia.itens.find((i) => i.chave === `confirmar:${hoje.id}`)).toMatchObject({ titulo: "Confirmar a diagnóstica de Confirma às 15:00", feito: false, bloco: "confirmacoes" });
  expect(dia.itens.find((i) => i.chave === `reagendar:${faltou.oportunidade.id}`)).toMatchObject({ titulo: "Reagendar Faltou", feito: false, bloco: "reagendamentos" });

  await registrarConfirmacao(env.DB, hoje.id, { confirmada: true });
  await reagendarDiagnostica(env.DB, faltou.oportunidade.id, { dataHora: "2026-11-18T10:00", formato: "online" }, hunter);
  dia = await rotinaDoDia(env.DB, hunter, "2026-11-16");
  expect(dia.itens.find((i) => i.chave === `confirmar:${hoje.id}`)).toMatchObject({ feito: true });
});

test("o reagendado no dia fica feito na rotina do hunter", async () => {
  const dia = hojeEmSaoPaulo();
  const faltou = await criarDiagnostica(
    env.DB,
    { empresa: "Faltou", contato: "Ana", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: `${dia}T08:00`, formato: "online" },
    hunter,
  );
  await encerrarDiagnostica(env.DB, faltou.reuniao.id, { resultado: "nao_compareceu" }, hunter);
  expect((await rotinaDoDia(env.DB, hunter, dia)).itens.find((i) => i.chave === `reagendar:${faltou.oportunidade.id}`)).toMatchObject({ feito: false });
  await reagendarDiagnostica(env.DB, faltou.oportunidade.id, { dataHora: "2099-01-05T10:00", formato: "online" }, hunter);
  expect((await rotinaDoDia(env.DB, hunter, dia)).itens.find((i) => i.chave === `reagendar:${faltou.oportunidade.id}`)).toMatchObject({ feito: true });
});

test("dia gravado com chaves antigas continua no histórico, e hoje as chaves antigas saem", async () => {
  for (const [dia, chave, feito] of [
    ["2026-11-13", "confirmar-reunioes", "2026-11-13T12:00:00Z"],
    ["2026-11-13", "hipotese-de-dor", null],
    ["2026-11-16", "hipotese-de-dor", null],
  ]) {
    await env.DB.prepare("INSERT INTO rotinas (pessoa_id, dia, chave, titulo, origem, feito_em) VALUES (?, ?, ?, 'Antigo', 'fixo', ?)").bind(closer.id, dia, chave, feito).run();
  }
  const hojeDia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  expect(chaves(hojeDia)).not.toContain("hipotese-de-dor");
  const historico = await historicoDeRotina(env.DB, closer.id, "2026-11-16", 2);
  expect(historico).toEqual([
    { dia: "2026-11-16", feitos: hojeDia.feitos, total: hojeDia.total },
    { dia: "2026-11-13", feitos: 1, total: 2 },
  ]);
});

test("% do dia: feitos sobre o total de todos os blocos", async () => {
  await registrarProposta(env.DB, proposta("Negociação", "2026-11-13"), closer);
  const dia = await rotinaDoDia(env.DB, closer, "2026-11-16");
  const soma = (dia.blocos ?? []).reduce((s, b) => ({ feitos: s.feitos + b.feitos, total: s.total + b.total }), { feitos: 0, total: 0 });
  expect(soma).toEqual({ feitos: dia.feitos, total: dia.total });
});
