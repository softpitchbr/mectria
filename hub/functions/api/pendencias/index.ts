import { hojeEmSaoPaulo } from "../../../compartilhado/datas";
import { podeResponderPendencia } from "../../../compartilhado/permissoes";
import { listarPendencias } from "../../../servidor/pendencias";
import { erro, json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/pendencias: as pendências técnicas abertas (atrasadas primeiro) e as respondidas que faltam fechar. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeResponderPendencia(data.pessoa.cargo)) return erro("sem_permissao", "As pendências técnicas são de Projetos.");
  return json(await listarPendencias(env.DB, hojeEmSaoPaulo()));
};
