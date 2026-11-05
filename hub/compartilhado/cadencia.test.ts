import { ROTULO_TOQUE, datasDaCadencia, modeloDoToque, preencherModelo } from "./cadencia";
import { CADENCIA, MOTIVOS_PERDA } from "./dados/cadencia";
import { SERVICOS } from "./dados/servicos";

const datas = (apresentadaEm: string) => datasDaCadencia(apresentadaEm).map((t) => `${t.codigo} ${t.previstoPara}`);

test("cadência de 7 dias pelo dia da reunião", () => {
  // Segunda: D1 na terça, ligação na quarta, sexta fixa e D7 na segunda seguinte.
  expect(datas("2026-11-09")).toEqual(["D0 2026-11-09", "D1 2026-11-10", "LIGACAO 2026-11-11", "SEXTA 2026-11-13", "D7 2026-11-16"]);
  // Terça: ligação na quinta.
  expect(datas("2026-11-10")).toEqual(["D0 2026-11-10", "D1 2026-11-11", "LIGACAO 2026-11-12", "SEXTA 2026-11-13", "D7 2026-11-17"]);
  // Quarta: a ligação pula a sexta e vai para a segunda.
  expect(datas("2026-11-11")).toEqual(["D0 2026-11-11", "D1 2026-11-12", "SEXTA 2026-11-13", "LIGACAO 2026-11-16", "D7 2026-11-18"]);
  // Quinta: a sexta fica no lugar do D1, e a ligação vai para a segunda.
  expect(datas("2026-11-12")).toEqual(["D0 2026-11-12", "SEXTA 2026-11-13", "LIGACAO 2026-11-16", "D7 2026-11-19"]);
  // Sexta: a sexta seguinte é o próprio D7, sem SEXTA separada.
  expect(datas("2026-11-06")).toEqual(["D0 2026-11-06", "D1 2026-11-09", "LIGACAO 2026-11-10", "D7 2026-11-13"]);
});

test("sexta feriado vai para o dia útil anterior", () => {
  // 20/11/2026 é feriado: a sexta fixa vai para a quinta, 19/11.
  expect(datas("2026-11-16")).toEqual(["D0 2026-11-16", "D1 2026-11-17", "LIGACAO 2026-11-18", "SEXTA 2026-11-19", "D7 2026-11-23"]);
  // Reunião na quinta antes do feriado: a sexta cairia no próprio D0, então não sai; o D1 vai para a segunda.
  expect(datas("2026-11-19")).toEqual(["D0 2026-11-19", "D1 2026-11-23", "LIGACAO 2026-11-24", "D7 2026-11-26"]);
});

test("D7 em feriado vai para o dia útil seguinte", () => {
  // 02/11/2026 é feriado: o D7 da reunião de 26/10 vai para 03/11.
  expect(datas("2026-10-26")).toEqual(["D0 2026-10-26", "D1 2026-10-27", "LIGACAO 2026-10-28", "SEXTA 2026-10-30", "D7 2026-11-03"]);
});

test("D7 numa sexta, de reunião numa sexta, usa a mensagem que junta a sexta e o D7", () => {
  expect(modeloDoToque("D7", "2026-11-06").modelo).toContain("na segunda começa o próximo ciclo de projetos");
  expect(modeloDoToque("D7", "2026-11-09").modelo).toContain("Se fizer sentido seguir, me dá um ok por aqui");
  // Reunião numa sexta com o D7 empurrado pelo feriado para a segunda: volta a mensagem do D7.
  expect(modeloDoToque("D7", "2026-11-13").modelo).toContain("Se fizer sentido seguir, me dá um ok por aqui");
  expect(modeloDoToque("SEXTA", "2026-11-09").modelo).toContain("toda segunda-feira começa um ciclo de novos projetos de parceria");
});

test("toques antigos D3 a D15 continuam com rótulo e entram na rotina", () => {
  for (const codigo of ["D3", "D5", "D8", "D12", "D15"] as const) {
    expect(ROTULO_TOQUE[codigo]).toBe(codigo);
    expect(modeloDoToque(codigo, "2026-10-01").modelo.length).toBeGreaterThan(20);
  }
  expect(modeloDoToque("D8", "2026-10-01").canal).toBe("Ligação");
  expect(ROTULO_TOQUE.LIGACAO).toBe("Ligação");
  expect(ROTULO_TOQUE.SEXTA).toBe("Sexta");
});

test("o que falta no modelo vira colchete com o rótulo", () => {
  expect(preencherModelo("Oi, {contato}! {servico} até {data_decisao}.", { contato: "Ana", servico: "Climatização" })).toBe(
    "Oi, Ana! Climatização até [data da decisão].",
  );
});

test("a cadência é a de 7 dias, toda pelo WhatsApp menos a ligação", () => {
  expect(CADENCIA.map((t) => [t.codigo, t.canal])).toEqual([
    ["D0", "WhatsApp"],
    ["D1", "WhatsApp"],
    ["LIGACAO", "Ligação"],
    ["SEXTA", "WhatsApp"],
    ["D7", "WhatsApp"],
  ]);
  expect(CADENCIA[0].modelo).toContain("Como te expliquei na jornada de parcerias, combinamos o sim ou não até {data_decisao}");
  expect(SERVICOS).toHaveLength(12);
  expect(MOTIVOS_PERDA).toContain("Escopo (queria fabricação ou instalação)");
});
