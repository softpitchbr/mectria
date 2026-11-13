import { applyD1Migrations, env } from "cloudflare:test";
import { servicosDaCarta } from "../compartilhado/dados/servicos-completos";
import dp from "../apresentacoes/roteiros/desenvolvimento-de-produto.json";
import dt from "../apresentacoes/roteiros/desenho-tecnico.json";
import { buscarServico, listarServicos } from "./servicos";
import { validarServico } from "./validacao";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

test("a migração 0008 cadastra os 12 serviços da carta, na ordem, com as perguntas", async () => {
  // A 0010 grava os roteiros de DP e DT; o resto é a carta.
  const semRoteiros = (await listarServicos(env.DB)).map((s) => ({ ...s, roteiro: null }));
  expect(semRoteiros).toEqual(servicosDaCarta());
});

test("a migração 0010 grava os roteiros de Desenvolvimento de Produto e de Desenho Técnico iguais aos JSON", async () => {
  expect((await buscarServico(env.DB, "desenvolvimento-de-produto"))?.roteiro).toEqual(dp);
  expect((await buscarServico(env.DB, "desenho-tecnico"))?.roteiro).toEqual(dt);
  expect((await buscarServico(env.DB, "climatizacao"))?.roteiro).toBeNull();
});

test("um roteiro já personalizado pelo diretor não é sobrescrito pela migração 0010", async () => {
  const meu = [{ id: "um", titulo: "Meu", fala: "", pacto: null, tempo: 1 }];
  await env.DB.prepare("UPDATE servicos SET roteiro = ?1 WHERE id = 'desenho-tecnico'").bind(JSON.stringify(meu)).run();
  const migracao = env.TEST_MIGRATIONS.find((m) => m.name.startsWith("0010"))!;
  for (const consulta of migracao.queries) await env.DB.prepare(consulta).run();
  expect((await buscarServico(env.DB, "desenho-tecnico"))?.roteiro).toEqual(meu);
});

test("cada roteiro passa no validarServico", () => {
  for (const [id, roteiro] of [["desenvolvimento-de-produto", dp], ["desenho-tecnico", dt]] as const) {
    const servico = servicosDaCarta().find((s) => s.id === id)!;
    const { id: _id, apresentacao: _a, ...dados } = servico;
    const validado = validarServico({ ...dados, roteiro });
    expect(validado.ok, id).toBe(true);
    if (validado.ok) expect(validado.dados.roteiro).toEqual(roteiro);
  }
});

test("a migração 0008 cria a coluna das interações da reunião", async () => {
  const colunas = await env.DB.prepare("SELECT name FROM pragma_table_info('reunioes')").all<{ name: string }>();
  expect(colunas.results.map((c) => c.name)).toContain("interacoes");
});
