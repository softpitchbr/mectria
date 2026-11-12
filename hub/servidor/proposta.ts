import { datasDaCadencia } from "../compartilhado/cadencia";
import { hojeEmSaoPaulo } from "../compartilhado/datas";
import { DIAGNOSTICA } from "../compartilhado/dados/diagnostica";
import type { Anotacao, Marcacao, Respostas } from "../compartilhado/diagnostica";
import type { Reuniao } from "../compartilhado/oportunidade";
import {
  variaveisIniciais,
  type Andamento,
  type FechamentoProposta,
  type PessoaNaSala,
  type SessaoProposta,
  type VariaveisProposta,
} from "../compartilhado/proposta";
import { buscarReuniao, motivoDaRecusa, OPORTUNIDADE_NA_ETAPA } from "./diagnostica";
import { buscarOportunidade } from "./oportunidades";
import { buscarServico } from "./servicos";
import type { Pessoa } from "./tipos";

function lerJson<T>(texto: string | null | undefined, padrao: T): T {
  if (!texto) return padrao;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return padrao;
  }
}

/** Grava as variáveis da apresentação do cliente (só reunião de proposta ainda não encerrada). */
export async function salvarVariaveis(db: D1Database, reuniaoId: number, v: VariaveisProposta): Promise<void> {
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET variaveis = ?, atualizado_em = datetime('now')
       WHERE id = ? AND tipo = 'proposta' AND situacao IN ('marcada', 'em_andamento') RETURNING id`,
    )
    .bind(JSON.stringify(v), reuniaoId)
    .first();
  if (!mudou) throw new Error(await motivoDaRecusa(db, reuniaoId, "proposta"));
}

/** Grava o andamento inteiro (a última gravação vale), só enquanto a reunião não encerrou: uma aba velha não reescreve os pactos. */
export async function salvarAndamento(db: D1Database, reuniaoId: number, a: Andamento): Promise<void> {
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET sala = ?, pactos = ?, tempos = ?, slide_atual = ?, interacoes = ?, atualizado_em = datetime('now')
       WHERE id = ? AND tipo = 'proposta' AND situacao IN ('marcada', 'em_andamento') RETURNING id`,
    )
    .bind(JSON.stringify(a.sala), JSON.stringify(a.pactos), JSON.stringify(a.tempos), a.slide, a.interacoes ? JSON.stringify(a.interacoes) : null, reuniaoId)
    .first();
  if (!mudou) throw new Error(await motivoDaRecusa(db, reuniaoId, "proposta"));
}

/** Quem começa na sala: quem decide (do fechamento da diagnóstica) e o contato, se for outra pessoa. */
function salaInicial(quemDecide: string | null, contato: string): PessoaNaSala[] {
  const sala: PessoaNaSala[] = [];
  if (quemDecide?.trim()) sala.push({ nome: quemDecide.trim(), decide: true });
  if (contato.trim() && contato.trim().toLowerCase() !== quemDecide?.trim().toLowerCase()) sala.push({ nome: contato.trim(), decide: false });
  return sala;
}

/** Tudo o que o painel da proposta precisa: reunião, oportunidade, preparação, andamento, anotações e a diagnóstica. */
export async function sessaoDaProposta(db: D1Database, reuniaoId: number): Promise<SessaoProposta | null> {
  const reuniao = await buscarReuniao(db, reuniaoId);
  if (!reuniao || reuniao.tipo !== "proposta") return null;
  const oportunidade = (await buscarOportunidade(db, reuniao.oportunidadeId))!;
  const [linha, anotacoes, respostas] = await db.batch([
    db.prepare("SELECT variaveis, sala, pactos, tempos, slide_atual, interacoes FROM reunioes WHERE id = ?").bind(reuniaoId),
    db.prepare("SELECT id_cliente, minuto, passo, marcacao, texto, criado_em FROM anotacoes WHERE reuniao_id = ? ORDER BY id").bind(reuniaoId),
    // A última diagnóstica concluída da oportunidade: é dela que vêm as palavras do cliente.
    db
      .prepare(
        `SELECT pergunta_id, resposta FROM fichas WHERE reuniao_id = (
           SELECT id FROM reunioes WHERE oportunidade_id = ? AND tipo = 'diagnostica' AND situacao = 'concluida' ORDER BY id DESC LIMIT 1)`,
      )
      .bind(reuniao.oportunidadeId),
  ]);
  const l = linha.results[0] as {
    variaveis: string | null;
    sala: string | null;
    pactos: string | null;
    tempos: string | null;
    slide_atual: number;
    interacoes: string | null;
  };
  const variaveis = l.variaveis ? lerJson(l.variaveis, null as VariaveisProposta | null) : null;
  const servicoId = variaveis?.servico ?? oportunidade.servico;
  const servico = await buscarServico(db, servicoId);
  const interacoes = lerJson<Andamento["interacoes"] | null>(l.interacoes, null);
  return {
    reuniao,
    oportunidade,
    variaveis: variaveis ?? variaveisIniciais(servicoId, servico),
    andamento: {
      sala: lerJson(l.sala, salaInicial(reuniao.quemDecide, oportunidade.contato)),
      pactos: lerJson(l.pactos, []),
      tempos: lerJson(l.tempos, {}),
      slide: l.slide_atual,
      ...(interacoes ? { interacoes } : {}),
    },
    servico,
    anotacoes: (anotacoes.results as { id_cliente: string; minuto: number; passo: string; marcacao: Marcacao | null; texto: string; criado_em: string }[]).map(
      (a): Anotacao => ({ idCliente: a.id_cliente, minuto: a.minuto, passo: a.passo, marcacao: a.marcacao, texto: a.texto, criadoEm: a.criado_em }),
    ),
    respostasDaDiagnostica: Object.fromEntries((respostas.results as { pergunta_id: string; resposta: string }[]).map((r) => [r.pergunta_id, r.resposta])) as Respostas,
  };
}

/** A pergunta da diagnóstica cuja resposta vira a "dor" da proposta (chave "dor"). */
const PERGUNTA_DA_DOR = DIAGNOSTICA.blocos.flatMap((b) => b.perguntas).find((p) => p.chave === "dor")!.id;

const SITUACAO_DEPOIS: Record<FechamentoProposta["desfecho"], "em_followup" | "ganha" | "perdida"> = {
  decidir: "em_followup",
  ajuste: "em_followup",
  ganho: "ganha",
  perdido: "perdida",
};

/**
 * Fechamento obrigatório da proposta: conclui a reunião, registra a proposta (com as variáveis copiadas),
 * cria os 7 toques quando o cliente vai decidir ou pediu ajuste, grava o histórico e muda a oportunidade.
 * Tudo num batch (uma transação); cada passo só vale se a primeira gravação concluiu a reunião agora.
 */
export async function encerrarProposta(
  db: D1Database,
  reuniaoId: number,
  f: FechamentoProposta,
  autor: Pessoa,
  hoje: string = hojeEmSaoPaulo(),
): Promise<{ reuniao: Reuniao; propostaId: number }> {
  const reuniao = await buscarReuniao(db, reuniaoId);
  if (!reuniao) throw new Error("nao_encontrada");
  if (reuniao.tipo !== "proposta") throw new Error("nao_e_proposta");
  const oportunidade = (await buscarOportunidade(db, reuniao.oportunidadeId))!;
  const linha = await db.prepare("SELECT variaveis FROM reunioes WHERE id = ?").bind(reuniaoId).first<{ variaveis: string | null }>();
  const lida = linha?.variaveis ? lerJson(linha.variaveis, null as VariaveisProposta | null) : null;
  const v = lida ?? variaveisIniciais(oportunidade.servico, await buscarServico(db, oportunidade.servico));

  const vaiDecidir = f.desfecho === "decidir" || f.desfecho === "ajuste";
  const para = SITUACAO_DEPOIS[f.desfecho];
  const observacao = f.desfecho === "perdido" ? f.motivo : vaiDecidir ? (f.observacao?.trim() ?? null) || null : null;
  // Depois da primeira gravação: esta reunião acabou de ser concluída e a oportunidade ainda está em proposta_marcada.
  const recemConcluida = `r.id = ? AND r.situacao = 'concluida' AND o.situacao = 'proposta_marcada'`;
  const deReuniao = `FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id WHERE ${recemConcluida}`;

  const resultados = await db.batch([
    db
      .prepare(
        `UPDATE reunioes SET situacao = 'concluida', encerrada_em = datetime('now'), resultado_proposta = ?, motivo = ?, atualizado_em = datetime('now')
         WHERE id = ? AND tipo = 'proposta' AND situacao IN ('marcada', 'em_andamento') AND ${OPORTUNIDADE_NA_ETAPA} RETURNING id`,
      )
      .bind(f.desfecho, observacao, reuniaoId),
    db
      .prepare(
        `INSERT INTO propostas (oportunidade_id, reuniao_id, servico, valor, apresentada_em, data_decisao, quem_decide, dor, escopo, fica_com_cliente, prazo, condicoes, equipe)
         SELECT r.oportunidade_id, r.id, ?, ?, ?, ?, ?,
           COALESCE((SELECT f.resposta FROM fichas f JOIN reunioes d ON d.id = f.reuniao_id
                     WHERE d.oportunidade_id = r.oportunidade_id AND d.tipo = 'diagnostica' AND d.situacao = 'concluida' AND f.pergunta_id = ?
                     ORDER BY d.id DESC LIMIT 1), ''),
           ?, ?, ?, ?, ?
         ${deReuniao} RETURNING id`,
      )
      .bind(
        v.servico,
        f.valor,
        hoje,
        vaiDecidir ? f.dataDecisao : null,
        vaiDecidir ? f.quemDecide.trim() : "",
        PERGUNTA_DA_DOR,
        v.escopo,
        v.ficaComCliente,
        v.prazo,
        v.condicoes,
        v.equipe,
        reuniaoId,
      ),
    // Os toques da cadência, a partir da proposta desta reunião (só quando o cliente ainda vai decidir).
    ...(vaiDecidir
      ? datasDaCadencia(hoje).map((t) =>
          db
            .prepare(
              `INSERT INTO toques (proposta_id, codigo, previsto_para)
               SELECT p.id, ?, ? FROM propostas p JOIN reunioes r ON r.id = p.reuniao_id JOIN oportunidades o ON o.id = r.oportunidade_id
               WHERE p.reuniao_id = ? AND r.situacao = 'concluida' AND o.situacao = 'proposta_marcada'`,
            )
            .bind(t.codigo, t.previstoPara, reuniaoId),
        )
      : []),
    db.prepare(`INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id) SELECT o.id, o.situacao, ?, NULL, ? ${deReuniao}`).bind(para, autor.id, reuniaoId),
    db
      .prepare(
        `UPDATE oportunidades SET situacao = ?, valor_fechado = COALESCE(?, valor_fechado), motivo_perda = COALESCE(?, motivo_perda), atualizado_em = datetime('now')
         WHERE situacao = 'proposta_marcada' AND id = (SELECT oportunidade_id FROM reunioes WHERE id = ? AND situacao = 'concluida')`,
      )
      .bind(para, f.desfecho === "ganho" ? f.valorFechado : null, f.desfecho === "perdido" ? f.motivo : null, reuniaoId),
  ]);
  if (!resultados[0].results.length) throw new Error(await motivoDaRecusa(db, reuniaoId, "proposta"));
  const propostaId = (resultados[1].results[0] as { id: number }).id;
  return { reuniao: (await buscarReuniao(db, reuniaoId))!, propostaId };
}
