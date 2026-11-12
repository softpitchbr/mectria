import { SLIDES_DA_DIAGNOSTICA } from "../../compartilhado/diagnostica";
import html from "../../apresentacoes/diagnostica.html?raw";
import { abrirDeck, INTERACOES_VAZIAS } from "./decks";

const DADOS = { empresa: "Solda Hunter", contato: "Ana", data: "Sex, 13/11", etapas: "Objetivos\nPlanos\nDesafios", etapa: "Planos" };

test("avisa a pronta com 5 slides, na ordem do painel", async () => {
  const { doc, recebidas } = await abrirDeck(html);
  expect(recebidas[0]).toMatchObject({ tipo: "pronta", slides: 5, acoes: [], campos: [] });
  expect([...doc.querySelectorAll("[data-slide]")].map((s) => s.getAttribute("data-slide"))).toEqual([...SLIDES_DA_DIAGNOSTICA]);
});

test("o slide escuta destaca a etapa atual e marca as anteriores", async () => {
  const { doc, enviar, esperar, visiveis } = await abrirDeck(html);
  enviar({ tipo: "estado", slide: 2, dados: DADOS, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(visiveis()).toEqual(["escuta"]);
  const etapas = [...doc.querySelectorAll('[data-slide="escuta"] [data-etapas] li')];
  expect(etapas.map((li) => [li.textContent?.replace(/\s+/g, " ").trim(), li.getAttribute("data-estado")])).toEqual([
    ["01 Objetivos", "feita"],
    ["02 Planos", "atual"],
    ["03 Desafios", "proxima"],
  ]);
  expect(etapas[1].getAttribute("aria-current")).toBe("step");
  enviar({ tipo: "estado", slide: 2, dados: { ...DADOS, etapa: "Desafios" }, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(doc.querySelector('[data-slide="escuta"] [aria-current="step"]')?.textContent).toContain("Desafios");
});

test("sem etapas nos dados, o slide escuta não quebra", async () => {
  const { doc, enviar, esperar, texto } = await abrirDeck(html);
  enviar({ tipo: "estado", slide: 2, dados: {}, interacoes: INTERACOES_VAZIAS });
  await esperar();
  expect(doc.querySelectorAll('[data-slide="escuta"] [data-etapas] li')).toHaveLength(0);
  expect(texto('[data-slide="escuta"]')).not.toMatch(/undefined|NaN/);
  expect(texto('[data-slide="agenda"]')).toContain("[empresa do cliente]");
});

test("os textos do site entram sem mudar uma palavra", async () => {
  const { texto } = await abrirDeck(html);
  const quemSomos = texto('[data-slide="quem-somos"]');
  for (const trecho of [
    "Mais do que engenharia: propósito, aprendizado e transformação real.",
    "A MecTRIA é a Empresa Júnior de Engenharia Mecânica da UFTM, em Uberaba (MG). Desde 2013, unimos conhecimento acadêmico e prática de mercado para entregar soluções mecânicas eficientes e seguras.",
    "Com o apoio de professores doutores, garantimos excelência no produto e no atendimento. Cuidado em cada detalhe, do primeiro contato à entrega.",
    "Ser uma empresa inovadora que impacta a sociedade, proporcionando boas experiências aos clientes, a fim de formar líderes que se destacam no mercado e se preocupam com o futuro do país.",
    "+13 anos de mercado",
    "+130 projetos realizados",
    "100% dos clientes avaliados recomendam",
    "70% abaixo do preço de mercado",
  ]) {
    expect(quemSomos).toContain(trecho);
  }
  expect(texto('[data-slide="escuta"]')).toContain("Antes de desenhar, a gente escuta.");
  expect(texto('[data-slide="escuta"]')).toContain(
    "Entendemos a máquina, o processo e o problema real. Um sistema funcionando é o ponto de partida: tudo o que vem depois precisa respeitar o que ele faz.",
  );
});
