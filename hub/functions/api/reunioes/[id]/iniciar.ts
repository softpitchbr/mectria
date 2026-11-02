import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { iniciarReuniao } from "../../../../servidor/diagnostica";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/reunioes/:id/iniciar */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  try {
    return json(await iniciarReuniao(env.DB, acesso.reuniao.id));
  } catch (e) {
    if (e instanceof Error && e.message === "ja_encerrada") return erro("conflito", "Essa reunião já foi encerrada.");
    if (e instanceof Error && e.message === "ja_passou") return erro("conflito", "Essa oportunidade já passou da diagnóstica.");
    if (e instanceof Error && e.message === "nao_e_diagnostica") return erro("invalido", "Essa reunião não é uma diagnóstica.");
    throw e;
  }
};
