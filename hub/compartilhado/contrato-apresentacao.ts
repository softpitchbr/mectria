/**
 * O contrato entre o hub e a apresentação em HTML de um serviço (hub/apresentacoes/CONTRATO.md).
 * As mensagens vão por postMessage entre a janela da reunião e o iframe. Toda mensagem tem mectria: 1.
 * O que vem da apresentação é lido por lerMensagemDaApresentacao: o resto é ignorado.
 */

export const VERSAO_DO_CONTRATO = 1;

/** O que a apresentação contou ao hub na reunião. Fica gravado no andamento e volta se a janela reabrir. */
export interface Interacoes {
  dores: string[];
  precoEtapa: number;
  calculadora: Record<string, number>;
}

export const INTERACOES_VAZIAS: Interacoes = Object.freeze({ dores: [], precoEtapa: 0, calculadora: {} }) as Interacoes;

/** Um botão que o painel mostra no slide (ex.: "Revelar o preço"). */
export interface AcaoDoSlide {
  slide: number;
  id: string;
  rotulo: string;
}

/** Um número da calculadora que o painel também pode digitar. */
export type CampoDoSlide = AcaoDoSlide;

/** Do hub para a apresentação. */
export type ParaApresentacao =
  | { mectria: 1; tipo: "estado"; slide: number; dados: Record<string, string>; interacoes: Interacoes }
  | { mectria: 1; tipo: "slide"; slide: number }
  | { mectria: 1; tipo: "acionar"; acao: string }
  | { mectria: 1; tipo: "calcular"; valores: Record<string, number> };

export type EventoDaApresentacao =
  | { evento: "dor"; valor: string; marcada: boolean }
  | { evento: "preco"; etapa: number }
  | { evento: "calculadora"; valores: Record<string, number> };

/** Da apresentação para o hub. */
export type DaApresentacao =
  | { mectria: 1; tipo: "pronta"; slides: number; acoes: AcaoDoSlide[]; campos: CampoDoSlide[] }
  | ({ mectria: 1; tipo: "evento" } & EventoDaApresentacao)
  | { mectria: 1; tipo: "tecla"; tecla: "ArrowRight" | "ArrowLeft" };

const LIMITES = { slides: 60, acoes: 60, campos: 20, dores: 20, numeros: 20, etapa: 10, texto: 200, rotulo: 60, numero: 1e12 };
const ID = /^[a-z0-9-]{1,40}$/;
const CHAVE_NUMERO = /^[A-Za-z0-9_-]{1,40}$/;

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const inteiroEntre = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const textoEntre = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;

function lerItensDoSlide(v: unknown, max: number): AcaoDoSlide[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > max) return null;
  const itens: AcaoDoSlide[] = [];
  for (const a of v) {
    if (!ehObjeto(a) || !inteiroEntre(a.slide, 0, LIMITES.slides - 1) || typeof a.id !== "string" || !ID.test(a.id) || !textoEntre(a.rotulo, LIMITES.rotulo)) return null;
    itens.push({ slide: a.slide, id: a.id, rotulo: a.rotulo.trim() });
  }
  return itens;
}

export function lerNumeros(v: unknown): Record<string, number> | null {
  if (!ehObjeto(v)) return null;
  const entradas = Object.entries(v);
  if (entradas.length > LIMITES.numeros) return null;
  for (const [chave, n] of entradas) {
    if (!CHAVE_NUMERO.test(chave) || typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > LIMITES.numero) return null;
  }
  return Object.fromEntries(entradas) as Record<string, number>;
}

function lerEvento(d: Record<string, unknown>): EventoDaApresentacao | null {
  if (d.evento === "dor") return textoEntre(d.valor, LIMITES.texto) && typeof d.marcada === "boolean" ? { evento: "dor", valor: d.valor.trim(), marcada: d.marcada } : null;
  if (d.evento === "preco") return inteiroEntre(d.etapa, 0, LIMITES.etapa) ? { evento: "preco", etapa: d.etapa } : null;
  if (d.evento === "calculadora") {
    const valores = lerNumeros(d.valores);
    return valores ? { evento: "calculadora", valores } : null;
  }
  return null;
}

/** A mensagem do iframe, já conferida e cortada nos limites; null para o que não é do contrato. */
export function lerMensagemDaApresentacao(dado: unknown): DaApresentacao | null {
  if (!ehObjeto(dado) || dado.mectria !== VERSAO_DO_CONTRATO) return null;
  if (dado.tipo === "pronta") {
    if (!inteiroEntre(dado.slides, 1, LIMITES.slides)) return null;
    const acoes = lerItensDoSlide(dado.acoes, LIMITES.acoes);
    const campos = lerItensDoSlide(dado.campos, LIMITES.campos);
    return acoes && campos ? { mectria: 1, tipo: "pronta", slides: dado.slides, acoes, campos } : null;
  }
  if (dado.tipo === "tecla") return dado.tecla === "ArrowRight" || dado.tecla === "ArrowLeft" ? { mectria: 1, tipo: "tecla", tecla: dado.tecla } : null;
  if (dado.tipo === "evento") {
    const evento = lerEvento(dado);
    return evento ? { mectria: 1, tipo: "evento", ...evento } : null;
  }
  return null;
}

/** As interações gravadas no andamento (o servidor confere com isto). */
export function lerInteracoes(dado: unknown): Interacoes | null {
  if (!ehObjeto(dado) || !Array.isArray(dado.dores) || dado.dores.length > LIMITES.dores) return null;
  if (!dado.dores.every((d) => textoEntre(d, LIMITES.texto)) || !inteiroEntre(dado.precoEtapa, 0, LIMITES.etapa)) return null;
  const calculadora = lerNumeros(dado.calculadora);
  return calculadora ? { dores: dado.dores as string[], precoEtapa: dado.precoEtapa, calculadora } : null;
}

export function aplicarEvento(i: Interacoes, e: EventoDaApresentacao): Interacoes {
  if (e.evento === "dor") {
    const sem = i.dores.filter((d) => d !== e.valor);
    return { ...i, dores: e.marcada ? [...sem, e.valor].slice(-LIMITES.dores) : sem };
  }
  if (e.evento === "preco") return { ...i, precoEtapa: e.etapa };
  return { ...i, calculadora: { ...e.valores } };
}
