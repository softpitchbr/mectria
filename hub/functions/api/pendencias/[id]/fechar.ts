import { podeResponderPendencia } from "../../../../compartilhado/permissoes";
import { respostaDoErroDaPendencia } from "../../../../servidor/errosDaPendencia";
import { fecharPendencia } from "../../../../servidor/pendencias";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";

/** POST /api/pendencias/:id/fechar: fecha a pendência já respondida. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  if (!podeResponderPendencia(data.pessoa.cargo)) return erro("sem_permissao", "Só Projetos fecha as pendências técnicas.");
  try {
    return json(await fecharPendencia(env.DB, Number(params.id)));
  } catch (e) {
    const resposta = respostaDoErroDaPendencia(e);
    if (resposta) return resposta;
    throw e;
  }
};
