import { podeCadastrarServicos } from "../../../compartilhado/permissoes";
import { erro, json } from "../../../servidor/respostas";
import { atualizarServico, buscarServico, NAO_ENCONTRADO, NOME_REPETIDO, SO_O_DIRETOR } from "../../../servidor/servicos";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarServico } from "../../../servidor/validacao";

/** GET /api/servicos/:id (qualquer cargo). */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ env, params }) => {
  const servico = await buscarServico(env.DB, String(params.id));
  return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
};

/** PUT /api/servicos/:id: o diretor troca os dados, as perguntas técnicas e o roteiro. */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const validado = validarServico(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    const servico = await atualizarServico(env.DB, String(params.id), validado.dados, data.pessoa);
    return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
  } catch (e) {
    if (e instanceof Error && e.message === "nome_duplicado") return erro("conflito", NOME_REPETIDO);
    throw e;
  }
};
