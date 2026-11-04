import { applyD1Migrations, env } from "cloudflare:test";
import { registrarProposta, registrarResultado } from "./followup";
import { numerosDoTime } from "./numeros";
import { criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let closer2: Pessoa;
let hunter: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  closer2 = await criar(env.DB, { nome: "Clara Closer", email: "clo2@mectria.com", cargo: "closer" });
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

/** Proposta apresentada no dia, com o resultado registrado no instante `em` (UTC). */
async function decidida(empresa: string, apresentadaEm: string, resultado: "ganha" | "perdida" | "nutricao" | null, em: string, quem = closer, valor = 1000000) {
  const { proposta } = await registrarProposta(env.DB, { empresa, contato: "Ana", servico: "climatizacao", valor, apresentadaEm, quemDecide: "Ana" }, quem);
  const id = proposta.oportunidadeId;
  if (resultado === "ganha") await registrarResultado(env.DB, id, { resultado, valor }, quem);
  if (resultado === "perdida") await registrarResultado(env.DB, id, { resultado, motivo: "Preço" }, quem);
  if (resultado === "nutricao") await registrarResultado(env.DB, id, { resultado }, quem);
  await env.DB.prepare("UPDATE historico SET em = ? WHERE oportunidade_id = ? AND para = ?").bind(em, id, resultado ?? "").run();
  return id;
}

test("conversão é ganhas sobre decididas e ignora nutrição", async () => {
  await decidida("A", "2026-11-03", "ganha", "2026-11-10 15:00:00");
  await decidida("B", "2026-11-04", "perdida", "2026-11-10 15:00:00");
  await decidida("C", "2026-11-05", "nutricao", "2026-11-10 15:00:00");
  const n = await numerosDoTime(env.DB, "2026-11");
  expect(n).toMatchObject({ propostas: 3, ganhas: 1, perdidas: 1, conversao: 0.5 });
  expect((await numerosDoTime(env.DB, "2026-10")).conversao).toBeNull();
});

test("valor vendido soma o valor fechado das ganhas do mês", async () => {
  await decidida("A", "2026-11-03", "ganha", "2026-11-10 15:00:00", closer, 1000000);
  await decidida("D", "2026-11-03", "ganha", "2026-11-11 15:00:00", closer2, 500000);
  await decidida("E", "2026-10-20", "ganha", "2026-10-25 15:00:00", closer, 300000);
  const n = await numerosDoTime(env.DB, "2026-11");
  expect(n.valorVendido).toBe(1500000);
  expect(n.porCloser.map((c) => [c.pessoa.nome, c.propostas, c.ganhas, c.valorVendido])).toEqual([
    ["Carlos Closer", 1, 1, 1000000],
    ["Clara Closer", 1, 1, 500000],
  ]);
});

test("ganha às 22h do dia 30 em São Paulo conta no próprio mês", async () => {
  await decidida("Virada", "2026-11-20", "ganha", "2026-12-01 01:00:00");
  expect((await numerosDoTime(env.DB, "2026-11")).ganhas).toBe(1);
  expect((await numerosDoTime(env.DB, "2026-12")).ganhas).toBe(0);
});

test("tempo médio da diagnóstica à decisão em dias", async () => {
  for (const [empresa, diagnostica, para, em] of [
    ["F", "2026-11-02T10:00", "ganha", "2026-11-12 15:00:00"],
    ["G", "2026-11-05T10:00", "perdida", "2026-11-09 15:00:00"],
  ] as const) {
    const { oportunidade } = await criarDiagnostica(
      env.DB,
      { empresa, contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: diagnostica, formato: "online" },
      hunter,
    );
    await env.DB.prepare("UPDATE oportunidades SET situacao = ?, valor_fechado = 100 WHERE id = ?").bind(para, oportunidade.id).run();
    await env.DB.prepare("INSERT INTO historico (oportunidade_id, de, para, em) VALUES (?, 'em_followup', ?, ?)").bind(oportunidade.id, para, em).run();
  }
  expect((await numerosDoTime(env.DB, "2026-11")).tempoMedioDias).toBe(7);
  expect((await numerosDoTime(env.DB, "2026-10")).tempoMedioDias).toBeNull();
});

test("objeções do mês, as mais recentes primeiro", async () => {
  const { reuniao } = await criarDiagnostica(
    env.DB,
    { empresa: "Hélice", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-02T10:00", formato: "online" },
    hunter,
  );
  for (const [id, marcacao, texto, criado] of [
    ["a1", "objecao", "Achei caro", "2026-11-02 14:00:00"],
    ["a2", "objecao", "Preciso falar com o sócio", "2026-11-03 14:00:00"],
    ["a3", "tecnico", "Qual a vazão?", "2026-11-03 15:00:00"],
    ["a4", "objecao", "Do mês passado", "2026-10-30 14:00:00"],
  ]) {
    await env.DB.prepare("INSERT INTO anotacoes (reuniao_id, id_cliente, marcacao, texto, criado_em) VALUES (?, ?, ?, ?, ?)").bind(reuniao.id, id, marcacao, texto, criado).run();
  }
  expect((await numerosDoTime(env.DB, "2026-11")).objecoes).toEqual([
    { texto: "Preciso falar com o sócio", empresa: "Hélice", closer: "Carlos Closer", dia: "2026-11-03" },
    { texto: "Achei caro", empresa: "Hélice", closer: "Carlos Closer", dia: "2026-11-02" },
  ]);
});

test("% da rotina do mês por pessoa soma os itens feitos e o total dos dias do mês", async () => {
  for (const [dia, chave, feito] of [
    ["2026-11-03", "a", "2026-11-03T12:00:00Z"],
    ["2026-11-03", "b", null],
    ["2026-11-04", "a", "2026-11-04T12:00:00Z"],
    ["2026-11-04", "b", "2026-11-04T12:00:00Z"],
    ["2026-10-30", "a", null],
  ]) {
    await env.DB.prepare("INSERT INTO rotinas (pessoa_id, dia, chave, titulo, origem, feito_em) VALUES (?, ?, ?, 'Item', 'fixo', ?)").bind(closer.id, dia, chave, feito).run();
  }
  const { rotina } = await numerosDoTime(env.DB, "2026-11");
  expect(rotina.find((r) => r.pessoa.id === closer.id)).toMatchObject({ feitos: 3, total: 4 });
  expect(rotina.find((r) => r.pessoa.id === hunter.id)).toMatchObject({ feitos: 0, total: 0 });
});
