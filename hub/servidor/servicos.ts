import type { ArquivoDaApresentacao, PerguntaTecnica, Servico, SituacaoServico, SlideDoRoteiro } from "../compartilhado/servico";

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
