/* Playbook da apresentação de proposta: a sequência fixa do Método TRIA (docs/06), com os
   micro pactos em pontos fixos. Na apresentação só muda o mínimo: logo do cliente, dores,
   escopo, preço, prazo e time. As falas usam variáveis {chave} preenchidas com a diagnóstica.
   Este é o roteiro inicial. O roteiro slide a slide definitivo é a tarefa 28 (I · S6–S7). */
window.HUB = window.HUB || {};

HUB.PROPOSTA = {
  duracao: "40 a 50 min",

  antes: [
    "Briefing completo e preço validado pela Diretoria (fluxo de 3 dias)",
    "Apresentação com o logo, as dores e o escopo do cliente",
    "Quem decide confirmado na reunião",
    "Câmera ligada e apresentação testada (web ou PDF)",
    "Um ou dois casos do mesmo serviço separados",
  ],

  pactos: [
    { id: "agenda", texto: "Acordo de agenda: no fim, o cliente diz se faz sentido" },
    { id: "dor", texto: "Confirmou que esse é o cenário dele" },
    { id: "duvida", texto: "Sem dúvidas sobre o projeto" },
    { id: "cliente", texto: "Tirando o preço, seria cliente (e disse por quê)" },
    { id: "valor", texto: "Entendeu a diferença entre valor e preço" },
    { id: "fechamento", texto: "Decidiu, ou marcou data para decidir" },
  ],

  passos: [
    {
      id: "abertura",
      titulo: "Abertura e acordo",
      tempo: "2 min",
      objetivo: "Combinar que, no fim, o cliente vai dizer se faz sentido.",
      fala:
        "{contato}, obrigado pelo tempo. Hoje eu vou te mostrar o projeto que o nosso time desenhou a partir do que " +
        "você me contou. A ideia é que, no final, você me diga com sinceridade se faz sentido para vocês. Pode ser?",
      pacto: "agenda",
    },
    {
      id: "proposito",
      titulo: "Propósito",
      tempo: "2 min",
      objetivo: "Diferenciar a MecTRIA de uma consultoria comum.",
      fala:
        "Antes do projeto, quero que você saiba quem vai fazer. A MecTRIA é a Empresa Júnior de Engenharia Mecânica " +
        "da UFTM. Somos sem fins lucrativos: estudantes de engenharia desenvolvem projetos reais, com orientação de " +
        "professores, e tudo o que o projeto paga volta para a formação de engenheiros aqui da região.",
      dica: "Fale com orgulho. Ser empresa júnior é diferencial, não desculpa.",
    },
    {
      id: "numeros",
      titulo: "Histórico em números",
      tempo: "1 min",
      objetivo: "Mostrar números reais e verificáveis.",
      fala: "São {anos} anos de MecTRIA, [nº de projetos] projetos entregues e [nº de clientes] clientes que voltaram para um novo projeto.",
      dica: "Só números que a MecTRIA consegue provar.",
      validar: "item 17",
    },
    {
      id: "time",
      titulo: "Time",
      tempo: "2 min",
      objetivo: "Humanizar e mostrar quem faz o projeto, com o professor orientador logo no começo.",
      fala: "Quem vai cuidar do projeto de vocês: [nomes e papéis], com a orientação do professor [nome], que acompanha as decisões técnicas.",
      dica: "Hoje o professor só aparece no fim da apresentação. Ele é o maior diferencial: traga para cá.",
      validar: "item 18",
    },
    {
      id: "ceu-inferno",
      titulo: "Céu e inferno",
      tempo: "5 min",
      objetivo: "Mostrar a dor nas palavras do cliente e o custo de não resolver.",
      fala:
        "Na nossa conversa, você me contou que {dor}. Se ficar como está, o risco é {impacto}. Com o projeto, " +
        "o objetivo é {objetivo}. Esse é o cenário de vocês hoje? Faltou alguma coisa?",
      pacto: "dor",
      dica: "Use as frases que o cliente disse na diagnóstica. Não troque por termo técnico.",
    },
    {
      id: "metodo",
      titulo: "Projeto e método",
      tempo: "8 min",
      objetivo: "Mostrar escopo, etapas, prazo e o que fica com o cliente.",
      fala:
        "Esse é o caminho do projeto, etapa por etapa. No final vocês recebem: {entregamos}. O que fica com vocês: {fica}.",
      dica: "Mostrar o que não está incluído evita a objeção depois do preço.",
    },
    {
      id: "pacto-duvida",
      titulo: "Micro pacto: dúvidas",
      tempo: "1 min",
      objetivo: "Isolar as dúvidas sobre o projeto antes do preço.",
      fala: "Ficou alguma dúvida sobre o projeto?",
      pacto: "duvida",
      dica: "Se tiver dúvida, volte ao método e responda. Só siga quando estiver tudo claro.",
    },
    {
      id: "pacto-cliente",
      titulo: "Micro pacto: tirando o preço da mesa",
      tempo: "1 min",
      objetivo: "Confirmar que o projeto está aceito e que só falta acertar o preço.",
      fala: "Tirando o preço da mesa, vocês seriam nossos clientes? ... Por quê?",
      pacto: "cliente",
      dica:
        "Se for \"sim\", pergunte por quê: o cliente mesmo diz os motivos. Se for \"não\", pergunte o que faltaria. " +
        "É a objeção real aparecendo antes do preço.",
    },
    {
      id: "valor-preco",
      titulo: "Valor × preço",
      tempo: "3 min",
      objetivo: "Separar quanto o projeto vale de quanto custa na MecTRIA.",
      fala:
        "Um projeto como esse, feito por {ancora}, fica em torno de [valor de mercado]. Na MecTRIA são {fraseValor}. " +
        "Dá para ver por que esse projeto vale isso?",
      pacto: "valor",
      dica: "Nunca diga \"menor preço\". A âncora de mercado por serviço ainda precisa de pesquisa.",
      validar: "item 28",
    },
    {
      id: "provas",
      titulo: "Provas sociais",
      tempo: "3 min",
      objetivo: "Mostrar quem já confiou e voltou.",
      fala: "[Caso do mesmo serviço, com autorização do cliente] e [depoimento].",
      validar: "itens 15 e 16",
    },
    {
      id: "investimento",
      titulo: "Investimento e calculadora",
      tempo: "5 min",
      objetivo: "Mostrar o preço junto com o retorno.",
      fala:
        "O investimento é de {valor}, em até {parcelas}x sem juros, ou à vista com {descontoAVista}% de desconto. " +
        "Com os números que você me passou ({numeros}), o projeto se paga em [prazo de retorno].",
      dica: "Depois de falar o preço, fique em silêncio e deixe o cliente falar primeiro.",
    },
    {
      id: "fechamento",
      titulo: "Fechamento e próximos passos",
      tempo: "3 min",
      objetivo: "Sair com a decisão ou com uma data de decisão.",
      fala:
        "Faz sentido a gente começar? Prefere à vista ou parcelado? ... Então os próximos passos são: aceite da " +
        "proposta, contrato, ART quando precisar e o kick-off com visita técnica em [data].",
      pacto: "fechamento",
      dica: "Se não fechar, saia com data e hora para a decisão. Use o guia de objeções ao lado.",
    },
  ],

  resultados: [
    { id: "ganho", rotulo: "Fechou" },
    { id: "decidir", rotulo: "Vai decidir (data combinada)" },
    { id: "ajuste", rotulo: "Pediu ajuste na proposta" },
    { id: "perdido", rotulo: "Perdeu" },
  ],

  regrasCondicao: [
    "O preço de tabela é o da planilha: à prazo, em até 6x sem juros.",
    "À vista: 10% de desconto. Isso já deixa a margem em ~3%.",
    "Desconto máximo de ~13%. Abaixo disso o projeto dá prejuízo. Exceção, só com a Diretoria.",
    "Desconto só em troca de algo: pagamento à vista, escopo menor ou prazo sem urgência.",
    "Antes de dar desconto, ofereça reduzir o escopo (uma fase, sem adicionais). É o downsell.",
    "Incentivo para fechar em poucos dias: decisão pendente com o Marcelo.",
  ],
};
