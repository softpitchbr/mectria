import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { eDonoDaOportunidade, podeCuidarDoFollowup } from "../../compartilhado/permissoes";
import { registrarProposta } from "../../servidor/followup";
import { buscarOportunidade } from "../../servidor/oportunidades";
import { erro, json } from "../../servidor/respostas";
import { idsDosServicos } from "../../servidor/servicos";
import type { DadosApi, Env } from "../../servidor/tipos";
import { lerCorpo, validarNovaProposta } from "../../servidor/validacao";

/** POST /api/propostas: registra a proposta apresentada e cria os toques da cadência. */
export const onRequestPost: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeCuidarDoFollowup(data.pessoa.cargo)) return erro("sem_permissao", "Só closer e diretor registram propostas.");
  const validado = validarNovaProposta(await lerCorpo(request), hojeEmSaoPaulo(), await idsDosServicos(env.DB, { soVendaveis: true }));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  if (validado.dados.oportunidadeId !== undefined) {
    const o = await buscarOportunidade(env.DB, validado.dados.oportunidadeId);
    if (!o) return erro("nao_encontrado", "Oportunidade não encontrada.");
    if (o.situacao !== "diagnostica_marcada" && o.situacao !== "proposta_marcada") {
      return erro("invalido", "Essa oportunidade já tem proposta em andamento ou encerrada.");
    }
    if (!eDonoDaOportunidade(data.pessoa, o.closerId)) {
      return erro("sem_permissao", "Essa oportunidade é de outro closer. Assuma antes de registrar.");
    }
  }
  return json(await registrarProposta(env.DB, validado.dados, data.pessoa), 201);
};
