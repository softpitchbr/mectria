import type { SlideMontado } from "../../compartilhado/proposta";

/**
 * O que o painel e a janela da apresentação dizem um ao outro. O painel manda; a janela só desenha
 * e avisa que está viva (e as setas apertadas nela).
 */
export type MensagemReuniao =
  | { tipo: "pronta" }
  | { tipo: "viva" }
  | { tipo: "estado"; empresa: string; slides: SlideMontado[]; slide: number }
  | { tipo: "slide"; slide: number }
  | { tipo: "tecla"; tecla: "ArrowRight" | "ArrowLeft" }
  | { tipo: "fim" };

/** Canal entre as janelas da mesma reunião, pelo próprio navegador (funciona sem internet). */
export function abrirCanal(reuniaoId: number, aoReceber: (m: MensagemReuniao) => void): { enviar(m: MensagemReuniao): void; fechar(): void } {
  if (typeof BroadcastChannel === "undefined") return { enviar() {}, fechar() {} };
  const canal = new BroadcastChannel(`hub-reuniao-${reuniaoId}`);
  canal.onmessage = (e: MessageEvent<MensagemReuniao>) => aoReceber(e.data);
  return {
    enviar: (m) => canal.postMessage(m),
    fechar: () => canal.close(),
  };
}
