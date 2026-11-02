import { instanteLocal } from "../../../compartilhado/datas";

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

/** "faltam 2 h 15 min" até a reunião; "começou" quando já passou. */
export function quantoFalta(dataHora: string, agora: Date = new Date()): { texto: string; minutos: number } {
  const minutos = Math.round((instanteLocal(dataHora).getTime() - agora.getTime()) / 60_000);
  if (minutos <= 0) return { texto: "começou", minutos: 0 };
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const resto = minutos % 60;
  if (dias > 0) return { texto: `faltam ${dias} d ${horas} h`, minutos };
  if (horas > 0) return { texto: `faltam ${horas} h ${resto} min`, minutos };
  return { texto: `faltam ${resto} min`, minutos };
}
