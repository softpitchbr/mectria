import { listarApresentacoesGerais } from "../../../servidor/apresentacoes";
import { json } from "../../../servidor/respostas";
import type { DadosApi, Env } from "../../../servidor/tipos";

/** GET /api/apresentacoes: as apresentações gerais (a da diagnóstica), com o arquivo enviado ou null. Qualquer cargo. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ env }) => json(await listarApresentacoesGerais(env.DB));
