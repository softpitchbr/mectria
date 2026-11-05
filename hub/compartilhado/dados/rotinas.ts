import type { Cargo } from "../cargos";

/** Ligações por dia (Lucas, 02/11/2026): a rotina fica cumprida com o mínimo; o medidor vai até a meta. */
export const MINIMO_LIGACOES_DIA = 1;
export const META_LIGACOES_DIA = 2;

/** Meta dos hunters (Lucas, 04/11/2026): 8 conexões por semana, conversas com quem decide. */
export const META_CONEXOES_SEMANA = 8;

export type BlocoDaRotina = {
  id: string;
  titulo: string;
  orientacao: string | null;
  /** Tarefas fixas do bloco; "automaticoQuandoVazio" fica feita sozinha quando o bloco não tem nenhum lead. */
  fixos: { chave: string; titulo: string; automaticoQuandoVazio?: true }[];
};

/**
 * A rotina de cada cargo em blocos de prioridade (docs/17, seções 1 e 5; Lucas, 04/11/2026). Os itens gerados
 * (reagendar, confirmar, toques do dia, reativar) entram no bloco deles. Diretor e Projetos não têm rotina.
 */
export const BLOCOS_DA_ROTINA: Record<Cargo, BlocoDaRotina[]> = {
  hunter: [
    {
      id: "conversa",
      titulo: "Leads em conversa",
      orientacao: "Primeiro, os leads que já estão em conversa no CRM da MecTRIA.",
      fixos: [{ chave: "leads-em-conversa", titulo: "Abrir os leads em conversa no CRM (status Contato estabelecido e marcador Retornar)" }],
    },
    {
      id: "reagendamentos",
      titulo: "Reagendamentos",
      orientacao: "Depois, quem não compareceu à diagnóstica (no-show), para marcar de novo.",
      fixos: [],
    },
    {
      id: "cold-call",
      titulo: "Cold call",
      orientacao: "Só então as ligações novas. O que conta é a conexão: a ligação em que o hunter fala com quem decide. O foco da ligação é despertar a curiosidade para o lead aceitar a reunião, não explicar o serviço.",
      fixos: [{ chave: "cold-call", titulo: "Fazer o bloco de cold call" }],
    },
    {
      id: "confirmacoes",
      titulo: "Confirmações do dia",
      orientacao: "Três mensagens pelo WhatsApp, no dia da reunião. Só sai a seguinte se a anterior ficou sem resposta.",
      fixos: [],
    },
  ],
  closer: [
    {
      id: "fechamento",
      titulo: "Fechamento e negociação",
      orientacao: "Prioridade máxima, senso de urgência: qualquer contrato, ligação ou reunião que surgir vem primeiro. Uma oportunidade clara de fechamento, ou uma retomada quente, passa na frente da ordem do dia.",
      fixos: [{ chave: "fup-negociacao", titulo: "Abrir o Follow-up pela manhã e fazer o FUP de todos os leads em negociação", automaticoQuandoVazio: true }],
    },
    {
      id: "ap",
      titulo: "Apresentação de Proposta (AP)",
      orientacao: "Não deixar lead parado muito tempo nesta etapa. Quando estiver muito difícil marcar e a proposta estiver empacando, gravar um vídeo com a proposta personalizada e enviar.",
      fixos: [{ chave: "fup-ap", titulo: "Abrir todos os leads em Apresentação de Proposta e fazer o FUP para definir o próximo passo", automaticoQuandoVazio: true }],
    },
    {
      id: "construcao",
      titulo: "Construção de proposta",
      orientacao: "Mandar o briefing para Projetos no mesmo dia. Nenhum lead fica mais de 3 dias nesta etapa.",
      fixos: [{ chave: "construir-propostas", titulo: "Abrir todos os leads em construção de proposta e construir as propostas pendentes", automaticoQuandoVazio: true }],
    },
    {
      id: "reativacao",
      titulo: "Reativação",
      orientacao: "A reativação é simples e constante. Sem aderência, o closer encerra sem gastar energia.",
      fixos: [],
    },
  ],
  diretor: [],
  projetos: [],
};
