/* Navegação do hub (rotas por hash), campos ligados ao lead e menu de dados.
   Rotas: #/inicio · #/apresentacoes · #/playbooks/cold-call · #/playbooks/diagnostica[/id]
          #/playbooks/proposta[/id] · #/fup[/id] */
(function (H) {
  H.telas = H.telas || {};
  var conteudo = document.getElementById("conteudo");

  /* ---------- campos ligados ao lead ---------- */

  H.obter = function (obj, caminho) {
    return String(caminho)
      .split(".")
      .reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  };

  H.definir = function (obj, caminho, valor) {
    var partes = String(caminho).split(".");
    var alvo = obj;
    for (var i = 0; i < partes.length - 1; i++) {
      if (alvo[partes[i]] == null || typeof alvo[partes[i]] !== "object") alvo[partes[i]] = {};
      alvo = alvo[partes[i]];
    }
    alvo[partes[partes.length - 1]] = valor;
  };

  var timerSalvar = null;
  H.salvarDepois = function () {
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(function () {
      timerSalvar = null;
      H.salvar();
    }, 300);
  };
  // só grava ao sair se houver edição pendente (não sobrescreve o que outra aba salvou)
  window.addEventListener("pagehide", function () {
    if (timerSalvar) {
      clearTimeout(timerSalvar);
      timerSalvar = null;
      H.salvar();
    }
  });

  /* Liga os elementos com data-bind="caminho.no.lead" ao lead. */
  H.ligarCampos = function (raiz, lead, aoMudar) {
    function aoEditar(ev) {
      var el = ev.target;
      var caminho = el.getAttribute && el.getAttribute("data-bind");
      if (!caminho) return;
      var valor = el.type === "checkbox" ? el.checked : el.value;
      if (el.type === "radio" && !el.checked) return;
      H.definir(lead, caminho, valor);
      H.tocar(lead);
      H.salvarDepois();
      if (aoMudar) aoMudar(caminho, valor, el);
    }
    raiz.addEventListener("input", aoEditar);
    raiz.addEventListener("change", aoEditar);
  };

  /* Atributos de um campo ligado: valor atual já preenchido. */
  H.campo = function (lead, caminho, tipo, extras) {
    var valor = H.obter(lead, caminho);
    var attrs = ' data-bind="' + H.esc(caminho) + '"' + (extras || "");
    if (tipo === "textarea") return "<textarea" + attrs + ' rows="2">' + H.esc(valor || "") + "</textarea>";
    if (tipo === "checkbox") return '<input type="checkbox"' + attrs + (valor ? " checked" : "") + ">";
    return '<input type="' + tipo + '"' + attrs + ' value="' + H.esc(valor == null ? "" : valor) + '">';
  };

  H.select = function (lead, caminho, opcoes, vazio) {
    var valor = H.obter(lead, caminho) || "";
    return (
      '<select data-bind="' + H.esc(caminho) + '">' +
      '<option value="">' + H.esc(vazio || "Escolha") + "</option>" +
      opcoes
        .map(function (o) {
          var v = typeof o === "string" ? o : o.valor;
          var r = typeof o === "string" ? o : o.rotulo;
          return '<option value="' + H.esc(v) + '"' + (v === valor ? " selected" : "") + ">" + H.esc(r) + "</option>";
        })
        .join("") +
      "</select>"
    );
  };

  H.opcoesServicos = function () {
    return H.servicosAtivos().map(function (s) { return { valor: s.id, rotulo: s.nome }; });
  };

  H.subnavPlaybooks = function (ativo) {
    var itens = [
      ["cold-call", "Cold call"],
      ["diagnostica", "Reunião diagnóstica"],
      ["proposta", "Apresentação de proposta"],
    ];
    return (
      '<nav class="subnav" aria-label="Playbooks">' +
      itens
        .map(function (i) {
          return '<a href="#/playbooks/' + i[0] + '"' + (i[0] === ativo ? ' class="ativa"' : "") + ">" + i[1] + "</a>";
        })
        .join("") +
      "</nav>"
    );
  };

  H.seloValidar = function (texto) {
    return ' <span class="selo selo-validar" title="Depende de informação da MecTRIA">validar' +
      (texto ? " · " + H.esc(texto) : "") + "</span>";
  };

  H.seloStatus = function (lead) {
    var s = H.statusLead(lead);
    return '<span class="selo selo-' + s.id + '">' + H.esc(s.rotulo) + "</span>";
  };

  /* ---------- rotas ---------- */

  function partes() {
    return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  }

  function render(manterRolagem) {
    var p = partes();
    var aba = p[0] || "inicio";
    var tela;
    var param;
    if (aba === "playbooks") {
      tela = H.telas[p[1] || "diagnostica"];
      param = p[2];
    } else {
      tela = H.telas[aba];
      param = p[1];
    }
    if (!tela) {
      aba = "inicio";
      tela = H.telas.inicio;
    }
    document.querySelectorAll(".abas a").forEach(function (a) {
      a.classList.toggle("ativa", a.getAttribute("data-aba") === aba);
    });
    var y = window.scrollY;
    // troca o nó para descartar os ouvintes da tela anterior
    var novo = conteudo.cloneNode(false);
    conteudo.parentNode.replaceChild(novo, conteudo);
    conteudo = novo;
    tela.render(conteudo, param ? decodeURIComponent(param) : undefined);
    window.scrollTo(0, manterRolagem ? y : 0);
    atualizarContadorFup();
  }

  H.rerender = function () {
    render(true);
  };

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
    var el = document.getElementById("contador-fup");
    if (el) el.textContent = n ? String(n) : "";
  }

  window.addEventListener("hashchange", function () { render(false); });

  // a apresentação aberta em outra aba marca pactos no mesmo lead
  window.addEventListener("storage", function (ev) {
    if (ev.key && ev.key.indexOf("hub-mectria") === 0) {
      H.recarregar();
      var ativo = document.activeElement;
      var editando = ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName);
      if (!editando) H.rerender();
    }
  });

  /* ---------- topo: vendedor e dados ---------- */

  var campoVendedor = document.getElementById("vendedor");
  campoVendedor.value = H.estado.vendedor || "";
  campoVendedor.addEventListener("input", function () {
    H.estado.vendedor = campoVendedor.value.trim();
    H.salvarDepois();
  });

  document.getElementById("exportar-json").addEventListener("click", H.exportarJSON);
  document.getElementById("exportar-csv").addEventListener("click", H.exportarCSV);
  var arquivo = document.getElementById("arquivo-importar");
  document.getElementById("importar-json").addEventListener("click", function () { arquivo.click(); });
  arquivo.addEventListener("change", function () {
    var f = arquivo.files[0];
    if (!f) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        var r = H.importarJSON(String(leitor.result));
        H.aviso(r.novos + " leads novos, " + r.atualizados + " atualizados");
        H.rerender();
      } catch (e) {
        H.aviso("Arquivo inválido: " + e.message);
      }
      arquivo.value = "";
    };
    leitor.readAsText(f);
  });

  render(false);
})(window.HUB);
