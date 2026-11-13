import { JSDOM } from "jsdom";

type Mensagem = Record<string, unknown>;

/**
 * Abre uma apresentação montada num navegador de mentira (para os testes). No topo, parent === window:
 * o que a apresentação manda ao hub chega como message na própria janela.
 */
export async function abrirDeck(html: string) {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost:8788/api/servicos/x/apresentacao?v=1", pretendToBeVisual: true });
  const janela = dom.window;
  const recebidas: Mensagem[] = [];
  janela.addEventListener("message", (e) => {
    const d = (e as MessageEvent).data as Mensagem;
    if (d && d.mectria === 1 && ["pronta", "evento", "tecla"].includes(String(d.tipo))) recebidas.push(d);
  });
  const enviar = (data: Mensagem) => janela.dispatchEvent(new janela.MessageEvent("message", { data: { mectria: 1, ...data }, source: janela }));
  const esperar = () => new Promise((r) => setTimeout(r, 20));
  await esperar();
  const visiveis = () => [...janela.document.querySelectorAll("[data-slide]")].filter((s) => janela.getComputedStyle(s).display !== "none").map((s) => s.getAttribute("data-slide"));
  const texto = (seletor: string) => (janela.document.querySelector(seletor)?.textContent ?? "").replace(/\s+/g, " ").trim();
  return { janela, doc: janela.document, recebidas, enviar, esperar, visiveis, texto };
}

export const INTERACOES_VAZIAS = { dores: [], precoEtapa: 0, calculadora: {} };
