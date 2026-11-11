import type { DaApresentacao, Interacoes } from "../../compartilhado/contrato-apresentacao";
import type { SlideMontado } from "../../compartilhado/proposta";

/** O que a janela mostra: a apresentação de exemplo (o hub desenha) ou a do serviço, em HTML. */
export type ApresentacaoNaJanela =
  | { tipo: "exemplo"; slides: SlideMontado[] }
  | { tipo: "html"; url: string; dados: Record<string, string>; interacoes: Interacoes };

/**
 * O que o painel e a janela da apresentação dizem um ao outro. O painel manda; a janela desenha,
 * avisa que está viva e repassa o que a apresentação em HTML contou (e as setas apertadas nela).
 */
export type MensagemReuniao =
  | { tipo: "pronta" }
  | { tipo: "viva" }
  | { tipo: "estado"; empresa: string; slide: number; apresentacao: ApresentacaoNaJanela }
  | { tipo: "slide"; slide: number }
  | { tipo: "acionar"; acao: string }
  | { tipo: "calcular"; valores: Record<string, number> }
  | { tipo: "tecla"; tecla: "ArrowRight" | "ArrowLeft" }
  | { tipo: "apresentacao"; mensagem: Exclude<DaApresentacao, { tipo: "tecla" }> }
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
