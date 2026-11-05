import { eDonoDaOportunidade } from "../compartilhado/permissoes";
import { mesesEntre, type ItemReativacao } from "../compartilhado/reativacao";
import type { Oportunidade, Reuniao } from "../compartilhado/oportunidade";
import { buscarOportunidade, oportunidadeDeLinha, reuniaoDeLinha, SELECT_OPORTUNIDADE, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";
import { DETALHE_LGPD } from "./exportar";
import type { Pessoa } from "./tipos";

// Quando a oportunidade em nutrição volta: o mês escolhido ou, nas antigas, a entrada em nutrição + 45 dias (hora de São Paulo).
const RETOMAR = `COALESCE(o.retomar_em, date((SELECT MAX(h.em) FROM historico h WHERE h.oportunidade_id = o.id AND h.para = 'nutricao' AND h.de IS NOT h.para), '-3 hours', '+45 days'))`;
const ULTIMA_REUNIAO = `NULLIF(MAX(
  COALESCE((SELECT MAX(substr(r.data_hora, 1, 10)) FROM reunioes r WHERE r.oportunidade_id = o.id), ''),
  COALESCE((SELECT MAX(p.apresentada_em) FROM propostas p WHERE p.oportunidade_id = o.id), '')), '')`;

/** Oportunidades em nutrição cuja hora de retomar chegou, as mais antigas primeiro. O closer vê as dele; o diretor, todas. */
export async function listarReativacao(db: D1Database, quem: Pessoa, hoje: string): Promise<ItemReativacao[]> {
  const soDele = quem.cargo !== "diretor";
  const sql = `SELECT * FROM (
      ${SELECT_OPORTUNIDADE.replace("SELECT o.*,", `SELECT o.*, ${RETOMAR} AS retomar, ${ULTIMA_REUNIAO} AS ultima_reuniao,`)}
      WHERE o.situacao = 'nutricao' ${soDele ? "AND o.closer_id = ?" : ""}
    ) WHERE retomar <= ? ORDER BY retomar, id`;
  const { results } = await db
    .prepare(sql)
    .bind(...(soDele ? [quem.id] : []), hoje)
    .all<Parameters<typeof oportunidadeDeLinha>[0] & { retomar: string; ultima_reuniao: string | null }>();
  return results.map((l) => ({
    oportunidade: oportunidadeDeLinha(l),
    ultimaReuniao: l.ultima_reuniao,
    mesesDesde: mesesEntre(l.ultima_reuniao ?? l.retomar, hoje),
    retomarEm: l.retomar,
  }));
}

/** Confere se a oportunidade existe e é de quem mexe (closer dono ou diretor). */
async function conferir(db: D1Database, id: number, quem: Pessoa): Promise<Oportunidade> {
  const o = await buscarOportunidade(db, id);
  if (!o) throw new Error("nao_encontrado");
  if (!eDonoDaOportunidade(quem, o.closerId)) throw new Error("sem_permissao");
  return o;
}

const NA_NUTRICAO = "FROM oportunidades WHERE id = ? AND situacao = 'nutricao'";

/** Rodou o batch: a última gravação (o UPDATE com RETURNING) diz se a oportunidade ainda estava em nutrição. */
function conferirBatch(resultados: D1Result[]): void {
  if (!resultados[resultados.length - 1].results.length) throw new Error("fora_da_nutricao");
}

/** "Ainda não": troca o mês para retomar. */
export async function adiarReativacao(db: D1Database, id: number, retomarEm: string, autor: Pessoa): Promise<Oportunidade> {
  const o = await conferir(db, id, autor);
  conferirBatch(
    await db.batch([
      db
        .prepare(`INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) SELECT id, 'nutricao', 'nutricao', ?, ? ${NA_NUTRICAO}`)
        .bind(`Retomar em ${retomarEm}`, autor.id, id),
      db
        .prepare(`UPDATE oportunidades SET retomar_em = ?, atualizado_em = datetime('now') WHERE id = ? AND situacao = 'nutricao' RETURNING id`)
        .bind(retomarEm, id),
    ]),
  );
  return o;
}

/** "Marcar reunião": cria a diagnóstica e volta a oportunidade para diagnostica_marcada, só se ela ainda estiver em nutrição. */
export async function reativarComReuniao(
  db: D1Database,
  id: number,
  nova: { dataHora: string; formato: "online" | "presencial" },
  autor: Pessoa,
): Promise<{ oportunidade: Oportunidade; reuniao: Reuniao }> {
  await conferir(db, id, autor);
  // As três gravações olham a situação de antes do UPDATE, então a segunda chamada não cria outra reunião.
  const resultados = await db.batch([
    db
      .prepare(`INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato) SELECT id, 'diagnostica', ?, ? ${NA_NUTRICAO} RETURNING id`)
      .bind(nova.dataHora, nova.formato, id),
    db
      .prepare(
        `INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) SELECT id, 'nutricao', 'diagnostica_marcada', 'Reativação', ? ${NA_NUTRICAO}`,
      )
      .bind(autor.id, id),
    db
      .prepare(
        `UPDATE oportunidades SET situacao = 'diagnostica_marcada', retomar_em = NULL, atualizado_em = datetime('now')
         WHERE id = ? AND situacao = 'nutricao' RETURNING id`,
      )
      .bind(id),
  ]);
  conferirBatch(resultados);
  const idReuniao = (resultados[0].results[0] as { id: number }).id;
  const r = await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(idReuniao).first<LinhaReuniao>();
  return { oportunidade: (await buscarOportunidade(db, id))!, reuniao: reuniaoDeLinha(r!) };
}

/** "Perdida": encerra a cadência com o motivo. */
export async function perderNaReativacao(db: D1Database, id: number, motivo: string, autor: Pessoa): Promise<Oportunidade> {
  const o = await conferir(db, id, autor);
  conferirBatch(
    await db.batch([
      db
        .prepare(`INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) SELECT id, 'nutricao', 'perdida', ?, ? ${NA_NUTRICAO}`)
        .bind(motivo, autor.id, id),
      db
        .prepare(
          `UPDATE oportunidades SET situacao = 'perdida', motivo_perda = ?, retomar_em = NULL, atualizado_em = datetime('now')
           WHERE id = ? AND situacao = 'nutricao' RETURNING id`,
        )
        .bind(motivo, id),
    ]),
  );
  return o;
}

/** Reativações do closer no dia: as que venceram (a fazer) e as que ele já tratou hoje (feitas). */
export async function reativacoesDoDia(db: D1Database, closer: Pessoa, dia: string): Promise<{ id: number; empresa: string; feito: boolean }[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT o.id, o.empresa FROM historico h JOIN oportunidades o ON o.id = h.oportunidade_id
       WHERE h.de = 'nutricao' AND date(h.em, '-3 hours') = ? AND o.closer_id = ? AND (h.detalhe IS NULL OR h.detalhe <> ?)`,
    )
    .bind(dia, closer.id, DETALHE_LGPD)
    .all<{ id: number; empresa: string }>();
  const feitas = results.map((r) => ({ ...r, feito: true }));
  const tratadas = new Set(feitas.map((r) => r.id));
  const vencidas = (await listarReativacao(db, closer, dia))
    .filter((i) => !tratadas.has(i.oportunidade.id))
    .map((i) => ({ id: i.oportunidade.id, empresa: i.oportunidade.empresa, feito: false }));
  return [...vencidas, ...feitas];
}
