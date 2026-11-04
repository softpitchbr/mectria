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
  quemDecide: string | null;
  iniciadaEm: string | null;
  encerradaEm: string | null;
  resultado: "proposta_marcada" | "nao_qualificou" | null;
  motivo: string | null;
  briefingEnviadoEm: string | null;
  /** Em que situação está a oportunidade agora (a diagnóstica só anda enquanto ela está em diagnostica_marcada). */
  oportunidadeSituacao: Situacao;
  /** Como terminou a reunião de proposta (null na diagnóstica e enquanto não encerra). */
  desfecho: import("./proposta").DesfechoProposta | null;
  /** Observações de quem marcou a diagnóstica (fase 7). */
  observacoes?: string | null;
  /** Último FUP de confirmação enviado (0 a 3) e quando o lead confirmou (fase 7). */
  fupsConfirmacao?: number;
  confirmadaEm?: string | null;
  /** Nome do contato da oportunidade, para as mensagens da confirmação (fase 7). */
  contato?: string;
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
  /** O que importa da ligação ou do WhatsApp (fase 7), até 1.000 caracteres. */
  observacoes?: string;
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
  /** Pendências técnicas já respondidas por Projetos, para entrar no próximo toque (fase 6). */
  respostasTecnicas?: Pendencia[];
}

export type ResultadoProposta = { resultado: "ganha"; valor: number } | { resultado: "perdida"; motivo: string } | { resultado: "nutricao"; retomarEm?: string };

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
  /** Só hunters: conexões da semana até hoje (fase 7). */
  conexoesSemana?: number;
}

export interface ContagemLigacoes {
  total: number;
  naoAtendeu: number;
  atendeu: number;
  marcou: number;
  meta: number;
  /** Falou com quem decide, sem marcar (fase 7). */
  conexao: number;
  /** Conexões (conexão + marcou) de segunda até o dia, e a meta da semana. */
  conexoesSemana: number;
  metaConexoesSemana: number;
}

export type ResultadoLigacao = "nao_atendeu" | "atendeu" | "conexao" | "marcou";

export interface Pendencia {
  id: number;
  anotacaoId: number | null;
  oportunidadeId: number;
  texto: string;
  prazo: string;
  situacao: "aberta" | "respondida" | "fechada";
  resposta: string | null;
  /** Quando e quem de Projetos respondeu (fase 6). */
  respondidaEm?: string | null;
  respondidaPor?: string | null;
}

/** Pendência na lista de Projetos: a empresa, a reunião de onde veio e o estado do prazo. */
export interface PendenciaDeProjetos {
  pendencia: Pendencia;
  empresa: string;
  reuniaoId: number | null;
  estado: "atrasada" | "hoje" | "no_prazo" | "respondida";
}

export type FechamentoDiagnostica =
  | { resultado: "proposta_marcada"; dataHora: string; formato: "online" | "presencial"; quemDecide: string }
  | { resultado: "nao_qualificou"; motivo: string; retomarEm?: string };

export interface FichaCompleta {
  reuniao: Reuniao;
  oportunidade: Oportunidade;
  respostas: Record<string, string>;
  anotacoes: import("./diagnostica").Anotacao[];
  pendencias: Pendencia[];
  /** A reunião de proposta combinada no fechamento (null enquanto não há). */
  proximaReuniao: Reuniao | null;
}

/** A reunião ainda pode andar: a oportunidade continua na etapa dela (diagnóstica marcada ou proposta marcada). */
export function oportunidadeNaEtapa(r: Pick<Reuniao, "tipo" | "oportunidadeSituacao">): boolean {
  return r.oportunidadeSituacao === (r.tipo === "diagnostica" ? "diagnostica_marcada" : "proposta_marcada");
}
