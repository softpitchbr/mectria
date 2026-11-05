import type { Reuniao } from "../compartilhado/oportunidade";
import { reuniaoDeLinha, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";

const ABERTA = "tipo = 'diagnostica' AND situacao IN ('marcada', 'em_andamento')";

/**
 * Confirmação da diagnóstica (docs/17, seção 3): registra o FUP enviado (1, 2 ou 3, em ordem; repetir não muda nada)
 * ou o "Confirmada" (a hora fica a da primeira vez). Só vale para diagnóstica marcada ou em andamento.
 */
export async function registrarConfirmacao(db: D1Database, reuniaoId: number, acao: { fup: 1 | 2 | 3 } | { confirmada: true }): Promise<Reuniao> {
  const mudou =
    "fup" in acao
      ? await db
          .prepare(`UPDATE reunioes SET fups_confirmacao = MAX(fups_confirmacao, ?1) WHERE id = ?2 AND ${ABERTA} AND fups_confirmacao >= ?1 - 1 RETURNING id`)
          .bind(acao.fup, reuniaoId)
          .first()
      : await db
          .prepare(`UPDATE reunioes SET confirmada_em = COALESCE(confirmada_em, datetime('now')) WHERE id = ? AND ${ABERTA} RETURNING id`)
          .bind(reuniaoId)
          .first();
  if (!mudou) {
    const r = await db.prepare(`SELECT id FROM reunioes WHERE id = ? AND ${ABERTA}`).bind(reuniaoId).first();
    throw new Error(r ? "fora_de_ordem" : "ja_encerrada");
  }
  return reuniaoDeLinha((await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(reuniaoId).first<LinhaReuniao>())!);
}
