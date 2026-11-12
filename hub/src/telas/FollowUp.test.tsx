import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { diasDepois, hojeEmSaoPaulo } from "../../compartilhado/datas";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";

function item(id: number, empresa: string, estado: string, codigo: string, extra: { atrasados?: number; dor?: string } = {}) {
  return {
    oportunidade: {
      id,
      empresa,
      contato: "Ana",
      telefone: "",
      email: "",
      cidade: "",
      segmento: "",
      origem: "registro manual",
      servico: "climatizacao",
      hunterId: null,
      closerId: 2,
      closerNome: "Vinícius Miguel",
      situacao: "em_followup",
      motivoPerda: null,
      valorFechado: null,
      criadoEm: "",
      atualizadoEm: "",
    },
    proposta: {
      id: id * 10,
      oportunidadeId: id,
      servico: "climatizacao",
      valor: 1250000,
      apresentadaEm: "2026-11-13",
      dataDecisao: null,
      quemDecide: "Ana (sócia)",
      dor: extra.dor ?? "",
      validade: null,
    },
    proximo: { id: id * 100, propostaId: id * 10, codigo, previstoPara: "2026-11-18", feitoEm: null, canal: null, resultado: null },
    atrasados: extra.atrasados ?? 0,
    estado,
  };
}

const ATRASADA = item(1, "Usinagem Alfa", "atrasado", "D1", { atrasados: 2 });
const DE_HOJE = item(2, "Metalúrgica Beta", "hoje", "D0");

test("atrasados vêm primeiro, com a tag e o código do toque", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [ATRASADA, DE_HOJE] } });
  abrir("/follow-up");
  const cartoes = await within(await screen.findByRole("main")).findAllByRole("listitem");
  expect(cartoes[0]).toHaveTextContent("Usinagem Alfa");
  expect(cartoes[0]).toHaveTextContent("Atrasado · 2 toques");
  expect(cartoes[0]).toHaveTextContent("D1");
  expect(cartoes[1]).toHaveTextContent("Hoje");
  expect(screen.getByText("2 na rua · 1 atrasado")).toBeInTheDocument();
});

test("toque em foco mostra a mensagem preenchida e o que falta entre colchetes", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [DE_HOJE] } });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: /Metalúrgica Beta/ }));
  const foco = screen.getByRole("dialog", { name: "Toque D0 · Metalúrgica Beta" });
  const mensagem = within(foco).getByLabelText("Mensagem do toque");
  expect(mensagem).toHaveTextContent("Fala, Ana, tudo bem?");
  expect(mensagem).toHaveTextContent("[dor do cliente]");
  expect(mensagem).toHaveTextContent("Vinícius, da MecTRIA");
});

test("registrar toque manda canal e resultado e tira o atraso", async () => {
  let enviado: unknown;
  let chamadas = 0;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": () => ({ corpo: chamadas++ === 0 ? [ATRASADA] : [{ ...ATRASADA, estado: "em_dia", atrasados: 0 }] }),
    "PATCH /api/toques/100": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...ATRASADA.proximo, feitoEm: "agora" } };
    },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: /Usinagem Alfa/ }));
  const foco = screen.getByRole("dialog");
  await userEvent.selectOptions(within(foco).getByLabelText("Canal"), "WhatsApp");
  await userEvent.type(within(foco).getByLabelText("Como foi"), "Respondeu que decide sexta");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar toque" }));
  expect(enviado).toEqual({ canal: "WhatsApp", resultado: "Respondeu que decide sexta" });
  expect(await screen.findByRole("status")).toHaveTextContent("Toque registrado.");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText(/Atrasado/)).not.toBeInTheDocument();
});

test("perdida exige motivo", async () => {
  let enviado: unknown;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": { corpo: [ATRASADA] },
    "POST /api/oportunidades/1/resultado": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...ATRASADA.oportunidade, situacao: "perdida" } };
    },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: /Usinagem Alfa/ }));
  await userEvent.click(screen.getByRole("button", { name: "Registrar resultado da proposta" }));
  const foco = screen.getByRole("dialog");
  await userEvent.click(within(foco).getByRole("radio", { name: "Perdida" }));
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar resultado" }));
  expect(within(foco).getByRole("alert")).toHaveTextContent("Escolha o motivo.");
  expect(enviado).toBeUndefined();
  await userEvent.selectOptions(within(foco).getByLabelText("Motivo"), "Preço");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar resultado" }));
  expect(enviado).toEqual({ resultado: "perdida", motivo: "Preço" });
});

test("nova proposta com valor brasileiro", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": { corpo: [] },
    "GET /api/oportunidades": { corpo: [] },
    "POST /api/propostas": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { status: 201, corpo: { proposta: {}, toques: [1, 2, 3, 4, 5, 6, 7] } };
    },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: "Registrar proposta apresentada" }));
  const foco = screen.getByRole("dialog", { name: "Registrar proposta apresentada" });
  await userEvent.type(within(foco).getByLabelText("Empresa"), "Rita Usinagem");
  await userEvent.selectOptions(within(foco).getByLabelText("Serviço"), "climatizacao");
  await userEvent.type(within(foco).getByLabelText("Valor"), "12.500,00");
  await userEvent.type(within(foco).getByLabelText("Quem decide"), "Rita");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar proposta" }));
  expect(enviado).toMatchObject({ empresa: "Rita Usinagem", servico: "climatizacao", valor: "12.500,00", quemDecide: "Rita" });
  expect(await screen.findByRole("status")).toHaveTextContent("Proposta registrada. 7 toques na agenda.");
});

test("abrir com ?toque=ID já mostra o toque em foco", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [ATRASADA, DE_HOJE] } });
  abrir("/follow-up?toque=200");
  expect(await screen.findByRole("dialog", { name: "Toque D0 · Metalúrgica Beta" })).toBeInTheDocument();
});

test("o 409 de toque já feito aparece no foco", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": { corpo: [ATRASADA] },
    "PATCH /api/toques/100": { status: 409, corpo: { erro: "conflito", mensagem: "Esse toque já foi registrado." } },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: /Usinagem Alfa/ }));
  const foco = screen.getByRole("dialog");
  await userEvent.type(within(foco).getByLabelText("Como foi"), "Liguei");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar toque" }));
  expect(await within(foco).findByRole("alert")).toHaveTextContent("Esse toque já foi registrado.");
});

test("abrir com ?proposta=ID mostra o próximo toque dessa proposta", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [ATRASADA, DE_HOJE] } });
  abrir("/follow-up?proposta=20");
  expect(await screen.findByRole("dialog", { name: "Toque D0 · Metalúrgica Beta" })).toBeInTheDocument();
});

test("com o foco aberto, o botão da página deixa de ser vermelho", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [DE_HOJE] } });
  abrir("/follow-up");
  const botao = await screen.findByRole("button", { name: "Registrar proposta apresentada" });
  expect(botao).toHaveClass("primario");
  await userEvent.click(await screen.findByRole("button", { name: /Metalúrgica Beta/ }));
  expect(botao).not.toHaveClass("primario");
});

test("nutrição pede o mês para retomar e manda retomarEm", async () => {
  const enviados: unknown[] = [];
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": { corpo: [ATRASADA] },
    "POST /api/oportunidades/1/resultado": (init) => {
      enviados.push(JSON.parse(String(init?.body)));
      return { corpo: { ...ATRASADA.oportunidade, situacao: "nutricao" } };
    },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: /Usinagem Alfa/ }));
  await userEvent.click(screen.getByRole("button", { name: "Registrar resultado da proposta" }));
  const foco = screen.getByRole("dialog");
  await userEvent.click(within(foco).getByRole("radio", { name: "Nutrição" }));
  expect(within(foco).getByText(/volta na aba Reativação/)).toBeInTheDocument();
  const retomar = within(foco).getByRole("combobox", { name: "Retomar em" });
  expect(retomar).toHaveDisplayValue("Em 45 dias (o cliente não deu prazo)");
  const proximoMes = `${diasDepois(`${hojeEmSaoPaulo().slice(0, 7)}-01`, 32).slice(0, 7)}-01`;
  await userEvent.selectOptions(retomar, proximoMes);
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar resultado" }));
  await vi.waitFor(() => expect(enviados).toEqual([{ resultado: "nutricao", retomarEm: proximoMes }]));
});

test("proposta de oportunidade de colega: assume e depois registra", async () => {
  const chamadas: string[] = [];
  const daClara = {
    ...ATRASADA.oportunidade,
    id: 7,
    empresa: "Torno Ômega",
    contato: "Rui",
    situacao: "diagnostica_marcada",
    closerId: 9,
    closerNome: "Clara Closer",
  };
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "GET /api/followup": { corpo: [] },
    "GET /api/oportunidades": { corpo: [daClara] },
    "PATCH /api/oportunidades/7": () => {
      chamadas.push("assumir");
      return { corpo: { ...daClara, closerId: 2 } };
    },
    "POST /api/propostas": () => {
      chamadas.push("proposta");
      return { status: 201, corpo: { proposta: {}, toques: [1, 2, 3, 4, 5, 6, 7] } };
    },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: "Registrar proposta apresentada" }));
  const foco = screen.getByRole("dialog", { name: "Registrar proposta apresentada" });
  await within(foco).findByRole("option", { name: "Torno Ômega · Rui · de Clara" });
  await userEvent.selectOptions(within(foco).getByLabelText("Oportunidade"), "7");
  expect(within(foco).getByText("Essa oportunidade está com Clara. Ao registrar, você assume.")).toBeInTheDocument();
  await userEvent.type(within(foco).getByLabelText("Valor"), "9.000,00");
  await userEvent.type(within(foco).getByLabelText("Quem decide"), "Rui");
  await userEvent.click(within(foco).getByRole("button", { name: "Registrar proposta" }));
  await screen.findByRole("status");
  expect(chamadas).toEqual(["assumir", "proposta"]);
});

test("o card do follow-up mostra a resposta de Projetos", async () => {
  const comResposta = {
    ...item(9, "Caldeiraria Sul", "hoje", "D1"),
    respostasTecnicas: [{ id: 7, anotacaoId: 3, oportunidadeId: 9, texto: "Qual a vazão?", prazo: "2026-11-04", situacao: "respondida", resposta: "3 m³/h" }],
  };
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [comResposta] } });
  abrir("/follow-up");
  const cartao = await screen.findByRole("button", { name: /Caldeiraria Sul/ });
  expect(cartao).toHaveTextContent("Projetos respondeu: 3 m³/h");
  await userEvent.click(cartao);
  expect(within(screen.getByRole("dialog")).getByRole("list", { name: "Respostas de Projetos" })).toHaveTextContent("Qual a vazão?3 m³/h");
});

test("o cartão do follow-up mostra os dias em negociação", async () => {
  const hoje = hojeEmSaoPaulo();
  const emNegociacao = item(11, "Bomba Norte", "em_dia", "D1");
  emNegociacao.proposta.apresentadaEm = diasDepois(hoje, -5);
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "GET /api/followup": { corpo: [emNegociacao] } });
  abrir("/follow-up");
  expect(await screen.findByRole("button", { name: /Bomba Norte/ })).toHaveTextContent("Em negociação há 5 dias");
});

test("a oportunidade com serviço inativado mostra o serviço dela no seletor", async () => {
  const antiga = { id: 8, empresa: "Desenho Antigo", contato: "Ana", telefone: "", servico: "desenho-tecnico", closerId: 2, situacao: "diagnostica_marcada", closerNome: "Vinícius Miguel" };
  fingirApi({
    "/api/eu": { corpo: PESSOAS.closer },
    "/api/servicos": { corpo: servicosDaCarta().map((s) => (s.id === "desenho-tecnico" ? { ...s, situacao: "inativo" } : s)) },
    "GET /api/followup": { corpo: [] },
    "GET /api/oportunidades": { corpo: [antiga] },
  });
  abrir("/follow-up");
  await userEvent.click(await screen.findByRole("button", { name: "Registrar proposta apresentada" }));
  const foco = screen.getByRole("dialog", { name: "Registrar proposta apresentada" });
  const servico = within(foco).getByLabelText("Serviço");
  expect(within(servico).queryByRole("option", { name: /Desenho Técnico/ })).not.toBeInTheDocument();
  await within(foco).findByRole("option", { name: /Desenho Antigo/ });
  await userEvent.selectOptions(within(foco).getByLabelText("Oportunidade"), "8");
  expect(servico).toHaveValue("desenho-tecnico");
  expect(within(servico).getByRole("option", { name: "Desenho Técnico (inativo)" })).toBeInTheDocument();
});
