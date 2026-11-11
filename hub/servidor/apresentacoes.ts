import type { Servico } from "../compartilhado/servico";
import { COLUNAS_SERVICO, buscarServico, servicoDeLinha, type LinhaServico } from "./servicos";
import type { Env, Pessoa } from "./tipos";

type Ambiente = Pick<Env, "DB" | "APRESENTACOES">;

const chave = (servicoId: string) => `apresentacao/${servicoId}`;

/**
 * Como o HTML da apresentação é servido. Ele nunca roda com a origem do hub: o sandbox sem
 * allow-same-origin dá a ele uma origem própria (sem o login), mesmo aberto direto no navegador,
 * e o connect-src 'none' o impede de falar com a internet. Só o hub pode colocá-lo num iframe.
 */
export const CABECALHOS_DA_APRESENTACAO: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": [
    "sandbox allow-scripts",
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    "font-src data: https://fonts.gstatic.com",
    "img-src data: blob:",
    "media-src data: blob:",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "private, max-age=3600",
};

/** Grava o HTML no KV e, depois, a versão nova no serviço. Null se o serviço não existe. */
export async function salvarApresentacao(env: Ambiente, servicoId: string, a: { arquivo: string; html: string }, autor: Pessoa): Promise<Servico | null> {
  if (!(await buscarServico(env.DB, servicoId))) return null;
  await env.APRESENTACOES.put(chave(servicoId), a.html);
  // No SET, apresentacao_versao ainda é o valor antigo: a versão do JSON sai igual à da coluna nova.
  const l = await env.DB.prepare(
    `UPDATE servicos SET apresentacao_versao = apresentacao_versao + 1,
       apresentacao = json_object('arquivo', ?2, 'bytes', ?3, 'versao', apresentacao_versao + 1, 'enviadaEm', datetime('now'), 'enviadaPor', ?4),
       atualizado_por = ?4, atualizado_em = datetime('now')
     WHERE id = ?1 RETURNING ${COLUNAS_SERVICO}`,
  )
    .bind(servicoId, a.arquivo, new TextEncoder().encode(a.html).length, autor.nome)
    .first<LinhaServico>();
  return l ? servicoDeLinha(l) : null;
}

/** Tira a apresentação do serviço (a reunião volta para a de exemplo). A versão não volta. */
export async function removerApresentacao(env: Ambiente, servicoId: string, autor: Pessoa): Promise<Servico | null> {
  const l = await env.DB.prepare(
    `UPDATE servicos SET apresentacao = NULL, atualizado_por = ?2, atualizado_em = datetime('now') WHERE id = ?1 RETURNING ${COLUNAS_SERVICO}`,
  )
    .bind(servicoId, autor.nome)
    .first<LinhaServico>();
  if (!l) return null;
  await env.APRESENTACOES.delete(chave(servicoId));
  return servicoDeLinha(l);
}

export async function lerApresentacao(env: Ambiente, servicoId: string): Promise<string | null> {
  return env.APRESENTACOES.get(chave(servicoId));
}
