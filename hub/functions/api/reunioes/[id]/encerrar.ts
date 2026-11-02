import { acessarReuniao } from "../../../../servidor/acessoReuniao";
import { encerrarDiagnostica } from "../../../../servidor/diagnostica";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarFechamento } from "../../../../servidor/validacao";

/** POST /api/reunioes/:id/encerrar: fechamento obrigatório da diagnóstica. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const acesso = await acessarReuniao(env.DB, data.pessoa, params.id, true);
  if (acesso instanceof Response) return acesso;
  if (acesso.reuniao.tipo !== "diagnostica") return erro("invalido", "Essa reunião não é uma diagnóstica.");
  const validado = validarFechamento(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await encerrarDiagnostica(env.DB, acesso.reuniao.id, validado.dados, data.pessoa));
  } catch (e) {
    if (e instanceof Error && e.message === "ja_encerrada") return erro("conflito", "Essa reunião já foi encerrada.");
    if (e instanceof Error && e.message === "ja_passou") return erro("conflito", "Essa oportunidade já passou da diagnóstica.");
    if (e instanceof Error && e.message === "nao_e_diagnostica") return erro("invalido", "Essa reunião não é uma diagnóstica.");
    throw e;
  }
};
