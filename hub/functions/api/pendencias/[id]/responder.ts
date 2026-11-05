import { podeResponderPendencia } from "../../../../compartilhado/permissoes";
import { respostaDoErroDaPendencia } from "../../../../servidor/errosDaPendencia";
import { responderPendencia } from "../../../../servidor/pendencias";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarResposta } from "../../../../servidor/validacao";

/** POST /api/pendencias/:id/responder { resposta }: Projetos responde a dúvida técnica. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeResponderPendencia(data.pessoa.cargo)) return erro("sem_permissao", "Só Projetos responde as pendências técnicas.");
  const validado = validarResposta(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await responderPendencia(env.DB, Number(params.id), validado.dados, data.pessoa));
  } catch (e) {
    const resposta = respostaDoErroDaPendencia(e);
    if (resposta) return resposta;
    throw e;
  }
};
