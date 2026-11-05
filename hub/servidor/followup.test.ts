import { applyD1Migrations, env } from "cloudflare:test";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { listarFollowup, numerosDoMes, registrarProposta, registrarResultado, registrarToque } from "./followup";
import { buscarOportunidade, criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let closer2: Pessoa;
let diretor: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  closer2 = await criar(env.DB, { nome: "Clara Closer", email: "clo2@mectria.com", cargo: "closer" });
  diretor = await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

const proposta = (empresa: string, apresentadaEm: string) => ({
  empresa,
  contato: "Ana",
  servico: "climatizacao",
  valor: 1250000,
  apresentadaEm,
  quemDecide: "Ana (sócia)",
});

test("registrar proposta cria os toques da janela de 7 dias e põe a oportunidade em follow-up", async () => {
  // Reunião numa sexta: sem SEXTA separada; o D7 (20/11, feriado) vai para a segunda, 23/11.
  const { proposta: p, toques } = await registrarProposta(env.DB, proposta("Alfa", "2026-11-13"), closer);
  expect(toques.map((t) => [t.codigo, t.previstoPara, t.feitoEm])).toEqual([
    ["D0", "2026-11-13", null],
    ["D1", "2026-11-16", null],
    ["LIGACAO", "2026-11-17", null],
    ["D7", "2026-11-23", null],
  ]);
  const o = await buscarOportunidade(env.DB, p.oportunidadeId);
  expect(o).toMatchObject({ situacao: "em_followup", closerId: closer.id, origem: "registro manual" });
});

test("proposta de diagnóstica existente usa a oportunidade e o histórico", async () => {
  const { oportunidade } = await criarDiagnostica(
    env.DB,
    { empresa: "Beta", contato: "Bia", telefone: "34999990000", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-05T10:00", formato: "online" },
    closer,
  );
  const { proposta: p } = await registrarProposta(env.DB, { oportunidadeId: oportunidade.id, servico: "nr-12", valor: 800000, apresentadaEm: "2026-11-09", quemDecide: "Bia" }, closer);
  expect(p.oportunidadeId).toBe(oportunidade.id);
  expect((await buscarOportunidade(env.DB, oportunidade.id))?.situacao).toBe("em_followup");
});

test("atrasado, hoje e em dia, na ordem certa", async () => {
  const a = await registrarProposta(env.DB, proposta("A", "2026-11-16"), closer);
  for (const t of a.toques.slice(0, 2)) await registrarToque(env.DB, t.id, { canal: "WhatsApp", resultado: "ok" }, closer);
  await registrarProposta(env.DB, proposta("B", "2026-11-09"), closer);
  await registrarProposta(env.DB, proposta("C", "2026-11-18"), closer);

  const lista = await listarFollowup(env.DB, closer, "2026-11-18");
  expect(lista.map((i) => [i.oportunidade.empresa, i.estado, i.atrasados, i.proximo?.codigo])).toEqual([
    ["B", "atrasado", 5, "D0"],
    ["A", "hoje", 0, "LIGACAO"],
    ["C", "hoje", 0, "D0"],
  ]);
});

test("virada do dia: às 23h30 de São Paulo, o toque de amanhã não está atrasado nem é de hoje", async () => {
  await registrarProposta(env.DB, proposta("Virada", "2026-11-03"), closer);
  const hoje = hojeEmSaoPaulo(new Date("2026-11-03T02:30:00Z"));
  const [item] = await listarFollowup(env.DB, closer, hoje);
  expect(item.estado).toBe("em_dia");
  expect(item.atrasados).toBe(0);
});

test("toque registrado duas vezes: o segundo é recusado e o horário do primeiro fica", async () => {
  const { toques } = await registrarProposta(env.DB, proposta("Duplo", "2026-11-13"), closer);
  const primeiro = await registrarToque(env.DB, toques[0].id, { canal: "WhatsApp", resultado: "Mandei" }, closer);
  await expect(registrarToque(env.DB, toques[0].id, { canal: "Ligação", resultado: "De novo" }, closer)).rejects.toThrow("toque_ja_feito");
  const linha = await env.DB.prepare("SELECT feito_em, canal FROM toques WHERE id = ?").bind(toques[0].id).first();
  expect(linha).toEqual({ feito_em: primeiro.feitoEm, canal: "WhatsApp" });
});

test("proposta encerrada sai do follow-up mesmo com toques vencidos", async () => {
  const { proposta: p } = await registrarProposta(env.DB, proposta("Perdida", "2026-11-09"), closer);
  await registrarResultado(env.DB, p.oportunidadeId, { resultado: "perdida", motivo: "Preço" }, closer);
  expect(await listarFollowup(env.DB, closer, "2026-11-18")).toEqual([]);
});

test("ganha guarda o valor fechado e o histórico", async () => {
  const { proposta: p } = await registrarProposta(env.DB, proposta("Ganha", "2026-11-09"), closer);
  const o = await registrarResultado(env.DB, p.oportunidadeId, { resultado: "ganha", valor: 1250000 }, closer);
  expect(o).toMatchObject({ situacao: "ganha", valorFechado: 1250000 });
  const h = await env.DB.prepare("SELECT de, para FROM historico WHERE oportunidade_id = ? ORDER BY id DESC").bind(p.oportunidadeId).first();
  expect(h).toEqual({ de: "em_followup", para: "ganha" });
});

test("closer vê as dele; diretor vê todas", async () => {
  await registrarProposta(env.DB, proposta("Do Carlos", "2026-11-13"), closer);
  await registrarProposta(env.DB, proposta("Da Clara", "2026-11-13"), closer2);
  expect((await listarFollowup(env.DB, closer, "2026-11-13")).map((i) => i.oportunidade.empresa)).toEqual(["Do Carlos"]);
  expect((await listarFollowup(env.DB, diretor, "2026-11-13")).map((i) => i.oportunidade.empresa).sort()).toEqual(["Da Clara", "Do Carlos"]);
});

test("números do mês: propostas apresentadas e ganhas no mês", async () => {
  await registrarProposta(env.DB, proposta("Outubro", "2026-10-28"), closer);
  const { proposta: p } = await registrarProposta(env.DB, proposta("Novembro", "2026-11-09"), closer);
  await registrarProposta(env.DB, proposta("Da Clara", "2026-11-10"), closer2);
  await registrarResultado(env.DB, p.oportunidadeId, { resultado: "ganha", valor: 900000 }, closer);
  const hoje = hojeEmSaoPaulo();
  const mesAtual = hoje.slice(0, 7);
  // As propostas contam pelo mês de apresentação; as ganhas, pelo mês em que foram registradas (hoje).
  expect(await numerosDoMes(env.DB, closer, "2026-11-20")).toMatchObject({ propostas: 1 });
  expect(await numerosDoMes(env.DB, diretor, "2026-11-20")).toMatchObject({ propostas: 2 });
  expect((await numerosDoMes(env.DB, closer, `${mesAtual}-15`)).ganhas).toBe(1);
});

test("volume: o follow-up do diretor funciona com 120 propostas na rua", async () => {
  for (let i = 0; i < 120; i++) await registrarProposta(env.DB, proposta(`Empresa ${i}`, "2026-11-09"), i % 2 ? closer : closer2);
  expect(await listarFollowup(env.DB, diretor, "2026-11-18")).toHaveLength(120);
});

test("resultado só muda proposta em follow-up e limpa o campo oposto", async () => {
  const { proposta: p } = await registrarProposta(env.DB, proposta("Encerrada", "2026-11-09"), closer);
  await registrarResultado(env.DB, p.oportunidadeId, { resultado: "perdida", motivo: "Preço" }, closer);
  await expect(registrarResultado(env.DB, p.oportunidadeId, { resultado: "ganha", valor: 500 }, closer)).rejects.toThrow("ja_encerrada");
  expect(await buscarOportunidade(env.DB, p.oportunidadeId)).toMatchObject({ situacao: "perdida", motivoPerda: "Preço", valorFechado: null });
});
