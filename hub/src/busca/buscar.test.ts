import { buscar } from "./buscar";

const itens = ["Ir para Reuniões", "Ir para Follow-up", "Usar tema escuro", "Objeções frequentes"].map((titulo, i) => ({
  id: String(i),
  titulo,
  grupo: "g",
  executar: () => {},
}));

test("ignora acento e caixa", () => {
  expect(buscar("objecao", itens).map((i) => i.titulo)).toEqual(["Objeções frequentes"]);
  expect(buscar("REUNIOES", itens).map((i) => i.titulo)).toEqual(["Ir para Reuniões"]);
});

test("todas as palavras precisam aparecer", () => {
  expect(buscar("tema escuro", itens).map((i) => i.titulo)).toEqual(["Usar tema escuro"]);
  expect(buscar("tema claro", itens)).toEqual([]);
});

test("começo do título vem primeiro", () => {
  const r = buscar("ir", [...itens, { id: "x", titulo: "Mandar briefing", grupo: "g", palavras: ["ir"], executar: () => {} }]);
  expect(r[0].titulo).toBe("Ir para Reuniões");
});

test("começo de palavra vale mais que o meio dela, e o empate segue a ordem", () => {
  const lista = ["Escuro total", "Tema escuro", "Obscuro"].map((titulo, i) => ({ id: String(i), titulo, grupo: "g", executar: () => {} }));
  expect(buscar("escuro", lista).map((i) => i.titulo)).toEqual(["Escuro total", "Tema escuro"]);
  expect(buscar("scuro", lista).map((i) => i.titulo)).toEqual(["Escuro total", "Tema escuro", "Obscuro"]);
});

test("consulta vazia sugere os primeiros", () => {
  expect(buscar("", itens, 2)).toHaveLength(2);
  expect(buscar("   ", itens, 2).map((i) => i.id)).toEqual(["0", "1"]);
});

test("respeita o limite", () => {
  expect(buscar("ir", itens, 1)).toHaveLength(1);
});

test("singular acha plural e quem ainda está digitando também acha", () => {
  const lista = ["Apresentações", "Comerciais", "Motores"].map((titulo, i) => ({ id: String(i), titulo, grupo: "g", executar: () => {} }));
  expect(buscar("apresentacao", lista).map((i) => i.titulo)).toEqual(["Apresentações"]);
  expect(buscar("apresentaco", lista).map((i) => i.titulo)).toEqual(["Apresentações"]);
  expect(buscar("comercial", lista).map((i) => i.titulo)).toEqual(["Comerciais"]);
  expect(buscar("motor", lista).map((i) => i.titulo)).toEqual(["Motores"]);
});
