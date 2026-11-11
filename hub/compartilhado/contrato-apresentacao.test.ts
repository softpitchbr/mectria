import { aplicarEvento, INTERACOES_VAZIAS, lerInteracoes, lerMensagemDaApresentacao } from "./contrato-apresentacao";

test("lê a pronta com ações e campos; sem ações vira []", () => {
  expect(
    lerMensagemDaApresentacao({
      mectria: 1,
      tipo: "pronta",
      slides: 13,
      acoes: [{ slide: 11, id: "revelar-preco", rotulo: "Revelar o preço", extra: 1 }],
      campos: [{ slide: 11, id: "horas-paradas", rotulo: "Horas paradas por mês" }],
    }),
  ).toEqual({
    mectria: 1,
    tipo: "pronta",
    slides: 13,
    acoes: [{ slide: 11, id: "revelar-preco", rotulo: "Revelar o preço" }],
    campos: [{ slide: 11, id: "horas-paradas", rotulo: "Horas paradas por mês" }],
  });
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "pronta", slides: 5 })).toEqual({ mectria: 1, tipo: "pronta", slides: 5, acoes: [], campos: [] });
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "tecla", tecla: "ArrowRight" })).toEqual({ mectria: 1, tipo: "tecla", tecla: "ArrowRight" });
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "preco", etapa: 2 })).toEqual({ mectria: 1, tipo: "evento", evento: "preco", etapa: 2 });
});

test("recusa mensagem sem mectria: 1, tipo desconhecido, slides 0 ou 61", () => {
  expect(lerMensagemDaApresentacao({ tipo: "pronta", slides: 3 })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 2, tipo: "pronta", slides: 3 })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "apagar" })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "pronta", slides: 0 })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "pronta", slides: 61 })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "tecla", tecla: "Enter" })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "pronta", slides: 3, acoes: [{ slide: 1, id: "Revelar Preço", rotulo: "x" }] })).toBeNull();
  expect(lerMensagemDaApresentacao("texto")).toBeNull();
  expect(lerMensagemDaApresentacao(null)).toBeNull();
});

test("corta: dor de 201 caracteres, número infinito e 21 números são recusados", () => {
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "dor", valor: "a".repeat(201), marcada: true })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "dor", valor: "", marcada: true })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "calculadora", valores: { x: Infinity } })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "calculadora", valores: { x: 2e12 } })).toBeNull();
  const muitos = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`n${i}`, i]));
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "calculadora", valores: muitos })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "preco", etapa: 11 })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "evento", evento: "calculadora", valores: { "horas paradas": 1 } })).toBeNull();
  expect(lerMensagemDaApresentacao({ mectria: 1, tipo: "pronta", slides: 3, acoes: Array.from({ length: 61 }, (_, i) => ({ slide: 0, id: `a${i}`, rotulo: "A" })) })).toBeNull();
});

test("aplicarEvento: marcar a mesma dor duas vezes deixa uma; desmarcar tira; preço troca a etapa", () => {
  let i = aplicarEvento(INTERACOES_VAZIAS, { evento: "dor", valor: "Calor", marcada: true });
  i = aplicarEvento(i, { evento: "dor", valor: "Calor", marcada: true });
  i = aplicarEvento(i, { evento: "dor", valor: "Ruído", marcada: true });
  expect(i.dores).toEqual(["Calor", "Ruído"]);
  i = aplicarEvento(i, { evento: "dor", valor: "Calor", marcada: false });
  expect(i.dores).toEqual(["Ruído"]);
  i = aplicarEvento(i, { evento: "preco", etapa: 2 });
  expect(i.precoEtapa).toBe(2);
  i = aplicarEvento(i, { evento: "calculadora", valores: { "horas-paradas": 10 } });
  expect(i).toEqual({ dores: ["Ruído"], precoEtapa: 2, calculadora: { "horas-paradas": 10 } });
  expect(INTERACOES_VAZIAS).toEqual({ dores: [], precoEtapa: 0, calculadora: {} });
});

test("lerInteracoes recusa 21 dores", () => {
  expect(lerInteracoes({ dores: ["Calor"], precoEtapa: 1, calculadora: { a: 1 } })).toEqual({ dores: ["Calor"], precoEtapa: 1, calculadora: { a: 1 } });
  expect(lerInteracoes({ dores: Array.from({ length: 21 }, (_, i) => `D${i}`), precoEtapa: 0, calculadora: {} })).toBeNull();
  expect(lerInteracoes({ dores: [], precoEtapa: -1, calculadora: {} })).toBeNull();
  expect(lerInteracoes({ dores: [] })).toBeNull();
});
