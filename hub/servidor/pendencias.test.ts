import { applyD1Migrations, env } from "cloudflare:test";
import { acessarReuniao } from "./acessoReuniao";
import { listarFollowup, registrarProposta } from "./followup";
import { criarDiagnostica } from "./oportunidades";
import { fecharPendencia, listarBriefings, listarPendencias, responderPendencia } from "./pendencias";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let hunter: Pessoa;
let projetos: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "fichas", "pendencias", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  projetos = await criar(env.DB, { nome: "Paulo Projetos", email: "pro@mectria.com", cargo: "projetos" });
});

const diagnostica = (empresa: string) =>
  criarDiagnostica(env.DB, { empresa, contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-03T10:00", formato: "online" }, hunter);

async function pendencia(oportunidadeId: number, texto: string, prazo: string, situacao = "aberta", resposta: string | null = null): Promise<number> {
  const linha = await env.DB.prepare("INSERT INTO pendencias (oportunidade_id, texto, prazo, situacao, resposta) VALUES (?, ?, ?, ?, ?) RETURNING id")
    .bind(oportunidadeId, texto, prazo, situacao, resposta)
    .first<{ id: number }>();
  return linha!.id;
}

test("Projetos lista as abertas, as atrasadas primeiro", async () => {
  const { oportunidade, reuniao } = await diagnostica("Alfa");
  await pendencia(oportunidade.id, "Hoje", "2026-11-10");
  await pendencia(oportunidade.id, "Atrasada", "2026-11-05");
  await pendencia(oportunidade.id, "Depois", "2026-11-12");
  await pendencia(oportunidade.id, "Respondida", "2026-11-01", "respondida", "Sim");
  await pendencia(oportunidade.id, "Fechada", "2026-11-01", "fechada", "Sim");
  const lista = await listarPendencias(env.DB, "2026-11-10");
  expect(lista.map((p) => [p.pendencia.texto, p.estado])).toEqual([
    ["Atrasada", "atrasada"],
    ["Hoje", "hoje"],
    ["Depois", "no_prazo"],
    ["Respondida", "respondida"],
  ]);
  expect(lista[0]).toMatchObject({ empresa: "Alfa", reuniaoId: reuniao.id });
});

test("responder grava a resposta, quem respondeu e quando", async () => {
  const { oportunidade } = await diagnostica("Beta");
  const id = await pendencia(oportunidade.id, "Qual a vazão?", "2026-11-10");
  const p = await responderPendencia(env.DB, id, "3 m³/h, cabe no orçamento", projetos);
  expect(p).toMatchObject({ situacao: "respondida", resposta: "3 m³/h, cabe no orçamento", respondidaPor: "Paulo Projetos" });
  expect(p.respondidaEm).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
});

test("fechar só depois de responder", async () => {
  const { oportunidade } = await diagnostica("Gama");
  const id = await pendencia(oportunidade.id, "Qual a vazão?", "2026-11-10");
  await expect(fecharPendencia(env.DB, id)).rejects.toThrow("sem_resposta");
  await responderPendencia(env.DB, id, "3 m³/h", projetos);
  expect(await fecharPendencia(env.DB, id)).toMatchObject({ situacao: "fechada" });
  await expect(fecharPendencia(env.DB, id)).rejects.toThrow("ja_fechada");
  await expect(responderPendencia(env.DB, id, "outra", projetos)).rejects.toThrow("ja_fechada");
  await expect(responderPendencia(env.DB, 999, "outra", projetos)).rejects.toThrow("nao_encontrado");
});

test("o card do follow-up traz a resposta", async () => {
  const { proposta } = await registrarProposta(
    env.DB,
    { empresa: "Delta", contato: "Ana", servico: "climatizacao", valor: 1250000, apresentadaEm: "2026-11-09", quemDecide: "Ana" },
    closer,
  );
  const aberta = await pendencia(proposta.oportunidadeId, "Aberta", "2026-11-10");
  const respondida = await pendencia(proposta.oportunidadeId, "Qual a vazão?", "2026-11-10");
  await responderPendencia(env.DB, respondida, "3 m³/h", projetos);
  const [item] = await listarFollowup(env.DB, closer, "2026-11-10");
  expect(item.respostasTecnicas?.map((p) => [p.texto, p.resposta])).toEqual([["Qual a vazão?", "3 m³/h"]]);
  expect(aberta).toBeGreaterThan(0);
});

test("briefings enviados para Projetos, os mais novos primeiro", async () => {
  const a = await diagnostica("Épsilon");
  const b = await diagnostica("Zeta");
  await diagnostica("Sem briefing");
  await env.DB.prepare("UPDATE reunioes SET briefing_enviado_em = ? WHERE id = ?").bind("2026-11-03 12:00:00", a.reuniao.id).run();
  await env.DB.prepare("UPDATE reunioes SET briefing_enviado_em = ? WHERE id = ?").bind("2026-11-04 12:00:00", b.reuniao.id).run();
  expect((await listarBriefings(env.DB)).map((r) => r.empresa)).toEqual(["Zeta", "Épsilon"]);
});

test("Projetos lê a ficha da diagnóstica, mas não mexe nela nem lê a da proposta", async () => {
  const { reuniao } = await diagnostica("Eta");
  expect(await acessarReuniao(env.DB, projetos, String(reuniao.id), false)).toMatchObject({ dono: false });
  expect((await acessarReuniao(env.DB, projetos, String(reuniao.id), true)) as Response).toHaveProperty("status", 403);
  const proposta = await env.DB.prepare("INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato) VALUES (?, 'proposta', '2026-11-20T10:00', 'online') RETURNING id")
    .bind(reuniao.oportunidadeId)
    .first<{ id: number }>();
  expect((await acessarReuniao(env.DB, projetos, String(proposta!.id), false)) as Response).toHaveProperty("status", 403);
});
