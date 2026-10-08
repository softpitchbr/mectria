/* Motor das apresentações de proposta. Cada serviço tem o seu arquivo em propostas/, com um
   CONFIG no topo; este motor monta a sequência fixa do Método TRIA a partir dele.

   CONFIG = {
     servico: "nr-12",                       // id em js/dados/servicos.js
     frase: "...",                           // frase da capa, específica do serviço
     ocultar: ["numeros"],                   // slides que esta apresentação não usa
     extras: [{ depoisDe: "metodo", html: '<section class="slide">...</section>' }],
   }
   Ordem dos slides: capa, proposito, numeros, time, cenario, metodo, escopo, duvida, cliente,
   valor, provas, investimento, passos. Só muda o mínimo de uma reunião para outra: cliente,
   dores, escopo, preço, prazo e time. O que estiver [em vermelho] se completa antes da reunião. */
window.montarProposta = function (CONFIG) {
  var H = window.HUB;
  var q = new URLSearchParams(location.search);
  var s = H.servico(CONFIG.servico);
  var lead = q.get("lead") ? H.lead(q.get("lead")) : null;
  var r = (lead && lead.diag && lead.diag.respostas) || {};
  var v = H.variaveis(lead, s.id);
  var E = H.EMPRESA;
  var LOGO = "../../assets/logo-mectria-negativa.png";

  function falta(rotulo) { return '<mark class="falta">[' + H.esc(rotulo) + "]</mark>"; }
  function maiuscula(t) { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
  function lista(itens) {
    return "<ul>" + itens.map(function (x) { return "<li>" + H.esc(maiuscula(x)) + "</li>"; }).join("") + "</ul>";
  }
  function completar(doCliente, padrao, maximo) {
    var itens = doCliente.filter(Boolean);
    for (var i = 0; itens.length < maximo && i < padrao.length; i++) itens.push(padrao[i]);
    return itens.slice(0, maximo);
  }

  var empresa = lead && lead.empresa ? H.esc(lead.empresa) : falta("empresa do cliente");
  document.title = "Proposta " + s.nome + (lead && lead.empresa ? " · " + lead.empresa : "") + " · MecTRIA";
  var voltam = E.diferenciais.filter(function (d) { return d.titulo === "Clientes que voltam"; })[0];

  var slides = [
    ["capa",
      '<section class="slide vinho sem-rodape"><img class="logo-capa" src="' + LOGO + '" alt="MecTRIA">' +
      '<p class="rotulo">Proposta para ' + empresa + "</p><h1>" + H.esc(s.nome) + "</h1>" +
      '<p class="grande">' + H.esc(CONFIG.frase || s.resumo) + "</p>" +
      '<p style="margin-top:60px;font-size:22px">' + H.data(H.hoje()) + " · " + H.esc(E.assinatura) + "</p></section>"],

    ["proposito",
      '<section class="slide"><p class="rotulo">Quem vai fazer o seu projeto</p>' +
      "<h2>Engenharia de verdade, feita por estudantes, com propósito</h2>" +
      '<div class="colunas"><p style="font-size:30px">' + H.esc(E.proposito) + "</p>" +
      '<div style="display:grid;gap:20px">' +
      '<div class="caixa"><strong>Desde 2013</strong><br>Projetos reais para empresas da região</div>' +
      '<div class="caixa"><strong>UFTM · Uberaba</strong><br>Empresa júnior sem fins lucrativos</div>' +
      '<div class="caixa vinho"><strong>Orientação de professores</strong><br>Em todas as decisões técnicas</div>' +
      "</div></div></section>"],

    ["numeros",
      '<section class="slide nevoa"><p class="rotulo">Histórico</p><h2>Nossa história em números</h2>' +
      '<div class="colunas-3" style="grid-template-columns:repeat(4,1fr)">' +
      E.numeros.map(function (n) {
        return '<div class="caixa"><div class="numero-grande">' + (n.valor ? H.esc(n.valor) : falta("nº")) + "</div><p>" + H.esc(n.rotulo) + "</p></div>";
      }).join("") + "</div></section>"],

    ["time",
      '<section class="slide"><p class="rotulo">Time</p><h2>Quem cuida do seu projeto</h2><div class="colunas-3">' +
      '<div class="caixa vinho"><h3>Professor orientador</h3><p>' + falta("nome e área") + "</p><p>Acompanha as decisões técnicas.</p></div>" +
      '<div class="caixa"><h3>Gerente do projeto</h3><p>' + falta("nome") + "</p><p>Seu contato do começo ao fim.</p></div>" +
      '<div class="caixa"><h3>Projetistas</h3><p>' + falta("nomes") + "</p><p>Estudantes de Engenharia Mecânica da UFTM.</p></div>" +
      "</div></section>"],

    ["cenario",
      '<section class="slide"><p class="rotulo">O cenário de vocês</p><h2>Hoje × com o projeto</h2><div class="colunas">' +
      '<div class="caixa"><h3>Hoje</h3>' + lista(completar([r["c-dor"], r["ci-negativa"]], s.ceuInferno.antes, 3)) + "</div>" +
      '<div class="caixa vinho"><h3>Com o projeto</h3>' + lista(completar([r["g-resultado"], r["ci-positiva"]], s.ceuInferno.depois, 3)) + "</div>" +
      '</div><button type="button" class="pacto-botao" data-pacto="dor">Esse é o cenário de vocês</button></section>'],

    ["metodo",
      '<section class="slide"><p class="rotulo">O projeto</p><h2>Como vamos fazer</h2><div class="colunas">' +
      '<ol class="etapas">' + s.metodo.map(function (m) { return "<li>" + H.esc(m) + "</li>"; }).join("") + "</ol>" +
      '<div class="caixa"><p class="rotulo">Prazo</p><p class="numero-grande" style="font-size:60px">' + falta("nº") + " dias úteis</p>" +
      "<p>Com revisão do professor orientador em cada etapa.</p></div></div></section>"],

    ["escopo",
      '<section class="slide nevoa"><p class="rotulo">Escopo</p><h2>O que vocês recebem</h2><div class="colunas">' +
      '<div class="caixa"><h3>O que entregamos</h3>' + lista(s.entregamos) + "</div>" +
      '<div class="caixa"><h3>O que fica com vocês</h3>' + lista(s.ficaComCliente) +
      '<p style="font-size:22px;color:var(--cinza)">Com o projeto na mão, vocês cotam a execução com quem quiserem e comparam a mesma coisa.</p></div>' +
      "</div></section>"],

    ["duvida",
      '<section class="slide"><p class="rotulo">Antes de seguir</p>' +
      '<p class="pergunta-pacto" style="color:var(--vinho)">Ficou alguma dúvida sobre o projeto?</p>' +
      '<button type="button" class="pacto-botao" data-pacto="duvida">Sem dúvidas</button></section>'],

    ["cliente",
      '<section class="slide vinho"><p class="rotulo">Uma pergunta sincera</p>' +
      '<p class="pergunta-pacto">Tirando o preço da mesa, vocês seriam nossos clientes?</p>' +
      '<button type="button" class="pacto-botao" data-pacto="cliente">Sim, seríamos</button></section>'],

    ["valor",
      '<section class="slide"><p class="rotulo">Valor × preço</p><h2>Quanto vale e quanto custa</h2><div class="colunas">' +
      '<div class="caixa"><h3>No mercado</h3><p>Um projeto como este, feito por ' + H.esc(s.ancoraValor) + ", fica em torno de</p>" +
      '<p class="numero-grande" style="font-size:56px">' + falta("valor de mercado") + "</p></div>" +
      '<div class="caixa vinho"><h3>Na MecTRIA</h3><p>' + H.esc(maiuscula(E.fraseValor)) + ".</p>" +
      "<p>E o que o projeto paga volta para a formação de engenheiros da região.</p></div>" +
      '</div><button type="button" class="pacto-botao" data-pacto="valor">Fez sentido</button></section>'],

    ["provas",
      '<section class="slide nevoa"><p class="rotulo">Quem já confiou</p><h2>Clientes e casos</h2><div class="colunas-3">' +
      '<div class="caixa">' + falta("caso de " + s.nome.toLowerCase() + ", com autorização") + "</div>" +
      '<div class="caixa">' + falta("depoimento de cliente") + "</div>" +
      '<div class="caixa">' + falta("logos de clientes") + "</div>" +
      '</div><p class="grande" style="margin-top:40px">' + H.esc(voltam ? voltam.texto : "") + "</p></section>"],

    ["investimento",
      '<section class="slide"><p class="rotulo">Investimento</p><h2>O investimento no projeto</h2><div class="colunas">' +
      '<div><p class="numero-grande">' + (v.valor ? H.esc(v.valor) : falta("valor")) + "</p>" +
      '<p class="grande">em até ' + E.regras.parcelasSemJuros + "x sem juros, ou à vista com " + E.regras.descontoAVista + "% de desconto</p></div>" +
      '<div class="caixa"><h3>O retorno</h3><p>' + (r["ci-numeros"] ? H.esc(maiuscula(r["ci-numeros"])) : falta("números do cliente")) + "</p>" +
      "<p>O projeto se paga em " + falta("prazo de retorno") + ".</p></div>" +
      '</div><p class="resumo-pactos" style="margin-top:40px"></p></section>'],

    ["passos",
      '<section class="slide nevoa"><p class="rotulo">Próximos passos</p><h2>Para começar</h2>' +
      '<ol class="etapas"><li>Aceite da proposta</li><li>Contrato</li><li>ART, quando o projeto exigir</li>' +
      "<li>Kick-off e visita técnica em " + falta("data") + "</li></ol>" +
      '<p style="margin-top:50px">' + (v.vendedor ? H.esc(v.vendedor) + " · " : "") + H.esc(E.email) + " · " + H.esc(E.site) + "</p></section>"],
  ];

  var ocultar = CONFIG.ocultar || [];
  var html = [];
  slides.forEach(function (sl) {
    if (ocultar.indexOf(sl[0]) === -1) html.push(sl[1]);
    (CONFIG.extras || []).forEach(function (x) {
      if (x.depoisDe === sl[0]) html.push(x.html);
    });
  });

  document.getElementById("deck").innerHTML = html.join("");
  DECK.iniciar({ servico: s.id });
};
