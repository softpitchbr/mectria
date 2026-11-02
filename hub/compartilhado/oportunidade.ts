import type { CodigoToque } from "./cadencia";

export const CANAIS_DE_TOQUE = ["WhatsApp", "Ligação", "E-mail", "Presencial"] as const;

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

export interface Proposta {
  id: number;
  oportunidadeId: number;
  servico: string;
  /** Centavos. */
  valor: number;
  apresentadaEm: string;
  dataDecisao: string | null;
  quemDecide: string;
  dor: string;
  validade: string | null;
}

export interface NovaProposta {
  oportunidadeId?: number;
  empresa?: string;
  contato?: string;
  telefone?: string;
  servico: string;
  /** Centavos. */
  valor: number;
  apresentadaEm: string;
  dataDecisao?: string;
  quemDecide: string;
  dor?: string;
  validade?: string;
}

export interface Toque {
  id: number;
  propostaId: number;
  codigo: CodigoToque;
  previstoPara: string;
  feitoEm: string | null;
  canal: string | null;
  resultado: string | null;
}

export type EstadoFollowup = "atrasado" | "hoje" | "em_dia" | "sem_toque";

export interface ItemFollowup {
  oportunidade: Oportunidade;
  proposta: Proposta;
  proximo: Toque | null;
  atrasados: number;
  estado: EstadoFollowup;
}

export type ResultadoProposta = { resultado: "ganha"; valor: number } | { resultado: "perdida"; motivo: string } | { resultado: "nutricao" };

export interface ItemRotina {
  chave: string;
  titulo: string;
  origem: "fixo" | "gerado";
  feito: boolean;
  /** Marca sozinho (ligações, toques): não tem checkbox. */
  automatico: boolean;
  contagem?: { feitas: number; meta: number };
  link?: string;
}

export interface DiaDeRotina {
  dia: string;
  itens: ItemRotina[];
  feitos: number;
  total: number;
}

export interface ResumoPessoa {
  pessoa: { id: number; nome: string; cargo: string };
  rotina: { feitos: number; total: number };
  atrasados: number;
}

export interface ContagemLigacoes {
  total: number;
  naoAtendeu: number;
  atendeu: number;
  marcou: number;
  meta: number;
}

export type ResultadoLigacao = "nao_atendeu" | "atendeu" | "marcou";
