import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { salvarAndamento } from "../../../../servidor/proposta";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarAndamento } from "../../../../servidor/validacao";
import { erroDaReuniao } from "../../../../servidor/errosDaReuniao";

/** PUT /api/reunioes/:id/andamento: sala, pactos, tempos e slide atual (a última gravação vale). */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const validado = validarAndamento(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    await salvarAndamento(env.DB, acesso.reuniao.id, validado.dados);
    return json({ ok: true });
  } catch (e) {
    return erroDaReuniao(e, acesso.reuniao.tipo);
  }
};
