import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { salvarVariaveis } from "../../../../servidor/proposta";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarVariaveis } from "../../../../servidor/validacao";
import { erroDaReuniao } from "../../../../servidor/errosDaReuniao";

/** PUT /api/reunioes/:id/variaveis: a preparação da apresentação do cliente. */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const validado = validarVariaveis(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    await salvarVariaveis(env.DB, acesso.reuniao.id, validado.dados);
    return json({ ok: true });
  } catch (e) {
    return erroDaReuniao(e, acesso.reuniao.tipo);
  }
};
