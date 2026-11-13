import { podeCadastrarServicos } from "../../../compartilhado/permissoes";
import {
  CABECALHOS_DA_APRESENTACAO,
  ehIdGeral,
  lerApresentacaoGeral,
  removerApresentacaoGeral,
  salvarApresentacaoGeral,
} from "../../../servidor/apresentacoes";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarArquivoDaApresentacao } from "../../../servidor/validacao";

const NAO_EXISTE = "Essa apresentação não existe.";
const SO_O_DIRETOR = "Só o diretor comercial envia as apresentações.";

/** GET /api/apresentacoes/:id?v=N: o HTML da versão N, isolado (o iframe da janela da diagnóstica carrega daqui). */
export const onRequestGet: PagesFunction<Env, "id", DadosApi> = async ({ request, env, params }) => {
  const id = String(params.id);
  const versao = Number(new URL(request.url).searchParams.get("v"));
  const html = ehIdGeral(id) && Number.isInteger(versao) && versao > 0 ? await lerApresentacaoGeral(env, id, versao) : null;
  if (html === null) return erro("nao_encontrado", "Essa apresentação não existe (ou acabou de ser trocada). Recarregue.");
  return new Response(html, { headers: CABECALHOS_DA_APRESENTACAO });
};

/** PUT /api/apresentacoes/:id: o diretor envia (ou troca) o HTML. Corpo: { arquivo, html }. */
export const onRequestPut: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const id = String(params.id);
  if (!ehIdGeral(id)) return erro("nao_encontrado", NAO_EXISTE);
  const validado = validarArquivoDaApresentacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    const geral = await salvarApresentacaoGeral(env, id, validado.dados, data.pessoa);
    return geral ? json(geral) : erro("nao_encontrado", NAO_EXISTE);
  } catch (e) {
    if (e instanceof Error && e.message === "conflito") return erro("conflito", "Outra apresentação foi enviada ao mesmo tempo. Recarregue a página e confira.");
    throw e;
  }
};

/** DELETE /api/apresentacoes/:id: a diagnóstica volta a não ter janela. */
export const onRequestDelete: PagesFunction<Env, "id", DadosApi> = async ({ env, data, params }) => {
  if (!podeCadastrarServicos(data.pessoa.cargo)) return erro("sem_permissao", SO_O_DIRETOR);
  const id = String(params.id);
  const geral = ehIdGeral(id) ? await removerApresentacaoGeral(env, id, data.pessoa) : null;
  return geral ? json(geral) : erro("nao_encontrado", NAO_EXISTE);
};
