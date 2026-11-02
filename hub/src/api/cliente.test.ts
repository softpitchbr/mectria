import { api, ErroApi } from "./cliente";
import { fingirApi } from "../teste/ajuda";

test("403 sem_acesso lança ErroApi e avisa a janela", async () => {
  fingirApi({ "/api/eu": { status: 403, corpo: { erro: "sem_acesso", mensagem: "Sem acesso." } } });
  const ouvinte = vi.fn();
  window.addEventListener("hub:sem-acesso", ouvinte);
  const falha = await api("/api/eu").catch((e: unknown) => e);
  window.removeEventListener("hub:sem-acesso", ouvinte);
  expect(falha).toBeInstanceOf(ErroApi);
  expect(falha).toMatchObject({ status: 403, codigo: "sem_acesso", mensagem: "Sem acesso." });
  expect(ouvinte).toHaveBeenCalledTimes(1);
});

test("outros erros não disparam o aviso de sem acesso", async () => {
  fingirApi({ "/api/pessoas": { status: 409, corpo: { erro: "conflito", mensagem: "Já existe." } } });
  const ouvinte = vi.fn();
  window.addEventListener("hub:sem-acesso", ouvinte);
  await expect(api("/api/pessoas")).rejects.toMatchObject({ codigo: "conflito" });
  window.removeEventListener("hub:sem-acesso", ouvinte);
  expect(ouvinte).not.toHaveBeenCalled();
});

test("200 devolve o JSON", async () => {
  fingirApi({ "/api/eu": { corpo: { id: 1, nome: "Ana" } } });
  expect(await api("/api/eu")).toEqual({ id: 1, nome: "Ana" });
});

test("falha de rede vira ErroApi com mensagem em português", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
  await expect(api("/api/eu")).rejects.toMatchObject({ status: 0, codigo: "rede" });
});

test("POST sem corpo também manda Content-Type JSON (a proteção contra CSRF exige)", async () => {
  const falso = fingirApi({ "POST /api/reunioes/5/iniciar": { corpo: { ok: true } } });
  await api("/api/reunioes/5/iniciar", { method: "POST" });
  const [, init] = falso.mock.calls[0];
  expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
});
