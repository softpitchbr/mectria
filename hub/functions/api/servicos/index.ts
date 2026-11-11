import { podeCadastrarServicos } from "../../../compartilhado/permissoes";
import { erro, json } from "../../../servidor/respostas";
import { criarServico, listarServicos, NOME_REPETIDO, SO_O_DIRETOR } from "../../../servidor/servicos";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarServico } from "../../../servidor/validacao";

/** GET /api/servicos: todos os serviços, na ordem da carta (qualquer cargo). */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env }) => json(await listarServicos(env.DB));

/** POST /api/servicos: o diretor cria um serviço. */
export const onRequestPost: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const validado = validarServico(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await criarServico(env.DB, validado.dados, data.pessoa), 201);
  } catch (e) {
    if (e instanceof Error && e.message === "nome_duplicado") return erro("conflito", NOME_REPETIDO);
    throw e;
  }
};
