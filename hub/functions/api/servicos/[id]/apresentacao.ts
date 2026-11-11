import { podeCadastrarServicos } from "../../../../compartilhado/permissoes";
import { CABECALHOS_DA_APRESENTACAO, lerApresentacao, removerApresentacao, salvarApresentacao } from "../../../../servidor/apresentacoes";
import { erro, json } from "../../../../servidor/respostas";
import { NAO_ENCONTRADO, SO_O_DIRETOR } from "../../../../servidor/servicos";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarArquivoDaApresentacao } from "../../../../servidor/validacao";

/** GET /api/servicos/:id/apresentacao: o HTML, isolado (o iframe da janela da reunião carrega daqui). */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ env, params }) => {
  const html = await lerApresentacao(env, String(params.id));
  if (html === null) return erro("nao_encontrado", "Esse serviço não tem apresentação própria.");
  return new Response(html, { headers: CABECALHOS_DA_APRESENTACAO });
};

/** PUT /api/servicos/:id/apresentacao: o diretor envia (ou troca) o HTML. Corpo: { arquivo, html }. */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const validado = validarArquivoDaApresentacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  const servico = await salvarApresentacao(env, String(params.id), validado.dados, data.pessoa);
  return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
};

/** DELETE /api/servicos/:id/apresentacao: a reunião desse serviço volta para a apresentação de exemplo. */
export const onRequestDelete: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const servico = await removerApresentacao(env, String(params.id), data.pessoa);
  return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
};
