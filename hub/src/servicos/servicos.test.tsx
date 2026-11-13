import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { servicosDaCarta } from "../../compartilhado/dados/servicos-completos";
import type { Servico } from "../../compartilhado/servico";
import { abrir, fingirApi, PESSOAS } from "../teste/ajuda";
import { nomeDoServico, opcoesDeServico, recarregarServicos, useServicos } from "./servicos";

const NOVO: Servico = { ...servicosDaCarta()[0], id: "servico-novo", nome: "Serviço Novo", sigla: "SN" };
const comInativo = () => servicosDaCarta().map((s) => (s.id === "desenho-tecnico" ? { ...s, situacao: "inativo" as const } : s));

test("useServicos busca uma vez para dois componentes", async () => {
  const falso = fingirApi({});
  function Nomes({ rotulo }: { rotulo: string }) {
    const servicos = useServicos();
    return <p aria-label={rotulo}>{servicos ? servicos.length : "carregando"}</p>;
  }
  render(
    <>
      <Nomes rotulo="um" />
      <Nomes rotulo="dois" />
    </>,
  );
  expect(await screen.findByLabelText("um")).toHaveTextContent("12");
  await waitFor(() => expect(screen.getByLabelText("dois")).toHaveTextContent("12"));
  expect(falso.mock.calls.filter(([url]) => String(url) === "/api/servicos")).toHaveLength(1);
});

test("opcoesDeServico tira o inativo, marca o em estruturação e mantém o atual", () => {
  const servicos = comInativo();
  const opcoes = opcoesDeServico(servicos);
  expect(opcoes.map((o) => o.valor)).not.toContain("desenho-tecnico");
  expect(opcoes.find((o) => o.valor === "emissao-de-carbono")?.rotulo).toBe("Emissão de Carbono (Emissão Zero) (em estruturação)");
  expect(opcoes).toHaveLength(11);
  expect(opcoesDeServico(servicos, "desenho-tecnico").map((o) => o.valor)).toContain("desenho-tecnico");
  expect(opcoesDeServico(null)).toEqual([]);
});

test("nomeDoServico: vazio enquanto carrega e o id quando não acha", () => {
  expect(nomeDoServico(null, "climatizacao")).toBe("");
  expect(nomeDoServico(servicosDaCarta(), "climatizacao")).toBe("Climatização");
  expect(nomeDoServico(servicosDaCarta(), "foguete")).toBe("foguete");
});

test("marcar diagnóstica mostra o serviço criado pelo diretor e não mostra o inativo", async () => {
  fingirApi({
    "/api/eu": { corpo: PESSOAS.hunter },
    "/api/servicos": { corpo: [...comInativo(), NOVO] },
    "GET /api/ligacoes": { corpo: { naoAtendeu: 0, atendeu: 0, conexao: 0, marcou: 0, total: 0, conexoesSemana: 0, metaConexoesSemana: 8 } },
    "GET /api/rotina": { corpo: { dia: "2026-11-11", itens: [], blocos: [] } },
    "GET /api/reunioes": { corpo: [] },
    "GET /api/closers": { corpo: [{ id: 2, nome: "Vinícius Miguel" }] },
  });
  abrir("/");
  await userEvent.click(await screen.findByRole("button", { name: "Começar o bloco" }));
  await userEvent.click(screen.getByRole("button", { name: /Marcou diagnóstica/ }));
  const form = screen.getByRole("form", { name: "Marcar diagnóstica" });
  const servico = within(form).getByLabelText("Serviço");
  await waitFor(() => expect(within(servico).getByRole("option", { name: "Serviço Novo" })).toBeInTheDocument());
  expect(within(servico).queryByRole("option", { name: "Desenho Técnico" })).not.toBeInTheDocument();
});

test("o follow-up mostra o nome do serviço vindo da API", async () => {
  const item = {
    oportunidade: { id: 1, empresa: "Usinagem Alfa", contato: "Ana", telefone: "", servico: "servico-novo", closerId: 2, situacao: "em_followup" },
    proposta: { id: 10, oportunidadeId: 1, servico: "servico-novo", valor: 1250000, apresentadaEm: "2026-11-10", dataDecisao: null, quemDecide: "Ana", dor: "", validade: null },
    proximo: { id: 100, propostaId: 10, codigo: "D1", previstoPara: "2026-11-11", feitoEm: null, canal: null, resultado: null },
    atrasados: 0,
    estado: "hoje",
  };
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer }, "/api/servicos": { corpo: [...servicosDaCarta(), NOVO] }, "GET /api/followup": { corpo: [item] } });
  abrir("/follow-up");
  const cartao = (await within(await screen.findByRole("main")).findAllByRole("listitem"))[0];
  await waitFor(() => expect(cartao).toHaveTextContent("Serviço Novo · R$ 12.500,00"));
});

test("uma busca antiga que chega depois de recarregar não troca a lista nova", async () => {
  const pendentes: ((r: Response) => void)[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>((resolver) => pendentes.push(resolver))),
  );
  const resposta = (lista: unknown) => new Response(JSON.stringify(lista), { status: 200, headers: { "Content-Type": "application/json" } });
  function Nomes() {
    const servicos = useServicos();
    return <p aria-label="nomes">{servicos ? servicos.map((s) => s.nome).join(", ") : "carregando"}</p>;
  }
  render(<Nomes />);
  await waitFor(() => expect(pendentes).toHaveLength(1));
  const recarga = recarregarServicos();
  await waitFor(() => expect(pendentes).toHaveLength(2));
  pendentes[1](resposta([{ ...NOVO, nome: "Lista nova" }]));
  await recarga;
  expect(await screen.findByLabelText("nomes")).toHaveTextContent("Lista nova");
  pendentes[0](resposta([{ ...NOVO, nome: "Lista velha" }]));
  await new Promise((r) => setTimeout(r, 20));
  expect(screen.getByLabelText("nomes")).toHaveTextContent("Lista nova");
});
