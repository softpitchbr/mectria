/* Navegação do hub (rotas por hash) e ajustes.
   Rotas: #/inicio · #/apresentacoes · #/playbooks · #/playbooks/processo · #/playbooks/cold-call
          #/playbooks/diagnostica[/id[/passo]] · #/playbooks/proposta[/id[/passo]] · #/fup[/id] */
(function (H) {
  var conteudo = document.getElementById("conteudo");

  var ABAS = [
    ["inicio", "Início", "casa"],
    ["apresentacoes", "Apresentações", "slides"],
    ["playbooks", "Playbooks", "livro"],
    ["fup", "Follow-up", "seta"],
  ];

  document.querySelectorAll("[data-nav]").forEach(function (nav) {
    nav.innerHTML = ABAS.map(function (a) {
      return '<a href="#/' + a[0] + '" data-aba="' + a[0] + '">' + H.icone(a[2]) + "<span>" + a[1] + "</span>" +
        (a[0] === "fup" ? '<span class="contador" data-contador-fup></span>' : "") + "</a>";
    }).join("");
  });
  // no topo do computador, só o texto
  document.querySelectorAll(".nav-principal .icone").forEach(function (i) { i.remove(); });

  /* ---------- rotas ---------- */

  function partes() {
    return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  }

  function render(manterRolagem) {
    var p = partes();
    var aba = p[0] || "inicio";
    var tela;
    var a;
    var b;
    if (aba === "playbooks") {
      tela = p[1] ? H.telas[p[1]] : H.telas.playbooks;
      a = p[2];
      b = p[3];
    } else {
      tela = H.telas[aba];
      a = p[1];
    }
    if (!tela) {
      aba = "inicio";
      tela = H.telas.inicio;
    }
    document.querySelectorAll("[data-aba]").forEach(function (el) {
      el.classList.toggle("ativa", el.getAttribute("data-aba") === aba);
    });
    H.fecharGaveta();
    var y = window.scrollY;
    // troca o nó para descartar os ouvintes da tela anterior
    var novo = conteudo.cloneNode(false);
    conteudo.parentNode.replaceChild(novo, conteudo);
    conteudo = novo;
    tela.render(conteudo, a, b);
    window.scrollTo(0, manterRolagem ? y : 0);
    atualizarContadorFup();
  }

  H.rerender = function () { render(true); };

  H.ir = function (hash) {
    if (location.hash === hash) render(false);
    else location.hash = hash;
  };

  function atualizarContadorFup() {
    var n = H.estado.leads.filter(function (l) {
      if (!l.fup || l.fup.status !== "ativo") return false;
      var t = H.proximoToque(l);
      return t && t.data <= H.hoje();
    }).length;
    document.querySelectorAll("[data-contador-fup]").forEach(function (el) {
      el.textContent = n ? String(n) : "";
    });
  }

  window.addEventListener("hashchange", function () { render(false); });

  // a apresentação aberta em outra aba marca pactos no mesmo lead
  window.addEventListener("storage", function (ev) {
    if (ev.key && ev.key.indexOf("hub-mectria") === 0) {
      H.recarregar();
      var ativo = document.activeElement;
      if (!(ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName))) H.rerender();
    }
  });

  /* ---------- ajustes: nome do vendedor e dados ---------- */

  var botaoAjustes = document.getElementById("abrir-ajustes");
  botaoAjustes.innerHTML = H.icone("ajustes");
  botaoAjustes.addEventListener("click", function () {
    H.gaveta("Ajustes", function (corpo) {
      corpo.innerHTML =
        H.rotulado("Seu nome (vai nas mensagens)", '<input id="ajuste-nome" type="text" autocomplete="name" value="' + H.esc(H.estado.vendedor) + '">') +
        '<div class="secao"><h2>Dados</h2><p class="pequeno muted">Ficam só neste navegador. Exporte o backup toda semana.</p>' +
        '<div style="display:grid;gap:8px">' +
        '<button type="button" class="botao-sec" data-acao="exportar">Exportar backup</button>' +
        '<button type="button" class="botao-sec" data-acao="importar">Importar backup</button>' +
        '<button type="button" class="botao-sec" data-acao="csv">Planilha das propostas (CSV)</button>' +
        '<input type="file" accept="application/json,.json" hidden></div></div>';
      corpo.querySelector("#ajuste-nome").addEventListener("input", function (ev) {
        H.estado.vendedor = ev.target.value.trim();
        H.salvarDepois();
      });
      var arquivo = corpo.querySelector("input[type=file]");
      corpo.addEventListener("click", function (ev) {
        var acao = ev.target.closest("[data-acao]");
        if (!acao) return;
        var a = acao.getAttribute("data-acao");
        if (a === "exportar") H.exportarJSON();
        if (a === "csv") H.exportarCSV();
        if (a === "importar") arquivo.click();
      });
      arquivo.addEventListener("change", function () {
        var f = arquivo.files[0];
        if (!f) return;
        var leitor = new FileReader();
        leitor.onload = function () {
          try {
            var r = H.importarJSON(String(leitor.result));
            H.aviso(r.novos + " leads novos, " + r.atualizados + " atualizados");
            H.fecharGaveta();
            H.rerender();
          } catch (e) {
            H.aviso("Arquivo inválido: " + e.message);
          }
        };
        leitor.readAsText(f);
      });
    });
  });

  render(false);
})(window.HUB);
