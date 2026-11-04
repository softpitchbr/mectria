import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { registrarConfirmacao } from "../../../../servidor/confirmacao";
import { erroDaReuniao } from "../../../../servidor/errosDaReuniao";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarConfirmacao } from "../../../../servidor/validacao";

/** POST /api/reunioes/:id/confirmacao { fup: 1 | 2 | 3 } ou { confirmada: true }: a confirmação da diagnóstica no dia. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const validado = validarConfirmacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await registrarConfirmacao(env.DB, acesso.reuniao.id, validado.dados));
  } catch (e) {
    if (e instanceof Error && e.message === "fora_de_ordem") return erro("conflito", "Mande o FUP anterior antes deste.");
    return erroDaReuniao(e, acesso.reuniao.tipo);
  }
};
