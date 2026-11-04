import type { Pendencia, PendenciaDeProjetos, Reuniao } from "../compartilhado/oportunidade";
import { reuniaoDeLinha, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";
import type { Pessoa } from "./tipos";

type LinhaPendencia = {
  id: number;
  anotacao_id: number | null;
  oportunidade_id: number;
  texto: string;
  prazo: string;
  situacao: Pendencia["situacao"];
  resposta: string | null;
  respondida_em: string | null;
  respondida_por_nome?: string | null;
};

export function pendenciaDeLinha(p: LinhaPendencia): Pendencia {
  return {
    id: p.id,
    anotacaoId: p.anotacao_id,
    oportunidadeId: p.oportunidade_id,
    texto: p.texto,
    prazo: p.prazo,
    situacao: p.situacao,
    resposta: p.resposta,
    respondidaEm: p.respondida_em,
    respondidaPor: p.respondida_por_nome ?? null,
  };
}

const SELECT_PENDENCIA = `SELECT pe.*, rp.nome AS respondida_por_nome FROM pendencias pe LEFT JOIN pessoas rp ON rp.id = pe.respondida_por`;

/** A lista de Projetos: as abertas (atrasadas primeiro, pelo prazo) e depois as respondidas que faltam fechar. */
export async function listarPendencias(db: D1Database, hoje: string): Promise<PendenciaDeProjetos[]> {
  const { results } = await db
    .prepare(
      `SELECT pe.*, rp.nome AS respondida_por_nome, o.empresa, an.reuniao_id AS reuniao_da_anotacao,
         (SELECT MAX(r.id) FROM reunioes r WHERE r.oportunidade_id = o.id AND r.tipo = 'diagnostica') AS diagnostica_id
       FROM pendencias pe JOIN oportunidades o ON o.id = pe.oportunidade_id
       LEFT JOIN pessoas rp ON rp.id = pe.respondida_por LEFT JOIN anotacoes an ON an.id = pe.anotacao_id
       WHERE pe.situacao IN ('aberta', 'respondida')
       ORDER BY pe.situacao = 'respondida', pe.prazo, pe.id LIMIT 300`,
    )
    .all<LinhaPendencia & { empresa: string; reuniao_da_anotacao: number | null; diagnostica_id: number | null }>();
  return results.map((l) => ({
    pendencia: pendenciaDeLinha(l),
    empresa: l.empresa,
    reuniaoId: l.reuniao_da_anotacao ?? l.diagnostica_id,
    estado: l.situacao === "respondida" ? "respondida" : l.prazo < hoje ? "atrasada" : l.prazo === hoje ? "hoje" : "no_prazo",
  }));
}

async function recusa(db: D1Database, id: number): Promise<never> {
  const linha = await db.prepare("SELECT situacao FROM pendencias WHERE id = ?").bind(id).first<{ situacao: string }>();
  if (!linha) throw new Error("nao_encontrado");
  if (linha.situacao === "fechada") throw new Error("ja_fechada");
  throw new Error("sem_resposta");
}

async function buscar(db: D1Database, id: number): Promise<Pendencia> {
  return pendenciaDeLinha((await db.prepare(`${SELECT_PENDENCIA} WHERE pe.id = ?`).bind(id).first<LinhaPendencia>())!);
}

/** Projetos responde (ou corrige a resposta) enquanto a pendência não foi fechada. */
export async function responderPendencia(db: D1Database, id: number, resposta: string, autor: Pessoa): Promise<Pendencia> {
  const mudou = await db
    .prepare(
      `UPDATE pendencias SET resposta = ?, situacao = 'respondida', respondida_em = datetime('now'), respondida_por = ?
       WHERE id = ? AND situacao IN ('aberta', 'respondida') RETURNING id`,
    )
    .bind(resposta, autor.id, id)
    .first();
  if (!mudou) return recusa(db, id);
  return buscar(db, id);
}

/** Fecha a pendência; só depois de respondida. */
export async function fecharPendencia(db: D1Database, id: number): Promise<Pendencia> {
  const mudou = await db.prepare("UPDATE pendencias SET situacao = 'fechada' WHERE id = ? AND situacao = 'respondida' RETURNING id").bind(id).first();
  if (!mudou) return recusa(db, id);
  return buscar(db, id);
}

/** Diagnósticas com o briefing enviado para Projetos, as mais novas primeiro. */
export async function listarBriefings(db: D1Database): Promise<Reuniao[]> {
  const { results } = await db
    .prepare(`${SELECT_REUNIAO} WHERE r.tipo = 'diagnostica' AND r.briefing_enviado_em IS NOT NULL ORDER BY r.briefing_enviado_em DESC, r.id DESC LIMIT 100`)
    .all<LinhaReuniao>();
  return results.map(reuniaoDeLinha);
}
