import { applyD1Migrations, env } from "cloudflare:test";
import { encerrarDiagnostica, fichaDaReuniao, iniciarReuniao, marcarBriefingEnviado, salvarAnotacao, salvarRespostas } from "./diagnostica";
import { listarFollowup, registrarProposta } from "./followup";
import { buscarOportunidade, criarDiagnostica, listarReunioes } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let reuniaoId: number;
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
  reuniaoId = reuniao.id;
  oportunidadeId = oportunidade.id;
});

test("iniciar muda para em andamento uma vez só", async () => {
  const a = await iniciarReuniao(env.DB, reuniaoId);
  const b = await iniciarReuniao(env.DB, reuniaoId);
  expect(a.situacao).toBe("em_andamento");
  expect(b.iniciadaEm).toBe(a.iniciadaEm);
});

test("respostas: a última alteração de cada pergunta vale, e as outras ficam", async () => {
  await salvarRespostas(env.DB, reuniaoId, [{ perguntaId: "c-dor", resposta: "calor" }], closer);
  await salvarRespostas(env.DB, reuniaoId, [{ perguntaId: "g-resultado", resposta: "26 °C" }], closer);
  await salvarRespostas(env.DB, reuniaoId, [{ perguntaId: "c-dor", resposta: "calor de 38 °C à tarde" }], closer);
  const ficha = await fichaDaReuniao(env.DB, reuniaoId);
  expect(ficha?.respostas).toEqual({ "c-dor": "calor de 38 °C à tarde", "g-resultado": "26 °C" });
});

test("anotação repetida (mesmo idCliente) não duplica", async () => {
  const a = { idCliente: "n-1", minuto: 3, passo: "c-dor", marcacao: "objecao" as const, texto: "Já tentou um orçamento caro" };
  await salvarAnotacao(env.DB, reuniaoId, a, closer, "2026-11-13");
  await salvarAnotacao(env.DB, reuniaoId, a, closer, "2026-11-13");
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.anotacoes).toHaveLength(1);
});

test("anotação técnica cria pendência com prazo no próximo dia útil", async () => {
  await salvarAnotacao(env.DB, reuniaoId, { idCliente: "n-2", minuto: 18, passo: "cl-area", marcacao: "tecnico", texto: "Pé-direito de 9 m" }, closer, "2026-11-13");
  const ficha = await fichaDaReuniao(env.DB, reuniaoId);
  expect(ficha?.pendencias).toEqual([expect.objectContaining({ texto: "Pé-direito de 9 m", prazo: "2026-11-16", situacao: "aberta", oportunidadeId })]);
});

test("encerrar com proposta marcada cria a reunião de proposta e muda a situação", async () => {
  await encerrarDiagnostica(env.DB, reuniaoId, { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "presencial", quemDecide: "Ana e o sócio" }, closer);
  const ficha = await fichaDaReuniao(env.DB, reuniaoId);
  expect(ficha?.reuniao).toMatchObject({ situacao: "concluida", resultado: "proposta_marcada" });
  expect((await buscarOportunidade(env.DB, oportunidadeId))?.situacao).toBe("proposta_marcada");
  const proposta = (await listarReunioes(env.DB, "2026-11-18", "2026-11-18")).find((r) => r.tipo === "proposta");
  expect(proposta).toMatchObject({ dataHora: "2026-11-18T14:00", formato: "presencial", quemDecide: "Ana e o sócio" });
  await expect(encerrarDiagnostica(env.DB, reuniaoId, { resultado: "nao_qualificou", motivo: "Outro" }, closer)).rejects.toThrow("ja_encerrada");
});

test("não qualificou vai para nutrição com o motivo", async () => {
  await encerrarDiagnostica(env.DB, reuniaoId, { resultado: "nao_qualificou", motivo: "Sem orçamento" }, closer);
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.reuniao).toMatchObject({ resultado: "nao_qualificou", motivo: "Sem orçamento" });
  expect((await buscarOportunidade(env.DB, oportunidadeId))?.situacao).toBe("nutricao");
});

test("briefing marcado como enviado, só depois da diagnóstica concluída", async () => {
  await expect(marcarBriefingEnviado(env.DB, reuniaoId)).rejects.toThrow("nao_concluida");
  await encerrarDiagnostica(env.DB, reuniaoId, { resultado: "nao_qualificou", motivo: "Outro" }, closer);
  await marcarBriefingEnviado(env.DB, reuniaoId);
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.reuniao.briefingEnviadoEm).toBeTruthy();
});

test("diagnóstica cuja oportunidade já passou dela não inicia nem encerra, e a situação não muda", async () => {
  await registrarProposta(env.DB, { oportunidadeId, servico: "climatizacao", valor: 900000, apresentadaEm: "2026-11-10", quemDecide: "Ana" }, closer);
  await expect(iniciarReuniao(env.DB, reuniaoId)).rejects.toThrow("ja_passou");
  await expect(encerrarDiagnostica(env.DB, reuniaoId, { resultado: "nao_qualificou", motivo: "Outro" }, closer)).rejects.toThrow("ja_passou");
  expect((await buscarOportunidade(env.DB, oportunidadeId))?.situacao).toBe("em_followup");
  expect(await listarFollowup(env.DB, closer, "2026-11-10")).toHaveLength(1);
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.reuniao).toMatchObject({ situacao: "marcada", resultado: null });
});

test("encerrar grava tudo de uma vez: reunião concluída, proposta marcada e histórico", async () => {
  await encerrarDiagnostica(env.DB, reuniaoId, { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "online", quemDecide: "Ana" }, closer);
  const historico = await env.DB.prepare("SELECT de, para, autor_id FROM historico WHERE oportunidade_id = ? ORDER BY id").bind(oportunidadeId).all();
  expect(historico.results.at(-1)).toEqual({ de: "diagnostica_marcada", para: "proposta_marcada", autor_id: closer.id });
  const propostas = await env.DB.prepare("SELECT COUNT(*) AS n FROM reunioes WHERE oportunidade_id = ? AND tipo = 'proposta'").bind(oportunidadeId).first<{ n: number }>();
  expect(propostas?.n).toBe(1);
});

test("anotação técnica repetida depois de uma queda no meio cria a pendência uma vez só", async () => {
  const a = { idCliente: "n-3", minuto: 20, passo: "cl-area", marcacao: "tecnico" as const, texto: "Telhado de fibrocimento" };
  // A primeira tentativa gravou a anotação e caiu antes da pendência.
  await env.DB.prepare("INSERT INTO anotacoes (reuniao_id, id_cliente, minuto, passo, marcacao, texto, autor_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(reuniaoId, a.idCliente, a.minuto, a.passo, a.marcacao, a.texto, closer.id)
    .run();
  await salvarAnotacao(env.DB, reuniaoId, a, closer, "2026-11-13");
  await salvarAnotacao(env.DB, reuniaoId, a, closer, "2026-11-13");
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.pendencias).toEqual([expect.objectContaining({ texto: "Telhado de fibrocimento", prazo: "2026-11-16" })]);
});

test("a ficha traz a reunião de proposta combinada no fechamento", async () => {
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.proximaReuniao).toBeNull();
  await encerrarDiagnostica(env.DB, reuniaoId, { resultado: "proposta_marcada", dataHora: "2026-11-18T14:00", formato: "presencial", quemDecide: "Ana e o sócio" }, closer);
  expect((await fichaDaReuniao(env.DB, reuniaoId))?.proximaReuniao).toMatchObject({ tipo: "proposta", dataHora: "2026-11-18T14:00", formato: "presencial", quemDecide: "Ana e o sócio" });
});
