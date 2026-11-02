import { diasDepois, hojeEmSaoPaulo } from "../../compartilhado/datas";
import { podeMarcarDiagnostica } from "../../compartilhado/permissoes";
import { listarReunioes } from "../../servidor/oportunidades";
import { erro, json } from "../../servidor/respostas";
import type { DadosApi, Env } from "../../servidor/tipos";

const DIA = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/reunioes?de=&ate=: hunter vê as das oportunidades dele; closer, as dele; diretor, todas. Padrão: os próximos 7 dias. */
export const onRequestGet: PagesFunction<Env, string, DadosApi> = async ({ request, env, data }) => {
  const eu = data.pessoa;
  if (!podeMarcarDiagnostica(eu.cargo)) return erro("sem_permissao", "Seu cargo não tem agenda de reuniões no hub.");
  const busca = new URL(request.url).searchParams;
  const hoje = hojeEmSaoPaulo();
  const de = DIA.test(busca.get("de") ?? "") ? busca.get("de")! : hoje;
  const ate = DIA.test(busca.get("ate") ?? "") ? busca.get("ate")! : diasDepois(hoje, 6);
  const filtro = eu.cargo === "hunter" ? { hunterId: eu.id } : eu.cargo === "closer" ? { closerId: eu.id } : {};
  return json(await listarReunioes(env.DB, de, ate, filtro));
};
