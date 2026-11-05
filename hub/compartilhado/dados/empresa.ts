// Conteúdo migrado de hub-comercial/js/dados/empresa.js (versão 0.2), sem mudar o texto. Rascunho até a validação com a MecTRIA.
// Os anos de MecTRIA saem de `fundacao` (ver compartilhado/proposta.ts), não do número gravado aqui.

export const EMPRESA = {
  "nome": "MecTRIA",
  "assinatura": "Empresa Júnior de Engenharia Mecânica da UFTM",
  "fundacao": 2013,
  "cidade": "Uberaba/MG",
  "site": "www.mectria.com",
  "email": "comercial@mectria.com",
  "whatsapp": "",
  "proposito": "A MecTRIA é uma empresa júnior sem fins lucrativos, fundada em 2013 e vinculada à UFTM. Estudantes de Engenharia Mecânica desenvolvem projetos reais para empresas da região, com orientação de professores, e toda a receita volta para a formação dos membros.",
  "fraseValor": "projetos orientados por professores da UFTM, com o valor acessível de uma empresa júnior",
  "credoProvisorio": "Fomentar o empreendedorismo local por meio de soluções de engenharia.",
  "foco": "Nosso foco é o projeto de engenharia: dimensionamento, cálculo e documentação prontos para fabricar. A fabricação, a instalação e a execução física ficam com o cliente ou com parceiros.",
  "diferenciais": [
    {
      "titulo": "Orientação de professores da UFTM",
      "texto": "Todo projeto tem um professor orientador acompanhando as decisões técnicas.",
      "validar": true
    },
    {
      "titulo": "Projeto pronto para fabricar",
      "texto": "Modelo 3D, desenhos 2D com tolerâncias, memória de cálculo e lista de componentes."
    },
    {
      "titulo": "Dentro das normas",
      "texto": "ABNT, ISO, NR-12 e ART quando o projeto exige.",
      "validar": true
    },
    {
      "titulo": "Escopo claro desde a proposta",
      "texto": "Você sabe o que está incluído e o que fica com você antes de fechar."
    },
    {
      "titulo": "Clientes que voltam",
      "texto": "Nosso maior cliente já está no quarto ou quinto projeto com a gente.",
      "validar": true
    },
    {
      "titulo": "Receita que vira formação",
      "texto": "Somos sem fins lucrativos: o que o projeto paga volta para a formação de engenheiros."
    }
  ],
  "numeros": [
    {
      "rotulo": "anos de MecTRIA",
      "valor": "13"
    },
    {
      "rotulo": "projetos entregues",
      "valor": ""
    },
    {
      "rotulo": "clientes atendidos",
      "valor": ""
    },
    {
      "rotulo": "clientes que voltaram",
      "valor": ""
    }
  ],
  "fluxo": [
    {
      "etapa": "Reunião diagnóstica + briefing",
      "dono": "Comercial",
      "quando": "Dia 1, manhã"
    },
    {
      "etapa": "Estimativa técnica",
      "dono": "Projetos",
      "quando": "Dia 1, tarde"
    },
    {
      "etapa": "Precificação",
      "dono": "Adm-Financeiro",
      "quando": "Dia 2, manhã"
    },
    {
      "etapa": "Validação da proposta",
      "dono": "Comercial + Diretoria",
      "quando": "Dia 2, tarde"
    },
    {
      "etapa": "Apresentação da proposta ao cliente",
      "dono": "Comercial",
      "quando": "Dia 3"
    },
    {
      "etapa": "Registro no Histórico (ganhas e perdidas)",
      "dono": "Adm-Financeiro",
      "quando": "Na decisão"
    }
  ],
  "regras": {
    "diasParaProposta": 3,
    "parcelasSemJuros": 6,
    "descontoAVista": 10,
    "descontoMaximo": 13,
    "validadePropostaDias": 15,
    "urgencia": "Apertado +15%, Urgente +30%, Crítico +60% sobre o subtotal técnico",
    "art": "Repasse da taxa do CREA (R$ 271 na v4)",
    "validar": true
  }
} as const;
