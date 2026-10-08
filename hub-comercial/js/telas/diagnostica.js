/* Playbook da reunião diagnóstica em modo reunião: uma etapa por vez.
   Etapas: Cliente · Abertura · G · P · C · T · B · A · C&I · Serviço · Fechamento.
   Resumo, objeções e o roteador de serviços abrem no painel lateral. No fim, o briefing em PDF. */
(function (H) {
  var BASE = "#/playbooks/diagnostica/";
  var TITULOS = { objetivos: "Objetivos", planos: "Planos", desafios: "Desafios", prazo: "Prazo", orcamento: "Orçamento", autoridade: "Decisão", consequencias: "Impacto" };

  /* ---------- nova diagnóstica (também usada no Início) ---------- */

  H.novaDiagnostica = function () {
    var D = H.DIAGNOSTICA;
    H.gaveta("Nova diagnóstica", function (corpo) {
      corpo.innerHTML =
        '<form style="display:grid;gap:14px">' +
        H.rotulado("Empresa", '<input name="empresa" required>') +
        H.rotulado("Contato", '<input name="contato">') +
        H.rotulado("Telefone ou WhatsApp", '<input name="telefone" type="tel">') +
        H.rotulado("Origem do lead", '<select name="origem"><option value="">Escolha</option>' +
          D.origens.map(function (o) { return "<option>" + H.esc(o) + "</option>"; }).join("") + "</select>") +
        H.rotulado("Data da diagnóstica", '<input name="data" type="date" value="' + H.hoje() + '">') +
        '<button type="submit">Começar</button></form>';
      corpo.querySelector("form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        var f = ev.target;
        var lead = H.novoLead({
          empresa: f.empresa.value.trim(),
          contato: f.contato.value.trim(),
          telefone: f.telefone.value.trim(),
          origem: f.origem.value,
          diag: { respostas: {}, data: f.data.value },
        });
        H.fecharGaveta();
        H.ir(BASE + lead.id + "/0");
      });
    });
  };

  /* ---------- lista ---------- */

  function lista(el) {
    var leads = H.estado.leads.slice().sort(function (a, b) {
      return (b.atualizadoEm || "").localeCompare(a.atualizadoEm || "");
    });
    el.innerHTML =
      '<div class="estreita"><a class="voltar" href="#/playbooks">' + H.icone("voltar") + "Playbooks</a>" +
      '<div class="cabeca" style="margin-top:8px"><h1>Reunião diagnóstica</h1>' +
      '<button type="button" id="nova">' + H.icone("mais") + "Nova</button></div>" +
      (leads.length
        ? '<div class="linhas">' + leads.map(function (l) {
            var meta = [l.contato, H.siglas(l), H.data(l.diag && l.diag.data)].filter(Boolean).join(" · ");
            return '<a class="linha" href="' + BASE + l.id + '/0"><div class="linha-texto"><strong>' + H.esc(l.empresa || "Sem nome") +
              "</strong><small>" + H.esc(meta) + "</small></div>" + H.seloStatus(l) + H.icone("avancar") + "</a>";
          }).join("") + "</div>"
        : '<p class="vazio">Nenhuma diagnóstica ainda.</p>') +
      "</div>";
    el.querySelector("#nova").addEventListener("click", H.novaDiagnostica);
  }

  /* ---------- etapas ---------- */

  function etapas(lead) {
    var D = H.DIAGNOSTICA;
    var r = lead.diag.respostas;
    function algum(perguntas) { return perguntas.some(function (p) { return r[p.id]; }); }
    var lista = [
      { id: "cliente", titulo: "Cliente", feito: !!(lead.empresa && lead.contato) },
      { id: "abertura", titulo: "Abertura", feito: !!lead.diag.pactoAgenda },
    ];
    D.blocos.forEach(function (b) {
      lista.push({ id: b.id, titulo: TITULOS[b.id] || b.titulo, bloco: b, feito: algum(b.perguntas) });
    });
    var tecnicas = [];
    lead.servicos.forEach(function (id) { var s = H.servico(id); if (s) tecnicas = tecnicas.concat(s.perguntas); });
    lista.push({ id: "servico", titulo: "Serviço", feito: lead.servicos.length > 0 && algum(tecnicas) });
    lista.push({ id: "fechamento", titulo: "Fechamento", feito: !!lead.diag.dataProposta });
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

  /* roteador: o vendedor busca pelo que o cliente falou e marca o serviço */
  function roteador(lead, termo) {
    var t = (termo || "").toLowerCase().trim();
    return H.servicosAtivos().map(function (s) {
      var bate = t && (s.nome + " " + s.pistas.join(" ")).toLowerCase().indexOf(t) !== -1;
      var ativo = lead.servicos.indexOf(s.id) !== -1;
      return '<button type="button" class="chip' + (ativo ? " ativo" : bate ? " sugerido" : "") + '" data-servico="' + s.id + '"' +
        (t && !bate && !ativo ? ' style="opacity:.45"' : "") + ">" + H.esc(s.nome) + "</button>";
    }).join("");
  }

  function alternarServico(lead, id) {
    var i = lead.servicos.indexOf(id);
    if (i === -1) lead.servicos.push(id);
    else lead.servicos.splice(i, 1);
    H.tocar(lead);
    H.salvar();
  }

  function corpoEtapa(lead, etapa) {
    var D = H.DIAGNOSTICA;
    if (etapa.id === "cliente") {
      var prep = lead.diag.prep || {};
      var feitos = D.preparacao.filter(function (x, i) { return prep[i]; }).length;
      return '<div class="etapa-titulo"><h2>Cliente</h2></div><p class="etapa-intro">Quem é e de onde veio.</p>' +
        '<div class="campos">' +
        H.rotulado("Empresa", H.campo(lead, "empresa", "text")) +
        H.rotulado("Contato", H.campo(lead, "contato", "text")) +
        H.rotulado("Telefone ou WhatsApp", H.campo(lead, "telefone", "tel")) +
        H.rotulado("Origem do lead", H.select(lead, "origem", D.origens)) +
        H.rotulado("Data da diagnóstica", H.campo(lead, "diag.data", "date")) +
        H.rotulado("Formato", H.select(lead, "diag.formato", D.formatos)) +
        "</div>" +
        '<details class="mais" style="margin-top:12px"><summary>Mais dados</summary><div class="campos" style="margin-bottom:12px">' +
        H.rotulado("Cargo", H.campo(lead, "cargo", "text")) +
        H.rotulado("E-mail", H.campo(lead, "email", "email")) +
        H.rotulado("Cidade", H.campo(lead, "cidade", "text")) +
        H.rotulado("Segmento", H.campo(lead, "segmento", "text")) +
        H.rotulado("Quem vai pela MecTRIA", H.campo(lead, "diag.participantes", "text"), true) +
        "</div></details>" +
        '<details class="mais"><summary>Preparação (' + feitos + "/" + D.preparacao.length + ")</summary>" +
        D.preparacao.map(function (t, i) {
          return '<label class="check">' + H.campo(lead, "diag.prep." + i, "checkbox") + "<span>" + H.esc(t) + "</span></label>";
        }).join("") +
        '<div style="margin:8px 0 12px">' + H.rotulado("Hipótese de dor", H.campo(lead, "diag.hipotese", "textarea")) + "</div></details>";
    }

    if (etapa.id === "abertura") {
      return '<div class="etapa-titulo"><h2>Abertura</h2></div><p class="etapa-intro">Combine a reunião antes de perguntar.</p>' +
        D.abertura.map(function (a) {
          return '<div data-com-dica><div class="pergunta-texto"><span style="flex:1">' + H.esc(a.titulo) + "</span>" +
            (a.dica ? H.botaoInfo() : "") + "</div>" + H.textoDica(a.dica) +
            '<div class="fala" data-modelo="' + H.esc(a.fala) + '"></div>' +
            (a.pacto ? H.botaoPacto(lead, "diag.pactoAgenda", a.pacto) : "") + "</div>";
        }).join("");
    }

    if (etapa.bloco) {
      var b = etapa.bloco;
      return '<div class="etapa-titulo"><span class="letra">' + H.esc(b.letra) + "</span><h2>" + H.esc(b.titulo) + "</h2></div>" +
        '<p class="etapa-intro">' + H.esc(b.intro) + "</p>" +
        b.perguntas.map(function (p) { return H.pergunta(lead, p); }).join("");
    }

    if (etapa.id === "servico") {
      return '<div class="etapa-titulo"><h2>Serviço</h2></div>' +
        '<p class="etapa-intro">Busque pelo que o cliente falou e marque o serviço. As perguntas técnicas aparecem embaixo.</p>' +
        '<input type="search" id="busca-servico" placeholder="Ex.: galpão, fiscalização, peça sem desenho" aria-label="O que o cliente falou">' +
        '<div class="chips" id="roteador" style="margin:12px 0 28px">' + roteador(lead, "") + "</div>" +
        lead.servicos.map(function (id) {
          var s = H.servico(id);
          if (!s) return "";
          return '<div style="margin-bottom:28px"><div class="etapa-titulo"><span class="letra">' + H.esc(s.sigla) + "</span><h2 style=\"font-size:19px\">" + H.esc(s.nome) + "</h2></div>" +
            '<details class="mais"><summary>O que entregamos e o que fica com o cliente</summary><div class="duas-colunas" style="margin-bottom:12px">' +
            '<div><p class="rotulo-pequeno">Entregamos</p><ul class="lista-simples">' + s.entregamos.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") + "</ul></div>" +
            '<div><p class="rotulo-pequeno">Fica com o cliente</p><ul class="lista-simples">' + s.ficaComCliente.map(function (x) { return "<li>" + H.esc(x) + "</li>"; }).join("") + "</ul></div>" +
            "</div></details>" +
            s.perguntas.map(function (p) { return H.pergunta(lead, p); }).join("") + "</div>";
        }).join("") +
        '<details class="mais"><summary>Escopo geral</summary>' + D.escopoGeral.map(function (p) { return H.pergunta(lead, p); }).join("") + "</details>";
    }

    // fechamento
    var q = qualificacao(lead);
    return '<div class="etapa-titulo"><h2>Fechamento</h2></div><p class="etapa-intro">Resuma, faça o pacto e saia com a proposta marcada.</p>' +
      '<p class="rotulo-pequeno">1 · Resumo</p><div class="fala" data-modelo="' + H.esc(D.fechamento.resumo) + '"></div>' +
      '<label class="check">' + H.campo(lead, "diag.resumoConfirmado", "checkbox") + "<span>O cliente confirmou</span></label>" +
      '<div data-com-dica style="margin-top:22px"><div class="pergunta-texto"><span class="rotulo-pequeno" style="flex:1;margin:0">2 · Micro pacto</span>' + H.botaoInfo() + "</div>" +
      H.textoDica(D.fechamento.pactoDica) + '<div class="fala" data-modelo="' + H.esc(D.fechamento.pacto) + '"></div></div>' +
      H.botaoPacto(lead, "diag.pactoCriterio", "Pacto feito") +
      '<div data-com-dica style="margin-top:22px"><div class="pergunta-texto"><span class="rotulo-pequeno" style="flex:1;margin:0">3 · Marcar a proposta</span>' + H.botaoInfo() + "</div>" +
      H.textoDica(D.fechamento.agendamentoDica) + '<div class="fala" data-modelo="' + H.esc(D.fechamento.agendamento) + '"></div></div>' +
      '<div class="campos">' +
      H.rotulado("Data", H.campo(lead, "diag.dataProposta", "date", ' id="data-proposta"')) +
      H.rotulado("Hora", H.campo(lead, "diag.horaProposta", "time")) +
      "</div>" +
      '<p><button type="button" class="botao-texto botao-pequeno" id="sugerir-data">Sugerir pelo fluxo de ' + H.EMPRESA.regras.diasParaProposta + " dias úteis</button></p>" +
      '<details class="mais"><summary>Qualificação (<span id="qualif-n">' + q.filter(function (x) { return x.ok; }).length + "</span>/" + q.length + ")</summary>" +
      '<ul class="lista-simples" id="qualificacao"></ul>' +
      '<label class="check">' + H.campo(lead, "diag.faixaCompativel", "checkbox") + "<span>A faixa de investimento é compatível com o piso da planilha</span></label></details>" +
      '<details class="mais"><summary>Notas</summary>' + H.campo(lead, "diag.notas", "textarea", ' rows="4" aria-label="Notas"') + "</details>" +
      '<div class="secao"><div class="acoes">' +
      '<button type="button" class="botao-destaque" data-acao="pdf">' + H.icone("documento") + "PDF para Projetos</button>" +
      '<button type="button" class="botao-sec" id="copiar-resumo">Copiar resumo para o cliente</button>' +
      '<a class="botao botao-sec" id="whats-resumo" target="_blank" rel="noopener">WhatsApp</a></div></div>';
  }

  function editor(el, lead, passo) {
    lead.diag = lead.diag || {};
    lead.diag.respostas = lead.diag.respostas || {};
    lead.servicos = lead.servicos || [];
    var lista = etapas(lead);
    var atual = Math.max(0, Math.min(lista.length - 1, parseInt(passo, 10) || 0));
    var etapa = lista[atual];
    var hashBase = BASE + lead.id + "/";
    var rotuloServico = lead.servicos.length ? H.siglas(lead) : "Serviço";

    el.innerHTML =
      '<div class="reuniao-topo"><div class="reuniao-linha">' +
      '<a class="botao-icone" href="#/playbooks/diagnostica" aria-label="Voltar">' + H.icone("voltar") + "</a>" +
      "<h1>" + H.esc(lead.empresa || "Sem nome") + "</h1>" +
      '<div class="acoes">' +
      '<button type="button" class="botao-sec botao-pequeno" id="abrir-roteador" title="Marcar serviço">' + H.icone("engrenagem") + H.esc(rotuloServico) + "</button>" +
      '<button type="button" class="botao-icone" id="abrir-resumo" aria-label="Resumo" title="Resumo">' + H.icone("lista") + "</button>" +
      '<button type="button" class="botao-icone" id="abrir-objecoes" aria-label="Objeções" title="Objeções">' + H.icone("escudo") + "</button>" +
      '<button type="button" class="botao-icone" data-acao="pdf" aria-label="PDF para Projetos" title="PDF para Projetos">' + H.icone("documento") + "</button>" +
      "</div></div>" + H.barraPassos(lista, atual, hashBase) + "</div>" +
      '<div class="estreita">' + corpoEtapa(lead, etapa) +
      H.navegacaoPassos(atual, lista.length, hashBase, '<a class="botao" href="#/playbooks/proposta/' + lead.id + '/0">Ir para a proposta' + H.icone("avancar") + "</a>") +
      "</div>";

    // a etapa atual sempre visível na barra de passos
    var chip = el.querySelector(".passo-chip.atual");
    if (chip) chip.scrollIntoView({ block: "nearest", inline: "center" });

    H.ligarCampos(el, lead, function (caminho) {
      if (caminho === "empresa") el.querySelector(".reuniao-linha h1").textContent = lead.empresa || "Sem nome";
      atualizar(el, lead);
    });
    document.addEventListener("pacto-mudou", function aoMudar() {
      if (!document.body.contains(el)) return document.removeEventListener("pacto-mudou", aoMudar);
      atualizar(el, lead);
    });

    el.addEventListener("click", function (ev) {
      var s = ev.target.closest("[data-servico]");
      if (s) {
        alternarServico(lead, s.getAttribute("data-servico"));
        H.rerender();
        return;
      }
      if (ev.target.closest('[data-acao="pdf"]')) H.imprimirBriefing(lead);
    });

    var busca = el.querySelector("#busca-servico");
    if (busca) {
      busca.addEventListener("input", function () {
        el.querySelector("#roteador").innerHTML = roteador(lead, busca.value);
      });
    }

    el.querySelector("#abrir-roteador").addEventListener("click", function () {
      H.gaveta("Qual serviço?", function (corpo) {
        corpo.innerHTML =
          '<p class="muted" style="margin-top:0">Busque pelo que o cliente falou.</p>' +
          '<input type="search" placeholder="Ex.: galpão, fiscalização, peça sem desenho" aria-label="O que o cliente falou">' +
          '<div class="chips" style="margin-top:14px">' + roteador(lead, "") + "</div>";
        var campo = corpo.querySelector("input");
        var chips = corpo.querySelector(".chips");
        campo.addEventListener("input", function () { chips.innerHTML = roteador(lead, campo.value); });
        corpo.addEventListener("click", function (ev) {
          var b = ev.target.closest("[data-servico]");
          if (!b) return;
          alternarServico(lead, b.getAttribute("data-servico"));
          chips.innerHTML = roteador(lead, campo.value);
          var botao = el.querySelector("#abrir-roteador");
          if (botao) botao.innerHTML = H.icone("engrenagem") + H.esc(lead.servicos.length ? H.siglas(lead) : "Serviço");
        });
        campo.focus();
      });
    });
    el.querySelector("#abrir-resumo").addEventListener("click", function () { H.abrirResumo(lead, lead.servicos[0]); });
    el.querySelector("#abrir-objecoes").addEventListener("click", function () {
      H.abrirObjecoes({ etapa: "diagnostica", vars: H.variaveis(lead) });
    });

    var sugerir = el.querySelector("#sugerir-data");
    if (sugerir) {
      sugerir.addEventListener("click", function () {
        lead.diag.dataProposta = H.somarDiasUteis(lead.diag.data || H.hoje(), H.EMPRESA.regras.diasParaProposta - 1);
        el.querySelector("#data-proposta").value = lead.diag.dataProposta;
        H.tocar(lead);
        H.salvar();
        atualizar(el, lead);
      });
    }
    var copiar = el.querySelector("#copiar-resumo");
    if (copiar) {
      copiar.addEventListener("click", function () {
        H.copiar(H.preencher(H.DIAGNOSTICA.resumoCliente, H.variaveis(lead)));
      });
    }

    atualizar(el, lead);
  }

  /* Atualiza o que depende das respostas sem redesenhar a tela (mantém o foco). */
  function atualizar(el, lead) {
    var vars = H.variaveis(lead);
    etapas(lead).forEach(function (e, i) {
      var c = el.querySelector('[data-passo-chip="' + i + '"]');
      if (c) c.classList.toggle("feito", !!e.feito);
    });
    el.querySelectorAll("[data-modelo]").forEach(function (f) {
      f.innerHTML = H.preencherHTML(f.getAttribute("data-modelo"), vars);
    });
    var q = el.querySelector("#qualificacao");
    if (q) {
      var itens = qualificacao(lead);
      q.innerHTML = itens.map(function (x) {
        return "<li>" + (x.ok ? '<span class="var">✓</span> ' : '<span class="muted">○</span> ') + H.esc(x.texto) + "</li>";
      }).join("");
      el.querySelector("#qualif-n").textContent = itens.filter(function (x) { return x.ok; }).length;
    }
    var whats = el.querySelector("#whats-resumo");
    if (whats) {
      var link = H.linkWhatsApp(lead.telefone, H.preencher(H.DIAGNOSTICA.resumoCliente, vars));
      if (link) {
        whats.href = link;
        whats.removeAttribute("aria-disabled");
      } else {
        whats.removeAttribute("href");
        whats.setAttribute("aria-disabled", "true");
        whats.title = "Preencha o telefone do contato";
      }
    }
  }

  /* ---------- briefing em PDF para Projetos ---------- */

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

  H.imprimirBriefing = function (lead) {
    var r = lead.diag.respostas || {};
    function valor(v) { return v ? H.esc(v) : '<span class="vazio-doc">não coletado</span>'; }
    function linha(rotulo, v) { return "<tr><th>" + H.esc(rotulo) + "</th><td>" + valor(v) + "</td></tr>"; }
    function tabela(linhas) { return "<table><tbody>" + linhas.join("") + "</tbody></table>"; }
    function porIds(ids) { return tabela(ids.map(function (id) { return linha(ROTULOS_PDF[id] || id, r[id]); })); }
    function porPerguntas(perguntas) { return tabela(perguntas.map(function (p) { return linha(p.texto, r[p.id]); })); }

    var servicos = (lead.servicos || []).map(H.servico).filter(Boolean);
    var dataDiag = lead.diag.data || H.hoje();
    var vendedor = lead.vendedor || H.estado.vendedor;

    var escopo = servicos.map(function (s) {
      return "<h3>" + H.esc(s.nome) + "</h3>" + porPerguntas(s.perguntas.filter(function (p) { return p.bloco === "escopo"; })) +
        '<p class="nota"><strong>Entregamos:</strong> ' + H.esc(s.entregamos.join("; ")) +
        ". <strong>Fica com o cliente:</strong> " + H.esc(s.ficaComCliente.join("; ")) + ".</p>";
    }).join("");
    var parametros = servicos.map(function (s) {
      return "<h3>" + H.esc(s.nome) + "</h3>" + porPerguntas(s.perguntas.filter(function (p) { return p.bloco === "parametros"; })) +
        '<p class="nota">Na planilha: ' + H.esc(s.precificacao) + "</p>";
    }).join("");

    var html =
      '<div class="briefing"><img class="logo" src="assets/logo-mectria.png" alt="MecTRIA">' +
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
        linha("Serviço provável", servicos.map(function (s) { return s.nome; }).join(", ")),
      ]) +
      "<h2>2. Contexto e objetivo</h2>" +
      porIds(["c-dor", "c-exemplo", "c-impedimento", "g-resultado", "g-medida", "g-maior", "p-tentativas", "p-alternativa", "p-interno", "t-porque-agora", "ci-negativa", "ci-positiva", "ci-numeros"]) +
      "<h2>3. Escopo técnico</h2>" + (escopo || '<p class="vazio-doc">Nenhum serviço marcado na diagnóstica.</p>') +
      "<h3>Escopo geral</h3>" + porIds(["e-incluido", "e-normas", "e-art", "e-custos"]) +
      "<h2>4. Parâmetros para a planilha</h2>" + (parametros || '<p class="vazio-doc">Nenhum serviço marcado na diagnóstica.</p>') +
      tabela([linha("Prazo desejado", r["t-prazo"])]) +
      "<h2>5. Comercial</h2>" + porIds(["b-faixa", "b-pagamento", "b-concorrencia", "b-sensibilidade"]) +
      "<h2>6. Decisão</h2>" + porIds(["a-decisores", "a-processo", "a-criterio", "a-prazo-decisao", "a-presenca"]) +
      "<h2>Próximo passo</h2>" +
      tabela([
        linha("Apresentação da proposta", lead.diag.dataProposta ? H.data(lead.diag.dataProposta) + (lead.diag.horaProposta ? " às " + lead.diag.horaProposta : "") : ""),
        linha("Estimativa técnica (Projetos)", "Dia 1, à tarde: " + H.data(dataDiag)),
        linha("Precificação e validação", "Dia 2: " + H.data(H.somarDiasUteis(dataDiag, 1))),
      ]) +
      "<h2>Qualificação</h2>" +
      tabela(qualificacao(lead).map(function (q) { return "<tr><th>" + H.esc(q.texto) + "</th><td>" + (q.ok ? "Sim" : "Não") + "</td></tr>"; })) +
      "<h2>Hipótese inicial e notas</h2>" +
      tabela([linha("Hipótese de dor", lead.diag.hipotese), linha("Notas do vendedor", lead.diag.notas)]) +
      '<p class="rodape">MecTRIA · ' + H.esc(H.EMPRESA.assinatura) + " · " + H.esc(H.EMPRESA.site) + " · " + H.esc(H.EMPRESA.email) +
      " · Documento interno, não enviar ao cliente.</p></div>";

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
    render: function (el, id, passo) {
      var lead = id && H.lead(id);
      if (!lead) lista(el);
      else editor(el, lead, passo);
    },
  };
})(window.HUB);
