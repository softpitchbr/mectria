import { expect, test, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });

// Os testes desta fase dependem uns dos outros (o hunter marca, o closer registra, o diretor vê).
test.describe.configure({ mode: "serial" });

function amanha(): string {
  const d = new Date(Date.now() + 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

async function abrirHoje(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test.describe("hunter", () => {
  test.use(como("hun@mectria.com"));

  test("registra ligações pelo teclado e marca uma diagnóstica", async ({ page }) => {
    await abrirHoje(page);
    await page.getByRole("button", { name: "Começar o bloco" }).click();
    const foco = page.getByRole("dialog", { name: "Bloco de ligações" });
    await expect(foco).toBeVisible();
    await page.keyboard.press("1");
    await expect(foco.getByText("1 sem resposta")).toBeVisible();
    await page.keyboard.press("2");
    await expect(foco.getByText("Meta do dia batida")).toBeVisible();

    await foco.getByRole("button", { name: /Marcou diagnóstica/ }).click();
    const form = page.getByRole("form", { name: "Marcar diagnóstica" });
    await form.getByLabel("Empresa").fill("Usinagem E2E");
    await form.getByLabel("Contato").fill("Ana Souza");
    await form.getByLabel("Telefone").fill("(34) 99999-0000");
    await form.getByLabel("Serviço").selectOption("climatizacao");
    await form.getByLabel("Closer").selectOption({ label: "Carlos Closer" });
    await form.getByLabel("Data").fill(amanha());
    await form.getByLabel("Hora").fill("14:00");
    await form.getByRole("button", { name: "Marcar diagnóstica" }).click();
    await expect(page.getByRole("status")).toContainText("Diagnóstica marcada com Carlos Closer");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("list", { name: "Diagnósticas que marquei" })).toContainText("Usinagem E2E");
  });
});

test.describe("closer", () => {
  test.use(como("clo@mectria.com"));

  test("registra a proposta, faz o D0 e vê o item da rotina feito", async ({ page }) => {
    await page.goto("/follow-up");
    await page.getByRole("button", { name: "Registrar proposta apresentada" }).click();
    const foco = page.getByRole("dialog", { name: "Registrar proposta apresentada" });
    await foco.getByLabel("Oportunidade").selectOption({ label: "Usinagem E2E · Ana Souza" });
    await foco.getByLabel("Valor").fill("8.000,00");
    await foco.getByLabel("Quem decide").fill("Ana (sócia)");
    await foco.getByRole("button", { name: "Registrar proposta" }).click();
    await expect(page.getByRole("status")).toContainText("Proposta registrada. 7 toques na agenda.");

    await expect(page.getByRole("main")).toContainText("Usinagem E2E");
    await page.getByRole("button", { name: /Usinagem E2E/ }).click();
    const toque = page.getByRole("dialog", { name: "Toque D0 · Usinagem E2E" });
    await toque.getByLabel("Canal").selectOption("WhatsApp");
    await toque.getByLabel("Como foi").fill("Mandei a proposta");
    await toque.getByRole("button", { name: "Registrar toque" }).click();
    await expect(page.getByRole("status")).toContainText("Toque registrado.");

    await page.goto("/rotinas");
    const item = page.locator("li", { hasText: "D0 · WhatsApp + e-mail · Usinagem E2E" });
    await expect(item.locator('svg[data-feito="true"]')).toBeVisible();
  });

  test("a proposta atrasada aparece em Atrasados", async ({ page }) => {
    await page.goto("/follow-up");
    const cartao = page.getByRole("button", { name: /Fundição Atrasada/ });
    await expect(cartao).toContainText("Atrasado · 7 toques");
  });

  test("Esc fecha o toque em foco e o foco volta para o cartão", async ({ page }) => {
    await page.goto("/follow-up");
    const cartao = page.getByRole("button", { name: /Usinagem E2E/ });
    await cartao.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(cartao).toBeFocused();
  });
});

test.describe("diretor", () => {
  test.use(como("dir@mectria.com"));

  test("vê o Carlos em follow-ups atrasados por pessoa", async ({ page }) => {
    await abrirHoje(page);
    await expect(page.getByRole("list", { name: "Follow-ups atrasados por pessoa" })).toContainText(/Carlos · \d+/);
  });
});

test.describe("resultado", () => {
  test.use(como("clo@mectria.com"));

  test("a proposta perdida sai do follow-up", async ({ page }) => {
    await page.goto("/follow-up");
    await page.getByRole("button", { name: /Fundição Atrasada/ }).click();
    await page.getByRole("button", { name: "Registrar resultado da proposta" }).click();
    const foco = page.getByRole("dialog");
    await foco.getByRole("radio", { name: "Perdida" }).check();
    await foco.getByLabel("Motivo").selectOption("Preço");
    await foco.getByRole("button", { name: "Registrar resultado" }).click();
    await expect(page.getByRole("button", { name: /Fundição Atrasada/ })).toHaveCount(0);
  });
});

test.describe("diretor depois do resultado", () => {
  test.use(como("dir@mectria.com"));

  test("o resumo não conta mais a proposta perdida", async ({ page }) => {
    await abrirHoje(page);
    await expect(page.getByText("Ninguém com follow-up atrasado.")).toBeVisible();
  });
});

test.describe("movimento reduzido", () => {
  test.use({ ...como("clo@mectria.com"), contextOptions: { reducedMotion: "reduce" } });

  test("o modo foco abre sem transição", async ({ page }) => {
    await page.goto("/follow-up");
    await page.getByRole("button", { name: /Usinagem E2E/ }).click();
    const veu = page.getByRole("dialog").locator("..");
    expect(await veu.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  });
});

for (const email of ["clo@mectria.com", "hun@mectria.com"]) {
  test.describe(`celular · ${email}`, () => {
    test.use({ ...como(email), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test("Hoje, Follow-up e Rotinas sem rolagem para o lado", async ({ page }) => {
      const caminhos = email.startsWith("clo") ? ["/", "/follow-up", "/rotinas"] : ["/", "/rotinas"];
      for (const caminho of caminhos) {
        await page.goto(caminho);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.waitForLoadState("networkidle");
        expect(await page.evaluate(() => document.documentElement.scrollWidth), caminho).toBe(390);
      }
    });
  });
}
