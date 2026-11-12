import { idDoServico, vendavel, type ArquivoDaApresentacao, type DadosDoServico, type PerguntaTecnica, type Servico, type SituacaoServico, type SlideDoRoteiro } from "../compartilhado/servico";
import type { Pessoa } from "./tipos";

export interface LinhaServico {
  id: string;
  nome: string;
  sigla: string;
  resumo: string;
  dores: string;
  entregamos: string;
  fica_com_cliente: string;
  ancora_valor: string;
  situacao: SituacaoServico;
  perguntas: string;
  roteiro: string | null;
  apresentacao: string | null;
}

export const SO_O_DIRETOR = "Só o diretor comercial cadastra os serviços.";
export const NOME_REPETIDO = "Já existe um serviço com esse nome.";
export const NAO_ENCONTRADO = "Serviço não encontrado.";

export const COLUNAS_SERVICO = "id, nome, sigla, resumo, dores, entregamos, fica_com_cliente, ancora_valor, situacao, perguntas, roteiro, apresentacao";

const lista = <T>(texto: string | null): T[] => {
  try {
    const v = texto ? JSON.parse(texto) : [];
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
};
const objetoOuNulo = <T>(texto: string | null): T | null => {
  if (!texto) return null;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
};

export function servicoDeLinha(l: LinhaServico): Servico {
  return {
    id: l.id,
    nome: l.nome,
    sigla: l.sigla,
    resumo: l.resumo,
    dores: lista<string>(l.dores),
    entregamos: lista<string>(l.entregamos),
    ficaComCliente: lista<string>(l.fica_com_cliente),
    ancoraValor: l.ancora_valor,
    situacao: l.situacao,
    perguntas: lista<PerguntaTecnica>(l.perguntas),
    roteiro: objetoOuNulo<SlideDoRoteiro[]>(l.roteiro),
    apresentacao: objetoOuNulo<ArquivoDaApresentacao>(l.apresentacao),
  };
}

/** Todos os serviços, na ordem da carta (os novos no fim). */
export async function listarServicos(db: D1Database): Promise<Servico[]> {
  const { results } = await db.prepare(`SELECT ${COLUNAS_SERVICO} FROM servicos ORDER BY ordem, id`).all<LinhaServico>();
  return results.map(servicoDeLinha);
}

export async function buscarServico(db: D1Database, id: string): Promise<Servico | null> {
  const l = await db.prepare(`SELECT ${COLUNAS_SERVICO} FROM servicos WHERE id = ?1`).bind(id).first<LinhaServico>();
  return l ? servicoDeLinha(l) : null;
}

/** Os ids dos serviços: todos, ou só os que podem ser vendidos (para oportunidade nova). */
export async function idsDosServicos(db: D1Database, { soVendaveis }: { soVendaveis: boolean }): Promise<Set<string>> {
  const { results } = await db.prepare("SELECT id, situacao FROM servicos").all<{ id: string; situacao: SituacaoServico }>();
  return new Set(results.filter((s) => !soVendaveis || vendavel(s)).map((s) => s.id));
}

/** O nome comparado sem acento, sem maiúscula e sem espaço sobrando. */
const chaveDoNome = (nome: string) =>
  nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

async function nomesEmUso(db: D1Database): Promise<{ id: string; nome: string }[]> {
  return (await db.prepare("SELECT id, nome FROM servicos").all<{ id: string; nome: string }>()).results;
}

const camposDe = (d: DadosDoServico) => [
  d.nome,
  d.sigla,
  d.resumo,
  JSON.stringify(d.dores),
  JSON.stringify(d.entregamos),
  JSON.stringify(d.ficaComCliente),
  d.ancoraValor,
  d.situacao,
  JSON.stringify(d.perguntas),
  d.roteiro ? JSON.stringify(d.roteiro) : null,
];

/** Cria o serviço no fim da lista. O id sai do nome (servico-novo, servico-novo-2...). Lança nome_duplicado. */
export async function criarServico(db: D1Database, dados: DadosDoServico, autor: Pessoa): Promise<Servico> {
  const existentes = await nomesEmUso(db);
  if (existentes.some((s) => chaveDoNome(s.nome) === chaveDoNome(dados.nome))) throw new Error("nome_duplicado");
  const base = idDoServico(dados.nome) || "servico";
  const ids = new Set(existentes.map((s) => s.id));
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
  const l = await db
    .prepare(
      `INSERT INTO servicos (id, ordem, nome, sigla, resumo, dores, entregamos, fica_com_cliente, ancora_valor, situacao, perguntas, roteiro, atualizado_por)
       SELECT ?1, COALESCE(MAX(ordem), 0) + 1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12 FROM servicos
       RETURNING ${COLUNAS_SERVICO}`,
    )
    .bind(id, ...camposDe(dados), autor.nome)
    .first<LinhaServico>();
  return servicoDeLinha(l!);
}

/** Troca os dados, as perguntas e o roteiro do serviço (a apresentação tem rota própria). Null se não existe. */
export async function atualizarServico(db: D1Database, id: string, dados: DadosDoServico, autor: Pessoa): Promise<Servico | null> {
  const existentes = await nomesEmUso(db);
  if (!existentes.some((s) => s.id === id)) return null;
  if (existentes.some((s) => s.id !== id && chaveDoNome(s.nome) === chaveDoNome(dados.nome))) throw new Error("nome_duplicado");
  const l = await db
    .prepare(
      `UPDATE servicos SET nome = ?2, sigla = ?3, resumo = ?4, dores = ?5, entregamos = ?6, fica_com_cliente = ?7, ancora_valor = ?8,
         situacao = ?9, perguntas = ?10, roteiro = ?11, atualizado_por = ?12, atualizado_em = datetime('now')
       WHERE id = ?1 RETURNING ${COLUNAS_SERVICO}`,
    )
    .bind(id, ...camposDe(dados), autor.nome)
    .first<LinhaServico>();
  return l ? servicoDeLinha(l) : null;
}
