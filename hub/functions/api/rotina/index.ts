import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { temRotina } from "../../../compartilhado/permissoes";
import { erro, json } from "../../../servidor/respostas";
import { rotinaDoDia } from "../../../servidor/rotina";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/rotina: o checklist de hoje. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!temRotina(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não tem rotina diária no hub.");
  return json(await rotinaDoDia(env.DB, data.pessoa, hojeEmSaoPaulo()));
};
