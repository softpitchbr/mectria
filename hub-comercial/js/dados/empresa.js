/* Dados da MecTRIA usados em todo o hub.
   Fontes: manual de identidade v1.0, Carta de Serviços e planilha de precificação v4
   (resumos em docs/10, docs/11 e docs/12).
   Convenção: { validar: true } ou "[item N]" marcam o que ainda é hipótese ou depende
   de um pedido de docs/14-pedidos-a-mectria.md. */
window.HUB = window.HUB || {};

HUB.EMPRESA = {
  nome: "MecTRIA",
  assinatura: "Empresa Júnior de Engenharia Mecânica da UFTM",
  fundacao: 2013,
  cidade: "Uberaba/MG",
  site: "www.mectria.com",
  email: "comercial@mectria.com",
  whatsapp: "", // [item 9] WhatsApp comercial oficial: preencher quando a MecTRIA enviar

  proposito:
    "A MecTRIA é uma empresa júnior sem fins lucrativos, fundada em 2013 e vinculada à UFTM. " +
    "Estudantes de Engenharia Mecânica desenvolvem projetos reais para empresas da região, " +
    "com orientação de professores, e toda a receita volta para a formação dos membros.",

  // frase-modelo do manual para falar de preço sem "menor preço"
  fraseValor:
    "projetos orientados por professores da UFTM, com o valor acessível de uma empresa júnior",

  // lema do MEJ: credo provisório até a sessão de Primal Branding [item 22]
  credoProvisorio: "Fomentar o empreendedorismo local por meio de soluções de engenharia.",

  foco:
    "Nosso foco é o projeto de engenharia: dimensionamento, cálculo e documentação prontos para " +
    "fabricar. A fabricação, a instalação e a execução física ficam com o cliente ou com parceiros.",

  diferenciais: [
    {
      titulo: "Orientação de professores da UFTM",
      texto: "Todo projeto tem um professor orientador acompanhando as decisões técnicas.",
      validar: true, // [item 18] nomes, áreas e autorização
    },
    {
      titulo: "Projeto pronto para fabricar",
      texto: "Modelo 3D, desenhos 2D com tolerâncias, memória de cálculo e lista de componentes.",
    },
    {
      titulo: "Dentro das normas",
      texto: "ABNT, ISO, NR-12 e ART quando o projeto exige.",
      validar: true, // confirmar quem assina a ART
    },
    {
      titulo: "Escopo claro desde a proposta",
      texto: "Você sabe o que está incluído e o que fica com você antes de fechar.",
    },
    {
      titulo: "Clientes que voltam",
      texto: "Nosso maior cliente já está no quarto ou quinto projeto com a gente.",
      validar: true, // [item 17] número verificável de clientes que recompraram
    },
    {
      titulo: "Receita que vira formação",
      texto: "Somos sem fins lucrativos: o que o projeto paga volta para a formação de engenheiros.",
    },
  ],

  // [item 17] números verificáveis. Enquanto vazios, aparecem como pendência.
  numeros: [
    { rotulo: "anos de MecTRIA", valor: String(new Date().getFullYear() - 2013) },
    { rotulo: "projetos entregues", valor: "" },
    { rotulo: "clientes atendidos", valor: "" },
    { rotulo: "clientes que voltaram", valor: "" },
  ],

  // fluxo de precificação da planilha v4 (3 dias úteis do briefing à proposta)
  fluxo: [
    { etapa: "Reunião diagnóstica + briefing", dono: "Comercial", quando: "Dia 1, manhã" },
    { etapa: "Estimativa técnica", dono: "Projetos", quando: "Dia 1, tarde" },
    { etapa: "Precificação", dono: "Adm-Financeiro", quando: "Dia 2, manhã" },
    { etapa: "Validação da proposta", dono: "Comercial + Diretoria", quando: "Dia 2, tarde" },
    { etapa: "Apresentação da proposta ao cliente", dono: "Comercial", quando: "Dia 3" },
    { etapa: "Registro no Histórico (ganhas e perdidas)", dono: "Adm-Financeiro", quando: "Na decisão" },
  ],

  // regras comerciais da v4. [item 27] confirmar com o Marcelo se a v4 está em uso.
  regras: {
    diasParaProposta: 3,
    parcelasSemJuros: 6,
    descontoAVista: 10, // % sobre o preço de tabela; deixa a margem em ~3%
    descontoMaximo: 13, // % aproximado; abaixo disso o projeto dá prejuízo
    validadePropostaDias: 15, // [validar] dias corridos
    urgencia: "Apertado +15%, Urgente +30%, Crítico +60% sobre o subtotal técnico",
    art: "Repasse da taxa do CREA (R$ 271 na v4)",
    validar: true,
  },
};
