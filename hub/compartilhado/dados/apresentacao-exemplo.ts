// Apresentação de proposta de exemplo (fase 4): a capa e os 12 passos do roteiro de proposta da 0.2.
// O conteúdo de verdade, por serviço, é o subprojeto das apresentações (spec, seção 12).
// {chave} é preenchida com as variáveis do cliente; [rótulo] é o que a MecTRIA ainda precisa mandar.

export interface SlideExemplo {
  id: string;
  /** Passo do PLAYBOOK_PROPOSTA (fala, dica, tempo e pacto); a capa não tem. */
  passo: string | null;
  rotulo: string;
  titulo: string;
  linhas: string[];
}

export const APRESENTACAO_EXEMPLO: SlideExemplo[] = [
  {
    id: "capa",
    passo: null,
    rotulo: "Proposta para {empresa}",
    titulo: "{servico}",
    linhas: ["{data}", "MecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM"],
  },
  {
    id: "abertura",
    passo: "abertura",
    rotulo: "Hoje",
    titulo: "O projeto que desenhamos para vocês",
    linhas: ["No fim, você diz com sinceridade se faz sentido."],
  },
  {
    id: "proposito",
    passo: "proposito",
    rotulo: "Quem vai fazer o seu projeto",
    titulo: "Engenharia de verdade, feita por estudantes, com propósito",
    linhas: [
      "Empresa júnior sem fins lucrativos, vinculada à UFTM",
      "Projetos reais, com orientação de professores",
      "O que o projeto paga volta para a formação de engenheiros",
    ],
  },
  {
    id: "numeros",
    passo: "numeros",
    rotulo: "Histórico",
    titulo: "Nossa história em números",
    linhas: ["{anos} anos de MecTRIA", "[nº de projetos] projetos entregues", "[nº de clientes] clientes atendidos", "[nº] clientes que voltaram"],
  },
  {
    id: "time",
    passo: "time",
    rotulo: "Quem cuida do seu projeto",
    titulo: "O time",
    linhas: ["{equipe}", "Orientação de professores da UFTM nas decisões técnicas"],
  },
  {
    id: "ceu-inferno",
    passo: "ceu-inferno",
    rotulo: "O cenário de vocês",
    titulo: "Onde vocês estão e aonde querem chegar",
    linhas: ["Hoje: {dor}", "Se ficar como está: {impacto}", "Com o projeto: {objetivo}"],
  },
  {
    id: "metodo",
    passo: "metodo",
    rotulo: "Projeto e método",
    titulo: "O caminho do projeto",
    linhas: ["Entregamos: {entregamos}", "Fica com vocês: {fica}", "Prazo: {prazoProjeto}"],
  },
  {
    id: "pacto-duvida",
    passo: "pacto-duvida",
    rotulo: "Antes de seguir",
    titulo: "Ficou alguma dúvida sobre o projeto?",
    linhas: [],
  },
  {
    id: "pacto-cliente",
    passo: "pacto-cliente",
    rotulo: "Uma pergunta sincera",
    titulo: "Tirando o preço da mesa, vocês seriam nossos clientes?",
    linhas: [],
  },
  {
    id: "valor-preco",
    passo: "valor-preco",
    rotulo: "Valor × preço",
    titulo: "Quanto vale e quanto custa",
    linhas: ["Feito por {ancora}: [valor de mercado]", "Na MecTRIA: {fraseValor}"],
  },
  {
    id: "provas",
    passo: "provas",
    rotulo: "Quem já confiou",
    titulo: "Clientes que voltam",
    linhas: ["[Caso do mesmo serviço, com autorização do cliente]", "[Depoimento]"],
  },
  {
    id: "investimento",
    passo: "investimento",
    rotulo: "Investimento",
    titulo: "{valor}",
    linhas: ["Em até {parcelas}x sem juros", "À vista com {descontoAVista}% de desconto"],
  },
  {
    id: "fechamento",
    passo: "fechamento",
    rotulo: "Próximos passos",
    titulo: "Como a gente começa",
    linhas: ["Aceite da proposta", "Contrato e ART quando o projeto exige", "Kick-off com visita técnica"],
  },
];
