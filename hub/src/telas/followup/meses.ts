import { diasDepois } from "../../../compartilhado/datas";

const NOME_DO_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Os próximos 12 meses para retomar uma oportunidade em nutrição: valor no 1º dia do mês, rótulo "dezembro de 2026". */
export function mesesParaRetomar(hoje: string, quantos = 12): { valor: string; rotulo: string }[] {
  const meses: { valor: string; rotulo: string }[] = [];
  let primeiro = `${hoje.slice(0, 7)}-01`;
  for (let i = 0; i < quantos; i++) {
    primeiro = `${diasDepois(primeiro, 32).slice(0, 7)}-01`;
    meses.push({ valor: primeiro, rotulo: NOME_DO_MES.format(new Date(`${primeiro}T12:00:00Z`)) });
  }
  return meses;
}
