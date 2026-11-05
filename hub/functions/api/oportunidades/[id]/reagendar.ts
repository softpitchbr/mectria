import { hojeEmSaoPaulo } from "../../../../compartilhado/datas";
import { buscarOportunidade } from "../../../../servidor/oportunidades";
import { reagendarDiagnostica } from "../../../../servidor/reagendamento";
import { atualizarRotinaDe } from "../../../../servidor/rotina";
import { erro, json } from "../../../../servidor/respostas";
import type { DadosApi, Env } from "../../../../servidor/tipos";
import { lerCorpo, validarReuniaoDeReativacao } from "../../../../servidor/validacao";

/** POST /api/oportunidades/:id/reagendar { dataHora, formato }: marca de novo a diagnóstica em que o cliente não compareceu. */
export const onRequestPost: PagesFunction<Env, "id", DadosApi> = async ({ request, env, data, params }) => {
  const validado = validarReuniaoDeReativacao(await lerCorpo(request));
  if (!validado.ok) return erro("invalido", validado.mensagem);
  try {
    const reuniao = await reagendarDiagnostica(env.DB, Number(params.id), validado.dados, data.pessoa);
    const o = await buscarOportunidade(env.DB, reuniao.oportunidadeId);
    // O reagendamento marca sozinho o item "Reagendar" da rotina do hunter que marcou.
    await atualizarRotinaDe(env.DB, o?.hunterId ?? null, hojeEmSaoPaulo());
    return json(reuniao, 201);
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "";
    if (motivo === "nao_encontrado") return erro("nao_encontrado", "Oportunidade não encontrada.");
    if (motivo === "sem_permissao") return erro("sem_permissao", "Essa oportunidade é de outro hunter.");
    if (motivo === "ja_passou") return erro("conflito", "Essa oportunidade já passou da diagnóstica.");
    if (motivo === "ja_reagendada") return erro("conflito", "Essa oportunidade já tem uma diagnóstica marcada.");
    throw e;
  }
};
