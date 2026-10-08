/* Playbook da reunião diagnóstica.
   Perguntas comerciais no modelo GPCTBA + C&I (Goals, Plans, Challenges, Timeline, Budget,
   Authority, Consequências negativas e Implicações positivas), ligadas aos 6 blocos do
   Briefing da planilha v4 (docs/12). As perguntas técnicas de cada serviço estão em servicos.js.
   O campo "chave" liga a resposta ao resumo, ao playbook de proposta e ao follow-up. */
window.HUB = window.HUB || {};

HUB.DIAGNOSTICA = {
  duracao: "30 a 45 min",

  origens: [
    "Site / formulário",
    "Google (Ad Grants)",
    "Instagram",
    "Indicação",
    "Cliente que voltou",
    "Cold call (Casa de Dados)",
    "Evento",
    "Outro",
  ],
  formatos: ["Online", "Presencial", "Visita técnica"],

  preparacao: [
    "Pesquisar a empresa: site, Instagram e CNPJ (porte e CNAE)",
    "Escrever a hipótese de dor (da Casa de Dados ou do formulário)",
    "Separar um case parecido que pode ser citado",
    "Confirmar a reunião 24 h antes pelo WhatsApp",
    "Combinar quem vai junto: hunter ou alguém de Projetos",
  ],

  abertura: [
    {
      titulo: "Acordo de agenda",
      fala:
        "{contato}, combinamos uns 40 minutos, ainda está bom para você? A ideia hoje é entender o cenário de vocês: " +
        "eu faço algumas perguntas, depois mostro rapidinho como a gente trabalha e, no final, decidimos juntos se faz " +
        "sentido eu voltar com uma proposta. Se não fizer sentido, você me fala sem problema. Pode ser assim?",
      pacto: "Acordo de agenda feito",
      dica: "É o primeiro micro pacto. O cliente aceita que no fim vai dizer se faz sentido.",
    },
    {
      titulo: "Quem somos, em 1 minuto",
      fala:
        "Só para você saber com quem está falando: a MecTRIA é a Empresa Júnior de Engenharia Mecânica da UFTM. " +
        "Desde 2013, estudantes de engenharia desenvolvem projetos para empresas da região, sempre com orientação de " +
        "professores da universidade. A gente projeta e documenta; a fabricação e a instalação ficam com vocês ou com " +
        "um parceiro. Agora me conta um pouco da empresa e de onde esse assunto entra na operação de vocês.",
      dica: "Curto. A diagnóstica é sobre o cliente, não sobre a MecTRIA.",
    },
  ],

  blocos: [
    {
      id: "objetivos",
      letra: "G",
      titulo: "Objetivos",
      briefing: "contexto",
      intro: "Onde o cliente quer chegar. É o \"céu\" da apresentação.",
      perguntas: [
        { id: "g-resultado", chave: "objetivo", tipo: "texto", texto: "O que vocês querem que esteja diferente depois desse projeto?", dica: "Resultado esperado do briefing. Deixe o cliente falar e não sugira a resposta." },
        { id: "g-medida", tipo: "curto", texto: "Como vocês vão saber que deu certo? Tem um número? (produção, custo, prazo, conformidade)", dica: "Um número aqui vira argumento na calculadora." },
        { id: "g-maior", tipo: "curto", texto: "Esse projeto faz parte de um objetivo maior da empresa este ano?", dica: "Ex.: ampliar, passar numa auditoria, lançar um produto." },
      ],
    },
    {
      id: "planos",
      letra: "P",
      titulo: "Planos",
      briefing: "contexto",
      intro: "O que já foi tentado e qual é a alternativa real à MecTRIA.",
      perguntas: [
        { id: "p-tentativas", chave: "tentativas", tipo: "texto", texto: "O que vocês já tentaram para resolver isso? Por que não resolveu?" },
        { id: "p-alternativa", tipo: "curto", texto: "Se a gente não tivesse conversado hoje, qual era o plano?", dica: "Mostra a concorrência real: fazer internamente, outro fornecedor ou deixar como está." },
        { id: "p-interno", tipo: "curto", texto: "Vocês têm engenheiro ou projetista na equipe? Por que não fazer internamente?" },
      ],
    },
    {
      id: "desafios",
      letra: "C",
      titulo: "Desafios",
      briefing: "contexto",
      intro: "A dor principal, nas palavras do cliente.",
      perguntas: [
        { id: "c-dor", chave: "dor", tipo: "texto", texto: "Qual é o principal problema hoje?", dica: "Anote com as palavras do cliente. Essa frase vai para o slide de dores da proposta." },
        { id: "c-exemplo", tipo: "texto", texto: "Pode me dar um exemplo recente de quando isso aconteceu?" },
        { id: "c-impedimento", tipo: "curto", texto: "O que mais atrapalha resolver isso?" },
      ],
    },
    {
      id: "prazo",
      letra: "T",
      titulo: "Prazo",
      briefing: "contexto",
      intro: "Por que agora e para quando. Define urgência e prioridade.",
      perguntas: [
        { id: "t-porque-agora", chave: "porqueAgora", tipo: "curto", texto: "Por que resolver isso agora, e não daqui a seis meses?" },
        { id: "t-prazo", chave: "prazo", tipo: "curto", texto: "Para quando vocês precisam disso pronto? O que acontece nessa data?", dica: "Prazo apertado entra como urgência na v4 (+15% a +60%). Pergunte se a data é real." },
      ],
    },
    {
      id: "orcamento",
      letra: "B",
      titulo: "Orçamento",
      briefing: "comercial",
      intro: "Faixa de investimento, forma de pagamento e concorrência.",
      perguntas: [
        { id: "b-faixa", chave: "orcamento", tipo: "curto", texto: "Vocês já separaram uma faixa de investimento para isso?", dica: "Se travar: \"Projetos assim variam bastante. Vocês pensaram em algo até quanto?\"" },
        { id: "b-pagamento", chave: "pagamento", tipo: "opcoes", opcoes: ["À vista", "Parcelado", "Ainda não sabe"], texto: "Como costumam pagar esse tipo de projeto?" },
        { id: "b-concorrencia", chave: "concorrencia", tipo: "curto", texto: "Estão conversando com outras empresas? Quais?" },
        { id: "b-sensibilidade", tipo: "opcoes", opcoes: ["Baixa", "Média", "Alta"], texto: "Sensibilidade a preço (sua leitura; não pergunte ao cliente)" },
      ],
    },
    {
      id: "autoridade",
      letra: "A",
      titulo: "Autoridade",
      briefing: "decisao",
      intro: "Quem decide, como decide e até quando.",
      perguntas: [
        { id: "a-decisores", chave: "decisores", tipo: "curto", texto: "Além de você, quem participa da decisão?" },
        { id: "a-processo", tipo: "curto", texto: "Como funciona a aprovação aí? Quem assina?" },
        { id: "a-criterio", chave: "criterio", tipo: "curto", texto: "O que vai pesar mais na escolha: prazo, preço, confiança técnica ou outra coisa?" },
        { id: "a-prazo-decisao", chave: "prazoDecisao", tipo: "curto", texto: "Até quando vocês querem decidir?" },
        { id: "a-presenca", tipo: "opcoes", opcoes: ["Sim", "Não", "A confirmar"], texto: "Quem decide pode estar na apresentação da proposta?", dica: "Proposta sem quem decide vira \"vou repassar\". Insista com educação." },
      ],
    },
    {
      id: "consequencias",
      letra: "C&I",
      titulo: "Consequências e implicações",
      briefing: "contexto",
      intro: "O custo de não resolver e o ganho de resolver. Vira o céu e inferno e a calculadora.",
      perguntas: [
        { id: "ci-negativa", chave: "impacto", tipo: "texto", texto: "Se ficar como está por mais seis meses, o que acontece? Quanto isso custa?", dica: "É o \"inferno\". Busque número: horas de mão de obra, paradas, multa, retrabalho." },
        { id: "ci-numeros", chave: "numeros", tipo: "texto", texto: "Números para a calculadora (horas, custo por hora, paradas por mês, multa, perdas)" },
        { id: "ci-positiva", chave: "ganho", tipo: "texto", texto: "E se resolver, o que muda? Quanto vale isso para vocês?", dica: "É o \"céu\". Deixe o cliente descrever o depois." },
      ],
    },
  ],

  // perguntas do bloco "Escopo técnico" que valem para qualquer serviço
  escopoGeral: [
    { id: "e-incluido", tipo: "texto", texto: "O que precisa estar incluído no projeto? E o que não precisa?" },
    { id: "e-normas", tipo: "curto", texto: "Que normas o projeto precisa atender?" },
    { id: "e-art", tipo: "opcoes", opcoes: ["Sim", "Não", "Não sabe"], texto: "Precisa de ART?" },
    { id: "e-custos", tipo: "curto", texto: "Custos diretos previstos (viagens, materiais, ensaios)" },
  ],

  fechamento: {
    resumo:
      "Deixa eu ver se entendi: hoje {dor}. Se ficar assim, o risco é {impacto}. Vocês querem {objetivo}, " +
      "e o prazo é {prazo}. Acertei? Faltou alguma coisa?",
    pacto:
      "Se a proposta resolver isso dentro do prazo e do que vocês imaginam investir, faz sentido a gente começar?",
    pactoDica: "Se a resposta for \"depende\", pergunte de quê. É a objeção aparecendo cedo, quando ainda dá para tratar.",
    agendamento:
      "Para montar a proposta, o nosso time de projetos precisa de {dias} dias úteis. Vamos deixar marcada a " +
      "apresentação para {data_proposta}? São uns 40 minutos, e é importante {decisores} estar junto.",
    agendamentoDica: "Nunca saia da diagnóstica sem a apresentação marcada. Não mande proposta só por e-mail.",
  },

  depois: [
    "Mandar o resumo para o cliente no mesmo dia (botão abaixo)",
    "Gerar o PDF e mandar para Projetos (estimativa técnica no Dia 1, à tarde)",
    "Mandar o convite da apresentação, com quem decide",
    "Pedir fotos, desenhos ou plantas pelo WhatsApp",
  ],

  resumoCliente:
    "Oi, {contato}! Obrigado pela conversa de hoje. Pelo que entendi:\n\n" +
    "• Hoje: {dor}\n• Objetivo: {objetivo}\n• Prazo: {prazo}\n\n" +
    "Se faltou alguma coisa, me corrige por aqui. Nosso time de projetos já vai estudar o caso e a gente " +
    "apresenta a proposta em {data_proposta}. Se puder, me manda fotos, desenhos ou plantas que ajudem.\n\n" +
    "{vendedor} · MecTRIA",
};
