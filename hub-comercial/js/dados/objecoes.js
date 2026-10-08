/* Guia rápido de objeções. Cada objeção tem a etapa em que aparece, o que costuma estar por
   trás, o contorno (a fala) e a prova. Tudo é hipótese até a conversa com os closers
   sobre as objeções reais e os motivos de perda [item 24].
   "validar" indica uma resposta que depende de política da MecTRIA. */
window.HUB = window.HUB || {};

HUB.ETAPAS = {
  "cold-call": "Cold call",
  diagnostica: "Diagnóstica",
  proposta: "Proposta",
  fup: "Follow-up",
};

HUB.OBJECOES = [
  {
    id: "sem-tempo",
    etapas: ["cold-call"],
    objecao: "Agora não posso, estou ocupado.",
    porTras: "Não sabe quem você é nem por que ligou.",
    contorno: "Sem problema, prefiro te ligar num horário bom. Hoje à tarde ou amanhã cedo?",
  },
  {
    id: "manda-email",
    etapas: ["cold-call"],
    objecao: "Manda por e-mail (ou pelo WhatsApp).",
    porTras: "Jeito educado de encerrar a ligação.",
    contorno:
      "Mando sim. Para não te mandar um catálogo genérico, me diz só uma coisa: {gancho} ... " +
      "Pelo que você falou, 30 minutos de conversa valem mais que um PDF. Pode ser quinta às 10h ou sexta às 14h?",
  },
  {
    id: "sem-interesse",
    etapas: ["cold-call"],
    objecao: "Não tenho interesse. Não preciso.",
    porTras: "Ainda não enxergou a dor, ou ela não é prioridade agora.",
    contorno:
      "Tranquilo. Só para eu não te ligar de novo à toa: hoje vocês não têm esse problema, ou têm, mas não é " +
      "prioridade agora? ... Quando seria um bom momento para eu voltar a falar com você?",
  },
  {
    id: "contato",
    etapas: ["cold-call"],
    objecao: "Onde você conseguiu meu número?",
    porTras: "Desconfiança. Responda com transparência.",
    contorno:
      "Dos dados públicos de cadastro da empresa. Se preferir que eu não ligue mais, eu tiro seu contato da lista agora.",
    prova: "Confirmar com a Casa de Dados a origem exata dos telefones.",
    validar: true,
  },
  {
    id: "ja-temos-engenheiro",
    etapas: ["cold-call", "diagnostica"],
    objecao: "Já temos engenheiro (ou fornecedor).",
    porTras: "Acha que a MecTRIA vai competir com quem já está lá.",
    contorno:
      "Ótimo, então vocês sabem o valor de um projeto bem feito. A gente costuma entrar quando a equipe está cheia " +
      "ou num projeto específico. Tem alguma coisa parada na fila hoje?",
  },
  {
    id: "quanto-custa",
    etapas: ["cold-call", "diagnostica"],
    objecao: "Quanto custa?",
    porTras: "Quer saber se vale gastar tempo com a conversa.",
    contorno:
      "Depende muito do tamanho: um desenho técnico é bem diferente de uma máquina nova. Por isso a gente conversa " +
      "30 minutos antes. Em até 3 dias úteis você recebe um número de verdade, com o escopo explicado.",
    prova: "Os 3 dias úteis dependem do fluxo da v4 estar em uso.",
    validar: true,
  },
  {
    id: "so-orcamento",
    etapas: ["diagnostica"],
    objecao: "Só quero um orçamento para comparar.",
    porTras: "Vai decidir por preço se não enxergar diferença.",
    contorno:
      "Faz todo sentido comparar. Para você comparar a mesma coisa, preciso entender o escopo direitinho: o que " +
      "entra, que norma precisa atender, se precisa de ART. Me dá 20 minutos de perguntas?",
  },
  {
    id: "manda-proposta",
    etapas: ["diagnostica", "proposta"],
    objecao: "Me manda a proposta por e-mail que eu vejo.",
    porTras: "Quer evitar a conversa sobre preço.",
    contorno:
      "Mando sim, depois de te apresentar. A proposta tem escolhas técnicas que mudam o preço, e em 30 minutos você " +
      "entende cada uma e decide com tudo claro. Quinta às 10h ou sexta às 14h? Vale chamar {decisores}.",
  },
  {
    id: "estudantes",
    etapas: ["cold-call", "diagnostica", "proposta"],
    objecao: "Vocês são estudantes? Dá para confiar?",
    porTras: "Medo de qualidade e de responsabilidade técnica.",
    contorno:
      "Somos estudantes de engenharia mecânica da UFTM, e todo projeto tem orientação de professores da " +
      "universidade. Desde 2013 a gente entrega projetos para empresas da região, e muitos clientes voltam para um " +
      "novo projeto. Quando o projeto exige, sai com ART.",
    prova: "Professores orientadores [item 18], números desde 2013 [item 17], casos [item 15]. Confirmar quem assina a ART.",
    validar: true,
  },
  {
    id: "fabricam",
    etapas: ["diagnostica", "proposta"],
    objecao: "Vocês fabricam? E a montagem?",
    porTras: "Quer resolver tudo com um fornecedor só.",
    contorno:
      "A gente projeta e documenta tudo para fabricar: modelo 3D, desenhos 2D com tolerâncias e memória de cálculo. " +
      "A fabricação fica com vocês ou com um parceiro. A vantagem é que, com o projeto na mão, vocês cotam a " +
      "fabricação com quem quiserem e comparam a mesma coisa.",
    prova: "O \"Nosso foco\" da Carta de Serviços. Confirmar se a MecTRIA indica parceiros de fabricação.",
    validar: true,
  },
  {
    id: "instalam",
    etapas: ["diagnostica", "proposta"],
    objecao: "Vocês instalam? (ar-condicionado, proteções, materiais)",
    porTras: "Quer resolver tudo com um fornecedor só.",
    contorno:
      "A instalação fica com vocês ou com o instalador de confiança. A gente entrega o projeto com a especificação " +
      "e a localização de cada item, para o instalador não improvisar e vocês não comprarem equipamento a mais.",
    prova: "O \"Nosso foco\" da Carta de Serviços.",
  },
  {
    id: "eletrica",
    etapas: ["diagnostica", "proposta"],
    objecao: "E a parte elétrica, o painel e a programação?",
    porTras: "Não sabe onde termina o escopo mecânico.",
    contorno:
      "Nosso foco é a parte mecânica e fluídica: a lógica de acionamento, os diagramas de comando e a lista de " +
      "sensores. O elétrico avançado, o painel e a programação ficam com um integrador, e o nosso projeto já vai " +
      "pronto para ele.",
    prova: "Carta de Serviços, Automação e Controle.",
  },
  {
    id: "art",
    etapas: ["proposta"],
    objecao: "Vocês emitem ART?",
    porTras: "Precisa de responsável técnico para fiscalização ou seguro.",
    contorno: "Sim, quando o projeto exige. O custo da ART é o repasse da taxa do CREA e já está na proposta.",
    prova: "Planilha v4 (ART como repasse). Confirmar quem assina a ART.",
    validar: true,
  },
  {
    id: "caro",
    etapas: ["proposta", "fup"],
    objecao: "Está caro.",
    porTras: "Ainda não enxergou o valor, ou está comparando com algo diferente.",
    contorno:
      "Entendo. Caro comparado com o quê? ... [ouça] Esse projeto, com {ancora}, fica em [valor de mercado]. A gente " +
      "cobra o valor de uma empresa júnior, mas a entrega é a mesma: projeto pronto para fabricar, com orientação de " +
      "professor. Se o investimento pesar, dá para começar por uma fase.",
    prova: "Valor × preço [item 28] e a calculadora com os números do cliente. Reduza o escopo antes de dar desconto.",
  },
  {
    id: "desconto",
    etapas: ["proposta", "fup"],
    objecao: "Consegue um desconto?",
    porTras: "Teste de negociação. Nem sempre é falta de dinheiro.",
    contorno:
      "Consigo melhorar a condição se for à vista: {descontoAVista}% de desconto. Fora isso, o que dá para fazer é " +
      "ajustar o escopo, sem mexer na qualidade.",
    prova: "Regra interna: desconto máximo de ~13%. Além disso, só com a Diretoria.",
  },
  {
    id: "vou-pensar",
    etapas: ["proposta", "fup"],
    objecao: "Vou pensar.",
    porTras: "Ficou uma dúvida ou uma objeção que não foi dita.",
    contorno:
      "Claro, é uma decisão importante. Para te ajudar a pensar: o que pesa mais, o projeto, o investimento ou o " +
      "momento? ... Combinado. Quando a gente se fala de novo? Pode ser [dia] às [hora]?",
  },
  {
    id: "falar-socio",
    etapas: ["proposta", "fup"],
    objecao: "Preciso falar com meu sócio (ou diretor).",
    porTras: "Quem decide não estava na reunião.",
    contorno:
      "Faz sentido. Ele vai ter dúvidas que eu consigo responder melhor ao vivo. Vamos marcar 20 minutos com ele " +
      "ainda esta semana? Posso te mandar um resumo de uma página para adiantar.",
  },
  {
    id: "concorrente-barato",
    etapas: ["proposta", "fup"],
    objecao: "Tenho um orçamento mais barato.",
    porTras: "Está comparando escopos diferentes, ou só o número final.",
    contorno:
      "Que bom que você está comparando. Posso ver o que está incluído nele? Muitas vezes a diferença está no " +
      "escopo: desenho 2D para fabricar, memória de cálculo, ART, revisões. Se for a mesma entrega, me fala que eu " +
      "vejo o que dá para fazer.",
    prova: "Nunca fale mal do concorrente.",
  },
  {
    id: "prazo-longo",
    etapas: ["proposta"],
    objecao: "O prazo está longo.",
    porTras: "Tem uma data real por trás, ou está comparando com quem promete menos.",
    contorno:
      "Esse prazo é para fazer cada etapa com a revisão do professor. Se tiver uma data que não pode passar, a gente " +
      "consegue acelerar com mais gente no projeto, e isso entra como urgência no preço. Qual é a data que não pode passar?",
    prova: "Urgência na v4: +15%, +30% ou +60%.",
  },
  {
    id: "ferias",
    etapas: ["proposta"],
    objecao: "E nas férias? E se o aluno que cuida do meu projeto sair?",
    porTras: "Medo de o projeto parar no meio.",
    contorno:
      "O projeto é documentado etapa por etapa e acompanhado pelo professor orientador, então ninguém leva o projeto " +
      "embora. [Completar com a regra da MecTRIA para férias e troca de gestão.]",
    validar: true,
  },
  {
    id: "sigilo",
    etapas: ["diagnostica", "proposta"],
    objecao: "Meu projeto fica em sigilo?",
    porTras: "Projeto de engenharia costuma ter informação estratégica.",
    contorno: "Fica. A gente não mostra projeto, peça ou instalação de cliente sem autorização.",
    prova: "Regra do manual de identidade. Confirmar se existe termo de confidencialidade padrão.",
    validar: true,
  },
  {
    id: "revisoes",
    etapas: ["proposta"],
    objecao: "E se precisar ajustar depois da entrega?",
    porTras: "Medo de ficar sem suporte.",
    contorno: "[Completar com a regra da MecTRIA: quantas revisões estão incluídas e como é o suporte depois da entrega.]",
    validar: true,
  },
  {
    id: "nao-prioridade",
    etapas: ["proposta", "fup"],
    objecao: "Agora não é prioridade.",
    porTras: "O custo de esperar não ficou claro.",
    contorno:
      "Entendo. O que muda até lá? Na nossa conversa você me disse que, se ficar como está, o risco é {impacto}. Quanto custa " +
      "esperar mais seis meses? Se for mesmo para depois, me diz um mês para eu te procurar.",
  },
  {
    id: "em-aprovacao",
    etapas: ["fup"],
    objecao: "Está em aprovação.",
    porTras: "A decisão saiu da mão de quem participou da reunião.",
    contorno:
      "Ótimo. Quem está aprovando e o que essa pessoa vai olhar primeiro? Posso apresentar para ela em 15 minutos, " +
      "ou mandar um resumo com os pontos principais. Quando sai a decisão?",
  },
];
