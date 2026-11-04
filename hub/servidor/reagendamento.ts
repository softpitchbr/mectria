import { MOTIVO_NAO_COMPARECEU, type Reuniao } from "../compartilhado/oportunidade";
import { eDonoDaOportunidade } from "../compartilhado/permissoes";
import { buscarOportunidade, reuniaoDeLinha, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";
import type { Pessoa } from "./tipos";

/**
 * Diagnósticas em que o cliente não compareceu e que ainda não foram reagendadas: a última diagnóstica da oportunidade
 * está cancelada por "Cliente não compareceu" e a oportunidade continua na diagnóstica. O hunter vê as que marcou;
 * o closer, as dele; o diretor, todas.
 */
export async function listarReagendamentos(db: D1Database, quem: Pessoa): Promise<Reuniao[]> {
  const filtro = quem.cargo === "hunter" ? "AND o.hunter_id = ?" : quem.cargo === "closer" ? "AND o.closer_id = ?" : "";
  const { results } = await db
    .prepare(
      `${SELECT_REUNIAO}
       WHERE r.tipo = 'diagnostica' AND r.situacao = 'cancelada' AND r.motivo = ? AND o.situacao = 'diagnostica_marcada'
         AND r.id = (SELECT MAX(id) FROM reunioes WHERE oportunidade_id = o.id AND tipo = 'diagnostica') ${filtro}
       ORDER BY r.data_hora, r.id LIMIT 200`,
    )
    .bind(MOTIVO_NAO_COMPARECEU, ...(filtro ? [quem.id] : []))
    .all<LinhaReuniao>();
  return results.map(reuniaoDeLinha);
}

/**
 * Marca a diagnóstica de novo. Uma consulta só, condicionada a não haver diagnóstica marcada ou em andamento:
 * duas chamadas ao mesmo tempo criam uma reunião só. Leva as observações da última diagnóstica.
 */
export async function reagendarDiagnostica(
  db: D1Database,
  oportunidadeId: number,
  nova: { dataHora: string; formato: "online" | "presencial" },
  autor: Pessoa,
): Promise<Reuniao> {
  const o = await buscarOportunidade(db, oportunidadeId);
  if (!o) throw new Error("nao_encontrado");
  const quemMarcou = autor.cargo === "hunter" && o.hunterId === autor.id;
  if (!quemMarcou && !eDonoDaOportunidade(autor, o.closerId)) throw new Error("sem_permissao");
  if (o.situacao !== "diagnostica_marcada") throw new Error("ja_passou");
  const criada = await db
    .prepare(
      `INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, observacoes)
       SELECT o.id, 'diagnostica', ?, ?, (SELECT observacoes FROM reunioes WHERE oportunidade_id = o.id AND tipo = 'diagnostica' ORDER BY id DESC LIMIT 1)
       FROM oportunidades o
       WHERE o.id = ? AND o.situacao = 'diagnostica_marcada'
         AND NOT EXISTS (SELECT 1 FROM reunioes r WHERE r.oportunidade_id = o.id AND r.tipo = 'diagnostica' AND r.situacao IN ('marcada', 'em_andamento'))
       RETURNING id`,
    )
    .bind(nova.dataHora, nova.formato, oportunidadeId)
    .first<{ id: number }>();
  if (!criada) throw new Error("ja_reagendada");
  return reuniaoDeLinha((await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(criada.id).first<LinhaReuniao>())!);
}
