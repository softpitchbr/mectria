/* Playbook da reunião diagnóstica: roteiro, perguntas GPCTBA + C&I, roteador de serviços,
   perguntas técnicas por serviço e o briefing em PDF para Projetos. */
(function (H) {
  var ROTULOS_PDF = {
    "g-resultado": "Resultado esperado",
    "g-medida": "Como medir o sucesso",
    "g-maior": "Objetivo maior da empresa",
    "p-tentativas": "O que já tentaram",
    "p-alternativa": "Plano sem a MecTRIA",
    "p-interno": "Equipe interna",
    "c-dor": "Dor principal (palavras do cliente)",
    "c-exemplo": "Exemplo recente",
    "c-impedimento": "O que atrapalha resolver",
    "t-porque-agora": "Por que agora",
    "t-prazo": "Prazo desejado",
    "b-faixa": "Faixa de investimento",
    "b-pagamento": "Forma de pagamento",
    "b-concorrencia": "Concorrência",
    "b-sensibilidade": "Sensibilidade a preço (leitura do vendedor)",
    "a-decisores": "Quem decide",
    "a-processo": "Processo de aprovação",
    "a-criterio": "Critério de escolha",
    "a-prazo-decisao": "Prazo para decidir",
    "a-presenca": "Quem decide vai à apresentação",
    "ci-negativa": "Custo de não resolver",
    "ci-numeros": "Números para a calculadora",
    "ci-positiva": "Ganho de resolver",
    "e-incluido": "Incluído e não incluído",
    "e-normas": "Normas",
    "e-art": "Precisa de ART",
    "e-custos": "Custos diretos",
  };

  function campoRotulado(rotulo, html, largo) {
    return '<label class="campo' + (largo ? " campo-largo" : "") + '"><span>' + H.esc(rotulo) + "</span>" + html + "</label>";
  }

  function pergunta(lead, p, letra) {
    var caminho = "diag.respostas." + p.id;
    var valor = H.obter(lead, caminho) || "";
    var idq = "q-" + p.id;
    var entrada;
    if (p.tipo === "texto") entrada = H.campo(lead, caminho, "textarea", ' id="' + idq + '"');
    else if (p.tipo === "numero") entrada = H.campo(lead, caminho, "number", ' id="' + idq + '" min="0" step="any" inputmode="decimal"');
    else if (p.tipo === "opcoes") {
      entrada =
        '<div class="opcoes" role="radiogroup" aria-labelledby="r-' + p.id + '">' +
        p.opcoes
          .map(function (o) {
            return '<label><input type="radio" name="' + idq + '" value="' + H.esc(o) + '" data-bind="' + caminho + '"' +
              (valor === o ? " checked" : "") + ">" + H.esc(o) + "</label>";
          })
          .join("") +
        "</div>";
    } else entrada = H.campo(lead, caminho, "text", ' id="' + idq + '"');

    var rotulo = p.tipo === "opcoes"
      ? '<span class="rotulo" id="r-' + p.id + '">' + H.esc(p.texto) + "</span>"
      : '<label for="' + idq + '">' + H.esc(p.texto) + "</label>";
    return '<div class="pergunta">' + rotulo + entrada + (p.dica ? '<p class="dica">' + H.esc(p.dica) + "</p>" : "") + "</div>";
  }

  /* ---------- lista ---------- */

  function lista(el) {
    var D = H.DIAGNOSTICA;
    var leads = H.estado.leads.slice().sort(function (a, b) {
      return (b.atualizadoEm || "").localeCompare(a.atualizadoEm || "");
    });
    el.innerHTML =
      H.subnavPlaybooks("diagnostica") +
      "<h1>Reunião diagnóstica</h1>" +
      '<p class="sub">O vendedor sabe desde o começo da conversa tudo o que precisa perguntar: as perguntas comerciais ' +
      "(GPCTBA + C&amp;I) e as perguntas técnicas de cada serviço da Carta. No fim, sai o briefing em PDF para Projetos.</p>" +

      '<div class="grade-2" style="margin-bottom:28px">' +
      '<div class="cartao"><h2>Nova diagnóstica</h2>' +
      '<form id="form-nova" class="campos">' +
      '<label class="campo"><span>Empresa</span><input id="nova-empresa" required></label>' +
      '<label class="campo"><span>Contato</span><input id="nova-contato"></label>' +
      '<label class="campo"><span>Telefone ou WhatsApp</span><input id="nova-telefone" type="tel"></label>' +
      '<label class="campo"><span>Origem do lead</span><select id="nova-origem"><option value="">Escolha</option>' +
      D.origens.map(function (o) { return "<option>" + H.esc(o) + "</option>"; }).join("") + "</select></label>" +
      '<label class="campo"><span>Data da diagnóstica</span><input id="nova-data" type="date" value="' + H.hoje() + '"></label>' +
      '<div class="campo" style="align-self:end"><button type="submit">Começar</button></div>' +
      "</form></div>" +

      '<div class="painel-nevoa"><h2>O que perguntar</h2><ul class="lista-limpa pequeno">' +
      D.blocos.map(function (b) {
        return '<li style="margin-bottom:6px"><span class="letra" style="min-width:30px;height:24px;font-size:12px">' + H.esc(b.letra) +
          "</span> <strong>" + H.esc(b.titulo) + ":</strong> " + H.esc(b.intro) + "</li>";
      }).join("") +
      '<li style="margin-top:10px">O <strong>roteador de serviços</strong> mostra, conforme o cliente fala, qual serviço explorar e o que perguntar.</li>' +
      "</ul></div></div>" +

      "<h2>Leads</h2>" +
      (leads.length
        ? '<div class="rolagem-x"><table class="tabela"><thead><tr><th>Empresa</th><th>Contato</th><th>Serviço</th><th>Diagnóstica</th><th>Situação</th></tr></thead><tbody>' +
          leads.map(function (l) {
            return '<tr class="clicavel" data-abrir="' + l.id + '"><td><a href="#/playbooks/diagnostica/' + l.id + '">' +
              H.esc(l.empresa || "Sem nome") + "</a></td><td>" + H.esc(l.contato) + "</td><td>" +
              H.esc((l.servicos || []).map(function (id) { var s = H.servico(id); return s ? s.sigla : id; }).join(", ")) +
              "</td><td>" + H.data(l.diag && l.diag.data) + "</td><td>" + H.seloStatus(l) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>"
        : '<p class="vazio">Nenhum lead ainda. Comece uma diagnóstica acima ou marque uma pelo playbook de cold call.</p>');

    el.querySelector("#form-nova").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var lead = H.novoLead({
        empresa: el.querySelector("#nova-empresa").value.trim(),
        contato: el.querySelector("#nova-contato").value.trim(),
        telefone: el.querySelector("#nova-telefone").value.trim(),
        origem: el.querySelector("#nova-origem").value,
        diag: { respostas: {}, data: el.querySelector("#nova-data").value },
      });
      H.ir("#/playbooks/diagnostica/" + lead.id);
    });
    el.addEventListener("click", function (ev) {
      var tr = ev.target.closest("[data-abrir]");
      if (tr && !ev.target.closest("a")) H.ir("#/playbooks/diagnostica/" + tr.getAttribute("data-abrir"));
    });
  }

  /* ---------- editor ---------- */

  function secoes(lead) {
    var D = H.DIAGNOSTICA;
    var r = lead.diag.respostas;
    function respondidas(perguntas) {
      return perguntas.filter(function (p) { return r[p.id]; }).length;
    }
    var perguntasServicos = D.escopoGeral.slice();
    lead.servicos.forEach(function (id) {
      var s = H.servico(id);
      if (s) perguntasServicos = perguntasServicos.concat(s.perguntas);
    });
    var prep = lead.diag.prep || {};
    var lista = [
      { id: "identificacao", titulo: "Identificação", feito: ["empresa", "contato", "telefone", "origem"].filter(function (k) { return lead[k]; }).length + (lead.diag.data ? 1 : 0), total: 5 },
      { id: "preparacao", titulo: "Preparação", feito: Object.keys(prep).filter(function (k) { return prep[k]; }).length, total: D.preparacao.length },
      { id: "abertura", titulo: "Abertura", feito: lead.diag.pactoAgenda ? 1 : 0, total: 1 },
    ];
    D.blocos.forEach(function (b) {
      lista.push({ id: b.id, titulo: b.letra + " · " + b.titulo, feito: respondidas(b.perguntas), total: b.perguntas.length });
    });
    lista.push({ id: "servicos", titulo: "Serviço e escopo", feito: respondidas(perguntasServicos), total: perguntasServicos.length });
    lista.push({
      id: "fechamento",
      titulo: "Fechamento",
      feito: (lead.diag.resumoConfirmado ? 1 : 0) + (lead.diag.pactoCriterio ? 1 : 0) + (lead.diag.dataProposta ? 1 : 0),
      total: 3,
    });
    return lista;
  }

  function qualificacao(lead) {
    var r = lead.diag.respostas;
    return [
      { texto: "Dor real e com impacto", ok: !!(r["c-dor"] && r["ci-negativa"]) },
      { texto: "Serviço da Carta identificado", ok: lead.servicos.length > 0 },
      { texto: "Quem decide identificado", ok: !!r["a-decisores"] },
      { texto: "Prazo definido", ok: !!r["t-prazo"] },
      { texto: "Faixa de investimento compatível", ok: !!lead.diag.faixaCompativel },
      { texto: "Apresentação da proposta marcada", ok: !!lead.diag.dataProposta },
    ];
  }

  function editor(el, lead) {
    var D = H.DIAGNOSTICA;
    lead.diag = lead.diag || {};
    lead.diag.respostas = lead.diag.respostas || {};
    lead.servicos = lead.servicos || [];
    var ativos = H.servicosAtivos();

    var secIdentificacao =
      '<section class="bloco cartao" id="sec-identificacao"><div class="bloco-titulo"><h2>Identificação</h2></div><div class="campos">' +
      campoRotulado("Empresa", H.campo(lead, "empresa", "text")) +
      campoRotulado("Contato", H.campo(lead, "contato", "text")) +
      campoRotulado("Cargo", H.campo(lead, "cargo", "text")) +
      campoRotulado("Telefone ou WhatsApp", H.campo(lead, "telefone", "tel")) +
      campoRotulado("E-mail", H.campo(lead, "email", "email")) +
      campoRotulado("Cidade", H.campo(lead, "cidade", "text")) +
      campoRotulado("Segmento", H.campo(lead, "segmento", "text")) +
      campoRotulado("Origem do lead", H.select(lead, "origem", D.origens)) +
      campoRotulado("Data da diagnóstica", H.campo(lead, "diag.data", "date")) +
      campoRotulado("Formato", H.select(lead, "diag.formato", D.formatos)) +
      campoRotulado("Quem vai pela MecTRIA", H.campo(lead, "diag.participantes", "text"), true) +
      "</div></section>";

    var secPreparacao =
      '<section class="bloco cartao" id="sec-preparacao"><div class="bloco-titulo"><h2>Preparação</h2></div>' +
      '<p class="muted pequeno">10 minutos antes da reunião.</p>' +
      D.preparacao.map(function (t, i) {
        return '<label class="check">' + H.campo(lead, "diag.prep." + i, "checkbox") + "<span>" + H.esc(t) + "</span></label>";
      }).join("") +
      '<div class="pergunta"><label for="hipotese">Hipótese de dor</label>' + H.campo(lead, "diag.hipotese", "textarea", ' id="hipotese"') + "</div>" +
      "</section>";

    var secAbertura =
      '<section class="bloco cartao" id="sec-abertura"><div class="bloco-titulo"><h2>Abertura</h2></div>' +
      D.abertura.map(function (a) {
        return "<h3>" + H.esc(a.titulo) + '</h3><div class="fala" data-modelo="' + H.esc(a.fala) + '"></div>' +
          (a.dica ? '<p class="dica">' + H.esc(a.dica) + "</p>" : "") +
          (a.pacto ? '<p><label class="pacto-check">' + H.campo(lead, "diag.pactoAgenda", "checkbox") + H.esc(a.pacto) + "</label></p>" : "");
      }).join("") +
      "</section>";

    var secBlocos = D.blocos.map(function (b) {
      return '<section class="bloco cartao" id="sec-' + b.id + '"><div class="bloco-titulo"><span class="letra">' + H.esc(b.letra) +
        "</span><h2>" + H.esc(b.titulo) + '</h2></div><p class="muted pequeno">' + H.esc(b.intro) + "</p>" +
        b.perguntas.map(function (p) { return pergunta(lead, p, b.letra); }).join("") + "</section>";
    }).join("");

    var secServicos =
      '<section class="bloco cartao" id="sec-servicos"><div class="bloco-titulo"><span class="letra">S</span><h2>Serviço e escopo técnico</h2></div>' +
      '<p class="muted pequeno">Marque o serviço quando a dor apontar para ele (o roteador ao lado ajuda). As perguntas técnicas aparecem aqui e vão para o briefing de Projetos.</p>' +
      '<div class="chips">' +
      ativos.map(function (s) {
        return '<button type="button" class="chip' + (lead.servicos.indexOf(s.id) !== -1 ? " ativo" : "") + '" data-servico="' + s.id + '">' + H.esc(s.nome) + "</button>";
      }).join("") +
      "</div>" +
      (lead.servicos.length
        ? lead.servicos.map(function (id) {
            var s = H.servico(id);
            if (!s) return "";
            return '<div class="servico-bloco"><h3>' + H.esc(s.nome) + ' <span class="selo">' + H.esc(s.sigla) + "</span></h3>" +
              '<div class="entrega-foco"><div><h4>O que entregamos</h4><ul>' +
              s.entregamos.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") +
              "</ul></div><div><h4>Fica com o cliente" + (s.ficaComClienteValidar ? H.seloValidar() : "") + "</h4><ul>" +
              s.ficaComCliente.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") +
              "</ul></div></div>" +
              s.perguntas.map(function (p) { return pergunta(lead, p); }).join("") +
              '<p class="dica">Na planilha: ' + H.esc(s.precificacao) + "</p></div>";
          }).join("")
        : '<p class="vazio" style="margin-top:12px">Nenhum serviço marcado ainda.</p>') +
      '<h3 style="margin-top:18px">Escopo geral</h3>' +
      D.escopoGeral.map(function (p) { return pergunta(lead, p); }).join("") +
      "</section>";

    var secFechamento =
      '<section class="bloco cartao" id="sec-fechamento"><div class="bloco-titulo"><h2>Fechamento da diagnóstica</h2></div>' +
      '<h3>1. Resumo</h3><div class="fala" data-modelo="' + H.esc(D.fechamento.resumo) + '"></div>' +
      '<label class="check">' + H.campo(lead, "diag.resumoConfirmado", "checkbox") + "<span>O cliente confirmou o resumo</span></label>" +
      '<h3 style="margin-top:16px">2. Micro pacto de critério</h3><div class="fala" data-modelo="' + H.esc(D.fechamento.pacto) + '"></div>' +
      '<p class="dica">' + H.esc(D.fechamento.pactoDica) + "</p>" +
      '<p><label class="pacto-check">' + H.campo(lead, "diag.pactoCriterio", "checkbox") + "Pacto feito</label></p>" +
      '<h3 style="margin-top:16px">3. Apresentação da proposta marcada</h3><div class="fala" data-modelo="' + H.esc(D.fechamento.agendamento) + '"></div>' +
      '<p class="dica">' + H.esc(D.fechamento.agendamentoDica) + "</p>" +
      '<div class="campos">' +
      campoRotulado("Data", H.campo(lead, "diag.dataProposta", "date", ' id="data-proposta"')) +
      campoRotulado("Hora", H.campo(lead, "diag.horaProposta", "time")) +
      campoRotulado("Formato", H.select(lead, "diag.formatoProposta", D.formatos)) +
      campoRotulado("Quem participa", H.campo(lead, "diag.participantesProposta", "text")) +
      "</div>" +
      '<p><button type="button" class="botao-texto botao-pequeno" id="sugerir-data">Sugerir a data pelo fluxo de ' + H.EMPRESA.regras.diasParaProposta + " dias úteis</button></p>" +
      '<h3 style="margin-top:16px">4. Qualificação</h3><ul class="lista-limpa" id="qualificacao"></ul>' +
      '<label class="check">' + H.campo(lead, "diag.faixaCompativel", "checkbox") + "<span>A faixa de investimento é compatível com o piso da planilha</span></label>" +
      '<p class="dica">Não qualificou agora? Combine uma data para retomar e registre nas notas.</p>' +
      '<h3 style="margin-top:16px">5. Depois da reunião</h3>' +
      D.depois.map(function (t, i) {
        return '<label class="check">' + H.campo(lead, "diag.depois." + i, "checkbox") + "<span>" + H.esc(t) + "</span></label>";
      }).join("") +
      '<div class="fala mensagem" id="resumo-cliente"></div>' +
      '<div class="acoes"><button type="button" class="botao-sec" id="copiar-resumo">Copiar resumo para o cliente</button>' +
      '<a class="botao botao-sec" id="whats-resumo" target="_blank" rel="noopener">Abrir no WhatsApp</a>' +
      '<button type="button" class="botao-destaque" data-acao="pdf">Gerar PDF para Projetos</button></div>' +
      '<div class="pergunta" style="margin-top:16px"><label for="notas-diag">Notas</label>' + H.campo(lead, "diag.notas", "textarea", ' id="notas-diag" rows="4"') + "</div>" +
      "</section>";

    el.innerHTML =
      H.subnavPlaybooks("diagnostica") +
      '<div class="cabecalho-tela"><div><a class="pequeno" href="#/playbooks/diagnostica">← Todas as diagnósticas</a>' +
      '<h1 id="titulo-lead">' + H.esc(lead.empresa || "Lead sem nome") + "</h1>" +
      '<p class="sub">Reunião diagnóstica · ' + H.esc(D.duracao) + " · " + H.seloStatus(lead) + "</p></div>" +
      '<div class="acoes"><button type="button" class="botao-destaque" data-acao="pdf">Gerar PDF para Projetos</button>' +
      '<a class="botao botao-sec" href="#/playbooks/proposta/' + lead.id + '">Ir para a proposta</a></div></div>' +

      '<div class="tres-colunas">' +
      '<aside class="coluna-fixa"><nav class="nav-blocos" id="nav-blocos" aria-label="Blocos da diagnóstica"></nav>' +
      '<p style="margin-top:16px"><button type="button" class="botao-texto botao-pequeno" id="excluir-lead">Excluir este lead</button></p></aside>' +
      "<div>" + secIdentificacao + secPreparacao + secAbertura + secBlocos + secServicos + secFechamento + "</div>" +
      '<aside class="lateral coluna-fixa">' +
      "<h3>Roteador de serviços</h3>" +
      '<p class="muted pequeno" style="margin-top:-4px">Se o cliente falar disso, explore o serviço. Clique para incluir as perguntas técnicas.</p>' +
      '<div class="roteador">' +
      ativos.map(function (s) {
        return '<button type="button" class="' + (lead.servicos.indexOf(s.id) !== -1 ? "ativo" : "") + '" data-servico="' + s.id + '"><strong>' +
          H.esc(s.nome) + "</strong><span>" + H.esc(s.pistas.slice(0, 4).join(" · ")) + "</span></button>";
      }).join("") +
      "</div>" +
      '<h3>Resumo ao vivo</h3><div id="resumo-vivo"></div>' +
      '<h3>Objeções na diagnóstica</h3><div id="guia-diag"></div>' +
      "</aside></div>";

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "empresa") el.querySelector("#titulo-lead").textContent = lead.empresa || "Lead sem nome";
      atualizar(el, lead);
    });

    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-servico]");
      if (b) {
        var id = b.getAttribute("data-servico");
        var i = lead.servicos.indexOf(id);
        if (i === -1) lead.servicos.push(id);
        else lead.servicos.splice(i, 1);
        H.tocar(lead);
        H.salvar();
        H.rerender();
        return;
      }
      if (ev.target.closest('[data-acao="pdf"]')) H.imprimirBriefing(lead);
    });

    el.querySelector("#sugerir-data").addEventListener("click", function () {
      var base = lead.diag.data || H.hoje();
      lead.diag.dataProposta = H.somarDiasUteis(base, H.EMPRESA.regras.diasParaProposta - 1);
      el.querySelector("#data-proposta").value = lead.diag.dataProposta;
      H.tocar(lead);
      H.salvar();
      atualizar(el, lead);
    });

    el.querySelector("#copiar-resumo").addEventListener("click", function () {
      H.copiar(H.preencher(D.resumoCliente, H.variaveis(lead)));
    });

    el.querySelector("#excluir-lead").addEventListener("click", function () {
      if (confirm("Excluir " + (lead.empresa || "este lead") + "? Isso apaga a diagnóstica, a proposta e o follow-up dele.")) {
        H.removerLead(lead.id);
        H.ir("#/playbooks/diagnostica");
      }
    });

    H.montarGuiaObjecoes(el.querySelector("#guia-diag"), { etapa: "diagnostica", vars: H.variaveis(lead) });
    atualizar(el, lead);
  }

  /* Atualiza o que depende das respostas sem redesenhar a tela (mantém o foco). */
  function atualizar(el, lead) {
    var vars = H.variaveis(lead);
    vars.dias = String(H.EMPRESA.regras.diasParaProposta);

    el.querySelector("#nav-blocos").innerHTML = secoes(lead).map(function (s) {
      var completo = s.total && s.feito >= s.total;
      return '<a href="#sec-' + s.id + '" data-rolar="sec-' + s.id + '"><span>' + H.esc(s.titulo) + '</span><span class="progresso' +
        (completo ? " completo" : "") + '">' + s.feito + "/" + s.total + "</span></a>";
    }).join("");

    el.querySelectorAll("[data-modelo]").forEach(function (f) {
      f.innerHTML = H.preencherHTML(f.getAttribute("data-modelo"), vars);
    });

    el.querySelector("#qualificacao").innerHTML = qualificacao(lead).map(function (q) {
      return '<li style="margin-bottom:4px">' + (q.ok ? '<span class="var">✓</span> ' : '<span class="muted">○</span> ') + H.esc(q.texto) + "</li>";
    }).join("");

    el.querySelector("#resumo-vivo").innerHTML = H.resumoDiag(lead, null, ["c-dor", "g-resultado", "ci-negativa", "t-prazo", "b-faixa", "a-decisores", "a-criterio"]);

    var textoResumo = H.preencher(H.DIAGNOSTICA.resumoCliente, vars);
    el.querySelector("#resumo-cliente").innerHTML = H.preencherHTML(H.DIAGNOSTICA.resumoCliente, vars);
    var whats = el.querySelector("#whats-resumo");
    var link = H.linkWhatsApp(lead.telefone, textoResumo);
    if (link) {
      whats.href = link;
      whats.removeAttribute("aria-disabled");
    } else {
      whats.removeAttribute("href");
      whats.setAttribute("aria-disabled", "true");
      whats.title = "Preencha o telefone do contato";
    }
  }

  /* Os links do menu lateral rolam até o bloco sem mexer na rota. */
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("[data-rolar]");
    if (!a) return;
    ev.preventDefault();
    var alvo = document.getElementById(a.getAttribute("data-rolar"));
    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- briefing em PDF ---------- */

  H.imprimirBriefing = function (lead) {
    var D = H.DIAGNOSTICA;
    var r = lead.diag.respostas || {};

    function valor(v) {
      return v ? H.esc(v) : '<span class="vazio-doc">não coletado</span>';
    }
    function linha(rotulo, v) {
      return "<tr><th>" + H.esc(rotulo) + "</th><td>" + valor(v) + "</td></tr>";
    }
    function tabela(linhas) {
      return "<table><tbody>" + linhas.join("") + "</tbody></table>";
    }
    function porIds(ids) {
      return tabela(ids.map(function (id) { return linha(ROTULOS_PDF[id] || id, r[id]); }));
    }
    function porPerguntas(perguntas) {
      return tabela(perguntas.map(function (p) { return linha(p.texto, r[p.id]); }));
    }

    var servicos = (lead.servicos || []).map(H.servico).filter(Boolean);
    var nomes = servicos.map(function (s) { return s.nome; }).join(", ");
    var dataDiag = lead.diag.data || H.hoje();
    var vendedor = lead.vendedor || H.estado.vendedor;

    var escopo = servicos.map(function (s) {
      return "<h3>" + H.esc(s.nome) + "</h3>" +
        porPerguntas(s.perguntas.filter(function (p) { return p.bloco === "escopo"; })) +
        '<p class="nota"><strong>Entregamos:</strong> ' + H.esc(s.entregamos.join("; ")) +
        ". <strong>Fica com o cliente:</strong> " + H.esc(s.ficaComCliente.join("; ")) + ".</p>";
    }).join("");

    var parametros = servicos.map(function (s) {
      return "<h3>" + H.esc(s.nome) + "</h3>" +
        porPerguntas(s.perguntas.filter(function (p) { return p.bloco === "parametros"; })) +
        '<p class="nota">Na planilha: ' + H.esc(s.precificacao) + "</p>";
    }).join("");

    var html =
      '<div class="briefing">' +
      '<img class="logo" src="assets/logo-mectria.png" alt="MecTRIA">' +
      '<div class="barra">Briefing da reunião diagnóstica</div>' +
      '<p class="meta">Para: Projetos · ' + H.esc(lead.empresa || "") + " · Diagnóstica em " + H.data(dataDiag) +
      " · Responsável comercial: " + H.esc(vendedor || "não informado") + " · Gerado em " + H.data(H.hoje()) + "</p>" +

      "<h2>1. Identificação</h2>" +
      tabela([
        linha("Cliente", lead.empresa),
        linha("Contato", [lead.contato, lead.cargo].filter(Boolean).join(" · ")),
        linha("Telefone", lead.telefone),
        linha("E-mail", lead.email),
        linha("Cidade", lead.cidade),
        linha("Segmento", lead.segmento),
        linha("Origem do lead", lead.origem),
        linha("Formato da reunião", lead.diag.formato),
        linha("Quem foi pela MecTRIA", lead.diag.participantes),
        linha("Serviço provável", nomes),
      ]) +

      "<h2>2. Contexto e objetivo</h2>" +
      porIds(["c-dor", "c-exemplo", "c-impedimento", "g-resultado", "g-medida", "g-maior", "p-tentativas", "p-alternativa", "p-interno", "t-porque-agora", "ci-negativa", "ci-positiva", "ci-numeros"]) +

      "<h2>3. Escopo técnico</h2>" +
      (escopo || '<p class="vazio-doc">Nenhum serviço marcado na diagnóstica.</p>') +
      "<h3>Escopo geral</h3>" + porIds(["e-incluido", "e-normas", "e-art", "e-custos"]) +

      "<h2>4. Parâmetros para a planilha</h2>" +
      (parametros || '<p class="vazio-doc">Nenhum serviço marcado na diagnóstica.</p>') +
      tabela([linha("Prazo desejado", r["t-prazo"])]) +

      "<h2>5. Comercial</h2>" +
      porIds(["b-faixa", "b-pagamento", "b-concorrencia", "b-sensibilidade"]) +

      "<h2>6. Decisão</h2>" +
      porIds(["a-decisores", "a-processo", "a-criterio", "a-prazo-decisao", "a-presenca"]) +

      "<h2>Próximo passo</h2>" +
      tabela([
        linha("Apresentação da proposta", lead.diag.dataProposta ? H.data(lead.diag.dataProposta) + (lead.diag.horaProposta ? " às " + lead.diag.horaProposta : "") : ""),
        linha("Formato", lead.diag.formatoProposta),
        linha("Quem participa", lead.diag.participantesProposta),
        linha("Estimativa técnica (Projetos)", "Dia 1, à tarde: " + H.data(dataDiag)),
        linha("Precificação e validação", "Dia 2: " + H.data(H.somarDiasUteis(dataDiag, 1))),
      ]) +

      "<h2>Qualificação</h2>" +
      tabela(qualificacao(lead).map(function (q) { return "<tr><th>" + H.esc(q.texto) + "</th><td>" + (q.ok ? "Sim" : "Não") + "</td></tr>"; })) +

      "<h2>Hipótese inicial e notas</h2>" +
      tabela([linha("Hipótese de dor", lead.diag.hipotese), linha("Notas do vendedor", lead.diag.notas)]) +

      '<p class="rodape">MecTRIA · ' + H.esc(H.EMPRESA.assinatura) + " · " + H.esc(H.EMPRESA.site) + " · " + H.esc(H.EMPRESA.email) +
      " · Documento interno, não enviar ao cliente.</p>" +
      "</div>";

    var area = document.getElementById("impressao");
    area.innerHTML = html;
    var tituloOriginal = document.title;
    document.title = "Briefing " + (lead.empresa || "lead") + " " + H.data(dataDiag).replace(/\//g, "-");
    function restaurar() {
      document.title = tituloOriginal;
      window.removeEventListener("afterprint", restaurar);
    }
    window.addEventListener("afterprint", restaurar);
    var logo = area.querySelector("img");
    if (logo.complete) window.print();
    else logo.onload = logo.onerror = function () { window.print(); };
  };

  H.telas.diagnostica = {
    render: function (el, id) {
      var lead = id && H.lead(id);
      if (!lead) lista(el);
      else editor(el, lead);
    },
  };
})(window.HUB);
