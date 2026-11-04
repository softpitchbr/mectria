import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { diasDepois, hojeEmSaoPaulo } from "../../compartilhado/datas";
import { abrir, fingirApi, NUMEROS_VAZIOS, PESSOAS } from "../teste/ajuda";

const LISTA = [
  { ...PESSOAS.closer, ativo: true, criadoEm: "2026-11-02 10:00:00", atualizadoEm: "2026-11-02 10:00:00" },
  { ...PESSOAS.diretor, ativo: true, criadoEm: "2026-11-02 10:00:00", atualizadoEm: "2026-11-02 10:00:00" },
];

function linhaDe(nome: string) {
  return screen.getByText(nome).closest("li") as HTMLElement;
}

test("a lista mostra o cargo por extenso de cada pessoa", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/pessoas": { corpo: LISTA } });
  abrir("/time");
  await screen.findByText("Diana Diretora");
  expect(within(linhaDe("Diana Diretora")).getByRole("combobox", { name: "Cargo de Diana Diretora" })).toHaveDisplayValue(
    "Diretor comercial",
  );
  expect(within(linhaDe("Vinícius Miguel")).getByText("clo@mectria.com")).toBeInTheDocument();
});

test("e-mail repetido mostra o erro da API junto do formulário", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "POST /api/pessoas": { status: 409, corpo: { erro: "conflito", mensagem: "Já existe uma pessoa com esse e-mail." } },
  });
  abrir("/time");
  const formulario = await screen.findByRole("form", { name: "Adicionar pessoa" });
  await userEvent.type(within(formulario).getByLabelText("Nome"), "Outra Pessoa");
  await userEvent.type(within(formulario).getByLabelText("E-mail"), "clo@mectria.com");
  await userEvent.click(within(formulario).getByRole("button", { name: "Adicionar" }));
  expect(await within(formulario).findByRole("alert")).toHaveTextContent("Já existe uma pessoa com esse e-mail.");
});

test("adicionar pessoa manda os dados, mostra na lista e avisa", async () => {
  let enviado: unknown;
  const nova = { id: 9, nome: "Rita", email: "rita@mectria.com", cargo: "projetos", ativo: true, criadoEm: "", atualizadoEm: "" };
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "POST /api/pessoas": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { status: 201, corpo: nova };
    },
  });
  abrir("/time");
  const formulario = await screen.findByRole("form", { name: "Adicionar pessoa" });
  await userEvent.type(within(formulario).getByLabelText("Nome"), "Rita");
  await userEvent.type(within(formulario).getByLabelText("E-mail"), "rita@mectria.com");
  await userEvent.selectOptions(within(formulario).getByLabelText("Cargo"), "projetos");
  await userEvent.click(within(formulario).getByRole("button", { name: "Adicionar" }));
  expect(enviado).toEqual({ nome: "Rita", email: "rita@mectria.com", cargo: "projetos" });
  expect(await screen.findByText("rita@mectria.com")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Rita entrou no time.");
  expect(within(formulario).getByLabelText("Nome")).toHaveValue("");
});

test("Desativar chama o PATCH com ativo false e a linha passa a Reativar", async () => {
  let enviado: unknown;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "PATCH /api/pessoas/2": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...LISTA[0], ativo: false } };
    },
  });
  abrir("/time");
  await userEvent.click(await screen.findByRole("button", { name: "Desativar Vinícius Miguel" }));
  expect(enviado).toEqual({ ativo: false });
  expect(await screen.findByRole("button", { name: "Reativar Vinícius Miguel" })).toBeInTheDocument();
});

test("o diretor não vê Desativar na própria linha", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/pessoas": { corpo: LISTA } });
  abrir("/time");
  await screen.findByText("Diana Diretora");
  expect(screen.queryByRole("button", { name: "Desativar Diana Diretora" })).not.toBeInTheDocument();
});

test("erro ao trocar cargo aparece acima da lista", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "PATCH /api/pessoas/3": {
      status: 409,
      corpo: { erro: "ultimo_diretor", mensagem: "O time precisa de pelo menos um diretor comercial ativo." },
    },
  });
  abrir("/time");
  await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Cargo de Diana Diretora" }), "closer");
  expect(await screen.findByText("O time precisa de pelo menos um diretor comercial ativo.")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Cargo de Diana Diretora" })).toHaveDisplayValue("Diretor comercial");
});

test("Renomear troca o nome com Enter e chama o PATCH com o nome novo", async () => {
  let enviado: unknown;
  fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "PATCH /api/pessoas/2": (init) => {
      enviado = JSON.parse(String(init?.body));
      return { corpo: { ...LISTA[0], nome: "Vinícius Miguel Souza" } };
    },
  });
  abrir("/time");
  await userEvent.click(await screen.findByRole("button", { name: "Renomear Vinícius Miguel" }));
  const campo = screen.getByRole("textbox", { name: "Novo nome de Vinícius Miguel" });
  await userEvent.clear(campo);
  await userEvent.type(campo, "Vinícius Miguel Souza{Enter}");
  expect(enviado).toEqual({ nome: "Vinícius Miguel Souza" });
  expect(await screen.findByText("Vinícius Miguel Souza")).toBeInTheDocument();
});

test("Esc desiste de renomear sem chamar a API", async () => {
  const falso = fingirApi({ "/api/eu": { corpo: PESSOAS.diretor }, "GET /api/pessoas": { corpo: LISTA } });
  abrir("/time");
  await userEvent.click(await screen.findByRole("button", { name: "Renomear Vinícius Miguel" }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("textbox", { name: "Novo nome de Vinícius Miguel" })).not.toBeInTheDocument();
  expect(falso.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(false);
});

test("a aba Mês troca o mês e relê os números", async () => {
  let chamadas = 0;
  const falso = fingirApi({
    "/api/eu": { corpo: PESSOAS.diretor },
    "GET /api/pessoas": { corpo: LISTA },
    "GET /api/time/numeros": () => ({
      corpo:
        chamadas++ === 0
          ? {
              ...NUMEROS_VAZIOS,
              propostas: 3,
              ganhas: 1,
              perdidas: 1,
              conversao: 0.5,
              valorVendido: 1250000,
              tempoMedioDias: 7,
              objecoes: [{ texto: "Achei caro", empresa: "Hélice", closer: "Carlos Closer", dia: "2026-11-03" }],
              porCloser: [{ pessoa: { id: 2, nome: "Carlos Closer", cargo: "closer" }, propostas: 3, ganhas: 1, valorVendido: 1250000 }],
              rotina: [
                { pessoa: { id: 2, nome: "Carlos Closer", cargo: "closer" }, feitos: 3, total: 4 },
                { pessoa: { id: 1, nome: "Hugo Hunter", cargo: "hunter" }, feitos: 0, total: 0 },
              ],
            }
          : { ...NUMEROS_VAZIOS, mes: "2026-10", propostas: 9 },
    }),
  });
  abrir("/time");
  await userEvent.click(await screen.findByRole("tab", { name: "Mês" }));
  const porCloser = await screen.findByRole("table", { name: "Números por closer" });
  expect(porCloser).toHaveTextContent("Carlos Closer");
  expect(porCloser).toHaveTextContent("R$ 12.500,00");
  expect(screen.getByRole("list", { name: "Rotina no mês" })).toHaveTextContent("Carlos Closer75%");
  expect(screen.getByRole("list", { name: "Rotina no mês" })).toHaveTextContent("Hugo Hunternão abriu a rotina");
  expect(screen.getByRole("list", { name: "Objeções do mês" })).toHaveTextContent("Achei caro");

  // O mês anterior ao atual está sempre na lista dos últimos 12 meses.
  const anterior = diasDepois(`${hojeEmSaoPaulo().slice(0, 7)}-01`, -1).slice(0, 7);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Mês" }), anterior);
  await vi.waitFor(() => expect(falso.mock.calls.some(([url]) => String(url).includes(`/api/time/numeros?mes=${anterior}`))).toBe(true));
  expect(await screen.findByRole("region", { name: "Resumo do mês" })).toHaveTextContent("Propostas9");
});
