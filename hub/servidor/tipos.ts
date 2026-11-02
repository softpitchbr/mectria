import type { Pessoa } from "../compartilhado/pessoa";

export type { Pessoa };

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

/** O que o middleware de /api deixa em context.data para as rotas. */
export interface DadosApi extends Record<string, unknown> {
  pessoa: Pessoa;
}
