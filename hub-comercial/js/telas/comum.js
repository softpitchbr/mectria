/* Peças usadas em mais de uma tela: guia de objeções, resumo da diagnóstica e agenda do follow-up. */
(function (H) {
  /* ---------- guia rápido de objeções ---------- */

  function itemObjecao(o, vars, lead) {
    var registrar = lead && lead.proposta
      ? '<label class="check pequeno"><input type="checkbox" data-bind="proposta.objecoes.' + o.id + '"' +
        (lead.proposta.objecoes && lead.proposta.objecoes[o.id] ? " checked" : "") +
        "><span>Apareceu nesta reunião</span></label>"
      : "";
    var textoCopiar = H.preencher(o.contorno, vars);
    return (
      '<details class="objecao" data-id="' + o.id + '">' +
      "<summary>" + H.esc(o.objecao) + (o.validar ? H.seloValidar() : "") + "</summary>" +
      '<div class="corpo">' +
      '<p class="rotulo-pequeno">O que costuma estar por trás</p><p>' + H.esc(o.porTras) + "</p>" +
      '<div class="fala">' + H.preencherHTML(o.contorno, vars) +
      '<div class="copiar"><button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(textoCopiar) + '">Copiar</button></div></div>' +
      (o.prova ? '<p class="rotulo-pequeno">Prova ou regra</p><p>' + H.esc(o.prova) + "</p>" : "") +
      registrar +
      "</div></details>"
    );
  }

  /* Monta o guia com busca e filtro por etapa dentro de "el". */
  H.montarGuiaObjecoes = function (el, opcoes) {
    var etapaInicial = opcoes.etapa || "todas";
    var estado = { etapa: etapaInicial, busca: "" };
    var servico = opcoes.servicoId && H.servico(opcoes.servicoId);

    function filtrar() {
      var termo = estado.busca.toLowerCase();
      return H.OBJECOES.filter(function (o) {
        if (estado.etapa === "servico") {
          if (!servico || servico.objecoes.indexOf(o.id) === -1) return false;
        } else if (estado.etapa !== "todas" && o.etapas.indexOf(estado.etapa) === -1) {
          return false;
        }
        if (!termo) return true;
        return (o.objecao + " " + o.contorno + " " + o.porTras).toLowerCase().indexOf(termo) !== -1;
      });
    }

    function filtros() {
      var lista = [["todas", "Todas"]];
      Object.keys(H.ETAPAS).forEach(function (k) { lista.push([k, H.ETAPAS[k]]); });
      if (servico) lista.push(["servico", servico.sigla + " · do serviço"]);
      return lista
        .map(function (f) {
          return '<button type="button" class="chip' + (estado.etapa === f[0] ? " ativo" : "") + '" data-etapa="' + f[0] + '">' + H.esc(f[1]) + "</button>";
        })
        .join("");
    }

    function desenharLista() {
      var lista = filtrar();
      el.querySelector(".lista-objecoes").innerHTML = lista.length
        ? lista.map(function (o) { return itemObjecao(o, opcoes.vars || {}, opcoes.lead); }).join("")
        : '<p class="muted pequeno">Nenhuma objeção encontrada.</p>';
      el.querySelector(".filtros-objecoes").innerHTML = filtros();
    }

    el.innerHTML =
      '<input type="search" class="busca-objecoes" placeholder="Buscar: caro, prazo, fabricam..." aria-label="Buscar objeção">' +
      '<div class="chips filtros-objecoes" style="margin:8px 0 10px"></div>' +
      '<div class="lista-objecoes"></div>';

    el.querySelector(".busca-objecoes").addEventListener("input", function (ev) {
      estado.busca = ev.target.value;
      desenharLista();
    });
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-etapa]");
      if (b) {
        estado.etapa = b.getAttribute("data-etapa");
        desenharLista();
      }
    });
    desenharLista();
  };

  /* Botões "Copiar" em qualquer tela. */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-copiar]");
    if (b) H.copiar(b.getAttribute("data-copiar"));
  });

  /* ---------- resumo da diagnóstica ---------- */

  H.CAMPOS_RESUMO = [
    ["c-dor", "Dor (nas palavras do cliente)"],
    ["c-exemplo", "Exemplo recente"],
    ["g-resultado", "Objetivo"],
    ["ci-negativa", "Custo de não resolver"],
    ["ci-positiva", "Ganho de resolver"],
    ["ci-numeros", "Números para a calculadora"],
    ["t-porque-agora", "Por que agora"],
    ["t-prazo", "Prazo"],
    ["p-tentativas", "O que já tentaram"],
    ["b-faixa", "Faixa de investimento"],
    ["b-pagamento", "Pagamento"],
    ["b-concorrencia", "Concorrência"],
    ["a-decisores", "Quem decide"],
    ["a-criterio", "Critério de escolha"],
    ["a-prazo-decisao", "Prazo para decidir"],
  ];

  H.resumoDiag = function (lead, servicoId, apenas) {
    var r = (lead.diag && lead.diag.respostas) || {};
    var campos = apenas
      ? H.CAMPOS_RESUMO.filter(function (c) { return apenas.indexOf(c[0]) !== -1; })
      : H.CAMPOS_RESUMO;
    var html = campos
      .map(function (c) {
        var v = r[c[0]];
        return "<dt>" + H.esc(c[1]) + "</dt><dd>" + (v ? H.esc(v) : '<span class="muted">—</span>') + "</dd>";
      })
      .join("");
    var s = servicoId && H.servico(servicoId);
    if (s) {
      var tecnicas = s.perguntas
        .filter(function (p) { return r[p.id]; })
        .map(function (p) { return "<dt>" + H.esc(p.texto) + "</dt><dd>" + H.esc(r[p.id]) + "</dd>"; })
        .join("");
      if (tecnicas) html += '<dt style="margin-top:14px;font-weight:600;color:var(--grafite)">' + H.esc(s.nome) + "</dt><dd></dd>" + tecnicas;
    }
    return '<dl class="resumo">' + html + "</dl>";
  };

  /* ---------- agenda do follow-up ---------- */

  H.agendaFup = function (lead) {
    var f = lead.fup;
    if (!f || !f.inicio) return [];
    return H.FUP.cadencia.map(function (t) {
      return {
        toque: t,
        data: t.dia === 0 ? f.inicio : H.somarDiasUteis(f.inicio, t.dia),
        feito: f.toques && f.toques[t.id],
      };
    });
  };

  H.proximoToque = function (lead) {
    if (!lead.fup) return null;
    if (lead.fup.status === "nutricao" && lead.fup.retomarEm) {
      return { toque: { id: "nutricao", canal: "WhatsApp", objetivo: "Retomar o contato" }, data: lead.fup.retomarEm };
    }
    if (lead.fup.status !== "ativo") return null;
    var proximo = H.agendaFup(lead).find(function (x) { return !x.feito; });
    return proximo || null;
  };

  H.situacaoToque = function (t) {
    if (!t) return null;
    var hoje = H.hoje();
    if (t.data < hoje) return { id: "atrasado", rotulo: "Atrasado" };
    if (t.data === hoje) return { id: "hoje", rotulo: "Hoje" };
    return { id: "futuro", rotulo: "Em dia" };
  };
})(window.HUB);
