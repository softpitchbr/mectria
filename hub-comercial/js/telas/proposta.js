/* Playbook da apresentação de proposta em modo reunião: um passo por vez, na sequência fixa,
   com o micro pacto do passo em destaque. O coletado na diag e as objeções abrem no painel. */
(function (H) {
  var BASE = "#/playbooks/proposta/";
  var CURTOS = {
    abertura: "Abertura",
    proposito: "Propósito",
    numeros: "Números",
    time: "Time",
    "ceu-inferno": "Céu e inferno",
    metodo: "Método",
    "pacto-duvida": "Dúvidas",
    "pacto-cliente": "Sem o preço",
    "valor-preco": "Valor × preço",
    provas: "Provas",
    investimento: "Investimento",
    fechamento: "Fechamento",
  };

  function garantirProposta(lead) {
    if (!lead.proposta) {
      lead.proposta = { servico: (lead.servicos || [])[0] || "", pactos: {}, objecoes: {}, antes: {}, usouNovaApresentacao: true };
    }
    lead.proposta.pactos = lead.proposta.pactos || {};
    lead.proposta.objecoes = lead.proposta.objecoes || {};
    return lead.proposta;
  }

  function novaSemDiag() {
    H.gaveta("Proposta sem diagnóstica", function (corpo) {
      corpo.innerHTML =
        '<form style="display:grid;gap:14px">' +
        H.rotulado("Empresa", '<input name="empresa" required>') +
        H.rotulado("Contato", '<input name="contato">') +
        H.rotulado("Serviço", "<select name=\"servico\">" + H.servicosAtivos().map(function (s) {
          return '<option value="' + s.id + '">' + H.esc(s.nome) + "</option>";
        }).join("") + "</select>") +
        '<button type="submit">Começar</button></form>';
      corpo.querySelector("form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var lead = H.novoLead({ empresa: f.empresa.value.trim(), contato: f.contato.value.trim(), servicos: [f.servico.value] });
        H.fecharGaveta();
        H.ir(BASE + lead.id + "/0");
      });
    });
  }

  /* ---------- lista ---------- */

  function lista(el) {
    var leads = H.estado.leads.slice().sort(function (a, b) {
      return ((b.diag && b.diag.dataProposta) || "").localeCompare((a.diag && a.diag.dataProposta) || "");
    });
    el.innerHTML =
      '<div class="estreita"><a class="voltar" href="#/playbooks">' + H.icone("voltar") + "Playbooks</a>" +
      '<div class="cabeca" style="margin-top:8px"><h1>Apresentação de proposta</h1>' +
      '<button type="button" class="botao-sec" id="nova">' + H.icone("mais") + "Sem diagnóstica</button></div>" +
      (leads.length
        ? '<div class="linhas">' + leads.map(function (l) {
            var quando = (l.proposta && l.proposta.data) || (l.diag && l.diag.dataProposta);
            var meta = [H.siglas(l), quando ? H.data(quando) : ""].filter(Boolean).join(" · ");
            return '<a class="linha" href="' + BASE + l.id + '/0"><div class="linha-texto"><strong>' + H.esc(l.empresa || "Sem nome") +
              "</strong><small>" + H.esc(meta) + "</small></div>" + H.seloStatus(l) + H.icone("avancar") + "</a>";
          }).join("") + "</div>"
        : '<p class="vazio">A proposta começa na diagnóstica.</p>') +
      "</div>";
    el.querySelector("#nova").addEventListener("click", novaSemDiag);
  }

  /* ---------- passos ---------- */

  function passos(lead, atual) {
    var P = H.PROPOSTA;
    var prop = lead.proposta;
    var antes = prop.antes || {};
    var lista = [{ id: "antes", titulo: "Antes", feito: P.antes.every(function (x, i) { return antes[i]; }) }];
    P.passos.forEach(function (p, i) {
      lista.push({ id: p.id, titulo: CURTOS[p.id] || p.titulo, passo: p, feito: p.pacto ? !!prop.pactos[p.pacto] : i + 1 < atual });
    });
    lista.push({ id: "resultado", titulo: "Resultado", feito: !!prop.resultado });
    return lista;
  }

  function extras(passo, s) {
    if (!s) return "";
    function ul(itens) { return '<ul class="lista-simples">' + itens.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") + "</ul>"; }
    if (passo.id === "ceu-inferno") {
      return '<details class="mais"><summary>Sugestões do serviço</summary><div class="duas-colunas">' +
        '<div><p class="rotulo-pequeno">Hoje</p>' + ul(s.ceuInferno.antes) + "</div>" +
        '<div><p class="rotulo-pequeno">Com o projeto</p>' + ul(s.ceuInferno.depois) + "</div></div></details>";
    }
    if (passo.id === "metodo") return '<ol class="lista-simples">' + s.metodo.map(function (m) { return "<li>" + H.esc(m) + "</li>"; }).join("") + "</ol>";
    if (passo.id === "investimento") return '<details class="mais"><summary>Regras de condição</summary>' + ul(H.PROPOSTA.regrasCondicao) + "</details>";
    return "";
  }

  function corpoPasso(lead, item, s, vars) {
    var P = H.PROPOSTA;
    var prop = lead.proposta;
    if (item.id === "antes") {
      return '<div class="etapa-titulo"><h2>Antes da reunião</h2></div><p class="etapa-intro">Confira antes de entrar.</p>' +
        P.antes.map(function (t, i) {
          return '<label class="check">' + H.campo(lead, "proposta.antes." + i, "checkbox") + "<span>" + H.esc(t) + "</span></label>";
        }).join("");
    }
    if (item.id === "resultado") {
      return '<div class="etapa-titulo"><h2>Como terminou?</h2></div><p class="etapa-intro">Registre para a proposta entrar no follow-up.</p>' +
        '<div class="opcoes" style="margin-bottom:20px">' +
        P.resultados.map(function (r) {
          return '<label><input type="radio" name="resultado" value="' + r.id + '" data-bind="proposta.resultado"' +
            (prop.resultado === r.id ? " checked" : "") + ">" + H.esc(r.rotulo) + "</label>";
        }).join("") + "</div>" +
        '<div class="campos">' +
        H.rotulado("Valor da proposta (R$)", H.campo(lead, "proposta.valor", "text", ' inputmode="decimal" placeholder="Ex.: 4.500,00"')) +
        H.rotulado("Data da apresentação", H.campo(lead, "proposta.data", "date")) +
        H.rotulado("Decisão combinada para", H.campo(lead, "proposta.dataDecisao", "date")) +
        H.rotulado("Se perdeu, por quê?", H.select(lead, "proposta.motivoPerda", H.FUP.motivosPerda)) +
        "</div>" +
        '<label class="check" style="margin-top:8px">' + H.campo(lead, "proposta.usouNovaApresentacao", "checkbox") + "<span>Usei a nova apresentação e o roteiro</span></label>" +
        '<details class="mais"><summary>Notas</summary>' + H.campo(lead, "proposta.notas", "textarea", ' rows="3" aria-label="Notas"') + "</details>";
    }
    var p = item.passo;
    var pacto = p.pacto && P.pactos.find(function (x) { return x.id === p.pacto; });
    return '<div data-com-dica><div class="etapa-titulo"><h2 style="flex:1">' + H.esc(p.titulo) + "</h2>" + (p.dica ? H.botaoInfo() : "") + "</div>" +
      '<p class="etapa-intro">' + H.esc(p.tempo) + " · " + H.esc(p.objetivo) +
      (p.validar ? ' <span class="selo selo-validar" title="Depende da MecTRIA">validar</span>' : "") + "</p>" +
      H.textoDica(p.dica) + "</div>" +
      '<div class="fala">' + H.preencherHTML(p.fala, vars) + "</div>" +
      extras(p, s) +
      (pacto ? H.botaoPacto(lead, "proposta.pactos." + pacto.id, pacto.texto) : "");
  }

  function editor(el, lead, passoParam) {
    var P = H.PROPOSTA;
    var prop = garantirProposta(lead);
    var atual = parseInt(passoParam, 10) || 0;
    var lista = passos(lead, atual);
    atual = Math.max(0, Math.min(lista.length - 1, atual));
    var item = lista[atual];
    var s = prop.servico && H.servico(prop.servico);
    var vars = H.variaveis(lead, prop.servico);
    var hashBase = BASE + lead.id + "/";
    var apresentacao = prop.servico && H.apresentacaoDoServico(prop.servico);
    var feitos = P.pactos.filter(function (x) { return prop.pactos[x.id]; }).length;

    el.innerHTML =
      '<div class="reuniao-topo"><div class="reuniao-linha">' +
      '<a class="botao-icone" href="#/playbooks/proposta" aria-label="Voltar">' + H.icone("voltar") + "</a>" +
      "<h1>" + H.esc(lead.empresa || "Sem nome") + "</h1>" +
      '<div class="acoes">' +
      '<span class="contador-pactos" id="contador-pactos" title="Micro pactos">' + feitos + "/" + P.pactos.length + " pactos</span>" +
      H.select(lead, "proposta.servico", H.servicosAtivos().map(function (x) { return { valor: x.id, rotulo: x.sigla + " · " + x.nome }; }), "Serviço",
        ' aria-label="Serviço apresentado" style="width:auto;padding:6px 10px;font-size:13px"') +
      (apresentacao
        ? '<a class="botao botao-pequeno" target="_blank" rel="noopener" href="' + apresentacao.arquivo + "?lead=" + encodeURIComponent(lead.id) + '">' + H.icone("play") + "Apresentar</a>"
        : "") +
      '<button type="button" class="botao-icone" id="abrir-resumo" aria-label="Coletado na diagnóstica" title="Coletado na diagnóstica">' + H.icone("lista") + "</button>" +
      '<button type="button" class="botao-icone" id="abrir-objecoes" aria-label="Objeções" title="Objeções">' + H.icone("escudo") + "</button>" +
      "</div></div>" + H.barraPassos(lista, atual, hashBase) + "</div>" +
      '<div class="estreita">' + corpoPasso(lead, item, s, vars) +
      H.navegacaoPassos(atual, lista.length, hashBase, '<button type="button" id="salvar-resultado">Salvar e ir para o follow-up' + H.icone("avancar") + "</button>") +
      "</div>";

    var chip = el.querySelector(".passo-chip.atual");
    if (chip) chip.scrollIntoView({ block: "nearest", inline: "center" });

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "proposta.servico") {
        H.salvar();
        H.rerender();
      }
    });
    document.addEventListener("pacto-mudou", function aoMudar() {
      if (!document.body.contains(el)) return document.removeEventListener("pacto-mudou", aoMudar);
      var n = P.pactos.filter(function (x) { return prop.pactos[x.id]; }).length;
      el.querySelector("#contador-pactos").textContent = n + "/" + P.pactos.length + " pactos";
      passos(lead, atual).forEach(function (e, i) {
        var c = el.querySelector('[data-passo-chip="' + i + '"]');
        if (c) c.classList.toggle("feito", !!e.feito);
      });
    });

    el.querySelector("#abrir-resumo").addEventListener("click", function () { H.abrirResumo(lead, prop.servico); });
    el.querySelector("#abrir-objecoes").addEventListener("click", function () {
      H.abrirObjecoes({ etapa: "proposta", vars: vars, lead: lead });
    });

    var salvar = el.querySelector("#salvar-resultado");
    if (salvar) {
      salvar.addEventListener("click", function () {
        if (!prop.resultado) {
          H.aviso("Escolha como a reunião terminou.");
          return;
        }
        prop.data = prop.data || H.hoje();
        prop.valor = prop.valor ? H.paraNumero(prop.valor) : prop.valor;
        var fup = lead.fup || { toques: {} };
        fup.inicio = fup.inicio || prop.data;
        fup.toques = fup.toques || {};
        if (prop.resultado === "ganho") {
          fup.status = "ganho";
          fup.dataFechamento = fup.dataFechamento || prop.data;
          fup.valorFechado = fup.valorFechado || prop.valor;
        } else if (prop.resultado === "perdido") {
          fup.status = "perdido";
          fup.motivoPerda = prop.motivoPerda || fup.motivoPerda || "";
        } else {
          fup.status = "ativo";
        }
        lead.fup = fup;
        H.tocar(lead);
        H.salvar();
        H.ir("#/fup/" + lead.id);
      });
    }
  }

  H.telas.proposta = {
    render: function (el, id, passo) {
      var lead = id && H.lead(id);
      if (!lead) lista(el);
      else editor(el, lead, passo);
    },
  };
})(window.HUB);
