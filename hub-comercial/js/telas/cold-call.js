/* Playbook de cold call: escolha o gancho e siga o roteiro. O resto fica recolhido. */
(function (H) {
  var gancho = "";

  function novoLeadDaLigacao() {
    var ativos = H.servicosAtivos();
    H.gaveta("Diagnóstica marcada", function (corpo) {
      corpo.innerHTML =
        '<form style="display:grid;gap:14px">' +
        H.rotulado("Empresa", '<input name="empresa" required>') +
        H.rotulado("Decisor", '<input name="contato" required>') +
        H.rotulado("Telefone ou WhatsApp", '<input name="telefone" type="tel">') +
        H.rotulado("Serviço provável", "<select name=\"servico\">" + ativos.map(function (s) {
          return '<option value="' + s.id + '"' + (s.id === gancho ? " selected" : "") + ">" + H.esc(s.nome) + "</option>";
        }).join("") + "</select>") +
        H.rotulado("Data da diagnóstica", '<input name="data" type="date">') +
        '<button type="submit">Criar lead</button></form>';
      corpo.querySelector("form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var lead = H.novoLead({
          empresa: f.empresa.value.trim(),
          contato: f.contato.value.trim(),
          telefone: f.telefone.value.trim(),
          origem: "Cold call (Casa de Dados)",
          servicos: [f.servico.value],
          diag: { respostas: {}, data: f.data.value },
        });
        H.fecharGaveta();
        H.ir("#/playbooks/diagnostica/" + lead.id + "/0");
      });
    });
  }

  H.telas["cold-call"] = {
    render: function (el) {
      var C = H.COLD_CALL;
      var ativos = H.servicosAtivos();
      if (!gancho) gancho = ativos[0].id;
      var s = H.servico(gancho);
      var vars = H.variaveis(null);
      vars.dor1 = s.dores[0].toLowerCase();
      vars.dor2 = s.dores[1].toLowerCase();
      vars.tema = s.nome.toLowerCase();
      vars.gancho = s.gancho;

      el.innerHTML =
        '<div class="estreita"><a class="voltar" href="#/playbooks">' + H.icone("voltar") + "Playbooks</a>" +
        '<div class="cabeca" style="margin-top:8px"><div><h1>Cold call</h1><p class="sub">Um objetivo só: marcar a diagnóstica com quem decide.</p></div>' +
        '<div class="acoes"><button type="button" class="botao-sec" id="objecoes">' + H.icone("escudo") + "Objeções</button>" +
        '<button type="button" id="marcou">' + H.icone("mais") + "Marcou</button></div></div>" +

        '<p class="rotulo-pequeno">Gancho</p><div class="chips">' +
        ativos.map(function (x) {
          return '<button type="button" class="chip' + (x.id === gancho ? " ativo" : "") + '" data-gancho="' + x.id + '">' + H.esc(x.nome) + "</button>";
        }).join("") + "</div>" +

        '<div class="secao">' +
        C.roteiro.map(function (r) {
          return '<div data-com-dica style="margin-bottom:22px"><div class="pergunta-texto"><span style="flex:1">' + H.esc(r.titulo) + "</span>" +
            (r.dica ? H.botaoInfo() : "") + "</div>" + H.textoDica(r.dica) + '<div class="fala">' + H.preencherHTML(r.fala, vars) + "</div></div>";
        }).join("") +
        "</div>" +

        '<details class="mais"><summary>Caiu na recepção</summary><ul class="lista-simples">' +
        C.gatekeeper.map(function (g) { return "<li>" + H.preencherHTML(g, vars) + "</li>"; }).join("") + "</ul></details>" +

        '<details class="mais"><summary>Não atendeu: próximas tentativas</summary><div class="linhas" style="margin-bottom:12px">' +
        C.tentativas.map(function (t) {
          var texto = H.preencher(t.texto, vars);
          var longo = t.texto.length > 40;
          return '<div class="linha"><div class="linha-texto"><strong>D+' + t.dia + " · " + H.esc(t.canal) + "</strong>" +
            (longo ? "<small>" + H.esc(texto) + "</small>" : "<small>" + H.esc(t.texto) + "</small>") + "</div>" +
            (longo ? '<button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(texto) + '">Copiar</button>' : "") + "</div>";
        }).join("") + "</div></details>" +

        '<details class="mais"><summary>Antes de ligar</summary><ul class="lista-simples">' +
        C.antes.map(function (a) { return "<li>" + H.esc(a) + "</li>"; }).join("") +
        "<li>" + H.preencherHTML(C.meta, vars) + "</li><li>" + H.esc(C.privacidade) + "</li></ul></details>" +
        "</div>";

      el.addEventListener("click", function (ev) {
        var b = ev.target.closest("[data-gancho]");
        if (b) {
          gancho = b.getAttribute("data-gancho");
          H.rerender();
        }
      });
      el.querySelector("#objecoes").addEventListener("click", function () {
        H.abrirObjecoes({ etapa: "cold-call", vars: vars });
      });
      el.querySelector("#marcou").addEventListener("click", novoLeadDaLigacao);
    },
  };
})(window.HUB);
