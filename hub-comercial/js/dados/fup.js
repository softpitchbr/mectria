/* Cadência de follow-up para propostas já apresentadas. Os dias são dias úteis contados da
   apresentação (D0 = dia da reunião). As mensagens usam variáveis {chave}; o que não tiver
   valor aparece entre colchetes para o vendedor completar. */
window.HUB = window.HUB || {};

HUB.FUP = {
  cadencia: [
    {
      id: "d0",
      dia: 0,
      canal: "WhatsApp + e-mail",
      objetivo: "Registrar por escrito o que foi combinado",
      modelo:
        "Oi, {contato}! Obrigado pela reunião de hoje.\n\n" +
        "Como combinamos, o projeto de {servico} é para resolver o que você me contou: {dor}. Segue a proposta em PDF.\n\n" +
        "Ficamos de falar sobre a decisão em {data_decisao}. Qualquer dúvida até lá, é só me chamar aqui.\n\n" +
        "{vendedor} · MecTRIA",
    },
    {
      id: "d1",
      dia: 1,
      canal: "WhatsApp",
      objetivo: "Destravar a dúvida que surgiu depois",
      modelo:
        "Oi, {contato}, tudo bem? Às vezes a dúvida aparece depois da reunião, quando vocês conversam internamente. " +
        "Surgiu alguma pergunta sobre o projeto que eu possa responder? Se ajudar, explico em 15 minutos para {decisores}.",
    },
    {
      id: "d3",
      dia: 3,
      canal: "Ligação",
      objetivo: "Saber em que pé está a decisão",
      modelo:
        "Na ligação: \"Oi, {contato}, é o {vendedor}, da MecTRIA. Estou ligando para saber como está a decisão sobre " +
        "o projeto de {servico}. Ficou alguma dúvida, ou alguma coisa que eu possa ajustar?\"\n\n" +
        "Se não atender, no WhatsApp: \"Tentei te ligar para saber da proposta. Qual o melhor horário para falarmos 5 minutos?\"",
    },
    {
      id: "d5",
      dia: 5,
      canal: "WhatsApp",
      objetivo: "Agregar valor com um conteúdo do mesmo tema",
      modelo:
        "Oi, {contato}! Lembrei de vocês: {link_conteudo}. É um projeto parecido com o que conversamos sobre " +
        "{servico}. Achei que valia mandar.",
      dica: "Use um post do Instagram ou um caso do mesmo serviço. O Marketing pode transformar negociações reais em posts para isso.",
    },
    {
      id: "d8",
      dia: 8,
      canal: "Ligação",
      objetivo: "Perguntar direto o que falta para decidir",
      modelo:
        "Na ligação: \"{contato}, quero ser direto para não tomar seu tempo: o que falta para vocês decidirem? " +
        "É sobre o projeto, o investimento ou o momento?\"\n\nTrate a resposta com o guia de objeções.",
    },
    {
      id: "d12",
      dia: 12,
      canal: "E-mail",
      objetivo: "Oferecer um caminho alternativo",
      modelo:
        "Assunto: Projeto de {servico}: uma alternativa\n\n" +
        "Oi, {contato},\n\n" +
        "Se o investimento ou o momento pesaram, dá para começar por uma fase do projeto ou ajustar o escopo. " +
        "Também consigo reservar a equipe para começar em [data de início] se fecharmos até [data].\n\n" +
        "Quer que eu prepare essa versão?\n\n" +
        "{vendedor}\nMecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM",
      dica: "Downsell por escopo, nunca abaixo do piso. A data de início precisa ser real.",
    },
    {
      id: "d15",
      dia: 15,
      canal: "WhatsApp",
      objetivo: "Encerrar com elegância",
      modelo:
        "Oi, {contato}. Como não conseguimos nos falar, vou entender que agora não é o momento e paro de te procurar, " +
        "tudo bem? A proposta vale até {validade}. Se mudar alguma coisa, é só me chamar aqui. Obrigado pela confiança!",
      dica: "Depois deste toque, registre o resultado: perdida (com o motivo) ou nutrição.",
    },
  ],

  nutricao: {
    dias: 45,
    modelo:
      "Oi, {contato}, tudo bem? Faz um tempo que conversamos sobre {servico}. Como está esse assunto aí? " +
      "Estamos abrindo agenda para novos projetos em [mês].",
  },

  motivosPerda: [
    "Preço",
    "Prazo",
    "Escolheu um concorrente",
    "Não é prioridade agora",
    "Sem resposta",
    "Escopo (queria fabricação ou instalação)",
    "Quem decide não aprovou",
    "Fez internamente",
    "Outro",
  ],

  regras: [
    "Todo toque agrega algo ou pede uma decisão. Nunca mande só \"conseguiu ver?\".",
    "No máximo um toque por dia. Ligação vale mais que mensagem.",
    "Toda proposta termina como ganha, perdida (com motivo) ou nutrição. É isso que mede a conversão.",
    "O follow-up é de quem apresentou a proposta.",
    "Se o cliente disser não, agradeça, pergunte o motivo e pare a cadência.",
  ],
};

/* Feriados nacionais e pontos facultativos no período do projeto (não contam como dia útil).
   Atualizar a cada ano e incluir os feriados municipais de Uberaba se a MecTRIA não trabalhar neles. */
HUB.FERIADOS = [
  "2026-10-12", "2026-11-02", "2026-11-20", "2026-12-25",
  "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-26", "2027-04-21",
  "2027-05-01", "2027-05-27", "2027-09-07", "2027-10-12", "2027-11-02",
  "2027-11-15", "2027-11-20", "2027-12-25",
];
