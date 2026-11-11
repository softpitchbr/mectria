import type { Pessoa } from "../compartilhado/pessoa";

export type { Pessoa };

export interface Env {
  DB: D1Database;
  /** As apresentações em HTML de cada serviço (chave apresentacao/{id}). */
  APRESENTACOES: KVNamespace;
  AMBIENTE: "dev" | "producao";
  /** Equipe do Cloudflare Access, ex.: "mectria" em mectria.cloudflareaccess.com. */
  ACCESS_EQUIPE?: string;
  /** Audience (AUD) da aplicação do Access. */
  ACCESS_AUD?: string;
  /** E-mail do primeiro diretor, criado no primeiro acesso com o banco vazio. */
  DIRETOR_INICIAL?: string;
  /** Só em dev local (.dev.vars): e-mail usado quando o navegador não manda X-Dev-Email. */
  DEV_EMAIL?: string;
}

/** O que o middleware de /api deixa em context.data para as rotas. */
export interface DadosApi extends Record<string, unknown> {
  pessoa: Pessoa;
}
