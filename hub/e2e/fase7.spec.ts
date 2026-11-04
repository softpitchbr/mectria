import { expect, test } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email }, permissions: ["clipboard-read", "clipboard-write"] });
test.describe.configure({ mode: "serial" });

const amanha = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + 86_400_000));

test.describe("hunter", () => {
  test.use(como("hun@mectria.com"));

  test("registra uma conexão pela tecla 3 e vê a semana subir", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Começar o bloco" }).click();
    const foco = page.getByRole("dialog", { name: "Bloco de ligações" });
    const medidor = foco.getByRole("meter", { name: "Conexões da semana" });
    const antes = Number(await medidor.getAttribute("aria-valuenow"));
    await page.keyboard.press("3");
    await expect(medidor).toHaveAttribute("aria-valuenow", String(antes + 1));
    await expect(foco.getByRole("list", { name: "Roteiro da ligação" })).toContainText("Me dá só 30 segundos?");
  });

  test("manda o FUP 1 e confirma a diagnóstica de hoje", async ({ page }) => {
    await page.goto("/");
    const grupo = page.getByRole("group", { name: "Confirmação de Caldeira Confirma" });
    await expect(grupo.getByRole("button", { name: /FUP 2/ })).toBeDisabled();
    await grupo.getByRole("button", { name: /FUP 1/ }).click();
    await expect(grupo.getByRole("button", { name: /FUP 2/ })).toBeEnabled();
    await grupo.getByRole("button", { name: "Confirmada" }).click();
    await expect(grupo).toContainText("Confirmada pelo cliente");
    await page.goto("/rotinas");
    await expect(page.getByRole("region", { name: "Confirmações do dia" })).toContainText("Confirmar a diagnóstica de Caldeira Confirma");
  });

  test("reagenda o cliente que não compareceu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("list", { name: "Reagendar" }).getByRole("button", { name: "Reagendar Usina Faltosa" }).click();
    const foco = page.getByRole("dialog", { name: "Reagendar · Usina Faltosa" });
    await foco.getByLabel("Data").fill(amanha());
    await foco.getByLabel("Hora").fill("10:00");
    await foco.getByRole("button", { name: "Reagendar a diagnóstica" }).click();
    await expect(page.getByRole("status")).toContainText("Diagnóstica com Usina Faltosa reagendada");
    await expect(page.getByRole("list", { name: "Diagnósticas que marquei" })).toContainText("Usina Faltosa");
  });
});

test.describe("closer", () => {
  test.use(como("clo@mectria.com"));

  test("vê a rotina em blocos e o alerta da proposta em construção", async ({ page }) => {
    await page.goto("/rotinas");
    await expect(page.getByRole("region", { name: "Fechamento e negociação" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Construção de proposta" })).toContainText("Construir as propostas pendentes");
    await expect(page.getByRole("meter", { name: "Rotina de hoje" })).toContainText("%");
    await page.goto("/apresentacoes");
    const molde = page.getByRole("list", { name: "Propostas para preparar" }).locator("li", { hasText: "Molde Atrasado" });
    await expect(molde).toContainText("Em construção há 4 dias");
    await expect(molde).toContainText("Passou de 3 dias");
  });
});
