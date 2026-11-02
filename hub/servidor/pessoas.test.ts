import { applyD1Migrations, env } from "cloudflare:test";
import { atualizar, atualizarProtegendoDiretor, buscarPorEmail, buscarPorId, contarDiretoresAtivos, criar, listar } from "./pessoas";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.exec("DELETE FROM pessoas");
});

test("criar grava o e-mail normalizado e a busca acha com outra caixa e espaços", async () => {
  const criada = await criar(env.DB, { nome: "Carlos Teste", email: " Carlos@MecTRIA.com ", cargo: "closer" });
  expect(criada.email).toBe("carlos@mectria.com");
  expect(criada.ativo).toBe(true);
  const achada = await buscarPorEmail(env.DB, " CARLOS@mectria.com");
  expect(achada?.id).toBe(criada.id);
  expect(achada?.cargo).toBe("closer");
});

test("criar com e-mail já existente (outra caixa) rejeita com email_duplicado", async () => {
  await criar(env.DB, { nome: "Carlos", email: "carlos@mectria.com", cargo: "closer" });
  await expect(criar(env.DB, { nome: "Outro", email: "CARLOS@mectria.com", cargo: "hunter" })).rejects.toThrow(
    "email_duplicado",
  );
});

test("desativar mantém a pessoa na lista e atualiza atualizadoEm", async () => {
  const p = await criar(env.DB, { nome: "Ana", email: "ana@mectria.com", cargo: "hunter" });
  await env.DB.prepare("UPDATE pessoas SET atualizado_em = '2026-01-01 00:00:00' WHERE id = ?").bind(p.id).run();
  const mudada = await atualizar(env.DB, p.id, { ativo: false });
  expect(mudada.ativo).toBe(false);
  expect(mudada.atualizadoEm).not.toBe("2026-01-01 00:00:00");
  const lista = await listar(env.DB);
  expect(lista.map((x) => [x.id, x.ativo])).toEqual([[p.id, false]]);
});

test("listar traz ativas primeiro e depois por nome", async () => {
  const bia = await criar(env.DB, { nome: "Bia", email: "bia@mectria.com", cargo: "hunter" });
  await criar(env.DB, { nome: "Caio", email: "caio@mectria.com", cargo: "closer" });
  await criar(env.DB, { nome: "Ana", email: "ana@mectria.com", cargo: "diretor" });
  await atualizar(env.DB, bia.id, { ativo: false });
  expect((await listar(env.DB)).map((x) => x.nome)).toEqual(["Ana", "Caio", "Bia"]);
});

test("atualizar troca nome e cargo e buscarPorId devolve o novo estado", async () => {
  const p = await criar(env.DB, { nome: "Rafa", email: "rafa@mectria.com", cargo: "hunter" });
  await atualizar(env.DB, p.id, { nome: "Rafael", cargo: "closer" });
  const achada = await buscarPorId(env.DB, p.id);
  expect(achada).toMatchObject({ nome: "Rafael", cargo: "closer", ativo: true });
  expect(await buscarPorId(env.DB, 9999)).toBeNull();
});

test("contarDiretoresAtivos ignora diretores inativos", async () => {
  await criar(env.DB, { nome: "Dir A", email: "dira@mectria.com", cargo: "diretor" });
  const b = await criar(env.DB, { nome: "Dir B", email: "dirb@mectria.com", cargo: "diretor" });
  await criar(env.DB, { nome: "Hunter", email: "hun@mectria.com", cargo: "hunter" });
  await atualizar(env.DB, b.id, { ativo: false });
  expect(await contarDiretoresAtivos(env.DB)).toBe(1);
});

test("listar ordena nomes com acento como o português", async () => {
  for (const [nome, email] of [
    ["Zeca", "zeca@mectria.com"],
    ["Álvaro", "alvaro@mectria.com"],
    ["Érica", "erica@mectria.com"],
    ["Bruno", "bruno@mectria.com"],
  ]) {
    await criar(env.DB, { nome, email, cargo: "hunter" });
  }
  expect((await listar(env.DB)).map((p) => p.nome)).toEqual(["Álvaro", "Bruno", "Érica", "Zeca"]);
});

test("atualizarProtegendoDiretor recusa rebaixar o último diretor e grava quando há outro", async () => {
  const a = await criar(env.DB, { nome: "Dir A", email: "dira@mectria.com", cargo: "diretor" });
  expect(await atualizarProtegendoDiretor(env.DB, a.id, { cargo: "closer" })).toBeNull();
  expect((await buscarPorId(env.DB, a.id))?.cargo).toBe("diretor");
  expect(await atualizarProtegendoDiretor(env.DB, a.id, { ativo: false })).toBeNull();

  await criar(env.DB, { nome: "Dir B", email: "dirb@mectria.com", cargo: "diretor" });
  expect(await atualizarProtegendoDiretor(env.DB, a.id, { cargo: "closer" })).toMatchObject({ cargo: "closer" });
});

test("atualizarProtegendoDiretor muda quem não é diretor sem olhar a contagem", async () => {
  const h = await criar(env.DB, { nome: "Hugo", email: "hugo@mectria.com", cargo: "hunter" });
  expect(await atualizarProtegendoDiretor(env.DB, h.id, { cargo: "closer", nome: "Hugo C" })).toMatchObject({
    cargo: "closer",
    nome: "Hugo C",
  });
});
