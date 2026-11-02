import { applyD1Migrations, env } from "cloudflare:test";
import { assumir, buscarOportunidade, criarDiagnostica, listarOportunidades, listarReunioes, mudarSituacao } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let hunter: Pessoa;
let hunter2: Pessoa;
let closer: Pessoa;
let closer2: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  hunter2 = await criar(env.DB, { nome: "Helena Hunter", email: "hun2@mectria.com", cargo: "hunter" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  closer2 = await criar(env.DB, { nome: "Clara Closer 2", email: "clo2@mectria.com", cargo: "closer" });
});

const diagnostica = (empresa: string, dataHora = "2026-11-10T14:00") => ({
  empresa,
  contato: "Ana Souza",
  telefone: "34999990000",
  servico: "climatizacao",
  closerId: closer.id,
  dataHora,
  formato: "online" as const,
});

async function historicoDe(id: number) {
  const { results } = await env.DB.prepare("SELECT de, para, detalhe FROM historico WHERE oportunidade_id = ? ORDER BY id")
    .bind(id)
    .all<{ de: string | null; para: string; detalhe: string | null }>();
  return results;
}

test("hunter marca diagnóstica e o histórico registra", async () => {
  const { oportunidade, reuniao } = await criarDiagnostica(env.DB, diagnostica("Usinagem Alfa"), hunter);
  expect(oportunidade).toMatchObject({
    empresa: "Usinagem Alfa",
    situacao: "diagnostica_marcada",
    hunterId: hunter.id,
    closerId: closer.id,
    closerNome: "Carlos Closer",
    origem: "cold call",
  });
  expect(reuniao).toMatchObject({ tipo: "diagnostica", situacao: "marcada", dataHora: "2026-11-10T14:00", empresa: "Usinagem Alfa" });
  expect(await historicoDe(oportunidade.id)).toEqual([{ de: null, para: "diagnostica_marcada", detalhe: null }]);
});

test("hunter só vê as que marcou; closer vê todas", async () => {
  await criarDiagnostica(env.DB, diagnostica("Alfa"), hunter);
  await criarDiagnostica(env.DB, diagnostica("Beta"), hunter2);
  expect((await listarOportunidades(env.DB, hunter)).map((o) => o.empresa)).toEqual(["Alfa"]);
  expect((await listarOportunidades(env.DB, closer)).map((o) => o.empresa).sort()).toEqual(["Alfa", "Beta"]);
});

test("closer que marca diagnóstica não vira hunter da oportunidade", async () => {
  const { oportunidade } = await criarDiagnostica(env.DB, diagnostica("Gama"), closer);
  expect(oportunidade.hunterId).toBeNull();
});

test("assumir passa a oportunidade e registra quem assumiu", async () => {
  const { oportunidade } = await criarDiagnostica(env.DB, diagnostica("Delta"), hunter);
  const assumida = await assumir(env.DB, oportunidade.id, closer2);
  expect(assumida).toMatchObject({ closerId: closer2.id, closerNome: "Clara Closer 2" });
  expect((await historicoDe(oportunidade.id)).at(-1)).toMatchObject({ detalhe: "assumida por Clara Closer 2" });
});

test("mudarSituacao para perdida guarda o motivo", async () => {
  const { oportunidade } = await criarDiagnostica(env.DB, diagnostica("Épsilon"), hunter);
  await mudarSituacao(env.DB, oportunidade.id, "em_followup", closer.id);
  const perdida = await mudarSituacao(env.DB, oportunidade.id, "perdida", closer.id, { motivoPerda: "Preço" });
  expect(perdida).toMatchObject({ situacao: "perdida", motivoPerda: "Preço" });
  expect((await historicoDe(oportunidade.id)).at(-1)).toMatchObject({ de: "em_followup", para: "perdida" });
  expect((await buscarOportunidade(env.DB, oportunidade.id))?.situacao).toBe("perdida");
});

test("reuniões da semana, em ordem, e filtro por closer e por hunter", async () => {
  await criarDiagnostica(env.DB, diagnostica("Fora", "2026-11-16T09:00"), hunter);
  await criarDiagnostica(env.DB, diagnostica("Quinta", "2026-11-12T10:00"), hunter);
  await criarDiagnostica(env.DB, diagnostica("Segunda", "2026-11-09T15:30"), hunter2);
  await criarDiagnostica(env.DB, { ...diagnostica("Sexta", "2026-11-13T08:00"), closerId: closer2.id }, hunter);
  expect((await listarReunioes(env.DB, "2026-11-09", "2026-11-15")).map((r) => r.empresa)).toEqual(["Segunda", "Quinta", "Sexta"]);
  expect((await listarReunioes(env.DB, "2026-11-09", "2026-11-15", { closerId: closer2.id })).map((r) => r.empresa)).toEqual([
    "Sexta",
  ]);
  expect((await listarReunioes(env.DB, "2026-11-09", "2026-11-15", { hunterId: hunter2.id })).map((r) => r.empresa)).toEqual([
    "Segunda",
  ]);
});
