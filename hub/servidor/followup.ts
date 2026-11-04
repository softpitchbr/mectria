import { datasDaCadencia } from "../compartilhado/cadencia";
import { retomarOuPadrao } from "../compartilhado/reativacao";
import { pendenciaDeLinha } from "./pendencias";
import type {
  EstadoFollowup,
  ItemFollowup,
  NovaProposta,
  Oportunidade,
  Proposta,
  ResultadoProposta,
  Toque,
} from "../compartilhado/oportunidade";
import { buscarOportunidade, mudarSituacao, oportunidadeDeLinha, SELECT_OPORTUNIDADE } from "./oportunidades";
import type { Pessoa } from "./tipos";

interface LinhaProposta {
  id: number;
  oportunidade_id: number;
  servico: string;
  valor: number;
  apresentada_em: string;
  data_decisao: string | null;
  quem_decide: string;
  dor: string;
  validade: string | null;
}

interface LinhaToque {
  id: number;
  proposta_id: number;
  codigo: Toque["codigo"];
  previsto_para: string;
  feito_em: string | null;
  canal: string | null;
  resultado: string | null;
}

const propostaDeLinha = (l: LinhaProposta): Proposta => ({
  id: l.id,
  oportunidadeId: l.oportunidade_id,
  servico: l.servico,
  valor: l.valor,
  apresentadaEm: l.apresentada_em,
  dataDecisao: l.data_decisao,
  quemDecide: l.quem_decide,
  dor: l.dor,
  validade: l.validade,
});

export const toqueDeLinha = (l: LinhaToque): Toque => ({
  id: l.id,
  propostaId: l.proposta_id,
  codigo: l.codigo,
  previstoPara: l.previsto_para,
  feitoEm: l.feito_em,
  canal: l.canal,
  resultado: l.resultado,
});

/**
 * Registra a proposta apresentada e cria os toques da cadência. Sem oportunidadeId,
 * cria a oportunidade (registro manual) com quem registrou como closer.
 */
export async function registrarProposta(
  db: D1Database,
  dados: NovaProposta,
  autor: Pessoa,
): Promise<{ proposta: Proposta; toques: Toque[] }> {
  let oportunidadeId = dados.oportunidadeId;
  if (oportunidadeId === undefined) {
    const nova = await db
      .prepare(
        `INSERT INTO oportunidades (empresa, contato, telefone, origem, servico, closer_id, situacao)
         VALUES (?, ?, ?, 'registro manual', ?, ?, 'em_followup') RETURNING id`,
      )
      .bind(dados.empresa ?? "", dados.contato ?? "", dados.telefone ?? "", dados.servico, autor.id)
      .first<{ id: number }>();
    oportunidadeId = nova!.id;
    await db
      .prepare("INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) VALUES (?, NULL, 'em_followup', 'proposta registrada', ?)")
      .bind(oportunidadeId, autor.id)
      .run();
  } else {
    await mudarSituacao(db, oportunidadeId, "em_followup", autor.id);
  }

  const p = await db
    .prepare(
      `INSERT INTO propostas (oportunidade_id, servico, valor, apresentada_em, data_decisao, quem_decide, dor, validade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(
      oportunidadeId,
      dados.servico,
      dados.valor,
      dados.apresentadaEm,
      dados.dataDecisao ?? null,
      dados.quemDecide,
      dados.dor ?? "",
      dados.validade ?? null,
    )
    .first<LinhaProposta>();
  const proposta = propostaDeLinha(p!);

  const resultados = await db.batch(
    datasDaCadencia(dados.apresentadaEm).map((t) =>
      db.prepare("INSERT INTO toques (proposta_id, codigo, previsto_para) VALUES (?, ?, ?) RETURNING *").bind(proposta.id, t.codigo, t.previstoPara),
    ),
  );
  const toques = resultados.map((r) => toqueDeLinha(r.results[0] as LinhaToque));
  return { proposta, toques };
}

const ORDEM_ESTADO: Record<EstadoFollowup, number> = { atrasado: 0, hoje: 1, em_dia: 2, sem_toque: 3 };

/**
 * As propostas na rua (oportunidade em follow-up), com o próximo toque e o atraso.
 * O closer vê as dele; o diretor vê todas. Atrasados primeiro, depois hoje, em dia e sem toque.
 */
export async function listarFollowup(db: D1Database, quem: Pessoa, hoje: string): Promise<ItemFollowup[]> {
  const soDele = quem.cargo !== "diretor";
  const filtro = soDele ? "AND o.closer_id = ?" : "";
  const extra = soDele ? [quem.id] : [];
  // Sem listas de ids na consulta: o D1 aceita no máximo 100 parâmetros.
  const ultimaProposta = `
    SELECT p.id FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id
    WHERE o.situacao = 'em_followup' ${filtro}
      AND p.id = (SELECT MAX(id) FROM propostas WHERE oportunidade_id = o.id)`;
  const [{ results: oportunidades }, { results: propostas }, { results: toques }, { results: respostas }] = await db.batch([
    db.prepare(`${SELECT_OPORTUNIDADE} WHERE o.situacao = 'em_followup' ${filtro}`).bind(...extra),
    db.prepare(`SELECT * FROM propostas WHERE id IN (${ultimaProposta})`).bind(...extra),
    db.prepare(`SELECT * FROM toques WHERE proposta_id IN (${ultimaProposta}) ORDER BY previsto_para, id`).bind(...extra),
    // Respostas de Projetos às pendências técnicas, para o próximo toque (spec, seção 6, "Técnico").
    db
      .prepare(
        `SELECT pe.*, rp.nome AS respondida_por_nome FROM pendencias pe LEFT JOIN pessoas rp ON rp.id = pe.respondida_por
         WHERE pe.resposta IS NOT NULL AND pe.situacao IN ('respondida', 'fechada')
           AND pe.oportunidade_id IN (SELECT o.id FROM oportunidades o WHERE o.situacao = 'em_followup' ${filtro})
         ORDER BY pe.id`,
      )
      .bind(...extra),
  ]) as unknown as [
    { results: Parameters<typeof oportunidadeDeLinha>[0][] },
    { results: LinhaProposta[] },
    { results: LinhaToque[] },
    { results: Parameters<typeof pendenciaDeLinha>[0][] },
  ];

  const itens: ItemFollowup[] = [];
  for (const linha of propostas) {
    const o = oportunidades.find((x) => x.id === linha.oportunidade_id);
    if (!o) continue;
    const oportunidade = oportunidadeDeLinha(o);
    const pendentes = toques.filter((t) => t.proposta_id === linha.id && !t.feito_em).map(toqueDeLinha);
    const atrasados = pendentes.filter((t) => t.previstoPara < hoje).length;
    const proximo = pendentes[0] ?? null;
    const estado: EstadoFollowup =
      atrasados > 0 ? "atrasado" : !proximo ? "sem_toque" : proximo.previstoPara === hoje ? "hoje" : "em_dia";
    const respostasTecnicas = respostas.filter((p) => p.oportunidade_id === oportunidade.id).map(pendenciaDeLinha);
    itens.push({ oportunidade, proposta: propostaDeLinha(linha), proximo, atrasados, estado, respostasTecnicas });
  }
  return itens.sort(
    (a, b) =>
      ORDEM_ESTADO[a.estado] - ORDEM_ESTADO[b.estado] ||
      (a.proximo?.previstoPara ?? "").localeCompare(b.proximo?.previstoPara ?? "") ||
      a.proposta.apresentadaEm.localeCompare(b.proposta.apresentadaEm) ||
      a.proposta.id - b.proposta.id,
  );
}

/** De quem é o toque (para conferir a permissão na rota). */
export async function donoDoToque(db: D1Database, toqueId: number): Promise<{ closerId: number | null; oportunidadeId: number } | null> {
  const l = await db
    .prepare(
      `SELECT o.closer_id, o.id AS oportunidade_id FROM toques t
       JOIN propostas p ON p.id = t.proposta_id JOIN oportunidades o ON o.id = p.oportunidade_id WHERE t.id = ?`,
    )
    .bind(toqueId)
    .first<{ closer_id: number | null; oportunidade_id: number }>();
  return l ? { closerId: l.closer_id, oportunidadeId: l.oportunidade_id } : null;
}

/** Registra o toque feito. Um toque só é registrado uma vez. */
export async function registrarToque(
  db: D1Database,
  toqueId: number,
  dados: { canal: string; resultado: string },
  autor: Pessoa,
): Promise<Toque> {
  const l = await db
    .prepare(
      `UPDATE toques SET feito_em = datetime('now'), canal = ?, resultado = ?, autor_id = ?
       WHERE id = ? AND feito_em IS NULL RETURNING *`,
    )
    .bind(dados.canal, dados.resultado, autor.id, toqueId)
    .first<LinhaToque>();
  if (l) return toqueDeLinha(l);
  const existe = await db.prepare("SELECT id FROM toques WHERE id = ?").bind(toqueId).first();
  throw new Error(existe ? "toque_ja_feito" : "nao_encontrado");
}

/**
 * Encerra a proposta: ganha (com valor), perdida (com motivo) ou nutrição.
 * Só muda oportunidade em follow-up (uma gravação só); o campo do outro resultado fica vazio.
 */
export async function registrarResultado(
  db: D1Database,
  oportunidadeId: number,
  r: ResultadoProposta,
  autor: Pessoa,
): Promise<Oportunidade> {
  const valor = r.resultado === "ganha" ? r.valor : null;
  const motivo = r.resultado === "perdida" ? r.motivo : null;
  const mudou = await db
    .prepare(
      `UPDATE oportunidades SET situacao = ?, valor_fechado = ?, motivo_perda = ?, retomar_em = ?, atualizado_em = datetime('now')
       WHERE id = ? AND situacao = 'em_followup' RETURNING id`,
    )
    .bind(r.resultado, valor, motivo, r.resultado === "nutricao" ? retomarOuPadrao(r.retomarEm) : null, oportunidadeId)
    .first<{ id: number }>();
  if (!mudou) {
    if (!(await buscarOportunidade(db, oportunidadeId))) throw new Error("nao_encontrado");
    throw new Error("ja_encerrada");
  }
  await db
    .prepare("INSERT INTO historico (oportunidade_id, de, para, autor_id) VALUES (?, 'em_followup', ?, ?)")
    .bind(oportunidadeId, r.resultado, autor.id)
    .run();
  return (await buscarOportunidade(db, oportunidadeId))!;
}

/**
 * Propostas apresentadas no mês, oportunidades ganhas no mês e a média de pactos das reuniões de proposta
 * concluídas no mês (hora de São Paulo; null sem reunião).
 */
export async function numerosDoMes(
  db: D1Database,
  quem: Pessoa,
  hoje: string,
): Promise<{ propostas: number; ganhas: number; pactosPorReuniao: number | null }> {
  const mes = hoje.slice(0, 7);
  const soDele = quem.cargo !== "diretor";
  const filtro = soDele ? "AND o.closer_id = ?" : "";
  const extra = soDele ? [quem.id] : [];
  const propostas = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id
       WHERE substr(p.apresentada_em, 1, 7) = ? ${filtro}`,
    )
    .bind(mes, ...extra)
    .first<{ n: number }>();
  const ganhas = await db
    .prepare(
      `SELECT COUNT(DISTINCT h.oportunidade_id) AS n FROM historico h JOIN oportunidades o ON o.id = h.oportunidade_id
       WHERE h.para = 'ganha' AND o.situacao = 'ganha' AND substr(datetime(h.em, '-3 hours'), 1, 7) = ? ${filtro}`,
    )
    .bind(mes, ...extra)
    .first<{ n: number }>();
  const pactos = await db
    .prepare(
      `SELECT COUNT(*) AS n, AVG(json_array_length(COALESCE(r.pactos, '[]'))) AS media
       FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id
       WHERE r.tipo = 'proposta' AND r.situacao = 'concluida' AND substr(datetime(r.encerrada_em, '-3 hours'), 1, 7) = ? ${filtro}`,
    )
    .bind(mes, ...extra)
    .first<{ n: number; media: number | null }>();
  return { propostas: propostas?.n ?? 0, ganhas: ganhas?.n ?? 0, pactosPorReuniao: pactos?.n ? pactos.media : null };
}
