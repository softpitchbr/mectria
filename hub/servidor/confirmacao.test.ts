import { applyD1Migrations, env } from "cloudflare:test";
import { registrarConfirmacao } from "./confirmacao";
import { criarDiagnostica } from "./oportunidades";
import { criar } from "./pessoas";
import type { Pessoa } from "./tipos";

let hunter: Pessoa;
let closer: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["anotacoes", "fichas", "pendencias", "historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  hunter = await criar(env.DB, { nome: "Hugo Hunter", email: "hun@mectria.com", cargo: "hunter" });
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
});

const marcar = async () =>
  (
    await criarDiagnostica(
      env.DB,
      { empresa: "Alfa", contato: "Ana", telefone: "34999990000", servico: "climatizacao", closerId: closer.id, dataHora: "2026-11-10T14:00", formato: "online" },
      hunter,
    )
  ).reuniao;

test("FUP 1, 2 e 3 em ordem; repetir não muda nada", async () => {
  const r = await marcar();
  expect((await registrarConfirmacao(env.DB, r.id, { fup: 1 })).fupsConfirmacao).toBe(1);
  expect((await registrarConfirmacao(env.DB, r.id, { fup: 1 })).fupsConfirmacao).toBe(1);
  expect((await registrarConfirmacao(env.DB, r.id, { fup: 2 })).fupsConfirmacao).toBe(2);
  expect((await registrarConfirmacao(env.DB, r.id, { fup: 3 })).fupsConfirmacao).toBe(3);
});

test("FUP 3 antes do 2 dá fora_de_ordem", async () => {
  const r = await marcar();
  await registrarConfirmacao(env.DB, r.id, { fup: 1 });
  await expect(registrarConfirmacao(env.DB, r.id, { fup: 3 })).rejects.toThrow("fora_de_ordem");
});

test("confirmada grava a hora uma vez", async () => {
  const r = await marcar();
  const primeira = await registrarConfirmacao(env.DB, r.id, { confirmada: true });
  expect(primeira.confirmadaEm).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  await env.DB.prepare("UPDATE reunioes SET confirmada_em = '2026-11-10 10:00:00' WHERE id = ?").bind(r.id).run();
  expect((await registrarConfirmacao(env.DB, r.id, { confirmada: true })).confirmadaEm).toBe("2026-11-10 10:00:00");
});

test("reunião concluída ou cancelada recusa", async () => {
  const r = await marcar();
  await env.DB.prepare("UPDATE reunioes SET situacao = 'cancelada' WHERE id = ?").bind(r.id).run();
  await expect(registrarConfirmacao(env.DB, r.id, { fup: 1 })).rejects.toThrow("ja_encerrada");
  await expect(registrarConfirmacao(env.DB, r.id, { confirmada: true })).rejects.toThrow("ja_encerrada");
});
