import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { salvarRespostas } from "../../../../servidor/diagnostica";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarRespostas } from "../../../../servidor/validacao";

/** PUT /api/reunioes/:id/respostas com { respostas: [{ perguntaId, resposta }] } */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const validado = validarRespostas(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  await salvarRespostas(env.DB, acesso.reuniao.id, validado.dados, data.pessoa);
  return json({ ok: true });
};
