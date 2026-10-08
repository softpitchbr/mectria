/* Playbooks: entrada com os quatro roteiros e o processo comercial visual (tarefa 18). */
(function (H) {
  var ETAPAS = [
    {
      dono: "Casa de Dados",
      titulo: "Lista de leads",
      texto: "Filtro por região e CNAE, com score por IA, hipótese de dor, decisor e telefone.",
      saida: "Lead com decisor e hipótese de dor",
      indicador: "Leads qualificados por semana",
    },
    {
      dono: "Hunter",
      titulo: "Prospecção",
      texto: "Cold call direto para o decisor. Lead do site, do Google ou de indicação: contato no mesmo dia.",
      saida: "Diagnóstica marcada com quem decide",
      indicador: "Ligação → conversa com o decisor (hoje, 12% a 20%)",
      link: "#/playbooks/cold-call",
    },
    {
      dono: "Closer",
      titulo: "Reunião diagnóstica",
      texto: "Perguntas GPCTBA + C&I e as perguntas técnicas do serviço. Sai o briefing em PDF para Projetos.",
      saida: "Briefing completo e proposta marcada",
      indicador: "Diagnósticas que viram proposta",
      link: "#/playbooks/diagnostica",
    },
    {
      dono: "Projetos · Adm-Fin · Diretoria",
      titulo: "Proposta em 3 dias úteis",
      texto: "Estimativa técnica (dia 1), precificação (dia 2) e validação da Diretoria (dia 2).",
      saida: "Preço validado",
      indicador: "Dias do briefing à proposta",
    },
    {
      dono: "Closer",
      titulo: "Apresentação da proposta",
      texto: "Sequência fixa com 6 micro pactos. A decisão sai na reunião ou no mesmo dia.",
      saida: "Fechado, ou data para decidir",
      indicador: "Proposta → fechamento: meta de 40%",
      link: "#/playbooks/proposta",
    },
    {
      dono: "Closer",
      titulo: "Follow-up",
      texto: "7 toques em 15 dias úteis, cada um agregando algo ou pedindo a decisão.",
      saida: "Ganho, perdido (com motivo) ou nutrição",
      indicador: "Ciclo médio e motivos de perda",
      link: "#/fup",
    },
    {
      dono: "Adm-Fin · Projetos",
      titulo: "Fechamento e passagem",
      texto: "Contrato, ART e kick-off. Registro no Histórico de todas as propostas, inclusive as perdidas.",
      saida: "Projeto iniciado",
      indicador: "Valor vendido no mês",
    },
  ];

  H.telas.playbooks = {
    render: function (el) {
      el.innerHTML =
        '<div class="cabeca"><h1>Playbooks</h1></div>' +
        '<div class="ladrilhos grandes">' +
        '<a class="ladrilho" href="#/playbooks/cold-call">' + H.icone("telefone") + "<strong>Cold call</strong><span>Marcar a diagnóstica</span></a>" +
        '<a class="ladrilho" href="#/playbooks/diagnostica">' + H.icone("conversa") + "<strong>Reunião diagnóstica</strong><span>Perguntas e briefing para Projetos</span></a>" +
        '<a class="ladrilho" href="#/playbooks/proposta">' + H.icone("documento") + "<strong>Apresentação de proposta</strong><span>Roteiro e micro pactos</span></a>" +
        '<a class="ladrilho" href="#/playbooks/processo">' + H.icone("processo") + "<strong>Processo comercial</strong><span>Do hunter ao closer</span></a>" +
        "</div>";
    },
  };

  H.telas.processo = {
    render: function (el) {
      el.innerHTML =
        '<div class="estreita"><a class="voltar" href="#/playbooks">' + H.icone("voltar") + "Playbooks</a>" +
        '<div class="cabeca" style="margin-top:8px"><div><h1>Processo comercial</h1><p class="sub">Toque numa etapa para ver a saída e o indicador.</p></div></div>' +
        '<ol class="processo">' +
        ETAPAS.map(function (e, i) {
          return '<li><span class="num">' + (i + 1) + "</span><details><summary>" +
            '<span class="dono">' + H.esc(e.dono) + "</span><strong>" + H.esc(e.titulo) + "</strong></summary>" +
            '<div class="detalhe"><p style="margin:0 0 6px">' + H.esc(e.texto) + "</p>" +
            '<p class="muted" style="margin:0 0 4px"><strong>Saída:</strong> ' + H.esc(e.saida) + "</p>" +
            '<p class="muted" style="margin:0 0 6px"><strong>Indicador:</strong> ' + H.esc(e.indicador) + "</p>" +
            (e.link ? '<a href="' + e.link + '">Abrir</a>' : "") + "</div></details></li>";
        }).join("") +
        '</ol><p class="pequeno muted">Fora deste processo (projetos futuros): pós-venda, recompra, upsell e cross-sell.</p></div>';
    },
  };
})(window.HUB);
