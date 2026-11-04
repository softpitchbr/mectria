import { diasDepois } from "./datas";

/** Docs/17, "sempre pra direita": nenhum lead fica mais de 3 dias em construção de proposta. */
export const ALERTA_CONSTRUCAO_DIAS = 3;

/**
 * Em proposta_marcada, a proposta está em construção enquanto a reunião de proposta não tem o valor preparado,
 * e em Apresentação de Proposta (AP) depois. Proposta registrada à mão, sem reunião de proposta, não entra em nenhuma.
 */
export function etapaDaProposta(reuniaoDeProposta: { valorPreparado: boolean } | null): "construcao" | "ap" | null {
  if (!reuniaoDeProposta) return null;
  return reuniaoDeProposta.valorPreparado ? "ap" : "construcao";
}

/** Dias corridos desde a entrada na etapa (null quando não se sabe). */
export function diasNaEtapa(desde: string | null | undefined, hoje: string): number | null {
  if (!desde) return null;
  let dias = 0;
  while (diasDepois(desde, dias) < hoje) dias++;
  return dias;
}
