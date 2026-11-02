import { erro } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** Qualquer /api/* sem rota própria: 404 em JSON, em vez da página do app. */
export const onRequest: PagesFunction<Env, string, DadosApi> = () => erro("nao_encontrado", "Esse endereço da API não existe.");
