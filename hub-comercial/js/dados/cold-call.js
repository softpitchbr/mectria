/* Playbook de cold call do hunter: ligação top-down para o decisor, a partir da lista da
   Casa de Dados (filtro por região e CNAE, score por IA, hipótese de dor, decisor e telefone).
   O gargalo medido pelo Marcelo é chegar ao decisor (80% a 88% de perda, R1 13:17).
   O objetivo da ligação é um só: marcar a reunião diagnóstica. */
window.HUB = window.HUB || {};

HUB.COLD_CALL = {
  antes: [
    "Pegue a lista do dia na Casa de Dados: decisor, telefone, CNAE, score e hipótese de dor.",
    "Ligue em bloco e em horário fixo, todo dia. Constância vale mais que volume concentrado na sexta.",
    "Deixe a agenda aberta para marcar a diagnóstica na hora.",
    "Trate por \"o senhor\" ou \"a senhora\" até a pessoa liberar o \"você\".",
  ],
  meta: "Meta diária, não semanal: [nº de ligações] por dia, num bloco fixo. Calibrar com a disponibilidade dos hunters.",

  roteiro: [
    {
      titulo: "1. Abertura e permissão",
      fala:
        "Bom dia, falo com o {decisor}? Aqui é o {vendedor}, da MecTRIA, a empresa júnior de engenharia mecânica da " +
        "UFTM, aqui de Uberaba. Liguei sem avisar: posso tomar 30 segundos para dizer por que liguei, e aí você decide " +
        "se a gente continua?",
      dica: "Pedir permissão baixa a guarda. Se estiver ocupado, pergunte o melhor horário e desligue.",
    },
    {
      titulo: "2. Motivo da ligação",
      fala:
        "A gente faz projetos de engenharia para empresas da região, com orientação de professores da UFTM. Quando " +
        "converso com empresas como a sua, normalmente aparece uma destas: {dor1} ou {dor2}. Alguma delas acontece aí?",
      dica: "Use a hipótese de dor da Casa de Dados e os ganchos por serviço abaixo.",
    },
    {
      titulo: "3. Uma ou duas perguntas",
      fala: "Como vocês resolvem isso hoje? ... E isso está no radar para os próximos meses?",
      dica: "Não faça a diagnóstica por telefone. Só confirme que a dor existe.",
    },
    {
      titulo: "4. Convite para a diagnóstica",
      fala:
        "Faz sentido a gente marcar 30 minutos para eu entender melhor o caso, junto com alguém do nosso time de " +
        "projetos? Se não fizer sentido, você me fala na hora. Pode ser [dia] às [hora] ou [dia] às [hora]?",
      dica: "Sempre duas opções de horário. Online ou visita técnica.",
    },
    {
      titulo: "5. Confirmação",
      fala:
        "Fechado. Vou te mandar o convite pelo WhatsApp e pelo e-mail. Se tiver fotos, desenhos ou plantas, pode " +
        "mandar por lá que eu já chego preparado. Quem mais participa dessa decisão e pode estar junto?",
      dica: "Confirme 24 h antes.",
    },
  ],

  gatekeeper: [
    "\"Bom dia, aqui é o {vendedor}, da MecTRIA, da UFTM. Quem cuida da parte de manutenção, de projetos ou das máquinas aí?\"",
    "\"Qual o melhor horário para falar com essa pessoa? Tem um celular ou WhatsApp direto?\"",
    "Não apresente a proposta para a recepção: peça nome, horário e contato direto, e agradeça.",
  ],

  tentativas: [
    { dia: 0, canal: "Ligação", texto: "Primeira tentativa." },
    {
      dia: 0,
      canal: "WhatsApp",
      texto:
        "Oi, {decisor}! Aqui é o {vendedor}, da MecTRIA, a empresa júnior de engenharia mecânica da UFTM. Tentei te " +
        "ligar sobre {tema}. Qual o melhor horário para conversarmos 5 minutos?",
    },
    { dia: 2, canal: "Ligação", texto: "Em outro período do dia." },
    { dia: 4, canal: "Ligação + e-mail", texto: "E-mail curto com o gancho do serviço." },
    { dia: 7, canal: "Ligação", texto: "Última ligação." },
    {
      dia: 10,
      canal: "WhatsApp",
      texto:
        "Oi, {decisor}. Não quero insistir: se {tema} não for prioridade agora, sem problema. Se mudar, é só me " +
        "chamar aqui. {vendedor} · MecTRIA",
    },
  ],

  privacidade:
    "Se perguntarem de onde veio o contato, diga a verdade. Se pedirem para não ligar mais, tire o contato da lista na hora.",
};
