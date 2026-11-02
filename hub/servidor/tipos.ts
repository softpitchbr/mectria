import type { Cargo } from "../compartilhado/cargos";

export interface Env {
  DB: D1Database;
  AMBIENTE: "dev" | "producao";
  /** Equipe do Cloudflare Access, ex.: "mectria" em mectria.cloudflareaccess.com. */
  ACCESS_EQUIPE?: string;
  /** Audience (AUD) da aplicação do Access. */
  ACCESS_AUD?: string;
  /** E-mail do primeiro diretor, criado no primeiro acesso com o banco vazio. */
  DIRETOR_INICIAL?: string;
}

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/** O que o middleware de /api deixa em context.data para as rotas. */
export interface DadosApi extends Record<string, unknown> {
  pessoa: Pessoa;
}
