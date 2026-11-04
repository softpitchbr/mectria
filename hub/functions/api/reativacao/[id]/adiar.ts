import { respostaDoErroDeReativacao, semPermissaoNaReativacao } from "../../../../servidor/errosDaReativacao";
import { adiarReativacao } from "../../../../servidor/reativacao";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarAdiamento } from "../../../../servidor/validacao";

/** POST /api/reativacao/:id/adiar { retomarEm }: "ainda não", com o novo mês. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const negado = semPermissaoNaReativacao(data.pessoa);
  if (negado) return negado;
  const validado = validarAdiamento(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    await adiarReativacao(env.DB, Number(params.id), validado.dados, data.pessoa);
    return json({ ok: true });
  } catch (e) {
    const resposta = respostaDoErroDeReativacao(e);
    if (resposta) return resposta;
    throw e;
  }
};
