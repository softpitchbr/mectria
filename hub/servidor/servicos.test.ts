import { applyD1Migrations, env } from "cloudflare:test";
import { servicosDaCarta } from "../compartilhado/dados/servicos-completos";
import { listarServicos } from "./servicos";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

test("a migração 0008 cadastra os 12 serviços da carta, na ordem, com as perguntas", async () => {
  expect(await listarServicos(env.DB)).toEqual(servicosDaCarta());
});

test("a migração 0008 cria a coluna das interações da reunião", async () => {
  const colunas = await env.DB.prepare("SELECT name FROM pragma_table_info('reunioes')").all<{ name: string }>();
  expect(colunas.results.map((c) => c.name)).toContain("interacoes");
});
