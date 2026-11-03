import type { Andamento, IdPacto, SlideDaProposta } from "../../compartilhado/proposta";

/** Regras puras do andamento da reunião de proposta. */

export const irPara = (a: Andamento, indice: number, total: number): Andamento => ({ ...a, slide: Math.max(0, Math.min(total - 1, indice)) });
export const avancar = (a: Andamento, total: number): Andamento => irPara(a, a.slide + 1, total);
export const voltar = (a: Andamento): Andamento => ({ ...a, slide: Math.max(0, a.slide - 1) });

/** Marca o pacto (com o minuto) ou desmarca, se já estava feito. */
export function alternarPacto(a: Andamento, id: IdPacto, minuto: number): Andamento {
  const feito = a.pactos.some((p) => p.id === id);
  return { ...a, pactos: feito ? a.pactos.filter((p) => p.id !== id) : [...a.pactos, { id, minuto }] };
}

export const somarTempo = (a: Andamento, slideId: string, segundos: number): Andamento => ({
  ...a,
  tempos: { ...a.tempos, [slideId]: (a.tempos[slideId] ?? 0) + segundos },
});

/** Sem quem decide na sala, o painel avisa no slide antes do preço e no do preço (spec, seção 6, "Alertas"). */
export function precisaDeQuemDecide(a: Andamento, slides: SlideDaProposta[]): boolean {
  if (a.sala.some((p) => p.decide)) return false;
  const preco = slides.findIndex((s) => s.id === "investimento");
  return preco >= 0 && (a.slide === preco || a.slide === preco - 1);
}
