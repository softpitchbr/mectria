import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { encerrarDiagnostica } from "../../../../servidor/diagnostica";
import { erroDaReuniao } from "../../../../servidor/errosDaReuniao";
import { encerrarProposta } from "../../../../servidor/proposta";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarFechamento, validarFechamentoProposta } from "../../../../servidor/validacao";

/** POST /api/reunioes/:id/encerrar: fechamento obrigatório (diagnóstica ou proposta, conforme a reunião). */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  const corpo = await lerCorpo(request);
  try {
    if (acesso.reuniao.tipo === "proposta") {
      const validado = validarFechamentoProposta(corpo);
      if (!validado.ok) return erro("invalido", validado.mensagem);
      return json(await encerrarProposta(env.DB, acesso.reuniao.id, validado.dados, data.pessoa));
    }
    const validado = validarFechamento(corpo);
    if (!validado.ok) return erro("invalido", validado.mensagem);
    return json(await encerrarDiagnostica(env.DB, acesso.reuniao.id, validado.dados, data.pessoa));
  } catch (e) {
    return erroDaReuniao(e, acesso.reuniao.tipo);
  }
};
