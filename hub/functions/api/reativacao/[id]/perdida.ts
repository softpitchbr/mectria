import { respostaDoErroDeReativacao, semPermissaoNaReativacao } from "../../../../servidor/errosDaReativacao";
import { perderNaReativacao } from "../../../../servidor/reativacao";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarMotivoDePerda } from "../../../../servidor/validacao";

/** POST /api/reativacao/:id/perdida { motivo }: encerra a cadência sem aderência. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const negado = semPermissaoNaReativacao(data.pessoa);
  if (negado) return negado;
  const validado = validarMotivoDePerda(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    await perderNaReativacao(env.DB, Number(params.id), validado.dados, data.pessoa);
    return json({ ok: true });
  } catch (e) {
    const resposta = respostaDoErroDeReativacao(e);
    if (resposta) return resposta;
    throw e;
  }
};
