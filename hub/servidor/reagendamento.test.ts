import { applyD1Migrations, env } from "cloudflare:test";
import { encerrarDiagnostica } from "./diagnostica";
import { buscarOportunidade, criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import { listarReagendamentos, reagendarDiagnostica } from "./reagendamento";
import type { Pessoa } from "./tipos";

let hunter: Pessoa;
let hunter2: Pessoa;
let closer: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "fichas", "pendencias", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  hunter2 = await criar(env.DB, { nome: "Helena Hunter", email: "hun2@mectria.com", cargo: "hunter" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
});

async function noShow(empresa: string, quem = hunter) {
  const { oportunidade, reuniao } = await criarDiagnostica(
    env.DB,
    { empresa, contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-10T14:00", formato: "online", observacoes: "Prefere WhatsApp." },
    quem,
  );
  await encerrarDiagnostica(env.DB, reuniao.id, { resultado: "nao_compareceu" }, quem);
  return { oportunidade, reuniao };
}

test("não compareceu cancela a reunião e mantém a oportunidade em diagnóstica marcada", async () => {
  const { oportunidade, reuniao } = await noShow("Alfa");
  const r = await env.DB.prepare("SELECT situacao, motivo, encerrada_em FROM reunioes WHERE id = ?").bind(reuniao.id).first<Record<string, string>>();
  expect(r).toMatchObject({ situacao: "cancelada", motivo: "Cliente não compareceu" });
  expect(r?.encerrada_em).toBeTruthy();
  expect((await buscarOportunidade(env.DB, oportunidade.id))?.situacao).toBe("diagnostica_marcada");
  await expect(encerrarDiagnostica(env.DB, reuniao.id, { resultado: "nao_compareceu" }, hunter)).rejects.toThrow("ja_encerrada");
});

test("a oportunidade aparece em reagendamentos do hunter que marcou", async () => {
  await noShow("Alfa");
  await noShow("Beta", hunter2);
  expect((await listarReagendamentos(env.DB, hunter)).map((r) => r.empresa)).toEqual(["Alfa"]);
  expect((await listarReagendamentos(env.DB, closer)).map((r) => r.empresa).sort()).toEqual(["Alfa", "Beta"]);
});

test("reagendar cria uma reunião só, mesmo chamado duas vezes, e leva as observações", async () => {
  const { oportunidade } = await noShow("Alfa");
  const nova = { dataHora: "2026-11-12T10:00", formato: "online" as const };
  const resultados = await Promise.allSettled([reagendarDiagnostica(env.DB, oportunidade.id, nova, hunter), reagendarDiagnostica(env.DB, oportunidade.id, nova, hunter)]);
  expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const recusada = resultados.find((r) => r.status === "rejected") as PromiseRejectedResult;
  expect(String(recusada.reason)).toContain("ja_reagendada");
  const marcadas = await env.DB.prepare("SELECT observacoes FROM reunioes WHERE oportunidade_id = ? AND situacao = 'marcada'").bind(oportunidade.id).all();
  expect(marcadas.results).toEqual([{ observacoes: "Prefere WhatsApp." }]);
  expect(await listarReagendamentos(env.DB, hunter)).toEqual([]);
  await expect(reagendarDiagnostica(env.DB, oportunidade.id, nova, hunter2)).rejects.toThrow("sem_permissao");
});
