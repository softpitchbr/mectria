import { podeGerenciarPessoas } from "../../../compartilhado/permissoes";
import { criar, listar } from "../../../servidor/pessoas";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarNovaPessoa } from "../../../servidor/validacao";

const SO_DIRETOR = "Só o diretor comercial gerencia o time.";

/** GET /api/pessoas: o time inteiro, ativas primeiro. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeGerenciarPessoas(data.pessoa.cargo)) return erro("sem_permissao", SO_DIRETOR);
  return json(await listar(env.DB));
};

/** POST /api/pessoas: cadastra alguém no time. */
export const onRequestPost: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeGerenciarPessoas(data.pessoa.cargo)) return erro("sem_permissao", SO_DIRETOR);
  const validado = validarNovaPessoa(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await criar(env.DB, validado.dados), 201);
  } catch (e) {
    if (e instanceof Error && e.message === "email_duplicado") return erro("conflito", "Já existe uma pessoa com esse e-mail.");
    throw e;
  }
};
