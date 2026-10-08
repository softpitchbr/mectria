/* Peças usadas em várias telas: ícones, painel lateral (gaveta), dicas ⓘ, campos ligados
   ao lead, micro pactos, guia de objeções, resumo da diagnóstica e agenda do follow-up. */
(function (H) {
  /* ---------- ícones (traço simples, uma cor, como pede o manual) ---------- */

  var ICONES = {
    casa: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    livro: '<path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3z"/><path d="M8 8h6M8 12h6"/>',
    seta: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/>',
    telefone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    conversa: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
    documento: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    enviar: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    ajustes: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    voltar: '<path d="M15 18l-6-6 6-6"/>',
    avancar: '<path d="M9 18l6-6-6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    lista: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    processo: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/>',
    engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  };

  H.icone = function (nome) {
    return '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[nome] || "") + "</svg>";
  };

  /* ---------- gaveta: painel lateral no computador, folha de baixo no celular ---------- */

  H.fecharGaveta = function () {
    document.querySelectorAll(".gaveta, .veu").forEach(function (e) { e.remove(); });
  };

  H.gaveta = function (titulo, preencher) {
    H.fecharGaveta();
    var veu = document.createElement("div");
    veu.className = "veu";
    var g = document.createElement("aside");
    g.className = "gaveta";
    g.setAttribute("role", "dialog");
    g.setAttribute("aria-modal", "true");
    g.setAttribute("aria-label", titulo);
    g.innerHTML =
      '<div class="gaveta-cabeca"><h2>' + H.esc(titulo) + '</h2><button type="button" class="botao-icone" data-fechar aria-label="Fechar">' +
      H.icone("fechar") + '</button></div><div class="gaveta-corpo"></div>';
    document.body.appendChild(veu);
    document.body.appendChild(g);
    veu.addEventListener("click", H.fecharGaveta);
    g.querySelector("[data-fechar]").addEventListener("click", H.fecharGaveta);
    preencher(g.querySelector(".gaveta-corpo"));
    g.querySelector("[data-fechar]").focus();
  };

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") H.fecharGaveta();
  });

  /* ---------- dica ⓘ: escondida até o vendedor pedir ---------- */

  H.botaoInfo = function () {
    return '<button type="button" class="botao-info" data-info aria-expanded="false" aria-label="Ver dica">' + H.icone("info") + "</button>";
  };

  H.textoDica = function (dica) {
    return dica ? '<p class="dica" hidden>' + H.esc(dica) + "</p>" : "";
  };

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-info]");
    if (b) {
      var caixa = b.closest("[data-com-dica]");
      var dica = caixa && caixa.querySelector(".dica");
      if (dica) {
        dica.hidden = !dica.hidden;
        b.setAttribute("aria-expanded", String(!dica.hidden));
      }
      return;
    }
    var c = ev.target.closest("[data-copiar]");
    if (c) H.copiar(c.getAttribute("data-copiar"));
  });

  /* ---------- campos ligados ao lead (data-bind="caminho.no.lead") ---------- */

  H.obter = function (obj, caminho) {
    return String(caminho).split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
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

  H.ligarCampos = function (raiz, lead, aoMudar) {
    function aoEditar(ev) {
      var el = ev.target;
      var caminho = el.getAttribute && el.getAttribute("data-bind");
      if (!caminho) return;
      if (el.type === "radio" && !el.checked) return;
      var valor = el.type === "checkbox" ? el.checked : el.value;
      H.definir(lead, caminho, valor);
      H.tocar(lead);
      H.salvarDepois();
      if (aoMudar) aoMudar(caminho, valor, el);
    }
    raiz.addEventListener("input", aoEditar);
    raiz.addEventListener("change", aoEditar);
  };

  H.campo = function (lead, caminho, tipo, extras) {
    var valor = H.obter(lead, caminho);
    var attrs = ' data-bind="' + H.esc(caminho) + '"' + (extras || "");
    if (tipo === "textarea") return "<textarea" + attrs + ' rows="2">' + H.esc(valor || "") + "</textarea>";
    if (tipo === "checkbox") return '<input type="checkbox"' + attrs + (valor ? " checked" : "") + ">";
    return '<input type="' + tipo + '"' + attrs + ' value="' + H.esc(valor == null ? "" : valor) + '">';
  };

  H.select = function (lead, caminho, opcoes, vazio, extras) {
    var valor = H.obter(lead, caminho) || "";
    return (
      '<select data-bind="' + H.esc(caminho) + '"' + (extras || "") + ">" +
      '<option value="">' + H.esc(vazio || "Escolha") + "</option>" +
      opcoes.map(function (o) {
        var v = typeof o === "string" ? o : o.valor;
        var r = typeof o === "string" ? o : o.rotulo;
        return '<option value="' + H.esc(v) + '"' + (v === valor ? " selected" : "") + ">" + H.esc(r) + "</option>";
      }).join("") +
      "</select>"
    );
  };

  H.rotulado = function (rotulo, html, largo) {
    return '<label class="campo' + (largo ? " campo-largo" : "") + '"><span>' + H.esc(rotulo) + "</span>" + html + "</label>";
  };

  /* Pergunta com campo de resposta. A dica fica no ⓘ. */
  H.pergunta = function (lead, p, base) {
    var caminho = (base || "diag.respostas.") + p.id;
    var valor = H.obter(lead, caminho) || "";
    var idq = "q-" + p.id;
    var entrada;
    if (p.tipo === "texto") entrada = H.campo(lead, caminho, "textarea", ' id="' + idq + '"');
    else if (p.tipo === "numero") entrada = H.campo(lead, caminho, "number", ' id="' + idq + '" min="0" step="any" inputmode="decimal"');
    else if (p.tipo === "opcoes") {
      entrada = '<div class="opcoes" role="radiogroup" aria-labelledby="r-' + p.id + '">' +
        p.opcoes.map(function (o) {
          return '<label><input type="radio" name="' + idq + '" value="' + H.esc(o) + '" data-bind="' + caminho + '"' +
            (valor === o ? " checked" : "") + ">" + H.esc(o) + "</label>";
        }).join("") + "</div>";
    } else entrada = H.campo(lead, caminho, "text", ' id="' + idq + '"');
    var rotulo = p.tipo === "opcoes"
      ? '<span id="r-' + p.id + '" style="flex:1">' + H.esc(p.texto) + "</span>"
      : '<label for="' + idq + '">' + H.esc(p.texto) + "</label>";
    return '<div class="pergunta" data-com-dica><div class="pergunta-texto">' + rotulo + (p.dica ? H.botaoInfo() : "") + "</div>" +
      H.textoDica(p.dica) + entrada + "</div>";
  };

  /* ---------- micro pacto: um botão grande que o vendedor marca ---------- */

  H.botaoPacto = function (lead, caminho, texto) {
    var feito = !!H.obter(lead, caminho);
    return '<button type="button" class="pacto' + (feito ? " feito" : "") + '" aria-pressed="' + feito + '" data-pacto-lead="' + lead.id +
      '" data-pacto-caminho="' + H.esc(caminho) + '"><span class="caixa-check">' + H.icone("check") + "</span><span>" + H.esc(texto) + "</span></button>";
  };

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-pacto-caminho]");
    if (!b) return;
    var lead = H.lead(b.getAttribute("data-pacto-lead"));
    if (!lead) return;
    var caminho = b.getAttribute("data-pacto-caminho");
    var feito = !H.obter(lead, caminho);
    H.definir(lead, caminho, feito);
    H.tocar(lead);
    H.salvar();
    b.classList.toggle("feito", feito);
    b.setAttribute("aria-pressed", String(feito));
    document.dispatchEvent(new CustomEvent("pacto-mudou"));
  });

  /* ---------- passos do modo reunião ---------- */

  H.barraPassos = function (passos, atual, hashBase) {
    return '<nav class="passos" aria-label="Etapas">' +
      passos.map(function (p, i) {
        return '<a class="passo-chip' + (i === atual ? " atual" : "") + (p.feito ? " feito" : "") + '" href="' + hashBase + i + '"' +
          (i === atual ? ' aria-current="step"' : "") + ' data-passo-chip="' + i + '"><span class="ponto"></span>' + H.esc(p.titulo) + "</a>";
      }).join("") + "</nav>";
  };

  H.navegacaoPassos = function (atual, total, hashBase, rotuloFim) {
    var ant = atual > 0
      ? '<a class="botao botao-sec" href="' + hashBase + (atual - 1) + '">' + H.icone("voltar") + "Anterior</a>"
      : "<span></span>";
    var prox = atual < total - 1
      ? '<a class="botao" href="' + hashBase + (atual + 1) + '">Próximo' + H.icone("avancar") + "</a>"
      : (rotuloFim || "<span></span>");
    return '<div class="navegacao">' + ant + prox + "</div>";
  };

  /* ---------- guia de objeções (abre na gaveta) ---------- */

  function itemObjecao(o, vars, lead) {
    var registrar = lead && lead.proposta
      ? '<label class="check pequeno"><input type="checkbox" data-bind="proposta.objecoes.' + o.id + '"' +
        (lead.proposta.objecoes && lead.proposta.objecoes[o.id] ? " checked" : "") + "><span>Apareceu nesta reunião</span></label>"
      : "";
    return '<details class="objecao"><summary><span>' + H.esc(o.objecao) + (o.validar ? ' <span class="selo selo-validar">validar</span>' : "") +
      '</span></summary><div class="corpo">' +
      '<div class="fala">' + H.preencherHTML(o.contorno, vars) + "</div>" +
      '<div class="acoes"><button type="button" class="botao-texto botao-pequeno" data-copiar="' + H.esc(H.preencher(o.contorno, vars)) + '">Copiar</button></div>' +
      '<p class="pequeno muted"><strong>Por trás:</strong> ' + H.esc(o.porTras) + "</p>" +
      (o.prova ? '<p class="pequeno muted"><strong>Prova ou regra:</strong> ' + H.esc(o.prova) + "</p>" : "") +
      registrar + "</div></details>";
  }

  H.abrirObjecoes = function (opcoes) {
    H.gaveta("Objeções", function (corpo) {
      var estado = { etapa: opcoes.etapa || "todas", busca: "" };
      function desenhar() {
        var termo = estado.busca.toLowerCase();
        var lista = H.OBJECOES.filter(function (o) {
          if (estado.etapa !== "todas" && o.etapas.indexOf(estado.etapa) === -1) return false;
          return !termo || (o.objecao + " " + o.contorno).toLowerCase().indexOf(termo) !== -1;
        });
        corpo.querySelector(".lista-objecoes").innerHTML = lista.length
          ? lista.map(function (o) { return itemObjecao(o, opcoes.vars || {}, opcoes.lead); }).join("")
          : '<p class="muted">Nenhuma objeção encontrada.</p>';
        corpo.querySelectorAll("[data-etapa]").forEach(function (c) {
          c.classList.toggle("ativo", c.getAttribute("data-etapa") === estado.etapa);
        });
      }
      var etapas = [["todas", "Todas"]].concat(Object.keys(H.ETAPAS).map(function (k) { return [k, H.ETAPAS[k]]; }));
      corpo.innerHTML =
        '<input type="search" placeholder="Buscar: caro, prazo, fabricam..." aria-label="Buscar objeção">' +
        '<div class="chips" style="margin:12px 0 8px">' +
        etapas.map(function (e) { return '<button type="button" class="chip" data-etapa="' + e[0] + '">' + H.esc(e[1]) + "</button>"; }).join("") +
        '</div><div class="lista-objecoes"></div>';
      corpo.querySelector("input").addEventListener("input", function (ev) {
        estado.busca = ev.target.value;
        desenhar();
      });
      corpo.addEventListener("click", function (ev) {
        var c = ev.target.closest("[data-etapa]");
        if (c) {
          estado.etapa = c.getAttribute("data-etapa");
          desenhar();
        }
      });
      if (opcoes.lead) H.ligarCampos(corpo, opcoes.lead);
      desenhar();
    });
  };

  /* ---------- resumo da diagnóstica ---------- */

  H.CAMPOS_RESUMO = [
    ["c-dor", "Dor (nas palavras do cliente)"],
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

  H.resumoDiag = function (lead, servicoId) {
    var r = (lead.diag && lead.diag.respostas) || {};
    var preenchidos = H.CAMPOS_RESUMO.filter(function (c) { return r[c[0]]; });
    var html = preenchidos.map(function (c) { return "<dt>" + H.esc(c[1]) + "</dt><dd>" + H.esc(r[c[0]]) + "</dd>"; }).join("");
    var s = servicoId && H.servico(servicoId);
    if (s) {
      html += s.perguntas.filter(function (p) { return r[p.id]; })
        .map(function (p) { return "<dt>" + H.esc(p.texto) + "</dt><dd>" + H.esc(r[p.id]) + "</dd>"; }).join("");
    }
    return html ? '<dl class="resumo">' + html + "</dl>" : '<p class="muted">Nada registrado ainda.</p>';
  };

  H.abrirResumo = function (lead, servicoId) {
    H.gaveta("Coletado na diagnóstica", function (corpo) {
      corpo.innerHTML = H.resumoDiag(lead, servicoId) +
        '<p style="margin-top:20px"><a href="#/playbooks/diagnostica/' + lead.id + '" class="pequeno">Abrir a diagnóstica</a></p>';
      corpo.querySelector("a").addEventListener("click", H.fecharGaveta);
    });
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
    return H.agendaFup(lead).find(function (x) { return !x.feito; }) || null;
  };

  H.situacaoToque = function (t) {
    if (!t) return null;
    var hoje = H.hoje();
    if (t.data < hoje) return { id: "atrasado", rotulo: "Atrasado" };
    if (t.data === hoje) return { id: "hoje", rotulo: "Hoje" };
    return { id: "futuro", rotulo: "Em dia" };
  };

  H.seloStatus = function (lead) {
    var s = H.statusLead(lead);
    return '<span class="selo selo-' + s.id + '">' + H.esc(s.rotulo) + "</span>";
  };

  H.siglas = function (lead) {
    return (lead.servicos || []).map(function (id) { var s = H.servico(id); return s ? s.sigla : ""; }).filter(Boolean).join(" · ");
  };
})(window.HUB);
