import { contraste } from "./contraste";

const escuro = { fundo: "#16171A", painel: "#1F2024", alto: "#27282D", texto: "#EEEDE9", suave: "#A19E99", vermelhoTexto: "#EF5A5F" };
const claro = { fundo: "#F2F1EE", painel: "#FFFFFF", alto: "#FAF9F7", texto: "#1F1E1C", suave: "#6B6762", vermelhoTexto: "#B3242A" };

test.each([
  ["escuro", escuro],
  ["claro", claro],
])("contraste mínimo no tema %s", (_n, t) => {
  for (const f of [t.fundo, t.painel, t.alto]) {
    expect(contraste(t.texto, f)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.suave, f)).toBeGreaterThanOrEqual(4.5);
  }
  for (const f of [t.fundo, t.painel]) expect(contraste(t.vermelhoTexto, f)).toBeGreaterThanOrEqual(4.5);
});

test("texto branco nos botões de marca", () => {
  expect(contraste("#FFFFFF", "#C1272D")).toBeGreaterThanOrEqual(4.5);
  expect(contraste("#FFFFFF", "#780000")).toBeGreaterThanOrEqual(4.5);
});

test("valor conhecido", () => {
  expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
});
