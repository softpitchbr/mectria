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
      if (opcoes.aoEstado) opcoes.aoEstado(estado);
      mostrar(m.slide);
    } else if (m.tipo === "slide") {
      mostrar(m.slide);
    } else if (m.tipo === "acionar" && typeof m.acao === "string") {
      if (opcoes.aoAcionar) opcoes.aoAcionar(m.acao);
    } else if (m.tipo === "calcular" && m.valores && typeof m.valores === "object") {
      if (opcoes.aoCalcular) opcoes.aoCalcular(m.valores);
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

  window.Apresentacao = {
    iniciar: function (o) {
      opcoes = o || {};
      slides = Array.prototype.slice.call(document.querySelectorAll("[data-slide]"));
      numerar();
      window.addEventListener("resize", escalar);
      escalar();
      preencher();
      if (opcoes.aoEstado) opcoes.aoEstado(estado);
      mostrar(0);
      enviar({ tipo: "pronta", slides: slides.length, acoes: opcoes.acoes || [], campos: opcoes.campos || [] });
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
