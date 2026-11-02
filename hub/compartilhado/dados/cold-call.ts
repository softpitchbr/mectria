// Conteúdo migrado de hub-comercial/js/dados/cold-call.js (versão 0.2), sem mudar o texto.
/** Roteiro da ligação do hunter. O objetivo é um só: marcar a reunião diagnóstica. */
export const ROTEIRO_COLD_CALL: { titulo: string; fala: string; dica?: string }[] = [
  {
    "titulo": "1. Abertura e permissão",
    "fala": "Bom dia, falo com o {decisor}? Aqui é o {vendedor}, da MecTRIA, a empresa júnior de engenharia mecânica da UFTM, aqui de Uberaba. Liguei sem avisar: posso tomar 30 segundos para dizer por que liguei, e aí você decide se a gente continua?",
    "dica": "Pedir permissão baixa a guarda. Se estiver ocupado, pergunte o melhor horário e desligue."
  },
  {
    "titulo": "2. Motivo da ligação",
    "fala": "A gente faz projetos de engenharia para empresas da região, com orientação de professores da UFTM. Quando converso com empresas como a sua, normalmente aparece uma destas: {dor1} ou {dor2}. Alguma delas acontece aí?",
    "dica": "Use a hipótese de dor da Casa de Dados e os ganchos por serviço abaixo."
  },
  {
    "titulo": "3. Uma ou duas perguntas",
    "fala": "Como vocês resolvem isso hoje? ... E isso está no radar para os próximos meses?",
    "dica": "Não faça a diagnóstica por telefone. Só confirme que a dor existe."
  },
  {
    "titulo": "4. Convite para a diagnóstica",
    "fala": "Faz sentido a gente marcar 30 minutos para eu entender melhor o caso, junto com alguém do nosso time de projetos? Se não fizer sentido, você me fala na hora. Pode ser [dia] às [hora] ou [dia] às [hora]?",
    "dica": "Sempre duas opções de horário. Online ou visita técnica."
  },
  {
    "titulo": "5. Confirmação",
    "fala": "Fechado. Vou te mandar o convite pelo WhatsApp e pelo e-mail. Se tiver fotos, desenhos ou plantas, pode mandar por lá que eu já chego preparado. Quem mais participa dessa decisão e pode estar junto?",
    "dica": "Confirme 24 h antes."
  }
];
