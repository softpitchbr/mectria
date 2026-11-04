import { podeVer } from "../../compartilhado/permissoes";
import { listarBriefings } from "../../servidor/pendencias";
import { erro, json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** GET /api/briefings: as diagnósticas com o briefing enviado para Projetos, as mais novas primeiro. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeVer(data.pessoa.cargo, "briefings")) return erro("sem_permissao", "Os briefings são de Projetos e do diretor.");
  return json(await listarBriefings(env.DB));
};
