import { applyD1Migrations, env } from "cloudflare:test";
import { numerosDoMes, registrarProposta, registrarResultado } from "./followup";
import { numerosDoTime } from "./numeros";
import { listarReativacao } from "./reativacao";
import { rotinaDoDia } from "./rotina";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { fichaDaReuniao } from "./diagnostica";
import { apagarDadosPessoais, csvDoHistorico, exportarTudo } from "./exportar";
import { criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let hunter: Pessoa;
let diretor: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "fichas", "pendencias", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  diretor = await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

test("CSV do mês com as colunas da decisão 5, separado por ponto e vírgula e com BOM para o Excel", async () => {
  const { proposta } = await registrarProposta(
    env.DB,
    { empresa: "Usinagem; Sul", contato: "Ana", servico: "climatizacao", valor: 1250000, apresentadaEm: "2026-11-03", quemDecide: "Ana" },
    closer,
  );
  await registrarResultado(env.DB, proposta.oportunidadeId, { resultado: "ganha", valor: 1100000 }, closer);
  await env.DB.prepare("UPDATE historico SET em = '2026-11-10 15:00:00' WHERE para = 'ganha'").run();
  await registrarProposta(env.DB, { empresa: "=Fórmula", contato: "Bia", servico: "climatizacao", valor: 500000, apresentadaEm: "2026-11-05", quemDecide: "Bia" }, closer);
  await registrarProposta(env.DB, { empresa: "Outubro", contato: "Caio", servico: "climatizacao", valor: 500000, apresentadaEm: "2026-10-30", quemDecide: "Caio" }, closer);

  const csv = await csvDoHistorico(env.DB, "2026-11");
  expect(csv.startsWith("﻿")).toBe(true);
  const linhas = csv.slice(1).split("\r\n");
  expect(linhas[0]).toBe("Empresa;Serviço;Closer;Apresentada em;Decidida em;Resultado;Valor apresentado;Valor fechado;Motivo");
  expect(linhas[1]).toMatch(/^"Usinagem; Sul";Climatização[^;]*;Carlos Closer;03\/11\/2026;10\/11\/2026;Ganha;12\.500,00;11\.000,00;$/);
  expect(linhas[2]).toMatch(/^'=Fórmula;Climatização[^;]*;Carlos Closer;05\/11\/2026;;Em follow-up;5\.000,00;;$/);
  expect(linhas).toHaveLength(3);
});

test("exportação completa traz todas as tabelas", async () => {
  await registrarProposta(env.DB, { empresa: "Alfa", contato: "Ana", servico: "climatizacao", valor: 1250000, apresentadaEm: "2026-11-03", quemDecide: "Ana" }, closer);
  const tudo = await exportarTudo(env.DB);
  expect(Object.keys(tudo.tabelas).sort()).toEqual(
    ["anotacoes", "fichas", "historico", "ligacoes", "oportunidades", "pendencias", "pessoas", "propostas", "reunioes", "rotinas", "servicos", "toques"].sort(),
  );
  expect(tudo.tabelas.oportunidades).toHaveLength(1);
  expect(tudo.tabelas.pessoas).toHaveLength(3);
  expect(tudo.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
});

test("apagar dados pessoais limpa contato, telefone, e-mail, quem decide e a sala, registra no histórico e pode ser repetido", async () => {
  const { oportunidade, reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Beta", contato: "Ana Souza", telefone: "34999990000", email: "ana@beta.com", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-03T10:00", formato: "online" },
    hunter,
  );
  await env.DB.prepare(`UPDATE reunioes SET quem_decide = 'Ana (sócia)', sala = '[{"nome":"Ana","decide":true}]' WHERE id = ?`).bind(reuniao.id).run();
  await apagarDadosPessoais(env.DB, oportunidade.id, diretor);
  await apagarDadosPessoais(env.DB, oportunidade.id, diretor);
  const o = await env.DB.prepare("SELECT contato, telefone, email FROM oportunidades WHERE id = ?").bind(oportunidade.id).first();
  expect(o).toEqual({ contato: "Dados apagados (LGPD)", telefone: "", email: "" });
  const r = await env.DB.prepare("SELECT quem_decide, sala FROM reunioes WHERE id = ?").bind(reuniao.id).first();
  expect(r).toEqual({ quem_decide: null, sala: null });
  const h = await env.DB.prepare("SELECT detalhe FROM historico WHERE oportunidade_id = ? AND detalhe IS NOT NULL").bind(oportunidade.id).all();
  expect(h.results.map((l) => l.detalhe)).toEqual(["Dados pessoais apagados a pedido (LGPD)", "Dados pessoais apagados a pedido (LGPD)"]);
  await expect(apagarDadosPessoais(env.DB, 999, diretor)).rejects.toThrow("nao_encontrado");
});

test("o briefing de uma oportunidade apagada não mostra o nome", async () => {
  const { oportunidade, reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Gama", contato: "Ana Souza", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-03T10:00", formato: "online" },
    hunter,
  );
  await env.DB.prepare("INSERT INTO fichas (reuniao_id, pergunta_id, resposta) VALUES (?, 'a-decisores', 'O sócio Bruno Lima'), (?, 'a-processo', 'Quem assina é o Bruno Lima'), (?, 'c-dor', 'Calor no galpão')")
    .bind(reuniao.id, reuniao.id, reuniao.id)
    .run();
  await apagarDadosPessoais(env.DB, oportunidade.id, diretor);
  const ficha = await fichaDaReuniao(env.DB, reuniao.id);
  expect(JSON.stringify(ficha)).not.toContain("Ana Souza");
  expect(JSON.stringify(ficha)).not.toContain("34999990000");
  expect(JSON.stringify(ficha)).not.toContain("Bruno Lima");
  expect(ficha?.respostas["c-dor"]).toBe("Calor no galpão");
});

test("apagar dados pessoais não conta como decisão nem mexe na reativação", async () => {
  // Uma ganha em outubro, apagada em novembro: novembro não ganha uma venda a mais.
  const { proposta } = await registrarProposta(
    env.DB,
    { empresa: "Ganha Antiga", contato: "Ana", servico: "climatizacao", valor: 1000000, apresentadaEm: "2026-10-20", quemDecide: "Ana" },
    closer,
  );
  await registrarResultado(env.DB, proposta.oportunidadeId, { resultado: "ganha", valor: 900000 }, closer);
  await env.DB.prepare("UPDATE historico SET em = '2026-10-25 15:00:00' WHERE para = 'ganha'").run();
  await apagarDadosPessoais(env.DB, proposta.oportunidadeId, diretor);
  await env.DB.prepare("UPDATE historico SET em = '2026-11-10 15:00:00' WHERE detalhe LIKE 'Dados pessoais apagados%'").run();
  expect(await numerosDoTime(env.DB, "2026-11")).toMatchObject({ ganhas: 0, valorVendido: 0 });
  expect(await numerosDoTime(env.DB, "2026-10")).toMatchObject({ ganhas: 1, valorVendido: 900000, tempoMedioDias: null });
  expect((await numerosDoMes(env.DB, diretor, "2026-11-15")).ganhas).toBe(0);
  expect(await csvDoHistorico(env.DB, "2026-10")).toContain(";20/10/2026;25/10/2026;Ganha;");

  // Uma nutrição antiga sem retomar_em: a exclusão não reinicia os 45 dias nem marca "Reativar" como feito.
  const { proposta: p2 } = await registrarProposta(
    env.DB,
    { empresa: "Nutrida Antiga", contato: "Bia", servico: "climatizacao", valor: 500000, apresentadaEm: "2026-08-20", quemDecide: "Bia" },
    closer,
  );
  await registrarResultado(env.DB, p2.oportunidadeId, { resultado: "nutricao" }, closer);
  await env.DB.prepare("UPDATE oportunidades SET retomar_em = NULL WHERE id = ?").bind(p2.oportunidadeId).run();
  await env.DB.prepare("UPDATE historico SET em = '2026-09-01 15:00:00' WHERE oportunidade_id = ? AND para = 'nutricao'").bind(p2.oportunidadeId).run();
  await apagarDadosPessoais(env.DB, p2.oportunidadeId, diretor);
  expect((await listarReativacao(env.DB, closer, "2026-10-16")).map((i) => i.oportunidade.empresa)).toEqual(["Nutrida Antiga"]);
  const dia = await rotinaDoDia(env.DB, closer, hojeEmSaoPaulo());
  expect(dia.itens.find((i) => i.chave === `reativar:${p2.oportunidadeId}`)).toMatchObject({ feito: false });
});
