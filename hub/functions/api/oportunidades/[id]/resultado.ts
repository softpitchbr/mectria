import { eDonoDaOportunidade, podeCuidarDoFollowup } from "../../../../compartilhado/permissoes";
import { registrarResultado } from "../../../../servidor/followup";
import { buscarOportunidade } from "../../../../servidor/oportunidades";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarResultado } from "../../../../servidor/validacao";

/** POST /api/oportunidades/:id/resultado: ganha, perdida ou nutrição. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Só closer e diretor registram resultado.");
  const oportunidade = await buscarOportunidade(env.DB, Number(params.id));
  if (!oportunidade) return erro("nao_encontrado", "Oportunidade não encontrada.");
  if (!eDonoDaOportunidade(data.pessoa, oportunidade.closerId)) {
    return erro("sem_permissao", "Essa oportunidade é de outro closer. Assuma antes de registrar.");
  }
  const validado = validarResultado(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  return json(await registrarResultado(env.DB, oportunidade.id, validado.dados, data.pessoa));
};
