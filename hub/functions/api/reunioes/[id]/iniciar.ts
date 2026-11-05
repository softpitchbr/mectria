import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { iniciarReuniao } from "../../../../servidor/diagnostica";
import { erroDaReuniao } from "../../../../servidor/errosDaReuniao";
import { json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/reunioes/:id/iniciar (diagnóstica ou proposta). */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  try {
    return json(await iniciarReuniao(env.DB, acesso.reuniao.id));
  } catch (e) {
    return erroDaReuniao(e, acesso.reuniao.tipo);
  }
};
