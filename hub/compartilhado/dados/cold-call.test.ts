import { COLD_MESSAGE, ROTEIRO_COLD_CALL } from "./cold-call";

test("o roteiro é o de docs/17: abertura pede um minutinho e o desvio pede 30 segundos", () => {
  expect(ROTEIRO_COLD_CALL.map((p) => p.titulo)).toEqual([
    "1. Abertura: pedir um minuto",
    "2. Quem é a MecTRIA, com uma pergunta",
    "3. Conhece ou não o Movimento Empresa Júnior",
    "4. A ponte para a reunião",
    "5. O pedido",
  ]);
  expect(ROTEIRO_COLD_CALL[0].fala).toContain("Você tem esse minutinho para eu te contar a ideia?");
  expect(ROTEIRO_COLD_CALL[0].desvios?.[0]).toEqual({
    quando: "Se não tiver o minuto",
    fala: "Te entendo. Me dá só 30 segundos? Se não fizer sentido, eu te deixo tranquilo.",
  });
  expect(ROTEIRO_COLD_CALL[2].desvios?.map((d) => d.quando)).toEqual(["Se não conhece", "Se já conhece"]);
  expect(ROTEIRO_COLD_CALL[4].dica).toContain("Fica melhor terça às 10h ou quinta às 15h?");
  expect(COLD_MESSAGE.startsWith("Oi, {contato}, tudo bem? Aqui é o {hunter}, da MecTRIA.")).toBe(true);
});
