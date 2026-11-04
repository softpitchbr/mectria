import { erro } from "./respostas";

/** Traduz os erros de servidor/pendencias.ts; devolve null para os que não são dela. */
export function respostaDoErroDaPendencia(e: unknown): Response | null {
  if (!(e instanceof Error)) return null;
  if (e.message === "nao_encontrado") return erro("nao_encontrado", "Pendência não encontrada.");
  if (e.message === "ja_fechada") return erro("conflito", "Essa pendência já foi fechada.");
  if (e.message === "sem_resposta") return erro("conflito", "Responda a pendência antes de fechar.");
  return null;
}
