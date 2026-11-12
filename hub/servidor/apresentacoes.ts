import type { Servico } from "../compartilhado/servico";
import { COLUNAS_SERVICO, servicoDeLinha, type LinhaServico } from "./servicos";
import type { Env, Pessoa } from "./tipos";

type Ambiente = Pick<Env, "DB" | "APRESENTACOES">;

/**
 * Cada versão tem a chave dela (apresentacao/{id}/{versao}). O KV demora a propagar: com a chave por versão,
 * o endereço ?v=N nunca recebe o HTML de outra versão, e a anterior continua no endereço dela até a seguinte.
 */
const chave = (servicoId: string, versao: number) => `apresentacao/${servicoId}/${versao}`;

async function versaoAtual(env: Ambiente, servicoId: string): Promise<number | null> {
  const l = await env.DB.prepare("SELECT apresentacao_versao FROM servicos WHERE id = ?1").bind(servicoId).first<{ apresentacao_versao: number }>();
  return l ? l.apresentacao_versao : null;
}

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

/**
 * Grava o HTML na chave da versão nova e, depois, a versão no serviço (só se ninguém enviou outra no meio:
 * aí lança "conflito"). Apaga a chave de duas versões atrás. Null se o serviço não existe.
 */
export async function salvarApresentacao(env: Ambiente, servicoId: string, a: { arquivo: string; html: string }, autor: Pessoa): Promise<Servico | null> {
  const anterior = await versaoAtual(env, servicoId);
  if (anterior === null) return null;
  const nova = anterior + 1;
  await env.APRESENTACOES.put(chave(servicoId, nova), a.html);
  const l = await env.DB.prepare(
    `UPDATE servicos SET apresentacao_versao = ?5,
       apresentacao = json_object('arquivo', ?2, 'bytes', ?3, 'versao', ?5, 'enviadaEm', datetime('now'), 'enviadaPor', ?4),
       atualizado_por = ?4, atualizado_em = datetime('now')
     WHERE id = ?1 AND apresentacao_versao = ?6 RETURNING ${COLUNAS_SERVICO}`,
  )
    .bind(servicoId, a.arquivo, new TextEncoder().encode(a.html).length, autor.nome, nova, anterior)
    .first<LinhaServico>();
  if (!l) {
    await env.APRESENTACOES.delete(chave(servicoId, nova));
    throw new Error("conflito");
  }
  if (anterior > 1) await env.APRESENTACOES.delete(chave(servicoId, anterior - 1));
  return servicoDeLinha(l);
}

/** Tira a apresentação do serviço (a reunião volta para a de exemplo). A versão não volta. */
export async function removerApresentacao(env: Ambiente, servicoId: string, autor: Pessoa): Promise<Servico | null> {
  const versao = await versaoAtual(env, servicoId);
  const l = await env.DB.prepare(
    `UPDATE servicos SET apresentacao = NULL, atualizado_por = ?2, atualizado_em = datetime('now') WHERE id = ?1 RETURNING ${COLUNAS_SERVICO}`,
  )
    .bind(servicoId, autor.nome)
    .first<LinhaServico>();
  if (!l) return null;
  if (versao) await Promise.all([env.APRESENTACOES.delete(chave(servicoId, versao)), env.APRESENTACOES.delete(chave(servicoId, versao - 1))]);
  return servicoDeLinha(l);
}

/** O HTML de uma versão (a do ?v= do endereço). */
export async function lerApresentacao(env: Ambiente, servicoId: string, versao: number): Promise<string | null> {
  return env.APRESENTACOES.get(chave(servicoId, versao));
}
