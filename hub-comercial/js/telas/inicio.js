/* Início: só o que o vendedor precisa fazer hoje e os atalhos para começar. */
(function (H) {
  function pendencias() {
    var hoje = H.hoje();
    var amanha = H.somarDiasUteis(hoje, 1);
    var itens = [];
    H.estado.leads.forEach(function (l) {
      var t = H.proximoToque(l);
      if (t && t.data <= hoje) {
        var sit = H.situacaoToque(t);
        itens.push({
          ordem: t.data,
          titulo: l.empresa || "Sem nome",
          sub: "Follow-up · " + t.toque.canal + " · " + t.toque.objetivo,
          selo: '<span class="selo selo-' + sit.id + '">' + sit.rotulo + "</span>",
          href: "#/fup/" + l.id,
        });
      }
      var d = l.diag || {};
      if (d.dataProposta && !(l.proposta && l.proposta.data) && d.dataProposta >= hoje && d.dataProposta <= amanha) {
        itens.push({
          ordem: d.dataProposta,
          titulo: l.empresa || "Sem nome",
          sub: "Apresentação de proposta · " + (d.dataProposta === hoje ? "hoje" : "amanhã") + (d.horaProposta ? " às " + d.horaProposta : ""),
          selo: "",
          href: "#/playbooks/proposta/" + l.id,
        });
      }
      if (d.data === hoje && !d.dataProposta) {
        itens.push({
          ordem: hoje,
          titulo: l.empresa || "Sem nome",
          sub: "Reunião diagnóstica · hoje",
          selo: "",
          href: "#/playbooks/diagnostica/" + l.id,
        });
      }
    });
    return itens.sort(function (a, b) { return a.ordem.localeCompare(b.ordem); });
  }

  H.telas.inicio = {
    render: function (el) {
      var nome = (H.estado.vendedor || "").split(" ")[0];
      var lista = pendencias();
      var data = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

      el.innerHTML =
        '<div class="estreita">' +
        "<h1>" + (nome ? "Olá, " + H.esc(nome) : "Olá") + "</h1>" +
        '<p class="sub">' + H.esc(data.charAt(0).toUpperCase() + data.slice(1)) + "</p>" +
        (nome ? "" :
          '<div class="secao">' + H.rotulado("Como você se chama? (vai nas mensagens)", '<input id="nome-vendedor" type="text" autocomplete="name">') + "</div>") +

        '<div class="secao"><h2>Para hoje</h2>' +
        (lista.length
          ? '<div class="linhas">' + lista.map(function (i) {
              return '<a class="linha" href="' + i.href + '"><div class="linha-texto"><strong>' + H.esc(i.titulo) + "</strong><small>" +
                H.esc(i.sub) + "</small></div>" + i.selo + H.icone("avancar") + "</a>";
            }).join("") + "</div>"
          : '<p class="vazio">Nada pendente hoje.</p>') +
        "</div>" +

        '<div class="secao"><h2>Começar</h2><div class="ladrilhos">' +
        '<button type="button" class="ladrilho" id="nova-diag">' + H.icone("conversa") + "<strong>Nova diagnóstica</strong><span>Perguntas e briefing</span></button>" +
        '<a class="ladrilho" href="#/apresentacoes">' + H.icone("slides") + "<strong>Apresentações</strong><span>Diagnóstica e propostas</span></a>" +
        '<a class="ladrilho" href="#/fup">' + H.icone("seta") + "<strong>Follow-up</strong><span>Propostas na rua</span></a>" +
        "</div></div></div>";

      el.querySelector("#nova-diag").addEventListener("click", H.novaDiagnostica);
      var campoNome = el.querySelector("#nome-vendedor");
      if (campoNome) {
        campoNome.addEventListener("change", function () {
          H.estado.vendedor = campoNome.value.trim();
          H.salvar();
          H.rerender();
        });
      }
    },
  };
})(window.HUB);
