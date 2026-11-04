import { respostaDoErroDeReativacao, semPermissaoNaReativacao } from "../../../../servidor/errosDaReativacao";
import { reativarComReuniao } from "../../../../servidor/reativacao";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarReuniaoDeReativacao } from "../../../../servidor/validacao";

/** POST /api/reativacao/:id/reuniao { dataHora, formato }: marca a diagnóstica e volta a oportunidade para a agenda. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const negado = semPermissaoNaReativacao(data.pessoa);
  if (negado) return negado;
  const validado = validarReuniaoDeReativacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await reativarComReuniao(env.DB, Number(params.id), validado.dados, data.pessoa), 201);
  } catch (e) {
    const resposta = respostaDoErroDeReativacao(e);
    if (resposta) return resposta;
    throw e;
  }
};
