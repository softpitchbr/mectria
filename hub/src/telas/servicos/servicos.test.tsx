import { act, screen, waitFor, within } from "@testing-library/react";
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

// A apresentação de proposta do serviço (Task 10) ---------------------------------

const ARQUIVO = { arquivo: "dt.html", bytes: 2048, versao: 2, enviadaEm: "2026-11-11 13:05:00", enviadaPor: "Diana Diretora" };
const HTML = "<!doctype html><html><body>Proposta</body></html>";

test("enviar um .html manda arquivo e html e mostra a versão nova", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: DT },
    "PUT /api/servicos/desenho-tecnico/apresentacao": (init) => {
      enviado = corpoDe(init);
      return { corpo: { ...DT, apresentacao: ARQUIVO } };
    },
  });
  abrir("/servicos/desenho-tecnico");
  const secao = (await screen.findByRole("heading", { name: "Apresentação de proposta" })).closest("section")!;
  expect(secao).toHaveTextContent("Sem apresentação própria: a reunião usa a de exemplo.");
  await userEvent.upload(within(secao).getByLabelText("Enviar apresentação (.html)"), new File([HTML], "dt.html", { type: "text/html" }));
  await waitFor(() => expect(enviado).toEqual({ arquivo: "dt.html", html: HTML }));
  await waitFor(() => expect(secao).toHaveTextContent("dt.html · 2 KB · versão 2"));
  expect(secao).toHaveTextContent("Enviada em 11/11/2026 por Diana Diretora");
});

test("arquivo de mais de 5 MB é recusado na tela, sem chamar a API", async () => {
  const falso = fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/servicos/desenho-tecnico": { corpo: DT } });
  abrir("/servicos/desenho-tecnico");
  const secao = (await screen.findByRole("heading", { name: "Apresentação de proposta" })).closest("section")!;
  const grande = new File([HTML], "grande.html", { type: "text/html" });
  Object.defineProperty(grande, "size", { value: 5 * 1024 * 1024 + 1 });
  await userEvent.upload(within(secao).getByLabelText("Enviar apresentação (.html)"), grande);
  expect(await within(secao).findByRole("alert")).toHaveTextContent("A apresentação passa de 5 MB. Diminua as imagens e envie de novo.");
  await userEvent.upload(within(secao).getByLabelText("Enviar apresentação (.html)"), new File(["%PDF"], "proposta.pdf", { type: "application/pdf" }), { applyAccept: false });
  expect(await within(secao).findByRole("alert")).toHaveTextContent("Envie um arquivo .html.");
  expect(falso.mock.calls.some(([url]) => String(url).endsWith("/apresentacao"))).toBe(false);
});

test("remover pede confirmação e manda DELETE", async () => {
  let removeu = false;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/servicos/desenho-tecnico": { corpo: { ...DT, apresentacao: ARQUIVO } },
    "DELETE /api/servicos/desenho-tecnico/apresentacao": () => {
      removeu = true;
      return { corpo: { ...DT, apresentacao: null } };
    },
  });
  abrir("/servicos/desenho-tecnico");
  const secao = (await screen.findByRole("heading", { name: "Apresentação de proposta" })).closest("section")!;
  await userEvent.click(within(secao).getByRole("button", { name: "Remover apresentação" }));
  expect(removeu).toBe(false);
  expect(within(secao).getByText("Remover a apresentação? As reuniões deste serviço voltam para a de exemplo.")).toBeInTheDocument();
  await userEvent.click(within(secao).getByRole("button", { name: "Cancelar" }));
  expect(removeu).toBe(false);
  await userEvent.click(within(secao).getByRole("button", { name: "Remover apresentação" }));
  await userEvent.click(within(secao).getByRole("button", { name: "Sim, remover" }));
  await waitFor(() => expect(secao).toHaveTextContent("Sem apresentação própria: a reunião usa a de exemplo."));
  expect(removeu).toBe(true);
});

test("Ver a apresentação abre o iframe do serviço, e Próximo passa o slide", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/servicos/desenho-tecnico": { corpo: { ...DT, apresentacao: ARQUIVO } } });
  abrir("/servicos/desenho-tecnico");
  const secao = (await screen.findByRole("heading", { name: "Apresentação de proposta" })).closest("section")!;
  await userEvent.click(within(secao).getByRole("button", { name: "Ver a apresentação" }));
  const foco = await screen.findByRole("dialog", { name: "Apresentação · Desenho Técnico" });
  const iframe = within(foco).getByTitle("Apresentação · Desenho Técnico") as HTMLIFrameElement;
  expect(iframe.getAttribute("src")).toBe("/api/servicos/desenho-tecnico/apresentacao?v=2");
  expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
  await act(async () => {}); // espera o efeito que ouve as mensagens do iframe
  const enviar = vi.spyOn(iframe.contentWindow!, "postMessage");
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { mectria: 1, tipo: "pronta", slides: 12, acoes: [{ slide: 0, id: "revelar-preco", rotulo: "Revelar o preço" }], campos: [] },
        source: iframe.contentWindow,
      }),
    );
  });
  expect(enviar).toHaveBeenCalledWith(expect.objectContaining({ mectria: 1, tipo: "estado", slide: 0, dados: expect.objectContaining({ empresa: "Cliente de exemplo", servico: "Desenho Técnico" }) }), "*");
  expect(await within(foco).findByText("Slide 1 de 12")).toBeInTheDocument();
  expect(within(foco).getByText("A apresentação tem 12 slides e o roteiro tem 13. Ajuste o roteiro em Serviços.")).toBeInTheDocument();
  await userEvent.click(within(foco).getByRole("button", { name: "Revelar o preço" }));
  expect(enviar).toHaveBeenCalledWith({ mectria: 1, tipo: "acionar", acao: "revelar-preco" }, "*");
  await userEvent.click(within(foco).getByRole("button", { name: "Próximo" }));
  expect(enviar).toHaveBeenCalledWith({ mectria: 1, tipo: "slide", slide: 1 }, "*");
  expect(within(foco).getByText("Slide 2 de 12")).toBeInTheDocument();
});

// A apresentação da diagnóstica, igual para todos (fase 9) --------------------------

test("o diretor envia a apresentação da diagnóstica no topo de Serviços", async () => {
  let enviado: Record<string, unknown> | undefined;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "PUT /api/apresentacoes/diagnostica": (init) => {
      enviado = corpoDe(init);
      return { corpo: { id: "diagnostica", apresentacao: { ...ARQUIVO, arquivo: "diagnostica.html" } } };
    },
  });
  abrir("/servicos");
  const secao = (await screen.findByRole("heading", { name: "Apresentação da diagnóstica" })).closest("section")!;
  expect(await within(secao).findByText("Sem apresentação: a diagnóstica continua sem a janela do cliente.")).toBeInTheDocument();
  await userEvent.upload(within(secao).getByLabelText("Enviar apresentação (.html)"), new File([HTML], "diagnostica.html", { type: "text/html" }));
  await waitFor(() => expect(enviado).toEqual({ arquivo: "diagnostica.html", html: HTML }));
  await waitFor(() => expect(secao).toHaveTextContent("diagnostica.html · 2 KB · versão 2"));
  expect(screen.getByRole("list", { name: "Serviços" })).toBeInTheDocument();
});

test("Ver a apresentação da diagnóstica abre com dados de exemplo e sem alerta de roteiro", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "/api/apresentacoes": { corpo: [{ id: "diagnostica", apresentacao: { ...ARQUIVO, arquivo: "diagnostica.html" } }] },
  });
  abrir("/servicos");
  const secao = (await screen.findByRole("heading", { name: "Apresentação da diagnóstica" })).closest("section")!;
  await userEvent.click(await within(secao).findByRole("button", { name: "Ver a apresentação" }));
  const foco = await screen.findByRole("dialog", { name: "Apresentação · Diagnóstica" });
  const iframe = within(foco).getByTitle("Apresentação · Diagnóstica") as HTMLIFrameElement;
  expect(iframe.getAttribute("src")).toBe("/api/apresentacoes/diagnostica?v=2");
  await act(async () => {}); // espera o efeito que ouve as mensagens do iframe
  const enviar = vi.spyOn(iframe.contentWindow!, "postMessage");
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data: { mectria: 1, tipo: "pronta", slides: 5, acoes: [], campos: [] }, source: iframe.contentWindow }));
  });
  expect(enviar).toHaveBeenCalledWith(expect.objectContaining({ tipo: "estado", dados: expect.objectContaining({ empresa: "Cliente de exemplo", etapa: "Objetivos" }) }), "*");
  expect(await within(foco).findByText("Slide 1 de 5")).toBeInTheDocument();
  expect(within(foco).queryByText(/A apresentação tem/)).not.toBeInTheDocument();
});
