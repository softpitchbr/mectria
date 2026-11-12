import { CARGOS } from "./cargos";
import { podeGerenciarPessoas, podeVer, SECOES, secoesDoCargo } from "./permissoes";

test("seções de cada cargo", () => {
  // Fase 6: o hunter conduz a diagnóstica que marcou, então vê a seção Reuniões.
  expect(secoesDoCargo("hunter")).toEqual(["hoje", "reunioes", "playbooks", "rotinas"]);
  expect(secoesDoCargo("closer")).toEqual(["hoje", "reunioes", "followup", "playbooks", "apresentacoes", "rotinas"]);
  expect(secoesDoCargo("diretor")).toEqual(["hoje", "reunioes", "followup", "playbooks", "apresentacoes", "rotinas", "time", "briefings", "servicos"]);
  expect(secoesDoCargo("projetos")).toEqual(["hoje", "briefings"]);
});

test("só o diretor gerencia pessoas", () => {
  expect(CARGOS.filter(podeGerenciarPessoas)).toEqual(["diretor"]);
});

test("podeVer segue a matriz", () => {
  expect(podeVer("hunter", "time")).toBe(false);
  expect(podeVer("projetos", "briefings")).toBe(true);
  expect(podeVer("closer", "briefings")).toBe(false);
});

test("caminhos e fases das seções", () => {
  expect(SECOES.map((s) => [s.id, s.caminho, s.fase])).toEqual([
    ["hoje", "/", 2],
    ["reunioes", "/reunioes", 3],
    ["followup", "/follow-up", 2],
    ["playbooks", "/playbooks", 3],
    ["apresentacoes", "/apresentacoes", 4],
    ["rotinas", "/rotinas", 2],
    ["time", "/time", 1],
    ["briefings", "/briefings", 6],
    ["servicos", "/servicos", 8],
  ]);
});
