import { datasDaCadencia } from "../compartilhado/cadencia";
import { applyD1Migrations, env } from "cloudflare:test";
import { servicosDaCarta } from "../compartilhado/dados/servicos-completos";
import { variaveisIniciais } from "../compartilhado/proposta";

const CLIMATIZACAO = servicosDaCarta().find((s) => s.id === "climatizacao")!;
import { encerrarDiagnostica, iniciarReuniao, salvarRespostas } from "./diagnostica";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { listarFollowup, numerosDoMes, registrarProposta } from "./followup";
import { buscarOportunidade, criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import { encerrarProposta, salvarAndamento, salvarVariaveis, sessaoDaProposta } from "./proposta";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let diagnosticaId: number;
let propostaId: number;
let oportunidadeId: number;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["pendencias", "anotacoes", "fichas", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  const { oportunidade, reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Usinagem Alfa", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-13T10:00", formato: "online" },
    closer,
  );
  oportunidadeId = oportunidade.id;
  diagnosticaId = reuniao.id;
  await salvarRespostas(env.DB, diagnosticaId, [{ perguntaId: "c-dor", resposta: "O galpão passa de 38 °C" }], closer);
  await encerrarDiagnostica(env.DB, diagnosticaId, { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Bia" }, closer);
  const p = await env.DB.prepare("SELECT id FROM reunioes WHERE oportunidade_id = ? AND tipo = 'proposta'").bind(oportunidadeId).first<{ id: number }>();
  propostaId = p!.id;
});

test("sessão nova traz as variáveis iniciais do serviço, a sala com quem decide e as respostas da diagnóstica", async () => {
  const s = await sessaoDaProposta(env.DB, propostaId);
  expect(s?.variaveis).toEqual(variaveisIniciais("climatizacao", CLIMATIZACAO));
  expect(s?.andamento).toEqual({ sala: [{ nome: "Bia", decide: true }, { nome: "Ana", decide: false }], pactos: [], tempos: {}, slide: 0 });
  expect(s?.respostasDaDiagnostica["c-dor"]).toBe("O galpão passa de 38 °C");
  expect(s?.anotacoes).toEqual([]);
  expect(s?.reuniao).toMatchObject({ tipo: "proposta", desfecho: null });
});

test("variáveis e andamento gravados voltam na sessão", async () => {
  const variaveis = { ...variaveisIniciais("climatizacao", CLIMATIZACAO), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" };
  const andamento = { sala: [{ nome: "Bia", decide: true }], pactos: [{ id: "agenda" as const, minuto: 2 }], tempos: { capa: 40, abertura: 95 }, slide: 2 };
  await salvarVariaveis(env.DB, propostaId, variaveis);
  await salvarAndamento(env.DB, propostaId, andamento);
  const s = await sessaoDaProposta(env.DB, propostaId);
  expect(s?.variaveis).toEqual(variaveis);
  expect(s?.andamento).toEqual(andamento);
});

test("reunião de proposta inicia só com a oportunidade em proposta_marcada", async () => {
  expect((await iniciarReuniao(env.DB, propostaId)).situacao).toBe("em_andamento");
  await registrarProposta(env.DB, { oportunidadeId, servico: "climatizacao", valor: 900000, apresentadaEm: "2026-11-18", quemDecide: "Bia" }, closer);
  await env.DB.prepare("UPDATE reunioes SET situacao = 'marcada' WHERE id = ?").bind(propostaId).run();
  await expect(iniciarReuniao(env.DB, propostaId)).rejects.toThrow("ja_passou");
});

test("salvarVariaveis recusa reunião de diagnóstica", async () => {
  await expect(salvarVariaveis(env.DB, diagnosticaId, variaveisIniciais("climatizacao", CLIMATIZACAO))).rejects.toThrow("nao_e_proposta");
});

const HOJE = "2026-11-18";
const preparada = { ...variaveisIniciais("climatizacao", CLIMATIZACAO), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" };

async function contar(tabela: string, onde = "1 = 1", ...valores: unknown[]) {
  return (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).bind(...valores).first<{ n: number }>())!.n;
}

test("vai decidir cria a proposta, os toques da janela de 7 dias e põe no follow-up", async () => {
  await salvarVariaveis(env.DB, propostaId, preparada);
  const { reuniao, propostaId: idProposta } = await encerrarProposta(
    env.DB,
    propostaId,
    { desfecho: "decidir", valor: 1250000, dataDecisao: "2026-11-25", quemDecide: "Bia" },
    closer,
    HOJE,
  );
  expect(reuniao).toMatchObject({ situacao: "concluida", desfecho: "decidir" });
  const p = await env.DB.prepare("SELECT * FROM propostas WHERE id = ?").bind(idProposta).first<Record<string, unknown>>();
  expect(p).toMatchObject({ reuniao_id: propostaId, valor: 1250000, apresentada_em: HOJE, data_decisao: "2026-11-25", quem_decide: "Bia", dor: "O galpão passa de 38 °C", prazo: "45 dias", equipe: "Rui e Bia" });
  expect(String(p?.escopo)).toBe(preparada.escopo);
  expect(await contar("toques", "proposta_id = ?", idProposta)).toBe(datasDaCadencia(HOJE).length);
  const fila = await listarFollowup(env.DB, closer, HOJE);
  expect(fila).toHaveLength(1);
  expect(fila[0].proximo).toMatchObject({ codigo: "D0", previstoPara: HOJE });
  const historico = await env.DB.prepare("SELECT de, para FROM historico WHERE oportunidade_id = ? ORDER BY id DESC LIMIT 1").bind(oportunidadeId).first();
  expect(historico).toEqual({ de: "proposta_marcada", para: "em_followup" });
});

test("fechou marca ganha com o valor fechado (separado do apresentado) e não cria toques", async () => {
  const { propostaId: idProposta } = await encerrarProposta(env.DB, propostaId, { desfecho: "ganho", valor: 1250000, valorFechado: 1125000 }, closer, hojeEmSaoPaulo());
  expect(await buscarOportunidade(env.DB, oportunidadeId)).toMatchObject({ situacao: "ganha", valorFechado: 1125000 });
  expect((await env.DB.prepare("SELECT valor FROM propostas WHERE id = ?").bind(idProposta).first<{ valor: number }>())?.valor).toBe(1250000);
  expect(await contar("toques", "proposta_id = ?", idProposta)).toBe(0);
  expect((await numerosDoMes(env.DB, closer, hojeEmSaoPaulo())).ganhas).toBe(1);
});

test("perdeu marca perdida com o motivo", async () => {
  await encerrarProposta(env.DB, propostaId, { desfecho: "perdido", valor: 1250000, motivo: "Preço" }, closer, HOJE);
  expect(await buscarOportunidade(env.DB, oportunidadeId)).toMatchObject({ situacao: "perdida", motivoPerda: "Preço" });
  expect((await sessaoDaProposta(env.DB, propostaId))?.reuniao.desfecho).toBe("perdido");
});

test("encerrar de novo dá ja_encerrada e não duplica proposta nem toques", async () => {
  const f = { desfecho: "decidir" as const, valor: 1250000, dataDecisao: "2026-11-25", quemDecide: "Bia" };
  await encerrarProposta(env.DB, propostaId, f, closer, HOJE);
  await expect(encerrarProposta(env.DB, propostaId, f, closer, HOJE)).rejects.toThrow("ja_encerrada");
  expect(await contar("propostas")).toBe(1);
  expect(await contar("toques")).toBe(datasDaCadencia(HOJE).length);
});

test("proposta registrada à mão antes: encerrar dá ja_passou e nada muda", async () => {
  await registrarProposta(env.DB, { oportunidadeId, servico: "climatizacao", valor: 900000, apresentadaEm: HOJE, quemDecide: "Bia" }, closer);
  await expect(encerrarProposta(env.DB, propostaId, { desfecho: "ganho", valor: 900000, valorFechado: 900000 }, closer, HOJE)).rejects.toThrow("ja_passou");
  expect((await buscarOportunidade(env.DB, oportunidadeId))?.situacao).toBe("em_followup");
  expect(await contar("propostas")).toBe(1);
  expect((await sessaoDaProposta(env.DB, propostaId))?.reuniao.situacao).toBe("marcada");
});

test("encerrar uma diagnóstica como proposta dá nao_e_proposta", async () => {
  await expect(encerrarProposta(env.DB, diagnosticaId, { desfecho: "ganho", valor: 1, valorFechado: 1 }, closer, HOJE)).rejects.toThrow("nao_e_proposta");
});

test("pactos por reunião é a média do mês", async () => {
  const hoje = hojeEmSaoPaulo();
  expect((await numerosDoMes(env.DB, closer, hoje)).pactosPorReuniao).toBeNull();
  const quatro = ["agenda", "dor", "duvida", "cliente"].map((id) => ({ id: id as "agenda", minuto: 1 }));
  await salvarAndamento(env.DB, propostaId, { sala: [], pactos: quatro, tempos: {}, slide: 12 });
  await encerrarProposta(env.DB, propostaId, { desfecho: "ganho", valor: 1, valorFechado: 1 }, closer, hoje);
  // Uma segunda oportunidade, com 2 pactos.
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Metalúrgica Beta", contato: "Rui", telefone: "34999990001", servico: "nr-12", closerId: closer.id, dataHora: "2026-11-13T15:00", formato: "online" },
    closer,
  );
  await encerrarDiagnostica(env.DB, reuniao.id, { resultado: "proposta_marcada", dataHora: "2026-11-19T10:00", formato: "online", quemDecide: "Rui" }, closer);
  const outra = (await env.DB.prepare("SELECT id FROM reunioes WHERE tipo = 'proposta' AND id != ? ORDER BY id DESC").bind(propostaId).first<{ id: number }>())!.id;
  await salvarAndamento(env.DB, outra, { sala: [], pactos: quatro.slice(0, 2), tempos: {}, slide: 12 });
  await encerrarProposta(env.DB, outra, { desfecho: "perdido", valor: 1, motivo: "Preço" }, closer, hoje);
  expect((await numerosDoMes(env.DB, closer, hoje)).pactosPorReuniao).toBe(3);
});

test("andamento de reunião já encerrada é recusado (uma aba velha não reescreve os pactos)", async () => {
  await encerrarProposta(env.DB, propostaId, { desfecho: "ganho", valor: 1, valorFechado: 1 }, closer, HOJE);
  await expect(salvarAndamento(env.DB, propostaId, { sala: [], pactos: [], tempos: {}, slide: 0 })).rejects.toThrow("ja_encerrada");
});
