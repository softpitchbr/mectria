import type { Cargo } from "../compartilhado/cargos";
import { normalizarEmail } from "../compartilhado/texto";
import type { Pessoa } from "./tipos";

interface Linha {
  id: number;
  nome: string;
  email: string;
  cargo: Cargo;
  ativo: number;
  criado_em: string;
  atualizado_em: string;
}

function deLinha(l: Linha): Pessoa {
  return {
    id: l.id,
    nome: l.nome,
    email: l.email,
    cargo: l.cargo,
    ativo: l.ativo === 1,
    criadoEm: l.criado_em,
    atualizadoEm: l.atualizado_em,
  };
}

export async function buscarPorEmail(db: D1Database, email: string): Promise<Pessoa | null> {
  const l = await db.prepare("SELECT * FROM pessoas WHERE email = ?").bind(normalizarEmail(email)).first<Linha>();
  return l ? deLinha(l) : null;
}

export async function buscarPorId(db: D1Database, id: number): Promise<Pessoa | null> {
  const l = await db.prepare("SELECT * FROM pessoas WHERE id = ?").bind(id).first<Linha>();
  return l ? deLinha(l) : null;
}

const ORDEM_PT = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Ativas primeiro, depois por nome na ordem do português (Álvaro antes de Bruno). */
export async function listar(db: D1Database): Promise<Pessoa[]> {
  const { results } = await db.prepare("SELECT * FROM pessoas").all<Linha>();
  return results
    .map(deLinha)
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || ORDEM_PT.compare(a.nome, b.nome) || a.id - b.id);
}

export async function criar(db: D1Database, dados: { nome: string; email: string; cargo: Cargo }): Promise<Pessoa> {
  try {
    const l = await db
      .prepare("INSERT INTO pessoas (nome, email, cargo) VALUES (?, ?, ?) RETURNING *")
      .bind(dados.nome, normalizarEmail(dados.email), dados.cargo)
      .first<Linha>();
    if (!l) throw new Error("falha_ao_criar");
    return deLinha(l);
  } catch (e) {
    if (e instanceof Error && /UNIQUE constraint failed/i.test(e.message)) throw new Error("email_duplicado");
    throw e;
  }
}

type Mudancas = Partial<Pick<Pessoa, "nome" | "cargo" | "ativo">>;

function montarSet(mudancas: Mudancas): { sql: string; valores: (string | number)[] } {
  const campos: string[] = [];
  const valores: (string | number)[] = [];
  if (mudancas.nome !== undefined) {
    campos.push("nome = ?");
    valores.push(mudancas.nome);
  }
  if (mudancas.cargo !== undefined) {
    campos.push("cargo = ?");
    valores.push(mudancas.cargo);
  }
  if (mudancas.ativo !== undefined) {
    campos.push("ativo = ?");
    valores.push(mudancas.ativo ? 1 : 0);
  }
  campos.push("atualizado_em = datetime('now')");
  return { sql: campos.join(", "), valores };
}

export async function atualizar(db: D1Database, id: number, mudancas: Mudancas): Promise<Pessoa> {
  const { sql, valores } = montarSet(mudancas);
  const l = await db
    .prepare(`UPDATE pessoas SET ${sql} WHERE id = ? RETURNING *`)
    .bind(...valores, id)
    .first<Linha>();
  if (!l) throw new Error("nao_encontrada");
  return deLinha(l);
}

/**
 * Atualiza numa gravação só, recusando quando a mudança tiraria o último diretor ativo
 * (sem janela entre contar e gravar). Devolve null quando recusou ou não achou a pessoa.
 */
export async function atualizarProtegendoDiretor(db: D1Database, id: number, mudancas: Mudancas): Promise<Pessoa | null> {
  const { sql, valores } = montarSet(mudancas);
  const tiraDiretor = mudancas.ativo === false || (mudancas.cargo !== undefined && mudancas.cargo !== "diretor") ? 1 : 0;
  const l = await db
    .prepare(
      `UPDATE pessoas SET ${sql}
       WHERE id = ?
         AND NOT (cargo = 'diretor' AND ativo = 1 AND ? = 1
                  AND (SELECT COUNT(*) FROM pessoas WHERE cargo = 'diretor' AND ativo = 1 AND id <> ?) = 0)
       RETURNING *`,
    )
    .bind(...valores, id, tiraDiretor, id)
    .first<Linha>();
  return l ? deLinha(l) : null;
}

export async function contarDiretoresAtivos(db: D1Database): Promise<number> {
  const l = await db
    .prepare("SELECT COUNT(*) AS total FROM pessoas WHERE cargo = 'diretor' AND ativo = 1")
    .first<{ total: number }>();
  return l?.total ?? 0;
}
