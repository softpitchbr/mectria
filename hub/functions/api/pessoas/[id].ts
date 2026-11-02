import { podeGerenciarPessoas } from "../../../compartilhado/permissoes";
import { atualizar, buscarPorId, contarDiretoresAtivos } from "../../../servidor/pessoas";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarMudancas } from "../../../servidor/validacao";

/** PATCH /api/pessoas/:id: muda nome, cargo ou se a pessoa está ativa. Ninguém é apagado. */
export const onRequestPatch: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const eu = data.pessoa;
  if (!podeGerenciarPessoas(eu.cargo)) return erro("sem_acesso", "Só o diretor comercial gerencia o time.");

  const id = Number(params.id);
  const alvo = Number.isInteger(id) && id > 0 ? await buscarPorId(env.DB, id) : null;
  if (!alvo) return erro("nao_encontrado", "Pessoa não encontrada.");

  const validado = validarMudancas(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  const mudancas = validado.dados;

  if (mudancas.ativo === false && alvo.id === eu.id) {
    return erro("conflito", "Você não pode desativar o seu próprio acesso.");
  }

  const deixaDeSerDiretor =
    alvo.cargo === "diretor" && alvo.ativo && (mudancas.ativo === false || (mudancas.cargo !== undefined && mudancas.cargo !== "diretor"));
  if (deixaDeSerDiretor && (await contarDiretoresAtivos(env.DB)) <= 1) {
    return erro("ultimo_diretor", "O time precisa de pelo menos um diretor comercial ativo.");
  }

  return json(await atualizar(env.DB, alvo.id, mudancas));
};
