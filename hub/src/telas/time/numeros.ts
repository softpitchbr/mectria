import { diasDepois } from "../../../compartilhado/datas";

const NOME_DO_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** 0,5 vira "50%"; sem número, "—". */
export function formatarPercentual(fracao: number | null): string {
  return fracao === null ? "—" : `${Math.round(fracao * 100)}%`;
}

/** Os últimos 12 meses (AAAA-MM), do atual para trás, com o nome por extenso ("novembro de 2026"). */
export function ultimosMeses(hoje: string, quantos = 12): { valor: string; rotulo: string }[] {
  const meses: { valor: string; rotulo: string }[] = [];
  let primeiro = `${hoje.slice(0, 7)}-01`;
  for (let i = 0; i < quantos; i++) {
    meses.push({ valor: primeiro.slice(0, 7), rotulo: NOME_DO_MES.format(new Date(`${primeiro}T12:00:00Z`)) });
    primeiro = `${diasDepois(primeiro, -1).slice(0, 7)}-01`;
  }
  return meses;
}
