/* Playbook de cold call: roteiro top-down, ganchos por serviço, objeções e cadência de tentativas.
   Ao marcar a diagnóstica, cria o lead e abre o playbook da diagnóstica. */
(function (H) {
  var servicoGancho = "";

  H.telas["cold-call"] = {
    render: function (el) {
      var C = H.COLD_CALL;
      var ativos = H.servicosAtivos();
      if (!servicoGancho) servicoGancho = ativos[0].id;
      var s = H.servico(servicoGancho);
      var vars = H.variaveis(null);
      vars.dor1 = s.dores[0].toLowerCase();
      vars.dor2 = s.dores[1].toLowerCase();
      vars.tema = s.nome.toLowerCase();
      vars.gancho = s.gancho;

      el.innerHTML =
        H.subnavPlaybooks("cold-call") +
        "<h1>Cold call</h1>" +
        '<p class="sub">Ligação direta para o decisor, a partir da lista da Casa de Dados. O objetivo é um só: ' +
        "marcar a reunião diagnóstica. Não faça a diagnóstica por telefone.</p>" +

        '<div class="tres-colunas" style="grid-template-columns:minmax(0,1fr) 340px">' +
        "<div>" +
        '<div class="cartao"><h2>Antes de ligar</h2><ul>' +
        C.antes.map(function (a) { return "<li>" + H.esc(a) + "</li>"; }).join("") +
        "<li>" + H.preencherHTML(C.meta, vars) + H.seloValidar() + "</li></ul></div>" +

        '<div class="cartao"><h2>Gancho por serviço</h2>' +
        '<p class="muted pequeno">Escolha o serviço da hipótese de dor da Casa de Dados. O roteiro abaixo se ajusta.</p>' +
        '<div class="chips">' +
        ativos.map(function (x) {
          return '<button type="button" class="chip' + (x.id === servicoGancho ? " ativo" : "") + '" data-gancho="' + x.id + '">' + H.esc(x.nome) + "</button>";
        }).join("") +
        "</div>" +
        '<div class="fala">' + H.esc(s.gancho) + "</div>" +
        '<p class="pequeno"><strong>Dores comuns:</strong> ' + H.esc(s.dores.join(" · ")) + "</p></div>" +

        '<div class="cartao"><h2>Roteiro</h2>' +
        C.roteiro.map(function (r) {
          return "<h3 style=\"margin-top:14px\">" + H.esc(r.titulo) + "</h3>" +
            '<div class="fala">' + H.preencherHTML(r.fala, vars) + "</div>" +
            (r.dica ? '<p class="dica">' + H.esc(r.dica) + "</p>" : "");
        }).join("") +
        "</div>" +

        '<div class="cartao"><h2>Se cair na recepção</h2><ul>' +
        C.gatekeeper.map(function (g) { return "<li>" + H.preencherHTML(g, vars) + "</li>"; }).join("") +
        "</ul></div>" +

        '<div class="cartao"><h2>Não atendeu: tentativas</h2>' +
        '<p class="muted pequeno">Seis toques em 10 dias úteis. Depois disso, o lead volta para a Casa de Dados com o motivo.</p>' +
        '<table class="tabela"><thead><tr><th>Dia útil</th><th>Canal</th><th>O que fazer</th></tr></thead><tbody>' +
        C.tentativas.map(function (t) {
          var texto = H.preencher(t.texto, vars);
          var longo = t.texto.length > 40;
          return "<tr><td>D+" + t.dia + "</td><td>" + H.esc(t.canal) + "</td><td>" +
            (longo ? '<div class="fala mensagem" style="margin:0">' + H.preencherHTML(t.texto, vars) +
              '<div class="copiar"><button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(texto) + '">Copiar</button></div></div>'
              : H.esc(t.texto)) +
            "</td></tr>";
        }).join("") +
        "</tbody></table>" +
        '<p class="dica">' + H.esc(C.privacidade) + "</p></div>" +
        "</div>" +

        '<aside class="lateral coluna-fixa">' +
        '<div class="cartao"><h3>Marcou a diagnóstica?</h3>' +
        '<form id="form-agendar" class="campos" style="grid-template-columns:1fr">' +
        '<div class="campo"><label for="cc-empresa">Empresa</label><input id="cc-empresa" required></div>' +
        '<div class="campo"><label for="cc-contato">Decisor</label><input id="cc-contato" required></div>' +
        '<div class="campo"><label for="cc-telefone">Telefone ou WhatsApp</label><input id="cc-telefone" type="tel"></div>' +
        '<div class="campo"><label for="cc-servico">Serviço provável</label><select id="cc-servico">' +
        ativos.map(function (x) { return '<option value="' + x.id + '"' + (x.id === servicoGancho ? " selected" : "") + ">" + H.esc(x.nome) + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="campo"><label for="cc-data">Data da diagnóstica</label><input id="cc-data" type="date"></div>' +
        '<button type="submit">Criar lead e abrir a diagnóstica</button></form></div>' +
        '<h3 style="margin-top:20px">Objeções na ligação</h3><div id="guia-cc"></div>' +
        "</aside></div>";

      H.montarGuiaObjecoes(el.querySelector("#guia-cc"), { etapa: "cold-call", vars: vars });

      el.addEventListener("click", function (ev) {
        var b = ev.target.closest("[data-gancho]");
        if (b) {
          servicoGancho = b.getAttribute("data-gancho");
          H.rerender();
        }
      });

      el.querySelector("#form-agendar").addEventListener("submit", function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var lead = H.novoLead({
          empresa: f.querySelector("#cc-empresa").value.trim(),
          contato: f.querySelector("#cc-contato").value.trim(),
          telefone: f.querySelector("#cc-telefone").value.trim(),
          origem: "Cold call (Casa de Dados)",
          servicos: [f.querySelector("#cc-servico").value],
          diag: { respostas: {}, data: f.querySelector("#cc-data").value },
        });
        H.ir("#/playbooks/diagnostica/" + lead.id);
      });
    },
  };
})(window.HUB);
