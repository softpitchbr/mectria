import { JSDOM } from "jsdom";
import html from "../../apresentacoes/exemplo.html?raw";

type Mensagem = Record<string, unknown>;

/** Abre o exemplo num navegador de mentira; o hub é o próprio window (no topo, parent === window). */
async function abrirExemplo() {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost:8788/api/servicos/dp/apresentacao", pretendToBeVisual: true });
  const janela = dom.window;
  const recebidas: Mensagem[] = [];
  janela.addEventListener("message", (e) => {
    const d = (e as MessageEvent).data as Mensagem;
    if (d && d.mectria === 1 && ["pronta", "evento", "tecla"].includes(String(d.tipo))) recebidas.push(d);
  });
  const enviar = (data: Mensagem) => janela.dispatchEvent(new janela.MessageEvent("message", { data: { mectria: 1, ...data }, source: janela }));
  const esperar = () => new Promise((r) => setTimeout(r, 20));
  await esperar();
  return { janela, doc: janela.document, recebidas, enviar, esperar };
}

const ESTADO = {
  tipo: "estado",
  slide: 0,
  dados: { empresa: "Prensa Nova", servico: "Desenvolvimento de Produto", dor: "A prensa para toda semana", valor: "R$ 24.000,00", valorCentavos: "2400000", parcelas: "6" },
  interacoes: { dores: [], precoEtapa: 0, calculadora: {} },
};

test("o exemplo avisa pronta com 13 slides, a ação revelar-preco e os campos horas-paradas e custo-hora", async () => {
  const { recebidas } = await abrirExemplo();
  const pronta = recebidas.find((m) => m.tipo === "pronta") as { slides: number; acoes: { slide: number; id: string }[]; campos: { slide: number; id: string }[] };
  expect(pronta.slides).toBe(13);
  expect(pronta.acoes).toContainEqual(expect.objectContaining({ slide: 11, id: "revelar-preco" }));
  expect(pronta.acoes.filter((a) => a.slide === 5).map((a) => a.id)).toEqual(["dor-1", "dor-2", "dor-3", "dor-4"]);
  expect(pronta.campos.map((c) => [c.slide, c.id])).toEqual([
    [11, "horas-paradas"],
    [11, "custo-hora"],
  ]);
});

test("o exemplo mostra o slide pedido e a empresa dos dados", async () => {
  const { doc, enviar, esperar } = await abrirExemplo();
  const ids = [...doc.querySelectorAll("[data-slide]")].map((s) => s.getAttribute("data-slide"));
  expect(ids).toEqual(["capa", "abertura", "proposito", "numeros", "time", "ceu-inferno", "metodo", "pacto-duvida", "pacto-cliente", "valor-preco", "provas", "investimento", "fechamento"]);
  enviar(ESTADO);
  await esperar();
  expect(doc.querySelector('[data-ativo="sim"]')?.getAttribute("data-slide")).toBe("capa");
  expect(doc.querySelector('[data-slide="capa"]')?.textContent).toContain("Proposta para Prensa Nova");
  expect(doc.querySelector('[data-slide="time"]')?.textContent).toContain("[nomes e papéis do time]");
  enviar({ tipo: "slide", slide: 5 });
  await esperar();
  expect(doc.querySelector('[data-ativo="sim"]')?.getAttribute("data-slide")).toBe("ceu-inferno");
  expect(doc.querySelectorAll('[data-ativo="sim"]')).toHaveLength(1);
});

test("clicar numa dor do exemplo manda o evento dor marcada", async () => {
  const { doc, enviar, esperar, recebidas } = await abrirExemplo();
  enviar({ ...ESTADO, slide: 5, interacoes: { dores: [], precoEtapa: 0, calculadora: {} } });
  await esperar();
  const botao = [...doc.querySelectorAll<HTMLButtonElement>('[data-slide="ceu-inferno"] button')].find((b) => b.textContent?.includes("A prensa para toda semana"))!;
  botao.click();
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "dor", valor: "A prensa para toda semana", marcada: true });
  expect(botao.getAttribute("aria-pressed")).toBe("true");
  enviar({ tipo: "acionar", acao: "dor-1" });
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "dor", valor: "A prensa para toda semana", marcada: false });
});

test("acionar revelar-preco três vezes manda as etapas 1, 2 e 3", async () => {
  const { doc, enviar, esperar, recebidas } = await abrirExemplo();
  enviar({ ...ESTADO, slide: 11 });
  await esperar();
  const valor = doc.querySelector('[data-slide="investimento"] [data-etapa="2"]')!;
  expect(valor.hasAttribute("hidden")).toBe(true);
  for (let i = 0; i < 3; i++) enviar({ tipo: "acionar", acao: "revelar-preco" });
  await esperar();
  expect(recebidas.filter((m) => m.evento === "preco").map((m) => m.etapa)).toEqual([1, 2, 3]);
  expect(valor.hasAttribute("hidden")).toBe(false);
  expect(valor.textContent).toContain("R$ 24.000,00");
});

test("calcular manda o evento calculadora com os números", async () => {
  const { doc, enviar, esperar, recebidas } = await abrirExemplo();
  enviar({ ...ESTADO, slide: 11 });
  enviar({ tipo: "calcular", valores: { "horas-paradas": 10, "custo-hora": 300 } });
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "calculadora", valores: { "horas-paradas": 10, "custo-hora": 300 } });
  const texto = doc.querySelector('[data-slide="investimento"]')!.textContent!.replace(/\s+/g, " ");
  expect(texto).toContain("R$ 36.000");
  expect(texto).toContain("8 meses");
});

test("o estado com as interações volta a apresentação como estava, e a seta apertada nela vai para o hub", async () => {
  const { doc, janela, enviar, esperar, recebidas } = await abrirExemplo();
  enviar({ ...ESTADO, slide: 11, interacoes: { dores: ["A prensa para toda semana"], precoEtapa: 2, calculadora: { "horas-paradas": 5 } } });
  await esperar();
  expect(doc.querySelector('[data-slide="investimento"] [data-etapa="2"]')!.hasAttribute("hidden")).toBe(false);
  expect(doc.querySelector('[data-slide="investimento"] [data-etapa="3"]')!.hasAttribute("hidden")).toBe(true);
  expect(doc.querySelector<HTMLInputElement>('[data-campo="horas-paradas"]')!.value).toBe("5");
  doc.dispatchEvent(new janela.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "tecla", tecla: "ArrowRight" });
});
