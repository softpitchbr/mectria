import type { PerguntaTecnica } from "../../../compartilhado/servico";

/** A pergunta na edição: a nova (ainda não salva) pode ser removida; a salva só é desativada. */
export type PerguntaEmEdicao = PerguntaTecnica & { nova?: boolean };

/** Seis letras aleatórias para o id de uma pergunta ou de um slide novo. */
export function letrasAleatorias(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => String.fromCharCode(97 + (b % 26))).join("");
}

/** "Dor um\n\n Dor dois " vira ["Dor um", "Dor dois"]. */
export const itensDasLinhas = (texto: string) =>
  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Troca o item i pelo i + passo (subir é -1, descer é +1). */
export function mover<T>(lista: T[], i: number, passo: number): T[] {
  const j = i + passo;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
