import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { marcarBriefingEnviado } from "../../../../servidor/diagnostica";
import { json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/reunioes/:id/briefing: marca o briefing como enviado para Projetos. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  return json(await marcarBriefingEnviado(env.DB, acesso.reuniao.id));
};
