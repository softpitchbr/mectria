import { hojeEmSaoPaulo, somarDiasUteis } from "../compartilhado/datas";
import type { Anotacao, Marcacao } from "../compartilhado/diagnostica";
import type { FechamentoDiagnostica, FichaCompleta, Pendencia, Reuniao } from "../compartilhado/oportunidade";
import { buscarOportunidade, mudarSituacao, reuniaoDeLinha, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";
import type { Pessoa } from "./tipos";

export async function buscarReuniao(db: D1Database, id: number): Promise<Reuniao | null> {
  const l = await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(id).first<LinhaReuniao>();
  return l ? reuniaoDeLinha(l) : null;
}

/** Marca a reunião como em andamento (a primeira vez guarda o horário de início). */
export async function iniciarReuniao(db: D1Database, reuniaoId: number): Promise<Reuniao> {
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET situacao = 'em_andamento', iniciada_em = COALESCE(iniciada_em, datetime('now')), atualizado_em = datetime('now')
       WHERE id = ? AND situacao IN ('marcada', 'em_andamento') RETURNING id`,
    )
    .bind(reuniaoId)
    .first();
  if (!mudou) throw new Error((await buscarReuniao(db, reuniaoId)) ? "ja_encerrada" : "nao_encontrada");
  return (await buscarReuniao(db, reuniaoId))!;
}

/** Grava as respostas, uma por pergunta: a última alteração de cada pergunta vale. */
export async function salvarRespostas(db: D1Database, reuniaoId: number, respostas: { perguntaId: string; resposta: string }[], autor: Pessoa): Promise<void> {
  if (respostas.length === 0) return;
  await db.batch(
    respostas.map((r) =>
      db
        .prepare(
          `INSERT INTO fichas (reuniao_id, pergunta_id, resposta, autor_id) VALUES (?, ?, ?, ?)
           ON CONFLICT (reuniao_id, pergunta_id) DO UPDATE SET resposta = excluded.resposta, autor_id = excluded.autor_id, atualizado_em = datetime('now')`,
        )
        .bind(reuniaoId, r.perguntaId, r.resposta, autor.id),
    ),
  );
}

/** Grava a anotação (a mesma idCliente não duplica). "Técnico" vira pendência para Projetos no próximo dia útil. */
export async function salvarAnotacao(db: D1Database, reuniaoId: number, a: Anotacao, autor: Pessoa, hoje: string = hojeEmSaoPaulo()): Promise<void> {
  const nova = await db
    .prepare(
      `INSERT INTO anotacoes (reuniao_id, id_cliente, minuto, passo, marcacao, texto, autor_id) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id_cliente) DO NOTHING RETURNING id`,
    )
    .bind(reuniaoId, a.idCliente, a.minuto, a.passo, a.marcacao, a.texto, autor.id)
    .first<{ id: number }>();
  if (!nova || a.marcacao !== "tecnico") return;
  await db
    .prepare(
      `INSERT INTO pendencias (anotacao_id, oportunidade_id, texto, prazo)
       SELECT ?, oportunidade_id, ?, ? FROM reunioes WHERE id = ?`,
    )
    .bind(nova.id, a.texto, somarDiasUteis(hoje, 1), reuniaoId)
    .run();
}

/** A ficha inteira da reunião: reunião, oportunidade, respostas, anotações e pendências. */
export async function fichaDaReuniao(db: D1Database, reuniaoId: number): Promise<FichaCompleta | null> {
  const reuniao = await buscarReuniao(db, reuniaoId);
  if (!reuniao) return null;
  const [respostas, anotacoes, pendencias] = await db.batch([
    db.prepare("SELECT pergunta_id, resposta FROM fichas WHERE reuniao_id = ?").bind(reuniaoId),
    db.prepare("SELECT id_cliente, minuto, passo, marcacao, texto, criado_em FROM anotacoes WHERE reuniao_id = ? ORDER BY id").bind(reuniaoId),
    db.prepare("SELECT * FROM pendencias WHERE oportunidade_id = ? ORDER BY id").bind(reuniao.oportunidadeId),
  ]);
  return {
    reuniao,
    oportunidade: (await buscarOportunidade(db, reuniao.oportunidadeId))!,
    respostas: Object.fromEntries((respostas.results as { pergunta_id: string; resposta: string }[]).map((r) => [r.pergunta_id, r.resposta])),
    anotacoes: (anotacoes.results as { id_cliente: string; minuto: number; passo: string; marcacao: Marcacao | null; texto: string; criado_em: string }[]).map((a) => ({
      idCliente: a.id_cliente,
      minuto: a.minuto,
      passo: a.passo,
      marcacao: a.marcacao,
      texto: a.texto,
      criadoEm: a.criado_em,
    })),
    pendencias: (pendencias.results as Record<string, unknown>[]).map(
      (p): Pendencia => ({
        id: p.id as number,
        anotacaoId: p.anotacao_id as number | null,
        oportunidadeId: p.oportunidade_id as number,
        texto: p.texto as string,
        prazo: p.prazo as string,
        situacao: p.situacao as Pendencia["situacao"],
        resposta: p.resposta as string | null,
      }),
    ),
  };
}

/**
 * Fechamento obrigatório da diagnóstica: proposta marcada (cria a reunião de proposta)
 * ou não qualificou (nutrição). Uma reunião só encerra uma vez.
 */
export async function encerrarDiagnostica(db: D1Database, reuniaoId: number, f: FechamentoDiagnostica, autor: Pessoa): Promise<Reuniao> {
  const reuniao = await buscarReuniao(db, reuniaoId);
  if (!reuniao) throw new Error("nao_encontrada");
  if (reuniao.tipo !== "diagnostica") throw new Error("nao_e_diagnostica");
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET situacao = 'concluida', encerrada_em = datetime('now'), resultado = ?, motivo = ?, atualizado_em = datetime('now')
       WHERE id = ? AND situacao != 'concluida' RETURNING id`,
    )
    .bind(f.resultado, f.resultado === "nao_qualificou" ? f.motivo : null, reuniaoId)
    .first();
  if (!mudou) throw new Error("ja_encerrada");

  if (f.resultado === "proposta_marcada") {
    await db
      .prepare("INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide) VALUES (?, 'proposta', ?, ?, ?)")
      .bind(reuniao.oportunidadeId, f.dataHora, f.formato, f.quemDecide)
      .run();
    await mudarSituacao(db, reuniao.oportunidadeId, "proposta_marcada", autor.id);
  } else {
    await mudarSituacao(db, reuniao.oportunidadeId, "nutricao", autor.id);
  }
  return (await buscarReuniao(db, reuniaoId))!;
}

export async function marcarBriefingEnviado(db: D1Database, reuniaoId: number): Promise<Reuniao> {
  await db.prepare("UPDATE reunioes SET briefing_enviado_em = COALESCE(briefing_enviado_em, datetime('now')) WHERE id = ?").bind(reuniaoId).run();
  return (await buscarReuniao(db, reuniaoId))!;
}
