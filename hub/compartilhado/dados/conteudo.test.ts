import { DIAGNOSTICA, MOTIVOS_NAO_QUALIFICOU } from "./diagnostica";
import { OBJECOES } from "./objecoes";
import { SERVICOS_COMPLETOS } from "./servicos-completos";
import { PLAYBOOK_PROPOSTA } from "./playbooks";

test("a diagnóstica tem os blocos GPCTBA + C&I e 23 perguntas", () => {
  expect(DIAGNOSTICA.blocos.map((b) => b.letra)).toEqual(["G", "P", "C", "T", "B", "A", "C&I"]);
  expect(DIAGNOSTICA.blocos.reduce((n, b) => n + b.perguntas.length, 0)).toBe(23);
  expect(DIAGNOSTICA.escopoGeral).toHaveLength(4);
});

test("os 12 serviços completos, e Emissão de Carbono sem perguntas técnicas", () => {
  expect(SERVICOS_COMPLETOS).toHaveLength(12);
  expect(SERVICOS_COMPLETOS.find((s) => s.id === "emissao-de-carbono")?.perguntas).toEqual([]);
  expect(SERVICOS_COMPLETOS.find((s) => s.id === "climatizacao")?.perguntas).toHaveLength(7);
});

test("as 24 objeções têm frase e contorno", () => {
  expect(OBJECOES).toHaveLength(24);
  expect(OBJECOES.every((o) => o.objecao && o.contorno)).toBe(true);
  expect(OBJECOES.find((o) => o.id === "caro")?.objecao).toBe("Está caro.");
});

test("motivos de não qualificou e playbook da proposta", () => {
  expect(MOTIVOS_NAO_QUALIFICOU).toEqual([
    "Sem orçamento",
    "Sem urgência",
    "Fora do que a MecTRIA faz",
    "Quem decide não participa",
    "Só pesquisando preço",
    "Outro",
  ]);
  expect(PLAYBOOK_PROPOSTA.passos.length).toBeGreaterThan(0);
});
