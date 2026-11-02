import { json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

/** GET /api/eu: quem está usando o hub. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = ({ data }) => {
  const { id, nome, email, cargo } = data.pessoa;
  return json({ id, nome, email, cargo });
};
