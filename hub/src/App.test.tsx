import { screen } from "@testing-library/react";
import { abrir, fingirApi, PESSOAS } from "./teste/ajuda";

test("mostra o nome do hub", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/");
  expect(await screen.findByRole("link", { name: "Hub comercial MecTRIA" })).toBeInTheDocument();
});

test("caminho desconhecido mostra página não encontrada", async () => {
  fingirApi({ "/api/eu": { corpo: PESSOAS.closer } });
  abrir("/nao-existe");
  expect(await screen.findByText("Página não encontrada.")).toBeInTheDocument();
});
