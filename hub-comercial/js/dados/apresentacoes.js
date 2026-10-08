/* Catálogo de apresentações. Cada item é um arquivo próprio em apresentacoes/, que pode ser
   personalizado sem mexer nos outros. As de proposta seguem a sequência fixa do Método TRIA
   (motor em apresentacoes/proposta-base.js); o que é específico de cada serviço fica no
   CONFIG no topo do arquivo dele. */
window.HUB = window.HUB || {};

HUB.APRESENTACOES = [
  {
    id: "diagnostica",
    grupo: "diagnostica",
    titulo: "Reunião diagnóstica",
    resumo: "Apoio para a primeira reunião",
    icone: "conversa",
    arquivo: "apresentacoes/diagnostica.html",
  },
  {
    id: "portfolio",
    grupo: "diagnostica",
    titulo: "Portfólio",
    resumo: "Para mandar no WhatsApp",
    icone: "enviar",
    arquivo: "apresentacoes/portfolio.html",
  },
];

// uma apresentação de proposta por serviço ativo da Carta
HUB.servicosAtivos().forEach(function (s) {
  HUB.APRESENTACOES.push({
    id: "proposta-" + s.id,
    grupo: "proposta",
    servico: s.id,
    titulo: s.nome,
    sigla: s.sigla,
    arquivo: "apresentacoes/propostas/" + s.id + ".html",
  });
});

HUB.apresentacaoDoServico = function (servicoId) {
  return HUB.APRESENTACOES.find(function (a) { return a.servico === servicoId; });
};
