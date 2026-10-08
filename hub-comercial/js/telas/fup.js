/* Follow-up: a lista mostra só o próximo toque de cada proposta. No detalhe, o próximo toque
   fica aberto com a mensagem pronta; o resto da cadência fica recolhido. */
(function (H) {
  var filtro = "ativos";
  var FILTROS = [["ativos", "Em follow-up"], ["nutricao", "Nutrição"], ["ganhos", "Ganhos"], ["perdidos", "Perdidos"]];

  function comProposta() {
    return H.estado.leads.filter(function (l) { return l.fup || (l.proposta && l.proposta.data); });
  }

  function passa(l) {
    var st = H.statusLead(l).id;
    if (filtro === "ativos") return st === "fup" || st === "proposta";
    if (filtro === "nutricao") return st === "nutricao";
    if (filtro === "ganhos") return st === "ganho";
    return st === "perdido";
  }

  function nomeServico(l) {
    var s = l.proposta && l.proposta.servico && H.servico(l.proposta.servico);
    return s ? s.nome : "";
  }

  function novaProposta() {
    H.gaveta("Proposta já apresentada", function (corpo) {
      corpo.innerHTML =
        '<form style="display:grid;gap:14px">' +
        H.rotulado("Empresa", '<input name="empresa" required>') +
        H.rotulado("Contato", '<input name="contato" required>') +
        H.rotulado("Telefone ou WhatsApp", '<input name="telefone" type="tel">') +
        H.rotulado("Serviço", "<select name=\"servico\">" + H.servicosAtivos().map(function (s) {
          return '<option value="' + s.id + '">' + H.esc(s.nome) + "</option>";
        }).join("") + "</select>") +
        H.rotulado("Valor (R$)", '<input name="valor" inputmode="decimal" placeholder="Ex.: 2.700,00">') +
        H.rotulado("Apresentada em", '<input name="data" type="date" value="' + H.hoje() + '" required>') +
        '<label class="check"><input type="checkbox" name="antiga"><span>Proposta antiga: começar a cadência hoje</span></label>' +
        '<button type="submit">Colocar no follow-up</button></form>';
      corpo.querySelector("form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var data = f.data.value || H.hoje();
        var antiga = f.antiga.checked;
        var lead = H.novoLead({
          empresa: f.empresa.value.trim(),
          contato: f.contato.value.trim(),
          telefone: f.telefone.value.trim(),
          servicos: [f.servico.value],
          proposta: {
            servico: f.servico.value, data: data, valor: H.paraNumero(f.valor.value) || "",
            resultado: "decidir", pactos: {}, objecoes: {}, usouNovaApresentacao: false,
          },
          fup: { inicio: antiga ? H.hoje() : data, toques: antiga ? { d0: H.hoje() } : {}, status: "ativo" },
        });
        H.fecharGaveta();
        H.ir("#/fup/" + lead.id);
      });
    });
  }

  /* ---------- lista ---------- */

  function lista(el) {
    var todos = comProposta();
    var hoje = H.hoje();
    var c = { atrasados: 0, hoje: 0, ganhos: 0, perdidos: 0 };
    todos.forEach(function (l) {
      var st = H.statusLead(l).id;
      if (st === "fup") {
        var t = H.proximoToque(l);
        if (t && t.data < hoje) c.atrasados++;
        else if (t && t.data === hoje) c.hoje++;
      }
      if (st === "ganho") c.ganhos++;
      if (st === "perdido") c.perdidos++;
    });
    var decididas = c.ganhos + c.perdidos;
    var resumo = [
      c.atrasados ? c.atrasados + " atrasado" + (c.atrasados > 1 ? "s" : "") : "",
      c.hoje ? c.hoje + " para hoje" : "",
      decididas ? "conversão " + Math.round((c.ganhos / decididas) * 100) + "% (" + c.ganhos + " de " + decididas + ")" : "",
    ].filter(Boolean).join(" · ");

    var linhas = todos.filter(passa)
      .map(function (l) { return { l: l, t: H.proximoToque(l) }; })
      .sort(function (a, b) { return ((a.t && a.t.data) || "9").localeCompare((b.t && b.t.data) || "9"); });

    el.innerHTML =
      '<div class="estreita"><div class="cabeca"><div><h1>Follow-up</h1>' + (resumo ? '<p class="sub">' + H.esc(resumo) + "</p>" : "") + "</div>" +
      '<button type="button" id="nova">' + H.icone("mais") + "Proposta</button></div>" +
      '<div class="chips" style="margin-bottom:16px">' +
      FILTROS.map(function (f) {
        return '<button type="button" class="chip' + (filtro === f[0] ? " ativo" : "") + '" data-filtro="' + f[0] + '">' + f[1] + "</button>";
      }).join("") + "</div>" +
      (linhas.length
        ? '<div class="linhas">' + linhas.map(function (x) {
            var l = x.l;
            var t = x.t;
            var sit = H.situacaoToque(t);
            var meta = [nomeServico(l), H.reais(l.proposta && l.proposta.valor), t ? H.dataCurta(t.data) + " · " + t.toque.canal : ""].filter(Boolean).join(" · ");
            var selo = H.statusLead(l).id === "fup" && sit && sit.id !== "futuro"
              ? '<span class="selo selo-' + sit.id + '">' + sit.rotulo + "</span>" : (H.statusLead(l).id === "fup" ? "" : H.seloStatus(l));
            return '<a class="linha" href="#/fup/' + l.id + '"><div class="linha-texto"><strong>' + H.esc(l.empresa || "Sem nome") +
              "</strong><small>" + H.esc(meta) + "</small></div>" + selo + H.icone("avancar") + "</a>";
          }).join("") + "</div>"
        : '<p class="vazio">Nada aqui.</p>') +
      '<details class="mais" style="margin-top:20px"><summary>Regras do follow-up</summary><ul class="lista-simples">' +
      H.FUP.regras.map(function (r) { return "<li>" + H.esc(r) + "</li>"; }).join("") + "</ul></details>" +
      (window.HUB_SEM_DOWNLOAD ? "" : '<p><button type="button" class="botao-texto botao-pequeno" id="csv">Exportar planilha (CSV)</button></p>') + "</div>";

    el.querySelector("#nova").addEventListener("click", novaProposta);
    var csv = el.querySelector("#csv");
    if (csv) csv.addEventListener("click", H.exportarCSV);
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-filtro]");
      if (b) {
        filtro = b.getAttribute("data-filtro");
        H.rerender();
      }
    });
  }

  /* ---------- detalhe ---------- */

  function acoesMensagem(t, texto, lead) {
    var html = '<button type="button" class="botao-sec botao-pequeno" data-copiar="' + H.esc(texto) + '">Copiar</button>';
    if (/WhatsApp/.test(t.canal) && lead.telefone) {
      html += '<a class="botao botao-sec botao-pequeno" target="_blank" rel="noopener" href="' + H.esc(H.linkWhatsApp(lead.telefone, texto)) + '">WhatsApp</a>';
    }
    if (/E-mail/.test(t.canal) && lead.email) {
      var m = /^Assunto: (.*)\n\n/.exec(texto);
      var assunto = m ? m[1] : "";
      var corpo = m ? texto.slice(m[0].length) : texto;
      html += '<a class="botao botao-sec botao-pequeno" href="mailto:' + H.esc(lead.email) + "?subject=" + encodeURIComponent(assunto) +
        "&body=" + encodeURIComponent(corpo) + '">E-mail</a>';
    }
    return html;
  }

  function detalhe(el, lead) {
    var prop = lead.proposta || {};
    var fup = lead.fup || {};
    var vars = H.variaveis(lead, prop.servico);
    if (fup.linkConteudo) vars.link_conteudo = fup.linkConteudo;
    var agenda = H.agendaFup(lead);
    var ativo = fup.status === "ativo";
    var proximo = ativo ? agenda.find(function (x) { return !x.feito; }) : null;
    var meta = [lead.contato, nomeServico(lead), H.reais(prop.valor)].filter(Boolean).join(" · ");

    var blocoProximo = "";
    if (proximo) {
      var t = proximo.toque;
      var sit = H.situacaoToque(proximo);
      var texto = H.preencher(t.modelo, vars);
      blocoProximo =
        '<div class="proximo-toque" data-com-dica><div class="pergunta-texto" style="margin-bottom:4px"><span style="flex:1">' +
        H.esc(t.canal) + " · " + H.esc(t.objetivo) + "</span>" + (t.dica ? H.botaoInfo() : "") + "</div>" +
        '<p class="muted pequeno" style="margin:0 0 12px">' + H.data(proximo.data) + " · D+" + t.dia +
        (sit.id !== "futuro" ? ' <span class="selo selo-' + sit.id + '">' + sit.rotulo + "</span>" : "") + "</p>" +
        H.textoDica(t.dica) +
        (t.id === "d5" ? '<div style="margin-bottom:12px">' + H.rotulado("Link de um post ou caso", H.campo(lead, "fup.linkConteudo", "text", ' placeholder="https://..."')) + "</div>" : "") +
        '<div class="fala fala-mensagem">' + H.preencherHTML(t.modelo, vars) + "</div>" +
        '<div class="acoes">' + acoesMensagem(t, texto, lead) +
        '<button type="button" class="botao-pequeno" data-toque="' + t.id + '">' + H.icone("check") + "Feito</button></div></div>";
    }

    el.innerHTML =
      '<div class="estreita"><a class="voltar" href="#/fup">' + H.icone("voltar") + "Follow-up</a>" +
      '<div class="cabeca" style="margin-top:8px"><div><h1>' + H.esc(lead.empresa || "Sem nome") + "</h1>" +
      '<p class="sub">' + H.esc(meta) + " " + H.seloStatus(lead) + "</p></div>" +
      '<div class="acoes">' +
      (lead.telefone ? '<a class="botao-icone" target="_blank" rel="noopener" href="' + H.esc(H.linkWhatsApp(lead.telefone, "")) + '" aria-label="WhatsApp" title="WhatsApp">' + H.icone("conversa") + "</a>" : "") +
      '<button type="button" class="botao-icone" id="abrir-resumo" aria-label="Coletado na diagnóstica" title="Coletado na diagnóstica">' + H.icone("lista") + "</button>" +
      '<button type="button" class="botao-icone" id="abrir-objecoes" aria-label="Objeções" title="Objeções">' + H.icone("escudo") + "</button>" +
      "</div></div>" +

      (blocoProximo ||
        (ativo ? '<p class="vazio">Cadência concluída. Registre o resultado.</p>' : "")) +

      '<div class="secao"><h2>Resultado</h2>' +
      (ativo || fup.status === "nutricao"
        ? '<div class="acoes"><button type="button" data-resultado="ganho">Ganhou</button>' +
          '<button type="button" class="botao-sec" data-resultado="perdido">Perdeu</button>' +
          (fup.status === "nutricao" ? "" : '<button type="button" class="botao-sec" data-resultado="nutricao">Nutrição</button>') +
          (fup.status === "nutricao" ? '<button type="button" class="botao-texto" data-resultado="reabrir">Reabrir</button>' : "") + "</div>" +
          (fup.status === "nutricao" ? '<p class="muted pequeno">Retomar em ' + H.data(fup.retomarEm) + "</p>" : "")
        : '<p style="margin:0 0 8px">' + H.esc(H.statusLead(lead).rotulo) +
          (fup.status === "ganho" ? " · " + H.esc(H.reais(fup.valorFechado)) + " em " + H.data(fup.dataFechamento) : "") +
          (fup.status === "perdido" ? " · " + H.esc(fup.motivoPerda || "sem motivo") : "") +
          '</p><button type="button" class="botao-texto botao-pequeno" data-resultado="reabrir">Reabrir o follow-up</button>') +
      "</div>" +

      (agenda.length
        ? '<details class="mais secao"><summary>Cadência completa (' + agenda.filter(function (x) { return x.feito; }).length + "/" + agenda.length + ")</summary>" +
          '<ul class="toques">' + agenda.map(function (x) {
            var sit2 = x.feito ? null : H.situacaoToque(x);
            var texto2 = H.preencher(x.toque.modelo, vars);
            return '<li class="' + (x.feito ? "feito" : "") + '"><details><summary><span class="estado">' + (x.feito ? H.icone("check") : "") + "</span>" +
              '<span class="data">' + H.dataCurta(x.data) + '</span><span class="linha-texto"><strong>' + H.esc(x.toque.canal) + "</strong><small>" +
              H.esc(x.toque.objetivo) + "</small></span>" +
              (sit2 && sit2.id === "atrasado" ? '<span class="selo selo-atrasado">Atrasado</span>' : "") + "</summary>" +
              '<div class="corpo-toque"><div class="fala fala-mensagem">' + H.preencherHTML(x.toque.modelo, vars) + "</div>" +
              '<div class="acoes">' + acoesMensagem(x.toque, texto2, lead) +
              '<button type="button" class="botao-texto botao-pequeno" data-toque="' + x.toque.id + '">' + (x.feito ? "Desfazer" : "Marcar como feito") + "</button>" +
              "</div></div></details></li>";
          }).join("") + "</ul></details>"
        : "") +
      '<details class="mais"><summary>Notas</summary>' + H.campo(lead, "fup.notas", "textarea", ' rows="4" aria-label="Notas"') + "</details>" +
      "</div>";

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "fup.linkConteudo") {
        clearTimeout(H._timerLink);
        H._timerLink = setTimeout(function () { H.salvar(); H.rerender(); }, 900);
      }
    });

    el.querySelector("#abrir-resumo").addEventListener("click", function () { H.abrirResumo(lead, prop.servico); });
    el.querySelector("#abrir-objecoes").addEventListener("click", function () {
      H.abrirObjecoes({ etapa: "fup", vars: vars });
    });

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
      if (r) registrar(lead, r.getAttribute("data-resultado"));
    });
  }

  function registrar(lead, tipo) {
    var prop = lead.proposta || {};
    lead.fup = lead.fup || { toques: {} };
    function concluir() {
      H.tocar(lead);
      H.salvar();
      H.fecharGaveta();
      H.aviso("Registrado");
      H.rerender();
    }
    if (tipo === "reabrir") {
      lead.fup.status = "ativo";
      return concluir();
    }
    if (tipo === "ganho") {
      H.gaveta("Ganhou", function (corpo) {
        corpo.innerHTML = '<div style="display:grid;gap:14px">' +
          H.rotulado("Valor fechado (R$)", '<input id="valor" inputmode="decimal" value="' + H.esc(prop.valor ? String(prop.valor).replace(".", ",") : "") + '">') +
          H.rotulado("Data da assinatura", '<input id="data" type="date" value="' + H.hoje() + '">') +
          '<button type="button" id="ok">Registrar</button></div>';
        corpo.querySelector("#ok").addEventListener("click", function () {
          lead.fup.status = "ganho";
          lead.fup.valorFechado = H.paraNumero(corpo.querySelector("#valor").value) || prop.valor || "";
          lead.fup.dataFechamento = corpo.querySelector("#data").value || H.hoje();
          if (lead.proposta) lead.proposta.resultado = "ganho";
          concluir();
        });
      });
    }
    if (tipo === "perdido") {
      H.gaveta("Perdeu", function (corpo) {
        corpo.innerHTML = '<p class="muted" style="margin-top:0">O motivo é o que ajusta o roteiro.</p><div class="chips" style="margin-bottom:16px">' +
          H.FUP.motivosPerda.map(function (m) { return '<button type="button" class="chip" data-motivo="' + H.esc(m) + '">' + H.esc(m) + "</button>"; }).join("") +
          "</div>" + H.rotulado("Detalhe (opcional)", '<input id="detalhe">') +
          '<p><button type="button" id="ok" disabled>Registrar</button></p>';
        var motivo = "";
        corpo.addEventListener("click", function (ev) {
          var c = ev.target.closest("[data-motivo]");
          if (!c) return;
          motivo = c.getAttribute("data-motivo");
          corpo.querySelectorAll("[data-motivo]").forEach(function (x) { x.classList.toggle("ativo", x === c); });
          corpo.querySelector("#ok").disabled = false;
        });
        corpo.querySelector("#ok").addEventListener("click", function () {
          lead.fup.status = "perdido";
          lead.fup.motivoPerda = motivo;
          lead.fup.detalhePerda = corpo.querySelector("#detalhe").value;
          if (lead.proposta) {
            lead.proposta.resultado = "perdido";
            lead.proposta.motivoPerda = motivo;
          }
          concluir();
        });
      });
    }
    if (tipo === "nutricao") {
      H.gaveta("Nutrição", function (corpo) {
        corpo.innerHTML = '<div style="display:grid;gap:14px">' +
          H.rotulado("Retomar em", '<input id="data" type="date" value="' + H.somarDias(H.hoje(), H.FUP.nutricao.dias) + '">') +
          '<div class="fala fala-mensagem">' + H.preencherHTML(H.FUP.nutricao.modelo, H.variaveis(lead, prop.servico)) + "</div>" +
          '<button type="button" id="ok">Mandar para nutrição</button></div>';
        corpo.querySelector("#ok").addEventListener("click", function () {
          lead.fup.status = "nutricao";
          lead.fup.retomarEm = corpo.querySelector("#data").value;
          concluir();
        });
      });
    }
  }

  H.telas.fup = {
    render: function (el, id) {
      var lead = id && H.lead(id);
      if (lead) detalhe(el, lead);
      else lista(el);
    },
  };
})(window.HUB);
