import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { temRotina } from "../../../compartilhado/permissoes";
import { erro, json } from "../../../servidor/respostas";
import { historicoDeRotina } from "../../../servidor/rotina";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/rotina/historico: os últimos 14 dias úteis. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!temRotina(data.pessoa.cargo)) return erro("sem_permissao", "Seu cargo não tem rotina diária no hub.");
  return json(await historicoDeRotina(env.DB, data.pessoa.id, hojeEmSaoPaulo(), 14));
};
