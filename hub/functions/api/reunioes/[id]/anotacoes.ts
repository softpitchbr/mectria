import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { salvarAnotacao } from "../../../../servidor/diagnostica";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarAnotacao } from "../../../../servidor/validacao";

/** POST /api/reunioes/:id/anotacoes (a mesma idCliente não duplica). */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const validado = validarAnotacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  await salvarAnotacao(env.DB, acesso.reuniao.id, validado.dados, data.pessoa);
  return json({ ok: true });
};
