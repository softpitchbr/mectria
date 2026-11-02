import { podeCuidarDoFollowup } from "../../../compartilhado/permissoes";
import { assumir, buscarOportunidade } from "../../../servidor/oportunidades";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo } from "../../../servidor/validacao";

/** PATCH /api/oportunidades/:id com { assumir: true }: o closer assume a oportunidade de um colega. */
export const onRequestPatch: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Só closer e diretor assumem oportunidades.");
  const id = Number(params.id);
  if (!Number.isInteger(id) || !(await buscarOportunidade(env.DB, id))) return erro("nao_encontrado", "Oportunidade não encontrada.");
  const corpo = (await lerCorpo(request)) as { assumir?: unknown } | null;
  if (corpo?.assumir !== true) return erro("invalido", "Nada para mudar.");
  try {
    return json(await assumir(env.DB, id, data.pessoa));
  } catch (e) {
    if (e instanceof Error && e.message === "ja_encerrada") return erro("conflito", "Essa oportunidade já foi encerrada.");
    throw e;
  }
};
