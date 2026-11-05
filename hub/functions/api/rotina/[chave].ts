import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { temRotina } from "../../../compartilhado/permissoes";
import { erro, json } from "../../../servidor/respostas";
import { marcarItem } from "../../../servidor/rotina";
import type { DadosApi, Env } from "../../../servidor/tipos";
import { lerCorpo, validarFeito } from "../../../servidor/validacao";

/** PUT /api/rotina/:chave com { feito }: marca ou desmarca um item manual de hoje. */
export const onRequestPut: PagesFunction<Env, "chave", DadosApi> = async ({ request, env, data, params }) => {
  if (!temRotina(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não tem rotina diária no hub.");
  const validado = validarFeito(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    return json(await marcarItem(env.DB, data.pessoa, hojeEmSaoPaulo(), decodeURIComponent(String(params.chave)), validado.dados));
  } catch (e) {
    if (e instanceof Error && e.message === "item_automatico") return erro("conflito", "Esse item se marca sozinho.");
    if (e instanceof Error && e.message === "item_inexistente") return erro("nao_encontrado", "Esse item não está na rotina de hoje.");
    throw e;
  }
};
