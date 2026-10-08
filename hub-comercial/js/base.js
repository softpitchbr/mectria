/* Núcleo do hub: estado salvo no navegador (localStorage), datas em dias úteis,
   preenchimento das falas com os dados do lead e utilidades de interface.
   Sem dependências: funciona abrindo o index.html direto ou hospedado. */
window.HUB = window.HUB || {};

(function (H) {
  var CHAVE = "hub-mectria:v1";
  H.telas = H.telas || {};

  /* ---------- estado ---------- */

  function vazio() {
    return { versao: 1, vendedor: "", leads: [] };
  }

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        var e = JSON.parse(bruto);
        if (e && Array.isArray(e.leads)) return e;
      }
    } catch (erro) {
      /* navegador sem localStorage: segue com estado em memória */
    }
    return vazio();
  }

  H.estado = carregar();

  H.recarregar = function () {
    H.estado = carregar();
  };

  H.salvar = function () {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(H.estado));
    } catch (erro) {
      H.aviso("Não consegui salvar neste navegador. Exporte os dados para não perder.");
    }
  };

  H.novoId = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };

  H.lead = function (id) {
    return H.estado.leads.find(function (l) { return l.id === id; });
  };

  H.novoLead = function (dados) {
    var agora = new Date().toISOString();
    var lead = Object.assign(
      {
        id: H.novoId(),
        criadoEm: agora,
        atualizadoEm: agora,
        empresa: "",
        contato: "",
        cargo: "",
        telefone: "",
        email: "",
        cidade: "Uberaba/MG",
        segmento: "",
        origem: "",
        vendedor: H.estado.vendedor || "",
        servicos: [],
        diag: { respostas: {} },
        proposta: null,
        fup: null,
      },
      dados || {}
    );
    H.estado.leads.unshift(lead);
    H.salvar();
    return lead;
  };

  H.tocar = function (lead) {
    lead.atualizadoEm = new Date().toISOString();
  };

  H.removerLead = function (id) {
    H.estado.leads = H.estado.leads.filter(function (l) { return l.id !== id; });
    H.salvar();
  };

  /* ---------- datas (ISO aaaa-mm-dd, sem fuso) ---------- */

  function z(n) {
    return String(n).padStart(2, "0");
  }

  H.iso = function (d) {
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  };

  H.hoje = function () {
    return H.iso(new Date());
  };

  H.paraData = function (iso) {
    var p = String(iso).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  };

  H.diaUtil = function (d) {
    var semana = d.getDay();
    return semana !== 0 && semana !== 6 && (H.FERIADOS || []).indexOf(H.iso(d)) === -1;
  };

  H.somarDiasUteis = function (iso, n) {
    var d = H.paraData(iso);
    var contados = 0;
    while (contados < n) {
      d.setDate(d.getDate() + 1);
      if (H.diaUtil(d)) contados++;
    }
    return H.iso(d);
  };

  H.somarDias = function (iso, n) {
    var d = H.paraData(iso);
    d.setDate(d.getDate() + n);
    return H.iso(d);
  };

  H.data = function (iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  };

  H.dataCurta = function (iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return p[2] + "/" + p[1];
  };

  /* ---------- números ---------- */

  H.paraNumero = function (texto) {
    if (typeof texto === "number") return texto;
    var s = String(texto || "").replace(/[R$\s]/g, "");
    if (!s) return 0;
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  H.reais = function (n) {
    if (!n) return "";
    return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  /* ---------- texto ---------- */

  H.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  H.ROTULOS = {
    contato: "nome do contato",
    empresa: "empresa",
    vendedor: "seu nome",
    decisor: "nome do decisor",
    decisores: "quem decide",
    dor: "dor do cliente",
    dor1: "dor 1",
    dor2: "dor 2",
    objetivo: "objetivo do cliente",
    impacto: "custo de não resolver",
    prazo: "prazo",
    numeros: "números do cliente",
    servico: "serviço",
    entregamos: "o que entregamos",
    fica: "o que fica com o cliente",
    ancora: "referência de mercado",
    gancho: "pergunta de gancho",
    tema: "assunto",
    data_proposta: "data da apresentação",
    data_decisao: "data combinada para a decisão",
    validade: "validade da proposta",
    valor: "valor da proposta",
    link_conteudo: "link de um post ou caso",
  };

  /* Respostas que entram no meio de uma frase: começam com minúscula (siglas ficam como estão). */
  var MEIO_DE_FRASE = ["dor", "objetivo", "impacto", "prazo", "ganho", "tentativas", "porqueAgora", "criterio", "numeros", "prazoDecisao"];

  function minusculaInicial(texto) {
    var segunda = texto.charAt(1);
    if (segunda && segunda !== segunda.toLowerCase()) return texto; // NR-12, CNC...
    return texto.charAt(0).toLowerCase() + texto.slice(1);
  }

  /* Monta as variáveis de um lead para as falas e mensagens. */
  H.variaveis = function (lead, servicoId) {
    var E = H.EMPRESA;
    var v = {
      vendedor: H.estado.vendedor || "",
      anos: String(new Date().getFullYear() - E.fundacao),
      dias: String(E.regras.diasParaProposta),
      parcelas: String(E.regras.parcelasSemJuros),
      descontoAVista: String(E.regras.descontoAVista),
      fraseValor: E.fraseValor,
    };
    if (!lead) return v;
    v.vendedor = lead.vendedor || v.vendedor;
    v.contato = (lead.contato || "").split(" ")[0];
    v.decisor = lead.contato || "";
    v.empresa = lead.empresa || "";

    var r = (lead.diag && lead.diag.respostas) || {};
    var D = H.DIAGNOSTICA;
    D.blocos.forEach(function (b) {
      b.perguntas.forEach(function (p) {
        if (!p.chave || !r[p.id]) return;
        var texto = String(r[p.id]).trim().replace(/[.;]+$/, "");
        v[p.chave] = MEIO_DE_FRASE.indexOf(p.chave) !== -1 ? minusculaInicial(texto) : texto;
      });
    });

    var sid = servicoId || (lead.proposta && lead.proposta.servico) || (lead.servicos || [])[0];
    var s = sid && H.servico(sid);
    if (s) {
      v.servico = s.nome;
      v.tema = s.nome.toLowerCase();
      v.entregamos = s.entregamos.join("; ").toLowerCase();
      v.fica = s.ficaComCliente.join("; ").toLowerCase();
      v.ancora = s.ancoraValor;
      v.gancho = s.gancho;
      v.dor1 = (s.dores[0] || "").toLowerCase();
      v.dor2 = (s.dores[1] || "").toLowerCase();
    }

    if (lead.diag && lead.diag.dataProposta) v.data_proposta = H.data(lead.diag.dataProposta);
    if (lead.proposta) {
      if (lead.proposta.valor) v.valor = H.reais(lead.proposta.valor);
      if (lead.proposta.dataDecisao) v.data_decisao = H.data(lead.proposta.dataDecisao);
      if (lead.proposta.data) v.validade = H.data(H.somarDias(lead.proposta.data, E.regras.validadePropostaDias));
    }
    return v;
  };

  /* Texto puro para copiar: variável sem valor vira [rótulo]. */
  H.preencher = function (texto, vars) {
    return String(texto).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] ? vars[k] : "[" + (H.ROTULOS[k] || k) + "]";
    });
  };

  /* HTML: variável preenchida em destaque, pendência marcada para o vendedor completar. */
  H.preencherHTML = function (texto, vars) {
    return String(texto)
      .split(/(\{\w+\}|\[[^\]]+\])/)
      .map(function (parte) {
        var m = /^\{(\w+)\}$/.exec(parte);
        if (m) {
          var k = m[1];
          if (vars && vars[k]) return '<span class="var">' + H.esc(vars[k]) + "</span>";
          return '<mark class="falta">[' + H.esc(H.ROTULOS[k] || k) + "]</mark>";
        }
        if (/^\[[^\]]+\]$/.test(parte)) return '<mark class="falta">' + H.esc(parte) + "</mark>";
        return H.esc(parte);
      })
      .join("")
      .replace(/\n/g, "<br>");
  };

  /* ---------- interface ---------- */

  H.aviso = function (mensagem) {
    var el = document.getElementById("aviso");
    if (!el) {
      el = document.createElement("div");
      el.id = "aviso";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = mensagem;
    el.classList.add("visivel");
    clearTimeout(H._avisoTimer);
    H._avisoTimer = setTimeout(function () {
      el.classList.remove("visivel");
    }, 2200);
  };

  H.copiar = function (texto) {
    function alternativa() {
      var area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        H.aviso("Copiado");
      } catch (e) {
        H.aviso("Não consegui copiar. Selecione o texto e copie à mão.");
      }
      document.body.removeChild(area);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(function () { H.aviso("Copiado"); }, alternativa);
    } else {
      alternativa();
    }
  };

  H.linkWhatsApp = function (telefone, texto) {
    var digitos = String(telefone || "").replace(/\D/g, "");
    if (!digitos) return "";
    if (digitos.length <= 11) digitos = "55" + digitos;
    return "https://wa.me/" + digitos + "?text=" + encodeURIComponent(texto || "");
  };

  H.baixar = function (nome, conteudo, tipo) {
    var blob = new Blob([conteudo], { type: tipo });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  /* ---------- exportar e importar ---------- */

  H.exportarJSON = function () {
    H.baixar("hub-mectria-" + H.hoje() + ".json", JSON.stringify(H.estado, null, 2), "application/json");
  };

  /* Junta os leads de um arquivo com os daqui; no mesmo lead vale o mais recente. */
  H.importarJSON = function (texto) {
    var dados = JSON.parse(texto);
    if (!dados || !Array.isArray(dados.leads)) throw new Error("Arquivo sem leads");
    var novos = 0;
    var atualizados = 0;
    dados.leads.forEach(function (l) {
      if (!l || !l.id) return;
      var atual = H.lead(l.id);
      if (!atual) {
        H.estado.leads.push(l);
        novos++;
      } else if ((l.atualizadoEm || "") > (atual.atualizadoEm || "")) {
        H.estado.leads[H.estado.leads.indexOf(atual)] = l;
        atualizados++;
      }
    });
    H.salvar();
    return { novos: novos, atualizados: atualizados };
  };

  /* CSV no formato do Histórico ampliado (planilha de taxa de fechamento, tarefa 34). */
  H.exportarCSV = function () {
    var colunas = [
      "empresa", "contato", "origem", "servico", "vendedor", "data_diagnostica", "data_proposta",
      "valor_proposta", "usou_nova_apresentacao", "pactos_feitos", "status", "motivo_perda",
      "data_fechamento", "valor_fechado", "toques_de_followup",
    ];
    function cel(v) {
      var s = String(v == null ? "" : v);
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var linhas = H.estado.leads.map(function (l) {
      var p = l.proposta || {};
      var f = l.fup || {};
      var s = p.servico && H.servico(p.servico);
      return [
        l.empresa, l.contato, l.origem, s ? s.nome : "", l.vendedor,
        H.data(l.diag && l.diag.data), H.data(p.data),
        p.valor ? String(p.valor).replace(".", ",") : "",
        p.data ? (p.usouNovaApresentacao === false ? "não" : "sim") : "",
        p.pactos ? Object.keys(p.pactos).filter(function (k) { return p.pactos[k]; }).length : "",
        H.statusLead(l).rotulo, f.motivoPerda || "",
        H.data(f.dataFechamento), f.valorFechado ? String(f.valorFechado).replace(".", ",") : "",
        f.toques ? Object.keys(f.toques).length : "",
      ].map(cel).join(";");
    });
    var csv = "﻿" + colunas.join(";") + "\n" + linhas.join("\n");
    H.baixar("propostas-mectria-" + H.hoje() + ".csv", csv, "text/csv;charset=utf-8");
  };

  /* Situação do lead no funil. */
  H.statusLead = function (l) {
    if (l.fup && l.fup.status === "ganho") return { id: "ganho", rotulo: "Ganho" };
    if (l.fup && l.fup.status === "perdido") return { id: "perdido", rotulo: "Perdido" };
    if (l.fup && l.fup.status === "nutricao") return { id: "nutricao", rotulo: "Nutrição" };
    if (l.fup && l.fup.status === "ativo") return { id: "fup", rotulo: "Em follow-up" };
    if (l.proposta && l.proposta.data) return { id: "proposta", rotulo: "Proposta apresentada" };
    if (l.diag && l.diag.dataProposta) return { id: "agendada", rotulo: "Proposta agendada" };
    if (l.diag && l.diag.data) return { id: "diagnostica", rotulo: "Diagnóstica" };
    return { id: "novo", rotulo: "Novo" };
  };
})(window.HUB);
