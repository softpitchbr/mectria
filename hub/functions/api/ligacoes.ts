import { hojeEmSaoPaulo } from "../../compartilhado/datas";
import { podeContarLigacoes } from "../../compartilhado/permissoes";
import { erro, json } from "../../servidor/respostas";
import { atualizarRotinaDe, contarLigacoes, registrarLigacao } from "../../servidor/rotina";
import type { DadosApi, Env } from "../../servidor/tipos";
import { lerCorpo, validarLigacao } from "../../servidor/validacao";

const SEM_PERMISSAO = "O bloco de ligações é do hunter.";

/** GET /api/ligacoes: a contagem de hoje. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeContarLigacoes(data.pessoa.cargo)) return erro("sem_permissao", SEM_PERMISSAO);
  return json(await contarLigacoes(env.DB, data.pessoa.id, hojeEmSaoPaulo()));
};

/** POST /api/ligacoes: conta uma ligação de hoje (não atendeu, atendeu ou marcou). */
export const onRequestPost: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  if (!podeContarLigacoes(data.pessoa.cargo)) return erro("sem_permissao", SEM_PERMISSAO);
  const validado = validarLigacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  const hoje = hojeEmSaoPaulo();
  const contagem = await registrarLigacao(env.DB, data.pessoa.id, hoje, validado.dados);
  await atualizarRotinaDe(env.DB, data.pessoa.id, hoje);
  return json(contagem);
};
