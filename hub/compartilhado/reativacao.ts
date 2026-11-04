import { diasDepois, hojeEmSaoPaulo } from "./datas";
import type { Oportunidade } from "./oportunidade";

/** Sem o mês escolhido pelo closer, a oportunidade em nutrição volta em 45 dias (docs/16, seção 4). */
export const DIAS_PADRAO_REATIVACAO = 45;

export interface ItemReativacao {
  oportunidade: Oportunidade;
  /** Dia da última reunião ou apresentação (AAAA-MM-DD). */
  ultimaReuniao: string | null;
  mesesDesde: number;
  /** Quando a reativação venceu (AAAA-MM-DD). */
  retomarEm: string;
}

export function retomarOuPadrao(retomarEm: string | undefined, hoje: string = hojeEmSaoPaulo()): string {
  return retomarEm ?? diasDepois(hoje, DIAS_PADRAO_REATIVACAO);
}

/** Meses inteiros entre dois dias, arredondados, no mínimo 1. */
export function mesesEntre(de: string, ate: string): number {
  const dias = (Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000;
  return Math.max(1, Math.round(dias / 30.44));
}

/** "1 mês", "3 meses": o {tempo} da mensagem de reativação. */
export function textoDoTempo(meses: number): string {
  return meses === 1 ? "1 mês" : `${meses} meses`;
}
