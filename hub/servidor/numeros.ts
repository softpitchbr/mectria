import type { NumerosDoTime, PessoaDoNumero } from "../compartilhado/numeros";

// Tudo pela hora de São Paulo (UTC−3): uma ganha às 22h do dia 30 conta no dia 30. Só conta linha do histórico que muda
// a situação (a exclusão de dados pessoais grava a situação nela mesma e não é decisão).
const NO_MES = (coluna: string) => `substr(datetime(${coluna}, '-3 hours'), 1, 7) = ?1`;
const DECIDIDA_NO_MES = (para: "ganha" | "perdida") =>
  `o.situacao = '${para}' AND EXISTS (SELECT 1 FROM historico h WHERE h.oportunidade_id = o.id AND h.para = '${para}' AND h.de IS NOT h.para AND ${NO_MES("h.em")})`;

/** Números do mês (AAAA-MM) para o diretor: o time inteiro, por closer e a rotina de cada pessoa. */
export async function numerosDoTime(db: D1Database, mes: string): Promise<NumerosDoTime> {
  const [totais, tempo, pactos, objecoes, porCloser, rotina] = await db.batch([
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM propostas p WHERE substr(p.apresentada_em, 1, 7) = ?1) AS propostas,
           (SELECT COUNT(*) FROM oportunidades o WHERE ${DECIDIDA_NO_MES("ganha")}) AS ganhas,
           (SELECT COUNT(*) FROM oportunidades o WHERE ${DECIDIDA_NO_MES("perdida")}) AS perdidas,
           (SELECT COALESCE(SUM(o.valor_fechado), 0) FROM oportunidades o WHERE ${DECIDIDA_NO_MES("ganha")}) AS valor`,
      )
      .bind(mes),
    // Da diagnóstica (o dia da reunião) à decisão (o registro de ganha ou perdida), nas decididas no mês.
    db
      .prepare(
        `SELECT AVG(julianday(decisao) - julianday(diagnostica)) AS media FROM (
           SELECT
             (SELECT MIN(substr(r.data_hora, 1, 10)) FROM reunioes r WHERE r.oportunidade_id = o.id AND r.tipo = 'diagnostica') AS diagnostica,
             (SELECT date(MAX(h.em), '-3 hours') FROM historico h WHERE h.oportunidade_id = o.id AND h.para = o.situacao AND h.de IS NOT h.para) AS decisao
           FROM oportunidades o WHERE (${DECIDIDA_NO_MES("ganha")}) OR (${DECIDIDA_NO_MES("perdida")})
         ) WHERE diagnostica IS NOT NULL`,
      )
      .bind(mes),
    db
      .prepare(
        `SELECT COUNT(*) AS n, AVG(json_array_length(COALESCE(r.pactos, '[]'))) AS media FROM reunioes r
         WHERE r.tipo = 'proposta' AND r.situacao = 'concluida' AND ${NO_MES("r.encerrada_em")}`,
      )
      .bind(mes),
    db
      .prepare(
        `SELECT a.texto, o.empresa, c.nome AS closer, date(a.criado_em, '-3 hours') AS dia
         FROM anotacoes a JOIN reunioes r ON r.id = a.reuniao_id JOIN oportunidades o ON o.id = r.oportunidade_id
         LEFT JOIN pessoas c ON c.id = o.closer_id
         WHERE a.marcacao = 'objecao' AND ${NO_MES("a.criado_em")}
         ORDER BY a.criado_em DESC, a.id DESC LIMIT 200`,
      )
      .bind(mes),
    db
      .prepare(
        `SELECT p.id, p.nome, p.cargo,
           (SELECT COUNT(*) FROM propostas pr JOIN oportunidades o ON o.id = pr.oportunidade_id
            WHERE o.closer_id = p.id AND substr(pr.apresentada_em, 1, 7) = ?1) AS propostas,
           (SELECT COUNT(*) FROM oportunidades o WHERE o.closer_id = p.id AND ${DECIDIDA_NO_MES("ganha")}) AS ganhas,
           (SELECT COALESCE(SUM(o.valor_fechado), 0) FROM oportunidades o WHERE o.closer_id = p.id AND ${DECIDIDA_NO_MES("ganha")}) AS valor
         FROM pessoas p WHERE p.cargo = 'closer' AND p.ativo = 1 ORDER BY p.nome`,
      )
      .bind(mes),
    db
      .prepare(
        `SELECT p.id, p.nome, p.cargo, COUNT(r.chave) AS total, COUNT(r.feito_em) AS feitos
         FROM pessoas p LEFT JOIN rotinas r ON r.pessoa_id = p.id AND substr(r.dia, 1, 7) = ?1
         WHERE p.ativo = 1 GROUP BY p.id ORDER BY p.nome`,
      )
      .bind(mes),
  ]);
  const t = totais.results[0] as { propostas: number; ganhas: number; perdidas: number; valor: number };
  const media = (tempo.results[0] as { media: number | null }).media;
  const p = pactos.results[0] as { n: number; media: number | null };
  const pessoa = (l: PessoaDoNumero) => ({ id: l.id, nome: l.nome, cargo: l.cargo });
  return {
    mes,
    propostas: t.propostas,
    ganhas: t.ganhas,
    perdidas: t.perdidas,
    conversao: t.ganhas + t.perdidas ? t.ganhas / (t.ganhas + t.perdidas) : null,
    valorVendido: t.valor,
    tempoMedioDias: media === null ? null : Math.round(media * 10) / 10,
    pactosPorReuniao: p.n ? p.media : null,
    objecoes: objecoes.results as NumerosDoTime["objecoes"],
    porCloser: (porCloser.results as (PessoaDoNumero & { propostas: number; ganhas: number; valor: number })[]).map((l) => ({
      pessoa: pessoa(l),
      propostas: l.propostas,
      ganhas: l.ganhas,
      valorVendido: l.valor,
    })),
    rotina: (rotina.results as (PessoaDoNumero & { feitos: number; total: number })[]).map((l) => ({ pessoa: pessoa(l), feitos: l.feitos, total: l.total })),
  };
}
