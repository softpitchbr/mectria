import { hojeEmSaoPaulo, somarDiasUteis } from "../compartilhado/datas";
import { retomarOuPadrao } from "../compartilhado/reativacao";
import type { Anotacao, Marcacao } from "../compartilhado/diagnostica";
import { MOTIVO_NAO_COMPARECEU, type FechamentoDiagnostica, type FichaCompleta, type Pendencia, type Reuniao } from "../compartilhado/oportunidade";
import { buscarOportunidade, reuniaoDeLinha, SELECT_REUNIAO, type LinhaReuniao } from "./oportunidades";
import type { Pessoa } from "./tipos";

export async function buscarReuniao(db: D1Database, id: number): Promise<Reuniao | null> {
  const l = await db.prepare(`${SELECT_REUNIAO} WHERE r.id = ?`).bind(id).first<LinhaReuniao>();
  return l ? reuniaoDeLinha(l) : null;
}

/**
 * A reunião só anda enquanto a oportunidade ainda está na etapa dela: diagnostica_marcada para a diagnóstica,
 * proposta_marcada para a proposta (senão a etapa já foi registrada por outro caminho).
 */
export const OPORTUNIDADE_NA_ETAPA = `EXISTS (SELECT 1 FROM oportunidades o WHERE o.id = reunioes.oportunidade_id
  AND o.situacao = CASE reunioes.tipo WHEN 'diagnostica' THEN 'diagnostica_marcada' ELSE 'proposta_marcada' END)`;

/** Por que a reunião não pôde andar: não existe, é de outro tipo, já encerrou ou a oportunidade já passou da etapa. */
export async function motivoDaRecusa(db: D1Database, reuniaoId: number, tipo?: Reuniao["tipo"]): Promise<string> {
  const r = await buscarReuniao(db, reuniaoId);
  if (!r) return "nao_encontrada";
  if (tipo && r.tipo !== tipo) return tipo === "diagnostica" ? "nao_e_diagnostica" : "nao_e_proposta";
  if (r.situacao === "concluida" || r.situacao === "cancelada") return "ja_encerrada";
  return "ja_passou";
}

/** Marca a reunião (diagnóstica ou proposta) como em andamento (a primeira vez guarda o horário de início). */
export async function iniciarReuniao(db: D1Database, reuniaoId: number): Promise<Reuniao> {
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET situacao = 'em_andamento', iniciada_em = COALESCE(iniciada_em, datetime('now')), atualizado_em = datetime('now')
       WHERE id = ? AND situacao IN ('marcada', 'em_andamento') AND ${OPORTUNIDADE_NA_ETAPA} RETURNING id`,
    )
    .bind(reuniaoId)
    .first();
  if (!mudou) throw new Error(await motivoDaRecusa(db, reuniaoId));
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

/**
 * Grava a anotação (a mesma idCliente não duplica). "Técnico" vira pendência para Projetos no próximo dia útil.
 * Tudo num batch (uma transação): a pendência nasce junto com a anotação, ou na repetição, se faltou.
 */
export async function salvarAnotacao(db: D1Database, reuniaoId: number, a: Anotacao, autor: Pessoa, hoje: string = hojeEmSaoPaulo()): Promise<void> {
  const gravar = db
    .prepare(
      `INSERT INTO anotacoes (reuniao_id, id_cliente, minuto, passo, marcacao, texto, autor_id) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id_cliente) DO NOTHING`,
    )
    .bind(reuniaoId, a.idCliente, a.minuto, a.passo, a.marcacao, a.texto, autor.id);
  if (a.marcacao !== "tecnico") {
    await gravar.run();
    return;
  }
  const pendencia = db
    .prepare(
      `INSERT INTO pendencias (anotacao_id, oportunidade_id, texto, prazo)
       SELECT an.id, r.oportunidade_id, an.texto, ? FROM anotacoes an JOIN reunioes r ON r.id = an.reuniao_id
       WHERE an.id_cliente = ? AND an.reuniao_id = ? AND an.marcacao = 'tecnico'
         AND NOT EXISTS (SELECT 1 FROM pendencias p WHERE p.anotacao_id = an.id)`,
    )
    .bind(somarDiasUteis(hoje, 1), a.idCliente, reuniaoId);
  await db.batch([gravar, pendencia]);
}

/** A ficha inteira da reunião: reunião, oportunidade, respostas, anotações e pendências. */
export async function fichaDaReuniao(db: D1Database, reuniaoId: number): Promise<FichaCompleta | null> {
  const reuniao = await buscarReuniao(db, reuniaoId);
  if (!reuniao) return null;
  const [respostas, anotacoes, pendencias, proxima] = await db.batch([
    db.prepare("SELECT pergunta_id, resposta FROM fichas WHERE reuniao_id = ?").bind(reuniaoId),
    db.prepare("SELECT id_cliente, minuto, passo, marcacao, texto, criado_em FROM anotacoes WHERE reuniao_id = ? ORDER BY id").bind(reuniaoId),
    db.prepare("SELECT * FROM pendencias WHERE oportunidade_id = ? ORDER BY id").bind(reuniao.oportunidadeId),
    // A proposta combinada no fechamento: a primeira reunião de proposta criada depois desta.
    db
      .prepare(`${SELECT_REUNIAO} WHERE r.oportunidade_id = ? AND r.tipo = 'proposta' AND r.id > ? AND r.situacao != 'cancelada' ORDER BY r.id LIMIT 1`)
      .bind(reuniao.oportunidadeId, reuniaoId),
  ]);
  const linhaProxima = (proxima.results as LinhaReuniao[])[0];
  return {
    reuniao,
    oportunidade: (await buscarOportunidade(db, reuniao.oportunidadeId))!,
    respostas: Object.fromEntries((respostas.results as { pergunta_id: string; resposta: string }[]).map((r) => [r.pergunta_id, r.resposta])),
    anotacoes: (anotacoes.results as { id_cliente: string; minuto: number; passo: string; marcacao: Marcacao | null; texto: string; criado_em: string }[]).map(
      (a) => ({
        idCliente: a.id_cliente,
        minuto: a.minuto,
        passo: a.passo,
        marcacao: a.marcacao,
        texto: a.texto,
        criadoEm: a.criado_em,
      }),
    ),
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
    proximaReuniao: linhaProxima ? reuniaoDeLinha(linhaProxima) : null,
  };
}

/**
 * Fechamento obrigatório da diagnóstica: proposta marcada (cria a reunião de proposta)
 * ou não qualificou (nutrição). Uma reunião só encerra uma vez, e só enquanto a oportunidade
 * ainda está na diagnóstica. Tudo num batch (uma transação): as gravações seguintes só valem
 * se a primeira concluiu a reunião.
 */
export async function encerrarDiagnostica(db: D1Database, reuniaoId: number, f: FechamentoDiagnostica, autor: Pessoa): Promise<Reuniao> {
  if (f.resultado === "nao_compareceu") {
    // O cliente não apareceu: a reunião fica cancelada com o motivo e a oportunidade continua na diagnóstica,
    // na lista de reagendamentos do hunter (docs/17, seção 6). Não há mudança de situação, então não vai ao histórico.
    const cancelou = await db
      .prepare(
        `UPDATE reunioes SET situacao = 'cancelada', encerrada_em = datetime('now'), motivo = ?, atualizado_em = datetime('now')
         WHERE id = ? AND tipo = 'diagnostica' AND situacao IN ('marcada', 'em_andamento') AND ${OPORTUNIDADE_NA_ETAPA} RETURNING id`,
      )
      .bind(MOTIVO_NAO_COMPARECEU, reuniaoId)
      .first();
    if (!cancelou) throw new Error(await motivoDaRecusa(db, reuniaoId, "diagnostica"));
    return (await buscarReuniao(db, reuniaoId))!;
  }
  const para = f.resultado === "proposta_marcada" ? "proposta_marcada" : "nutricao";
  // Depois da primeira gravação: esta reunião acabou de ser concluída e a oportunidade ainda está na diagnóstica.
  const recemConcluida = `r.id = ? AND r.situacao = 'concluida' AND o.situacao = 'diagnostica_marcada'`;
  const gravacoes = [
    db
      .prepare(
        `UPDATE reunioes SET situacao = 'concluida', encerrada_em = datetime('now'), resultado = ?, motivo = ?, atualizado_em = datetime('now')
         WHERE id = ? AND tipo = 'diagnostica' AND situacao IN ('marcada', 'em_andamento') AND ${OPORTUNIDADE_NA_ETAPA} RETURNING id`,
      )
      .bind(f.resultado, f.resultado === "nao_qualificou" ? f.motivo : null, reuniaoId),
    ...(f.resultado === "proposta_marcada"
      ? [
          db
            .prepare(
              `INSERT INTO reunioes (oportunidade_id, tipo, data_hora, formato, quem_decide)
               SELECT r.oportunidade_id, 'proposta', ?, ?, ? FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id WHERE ${recemConcluida}`,
            )
            .bind(f.dataHora, f.formato, f.quemDecide, reuniaoId),
        ]
      : []),
    db
      .prepare(
        `INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id)
         SELECT o.id, o.situacao, ?, NULL, ? FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id WHERE ${recemConcluida}`,
      )
      .bind(para, autor.id, reuniaoId),
    db
      .prepare(
        `UPDATE oportunidades SET situacao = ?, retomar_em = ?, atualizado_em = datetime('now')
         WHERE situacao = 'diagnostica_marcada' AND id = (SELECT oportunidade_id FROM reunioes WHERE id = ? AND situacao = 'concluida')`,
      )
      .bind(para, f.resultado === "nao_qualificou" ? retomarOuPadrao(f.retomarEm) : null, reuniaoId),
  ];
  const [concluiu] = await db.batch(gravacoes);
  if (!concluiu.results.length) throw new Error(await motivoDaRecusa(db, reuniaoId, "diagnostica"));
  return (await buscarReuniao(db, reuniaoId))!;
}

/** Marca o briefing como enviado para Projetos; só de diagnóstica concluída (um no-show não tem briefing). */
export async function marcarBriefingEnviado(db: D1Database, reuniaoId: number): Promise<Reuniao> {
  const marcou = await db
    .prepare("UPDATE reunioes SET briefing_enviado_em = COALESCE(briefing_enviado_em, datetime('now')) WHERE id = ? AND situacao = 'concluida' RETURNING id")
    .bind(reuniaoId)
    .first();
  if (!marcou) throw new Error("nao_concluida");
  return (await buscarReuniao(db, reuniaoId))!;
}
