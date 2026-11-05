import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeCuidarDoFollowup } from "../../../compartilhado/permissoes";
import { numerosDoMes } from "../../../servidor/followup";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/numeros/mes: propostas apresentadas e ganhas no mês (closer: as dele; diretor: todas). */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não tem números de proposta.");
  return json(await numerosDoMes(env.DB, data.pessoa, hojeEmSaoPaulo()));
};
