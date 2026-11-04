import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { marcarBriefingEnviado } from "../../../../servidor/diagnostica";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/reunioes/:id/briefing: marca o briefing como enviado para Projetos. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  try {
    return json(await marcarBriefingEnviado(env.DB, acesso.reuniao.id));
  } catch (e) {
    if (e instanceof Error && e.message === "nao_concluida") return erro("conflito", "O briefing só vai para Projetos depois da diagnóstica concluída.");
    throw e;
  }
};
