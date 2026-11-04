import { FERIADOS } from "./dados/feriados";

const DIA_EM_SAO_PAULO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** O dia de hoje em São Paulo, como AAAA-MM-DD (o servidor roda em UTC). */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return DIA_EM_SAO_PAULO.format(agora);
}

// Contas de dia ao meio-dia UTC, para nunca escorregar para o dia vizinho.
const paraData = (dia: string) => new Date(`${dia}T12:00:00Z`);
const paraTexto = (d: Date) => d.toISOString().slice(0, 10);
const UM_DIA = 86_400_000;

export function ehDiaUtil(dia: string, feriados: readonly string[] = FERIADOS): boolean {
  const semana = paraData(dia).getUTCDay();
  return semana !== 0 && semana !== 6 && !feriados.includes(dia);
}

/** Soma n dias úteis a um dia (n = 0 devolve o próprio dia). */
export function somarDiasUteis(dia: string, n: number, feriados: readonly string[] = FERIADOS): string {
  let atual = paraData(dia);
  let faltam = n;
  while (faltam > 0) {
    atual = new Date(atual.getTime() + UM_DIA);
    if (ehDiaUtil(paraTexto(atual), feriados)) faltam--;
  }
  return paraTexto(atual);
}

/** A segunda-feira da semana do dia (a semana vai de segunda a domingo). */
export function inicioDaSemana(dia: string): string {
  const semana = paraData(dia).getUTCDay();
  return diasDepois(dia, -((semana + 6) % 7));
}

/** Dia + n dias de calendário. */
export function diasDepois(dia: string, n: number): string {
  return paraTexto(new Date(paraData(dia).getTime() + n * UM_DIA));
}

/** Lê "AAAA-MM-DDTHH:MM" como hora de São Paulo (UTC−3, sem horário de verão). */
export function instanteLocal(dataHora: string): Date {
  return new Date(`${dataHora}:00-03:00`);
}

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** "2026-11-09" vira "Seg, 9/11". */
export function formatarDia(dia: string): string {
  const d = paraData(dia);
  return `${DIAS_CURTOS[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Centavos para "R$ 12.500,00" (com espaço comum, não o espaço fixo do Intl). */
export function formatarReais(centavos: number): string {
  return REAIS.format(centavos / 100).replace(/ /g, " ");
}

const VALOR_COM_MILHAR = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/;
const VALOR_SIMPLES = /^\d+(,\d{1,2})?$/;

/** "12.500,00", "12500" ou "R$ 12.500" viram centavos; o que não é valor em reais vira null. */
export function lerReais(texto: string): number | null {
  const limpo = texto.replace(/R\$/i, "").replace(/\s/g, "");
  if (!VALOR_COM_MILHAR.test(limpo) && !VALOR_SIMPLES.test(limpo)) return null;
  const [inteiro, fracao = ""] = limpo.replace(/\./g, "").split(",");
  return Number(inteiro) * 100 + Number(fracao.padEnd(2, "0"));
}
