import { podeCadastrarServicos } from "../../../../compartilhado/permissoes";
import { CABECALHOS_DA_APRESENTACAO, lerApresentacao, removerApresentacao, salvarApresentacao } from "../../../../servidor/apresentacoes";
import { erro, json } from "../../../../servidor/respostas";
import { NAO_ENCONTRADO, SO_O_DIRETOR } from "../../../../servidor/servicos";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarArquivoDaApresentacao } from "../../../../servidor/validacao";

/** GET /api/servicos/:id/apresentacao?v=N: o HTML da versão N, isolado (o iframe da janela da reunião carrega daqui). */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ request, env, params }) => {
  const versao = Number(new URL(request.url).searchParams.get("v"));
  // A resposta de erro vai sem cache: uma versão que o KV ainda não propagou aparece na próxima tentativa.
  const html = Number.isInteger(versao) && versao > 0 ? await lerApresentacao(env, String(params.id), versao) : null;
  if (html === null) return erro("nao_encontrado", "Essa apresentação não existe (ou acabou de ser trocada). Recarregue.");
  return new Response(html, { headers: CABECALHOS_DA_APRESENTACAO });
};

/** PUT /api/servicos/:id/apresentacao: o diretor envia (ou troca) o HTML. Corpo: { arquivo, html }. */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const validado = validarArquivoDaApresentacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    const servico = await salvarApresentacao(env, String(params.id), validado.dados, data.pessoa);
    return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
  } catch (e) {
    if (e instanceof Error && e.message === "conflito") return erro("conflito", "Outra apresentação foi enviada ao mesmo tempo. Recarregue a página e confira.");
    throw e;
  }
};

/** DELETE /api/servicos/:id/apresentacao: a reunião desse serviço volta para a apresentação de exemplo. */
export const onRequestDelete: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const servico = await removerApresentacao(env, String(params.id), data.pessoa);
  return servico ? json(servico) : erro("nao_encontrado", NAO_ENCONTRADO);
};
