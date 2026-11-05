import { nomeDoToque } from "../compartilhado/cadencia";
import { reativacoesDoDia } from "./reativacao";
import { reagendamentosDoDia } from "./reagendamento";
import { BLOCOS_DA_ROTINA, META_CONEXOES_SEMANA, META_LIGACOES_DIA, MINIMO_LIGACOES_DIA } from "../compartilhado/dados/rotinas";
import { ehDiaUtil, inicioDaSemana } from "../compartilhado/datas";
import type { ContagemLigacoes, DiaDeRotina, ItemRotina, ResultadoLigacao, ResumoPessoa } from "../compartilhado/oportunidade";
import { listarReunioes } from "./oportunidades";
import { buscarPorId, listar } from "./pessoas";
import type { Pessoa } from "./tipos";

export async function registrarLigacao(db: D1Database, pessoaId: number, dia: string, resultado: ResultadoLigacao): Promise<ContagemLigacoes> {
  await db.prepare("INSERT INTO ligacoes (pessoa_id, dia, resultado) VALUES (?, ?, ?)").bind(pessoaId, dia, resultado).run();
  return contarLigacoes(db, pessoaId, dia);
}

export async function contarLigacoes(db: D1Database, pessoaId: number, dia: string): Promise<ContagemLigacoes> {
  const l = await db
    .prepare(
      `SELECT SUM(dia = ?2) AS total,
         SUM(dia = ?2 AND resultado = 'nao_atendeu') AS nao_atendeu, SUM(dia = ?2 AND resultado = 'atendeu') AS atendeu,
         SUM(dia = ?2 AND resultado = 'conexao') AS conexao, SUM(dia = ?2 AND resultado = 'marcou') AS marcou,
         SUM(resultado IN ('conexao', 'marcou')) AS conexoes_semana
       FROM ligacoes WHERE pessoa_id = ?1 AND dia BETWEEN ?3 AND ?2`,
    )
    .bind(pessoaId, dia, inicioDaSemana(dia))
    .first<{ total: number | null; nao_atendeu: number | null; atendeu: number | null; conexao: number | null; marcou: number | null; conexoes_semana: number | null }>();
  return {
    total: l?.total ?? 0,
    naoAtendeu: l?.nao_atendeu ?? 0,
    atendeu: l?.atendeu ?? 0,
    marcou: l?.marcou ?? 0,
    meta: META_LIGACOES_DIA,
    conexao: l?.conexao ?? 0,
    conexoesSemana: l?.conexoes_semana ?? 0,
    metaConexoesSemana: META_CONEXOES_SEMANA,
  };
}

interface LinhaRotina {
  chave: string;
  titulo: string;
  origem: "fixo" | "gerado";
  feito_em: string | null;
}

interface ToqueDoDia {
  id: number;
  codigo: string;
  empresa: string;
  feito_em: string | null;
  situacao: string;
  proposta_id: number;
}

/**
 * Toques do closer que entram no dia: os pendentes até o dia, os feitos no dia (hora de São Paulo)
 * e os que já estão na rotina do dia. Sem lista de ids na consulta (o D1 aceita no máximo 100 parâmetros).
 */
async function toquesDoDia(db: D1Database, closerId: number, dia: string): Promise<ToqueDoDia[]> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.codigo, o.empresa, t.feito_em, o.situacao, p.id AS proposta_id
       FROM toques t
       JOIN propostas p ON p.id = t.proposta_id
       JOIN oportunidades o ON o.id = p.oportunidade_id
       WHERE o.closer_id = ?
         AND p.id = (SELECT MAX(id) FROM propostas WHERE oportunidade_id = o.id)
         AND ((t.feito_em IS NULL AND t.previsto_para <= ? AND o.situacao = 'em_followup')
              OR (t.feito_em IS NOT NULL AND date(t.feito_em, '-3 hours') = ?)
              OR t.id IN (SELECT CAST(substr(chave, 7) AS INTEGER) FROM rotinas
                          WHERE pessoa_id = ? AND dia = ? AND chave LIKE 'toque:%'))
       ORDER BY t.previsto_para, t.id`,
    )
    .bind(closerId, dia, dia, closerId, dia)
    .all<ToqueDoDia>();
  // Toque pendente de proposta que já terminou sai do dia; o que foi feito fica.
  return results.filter((t) => t.feito_em !== null || t.situacao === "em_followup");
}

/**
 * A rotina do dia: itens fixos do cargo + gerados (reuniões do dia e toques do closer).
 * Com persistir, grava os itens em `rotinas` para o histórico ficar estável.
 */
export async function rotinaDoDia(db: D1Database, pessoa: Pessoa, dia: string, persistir = true): Promise<DiaDeRotina> {
  const { results: linhas } = await db
    .prepare("SELECT chave, titulo, origem, feito_em FROM rotinas WHERE pessoa_id = ? AND dia = ?")
    .bind(pessoa.id, dia)
    .all<LinhaRotina>();
  const salvo = new Map(linhas.map((l) => [l.chave, l]));
  const itens: ItemRotina[] = [];

  const blocosDoCargo = BLOCOS_DA_ROTINA[pessoa.cargo];
  const leads = pessoa.cargo === "closer" ? await leadsPorEtapa(db, pessoa.id) : null;

  for (const bloco of blocosDoCargo) {
    for (const fixo of bloco.fixos) {
      if (fixo.chave === "cold-call") {
        const c = await contarLigacoes(db, pessoa.id, dia);
        itens.push({
          chave: fixo.chave,
          titulo: fixo.titulo,
          bloco: bloco.id,
          origem: "fixo",
          automatico: true,
          feito: c.total >= MINIMO_LIGACOES_DIA,
          contagem: { feitas: c.conexoesSemana, meta: c.metaConexoesSemana, rotulo: "conexões na semana" },
        });
      } else if (fixo.automaticoQuandoVazio && leads && (leads[bloco.id] ?? 0) === 0) {
        // Docs/17: se o bloco não tem nenhum lead, a tarefa fica feita. Chave própria, para não deixar a tarefa
        // de verdade marcada quando um lead entrar no bloco no mesmo dia.
        itens.push({ chave: `${fixo.chave}-sem-lead`, titulo: fixo.titulo, bloco: bloco.id, origem: "fixo", automatico: true, feito: true });
      } else {
        itens.push({ chave: fixo.chave, titulo: fixo.titulo, bloco: bloco.id, origem: "fixo", automatico: false, feito: !!salvo.get(fixo.chave)?.feito_em });
      }
    }
    for (const gerado of await geradosDoBloco(db, pessoa, dia, bloco.id)) itens.push({ ...gerado, bloco: bloco.id });
  }

  if (persistir) {
    const atuais = itens.map((i) => i.chave);
    const comandos = [
      db
        .prepare(
          `DELETE FROM rotinas WHERE pessoa_id = ? AND dia = ? AND (origem = 'fixo' OR feito_em IS NULL)
           AND chave NOT IN (SELECT value FROM json_each(?))`,
        )
        .bind(pessoa.id, dia, JSON.stringify(atuais)),
      ...itens.map((i) =>
        db
          .prepare(
            `INSERT INTO rotinas (pessoa_id, dia, chave, titulo, origem, feito_em) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT (pessoa_id, dia, chave) DO UPDATE SET titulo = excluded.titulo,
               feito_em = CASE WHEN ? THEN COALESCE(rotinas.feito_em, excluded.feito_em) ELSE rotinas.feito_em END`,
          )
          .bind(pessoa.id, dia, i.chave, i.titulo, i.origem, i.feito ? new Date().toISOString() : null, i.automatico ? 1 : 0),
      ),
    ];
    // Automático que deixou de estar feito (não acontece hoje) volta a pendente.
    for (const i of itens.filter((x) => x.automatico && !x.feito)) {
      comandos.push(db.prepare("UPDATE rotinas SET feito_em = NULL WHERE pessoa_id = ? AND dia = ? AND chave = ?").bind(pessoa.id, dia, i.chave));
    }
    await db.batch(comandos);
  }

  const feitos = itens.filter((i) => i.feito).length;
  const blocos = blocosDoCargo.map((b) => {
    const doBloco = itens.filter((i) => i.bloco === b.id);
    return { id: b.id, titulo: b.titulo, orientacao: b.orientacao, feitos: doBloco.filter((i) => i.feito).length, total: doBloco.length };
  });
  return { dia, itens, feitos, total: itens.length, blocos };
}

/** Quantos leads o closer tem em cada bloco: em negociação (follow-up), em AP e em construção de proposta. */
async function leadsPorEtapa(db: D1Database, closerId: number): Promise<Record<string, number>> {
  const l = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM oportunidades WHERE closer_id = ?1 AND situacao = 'em_followup') AS fechamento,
         (SELECT COUNT(*) FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id
          WHERE o.closer_id = ?1 AND o.situacao = 'proposta_marcada' AND r.tipo = 'proposta' AND r.situacao IN ('marcada', 'em_andamento')
            AND r.variaveis IS NOT NULL AND json_extract(r.variaveis, '$.valor') IS NOT NULL) AS ap,
         (SELECT COUNT(*) FROM reunioes r JOIN oportunidades o ON o.id = r.oportunidade_id
          WHERE o.closer_id = ?1 AND o.situacao = 'proposta_marcada' AND r.tipo = 'proposta' AND r.situacao IN ('marcada', 'em_andamento')
            AND (r.variaveis IS NULL OR json_extract(r.variaveis, '$.valor') IS NULL)) AS construcao`,
    )
    .bind(closerId)
    .first<{ fechamento: number; ap: number; construcao: number }>();
  return { fechamento: l?.fechamento ?? 0, ap: l?.ap ?? 0, construcao: l?.construcao ?? 0 };
}

/** Os itens gerados de cada bloco: reagendar e confirmar (hunter); toques do dia e reativar (closer). */
async function geradosDoBloco(db: D1Database, pessoa: Pessoa, dia: string, bloco: string): Promise<ItemRotina[]> {
  if (bloco === "reagendamentos") {
    return (await reagendamentosDoDia(db, pessoa, dia)).map((r) => ({
      chave: `reagendar:${r.oportunidadeId}`,
      titulo: `Reagendar ${r.empresa}`,
      origem: "gerado" as const,
      automatico: true,
      feito: r.feito,
      link: "/",
    }));
  }
  if (bloco === "confirmacoes") {
    return (await listarReunioes(db, dia, dia, { hunterId: pessoa.id }))
      .filter((r) => r.tipo === "diagnostica" && r.situacao !== "cancelada")
      .map((r) => ({
        chave: `confirmar:${r.id}`,
        titulo: `Confirmar a diagnóstica de ${r.empresa} às ${r.dataHora.slice(11, 16)}`,
        origem: "gerado" as const,
        automatico: true,
        feito: !!r.confirmadaEm || r.situacao === "concluida",
        link: "/",
      }));
  }
  if (bloco === "fechamento") {
    return (await toquesDoDia(db, pessoa.id, dia)).map((t) => ({
      chave: `toque:${t.id}`,
      titulo: `${nomeDoToque(t.codigo)} · ${t.empresa}`,
      origem: "gerado" as const,
      automatico: true,
      feito: t.feito_em !== null,
      link: `/follow-up?proposta=${t.proposta_id}`,
    }));
  }
  if (bloco === "reativacao") {
    return (await reativacoesDoDia(db, pessoa, dia)).map((r) => ({
      chave: `reativar:${r.id}`,
      titulo: `Reativar ${r.empresa}`,
      origem: "gerado" as const,
      automatico: true,
      feito: r.feito,
      link: "/follow-up?aba=reativacao",
    }));
  }
  return [];
}

/** Regrava a rotina do dia de uma pessoa depois de algo que marca item sozinho (toque, ligação). */
export async function atualizarRotinaDe(db: D1Database, pessoaId: number | null, dia: string): Promise<void> {
  if (pessoaId === null) return;
  const pessoa = await buscarPorId(db, pessoaId);
  if (pessoa && pessoa.ativo && BLOCOS_DA_ROTINA[pessoa.cargo].length > 0) await rotinaDoDia(db, pessoa, dia);
}

/** Marca ou desmarca um item manual do dia. */
export async function marcarItem(db: D1Database, pessoa: Pessoa, dia: string, chave: string, feito: boolean): Promise<DiaDeRotina> {
  const atual = await rotinaDoDia(db, pessoa, dia);
  const item = atual.itens.find((i) => i.chave === chave);
  if (!item) throw new Error("item_inexistente");
  if (item.automatico) throw new Error("item_automatico");
  await db
    .prepare("UPDATE rotinas SET feito_em = ? WHERE pessoa_id = ? AND dia = ? AND chave = ?")
    .bind(feito ? new Date().toISOString() : null, pessoa.id, dia, chave)
    .run();
  return rotinaDoDia(db, pessoa, dia);
}

/**
 * O dia `ate` (sempre, mesmo em feriado ou fim de semana) e os dias úteis antes dele, do mais
 * recente para o mais antigo; 0/0 quando a pessoa não abriu o hub.
 */
export async function historicoDeRotina(db: D1Database, pessoaId: number, ate: string, dias = 14): Promise<{ dia: string; feitos: number; total: number }[]> {
  const lista: string[] = [ate];
  let cursor = new Date(`${ate}T12:00:00Z`);
  while (lista.length < dias) {
    cursor = new Date(cursor.getTime() - 86_400_000);
    const dia = cursor.toISOString().slice(0, 10);
    if (ehDiaUtil(dia)) lista.push(dia);
  }
  const { results } = await db
    .prepare(
      `SELECT dia, COUNT(*) AS total, COUNT(feito_em) AS feitos FROM rotinas
       WHERE pessoa_id = ? AND dia >= ? AND dia <= ? GROUP BY dia`,
    )
    .bind(pessoaId, lista[lista.length - 1], ate)
    .all<{ dia: string; total: number; feitos: number }>();
  const porDia = new Map(results.map((r) => [r.dia, r]));
  return lista.map((dia) => ({ dia, feitos: porDia.get(dia)?.feitos ?? 0, total: porDia.get(dia)?.total ?? 0 }));
}

/** Para o diretor: rotina de hoje e follow-ups atrasados de cada hunter e closer ativo. Não grava nada. */
export async function resumoDoTime(db: D1Database, hoje: string): Promise<ResumoPessoa[]> {
  const pessoas = (await listar(db)).filter((p) => p.ativo && (p.cargo === "hunter" || p.cargo === "closer"));
  const resumo: ResumoPessoa[] = [];
  for (const p of pessoas) {
    const dia = await rotinaDoDia(db, p, hoje, false);
    const atrasados =
      p.cargo === "closer"
        ? (
            await db
              .prepare(
                `SELECT COUNT(*) AS n FROM toques t JOIN propostas pr ON pr.id = t.proposta_id JOIN oportunidades o ON o.id = pr.oportunidade_id
                 WHERE o.closer_id = ? AND o.situacao = 'em_followup' AND t.feito_em IS NULL AND t.previsto_para < ?
                   AND pr.id = (SELECT MAX(id) FROM propostas WHERE oportunidade_id = o.id)`,
              )
              .bind(p.id, hoje)
              .first<{ n: number }>()
          )?.n ?? 0
        : 0;
    const conexoesSemana = p.cargo === "hunter" ? (await contarLigacoes(db, p.id, hoje)).conexoesSemana : undefined;
    resumo.push({
      pessoa: { id: p.id, nome: p.nome, cargo: p.cargo },
      rotina: { feitos: dia.feitos, total: dia.total },
      atrasados,
      ...(conexoesSemana === undefined ? {} : { conexoesSemana }),
    });
  }
  return resumo;
}
