import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { podeCuidarDoFollowup } from "../../compartilhado/permissoes";
import { listarFollowup } from "../../servidor/followup";
import { erro, json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** GET /api/followup: propostas na rua com o próximo toque, atrasados primeiro. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não cuida de follow-up.");
  return json(await listarFollowup(env.DB, data.pessoa, hojeEmSaoPaulo()));
};
