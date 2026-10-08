/* Playbook da apresentação de proposta: roteiro na sequência fixa, checklist de micro pactos,
   o que foi coletado na diagnóstica ao lado e o guia rápido de objeções. No fim, registra o
   resultado e manda a proposta para o follow-up. */
(function (H) {
  function garantirProposta(lead) {
    if (!lead.proposta) {
      lead.proposta = {
        servico: (lead.servicos || [])[0] || "",
        pactos: {},
        objecoes: {},
        antes: {},
        usouNovaApresentacao: true,
      };
    }
    lead.proposta.pactos = lead.proposta.pactos || {};
    lead.proposta.objecoes = lead.proposta.objecoes || {};
    return lead.proposta;
  }

  /* ---------- lista ---------- */

  function lista(el) {
    var leads = H.estado.leads.slice().sort(function (a, b) {
      return ((b.diag && b.diag.dataProposta) || "").localeCompare((a.diag && a.diag.dataProposta) || "");
    });
    el.innerHTML =
      H.subnavPlaybooks("proposta") +
      "<h1>Apresentação de proposta</h1>" +
      '<p class="sub">Sempre a mesma sequência, com os mesmos micro pactos, para a decisão sair na reunião ou no mesmo dia. ' +
      "Abra o lead para ver o roteiro com as dores dele, o checklist de pactos e o guia de objeções.</p>" +
      '<div class="grade-2" style="margin-bottom:28px">' +
      '<div class="painel-nevoa"><h2>A sequência</h2><ol class="pequeno" style="margin:0;padding-left:20px">' +
      H.PROPOSTA.passos.map(function (p) {
        return "<li>" + H.esc(p.titulo) + (p.pacto ? ' <span class="selo">pacto</span>' : "") + "</li>";
      }).join("") +
      "</ol></div>" +
      '<div class="cartao"><h2>Regras de condição</h2><ul class="pequeno">' +
      H.PROPOSTA.regrasCondicao.map(function (r) { return "<li>" + H.esc(r) + "</li>"; }).join("") +
      "</ul>" + H.seloValidar("item 27") + "</div></div>" +
      "<h2>Leads</h2>" +
      (leads.length
        ? '<div class="rolagem-x"><table class="tabela"><thead><tr><th>Empresa</th><th>Serviço</th><th>Apresentação</th><th>Situação</th></tr></thead><tbody>' +
          leads.map(function (l) {
            var sid = (l.proposta && l.proposta.servico) || (l.servicos || [])[0];
            var s = sid && H.servico(sid);
            var quando = (l.proposta && l.proposta.data) || (l.diag && l.diag.dataProposta);
            return '<tr class="clicavel" data-abrir="' + l.id + '"><td><a href="#/playbooks/proposta/' + l.id + '">' + H.esc(l.empresa || "Sem nome") +
              "</a></td><td>" + H.esc(s ? s.nome : "") + "</td><td>" + H.data(quando) + "</td><td>" + H.seloStatus(l) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>"
        : '<p class="vazio">Nenhum lead ainda. A proposta começa na diagnóstica.</p>');

    el.addEventListener("click", function (ev) {
      var tr = ev.target.closest("[data-abrir]");
      if (tr && !ev.target.closest("a")) H.ir("#/playbooks/proposta/" + tr.getAttribute("data-abrir"));
    });
  }

  /* ---------- roteiro ---------- */

  function extrasDoPasso(passo, s, lead) {
    if (!s) return "";
    var r = (lead.diag && lead.diag.respostas) || {};
    if (passo.id === "ceu-inferno") {
      return '<div class="entrega-foco"><div><h4>Hoje (inferno)</h4><ul>' +
        (r["c-dor"] ? "<li>" + H.esc(r["c-dor"]) + "</li>" : "") +
        (r["ci-negativa"] ? "<li>" + H.esc(r["ci-negativa"]) + "</li>" : "") +
        s.ceuInferno.antes.map(function (x) { return '<li class="muted">' + H.esc(x) + "</li>"; }).join("") +
        "</ul></div><div><h4>Com o projeto (céu)</h4><ul>" +
        (r["g-resultado"] ? "<li>" + H.esc(r["g-resultado"]) + "</li>" : "") +
        (r["ci-positiva"] ? "<li>" + H.esc(r["ci-positiva"]) + "</li>" : "") +
        s.ceuInferno.depois.map(function (x) { return '<li class="muted">' + H.esc(x) + "</li>"; }).join("") +
        '</ul></div></div><p class="dica">Em preto, o que o cliente disse. Em cinza, o padrão do serviço, para completar.</p>';
    }
    if (passo.id === "metodo") {
      return '<ol class="pequeno">' + s.metodo.map(function (m) { return "<li>" + H.esc(m) + "</li>"; }).join("") + "</ol>";
    }
    if (passo.id === "investimento") {
      return '<details class="pequeno"><summary>Regras de condição</summary><ul>' +
        H.PROPOSTA.regrasCondicao.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") +
        "</ul></details>";
    }
    return "";
  }

  function editor(el, lead) {
    var P = H.PROPOSTA;
    var prop = garantirProposta(lead);
    var opcoesServico = H.opcoesServicos();
    var s = prop.servico && H.servico(prop.servico);
    var vars = H.variaveis(lead, prop.servico);
    var linkApresentacao = "apresentacoes/proposta.html?servico=" + encodeURIComponent(prop.servico || "") + "&lead=" + encodeURIComponent(lead.id);

    el.innerHTML =
      H.subnavPlaybooks("proposta") +
      '<div class="cabecalho-tela"><div><a class="pequeno" href="#/playbooks/proposta">← Todas as propostas</a>' +
      "<h1>" + H.esc(lead.empresa || "Lead sem nome") + "</h1>" +
      '<p class="sub">Apresentação de proposta · ' + H.esc(P.duracao) + " · " + H.seloStatus(lead) +
      (lead.diag && lead.diag.dataProposta ? " · marcada para " + H.data(lead.diag.dataProposta) + (lead.diag.horaProposta ? " às " + H.esc(lead.diag.horaProposta) : "") : "") +
      "</p></div>" +
      '<div class="acoes"><label class="campo" style="min-width:240px"><span>Serviço apresentado</span>' + H.select(lead, "proposta.servico", opcoesServico) + "</label>" +
      '<a class="botao" target="_blank" rel="noopener" href="' + linkApresentacao + '"' + (prop.servico ? "" : ' aria-disabled="true"') + ">Abrir apresentação</a></div></div>" +

      '<div class="tres-colunas" style="grid-template-columns:280px minmax(0,1fr) 320px">' +
      '<aside class="lateral coluna-fixa"><h3>Coletado na diagnóstica</h3>' +
      (lead.diag && lead.diag.respostas && Object.keys(lead.diag.respostas).length
        ? H.resumoDiag(lead, prop.servico)
        : '<p class="muted pequeno">Sem diagnóstica registrada no hub.</p>') +
      '<p><a class="pequeno" href="#/playbooks/diagnostica/' + lead.id + '">Abrir a diagnóstica →</a></p></aside>' +

      "<div>" +
      '<div class="cartao" style="position:sticky;top:76px;z-index:5;padding:12px 16px;margin-bottom:16px">' +
      '<div class="acoes" style="justify-content:space-between"><span>Micro pactos: <span class="contador-pactos" id="contador-pactos"></span></span>' +
      '<span class="pequeno muted">Marque cada pacto na hora em que o cliente concordar.</span></div></div>' +

      '<div class="cartao"><h2>Antes da reunião</h2>' +
      P.antes.map(function (t, i) {
        return '<label class="check">' + H.campo(lead, "proposta.antes." + i, "checkbox") + "<span>" + H.esc(t) + "</span></label>";
      }).join("") + "</div>" +

      '<div class="cartao"><h2>Roteiro</h2>' +
      (s ? "" : '<p class="vazio">Escolha o serviço apresentado (no alto) para o roteiro trazer o método e o escopo dele.</p>') +
      P.passos.map(function (p, i) {
        var feito = p.pacto && prop.pactos[p.pacto];
        return '<div class="passo' + (feito ? " pacto-feito" : "") + '" data-passo="' + p.id + '">' +
          '<span class="passo-num">' + (i + 1) + "</span><div>" +
          "<h3 style=\"margin:4px 0 2px\">" + H.esc(p.titulo) + (p.validar ? H.seloValidar(p.validar) : "") + "</h3>" +
          '<p class="passo-meta">' + H.esc(p.tempo) + " · " + H.esc(p.objetivo) + "</p>" +
          '<div class="fala">' + H.preencherHTML(p.fala, vars) + "</div>" +
          extrasDoPasso(p, s, lead) +
          (p.dica ? '<p class="dica">' + H.esc(p.dica) + "</p>" : "") +
          (p.pacto
            ? '<p style="margin-top:10px"><label class="pacto-check">' + H.campo(lead, "proposta.pactos." + p.pacto, "checkbox") +
              H.esc(P.pactos.find(function (x) { return x.id === p.pacto; }).texto) + "</label></p>"
            : "") +
          "</div></div>";
      }).join("") +
      "</div>" +

      '<div class="cartao" id="resultado"><h2>Como terminou a reunião?</h2>' +
      '<div class="opcoes" style="margin-bottom:14px">' +
      P.resultados.map(function (r) {
        return '<label><input type="radio" name="resultado" value="' + r.id + '" data-bind="proposta.resultado"' +
          (prop.resultado === r.id ? " checked" : "") + ">" + H.esc(r.rotulo) + "</label>";
      }).join("") + "</div>" +
      '<div class="campos">' +
      '<label class="campo"><span>Data da apresentação</span>' + H.campo(lead, "proposta.data", "date", ' placeholder="' + H.hoje() + '"') + "</label>" +
      '<label class="campo"><span>Valor da proposta (R$)</span>' + H.campo(lead, "proposta.valor", "text", ' inputmode="decimal" placeholder="Ex.: 4.500,00"') + "</label>" +
      '<label class="campo"><span>Data combinada para a decisão</span>' + H.campo(lead, "proposta.dataDecisao", "date") + "</label>" +
      '<label class="campo"><span>Motivo, se perdeu</span>' + H.select(lead, "proposta.motivoPerda", H.FUP.motivosPerda) + "</label>" +
      "</div>" +
      '<label class="check">' + H.campo(lead, "proposta.usouNovaApresentacao", "checkbox") + "<span>Usou a nova apresentação e o roteiro</span></label>" +
      '<div class="pergunta"><label for="notas-proposta">Notas</label>' + H.campo(lead, "proposta.notas", "textarea", ' id="notas-proposta" rows="3"') + "</div>" +
      '<div class="acoes"><button type="button" id="salvar-resultado">Salvar resultado e ir para o follow-up</button></div>' +
      "</div></div>" +

      '<aside class="lateral coluna-fixa"><h3>Guia rápido de objeções</h3><div id="guia-proposta"></div></aside>' +
      "</div>";

    function contarPactos() {
      var feitos = P.pactos.filter(function (p) { return prop.pactos[p.id]; }).length;
      el.querySelector("#contador-pactos").textContent = feitos + " de " + P.pactos.length;
    }

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "proposta.servico") {
        H.salvar();
        H.rerender();
        return;
      }
      if (caminho.indexOf("proposta.pactos.") === 0) {
        var passo = el.querySelector('[data-passo] input[data-bind="' + caminho + '"]');
        if (passo) passo.closest(".passo").classList.toggle("pacto-feito", !!H.obter(lead, caminho));
        contarPactos();
      }
    });
    contarPactos();

    H.montarGuiaObjecoes(el.querySelector("#guia-proposta"), {
      etapa: "proposta",
      servicoId: prop.servico,
      vars: vars,
      lead: lead,
    });

    el.querySelector("#salvar-resultado").addEventListener("click", function () {
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

  H.telas.proposta = {
    render: function (el, id) {
      var lead = id && H.lead(id);
      if (!lead) lista(el);
      else editor(el, lead);
    },
  };
})(window.HUB);
