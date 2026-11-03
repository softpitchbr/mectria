import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { sessaoDaProposta } from "../../../../servidor/proposta";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** GET /api/reunioes/:id/proposta: tudo o que o painel da proposta precisa. */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  if (acesso.reuniao.tipo !== "proposta") return erro("invalido", "Essa reunião não é uma proposta.");
  return json(await sessaoDaProposta(env.DB, acesso.reuniao.id));
};
