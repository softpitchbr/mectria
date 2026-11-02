import { somarDiasUteis } from "./datas";
import { CADENCIA, VARIAVEIS } from "./dados/cadencia";
import { FERIADOS } from "./dados/feriados";

export type CodigoToque = "D0" | "D1" | "D3" | "D5" | "D8" | "D12" | "D15";

/** As datas de cada toque, em dias úteis contados da apresentação. */
export function datasDaCadencia(
  apresentadaEm: string,
  feriados: readonly string[] = FERIADOS,
): { codigo: CodigoToque; previstoPara: string }[] {
  return CADENCIA.map((t) => ({ codigo: t.codigo, previstoPara: somarDiasUteis(apresentadaEm, t.dia, feriados) }));
}

/** Troca {chave} pelo valor; o que não tiver valor vira [rótulo] para o vendedor completar. */
export function preencherModelo(modelo: string, valores: Record<string, string | undefined>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, chave: string) => {
    const valor = valores[chave]?.trim();
    return valor ? valor : `[${VARIAVEIS[chave] ?? chave}]`;
  });
}
