import { SERVICOS } from "../compartilhado/dados/servicos";
import { ROTULO_SITUACAO, type Situacao } from "../compartilhado/oportunidade";
import type { Pessoa } from "./tipos";

/** O detalhe da linha do histórico que registra a exclusão de dados pessoais (não é mudança de situação). */
export const DETALHE_LGPD = "Dados pessoais apagados a pedido (LGPD)";

const TABELAS = [
  "pessoas",
  "oportunidades",
  "reunioes",
  "propostas",
  "toques",
  "fichas",
  "anotacoes",
  "pendencias",
  "historico",
  "rotinas",
  "ligacoes",
] as const;

/** Exportação completa do banco, para a MecTRIA guardar ou levar para outro sistema (spec, seção 8). */
export async function exportarTudo(db: D1Database): Promise<{ geradoEm: string; tabelas: Record<(typeof TABELAS)[number], unknown[]> }> {
  const resultados = await db.batch(TABELAS.map((t) => db.prepare(`SELECT * FROM ${t} ORDER BY rowid`)));
  const tabelas = Object.fromEntries(TABELAS.map((t, i) => [t, resultados[i].results])) as Record<(typeof TABELAS)[number], unknown[]>;
  return { geradoEm: new Date().toISOString(), tabelas };
}

const COLUNAS = ["Empresa", "Serviço", "Closer", "Apresentada em", "Decidida em", "Resultado", "Valor apresentado", "Valor fechado", "Motivo"];

/** Campo do CSV: neutraliza fórmula (=, +, -, @) e põe aspas quando tem ; aspas ou quebra de linha. */
function campo(valor: string): string {
  let v = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  if (/[;"\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** 1250000 centavos viram "12.500,00" (o Excel em português lê como número). */
function reais(centavos: number | null): string {
  if (centavos === null) return "";
  const inteiro = Math.floor(Math.abs(centavos) / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${centavos < 0 ? "-" : ""}${inteiro},${String(Math.abs(centavos) % 100).padStart(2, "0")}`;
}

const dia = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "");

/**
 * CSV do Histórico do mês (decisão 5 do plano da fase 6): uma linha por proposta apresentada no mês, com o resultado
 * até agora. Colunas genéricas até chegar a planilha da MecTRIA (pedido 33). Separado por ponto e vírgula, com BOM.
 */
export async function csvDoHistorico(db: D1Database, mes: string): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT o.empresa, o.servico, c.nome AS closer, p.apresentada_em, o.situacao, p.valor, o.valor_fechado, o.motivo_perda,
         CASE WHEN o.situacao IN ('ganha', 'perdida', 'nutricao')
           THEN (SELECT date(MAX(h.em), '-3 hours') FROM historico h WHERE h.oportunidade_id = o.id AND h.para = o.situacao AND h.de IS NOT h.para) END AS decidida_em
       FROM propostas p JOIN oportunidades o ON o.id = p.oportunidade_id LEFT JOIN pessoas c ON c.id = o.closer_id
       WHERE substr(p.apresentada_em, 1, 7) = ? ORDER BY p.apresentada_em, p.id`,
    )
    .bind(mes)
    .all<{
      empresa: string;
      servico: string;
      closer: string | null;
      apresentada_em: string;
      situacao: Situacao;
      valor: number;
      valor_fechado: number | null;
      motivo_perda: string | null;
      decidida_em: string | null;
    }>();
  const linhas = results.map((l) =>
    [
      l.empresa,
      SERVICOS.find((s) => s.id === l.servico)?.nome ?? l.servico,
      l.closer ?? "",
      dia(l.apresentada_em),
      dia(l.decidida_em),
      ROTULO_SITUACAO[l.situacao],
      reais(l.valor),
      l.situacao === "ganha" ? reais(l.valor_fechado) : "",
      l.motivo_perda ?? "",
    ]
      .map(campo)
      .join(";"),
  );
  return `﻿${[COLUNAS.join(";"), ...linhas].join("\r\n")}`;
}

/**
 * LGPD (decisão 6): apaga contato, telefone, e-mail, quem decide e os nomes da sala; os dados do projeto ficam.
 * Pode ser repetido; cada vez fica no histórico.
 */
export async function apagarDadosPessoais(db: D1Database, oportunidadeId: number, autor: Pessoa): Promise<void> {
  const existe = await db.prepare("SELECT id FROM oportunidades WHERE id = ?").bind(oportunidadeId).first();
  if (!existe) throw new Error("nao_encontrado");
  await db.batch([
    db
      .prepare("UPDATE oportunidades SET contato = 'Dados apagados (LGPD)', telefone = '', email = '', atualizado_em = datetime('now') WHERE id = ?")
      .bind(oportunidadeId),
    db.prepare("UPDATE propostas SET quem_decide = '' WHERE oportunidade_id = ?").bind(oportunidadeId),
    db.prepare("UPDATE reunioes SET quem_decide = NULL, sala = NULL WHERE oportunidade_id = ?").bind(oportunidadeId),
    // As respostas sobre quem decide e quem assina guardam nomes.
    db
      .prepare(
        `UPDATE fichas SET resposta = '' WHERE pergunta_id IN ('a-decisores', 'a-processo')
         AND reuniao_id IN (SELECT id FROM reunioes WHERE oportunidade_id = ?)`,
      )
      .bind(oportunidadeId),
    db
      .prepare(
        `INSERT INTO historico (oportunidade_id, de, para, detalhe, autor_id)
         SELECT id, situacao, situacao, ?, ? FROM oportunidades WHERE id = ?`,
      )
      .bind(DETALHE_LGPD, autor.id, oportunidadeId),
  ]);
}
