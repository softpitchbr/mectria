import { horaDoFup } from "./confirmacao";

test("a hora de cada FUP: o 1 ao começar o dia, o 2 duas horas antes e o 3 trinta minutos antes", () => {
  expect(horaDoFup(1, "15:00")).toBeNull();
  expect(horaDoFup(2, "15:00")).toBe("13:00");
  expect(horaDoFup(3, "15:00")).toBe("14:30");
  expect(horaDoFup(3, "09:10")).toBe("08:40");
  // Reunião logo depois da meia-noite: não volta para o dia anterior.
  expect(horaDoFup(2, "01:00")).toBe("00:00");
});
