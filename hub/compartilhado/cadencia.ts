import { diasDepois, ehDiaUtil, somarDiasUteis } from "./datas";
import { CADENCIA, D7_NA_SEXTA, TOQUES_ANTIGOS, VARIAVEIS, type DadosDoToque } from "./dados/cadencia";
import { FERIADOS } from "./dados/feriados";

export type CodigoToque = "D0" | "D1" | "LIGACAO" | "SEXTA" | "D7" | "D3" | "D5" | "D8" | "D12" | "D15";

export const ROTULO_TOQUE: Record<CodigoToque, string> = {
  D0: "D0",
  D1: "D1",
  LIGACAO: "Ligação",
  SEXTA: "Sexta",
  D7: "D7",
  D3: "D3",
  D5: "D5",
  D8: "D8",
  D12: "D12",
  D15: "D15",
};

const SEXTA_FEIRA = 5;
const diaDaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay();

function diaUtilAnterior(dia: string, feriados: readonly string[]): string {
  let atual = diasDepois(dia, -1);
  while (!ehDiaUtil(atual, feriados)) atual = diasDepois(atual, -1);
  return atual;
}

function proximoDiaUtil(dia: string, feriados: readonly string[]): string {
  return ehDiaUtil(dia, feriados) ? dia : somarDiasUteis(dia, 1, feriados);
}

/** O D7: 7 dias corridos depois da reunião; em fim de semana ou feriado, o dia útil seguinte. */
export function dataDoD7(apresentadaEm: string, feriados: readonly string[] = FERIADOS): string {
  return proximoDiaUtil(diasDepois(apresentadaEm, 7), feriados);
}

/**
 * As datas da janela de 7 dias (docs/16, seção 2):
 * - D1 no dia útil seguinte; a ligação 2 dias úteis depois do D0, pulando a sexta;
 * - a sexta fixa na primeira sexta depois do D0 (feriado: o dia útil anterior, se não for o D0), e ela fica no lugar
 *   do toque que cairia no mesmo dia;
 * - reunião numa sexta: a sexta seguinte é o próprio D7, sem SEXTA separada.
 */
export function datasDaCadencia(
  apresentadaEm: string,
  feriados: readonly string[] = FERIADOS,
): { codigo: CodigoToque; previstoPara: string }[] {
  const d1 = somarDiasUteis(apresentadaEm, 1, feriados);
  let ligacao = somarDiasUteis(apresentadaEm, 2, feriados);
  if (diaDaSemana(ligacao) === SEXTA_FEIRA) ligacao = somarDiasUteis(ligacao, 1, feriados);

  let sexta: string | null = null;
  if (diaDaSemana(apresentadaEm) !== SEXTA_FEIRA) {
    let s = diasDepois(apresentadaEm, (SEXTA_FEIRA - diaDaSemana(apresentadaEm) + 7) % 7 || 7);
    if (!ehDiaUtil(s, feriados)) s = diaUtilAnterior(s, feriados);
    if (s > apresentadaEm) sexta = s;
  }

  const toques: { codigo: CodigoToque; previstoPara: string }[] = [
    { codigo: "D0", previstoPara: apresentadaEm },
    { codigo: "D1", previstoPara: d1 },
    { codigo: "LIGACAO", previstoPara: ligacao },
    ...(sexta ? [{ codigo: "SEXTA" as const, previstoPara: sexta }] : []),
    { codigo: "D7", previstoPara: dataDoD7(apresentadaEm, feriados) },
  ];
  return toques
    .filter((t) => !(sexta && t.previstoPara === sexta && (t.codigo === "D1" || t.codigo === "LIGACAO")))
    .sort((a, b) => a.previstoPara.localeCompare(b.previstoPara));
}

/** Canal, objetivo e mensagem de um toque; o D7 de uma reunião numa sexta, quando cai na sexta, junta as duas mensagens. */
export function modeloDoToque(codigo: CodigoToque, apresentadaEm: string, feriados: readonly string[] = FERIADOS): DadosDoToque {
  const dados = [...CADENCIA, ...TOQUES_ANTIGOS].find((t) => t.codigo === codigo)!;
  const reuniaoNaSexta = diaDaSemana(apresentadaEm) === SEXTA_FEIRA;
  if (codigo === "D7" && reuniaoNaSexta && diaDaSemana(dataDoD7(apresentadaEm, feriados)) === SEXTA_FEIRA) {
    return { ...dados, modelo: D7_NA_SEXTA };
  }
  return dados;
}

/** Canal de um toque, novo ou antigo ("" se o código não existir). */
export function canalDoToque(codigo: string): string {
  return [...CADENCIA, ...TOQUES_ANTIGOS].find((t) => t.codigo === codigo)?.canal ?? "";
}

/** Nome curto do toque para listas: "D1 · WhatsApp", "Ligação", "D3 · Ligação". */
export function nomeDoToque(codigo: string): string {
  const rotulo = ROTULO_TOQUE[codigo as CodigoToque] ?? codigo;
  const canal = canalDoToque(codigo);
  return !canal || canal === rotulo ? rotulo : `${rotulo} · ${canal}`;
}

/** Troca {chave} pelo valor; o que não tiver valor vira [rótulo] para o vendedor completar. */
export function preencherModelo(modelo: string, valores: Record<string, string | undefined>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, chave: string) => {
    const valor = valores[chave]?.trim();
    return valor ? valor : `[${VARIAVEIS[chave] ?? chave}]`;
  });
}
