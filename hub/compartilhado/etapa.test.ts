import { ALERTA_CONSTRUCAO_DIAS, diasNaEtapa, etapaDaProposta } from "./etapa";

test("sem valor preparado é construção; com valor, AP; sem reunião de proposta, null", () => {
  expect(etapaDaProposta({ valorPreparado: false })).toBe("construcao");
  expect(etapaDaProposta({ valorPreparado: true })).toBe("ap");
  expect(etapaDaProposta(null)).toBeNull();
  expect(ALERTA_CONSTRUCAO_DIAS).toBe(3);
});

test("dias na etapa em dias corridos", () => {
  expect(diasNaEtapa("2026-11-02", "2026-11-06")).toBe(4);
  expect(diasNaEtapa("2026-11-06", "2026-11-06")).toBe(0);
  expect(diasNaEtapa(null, "2026-11-06")).toBeNull();
});
