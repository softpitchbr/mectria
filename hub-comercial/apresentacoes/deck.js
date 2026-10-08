/* Motor das apresentações: escala o slide de 1600 × 900 para a tela, navega por teclado,
   clique e toque, vira rolagem vertical no celular e imprime um slide por página.
   Os botões de micro pacto (.pacto-botao) gravam no lead do hub, se houver ?lead=id. */
window.DECK = (function () {
  var slides = [];
  var atual = 0;
  var leadId = new URLSearchParams(location.search).get("lead");

  function rodape(slide, i) {
    if (slide.classList.contains("sem-rodape") || slide.querySelector(".rodape-slide")) return;
    var r = document.createElement("div");
    r.className = "rodape-slide";
    r.innerHTML = "<span>MecTRIA · Empresa Júnior de Engenharia Mecânica da UFTM</span><span>" + (i + 1) + "</span>";
    slide.appendChild(r);
  }

  function escalar() {
    var e = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    slides.forEach(function (s) {
      s.style.transform = "translate(-50%, -50%) scale(" + e + ")";
    });
  }

  function definirModo() {
    var estreito = window.innerWidth < 820 || window.innerHeight > window.innerWidth * 1.15;
    document.body.classList.toggle("deck-rolagem", estreito);
    document.body.classList.toggle("deck-pagina", !estreito);
    escalar();
  }

  function mostrar(i) {
    atual = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, j) { s.classList.toggle("atual", j === atual); });
    var barra = document.querySelector(".barra-progresso");
    if (barra) barra.style.width = ((atual + 1) / slides.length) * 100 + "%";
    var contador = document.querySelector(".controles .contador");
    if (contador) contador.textContent = atual + 1 + " / " + slides.length;
    history.replaceState(null, "", location.pathname + location.search + "#" + (atual + 1));
  }

  function controles() {
    var c = document.createElement("div");
    c.className = "controles";
    c.innerHTML =
      '<button type="button" data-ir="-1" aria-label="Slide anterior">‹</button>' +
      '<span class="contador"></span>' +
      '<button type="button" data-ir="1" aria-label="Próximo slide">›</button>' +
      '<button type="button" data-tela-cheia>Tela cheia</button>' +
      '<button type="button" data-imprimir>PDF</button>';
    document.body.appendChild(c);
    var barra = document.createElement("div");
    barra.className = "barra-progresso";
    document.body.appendChild(barra);
    c.addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-ir")) mostrar(atual + Number(b.getAttribute("data-ir")));
      if (b.hasAttribute("data-tela-cheia")) telaCheia();
      if (b.hasAttribute("data-imprimir")) window.print();
    });
  }

  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  /* ---------- micro pactos ---------- */

  function leadAtual() {
    if (!leadId || !window.HUB) return null;
    HUB.recarregar();
    return HUB.lead(leadId) || null;
  }

  function atualizarPactos() {
    var botoes = Array.prototype.slice.call(document.querySelectorAll(".pacto-botao"));
    var ids = botoes.map(function (b) { return b.getAttribute("data-pacto"); });
    var feitos = botoes.filter(function (b) { return b.classList.contains("feito"); }).length;
    document.querySelectorAll(".resumo-pactos").forEach(function (el) {
      el.textContent = "Até aqui concordamos em " + feitos + " de " + ids.length + " pontos.";
    });
  }

  function iniciarPactos() {
    var lead = leadAtual();
    var pactos = (lead && lead.proposta && lead.proposta.pactos) || {};
    document.querySelectorAll(".pacto-botao").forEach(function (b) {
      var id = b.getAttribute("data-pacto");
      b.classList.toggle("feito", !!pactos[id]);
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        b.classList.toggle("feito");
        var l = leadAtual();
        if (l) {
          l.proposta = l.proposta || { servico: new URLSearchParams(location.search).get("servico") || "", pactos: {}, objecoes: {} };
          l.proposta.pactos = l.proposta.pactos || {};
          l.proposta.pactos[id] = b.classList.contains("feito");
          HUB.tocar(l);
          HUB.salvar();
        }
        atualizarPactos();
      });
    });
    atualizarPactos();
  }

  /* ---------- início ---------- */

  function iniciar() {
    slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
    slides.forEach(rodape);
    controles();
    iniciarPactos();
    definirModo();
    var n = parseInt(location.hash.slice(1), 10);
    mostrar(n ? n - 1 : 0);

    window.addEventListener("resize", definirModo);
    document.addEventListener("keydown", function (ev) {
      if (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      if (["ArrowRight", "PageDown", " "].indexOf(ev.key) !== -1) { ev.preventDefault(); mostrar(atual + 1); }
      else if (["ArrowLeft", "PageUp"].indexOf(ev.key) !== -1) { ev.preventDefault(); mostrar(atual - 1); }
      else if (ev.key === "Home") mostrar(0);
      else if (ev.key === "End") mostrar(slides.length - 1);
      else if (ev.key === "f" || ev.key === "F") telaCheia();
    });
    document.addEventListener("click", function (ev) {
      if (!document.body.classList.contains("deck-pagina")) return;
      if (ev.target.closest("button, a, input, select, textarea, .controles")) return;
      if (!ev.target.closest(".slide")) return;
      mostrar(ev.clientX < window.innerWidth / 3 ? atual - 1 : atual + 1);
    });
    var toqueX = null;
    document.addEventListener("touchstart", function (ev) { toqueX = ev.touches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", function (ev) {
      if (toqueX === null || !document.body.classList.contains("deck-pagina")) return;
      var dx = ev.changedTouches[0].clientX - toqueX;
      if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
      toqueX = null;
    });

    // na impressão, sempre o formato de slide
    var modoAntes = null;
    window.addEventListener("beforeprint", function () {
      modoAntes = document.body.classList.contains("deck-rolagem");
      document.body.classList.remove("deck-rolagem");
      document.body.classList.add("deck-pagina");
    });
    window.addEventListener("afterprint", function () {
      if (modoAntes) definirModo();
    });
    window.addEventListener("storage", function () {
      var lead = leadAtual();
      var pactos = (lead && lead.proposta && lead.proposta.pactos) || {};
      document.querySelectorAll(".pacto-botao").forEach(function (b) {
        b.classList.toggle("feito", !!pactos[b.getAttribute("data-pacto")]);
      });
      atualizarPactos();
    });
  }

  return { iniciar: iniciar };
})();
