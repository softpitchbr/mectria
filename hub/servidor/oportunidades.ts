import type { NovaDiagnostica, Oportunidade, Reuniao, Situacao } from "../compartilhado/oportunidade";
import type { Pessoa } from "./tipos";

interface LinhaOportunidade {
  id: number;
  empresa: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  segmento: string;
  origem: string;
  servico: string;
  hunter_id: number | null;
  closer_id: number | null;
  closer_nome: string | null;
  situacao: Situacao;
  motivo_perda: string | null;
  valor_fechado: number | null;
  criado_em: string;
  atualizado_em: string;
}

interface LinhaReuniao {
  id: number;
  oportunidade_id: number;
  empresa: string;
  tipo: Reuniao["tipo"];
  data_hora: string;
  formato: Reuniao["formato"];
  situacao: Reuniao["situacao"];
  closer_id: number | null;
  closer_nome: string | null;
}

export function oportunidadeDeLinha(l: LinhaOportunidade): Oportunidade {
  return {
    id: l.id,
    empresa: l.empresa,
    contato: l.contato,
    telefone: l.telefone,
    email: l.email,
    cidade: l.cidade,
    segmento: l.segmento,
    origem: l.origem,
    servico: l.servico,
    hunterId: l.hunter_id,
    closerId: l.closer_id,
    closerNome: l.closer_nome,
    situacao: l.situacao,
    motivoPerda: l.motivo_perda,
    valorFechado: l.valor_fechado,
    criadoEm: l.criado_em,
    atualizadoEm: l.atualizado_em,
  };
}

function reuniaoDeLinha(l: LinhaReuniao): Reuniao {
  return {
    id: l.id,
    oportunidadeId: l.oportunidade_id,
    empresa: l.empresa,
    tipo: l.tipo,
    dataHora: l.data_hora,
    formato: l.formato,
    situacao: l.situacao,
    closerId: l.closer_id,
    closerNome: l.closer_nome,
  };
}

/** SELECT de oportunidades com o nome do closer; complete com WHERE/ORDER. */
export const SELECT_OPORTUNIDADE = `
  SELECT o.*, c.nome AS closer_nome
  FROM oportunidades o LEFT JOIN pessoas c ON c.id = o.closer_id`;

const SELECT_REUNIAO = `
  SELECT r.id, r.oportunidade_id, o.empresa, r.tipo, r.data_hora, r.formato, r.situacao, o.closer_id, c.nome AS closer_nome
  FROM reunioes r
  JOIN oportunidades o ON o.id = r.oportunidade_id
  LEFT JOIN pessoas c ON c.id = o.closer_id`;

export async function buscarOportunidade(db: D1Database, id: number): Promise<Oportunidade | null> {
  const l = await db.prepare(`${SELECT_OPORTUNIDADE} WHERE o.id = ?`).bind(id).first<LinhaOportunidade>();
  return l ? oportunidadeDeLinha(l) : null;
}

function registrarHistorico(db: D1Database, id: number, de: Situacao | null, para: Situacao, autorId: number, detalhe: string | null = null) {
  return db
    .prepare("INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) VALUES (?, ?, ?, ?, ?)")
    .bind(id, de, para, detalhe, autorId);
}

/** O hunter (ou quem marcar) registra a diagnóstica: cria a oportunidade e a reunião. */
export async function criarDiagnostica(
  db: D1Database,
  dados: NovaDiagnostica,
  autor: Pessoa,
): Promise<{ oportunidade: Oportunidade; reuniao: Reuniao }> {
  const nova = await db
    .prepare(
      `INSERT INTO oportunidades (empresa, contato, telefone, email, cidade, segmento, origem, servico, hunter_id, closer_id, situacao)
       VALUES (?, ?, ?, ?, ?, ?, 'cold call', ?, ?, ?, 'diagnostica_marcada') RETURNING id`,
    )
    .bind(
      dados.empresa,
      dados.contato,
      dados.telefone,
      dados.email ?? "",
      dados.cidade ?? "",
      dados.segmento ?? "",
      dados.servico,
      autor.cargo === "hunter" ? autor.id : null,
      dados.closerId,
    )
    .first<{ id: number }>();
  if (!nova) throw new Error("falha_ao_criar");

  const [, reuniao] = await db.batch([
    registrarHistorico(db, nova.id, null, "diagnostica_marcada", autor.id),
    db
      .prepare("INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato) VALUES (?, 'diagnostica', ?, ?) RETURNING id")
      .bind(nova.id, dados.dataHora, dados.formato),
  ]);
  const idReuniao = (reuniao.results[0] as { id: number }).id;
  const r = await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(idReuniao).first<LinhaReuniao>();
  return { oportunidade: (await buscarOportunidade(db, nova.id))!, reuniao: reuniaoDeLinha(r!) };
}

/** Hunter vê as que marcou; os outros cargos veem todas. Atualizadas por último primeiro. */
export async function listarOportunidades(db: D1Database, quem: Pessoa): Promise<Oportunidade[]> {
  const consulta =
    quem.cargo === "hunter"
      ? db.prepare(`${SELECT_OPORTUNIDADE} WHERE o.hunter_id = ? ORDER BY o.atualizado_em DESC, o.id DESC`).bind(quem.id)
      : db.prepare(`${SELECT_OPORTUNIDADE} ORDER BY o.atualizado_em DESC, o.id DESC`);
  const { results } = await consulta.all<LinhaOportunidade>();
  return results.map(oportunidadeDeLinha);
}

/** Muda a situação e grava o histórico (de → para, com o autor). */
export async function mudarSituacao(
  db: D1Database,
  id: number,
  para: Situacao,
  autorId: number,
  extra: { motivoPerda?: string; valorFechado?: number } = {},
): Promise<Oportunidade> {
  const atual = await buscarOportunidade(db, id);
  if (!atual) throw new Error("nao_encontrada");
  await db.batch([
    db
      .prepare(
        `UPDATE oportunidades SET situacao = ?, motivo_perda = COALESCE(?, motivo_perda),
           valor_fechado = COALESCE(?, valor_fechado), atualizado_em = datetime('now') WHERE id = ?`,
      )
      .bind(para, extra.motivoPerda ?? null, extra.valorFechado ?? null, id),
    registrarHistorico(db, id, atual.situacao, para, autorId),
  ]);
  return (await buscarOportunidade(db, id))!;
}

/** Um closer assume a oportunidade de um colega (só enquanto ela está aberta). */
export async function assumir(db: D1Database, id: number, closer: Pessoa): Promise<Oportunidade> {
  const atual = await buscarOportunidade(db, id);
  if (!atual) throw new Error("nao_encontrada");
  const mudou = await db
    .prepare(
      `UPDATE oportunidades SET closer_id = ?, atualizado_em = datetime('now')
       WHERE id = ? AND situacao IN ('diagnostica_marcada', 'proposta_marcada', 'em_followup') RETURNING id`,
    )
    .bind(closer.id, id)
    .first();
  if (!mudou) throw new Error("ja_encerrada");
  await registrarHistorico(db, id, atual.situacao, atual.situacao, closer.id, `assumida por ${closer.nome}`).run();
  return (await buscarOportunidade(db, id))!;
}

/** Reuniões entre dois dias (inclusive), em ordem de data e hora. */
export async function listarReunioes(
  db: D1Database,
  de: string,
  ate: string,
  filtro: { closerId?: number; hunterId?: number } = {},
): Promise<Reuniao[]> {
  const condicoes = ["r.data_hora >= ?", "r.data_hora <= ?"];
  const valores: (string | number)[] = [de, `${ate}T23:59`];
  if (filtro.closerId !== undefined) {
    condicoes.push("o.closer_id = ?");
    valores.push(filtro.closerId);
  }
  if (filtro.hunterId !== undefined) {
    condicoes.push("o.hunter_id = ?");
    valores.push(filtro.hunterId);
  }
  const { results } = await db
    .prepare(`${SELECT_REUNIAO} WHERE ${condicoes.join(" AND ")} ORDER BY r.data_hora, r.id`)
    .bind(...valores)
    .all<LinhaReuniao>();
  return results.map(reuniaoDeLinha);
}
