import { roteiroPadrao } from "../../compartilhado/proposta";
import type { SlideDoRoteiro } from "../../compartilhado/servico";
import { abrirDeck, INTERACOES_VAZIAS } from "./decks";

/** As frases da jornada de parcerias (docs/16), que a fala de valor × preço traz sem mudar uma palavra. */
export const JORNADA = [
  "Antes de te mostrar o investimento, deixa eu te explicar como funciona a nossa jornada de parcerias.",
  "A MecTRIA faz parte do Movimento Empresa Júnior, que existe para apoiar o empreendedorismo com soluções financeiramente mais viáveis. Aqui ninguém recebe pró-labore nem ganha pelos projetos. O que o membro leva de um projeto é o resultado: quando o projeto dá um resultado admirável, ele vira um case na carreira dele. Então o time é o primeiro interessado em que o projeto de vocês dê certo.",
  "Como a gente trabalha com valores abaixo do mercado, temos um volume bem alto de reuniões e de novos parceiros. Para ter controle da nossa capacidade de produção, pedimos uma formalidade: um sim ou um não em até 7 dias. Combinado?",
];

/**
 * Os testes que toda apresentação de proposta feita com o kit precisa passar: os 13 slides do roteiro padrão,
 * as dores, o preço em 3 etapas e a calculadora de quanto custa ficar como está.
 */
export function testesDaProposta(o: {
  html: string;
  roteiro: SlideDoRoteiro[];
  servico: string;
  doresDoServico: string[];
  campos: [string, string];
  /** Os dois números e o custo do ano que eles dão, em reais. */
  conta: { valores: [number, number]; ano: string; meses: string };
}) {
  const DADOS = {
    empresa: "Prensa Nova",
    servico: o.servico,
    dor: "a prensa manual trava duas vezes por semana",
    doresDoServico: o.doresDoServico.join("\n"),
    ancora: "um escritório de engenharia",
    fraseValor: "projetos orientados por professores da UFTM",
    valor: "R$ 24.000,00",
    valorCentavos: "2400000",
    condicoes: "Entrada de 30% e o restante em 3 vezes",
  };
  const estado = (dados: Record<string, string>, slide = 0) => ({ tipo: "estado", slide, dados, interacoes: INTERACOES_VAZIAS });

  test("avisa a pronta com os 13 slides do roteiro, as ações e os campos", async () => {
    const { doc, recebidas } = await abrirDeck(o.html);
    const ids = roteiroPadrao().map((s) => s.id);
    expect([...doc.querySelectorAll("[data-slide]")].map((s) => s.getAttribute("data-slide"))).toEqual(ids);
    const pronta = recebidas[0] as { slides: number; acoes: { slide: number; id: string }[]; campos: { slide: number; id: string }[] };
    expect(pronta.slides).toBe(13);
    expect(pronta.acoes.map((a) => [a.slide, a.id])).toEqual([
      [5, "dor-1"],
      [5, "dor-2"],
      [5, "dor-3"],
      [5, "dor-4"],
      [11, "revelar-preco"],
    ]);
    expect(pronta.campos.map((c) => [c.slide, c.id])).toEqual([
      [11, o.campos[0]],
      [11, o.campos[1]],
    ]);
  });

  test("o roteiro tem 13 slides com os ids do padrão e a jornada de parcerias na fala de valor × preço", () => {
    expect(o.roteiro.map((s) => s.id)).toEqual(roteiroPadrao().map((s) => s.id));
    const valor = o.roteiro.find((s) => s.id === "valor-preco")!;
    for (const frase of JORNADA) expect(valor.fala).toContain(frase);
    expect(valor.fala.trim().endsWith("Combinado?")).toBe(true);
    expect(valor.pacto).toBe("valor");
    expect(o.roteiro.filter((s) => s.pacto).map((s) => s.pacto).sort()).toEqual(["agenda", "cliente", "dor", "duvida", "fechamento", "valor"]);
    expect(JSON.stringify(o.roteiro)).not.toMatch(/4\.950|54\.900|parcelas\}|descontoAVista/);
  });

  test("as dores: a do cliente com a inicial maiúscula e as do serviço; clicar manda o evento", async () => {
    const { doc, enviar, esperar, recebidas } = await abrirDeck(o.html);
    enviar(estado(DADOS, 5));
    await esperar();
    const botoes = [...doc.querySelectorAll<HTMLButtonElement>('[data-slide="ceu-inferno"] [data-dor]')];
    expect(botoes.map((b) => b.textContent)).toEqual(["A prensa manual trava duas vezes por semana", ...o.doresDoServico.slice(0, 3)]);
    botoes[1].click();
    await esperar();
    expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "dor", valor: o.doresDoServico[0], marcada: true });
    expect(botoes[1].getAttribute("aria-pressed")).toBe("true");
    enviar({ tipo: "acionar", acao: "dor-2" });
    await esperar();
    expect(recebidas.at(-1)).toMatchObject({ evento: "dor", marcada: false });
  });

  test("revelar o preço três vezes mostra o mercado, a MecTRIA e o valor com as condições", async () => {
    const { doc, enviar, esperar, recebidas } = await abrirDeck(o.html);
    enviar(estado(DADOS, 11));
    await esperar();
    const etapa = (n: number) => doc.querySelector(`[data-slide="investimento"] [data-etapa="${n}"]`)!;
    expect([1, 2, 3].map((n) => etapa(n).hasAttribute("hidden"))).toEqual([true, true, true]);
    for (let i = 0; i < 4; i++) enviar({ tipo: "acionar", acao: "revelar-preco" });
    await esperar();
    expect(recebidas.filter((m) => m.evento === "preco").map((m) => m.etapa)).toEqual([1, 2, 3]);
    expect(etapa(1).textContent).toContain("um escritório de engenharia");
    expect(etapa(2).textContent).toContain("projetos orientados por professores da UFTM");
    expect(etapa(3).textContent).toContain("R$ 24.000,00");
    expect(etapa(3).textContent).toContain("Entrada de 30% e o restante em 3 vezes");
  });

  test("sem condições, o investimento mostra só o valor", async () => {
    const { doc, enviar, esperar } = await abrirDeck(o.html);
    const { condicoes: _c, ...semCondicoes } = DADOS;
    enviar({ ...estado(semCondicoes, 11), interacoes: { dores: [], precoEtapa: 3, calculadora: {} } });
    await esperar();
    expect(doc.querySelector('[data-slide="investimento"] [data-se="condicoes"]')!.hasAttribute("hidden")).toBe(true);
    expect(doc.querySelector('[data-slide="investimento"] [data-etapa="3"]')!.textContent).not.toContain("[condições");
  });

  test("a calculadora sem valor do projeto mostra o custo do ano e não o payback, sem NaN", async () => {
    const { enviar, esperar, recebidas, texto } = await abrirDeck(o.html);
    const { valorCentavos: _v, valor: _valor, ...semValor } = DADOS;
    enviar(estado(semValor, 11));
    await esperar();
    expect(texto('[data-slide="investimento"] [data-resultado]')).not.toMatch(/NaN|R\$\s?0\b/);
    enviar({ tipo: "calcular", valores: { [o.campos[0]]: o.conta.valores[0], [o.campos[1]]: o.conta.valores[1] } });
    await esperar();
    expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "calculadora", valores: { [o.campos[0]]: o.conta.valores[0], [o.campos[1]]: o.conta.valores[1] } });
    const resultado = texto('[data-slide="investimento"] [data-resultado]');
    expect(resultado).toContain(o.conta.ano);
    expect(resultado).not.toMatch(/se paga|NaN/);
    enviar(estado(DADOS, 11));
    enviar({ tipo: "calcular", valores: { [o.campos[0]]: o.conta.valores[0], [o.campos[1]]: o.conta.valores[1] } });
    await esperar();
    expect(texto('[data-slide="investimento"] [data-resultado]')).toContain(`se paga em ${o.conta.meses}`);
  });

  test("os números do site e nenhum número errado da call", async () => {
    const { texto } = await abrirDeck(o.html);
    const numeros = texto('[data-slide="numeros"]');
    for (const n of ["+13 anos de mercado", "+130 projetos realizados", "100% dos clientes avaliados recomendam", "70% abaixo do preço de mercado"]) expect(numeros).toContain(n);
    expect(o.html).not.toMatch(/4\.950|54\.900/);
  });
}
