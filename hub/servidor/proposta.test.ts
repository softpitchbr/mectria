import { applyD1Migrations, env } from "cloudflare:test";
import { variaveisIniciais } from "../compartilhado/proposta";
import { encerrarDiagnostica, iniciarReuniao, salvarRespostas } from "./diagnostica";
import { registrarProposta } from "./followup";
import { criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import { salvarAndamento, salvarVariaveis, sessaoDaProposta } from "./proposta";
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
  expect(s?.variaveis).toEqual(variaveisIniciais("climatizacao"));
  expect(s?.andamento).toEqual({ sala: [{ nome: "Bia", decide: true }, { nome: "Ana", decide: false }], pactos: [], tempos: {}, slide: 0 });
  expect(s?.respostasDaDiagnostica["c-dor"]).toBe("O galpão passa de 38 °C");
  expect(s?.anotacoes).toEqual([]);
  expect(s?.reuniao).toMatchObject({ tipo: "proposta", desfecho: null });
});

test("variáveis e andamento gravados voltam na sessão", async () => {
  const variaveis = { ...variaveisIniciais("climatizacao"), valor: 1250000, prazo: "45 dias", equipe: "Rui e Bia" };
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
  await expect(salvarVariaveis(env.DB, diagnosticaId, variaveisIniciais("climatizacao"))).rejects.toThrow("nao_e_proposta");
});
