import { applyD1Migrations, env } from "cloudflare:test";
import { diasDepois, hojeEmSaoPaulo } from "../compartilhado/datas";
import { registrarProposta, registrarResultado } from "./followup";
import { buscarOportunidade } from "./oportunidades";
import { criar } from "./pessoas";
import { adiarReativacao, listarReativacao, perderNaReativacao, reativarComReuniao } from "./reativacao";
import { rotinaDoDia } from "./rotina";
import type { Pessoa } from "./tipos";

let closer: Pessoa;
let closer2: Pessoa;
let diretor: Pessoa;

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["historico", "toques", "propostas", "reunioes", "oportunidades", "rotinas", "ligacoes", "pessoas"]) {
    await env.DB.exec(`DELETE FROM ${t}`);
  }
  closer = await criar(env.DB, { nome: "Carlos Closer", email: "clo@mectria.com", cargo: "closer" });
  closer2 = await criar(env.DB, { nome: "Clara Closer", email: "clo2@mectria.com", cargo: "closer" });
  diretor = await criar(env.DB, { nome: "Diana Diretora", email: "dir@mectria.com", cargo: "diretor" });
});

async function emNutricao(empresa: string, apresentadaEm: string, retomarEm?: string): Promise<number> {
  const { proposta } = await registrarProposta(
    env.DB,
    { empresa, contato: "Ana", servico: "climatizacao", valor: 1250000, apresentadaEm, quemDecide: "Ana" },
    closer,
  );
  await registrarResultado(env.DB, proposta.oportunidadeId, { resultado: "nutricao", ...(retomarEm ? { retomarEm } : {}) }, closer);
  return proposta.oportunidadeId;
}

test("nutrição com retomar_em em dezembro só aparece em dezembro", async () => {
  await emNutricao("Alfa", "2026-10-05", "2026-12-01");
  expect(await listarReativacao(env.DB, closer, "2026-11-30")).toEqual([]);
  const [item] = await listarReativacao(env.DB, closer, "2026-12-01");
  expect(item).toMatchObject({ oportunidade: { empresa: "Alfa" }, ultimaReuniao: "2026-10-05", mesesDesde: 2, retomarEm: "2026-12-01" });
  expect(await listarReativacao(env.DB, closer2, "2026-12-01")).toEqual([]);
  expect(await listarReativacao(env.DB, diretor, "2026-12-01")).toHaveLength(1);
});

test("nutrição sem mês escolhido volta em 45 dias", async () => {
  const id = await emNutricao("Beta", "2026-10-05");
  expect(await env.DB.prepare("SELECT retomar_em FROM oportunidades WHERE id = ?").bind(id).first("retomar_em")).toBe(diasDepois(hojeEmSaoPaulo(), 45));
});

test("nutrição antiga sem retomar_em aparece 45 dias depois do histórico", async () => {
  const id = await emNutricao("Gama", "2026-08-20");
  await env.DB.prepare("UPDATE oportunidades SET retomar_em = NULL WHERE id = ?").bind(id).run();
  await env.DB.prepare("UPDATE historico SET em = '2026-09-01 15:00:00' WHERE oportunidade_id = ? AND para = 'nutricao'").bind(id).run();
  expect(await listarReativacao(env.DB, closer, "2026-10-15")).toEqual([]);
  expect((await listarReativacao(env.DB, closer, "2026-10-16")).map((i) => i.oportunidade.empresa)).toEqual(["Gama"]);
});

test("marcar reunião volta para diagnostica_marcada e cria a diagnóstica, uma vez só", async () => {
  const id = await emNutricao("Delta", "2026-10-05", "2026-11-01");
  const { oportunidade, reuniao } = await reativarComReuniao(env.DB, id, { dataHora: "2026-12-03T10:00", formato: "online" }, closer);
  expect(oportunidade).toMatchObject({ situacao: "diagnostica_marcada" });
  expect(reuniao).toMatchObject({ tipo: "diagnostica", dataHora: "2026-12-03T10:00", situacao: "marcada" });
  await expect(reativarComReuniao(env.DB, id, { dataHora: "2026-12-04T10:00", formato: "online" }, closer)).rejects.toThrow("fora_da_nutricao");
  expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM reunioes WHERE oportunidade_id = ?").bind(id).first("n")).toBe(1);
  expect(await env.DB.prepare("SELECT retomar_em FROM oportunidades WHERE id = ?").bind(id).first("retomar_em")).toBeNull();
});

test("adiar troca o mês", async () => {
  const id = await emNutricao("Épsilon", "2026-10-05", "2026-12-01");
  await adiarReativacao(env.DB, id, "2027-02-01", closer);
  expect(await listarReativacao(env.DB, closer, "2026-12-01")).toEqual([]);
  expect((await listarReativacao(env.DB, closer, "2027-02-01")).map((i) => i.retomarEm)).toEqual(["2027-02-01"]);
  await expect(adiarReativacao(env.DB, id, "2027-03-01", closer2)).rejects.toThrow("sem_permissao");
});

test("perdida na reativação registra o motivo", async () => {
  const id = await emNutricao("Zeta", "2026-10-05", "2026-12-01");
  await perderNaReativacao(env.DB, id, "Sem resposta", diretor);
  expect(await buscarOportunidade(env.DB, id)).toMatchObject({ situacao: "perdida", motivoPerda: "Sem resposta" });
  await expect(perderNaReativacao(env.DB, id, "Preço", closer)).rejects.toThrow("fora_da_nutricao");
});

test("a rotina do closer ganha Reativar {empresa} no dia", async () => {
  const hoje = hojeEmSaoPaulo();
  const id = await emNutricao("Eta", "2026-09-01", hoje);
  const antes = await rotinaDoDia(env.DB, closer, hoje);
  expect(antes.itens.find((i) => i.chave === `reativar:${id}`)).toMatchObject({ titulo: "Reativar Eta", automatico: true, feito: false });
  await adiarReativacao(env.DB, id, diasDepois(hoje, 30), closer);
  const depois = await rotinaDoDia(env.DB, closer, hoje);
  expect(depois.itens.find((i) => i.chave === `reativar:${id}`)).toMatchObject({ feito: true });
});
