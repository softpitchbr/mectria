import { normalizar, normalizarEmail } from "./texto";

test("normalizar tira acentos, caixa e espaços sobrando", () => {
  expect(normalizar("  Objeções   Técnicas ")).toBe("objecoes tecnicas");
});

test("normalizarEmail tira espaços e caixa", () => {
  expect(normalizarEmail(" Carlos@MecTRIA.com ")).toBe("carlos@mectria.com");
});
