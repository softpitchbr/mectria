import { eDonoDaOportunidade } from "../compartilhado/permissoes";
import type { Oportunidade, Reuniao } from "../compartilhado/oportunidade";
import { buscarReuniao } from "./diagnostica";
import { buscarOportunidade } from "./oportunidades";
import { erro } from "./respostas";
import type { Pessoa } from "./tipos";

export type Acesso = { reuniao: Reuniao; oportunidade: Oportunidade; dono: boolean };

/** Quem mexe na reunião: o closer dono, o diretor e, na diagnóstica, o hunter que marcou (dono = true); o hunter vê a proposta e Projetos lê a diagnóstica. */
export async function acessarReuniao(
  db: D1Database,
  pessoa: Pessoa,
  idTexto: string | string[] | undefined,
  precisaSerDono: boolean,
): Promise<Acesso | Response> {
  const id = Number(idTexto);
  const reuniao = Number.isInteger(id) ? await buscarReuniao(db, id) : null;
  if (!reuniao) return erro("nao_encontrado", "Reunião não encontrada.");
  const oportunidade = (await buscarOportunidade(db, reuniao.oportunidadeId))!;
  const quemMarcou = pessoa.cargo === "hunter" && oportunidade.hunterId === pessoa.id;
  // Fase 6: a diagnóstica normalmente é do hunter com um projetista; quem marcou conduz. A proposta continua do closer.
  const dono = eDonoDaOportunidade(pessoa, oportunidade.closerId) || (quemMarcou && reuniao.tipo === "diagnostica");
  // Projetos lê a ficha e o briefing da diagnóstica; a reunião de proposta tem valores, que Projetos não vê.
  const projetosLendo = pessoa.cargo === "projetos" && reuniao.tipo === "diagnostica";
  if (dono || (!precisaSerDono && (quemMarcou || projetosLendo))) return { reuniao, oportunidade, dono };
  return erro("sem_permissao", "Essa reunião é de outro closer.");
}
