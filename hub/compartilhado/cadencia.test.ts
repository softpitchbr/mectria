import { datasDaCadencia, preencherModelo } from "./cadencia";
import { CADENCIA, MOTIVOS_PERDA } from "./dados/cadencia";
import { SERVICOS } from "./dados/servicos";

test("datas da cadência a partir de uma sexta antes de feriado", () => {
  expect(datasDaCadencia("2026-11-13")).toEqual([
    { codigo: "D0", previstoPara: "2026-11-13" },
    { codigo: "D1", previstoPara: "2026-11-16" },
    { codigo: "D3", previstoPara: "2026-11-18" },
    { codigo: "D5", previstoPara: "2026-11-23" },
    { codigo: "D8", previstoPara: "2026-11-26" },
    { codigo: "D12", previstoPara: "2026-12-02" },
    { codigo: "D15", previstoPara: "2026-12-07" },
  ]);
});

test("o que falta no modelo vira colchete com o rótulo", () => {
  expect(preencherModelo("Oi, {contato}! {servico} até {data_decisao}.", { contato: "Ana", servico: "Climatização" })).toBe(
    "Oi, Ana! Climatização até [data da decisão].",
  );
});

test("os modelos da cadência são os da versão 0.2", () => {
  expect(CADENCIA.map((t) => [t.codigo, t.canal])).toEqual([
    ["D0", "WhatsApp + e-mail"],
    ["D1", "WhatsApp"],
    ["D3", "Ligação"],
    ["D5", "WhatsApp"],
    ["D8", "Ligação"],
    ["D12", "E-mail"],
    ["D15", "WhatsApp"],
  ]);
  expect(SERVICOS).toHaveLength(12);
  expect(MOTIVOS_PERDA).toContain("Escopo (queria fabricação ou instalação)");
});
