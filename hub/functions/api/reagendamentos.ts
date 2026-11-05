import { podeMarcarDiagnostica } from "../../compartilhado/permissoes";
import { listarReagendamentos } from "../../servidor/reagendamento";
import { erro, json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** GET /api/reagendamentos: as diagnósticas em que o cliente não compareceu, para marcar de novo. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env, data }) => {
  if (!podeMarcarDiagnostica(data.pessoa.cargo)) return erro("sem_permissao", "Os reagendamentos são do comercial.");
  return json(await listarReagendamentos(env.DB, data.pessoa));
};
