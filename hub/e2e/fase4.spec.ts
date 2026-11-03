import { expect, test, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });
test.describe.configure({ mode: "serial" });

function amanha(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + 86_400_000));
}

/** Abre o painel da proposta pela agenda e a janela da apresentação pelo painel. */
async function abrirReuniao(page: Page, empresa: string) {
  await page.goto("/reunioes");
  await page.locator("li", { hasText: empresa }).getByRole("button", { name: /Iniciar|Continuar/ }).click();
  await expect(page.getByRole("main", { name: "Painel da proposta" })).toBeVisible();
  const [janela] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: /Abrir apresentação|Reabrir apresentação/ }).click()]);
  await expect(janela).toHaveTitle(`Apresentação · ${empresa}`);
  return janela;
}

test.describe("closer conduz a proposta", () => {
  test.use(como("clo@mectria.com"));

  test("o catálogo mostra os 13 slides inteiros, sem texto cortado", async ({ page }) => {
    await page.goto("/apresentacoes");
    const slides = page.getByRole("region", { name: "Catálogo" }).getByRole("region", { name: /^Slide: / });
    await expect(slides).toHaveCount(13);
    const estouros = await slides.evaluateAll((els) =>
      els.flatMap((el) => {
        const caixa = el.getBoundingClientRect();
        return [...el.querySelectorAll("p, h2, li")]
          .map((filho) => filho.getBoundingClientRect())
          .filter((r) => r.top < caixa.top - 1 || r.bottom > caixa.bottom + 1)
          .map(() => el.getAttribute("aria-label"));
      }),
    );
    expect(estouros).toEqual([]);
  });

  test("prepara a proposta em Apresentações", async ({ page }) => {
    await page.goto("/apresentacoes");
    const lista = page.getByRole("list", { name: "Propostas para preparar" });
    await lista.locator("li", { hasText: "Caldeiraria Sul" }).getByRole("button", { name: "Preparar" }).click();
    const foco = page.getByRole("dialog", { name: "Preparar a proposta · Caldeiraria Sul" });
    await foco.getByLabel("Valor").fill("18.000,00");
    await foco.getByLabel("Prazo").fill("60 dias");
    await foco.getByLabel("Time").fill("Rui e Bia");
    await expect(foco.getByText("Pronta para a reunião.")).toBeVisible();
    await foco.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("status").last()).toContainText("Proposta de Caldeiraria Sul salva.");
  });

  test("conduz a proposta com as duas janelas sincronizadas e fecha com vai decidir", async ({ page }) => {
    const janela = await abrirReuniao(page, "Caldeiraria Sul");
    await page.getByRole("button", { name: "Começar reunião" }).click();
    await expect(page.getByText("1 de 13")).toBeVisible();
    await expect(janela.getByRole("heading", { name: "Climatização" })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("2 de 13")).toBeVisible();
    await expect(janela.getByRole("heading", { name: "O projeto que desenhamos para vocês" })).toBeVisible();
    // A janela do cliente não mostra a fala.
    await expect(janela.getByText(/obrigado pelo tempo/)).toHaveCount(0);

    await page.getByRole("button", { name: /^Pacto: Acordo de agenda/ }).click();
    await expect(page.getByText("1 de 6 pactos")).toBeVisible();

    await page.keyboard.press("n");
    await page.getByRole("button", { name: "Técnico", exact: true }).click();
    await page.getByRole("textbox", { name: "Anotação" }).fill("Telhado de fibrocimento");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("list", { name: "Anotações" })).toContainText("Slide 2");

    await page.getByRole("button", { name: "Ir para o slide 6" }).click();
    await expect(page.locator("mark", { hasText: "o galpão passa de 38 °C à tarde" })).toBeVisible();
    await expect(janela.getByText("Hoje: o galpão passa de 38 °C à tarde")).toBeVisible();

    await page.getByRole("checkbox", { name: "Bia decide" }).uncheck();
    await page.getByRole("button", { name: "Ir para o slide 11" }).click();
    await expect(page.getByRole("alert")).toContainText("Quem decide não está na sala.");
    await page.getByRole("checkbox", { name: "Bia decide" }).check();

    await page.getByRole("button", { name: "Ir para o slide 13" }).click();
    await page.getByRole("button", { name: "Ir para o fechamento" }).click();
    const form = page.getByRole("form", { name: "Fechamento da proposta" });
    await form.getByRole("radio", { name: "Vai decidir (data combinada)" }).check();
    await expect(form.getByLabel("Valor apresentado")).toHaveValue("R$ 18.000,00");
    await form.getByLabel("Data da decisão").fill(amanha());
    await form.getByRole("button", { name: "Encerrar reunião" }).click();

    await expect(page).toHaveURL(/\/follow-up$/);
    await expect(page.getByText("Caldeiraria Sul")).toBeVisible();
    await expect.poll(() => janela.isClosed()).toBe(true);
  });

  test("a janela fechada reabre no mesmo slide", async ({ page }) => {
    const janela = await abrirReuniao(page, "Estrutura Leste");
    await page.getByRole("button", { name: "Começar reunião" }).click();
    await page.getByRole("button", { name: "Ir para o slide 5" }).click();
    await expect(janela.getByRole("heading", { name: "O time" })).toBeVisible();
    await janela.close();
    const reabrir = page.getByRole("button", { name: "Reabrir apresentação" });
    await expect(reabrir).toBeVisible({ timeout: 10_000 });
    const [outra] = await Promise.all([page.waitForEvent("popup"), reabrir.click()]);
    await expect(outra.getByRole("heading", { name: "O time" })).toBeVisible();
    await outra.close();
  });

  test("sem internet, os slides continuam passando e o painel guarda tudo", async ({ page, context }) => {
    const janela = await abrirReuniao(page, "Estrutura Leste");
    await expect(page.getByText("5 de 13")).toBeVisible();
    await context.setOffline(true);
    await page.keyboard.press("ArrowRight");
    await expect(janela.getByRole("heading", { name: "Onde vocês estão e aonde querem chegar" })).toBeVisible();
    await expect(page.getByText("Sem internet · salvo neste computador")).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
    await expect(page.getByText("Salvo", { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByText("6 de 13")).toBeVisible();
  });
});
