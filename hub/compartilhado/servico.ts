import type { Pergunta } from "./dados/diagnostica";
import type { IdPacto } from "./proposta";

/** Ativo e em estruturação podem ser vendidos; o inativo sai das listas de oportunidade nova. Nada é apagado. */
export type SituacaoServico = "ativo" | "em_estruturacao" | "inativo";

export const ROTULO_SITUACAO_SERVICO: Record<SituacaoServico, string> = {
  ativo: "Ativo",
  em_estruturacao: "Em estruturação",
  inativo: "Inativo",
};

/** Pergunta técnica da diagnóstica. A desativada sai das diagnósticas novas e continua nos briefings já respondidos. */
export interface PerguntaTecnica extends Pergunta {
  inativa?: boolean;
}

/** Um slide do roteiro da apresentação de proposta: o que o painel mostra (o slide em si é o HTML). */
export interface SlideDoRoteiro {
  id: string;
  titulo: string;
  fala: string;
  dica?: string;
  pacto: IdPacto | null;
  /** Minutos. */
  tempo: number;
}

/** O arquivo HTML anexado ao serviço (o conteúdo fica no Workers KV). */
export interface ArquivoDaApresentacao {
  arquivo: string;
  bytes: number;
  versao: number;
  enviadaEm: string;
  enviadaPor: string;
}

export interface Servico {
  id: string;
  nome: string;
  sigla: string;
  resumo: string;
  dores: string[];
  entregamos: string[];
  ficaComCliente: string[];
  ancoraValor: string;
  situacao: SituacaoServico;
  perguntas: PerguntaTecnica[];
  /** null: a reunião usa o roteiro padrão (o da apresentação de exemplo). */
  roteiro: SlideDoRoteiro[] | null;
  /** null: sem apresentação própria; a reunião usa a de exemplo. */
  apresentacao: ArquivoDaApresentacao | null;
}

/** O que o diretor manda ao criar ou editar um serviço. */
export type DadosDoServico = Omit<Servico, "id" | "apresentacao">;

export const vendavel = (s: Pick<Servico, "situacao">): boolean => s.situacao !== "inativo";

/** "Adequação à NR-12" vira "adequacao-a-nr-12". */
export function idDoServico(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** O endereço do HTML do serviço, com a versão (troca o cache a cada envio). */
export function urlDaApresentacao(s: Pick<Servico, "id" | "apresentacao">): string | null {
  return s.apresentacao ? `/api/servicos/${encodeURIComponent(s.id)}/apresentacao?v=${s.apresentacao.versao}` : null;
}
