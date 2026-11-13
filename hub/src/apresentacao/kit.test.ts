import { montarDeck } from "../../apresentacoes/montagem";
import kitCss from "../../apresentacoes/fonte/kit.css?raw";
import kitJs from "../../apresentacoes/fonte/kit.js?raw";
import { abrirDeck, INTERACOES_VAZIAS } from "./decks";

const fontes = import.meta.glob<string>("../../apresentacoes/fonte/*.html", { query: "?raw", import: "default", eager: true });
const montadas = import.meta.glob<string>("../../apresentacoes/*.html", { query: "?raw", import: "default", eager: true });
const nomeDe = (caminho: string) => caminho.split("/").at(-1)!;
const teste = () => montarDeck(fontes["../../apresentacoes/fonte/_teste.html"], kitCss, kitJs);

test("cada apresentação montada é igual à do repositório", () => {
  const decks = Object.keys(fontes).filter((c) => !nomeDe(c).startsWith("_"));
  for (const caminho of decks) {
    const montada = montadas[`../../apresentacoes/${nomeDe(caminho)}`];
    expect(montada, `${nomeDe(caminho)} não foi montada (rode npm run apresentacoes)`).toBeDefined();
    expect(montada === montarDeck(fontes[caminho], kitCss, kitJs), `${nomeDe(caminho)} está desatualizada (rode npm run apresentacoes)`).toBe(true);
  }
});

test("a montagem troca as marcas pelo kit sem interpretar $ no conteúdo", () => {
  const html = montarDeck("<head><!-- kit:css --></head><body><!-- kit:js --></body>", "a{content:'$&'}", "var x = '$1';");
  expect(html).toBe("<head><style>\na{content:'$&'}\n</style></head><body><script>\nvar x = '$1';\n</script></body>");
});

test("o kit avisa a pronta com o número de slides e as ações", async () => {
  const { recebidas } = await abrirDeck(teste());
  expect(recebidas[0]).toEqual({
    mectria: 1,
    tipo: "pronta",
    slides: 3,
    acoes: [{ slide: 1, id: "fazer", rotulo: "Fazer" }],
    campos: [{ slide: 1, id: "horas", rotulo: "Horas" }],
  });
});

test("o kit preenche {chave} e mostra o rótulo do hub no que falta", async () => {
  const { enviar, esperar, texto } = await abrirDeck(teste());
  enviar({ tipo: "estado", slide: 0, dados: { empresa: "Prensa Nova", servico: "Desenvolvimento de Produto" }, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(texto('[data-slide="um"] .rotulo')).toBe("Proposta para Prensa Nova");
  expect(texto('[data-slide="um"] h2')).toBe("Desenvolvimento de Produto");
  expect(texto('[data-slide="dois"] p')).toBe("Time: [nomes e papéis do time]");
  expect(texto("[data-contagem]")).toBe("01 / 03");
});

test("data-lista desenha os itens (um por linha) e some sem eles", async () => {
  const html = montarDeck(
    '<div id="palco"><section class="slide" data-slide="um"><ul data-lista="entregamosItens"></ul></section></div><!-- kit:js --><script>Apresentacao.iniciar({});</script>',
    "",
    kitJs,
  );
  const { doc, enviar, esperar } = await abrirDeck(html);
  enviar({ tipo: "estado", slide: 0, dados: { entregamosItens: "Projeto CAD 3D\n\nManual" }, interacoes: INTERACOES_VAZIAS });
  await esperar();
  const lista = doc.querySelector("[data-lista]")!;
  expect([...lista.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["Projeto CAD 3D", "Manual"]);
  enviar({ tipo: "estado", slide: 0, dados: {}, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(lista.querySelectorAll("li")).toHaveLength(0);
  expect(lista.hasAttribute("hidden")).toBe(true);
});

test("só o slide atual fica visível (estilo computado)", async () => {
  const { enviar, esperar, visiveis } = await abrirDeck(teste());
  expect(visiveis()).toEqual(["um"]);
  enviar({ tipo: "estado", slide: 1, dados: {}, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(visiveis()).toEqual(["dois"]);
  enviar({ tipo: "slide", slide: 9 });
  await esperar();
  expect(visiveis()).toEqual(["tres"]);
});

test("a seta vira tecla, menos dentro de um campo; a ação chega ao deck", async () => {
  const { doc, janela, recebidas, enviar, esperar } = await abrirDeck(teste());
  doc.dispatchEvent(new janela.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "tecla", tecla: "ArrowLeft" });
  const total = recebidas.length;
  doc.querySelector("input")!.dispatchEvent(new janela.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await esperar();
  expect(recebidas).toHaveLength(total);
  enviar({ tipo: "acionar", acao: "fazer" });
  await esperar();
  expect(recebidas.at(-1)).toEqual({ mectria: 1, tipo: "evento", evento: "preco", etapa: 1 });
});

test("mensagem que não vem de window.parent é ignorada", async () => {
  const { janela, esperar, visiveis } = await abrirDeck(teste());
  janela.dispatchEvent(new janela.MessageEvent("message", { data: { mectria: 1, tipo: "slide", slide: 2 } }));
  await esperar();
  expect(visiveis()).toEqual(["um"]);
});
