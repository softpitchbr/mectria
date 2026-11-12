/*
 * Kit das apresentações da MecTRIA: o contrato com o hub (hub/apresentacoes/CONTRATO.md) e o que toda
 * apresentação faz igual (slides, escala, teclas, textos com {chave}, rodapé "01 / 13").
 * Cada apresentação chama Apresentacao.iniciar({...}) no fim e cuida só do que é dela.
 */
(function () {
  "use strict";

  // O que falta aparece como [rótulo], com os mesmos rótulos do hub (compartilhado/dados/cadencia.ts).
  var ROTULOS = {
    contato: "nome do contato",
    empresa: "empresa do cliente",
    servico: "serviço",
    data: "data",
    anos: "anos de MecTRIA",
    equipe: "nomes e papéis do time",
    dor: "dor do cliente",
    impacto: "impacto",
    objetivo: "objetivo",
    prazo: "prazo",
    entregamos: "o que entregamos",
    fica: "o que fica com o cliente",
    prazoProjeto: "prazo do projeto",
    ancora: "quem faria o projeto no mercado",
    fraseValor: "frase de valor",
    valor: "valor",
    condicoes: "condições de pagamento",
    data_decisao: "data da decisão",
    etapa: "etapa",
  };

  var estado = { slide: 0, dados: {}, interacoes: { dores: [], precoEtapa: 0, calculadora: {} } };
  var opcoes = {};
  var slides = [];

  function enviar(mensagem) {
    mensagem.mectria = 1;
    window.parent.postMessage(mensagem, "*");
  }

  function valor(chave) {
    var v = estado.dados[chave];
    return typeof v === "string" ? v.trim() : "";
  }

  /** Preenche [data-modelo] ("Proposta para {empresa}") e mostra/esconde [data-se] e [data-senao]. */
  function preencher() {
    document.querySelectorAll("[data-modelo]").forEach(function (el) {
      el.textContent = "";
      // Um trecho que só aparece com a chave preenchida (data-se) fica vazio sem ela, sem o [rótulo].
      if (el.hasAttribute("data-se") && !valor(el.getAttribute("data-se"))) return;
      el.getAttribute("data-modelo")
        .split(/(\{\w+\})/)
        .forEach(function (pedaco) {
          if (!pedaco) return;
          var chave = /^\{(\w+)\}$/.exec(pedaco);
          if (!chave) return el.appendChild(document.createTextNode(pedaco));
          var v = valor(chave[1]);
          if (v) return el.appendChild(document.createTextNode(v));
          var falta = document.createElement("span");
          falta.className = "falta";
          falta.textContent = "[" + (ROTULOS[chave[1]] || chave[1]) + "]";
          el.appendChild(falta);
        });
    });
    // [data-lista="chave"]: uma lista com um item por linha da chave; sem itens, some.
    document.querySelectorAll("[data-lista]").forEach(function (el) {
      el.textContent = "";
      valor(el.getAttribute("data-lista"))
        .split("\n")
        .map(function (l) {
          return l.trim();
        })
        .filter(Boolean)
        .forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = item;
          el.appendChild(li);
        });
      el.hidden = !el.children.length;
    });
    document.querySelectorAll("[data-se]").forEach(function (el) {
      el.hidden = !valor(el.getAttribute("data-se"));
    });
    document.querySelectorAll("[data-senao]").forEach(function (el) {
      el.hidden = !!valor(el.getAttribute("data-senao"));
    });
  }

  function mostrar(indice) {
    if (typeof indice !== "number" || !isFinite(indice)) return;
    estado.slide = Math.max(0, Math.min(slides.length - 1, Math.floor(indice)));
    slides.forEach(function (s, i) {
      var ativo = i === estado.slide;
      s.hidden = !ativo;
      if (ativo) s.setAttribute("data-ativo", "sim");
      else s.removeAttribute("data-ativo");
    });
    if (opcoes.aoSlide) opcoes.aoSlide(estado.slide);
  }

  function reais(n) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
  }

  function escalar() {
    var escala = Math.min(window.innerWidth / 1280, window.innerHeight / 720) || 1;
    document.getElementById("palco").style.transform = "scale(" + escala + ") translate(-50%, -50%)";
  }

  function numerar() {
    var total = String(slides.length).padStart(2, "0");
    slides.forEach(function (s, i) {
      if (!s.querySelector(".rodape") && !s.hasAttribute("data-sem-rodape")) {
        var rodape = document.createElement("div");
        rodape.className = "rodape";
        rodape.innerHTML = "<span data-contagem></span><span>MecTRIA</span>";
        s.appendChild(rodape);
      }
      s.querySelectorAll("[data-contagem]").forEach(function (el) {
        el.textContent = String(i + 1).padStart(2, "0") + " / " + total;
      });
    });
  }

  // Mensagens do hub: só as que vêm da janela que abriu esta apresentação.
  window.addEventListener("message", function (e) {
    if (e.source !== window.parent) return;
    var m = e.data;
    if (!m || m.mectria !== 1) return;
    if (m.tipo === "estado") {
      estado.dados = m.dados && typeof m.dados === "object" ? m.dados : {};
      var i = m.interacoes || {};
      estado.interacoes = {
        dores: Array.isArray(i.dores) ? i.dores.slice() : [],
        precoEtapa: typeof i.precoEtapa === "number" ? i.precoEtapa : 0,
        calculadora: i.calculadora && typeof i.calculadora === "object" ? Object.assign({}, i.calculadora) : {},
      };
      preencher();
      desenharInterativos();
      if (opcoes.aoEstado) opcoes.aoEstado(estado);
      mostrar(m.slide);
    } else if (m.tipo === "slide") {
      mostrar(m.slide);
    } else if (m.tipo === "acionar" && typeof m.acao === "string") {
      acionar(m.acao);
    } else if (m.tipo === "calcular" && m.valores && typeof m.valores === "object") {
      if (opcoes.calculadora) calcular(m.valores);
      else if (opcoes.aoCalcular) opcoes.aoCalcular(m.valores);
    }
  });

  // As setas apertadas aqui passam o slide pelo hub (quem manda no slide é o painel).
  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var alvo = e.target && e.target.tagName;
    if (alvo === "INPUT" || alvo === "TEXTAREA" || alvo === "SELECT") return;
    e.preventDefault();
    enviar({ tipo: "tecla", tecla: e.key });
  });

  // Partes interativas comuns às propostas ------------------------------------------------

  /** Dor 1 é a do cliente (inicial maiúscula); 2 a 4, as dores cadastradas no serviço. */
  function textoDaDor(n) {
    if (n === 1) {
      var dor = valor("dor");
      return dor ? dor.charAt(0).toUpperCase() + dor.slice(1) : "[" + ROTULOS.dor + "]";
    }
    return (
      valor("doresDoServico")
        .split("\n")
        .map(function (d) {
          return d.trim();
        })
        .filter(Boolean)[n - 2] || ""
    );
  }

  function desenharDores() {
    document.querySelectorAll("[data-dor]").forEach(function (botao) {
      var texto = textoDaDor(Number(botao.getAttribute("data-dor")));
      botao.textContent = texto;
      botao.hidden = !texto;
      botao.setAttribute("aria-pressed", estado.interacoes.dores.indexOf(texto) >= 0 ? "true" : "false");
    });
  }

  function alternarDor(n) {
    var texto = textoDaDor(n);
    if (!texto) return;
    var marcada = estado.interacoes.dores.indexOf(texto) < 0;
    estado.interacoes.dores = estado.interacoes.dores.filter(function (d) {
      return d !== texto;
    });
    if (marcada) estado.interacoes.dores.push(texto);
    desenharDores();
    Apresentacao.enviar({ evento: "dor", valor: texto, marcada: marcada });
  }

  /** O preço aparece em etapas ([data-etapa="1"], "2", "3"); [data-espera] some na primeira. */
  function desenharPreco() {
    var etapa = estado.interacoes.precoEtapa;
    document.querySelectorAll("[data-etapa]").forEach(function (el) {
      el.hidden = Number(el.getAttribute("data-etapa")) > etapa;
    });
    document.querySelectorAll("[data-espera]").forEach(function (el) {
      el.hidden = etapa > 0;
    });
  }

  function revelarPreco() {
    var total = (opcoes.preco && opcoes.preco.etapas) || 3;
    if (estado.interacoes.precoEtapa >= total) return;
    estado.interacoes.precoEtapa += 1;
    desenharPreco();
    Apresentacao.enviar({ evento: "preco", etapa: estado.interacoes.precoEtapa });
  }

  /** A calculadora: os campos [data-campo] e o resultado em [data-resultado] (custo do ano e em quantos meses o projeto se paga). */
  function desenharCalculo() {
    var c = opcoes.calculadora;
    if (!c) return;
    var numeros = estado.interacoes.calculadora;
    c.campos.forEach(function (campo) {
      var el = document.querySelector('[data-campo="' + campo.id + '"]');
      if (el && document.activeElement !== el) el.value = typeof numeros[campo.id] === "number" ? String(numeros[campo.id]) : "";
    });
    var saida = document.querySelector("[data-resultado]");
    if (!saida) return;
    var completos = c.campos.every(function (campo) {
      return typeof numeros[campo.id] === "number" && numeros[campo.id] > 0;
    });
    saida.textContent = "";
    if (!completos) {
      saida.textContent = c.vazio || "Preencha os números para ver quanto custa ficar como está.";
      return;
    }
    var mes = c.porMes(numeros);
    saida.appendChild(document.createTextNode("Por ano, ficar como está custa "));
    var ano = document.createElement("strong");
    ano.textContent = reais(mes * 12);
    saida.appendChild(ano);
    saida.appendChild(document.createTextNode("."));
    var centavos = Number(valor("valorCentavos"));
    if (centavos > 0 && mes > 0) {
      var meses = Math.max(1, Math.ceil(centavos / 100 / mes));
      saida.appendChild(document.createTextNode(" O projeto se paga em " + meses + (meses === 1 ? " mês." : " meses.")));
    }
  }

  function avisarCalculadora() {
    var valores = {};
    opcoes.calculadora.campos.forEach(function (campo) {
      if (typeof estado.interacoes.calculadora[campo.id] === "number") valores[campo.id] = estado.interacoes.calculadora[campo.id];
    });
    Apresentacao.enviar({ evento: "calculadora", valores: valores });
  }

  function calcular(valores) {
    if (!opcoes.calculadora) return;
    opcoes.calculadora.campos.forEach(function (campo) {
      var n = valores[campo.id];
      if (typeof n === "number" && isFinite(n)) estado.interacoes.calculadora[campo.id] = n;
    });
    desenharCalculo();
    avisarCalculadora();
  }

  function desenharInterativos() {
    if (opcoes.dores) desenharDores();
    if (opcoes.preco) desenharPreco();
    if (opcoes.calculadora) desenharCalculo();
  }

  function acoesEcampos() {
    var acoes = (opcoes.acoes || []).slice();
    var campos = (opcoes.campos || []).slice();
    if (opcoes.dores) {
      [1, 2, 3, 4].forEach(function (n) {
        acoes.push({ slide: opcoes.dores.slide, id: "dor-" + n, rotulo: n === 1 ? "Marcar a dor do cliente" : "Marcar a dor " + n });
      });
    }
    if (opcoes.preco) acoes.push({ slide: opcoes.preco.slide, id: "revelar-preco", rotulo: "Revelar o preço" });
    if (opcoes.calculadora) {
      opcoes.calculadora.campos.forEach(function (campo) {
        campos.push({ slide: opcoes.calculadora.slide, id: campo.id, rotulo: campo.rotulo });
      });
    }
    return { acoes: acoes, campos: campos };
  }

  function ligarInterativos() {
    document.querySelectorAll("[data-dor]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        alternarDor(Number(botao.getAttribute("data-dor")));
      });
    });
    if (opcoes.calculadora) {
      opcoes.calculadora.campos.forEach(function (campo) {
        var el = document.querySelector('[data-campo="' + campo.id + '"]');
        if (!el) return;
        el.addEventListener("input", function () {
          var n = Number(el.value);
          if (el.value === "" || !isFinite(n)) delete estado.interacoes.calculadora[campo.id];
          else estado.interacoes.calculadora[campo.id] = n;
          desenharCalculo();
          avisarCalculadora();
        });
      });
    }
  }

  function acionar(acao) {
    var dor = /^dor-([1-4])$/.exec(acao);
    if (dor && opcoes.dores) return alternarDor(Number(dor[1]));
    if (acao === "revelar-preco" && opcoes.preco) return revelarPreco();
    if (opcoes.aoAcionar) opcoes.aoAcionar(acao);
  }

  window.Apresentacao = {
    iniciar: function (o) {
      opcoes = o || {};
      slides = Array.prototype.slice.call(document.querySelectorAll("[data-slide]"));
      numerar();
      ligarInterativos();
      window.addEventListener("resize", escalar);
      escalar();
      preencher();
      desenharInterativos();
      if (opcoes.aoEstado) opcoes.aoEstado(estado);
      mostrar(0);
      var ac = acoesEcampos();
      enviar({ tipo: "pronta", slides: slides.length, acoes: ac.acoes, campos: ac.campos });
    },
    /** Manda um evento ao hub: { evento: "dor" | "preco" | "calculadora", ... }. */
    enviar: function (evento) {
      var m = { tipo: "evento" };
      for (var k in evento) m[k] = evento[k];
      enviar(m);
    },
    dados: function () {
      return estado.dados;
    },
    valor: valor,
    interacoes: function () {
      return estado.interacoes;
    },
    slideAtual: function () {
      return estado.slide;
    },
    preencher: preencher,
    reais: reais,
  };
})();
