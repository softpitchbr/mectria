import type { Reuniao } from "../compartilhado/oportunidade";
import { erro } from "./respostas";

const ETAPA = { diagnostica: "da diagnóstica", proposta: "da proposta" };

/** Traduz os erros das gravações da reunião em respostas (409/400); o que não é conhecido continua sendo erro. */
export function erroDaReuniao(e: unknown, tipo: Reuniao["tipo"]): Response {
  const motivo = e instanceof Error ? e.message : "";
  if (motivo === "ja_encerrada") return erro("conflito", "Essa reunião já foi encerrada.");
  if (motivo === "ja_passou") return erro("conflito", `Essa oportunidade já passou ${ETAPA[tipo]}.`);
  if (motivo === "nao_e_diagnostica") return erro("invalido", "Essa reunião não é uma diagnóstica.");
  if (motivo === "nao_e_proposta") return erro("invalido", "Essa reunião não é uma proposta.");
  throw e;
}
