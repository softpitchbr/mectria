import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { servicosDaCarta } from "../../../compartilhado/dados/servicos-completos";
import { roteiroPadrao } from "../../../compartilhado/proposta";
import type { Servico } from "../../../compartilhado/servico";
import { abrir, fingirApi, PESSOAS } from "../../teste/ajuda";

const DT = servicosDaCarta().find((s) => s.id === "desenho-tecnico")!;
const corpoDe = (init?: RequestInit) => JSON.parse(String(init?.body)) as Record<string, unknown>;

test("o closer não vê Serviços no menu e /servicos mostra sem acesso", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/servicos");
  expect(await screen.findByText("Seu acesso não inclui Serviços. Fale com o diretor comercial da MecTRIA.")).toBeInTheDocument();
  expect(within(screen.getByRole("navigation", { name: "Seções" })).queryByRole("link", { name: /Serviços/ })).not.toBeInTheDocument();
});

test("a lista mostra os 12 com a situação; Emissão de Carbono em estruturação", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor } });
  abrir("/servicos");
  const lista = await screen.findByRole("list", { name: "Serviços" });
  await waitFor(() => expect(within(lista).getAllByRole("listitem")).toHaveLength(12));
  const carbono = within(lista).getByText("Emissão de Carbono (Emissão Zero)").closest("li")!;
  expect(carbono).toHaveTextContent("Em estruturação");
  expect(carbono).toHaveTextContent("Apresentação de exemplo");
  const dp = within(lista).getByText("Desenvolvimento de Produto").closest("li")!;
  expect(dp).toHaveTextContent("9 perguntas técnicas");
  expect(within(dp).getByRole("link", { name: "Editar Desenvolvimento de Produto" })).toHaveAttribute("href", "/servicos/desenvolvimento-de-produto");
});

test("criar um serviço manda nome, sigla e as dores linha a linha", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "POST /api/servicos": (init) => {
      enviado = corpoDe(init);
      return { status: 201, corpo: { ...(enviado as object), id: "servico-novo", apresentacao: null } };
    },
    "GET /api/servicos/servico-novo": { corpo: { ...DT, id: "servico-novo", nome: "Serviço Novo" } },
  });
  abrir("/servicos");
  await userEvent.click(await screen.findByRole("button", { name: "Novo serviço" }));
  const form = await screen.findByRole("form", { name: "Serviço" });
  await userEvent.type(within(form).getByLabelText("Nome"), "Serviço Novo");
  await userEvent.type(within(form).getByLabelText("Sigla"), "SN");
  await userEvent.type(within(form).getByLabelText("Dores (uma por linha)"), "Dor um{Enter}{Enter}Dor dois ");
  await userEvent.type(within(form).getByLabelText("O que entregamos (um item por linha)"), "Projeto");
  await userEvent.click(within(form).getByRole("button", { name: "Salvar" }));
  await waitFor(() =>
    expect(enviado).toEqual({
      nome: "Serviço Novo",
      sigla: "SN",
      resumo: "",
      dores: ["Dor um", "Dor dois"],
      entregamos: ["Projeto"],
      ficaComCliente: [],
      ancoraValor: "",
      situacao: "ativo",
      perguntas: [],
      roteiro: null,
    }),
  );
  await waitFor(() => expect(window.location.pathname).toBe("/servicos/servico-novo"));
  expect(screen.getAllByRole("status").at(-1)).toHaveTextContent("Serviço salvo.");
});

test("adicionar pergunta de opções manda as opções; a pergunta salva tem Desativar e não Remover", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: DT },
    "PUT /api/servicos/desenho-tecnico": (init) => {
      enviado = corpoDe(init);
      return { corpo: { ...DT, ...(enviado as object) } };
    },
  });
  abrir("/servicos/desenho-tecnico");
  const form = await screen.findByRole("form", { name: "Serviço" });
  const primeira = within(form).getByRole("group", { name: "Pergunta 1" });
  expect(within(primeira).getByRole("button", { name: "Desativar" })).toBeInTheDocument();
  expect(within(primeira).queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  await userEvent.click(within(primeira).getByRole("button", { name: "Desativar" }));
  await userEvent.click(within(form).getByRole("button", { name: "Adicionar pergunta" }));
  const nova = within(form).getByRole("group", { name: `Pergunta ${DT.perguntas.length + 1}` });
  expect(within(nova).getByRole("button", { name: "Remover" })).toBeInTheDocument();
  await userEvent.type(within(nova).getByLabelText("Texto da pergunta"), "Qual o material?");
  await userEvent.selectOptions(within(nova).getByLabelText("Tipo"), "opcoes");
  await userEvent.type(within(nova).getByLabelText("Opções (uma por linha)"), "Aço{Enter}Alumínio");
  await userEvent.selectOptions(within(nova).getByLabelText("Bloco"), "parametros");
  await userEvent.click(within(form).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(enviado).toBeDefined());
  const perguntas = enviado!.perguntas as Record<string, unknown>[];
  expect(perguntas[0]).toMatchObject({ id: DT.perguntas[0].id, inativa: true });
  expect(perguntas.at(-1)).toEqual({ id: expect.stringMatching(/^dt-[a-z]{6}$/), tipo: "opcoes", texto: "Qual o material?", opcoes: ["Aço", "Alumínio"], bloco: "parametros" });
  expect(perguntas).toHaveLength(DT.perguntas.length + 1);
});

test("personalizar o roteiro traz os 13 slides; mudar o tempo e salvar manda o roteiro", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: DT },
    "PUT /api/servicos/desenho-tecnico": (init) => {
      enviado = corpoDe(init);
      return { corpo: { ...DT, ...(enviado as object) } };
    },
  });
  abrir("/servicos/desenho-tecnico");
  const form = await screen.findByRole("form", { name: "Serviço" });
  expect(within(form).getByText("Usa o roteiro padrão (13 slides da apresentação de exemplo).")).toBeInTheDocument();
  await userEvent.click(within(form).getByRole("button", { name: "Personalizar o roteiro" }));
  const sexto = within(form).getByRole("group", { name: "Slide 6" });
  expect(within(sexto).getByLabelText("Título")).toHaveValue("Onde vocês estão e aonde querem chegar");
  await userEvent.clear(within(sexto).getByLabelText("Tempo (minutos)"));
  await userEvent.type(within(sexto).getByLabelText("Tempo (minutos)"), "8");
  await userEvent.click(within(form).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(enviado).toBeDefined());
  const roteiro = enviado!.roteiro as Servico["roteiro"];
  expect(roteiro).toHaveLength(13);
  expect(roteiro![5]).toEqual({ ...roteiroPadrao()[5], tempo: 8 });
});

test("voltar ao roteiro padrão manda roteiro null", async () => {
  let enviado: Record<string, unknown> | undefined;
  const comRoteiro = { ...DT, roteiro: [{ id: "um", titulo: "Um", fala: "", pacto: null, tempo: 1 }] };
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: comRoteiro },
    "PUT /api/servicos/desenho-tecnico": (init) => {
      enviado = corpoDe(init);
      return { corpo: { ...comRoteiro, ...(enviado as object) } };
    },
  });
  abrir("/servicos/desenho-tecnico");
  const form = await screen.findByRole("form", { name: "Serviço" });
  expect(within(form).getByRole("group", { name: "Slide 1" })).toBeInTheDocument();
  await userEvent.click(within(form).getByRole("button", { name: "Voltar ao roteiro padrão" }));
  await userEvent.click(within(form).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(enviado).toMatchObject({ roteiro: null }));
});

test("erro do servidor (409) aparece no formulário", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: DT },
    "PUT /api/servicos/desenho-tecnico": { status: 409, corpo: { erro: "conflito", mensagem: "Já existe um serviço com esse nome." } },
  });
  abrir("/servicos/desenho-tecnico");
  const form = await screen.findByRole("form", { name: "Serviço" });
  await userEvent.click(within(form).getByRole("button", { name: "Salvar" }));
  expect(await within(form).findByRole("alert")).toHaveTextContent("Já existe um serviço com esse nome.");
});
