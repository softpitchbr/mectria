import type { Anotacao, Marcacao, Respostas } from "../compartilhado/diagnostica";
import { variaveisIniciais, type Andamento, type PessoaNaSala, type SessaoProposta, type VariaveisProposta } from "../compartilhado/proposta";
import { buscarReuniao, motivoDaRecusa } from "./diagnostica";
import { buscarOportunidade } from "./oportunidades";

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

/** Grava o andamento inteiro (a última gravação vale). Aceita reunião concluída: o envio atrasado do painel é inofensivo. */
export async function salvarAndamento(db: D1Database, reuniaoId: number, a: Andamento): Promise<void> {
  const mudou = await db
    .prepare(
      `UPDATE reunioes SET sala = ?, pactos = ?, tempos = ?, slide_atual = ?, atualizado_em = datetime('now')
       WHERE id = ? AND tipo = 'proposta' AND situacao != 'cancelada' RETURNING id`,
    )
    .bind(JSON.stringify(a.sala), JSON.stringify(a.pactos), JSON.stringify(a.tempos), a.slide, reuniaoId)
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
    db.prepare("SELECT variaveis, sala, pactos, tempos, slide_atual FROM reunioes WHERE id = ?").bind(reuniaoId),
    db.prepare("SELECT id_cliente, minuto, passo, marcacao, texto, criado_em FROM anotacoes WHERE reuniao_id = ? ORDER BY id").bind(reuniaoId),
    // A última diagnóstica concluída da oportunidade: é dela que vêm as palavras do cliente.
    db
      .prepare(
        `SELECT pergunta_id, resposta FROM fichas WHERE reuniao_id = (
           SELECT id FROM reunioes WHERE oportunidade_id = ? AND tipo = 'diagnostica' AND situacao = 'concluida' ORDER BY id DESC LIMIT 1)`,
      )
      .bind(reuniao.oportunidadeId),
  ]);
  const l = linha.results[0] as { variaveis: string | null; sala: string | null; pactos: string | null; tempos: string | null; slide_atual: number };
  return {
    reuniao,
    oportunidade,
    variaveis: lerJson(l.variaveis, variaveisIniciais(oportunidade.servico)),
    andamento: {
      sala: lerJson(l.sala, salaInicial(reuniao.quemDecide, oportunidade.contato)),
      pactos: lerJson(l.pactos, []),
      tempos: lerJson(l.tempos, {}),
      slide: l.slide_atual,
    },
    anotacoes: (anotacoes.results as { id_cliente: string; minuto: number; passo: string; marcacao: Marcacao | null; texto: string; criado_em: string }[]).map(
      (a): Anotacao => ({ idCliente: a.id_cliente, minuto: a.minuto, passo: a.passo, marcacao: a.marcacao, texto: a.texto, criadoEm: a.criado_em }),
    ),
    respostasDaDiagnostica: Object.fromEntries((respostas.results as { pergunta_id: string; resposta: string }[]).map((r) => [r.pergunta_id, r.resposta])) as Respostas,
  };
}
