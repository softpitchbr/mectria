/* Apresentações: um cartão por apresentação. Cada cartão abre o arquivo dela, já com o
   cliente escolhido em "Para". */
(function (H) {
  var leadEscolhido = "";

  H.telas.apresentacoes = {
    render: function (el) {
      if (leadEscolhido && !H.lead(leadEscolhido)) leadEscolhido = "";
      var lead = leadEscolhido && H.lead(leadEscolhido);
      var servicosDoLead = (lead && lead.servicos) || [];

      function link(a) {
        return a.arquivo + (leadEscolhido ? "?lead=" + encodeURIComponent(leadEscolhido) : "");
      }

      var diag = H.APRESENTACOES.filter(function (a) { return a.grupo === "diagnostica"; });
      var propostas = H.APRESENTACOES.filter(function (a) { return a.grupo === "proposta"; });
      var msgPortfolio = H.preencher(
        "Oi, {contato}! Aqui é o {vendedor}, da MecTRIA. Segue a nossa apresentação: [link do portfólio]. Qualquer dúvida, é só me chamar aqui.",
        H.variaveis(lead)
      );

      el.innerHTML =
        '<div class="cabeca"><h1>Apresentações</h1>' +
        '<label class="campo" style="min-width:260px"><span>Para</span><select id="para">' +
        '<option value="">Sem cliente</option>' +
        H.estado.leads.map(function (l) {
          return '<option value="' + l.id + '"' + (l.id === leadEscolhido ? " selected" : "") + ">" + H.esc(l.empresa || "Sem nome") + "</option>";
        }).join("") +
        "</select></label></div>" +

        '<div class="secao" style="margin-top:8px"><h2>Diagnóstica</h2><div class="ladrilhos grandes">' +
        diag.map(function (a) {
          return '<a class="ladrilho" target="_blank" rel="noopener" href="' + link(a) + '">' + H.icone(a.icone) +
            "<strong>" + H.esc(a.titulo) + "</strong><span>" + H.esc(a.resumo) + "</span></a>";
        }).join("") +
        '</div><p><button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(msgPortfolio) + '">Copiar mensagem do portfólio</button></p></div>' +

        '<div class="secao"><h2>Propostas</h2><div class="ladrilhos">' +
        propostas.map(function (a) {
          var sugerido = servicosDoLead.indexOf(a.servico) !== -1;
          return '<a class="ladrilho" target="_blank" rel="noopener" href="' + link(a) + '"' +
            (sugerido ? ' style="border-color:var(--vinho)"' : "") + '><span class="sigla">' + H.esc(a.sigla) + "</span>" +
            "<strong>" + H.esc(a.titulo) + "</strong>" + (sugerido ? "<span>Serviço deste cliente</span>" : "") + "</a>";
        }).join("") +
        "</div></div>";

      el.querySelector("#para").addEventListener("change", function (ev) {
        leadEscolhido = ev.target.value;
        H.rerender();
      });
    },
  };
})(window.HUB);
