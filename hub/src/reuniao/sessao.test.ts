import { slidesDaProposta, type Andamento } from "../../compartilhado/proposta";
import { alternarPacto, avancar, irPara, precisaDeQuemDecide, somarTempo, voltar } from "./sessao";

const base: Andamento = { sala: [{ nome: "Ana", decide: false }], pactos: [], tempos: {}, slide: 0 };
const slides = slidesDaProposta();
const indiceDe = (id: string) => slides.findIndex((s) => s.id === id);

test("avançar no último slide fica no último; voltar no primeiro fica no primeiro", () => {
  expect(avancar({ ...base, slide: 12 }, 13).slide).toBe(12);
  expect(avancar(base, 13).slide).toBe(1);
  expect(voltar(base).slide).toBe(0);
  expect(irPara(base, 20, 13).slide).toBe(12);
});

test("pacto marcado duas vezes desmarca", () => {
  const um = alternarPacto(base, "agenda", 2);
  expect(um.pactos).toEqual([{ id: "agenda", minuto: 2 }]);
  expect(alternarPacto(um, "agenda", 5).pactos).toEqual([]);
});

test("o tempo soma no slide", () => {
  expect(somarTempo(somarTempo(base, "capa", 1), "capa", 2).tempos).toEqual({ capa: 3 });
});

test("sem quem decide, avisa no slide antes do preço (provas) e no investimento, e não avisa nos outros", () => {
  const avisos = slides.map((_, i) => precisaDeQuemDecide({ ...base, slide: i }, slides));
  expect(avisos.filter(Boolean)).toHaveLength(2);
  expect(avisos[indiceDe("provas")]).toBe(true);
  expect(avisos[indiceDe("investimento")]).toBe(true);
  expect(precisaDeQuemDecide({ ...base, sala: [{ nome: "Bia", decide: true }], slide: indiceDe("investimento") }, slides)).toBe(false);
});
