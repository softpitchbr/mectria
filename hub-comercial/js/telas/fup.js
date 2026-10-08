/* Follow-up das propostas apresentadas: lista com o próximo toque de cada lead e a cadência
   com as mensagens prontas. Toda proposta termina como ganha, perdida (com motivo) ou nutrição. */
(function (H) {
  var filtro = "ativos";

  var FILTROS = [
    ["ativos", "Em follow-up"],
    ["nutricao", "Nutrição"],
    ["ganhos", "Ganhos"],
    ["perdidos", "Perdidos"],
    ["todos", "Todos"],
  ];

  function leadsComProposta() {
    return H.estado.leads.filter(function (l) { return l.fup || (l.proposta && l.proposta.data); });
  }

  function passaFiltro(l) {
    var st = H.statusLead(l).id;
    if (filtro === "ativos") return st === "fup" || st === "proposta";
    if (filtro === "nutricao") return st === "nutricao";
    if (filtro === "ganhos") return st === "ganho";
    if (filtro === "perdidos") return st === "perdido";
    return true;
  }

  function nomeServico(l) {
    var s = l.proposta && l.proposta.servico && H.servico(l.proposta.servico);
    return s ? s.nome : "";
  }

  /* ---------- lista ---------- */

  function lista(el) {
    var todos = leadsComProposta();
    var hoje = H.hoje();
    var cont = { atrasados: 0, hoje: 0, ativos: 0, ganhos: 0, perdidos: 0 };
    todos.forEach(function (l) {
      var st = H.statusLead(l).id;
      if (st === "fup") {
        cont.ativos++;
        var t = H.proximoToque(l);
        if (t && t.data < hoje) cont.atrasados++;
        else if (t && t.data === hoje) cont.hoje++;
      }
      if (st === "ganho") cont.ganhos++;
      if (st === "perdido") cont.perdidos++;
    });
    var decididas = cont.ganhos + cont.perdidos;
    var conversao = decididas ? Math.round((cont.ganhos / decididas) * 100) + "%" : "—";

    var linhas = todos
      .filter(passaFiltro)
      .map(function (l) { return { l: l, t: H.proximoToque(l) }; })
      .sort(function (a, b) { return ((a.t && a.t.data) || "9999").localeCompare((b.t && b.t.data) || "9999"); });

    el.innerHTML =
      '<div class="cabecalho-tela"><div><h1>Follow-up</h1>' +
      '<p class="sub">Propostas já apresentadas. Cada toque tem dia, canal e mensagem pronta. ' +
      "Ligação vale mais que mensagem, e nunca mande só \"conseguiu ver?\".</p></div>" +
      '<div class="acoes"><button type="button" id="nova-fup">+ Proposta já apresentada</button>' +
      '<button type="button" class="botao-sec" id="csv-fup">Exportar CSV</button></div></div>' +

      '<div class="numeros-hoje">' +
      '<div class="numero-hoje"><strong>' + cont.atrasados + "</strong>toques atrasados</div>" +
      '<div class="numero-hoje"><strong>' + cont.hoje + "</strong>toques para hoje</div>" +
      '<div class="numero-hoje"><strong>' + cont.ativos + "</strong>propostas em follow-up</div>" +
      '<div class="numero-hoje"><strong>' + conversao + "</strong>conversão das decididas (" + cont.ganhos + " de " + decididas + ")</div>" +
      "</div>" +

      '<div class="cartao" id="form-fup" hidden><h2>Registrar proposta já apresentada</h2>' +
      '<p class="muted pequeno">Para colocar no follow-up as propostas que já estão na rua, inclusive as de antes do hub.</p>' +
      '<form class="campos">' +
      '<label class="campo"><span>Empresa</span><input name="empresa" required></label>' +
      '<label class="campo"><span>Contato</span><input name="contato" required></label>' +
      '<label class="campo"><span>Telefone ou WhatsApp</span><input name="telefone" type="tel"></label>' +
      '<label class="campo"><span>E-mail</span><input name="email" type="email"></label>' +
      '<label class="campo"><span>Serviço</span><select name="servico">' +
      H.servicosAtivos().map(function (s) { return '<option value="' + s.id + '">' + H.esc(s.nome) + "</option>"; }).join("") +
      "</select></label>" +
      '<label class="campo"><span>Valor da proposta (R$)</span><input name="valor" inputmode="decimal" placeholder="Ex.: 2.700,00"></label>' +
      '<label class="campo"><span>Data da apresentação</span><input name="data" type="date" value="' + H.hoje() + '" required></label>' +
      '<label class="campo"><span>Data combinada para a decisão</span><input name="decisao" type="date"></label>' +
      '<label class="check campo-largo"><input type="checkbox" name="antiga"><span>Proposta antiga: começar a cadência hoje, a partir do toque D+1</span></label>' +
      '<div class="acoes campo-largo"><button type="submit">Colocar no follow-up</button>' +
      '<button type="button" class="botao-texto" id="cancelar-fup">Cancelar</button></div>' +
      "</form></div>" +

      '<div class="chips" style="margin:8px 0 14px">' +
      FILTROS.map(function (f) {
        return '<button type="button" class="chip' + (filtro === f[0] ? " ativo" : "") + '" data-filtro="' + f[0] + '">' + f[1] + "</button>";
      }).join("") +
      "</div>" +

      (linhas.length
        ? '<div class="rolagem-x"><table class="tabela"><thead><tr><th>Empresa</th><th>Serviço</th><th>Valor</th><th>Apresentada</th><th>Próximo toque</th><th>Situação</th></tr></thead><tbody>' +
          linhas.map(function (x) {
            var l = x.l;
            var t = x.t;
            var sit = H.situacaoToque(t);
            var proximo = t
              ? H.dataCurta(t.data) + " · " + H.esc(t.toque.canal) + (t.toque.dia != null ? ' <span class="muted">D+' + t.toque.dia + "</span>" : "")
              : '<span class="muted">—</span>';
            var selo = H.statusLead(l).id === "fup" && sit && sit.id !== "futuro"
              ? '<span class="selo selo-' + sit.id + '">' + sit.rotulo + "</span>"
              : H.seloStatus(l);
            return '<tr class="clicavel" data-abrir="' + l.id + '"><td><a href="#/fup/' + l.id + '">' + H.esc(l.empresa || "Sem nome") + "</a>" +
              (l.contato ? '<br><span class="muted pequeno">' + H.esc(l.contato) + "</span>" : "") + "</td>" +
              "<td>" + H.esc(nomeServico(l)) + "</td>" +
              "<td>" + H.esc(H.reais(l.proposta && l.proposta.valor)) + "</td>" +
              "<td>" + H.data(l.proposta && l.proposta.data) + "</td>" +
              "<td>" + proximo + "</td><td>" + selo + "</td></tr>";
          }).join("") +
          "</tbody></table></div>"
        : '<p class="vazio">Nada aqui. Registre o resultado de uma apresentação no playbook da proposta, ou use "+ Proposta já apresentada".</p>') +

      '<div class="painel-nevoa" style="margin-top:28px"><h3>Regras do follow-up</h3><ul class="pequeno">' +
      H.FUP.regras.map(function (r) { return "<li>" + H.esc(r) + "</li>"; }).join("") +
      "</ul></div>";

    var form = el.querySelector("#form-fup");
    el.querySelector("#nova-fup").addEventListener("click", function () {
      form.hidden = false;
      form.querySelector("input").focus();
    });
    el.querySelector("#cancelar-fup").addEventListener("click", function () { form.hidden = true; });
    el.querySelector("#csv-fup").addEventListener("click", H.exportarCSV);

    form.querySelector("form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = ev.target;
      var data = f.data.value || H.hoje();
      var antiga = f.antiga.checked;
      var lead = H.novoLead({
        empresa: f.empresa.value.trim(),
        contato: f.contato.value.trim(),
        telefone: f.telefone.value.trim(),
        email: f.email.value.trim(),
        servicos: [f.servico.value],
        proposta: {
          servico: f.servico.value,
          data: data,
          valor: H.paraNumero(f.valor.value) || "",
          dataDecisao: f.decisao.value,
          resultado: "decidir",
          pactos: {},
          objecoes: {},
          usouNovaApresentacao: false,
        },
        fup: {
          inicio: antiga ? H.hoje() : data,
          toques: antiga ? { d0: H.hoje() } : {},
          status: "ativo",
        },
      });
      H.ir("#/fup/" + lead.id);
    });

    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-filtro]");
      if (b) {
        filtro = b.getAttribute("data-filtro");
        H.rerender();
        return;
      }
      var tr = ev.target.closest("[data-abrir]");
      if (tr && !ev.target.closest("a")) H.ir("#/fup/" + tr.getAttribute("data-abrir"));
    });
  }

  /* ---------- detalhe ---------- */

  function toqueHTML(item, vars, lead) {
    var t = item.toque;
    var texto = H.preencher(t.modelo, vars);
    var sit = item.feito ? null : H.situacaoToque(item);
    var botoes = '<button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(texto) + '">Copiar</button>';
    if (/WhatsApp/.test(t.canal)) {
      var link = H.linkWhatsApp(lead.telefone, texto);
      botoes += link
        ? '<a class="botao botao-texto botao-pequeno" target="_blank" rel="noopener" href="' + H.esc(link) + '">Abrir no WhatsApp</a>'
        : '<span class="pequeno muted">Sem telefone para o WhatsApp</span>';
    }
    if (/E-mail/.test(t.canal) && lead.email) {
      var assunto = "";
      var corpo = texto;
      var m = /^Assunto: (.*)\n\n/.exec(texto);
      if (m) {
        assunto = m[1];
        corpo = texto.slice(m[0].length);
      }
      botoes += '<a class="botao botao-texto botao-pequeno" href="mailto:' + H.esc(lead.email) + "?subject=" +
        encodeURIComponent(assunto) + "&body=" + encodeURIComponent(corpo) + '">Abrir e-mail</a>';
    }
    var d = H.paraData(item.data);
    var semana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    return (
      '<div class="toque' + (item.feito ? " feito" : "") + '">' +
      '<div class="toque-data">' + H.dataCurta(item.data) + "<small>" + semana + " · D+" + t.dia + "</small>" +
      (sit && sit.id !== "futuro" ? '<span class="selo selo-' + sit.id + '">' + sit.rotulo + "</span>" : "") + "</div>" +
      "<div><h4>" + H.esc(t.canal) + " · " + H.esc(t.objetivo) + "</h4>" +
      (item.feito ? '<p class="pequeno muted">Feito em ' + H.data(item.feito) + "</p>" : "") +
      '<div class="fala mensagem">' + H.preencherHTML(t.modelo, vars) + '<div class="copiar acoes">' + botoes + "</div></div>" +
      (t.dica && !item.feito ? '<p class="dica">' + H.esc(t.dica) + "</p>" : "") +
      '<p style="margin-top:8px"><button type="button" class="' + (item.feito ? "botao-texto" : "botao-sec") + ' botao-pequeno" data-toque="' + t.id + '">' +
      (item.feito ? "Desfazer" : "Marcar como feito") + "</button></p>" +
      "</div></div>"
    );
  }

  function detalhe(el, lead) {
    var prop = lead.proposta || {};
    var fup = lead.fup || {};
    var vars = H.variaveis(lead, prop.servico);
    if (fup.linkConteudo) vars.link_conteudo = fup.linkConteudo;
    var agenda = H.agendaFup(lead);
    var st = H.statusLead(lead);
    var aberto = fup.status === "ativo";
    var telefone = lead.telefone ? '<a href="' + H.esc(H.linkWhatsApp(lead.telefone, "")) + '" target="_blank" rel="noopener">' + H.esc(lead.telefone) + "</a>" : "";

    el.innerHTML =
      '<a class="pequeno" href="#/fup">← Todas as propostas</a>' +
      '<div class="cabecalho-tela"><div><h1>' + H.esc(lead.empresa || "Sem nome") + "</h1>" +
      '<p class="sub">' + [H.esc(lead.contato), telefone, H.esc(lead.email)].filter(Boolean).join(" · ") + " · " + H.seloStatus(lead) + "</p></div>" +
      '<div class="acoes"><a class="botao botao-sec" href="#/playbooks/proposta/' + lead.id + '">Playbook da proposta</a>' +
      '<a class="botao botao-sec" href="#/playbooks/diagnostica/' + lead.id + '">Diagnóstica</a></div></div>' +

      '<div class="tres-colunas" style="grid-template-columns:minmax(0,1fr) 340px">' +
      "<div>" +
      '<div class="cartao"><div class="campos">' +
      '<div class="campo"><span>Serviço</span><strong>' + H.esc(nomeServico(lead) || "—") + "</strong></div>" +
      '<div class="campo"><span>Valor</span><strong>' + H.esc(H.reais(prop.valor) || "—") + "</strong></div>" +
      '<div class="campo"><span>Apresentada em</span><strong>' + (H.data(prop.data) || "—") + "</strong></div>" +
      '<div class="campo"><span>Decisão combinada</span><strong>' + (H.data(prop.dataDecisao) || "—") + "</strong></div>" +
      '<div class="campo"><span>Proposta vale até</span><strong>' + H.esc(vars.validade || "—") + "</strong></div>" +
      "</div></div>" +

      '<div class="cartao"><h2>Cadência</h2>' +
      (agenda.length
        ? (aberto ? "" : '<p class="muted pequeno">Cadência encerrada (' + H.esc(st.rotulo.toLowerCase()) + "). Reabra para continuar.</p>") +
          '<div class="campos" style="margin-bottom:8px"><label class="campo"><span>Link de um post ou caso para o toque D+5</span>' +
          H.campo(lead, "fup.linkConteudo", "text", ' placeholder="https://instagram.com/p/..."') + "</label></div>" +
          agenda.map(function (item) { return toqueHTML(item, vars, lead); }).join("")
        : '<p class="vazio">Sem data de apresentação. Registre o resultado no playbook da proposta.</p>') +
      "</div></div>" +

      '<aside class="lateral">' +
      '<div class="cartao"><h3>Resultado</h3>' +
      (aberto || fup.status === "nutricao"
        ? '<details><summary class="botao" style="margin-bottom:8px">Ganhou</summary><div class="campos" style="grid-template-columns:1fr;margin:8px 0">' +
          '<label class="campo"><span>Valor fechado (R$)</span><input id="valor-fechado" inputmode="decimal" value="' + H.esc(prop.valor ? String(prop.valor).replace(".", ",") : "") + '"></label>' +
          '<label class="campo"><span>Data da assinatura</span><input id="data-fechamento" type="date" value="' + H.hoje() + '"></label>' +
          '<button type="button" data-resultado="ganho">Registrar ganho</button></div></details>' +
          '<details><summary class="botao botao-sec" style="margin-bottom:8px">Perdeu</summary><div class="campos" style="grid-template-columns:1fr;margin:8px 0">' +
          '<label class="campo"><span>Motivo</span><select id="motivo-perda"><option value="">Escolha</option>' +
          H.FUP.motivosPerda.map(function (m) { return "<option>" + H.esc(m) + "</option>"; }).join("") + "</select></label>" +
          '<label class="campo"><span>Detalhe</span><input id="detalhe-perda"></label>' +
          '<button type="button" class="botao-sec" data-resultado="perdido">Registrar perda</button></div></details>' +
          (fup.status === "nutricao" ? "" :
            '<details><summary class="botao botao-sec">Nutrição</summary><div class="campos" style="grid-template-columns:1fr;margin:8px 0">' +
            '<label class="campo"><span>Retomar em</span><input id="retomar-em" type="date" value="' + H.somarDias(H.hoje(), H.FUP.nutricao.dias) + '"></label>' +
            '<div class="fala mensagem">' + H.preencherHTML(H.FUP.nutricao.modelo, vars) + "</div>" +
            '<button type="button" class="botao-sec" data-resultado="nutricao">Mandar para nutrição</button></div></details>')
        : '<p class="pequeno">' + H.esc(st.rotulo) +
          (fup.status === "ganho" ? " · " + H.esc(H.reais(fup.valorFechado)) + " em " + H.data(fup.dataFechamento) : "") +
          (fup.status === "perdido" ? " · " + H.esc(fup.motivoPerda || "sem motivo") + (fup.detalhePerda ? " (" + H.esc(fup.detalhePerda) + ")" : "") : "") +
          "</p>") +
      (fup.status && fup.status !== "ativo"
        ? '<p><button type="button" class="botao-texto botao-pequeno" data-resultado="reabrir">Reabrir o follow-up</button></p>'
        : "") +
      (fup.status === "nutricao" ? '<p class="pequeno">Retomar em ' + H.data(fup.retomarEm) + "</p>" : "") +
      "</div>" +
      '<div class="cartao"><h3>Notas</h3>' + H.campo(lead, "fup.notas", "textarea", ' rows="4" aria-label="Notas do follow-up"') + "</div>" +
      '<div class="cartao"><h3>Da diagnóstica</h3>' +
      H.resumoDiag(lead, null, ["c-dor", "ci-negativa", "g-resultado", "a-decisores", "a-criterio", "b-concorrencia"]) + "</div>" +
      '<h3 style="margin-top:20px">Objeções no follow-up</h3><div id="guia-fup"></div>' +
      "</aside></div>";

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "fup.linkConteudo") {
        clearTimeout(H._timerLink);
        H._timerLink = setTimeout(function () {
          H.salvar();
          H.rerender();
        }, 800);
      }
    });

    H.montarGuiaObjecoes(el.querySelector("#guia-fup"), { etapa: "fup", servicoId: prop.servico, vars: vars });

    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-toque]");
      if (b) {
        var id = b.getAttribute("data-toque");
        lead.fup.toques = lead.fup.toques || {};
        if (lead.fup.toques[id]) delete lead.fup.toques[id];
        else lead.fup.toques[id] = H.hoje();
        H.tocar(lead);
        H.salvar();
        H.rerender();
        return;
      }
      var r = ev.target.closest("[data-resultado]");
      if (!r) return;
      var tipo = r.getAttribute("data-resultado");
      lead.fup = lead.fup || { toques: {} };
      if (tipo === "ganho") {
        lead.fup.status = "ganho";
        lead.fup.valorFechado = H.paraNumero(el.querySelector("#valor-fechado").value) || prop.valor || "";
        lead.fup.dataFechamento = el.querySelector("#data-fechamento").value || H.hoje();
        if (lead.proposta) lead.proposta.resultado = "ganho";
      } else if (tipo === "perdido") {
        var motivo = el.querySelector("#motivo-perda").value;
        if (!motivo) {
          H.aviso("Escolha o motivo da perda. É ele que ajusta o roteiro.");
          return;
        }
        lead.fup.status = "perdido";
        lead.fup.motivoPerda = motivo;
        lead.fup.detalhePerda = el.querySelector("#detalhe-perda").value;
        if (lead.proposta) {
          lead.proposta.resultado = "perdido";
          lead.proposta.motivoPerda = motivo;
        }
      } else if (tipo === "nutricao") {
        lead.fup.status = "nutricao";
        lead.fup.retomarEm = el.querySelector("#retomar-em").value;
      } else if (tipo === "reabrir") {
        lead.fup.status = "ativo";
      }
      H.tocar(lead);
      H.salvar();
      H.aviso("Registrado");
      H.rerender();
    });
  }

  H.telas.fup = {
    render: function (el, id) {
      var lead = id && H.lead(id);
      if (lead) detalhe(el, lead);
      else lista(el);
    },
  };
})(window.HUB);
