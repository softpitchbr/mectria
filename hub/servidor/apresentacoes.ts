import type { ApresentacaoGeral, ArquivoDaApresentacao, IdApresentacaoGeral, Servico } from "../compartilhado/servico";
import { IDS_APRESENTACAO_GERAL } from "../compartilhado/servico";
import { buscarServico } from "./servicos";
import type { Env, Pessoa } from "./tipos";

type Ambiente = Pick<Env, "DB" | "APRESENTACOES">;

/** Onde a apresentação está anexada: a um serviço (a de proposta) ou geral (a da diagnóstica). */
type Lugar = { tipo: "servico"; id: string } | { tipo: "geral"; id: IdApresentacaoGeral };

const TABELA = { servico: "servicos", geral: "apresentacoes_gerais" } as const;

/**
 * Cada versão tem a chave dela (apresentacao/{id}/{versao} ou geral/{id}/{versao}). O KV demora a propagar:
 * com a chave por versão, o endereço ?v=N nunca recebe o HTML de outra versão, e a anterior continua no
 * endereço dela até a seguinte.
 */
const chave = (l: Lugar, versao: number) => `${l.tipo === "servico" ? "apresentacao" : "geral"}/${l.id}/${versao}`;

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

async function versaoAtual(env: Ambiente, l: Lugar): Promise<number | null> {
  const linha = await env.DB.prepare(`SELECT apresentacao_versao FROM ${TABELA[l.tipo]} WHERE id = ?1`).bind(l.id).first<{ apresentacao_versao: number }>();
  return linha ? linha.apresentacao_versao : null;
}

/**
 * Grava o HTML na chave da versão nova e, depois, a versão na tabela (só se ninguém enviou outra no meio:
 * aí lança "conflito"). Apaga a chave de duas versões atrás. False se o lugar não existe.
 */
async function gravar(env: Ambiente, l: Lugar, a: { arquivo: string; html: string }, autor: Pessoa): Promise<boolean> {
  const anterior = await versaoAtual(env, l);
  if (anterior === null) return false;
  const nova = anterior + 1;
  await env.APRESENTACOES.put(chave(l, nova), a.html);
  const linha = await env.DB.prepare(
    `UPDATE ${TABELA[l.tipo]} SET apresentacao_versao = ?5,
       apresentacao = json_object('arquivo', ?2, 'bytes', ?3, 'versao', ?5, 'enviadaEm', datetime('now'), 'enviadaPor', ?4),
       atualizado_por = ?4, atualizado_em = datetime('now')
     WHERE id = ?1 AND apresentacao_versao = ?6 RETURNING id`,
  )
    .bind(l.id, a.arquivo, new TextEncoder().encode(a.html).length, autor.nome, nova, anterior)
    .first();
  if (!linha) {
    await env.APRESENTACOES.delete(chave(l, nova));
    throw new Error("conflito");
  }
  if (anterior > 1) await env.APRESENTACOES.delete(chave(l, anterior - 1));
  return true;
}

/** Tira a apresentação (o serviço volta para a de exemplo; a diagnóstica, para sem janela). A versão não volta. */
async function remover(env: Ambiente, l: Lugar, autor: Pessoa): Promise<boolean> {
  const versao = await versaoAtual(env, l);
  const linha = await env.DB.prepare(
    `UPDATE ${TABELA[l.tipo]} SET apresentacao = NULL, atualizado_por = ?2, atualizado_em = datetime('now') WHERE id = ?1 RETURNING id`,
  )
    .bind(l.id, autor.nome)
    .first();
  if (!linha) return false;
  if (versao) await Promise.all([env.APRESENTACOES.delete(chave(l, versao)), env.APRESENTACOES.delete(chave(l, versao - 1))]);
  return true;
}

// Serviços (a apresentação de proposta) -----------------------------------------------

export async function salvarApresentacao(env: Ambiente, servicoId: string, a: { arquivo: string; html: string }, autor: Pessoa): Promise<Servico | null> {
  return (await gravar(env, { tipo: "servico", id: servicoId }, a, autor)) ? buscarServico(env.DB, servicoId) : null;
}

export async function removerApresentacao(env: Ambiente, servicoId: string, autor: Pessoa): Promise<Servico | null> {
  return (await remover(env, { tipo: "servico", id: servicoId }, autor)) ? buscarServico(env.DB, servicoId) : null;
}

/** O HTML de uma versão (a do ?v= do endereço). */
export async function lerApresentacao(env: Ambiente, servicoId: string, versao: number): Promise<string | null> {
  return env.APRESENTACOES.get(chave({ tipo: "servico", id: servicoId }, versao));
}

// Apresentações gerais (a da diagnóstica) ---------------------------------------------

export const ehIdGeral = (id: string): id is IdApresentacaoGeral => (IDS_APRESENTACAO_GERAL as readonly string[]).includes(id);

export async function listarApresentacoesGerais(db: D1Database): Promise<ApresentacaoGeral[]> {
  const { results } = await db.prepare("SELECT id, apresentacao FROM apresentacoes_gerais ORDER BY id").all<{ id: IdApresentacaoGeral; apresentacao: string | null }>();
  return results.map((l) => ({ id: l.id, apresentacao: l.apresentacao ? (JSON.parse(l.apresentacao) as ArquivoDaApresentacao) : null }));
}

const buscarGeral = async (db: D1Database, id: IdApresentacaoGeral) => (await listarApresentacoesGerais(db)).find((g) => g.id === id) ?? null;

export async function salvarApresentacaoGeral(env: Ambiente, id: IdApresentacaoGeral, a: { arquivo: string; html: string }, autor: Pessoa): Promise<ApresentacaoGeral | null> {
  return (await gravar(env, { tipo: "geral", id }, a, autor)) ? buscarGeral(env.DB, id) : null;
}

export async function removerApresentacaoGeral(env: Ambiente, id: IdApresentacaoGeral, autor: Pessoa): Promise<ApresentacaoGeral | null> {
  return (await remover(env, { tipo: "geral", id }, autor)) ? buscarGeral(env.DB, id) : null;
}

export async function lerApresentacaoGeral(env: Ambiente, id: IdApresentacaoGeral, versao: number): Promise<string | null> {
  return env.APRESENTACOES.get(chave({ tipo: "geral", id }, versao));
}
