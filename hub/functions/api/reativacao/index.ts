import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeCuidarDoFollowup } from "../../../compartilhado/permissoes";
import { listarReativacao } from "../../../servidor/reativacao";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/reativacao: oportunidades em nutrição cuja hora de retomar chegou (closer: as dele; diretor: todas). */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Só closer e diretor veem a reativação.");
  return json(await listarReativacao(env.DB, data.pessoa, hojeEmSaoPaulo()));
};
