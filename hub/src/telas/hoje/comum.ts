import { oportunidadeNaEtapa, type Reuniao } from "../../../compartilhado/oportunidade";
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

/** Por quanto tempo uma reunião marcada continua como "a próxima" depois do horário (o closer pode começar atrasado). */
const TOLERANCIA_MIN = 60;

/**
 * A reunião que o cartão do Hoje mostra: a em andamento, ou a primeira marcada que ainda não passou
 * da tolerância. Ficam de fora as canceladas, as concluídas e as reuniões cuja oportunidade já passou da etapa.
 */
export function proximaReuniao(reunioes: Reuniao[], agora: Date = new Date()): Reuniao | undefined {
  const valida = (r: Reuniao) => r.situacao !== "cancelada" && r.situacao !== "concluida" && oportunidadeNaEtapa(r);
  const ordenadas = reunioes.filter(valida).sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  return (
    ordenadas.find((r) => r.situacao === "em_andamento") ??
    ordenadas.find((r) => instanteLocal(r.dataHora).getTime() + TOLERANCIA_MIN * 60_000 > agora.getTime())
  );
}
