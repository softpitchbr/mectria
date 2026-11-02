export type Situacao = "diagnostica_marcada" | "proposta_marcada" | "em_followup" | "ganha" | "perdida" | "nutricao";

export const SITUACOES: Situacao[] = ["diagnostica_marcada", "proposta_marcada", "em_followup", "ganha", "perdida", "nutricao"];

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  diagnostica_marcada: "Diagnóstica marcada",
  proposta_marcada: "Proposta marcada",
  em_followup: "Em follow-up",
  ganha: "Ganha",
  perdida: "Perdida",
  nutricao: "Nutrição",
};

export interface Oportunidade {
  id: number;
  empresa: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  segmento: string;
  origem: string;
  servico: string;
  hunterId: number | null;
  closerId: number | null;
  closerNome: string | null;
  situacao: Situacao;
  motivoPerda: string | null;
  /** Centavos. */
  valorFechado: number | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Reuniao {
  id: number;
  oportunidadeId: number;
  empresa: string;
  tipo: "diagnostica" | "proposta";
  /** AAAA-MM-DDTHH:MM, hora de São Paulo. */
  dataHora: string;
  formato: "online" | "presencial";
  situacao: "marcada" | "em_andamento" | "concluida" | "cancelada";
  closerId: number | null;
  closerNome: string | null;
}

export interface NovaDiagnostica {
  empresa: string;
  contato: string;
  telefone: string;
  email?: string;
  cidade?: string;
  segmento?: string;
  servico: string;
  closerId: number;
  dataHora: string;
  formato: "online" | "presencial";
}
