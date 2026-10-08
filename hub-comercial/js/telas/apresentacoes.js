/* Apresentações: diagnóstica, portfólio para o WhatsApp e propostas por serviço.
   Os modelos ficam em apresentacoes/ e leem os dados do lead escolhido (?lead=id). */
(function (H) {
  var leadEscolhido = "";

  function comLead(url) {
    if (!leadEscolhido) return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "lead=" + encodeURIComponent(leadEscolhido);
  }

  H.telas.apresentacoes = {
    render: function (el) {
      var leads = H.estado.leads;
      if (leadEscolhido && !H.lead(leadEscolhido)) leadEscolhido = "";
      var lead = leadEscolhido && H.lead(leadEscolhido);
      var vars = H.variaveis(lead);
      var msgPortfolio =
        "Oi, {contato}! Aqui é o {vendedor}, da MecTRIA. Segue a nossa apresentação, para você conhecer quem " +
        "somos e o que fazemos: [link do portfólio]\n\nQualquer dúvida, é só me chamar aqui.";

      el.innerHTML =
        '<div class="cabecalho-tela"><div><h1>Apresentações</h1>' +
        '<p class="sub">Escolha um lead para a apresentação já abrir com o nome, as dores e o escopo dele. ' +
        "Use as setas do teclado para passar os slides; <strong>F</strong> põe em tela cheia.</p></div>" +
        '<div class="campo" style="min-width:280px"><label for="lead-apresentacao">Personalizar para</label>' +
        '<select id="lead-apresentacao"><option value="">Nenhum lead (modelo em branco)</option>' +
        leads
          .map(function (l) {
            return '<option value="' + l.id + '"' + (l.id === leadEscolhido ? " selected" : "") + ">" +
              H.esc((l.empresa || "Sem nome") + (l.contato ? " · " + l.contato : "")) + "</option>";
          })
          .join("") +
        "</select></div></div>" +

        '<div class="grade" style="margin-bottom:32px">' +
        '<div class="cartao"><h2>Reunião diagnóstica</h2>' +
        '<p class="muted">Apoio curto para a diagnóstica: o combinado da reunião, quem somos, o que fazemos e o próximo passo. ' +
        "A conversa é guiada pelo playbook.</p>" +
        '<div class="acoes"><a class="botao" target="_blank" rel="noopener" href="' + comLead("apresentacoes/diagnostica.html") + '">Abrir</a>' +
        '<a class="botao botao-sec" href="#/playbooks/diagnostica">Playbook</a></div></div>' +

        '<div class="cartao"><h2>Portfólio da MecTRIA</h2>' +
        '<p class="muted">Página para mandar no WhatsApp antes ou depois da diagnóstica. Abre bem no celular e também sai em PDF.</p>' +
        '<div class="fala mensagem">' + H.preencherHTML(msgPortfolio, vars) + "</div>" +
        '<div class="acoes"><a class="botao" target="_blank" rel="noopener" href="apresentacoes/portfolio.html">Abrir</a>' +
        '<button type="button" class="botao-sec" data-copiar="' + H.esc(H.preencher(msgPortfolio, vars)) + '">Copiar mensagem</button></div>' +
        '<p class="dica">Para o cliente abrir o link, o portfólio precisa estar publicado no site novo (ex.: mectria.com/portfolio). ' +
        "Até lá, abra e salve em PDF (Ctrl+P) para mandar o arquivo.</p></div>" +
        "</div>" +

        "<h2>Apresentações de proposta</h2>" +
        '<p class="sub">Um modelo por serviço, com a sequência fixa e os micro pactos. Só muda o mínimo: cliente, dores, escopo, ' +
        "preço, prazo e time. É o modelo base que vira a apresentação interativa da etapa I (S6–S7).</p>" +
        '<div class="grade">' +
        H.SERVICOS.map(function (s) {
          if (s.emEstruturacao) {
            return '<div class="cartao" style="opacity:.7"><h3>' + H.esc(s.nome) + '</h3><p class="muted pequeno">' + H.esc(s.resumo) + "</p></div>";
          }
          return (
            '<div class="cartao"><span class="selo">' + H.esc(s.sigla) + "</span><h3 style=\"margin-top:6px\">" + H.esc(s.nome) + "</h3>" +
            '<p class="muted pequeno">' + H.esc(s.resumo) + "</p>" +
            '<div class="acoes"><a class="botao botao-pequeno" target="_blank" rel="noopener" href="' +
            comLead("apresentacoes/proposta.html?servico=" + s.id) + '">Abrir modelo</a></div></div>'
          );
        }).join("") +
        "</div>";

      el.querySelector("#lead-apresentacao").addEventListener("change", function (ev) {
        leadEscolhido = ev.target.value;
        H.rerender();
      });
    },
  };
})(window.HUB);
