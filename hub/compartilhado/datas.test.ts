import { diasDepois, ehDiaUtil, formatarDia, formatarReais, hojeEmSaoPaulo, inicioDaSemana, instanteLocal, lerReais, somarDiasUteis } from "./datas";

test("hoje é o dia de São Paulo", () => {
  expect(hojeEmSaoPaulo(new Date("2026-11-03T02:30:00Z"))).toBe("2026-11-02");
  expect(hojeEmSaoPaulo(new Date("2026-11-03T03:00:00Z"))).toBe("2026-11-03");
});

test("dia útil pula fim de semana e feriado", () => {
  expect(ehDiaUtil("2026-11-02")).toBe(false); // Finados
  expect(ehDiaUtil("2026-11-03")).toBe(true);
  expect(ehDiaUtil("2026-11-07")).toBe(false); // sábado
  expect(somarDiasUteis("2026-11-13", 5)).toBe("2026-11-23"); // pula 20/11
  expect(somarDiasUteis("2026-11-13", 0)).toBe("2026-11-13");
});

test("instante local da reunião é UTC−3", () => {
  expect(instanteLocal("2026-11-09T14:00").toISOString()).toBe("2026-11-09T17:00:00.000Z");
});

test("dinheiro do jeito brasileiro", () => {
  expect(lerReais("12.500,00")).toBe(1250000);
  expect(lerReais("12500")).toBe(1250000);
  expect(lerReais("R$ 12.500")).toBe(1250000);
  expect(lerReais("1.234,5")).toBe(123450);
  expect(lerReais("abc")).toBeNull();
  expect(lerReais("-10")).toBeNull();
  expect(formatarReais(1250000)).toBe("R$ 12.500,00");
  expect(formatarDia("2026-11-09")).toBe("Seg, 9/11");
});

test("dias depois conta dias de calendário", () => {
  expect(diasDepois("2026-11-27", 6)).toBe("2026-12-03");
});

test("inicioDaSemana: a segunda-feira da semana do dia", () => {
  expect(inicioDaSemana("2026-11-11")).toBe("2026-11-09");
  expect(inicioDaSemana("2026-11-15")).toBe("2026-11-09");
  expect(inicioDaSemana("2026-11-16")).toBe("2026-11-16");
  // Domingo às 22h em São Paulo ainda é domingo (01h UTC de segunda).
  expect(inicioDaSemana(hojeEmSaoPaulo(new Date("2026-11-16T01:00:00Z")))).toBe("2026-11-09");
});
