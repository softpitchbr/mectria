import { podeMarcarDiagnostica } from "../../../compartilhado/permissoes";
import { criarDiagnostica, listarOportunidades } from "../../../servidor/oportunidades";
import { buscarPorId } from "../../../servidor/pessoas";
import { idsDosServicos } from "../../../servidor/servicos";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarNovaDiagnostica } from "../../../servidor/validacao";

const SEM_PERMISSAO = "Seu cargo não trabalha com oportunidades.";

/** GET /api/oportunidades: o hunter vê as que marcou; closer e diretor, todas. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeMarcarDiagnostica(data.pessoa.cargo)) return erro("sem_permissao", SEM_PERMISSAO);
  return json(await listarOportunidades(env.DB, data.pessoa));
};

/** POST /api/oportunidades: marca uma diagnóstica (cria a oportunidade e a reunião). */
export const onRequestPost: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeMarcarDiagnostica(data.pessoa.cargo)) return erro("sem_permissao", SEM_PERMISSAO);
  const validado = validarNovaDiagnostica(await lerCorpo(request), await idsDosServicos(env.DB, { soVendaveis: true }));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  const closer = await buscarPorId(env.DB, validado.dados.closerId);
  if (!closer || !closer.ativo || (closer.cargo !== "closer" && closer.cargo !== "diretor")) {
    return erro("invalido", "Escolha o closer.");
  }
  return json(await criarDiagnostica(env.DB, validado.dados, data.pessoa), 201);
};
