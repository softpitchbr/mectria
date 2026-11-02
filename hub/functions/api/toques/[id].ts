import { eDonoDaOportunidade, podeCuidarDoFollowup } from "../../../compartilhado/permissoes";
import { donoDoToque, registrarToque } from "../../../servidor/followup";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarToque } from "../../../servidor/validacao";

/** PATCH /api/toques/:id: registra o toque feito (canal e resultado). */
export const onRequestPatch: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não cuida de follow-up.");
  const id = Number(params.id);
  const dono = Number.isInteger(id) ? await donoDoToque(env.DB, id) : null;
  if (!dono) return erro("nao_encontrado", "Toque não encontrado.");
  if (!eDonoDaOportunidade(data.pessoa, dono.closerId)) {
    return erro("sem_permissao", "Essa proposta é de outro closer. Assuma antes de registrar.");
  }
  const validado = validarToque(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await registrarToque(env.DB, id, validado.dados, data.pessoa));
  } catch (e) {
    if (e instanceof Error && e.message === "toque_ja_feito") return erro("conflito", "Esse toque já foi registrado.");
    throw e;
  }
};
