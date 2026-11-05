// Conteúdo migrado de hub-comercial/js/dados/cold-call.js (versão 0.2), sem mudar o texto.
/** Roteiro da ligação do hunter. O objetivo é um só: marcar a reunião diagnóstica. */
// Roteiro de cold call de docs/17-processo-comercial.md, seção 2 (Lucas, 04/11/2026), sem mudar o texto.
// {clientes} é o {nº de clientes} do roteiro, até o Marcelo passar o número (pedido 17).
export const OBJETIVO_COLD_CALL =
  "O objetivo da ligação é um só: marcar 30 minutos para a diagnóstica. A ligação não explica o serviço; ela desperta a curiosidade pela jornada de parcerias.";

export const ROTEIRO_COLD_CALL: { titulo: string; fala: string; desvios?: { quando: string; fala: string }[]; dica?: string }[] = [
  {
    "titulo": "1. Abertura: pedir um minuto",
    "fala": "Fala, {contato}, tudo bem? Aqui é o {hunter}, da MecTRIA. Estou te ligando porque queria dividir com você, em um minutinho, uma jornada de parcerias que estamos abrindo com empresas de {segmento}. Você tem esse minutinho para eu te contar a ideia?",
    "desvios": [
      {
        "quando": "Se não tiver o minuto",
        "fala": "Te entendo. Me dá só 30 segundos? Se não fizer sentido, eu te deixo tranquilo."
      }
    ]
  },
  {
    "titulo": "2. Quem é a MecTRIA, com uma pergunta",
    "fala": "Bacana, {contato}, que bom que você topou. A MecTRIA é uma empresa do Movimento Empresa Júnior, o que significa que a gente não recebe para tocar os nossos projetos. Inclusive, você já ouviu falar do Movimento Empresa Júnior?"
  },
  {
    "titulo": "3. Conhece ou não o Movimento Empresa Júnior",
    "fala": "",
    "desvios": [
      {
        "quando": "Se não conhece",
        "fala": "Legal. O Movimento Empresa Júnior é uma extensão da universidade. Com a orientação de professores, os graduandos aplicam o que aprendem em projetos reais, como já fizemos com {clientes} clientes."
      },
      {
        "quando": "Se já conhece",
        "fala": "Que bom! Então você sabe que são projetos reais, feitos por graduandos com a orientação de professores. Já fizemos isso com {clientes} clientes."
      }
    ]
  },
  {
    "titulo": "4. A ponte para a reunião",
    "fala": "A ideia é a gente ter uma primeira reunião para entender qual é a maior prioridade de vocês hoje e se existe sinergia para a nossa jornada de parcerias. Na reunião eu te explico melhor como ela funciona, mas já te adianto: pelo que vocês fazem em {segmento}, temos viabilidade e capacidade produtiva para desenhar um projeto juntos que fique bom para os dois lados."
  },
  {
    "titulo": "5. O pedido",
    "fala": "O primeiro passo seria reservar 30 minutinhos da sua semana para entender, na prática, se existe sinergia para um projeto juntos ou não.",
    "dica": "Sugestão: fechar com duas opções de horário, para a resposta ser uma escolha e não um sim ou não. Por exemplo, \"Fica melhor terça às 10h ou quinta às 15h?\"."
  }
];

/** Cold message (rascunho de docs/17): para o WhatsApp, quando a ligação não completa ou como primeiro contato. */
export const COLD_MESSAGE =
  "Oi, {contato}, tudo bem? Aqui é o {hunter}, da MecTRIA. Estamos abrindo uma jornada de parcerias com empresas de {segmento} e queria dividir a ideia com você. Somos uma empresa do Movimento Empresa Júnior: projetos reais de engenharia, feitos por graduandos da UFTM com orientação de professores. Topa reservar 30 minutos esta semana para ver se existe sinergia para um projeto juntos?";

export const ANTES_COLD_CALL: readonly string[] = [
  "Pegue a lista do dia na Casa de Dados: decisor, telefone, CNAE, score e hipótese de dor.",
  "Ligue em bloco e em horário fixo, todo dia. Constância vale mais que volume concentrado na sexta.",
  "Deixe a agenda aberta para marcar a diagnóstica na hora.",
  "Trate por \"o senhor\" ou \"a senhora\" até a pessoa liberar o \"você\"."
];

/** Texto da meta na versão 0.2 (a meta em uso fica em rotinas.ts). */
export const META_COLD_CALL_TEXTO = "Meta da semana: 8 conexões por hunter (conversas com quem decide). A meta de cada dia é cumprir a rotina.";

/** Como passar pela recepção. */
export const GATEKEEPER: readonly string[] = [
  "\"Bom dia, aqui é o {vendedor}, da MecTRIA, da UFTM. Quem cuida da parte de manutenção, de projetos ou das máquinas aí?\"",
  "\"Qual o melhor horário para falar com essa pessoa? Tem um celular ou WhatsApp direto?\"",
  "Não apresente a proposta para a recepção: peça nome, horário e contato direto, e agradeça."
];

/** Tentativas quando o decisor não atende. */
export const TENTATIVAS_COLD_CALL: { dia: number; canal: string; texto: string }[] = [
  {
    "dia": 0,
    "canal": "Ligação",
    "texto": "Primeira tentativa."
  },
  {
    "dia": 0,
    "canal": "WhatsApp",
    "texto": "Oi, {decisor}! Aqui é o {vendedor}, da MecTRIA, a empresa júnior de engenharia mecânica da UFTM. Tentei te ligar sobre {tema}. Qual o melhor horário para conversarmos 5 minutos?"
  },
  {
    "dia": 2,
    "canal": "Ligação",
    "texto": "Em outro período do dia."
  },
  {
    "dia": 4,
    "canal": "Ligação + e-mail",
    "texto": "E-mail curto com o gancho do serviço."
  },
  {
    "dia": 7,
    "canal": "Ligação",
    "texto": "Última ligação."
  },
  {
    "dia": 10,
    "canal": "WhatsApp",
    "texto": "Oi, {decisor}. Não quero insistir: se {tema} não for prioridade agora, sem problema. Se mudar, é só me chamar aqui. {vendedor} · MecTRIA"
  }
];

export const PRIVACIDADE_COLD_CALL = "Se perguntarem de onde veio o contato, diga a verdade. Se pedirem para não ligar mais, tire o contato da lista na hora.";
