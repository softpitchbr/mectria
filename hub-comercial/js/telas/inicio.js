/* Início: o processo comercial visual, do hunter ao closer (tarefa 18), e o que fazer hoje. */
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
      texto: "Cold call direto para o decisor. Lead que chega pelo site, Google ou indicação: contato no mesmo dia.",
      saida: "Diagnóstica marcada com quem decide",
      indicador: "Ligação → conversa com o decisor (hoje, 12% a 20%)",
      link: ["#/playbooks/cold-call", "Playbook de cold call"],
    },
    {
      dono: "Closer",
      titulo: "Reunião diagnóstica",
      texto: "Perguntas GPCTBA + C&I e as perguntas técnicas do serviço. Sai o briefing em PDF para Projetos.",
      saida: "Briefing completo e proposta marcada",
      indicador: "Diagnósticas que viram proposta",
      link: ["#/playbooks/diagnostica", "Playbook da diagnóstica"],
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
      link: ["#/playbooks/proposta", "Playbook da proposta"],
    },
    {
      dono: "Closer",
      titulo: "Follow-up",
      texto: "7 toques em 15 dias úteis, cada um agregando algo ou pedindo a decisão.",
      saida: "Ganho, perdido (com motivo) ou nutrição",
      indicador: "Ciclo médio e motivos de perda",
      link: ["#/fup", "Follow-up"],
    },
    {
      dono: "Adm-Fin · Projetos",
      titulo: "Fechamento e passagem",
      texto: "Contrato, ART e kick-off. Registro no Histórico de todas as propostas, inclusive as perdidas.",
      saida: "Projeto iniciado",
      indicador: "Valor vendido no mês",
    },
  ];

  function contar() {
    var hoje = H.hoje();
    var c = { toques: 0, atrasados: 0, agendadas: 0, diagnosticas: 0, ativos: 0 };
    H.estado.leads.forEach(function (l) {
      var s = H.statusLead(l).id;
      if (s === "fup") {
        c.ativos++;
        var t = H.proximoToque(l);
        if (t && t.data < hoje) c.atrasados++;
        else if (t && t.data === hoje) c.toques++;
      }
      if (s === "agendada" && l.diag.dataProposta >= hoje) c.agendadas++;
      if (s === "diagnostica") c.diagnosticas++;
    });
    return c;
  }

  H.telas.inicio = {
    render: function (el) {
      var c = contar();
      var nome = H.estado.vendedor ? ", " + H.esc(H.estado.vendedor.split(" ")[0]) : "";
      el.innerHTML =
        "<h1>Olá" + nome + "</h1>" +
        '<p class="sub">O processo comercial da MecTRIA num lugar só: da primeira ligação ao fechamento. ' +
        "Siga a mesma estrutura em toda reunião e registre tudo, para a gente medir a conversão proposta a proposta.</p>" +

        '<div class="numeros-hoje">' +
        numero(c.atrasados, "toques de follow-up atrasados", "#/fup") +
        numero(c.toques, "toques de follow-up para hoje", "#/fup") +
        numero(c.agendadas, "apresentações de proposta marcadas", "#/playbooks/proposta") +
        numero(c.diagnosticas, "diagnósticas sem proposta marcada", "#/playbooks/diagnostica") +
        numero(c.ativos, "propostas em follow-up", "#/fup") +
        "</div>" +

        '<div class="acoes" style="margin-bottom:32px">' +
        '<a class="botao" href="#/playbooks/diagnostica">Nova reunião diagnóstica</a>' +
        '<a class="botao botao-sec" href="#/fup">Registrar proposta já apresentada</a>' +
        '<a class="botao botao-sec" href="#/apresentacoes">Abrir apresentações</a>' +
        "</div>" +

        "<h2>O processo, do hunter ao closer</h2>" +
        '<p class="sub">Cada etapa tem um dono, uma saída que libera a próxima e um indicador. ' +
        "O que sair do processo vira dado: proposta perdida também se registra, com o motivo.</p>" +
        '<div class="processo">' + ETAPAS.map(etapa).join("") + "</div>" +
        '<p class="muted pequeno">Fora deste processo (projetos futuros): pós-venda, recompra, upsell e cross-sell.</p>' +

        '<div class="grade-2" style="margin-top:32px">' +
        '<div class="painel-nevoa"><h3>Como ler as marcações</h3><ul class="lista-limpa">' +
        '<li style="margin-bottom:6px"><span class="var">Texto em vinho</span>: veio dos dados do lead (diagnóstica, proposta).</li>' +
        '<li style="margin-bottom:6px"><mark class="falta">[texto em vermelho]</mark>: complete antes de falar ou mandar.</li>' +
        "<li>" + H.seloValidar().trim() + ": depende de informação ou decisão da MecTRIA. Até lá, é rascunho.</li>" +
        "</ul></div>" +
        '<div class="painel-nevoa"><h3>Onde ficam os dados</h3>' +
        '<p class="pequeno">Tudo o que você preenche fica salvo neste navegador. Use o menu <strong>Dados</strong> para ' +
        "exportar o backup toda semana e para gerar o CSV das propostas, que alimenta o Histórico (taxa de fechamento).</p>" +
        '<p class="pequeno muted">Esta é a base para lapidarmos juntos. Quando o processo estiver validado, os dados passam para uma base compartilhada do time.</p></div>' +
        "</div>";
    },
  };

  function numero(n, rotulo, href) {
    return '<a class="numero-hoje" href="' + href + '"><strong>' + n + "</strong>" + H.esc(rotulo) + "</a>";
  }

  function etapa(e, i) {
    return (
      '<div class="etapa">' +
      '<div class="etapa-cabeca"><span class="etapa-num">' + (i + 1) + '</span><span class="etapa-linha"></span></div>' +
      '<span class="dono">' + H.esc(e.dono) + "</span>" +
      "<h3>" + H.esc(e.titulo) + "</h3>" +
      "<p>" + H.esc(e.texto) + "</p>" +
      '<p class="saida"><strong>Saída:</strong> ' + H.esc(e.saida) + "</p>" +
      '<p class="indicador">' + H.esc(e.indicador) + "</p>" +
      (e.link ? '<a class="pequeno" href="' + e.link[0] + '">' + H.esc(e.link[1]) + " →</a>" : "") +
      "</div>"
    );
  }
})(window.HUB);
