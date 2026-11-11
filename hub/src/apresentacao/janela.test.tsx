import { act, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { montarSlides, slidesDaProposta } from "../../compartilhado/proposta";
import { abrirCanal, type MensagemReuniao } from "../reuniao/canal";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

const slides = montarSlides(slidesDaProposta(), { empresa: "Usinagem Alfa", servico: "Climatização" }, new Set());

function painelFalso() {
  const recebidas: MensagemReuniao[] = [];
  const canal = abrirCanal(5, (m) => recebidas.push(m));
  return { recebidas, canal };
}

afterEach(() => vi.useRealTimers());

test("a janela pede o estado e desenha o slide que o painel mandar", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide: 1, apresentacao: { tipo: "exemplo", slides } }));
  expect(await screen.findByRole("heading", { name: "O projeto que desenhamos para vocês" })).toBeInTheDocument();
  act(() => painel.canal.enviar({ tipo: "slide", slide: 4 }));
  expect(await screen.findByRole("heading", { name: "O time" })).toBeInTheDocument();
  painel.canal.fechar();
});

test("seta na janela da apresentação avisa o painel", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  fireEvent.keyDown(window, { key: "ArrowRight" });
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "tecla", tecla: "ArrowRight" }));
  painel.canal.fechar();
});

test("o título da janela é Apresentação · {empresa}", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide: 0, apresentacao: { tipo: "exemplo", slides } }));
  await vi.waitFor(() => expect(document.title).toBe("Apresentação · Usinagem Alfa"));
  painel.canal.fechar();
});

test("a janela não mostra fala, dica nem pendência destacada", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide: 1, apresentacao: { tipo: "exemplo", slides } }));
  await screen.findByRole("heading", { name: "O projeto que desenhamos para vocês" });
  expect(screen.queryByText(/obrigado pelo tempo/)).not.toBeInTheDocument();
  expect(document.querySelector("mark")).toBeNull();
  painel.canal.fechar();
});

test("a janela manda sinal de vida a cada 2 segundos", async () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await act(() => vi.advanceTimersByTimeAsync(4100));
  await vi.waitFor(() => expect(painel.recebidas.filter((m) => m.tipo === "viva").length).toBeGreaterThanOrEqual(2));
  painel.canal.fechar();
});

// Apresentação em HTML (fase 8) ---------------------------------------------------

const DADOS = { empresa: "Usinagem Alfa", valor: "R$ 12.500,00" };
const INTERACOES = { dores: ["Calor"], precoEtapa: 1, calculadora: {} };
const HTML = { tipo: "html" as const, url: "/api/servicos/climatizacao/apresentacao?v=2", dados: DADOS, interacoes: INTERACOES };

/** Abre a janela com uma apresentação em HTML e devolve o iframe, com o postMessage dele espionado. */
async function abrirComHtml(slide = 2) {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  const painel = painelFalso();
  abrir("/apresentacao/5");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "pronta" }));
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide, apresentacao: HTML }));
  const iframe = (await screen.findByTitle("Apresentação · Usinagem Alfa")) as HTMLIFrameElement;
  const paraOIframe = vi.spyOn(iframe.contentWindow!, "postMessage");
  const doIframe = (data: unknown) => act(() => window.dispatchEvent(new MessageEvent("message", { data, source: iframe.contentWindow })));
  return { painel, iframe, paraOIframe, doIframe };
}

test("a janela com estado html mostra o iframe isolado (sandbox allow-scripts, sem allow-same-origin)", async () => {
  const { iframe, painel } = await abrirComHtml();
  expect(iframe.getAttribute("src")).toBe(HTML.url);
  expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
  expect(iframe.getAttribute("allow")).toBe("");
  expect(iframe.getAttribute("referrerpolicy")).toBe("no-referrer");
  expect(document.querySelector("section[aria-label^='Slide']")).toBeNull();
  painel.canal.fechar();
});

test("a pronta do iframe recebe o estado com o slide, os dados e as interações", async () => {
  const { painel, paraOIframe, doIframe } = await abrirComHtml(2);
  const pronta = { mectria: 1, tipo: "pronta", slides: 13, acoes: [], campos: [] };
  doIframe(pronta);
  expect(paraOIframe).toHaveBeenCalledWith({ mectria: 1, tipo: "estado", slide: 2, dados: DADOS, interacoes: INTERACOES }, "*");
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "apresentacao", mensagem: pronta }));
  act(() => painel.canal.enviar({ tipo: "slide", slide: 3 }));
  await vi.waitFor(() => expect(paraOIframe).toHaveBeenCalledWith({ mectria: 1, tipo: "slide", slide: 3 }, "*"));
  painel.canal.fechar();
});

test("mensagem de outra origem (source diferente) é ignorada", async () => {
  const { painel, paraOIframe } = await abrirComHtml();
  paraOIframe.mockClear();
  act(() => window.dispatchEvent(new MessageEvent("message", { data: { mectria: 1, tipo: "pronta", slides: 13 }, source: window })));
  act(() => window.dispatchEvent(new MessageEvent("message", { data: { mectria: 1, tipo: "pronta", slides: 13 } })));
  await new Promise((r) => setTimeout(r, 30));
  expect(paraOIframe).not.toHaveBeenCalled();
  expect(painel.recebidas.filter((m) => m.tipo === "apresentacao")).toEqual([]);
  painel.canal.fechar();
});

test("a seta apertada no iframe vira tecla no canal; o evento da dor vira apresentacao no canal", async () => {
  const { painel, doIframe } = await abrirComHtml();
  doIframe({ mectria: 1, tipo: "tecla", tecla: "ArrowLeft" });
  await vi.waitFor(() => expect(painel.recebidas).toContainEqual({ tipo: "tecla", tecla: "ArrowLeft" }));
  doIframe({ mectria: 1, tipo: "evento", evento: "dor", valor: "Calor", marcada: true });
  await vi.waitFor(() =>
    expect(painel.recebidas).toContainEqual({ tipo: "apresentacao", mensagem: { mectria: 1, tipo: "evento", evento: "dor", valor: "Calor", marcada: true } }),
  );
  doIframe({ mectria: 1, tipo: "evento", evento: "dor", valor: "x".repeat(500), marcada: true });
  await new Promise((r) => setTimeout(r, 30));
  expect(painel.recebidas.filter((m) => m.tipo === "apresentacao")).toHaveLength(1);
  painel.canal.fechar();
});

test("acionar e calcular do canal chegam ao iframe", async () => {
  const { painel, paraOIframe } = await abrirComHtml();
  act(() => painel.canal.enviar({ tipo: "acionar", acao: "revelar-preco" }));
  await vi.waitFor(() => expect(paraOIframe).toHaveBeenCalledWith({ mectria: 1, tipo: "acionar", acao: "revelar-preco" }, "*"));
  act(() => painel.canal.enviar({ tipo: "calcular", valores: { "horas-paradas": 10 } }));
  await vi.waitFor(() => expect(paraOIframe).toHaveBeenCalledWith({ mectria: 1, tipo: "calcular", valores: { "horas-paradas": 10 } }, "*"));
  painel.canal.fechar();
});

test("o painel que recarrega recebe de novo a pronta que a apresentação já mandou (ações, campos e slides)", async () => {
  const { painel, doIframe } = await abrirComHtml();
  const pronta = { mectria: 1, tipo: "pronta", slides: 13, acoes: [{ slide: 11, id: "revelar-preco", rotulo: "Revelar o preço" }], campos: [] };
  doIframe(pronta);
  await vi.waitFor(() => expect(painel.recebidas.filter((m) => m.tipo === "apresentacao")).toHaveLength(1));
  // O painel novo (F5) manda o estado de novo; a apresentação não manda outra pronta.
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide: 2, apresentacao: { ...HTML, dados: { ...DADOS } } }));
  await vi.waitFor(() => expect(painel.recebidas.filter((m) => m.tipo === "apresentacao")).toEqual([{ tipo: "apresentacao", mensagem: pronta }, { tipo: "apresentacao", mensagem: pronta }]));
  // Outra apresentação (outro endereço): a pronta antiga não vale para ela.
  act(() => painel.canal.enviar({ tipo: "estado", empresa: "Usinagem Alfa", slide: 0, apresentacao: { ...HTML, url: "/api/servicos/outro/apresentacao?v=1" } }));
  await new Promise((r) => setTimeout(r, 30));
  expect(painel.recebidas.filter((m) => m.tipo === "apresentacao")).toHaveLength(2);
  painel.canal.fechar();
});
