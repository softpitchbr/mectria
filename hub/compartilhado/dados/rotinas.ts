import type { Cargo } from "../cargos";

/** Ligações por dia (Lucas, 02/11/2026): a rotina fica cumprida com o mínimo; o medidor vai até a meta. */
export const MINIMO_LIGACOES_DIA = 1;
export const META_LIGACOES_DIA = 2;

/** Itens fixos da rotina de cada cargo (spec, seção 5). Modelos iniciais, a validar com o Marcelo. */
export const ROTINA_FIXA: Record<Cargo, { chave: string; titulo: string }[]> = {
  hunter: [
    { chave: "ligacoes", titulo: "Fazer o bloco de ligações" },
    { chave: "whatsapp-tentativas", titulo: "Mandar WhatsApp nas tentativas sem resposta" },
    { chave: "registrar-diagnosticas", titulo: "Registrar as diagnósticas marcadas" },
  ],
  closer: [
    { chave: "confirmar-reunioes", titulo: "Confirmar as reuniões do dia" },
    { chave: "hipotese-de-dor", titulo: "Escrever a hipótese de dor das diagnósticas" },
    { chave: "briefings", titulo: "Mandar os briefings para Projetos no mesmo dia" },
    { chave: "resultado-reunioes", titulo: "Registrar o resultado de cada reunião" },
  ],
  diretor: [],
  projetos: [],
};
