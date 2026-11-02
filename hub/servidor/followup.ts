import { datasDaCadencia } from "../compartilhado/cadencia";
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
  const { results: oportunidades } = await db
    .prepare(`${SELECT_OPORTUNIDADE} WHERE o.situacao = 'em_followup' ${soDele ? "AND o.closer_id = ?" : ""}`)
    .bind(...(soDele ? [quem.id] : []))
    .all<Parameters<typeof oportunidadeDeLinha>[0]>();
  if (oportunidades.length === 0) return [];

  const ids = oportunidades.map((o) => o.id);
  const marcas = ids.map(() => "?").join(", ");
  const { results: propostas } = await db
    .prepare(
      `SELECT p.* FROM propostas p
       WHERE p.oportunidade_id IN (${marcas})
         AND p.id = (SELECT MAX(id) FROM propostas WHERE oportunidade_id = p.oportunidade_id)`,
    )
    .bind(...ids)
    .all<LinhaProposta>();
  const idsPropostas = propostas.map((p) => p.id);
  const { results: toques } = idsPropostas.length
    ? await db
        .prepare(`SELECT * FROM toques WHERE proposta_id IN (${idsPropostas.map(() => "?").join(", ")}) ORDER BY previsto_para, id`)
        .bind(...idsPropostas)
        .all<LinhaToque>()
    : { results: [] as LinhaToque[] };

  const itens: ItemFollowup[] = [];
  for (const linha of propostas) {
    const oportunidade = oportunidadeDeLinha(oportunidades.find((o) => o.id === linha.oportunidade_id)!);
    const pendentes = toques.filter((t) => t.proposta_id === linha.id && !t.feito_em).map(toqueDeLinha);
    const atrasados = pendentes.filter((t) => t.previstoPara < hoje).length;
    const proximo = pendentes[0] ?? null;
    const estado: EstadoFollowup =
      atrasados > 0 ? "atrasado" : !proximo ? "sem_toque" : proximo.previstoPara === hoje ? "hoje" : "em_dia";
    itens.push({ oportunidade, proposta: propostaDeLinha(linha), proximo, atrasados, estado });
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

/** Encerra a proposta: ganha (com valor), perdida (com motivo) ou nutrição. */
export async function registrarResultado(
  db: D1Database,
  oportunidadeId: number,
  r: ResultadoProposta,
  autor: Pessoa,
): Promise<Oportunidade> {
  if (!(await buscarOportunidade(db, oportunidadeId))) throw new Error("nao_encontrado");
  if (r.resultado === "ganha") return mudarSituacao(db, oportunidadeId, "ganha", autor.id, { valorFechado: r.valor });
  if (r.resultado === "perdida") return mudarSituacao(db, oportunidadeId, "perdida", autor.id, { motivoPerda: r.motivo });
  return mudarSituacao(db, oportunidadeId, "nutricao", autor.id);
}

/** Propostas apresentadas no mês e oportunidades ganhas no mês (hora de São Paulo). */
export async function numerosDoMes(db: D1Database, quem: Pessoa, hoje: string): Promise<{ propostas: number; ganhas: number }> {
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
  return { propostas: propostas?.n ?? 0, ganhas: ganhas?.n ?? 0 };
}
