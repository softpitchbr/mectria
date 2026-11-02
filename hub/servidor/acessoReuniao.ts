import { eDonoDaOportunidade } from "../compartilhado/permissoes";
import type { Oportunidade, Reuniao } from "../compartilhado/oportunidade";
import { buscarReuniao } from "./diagnostica";
import { buscarOportunidade } from "./oportunidades";
import { erro } from "./respostas";
import type { Pessoa } from "./tipos";

export type Acesso = { reuniao: Reuniao; oportunidade: Oportunidade; dono: boolean };

/** Quem mexe na reunião: o closer dono ou o diretor (dono = true); o hunter que marcou só vê (dono = false). */
export async function acessarReuniao(db: D1Database, pessoa: Pessoa, idTexto: string | string[] | undefined, precisaSerDono: boolean): Promise<Acesso | Response> {
  const id = Number(idTexto);
  const reuniao = Number.isInteger(id) ? await buscarReuniao(db, id) : null;
  if (!reuniao) return erro("nao_encontrado", "Reunião não encontrada.");
  const oportunidade = (await buscarOportunidade(db, reuniao.oportunidadeId))!;
  const dono = eDonoDaOportunidade(pessoa, oportunidade.closerId);
  const quemMarcou = pessoa.cargo === "hunter" && oportunidade.hunterId === pessoa.id;
  if (dono || (!precisaSerDono && quemMarcou)) return { reuniao, oportunidade, dono };
  return erro("sem_permissao", "Essa reunião é de outro closer.");
}
