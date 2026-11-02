import { expect, test, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });

const SECOES = ["/", "/reunioes", "/follow-up", "/playbooks", "/apresentacoes", "/rotinas", "/time", "/briefings"];

function rotulos(page: Page, nav = "Seções") {
  return page
    .getByRole("navigation", { name: nav, exact: true })
    .getByRole("link")
    .evaluateAll((links) => links.map((l) => l.getAttribute("aria-label")));
}

test.describe("diretor", () => {
  test.use(como("dir@mectria.com"));

  test("vê as 8 seções e adiciona uma pessoa no Time", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Diana");
    expect(await rotulos(page)).toEqual(["Hoje", "Reuniões", "Follow-up", "Playbooks", "Apresentações", "Rotinas", "Time", "Briefings"]);

    await page.getByRole("navigation", { name: "Seções", exact: true }).getByRole("link", { name: "Time" }).click();
    await expect(page.getByRole("heading", { name: "Time comercial" })).toBeVisible();
    const formulario = page.getByRole("form", { name: "Adicionar pessoa" });
    await formulario.getByLabel("Nome").fill("Ana Teste");
    await formulario.getByLabel("E-mail").fill("ana@mectria.com");
    await formulario.getByLabel("Cargo").selectOption("closer");
    await formulario.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByRole("list", { name: "Pessoas do time" })).toContainText("ana@mectria.com");

    await page.reload();
    await expect(page.getByRole("list", { name: "Pessoas do time" })).toContainText("Ana Teste");
  });

  test("API sem rota responde 404 em JSON", async ({ request }) => {
    const r = await request.get("/api/nada");
    expect(r.status()).toBe(404);
    expect(await r.json()).toMatchObject({ erro: "nao_encontrado" });
  });
});

test.describe("hunter", () => {
  test.use(como("hun@mectria.com"));

  test("vê Hoje, Playbooks e Rotinas e não entra no Time", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Helena");
    expect(await rotulos(page)).toEqual(["Hoje", "Playbooks", "Rotinas"]);
    await page.goto("/time");
    await expect(page.getByText("Seu acesso não inclui Time. Fale com o diretor comercial da MecTRIA.")).toBeVisible();
  });
});

test.describe("pessoa desativada", () => {
  test.use(como("ex@mectria.com"));

  test("vê a tela de sem acesso", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA.")).toBeVisible();
  });
});

test.describe("closer", () => {
  test.use(como("clo@mectria.com"));

  test("tema escuro escolhido no perfil continua depois de recarregar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Perfil de/ }).click();
    await page.getByRole("button", { name: "Escuro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("Ctrl K, playbooks e Enter vai para /playbooks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("playbooks");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/playbooks$/);
    await expect(page.getByText("Playbooks chega na fase 3.")).toBeVisible();
  });

  test("a busca abre com transição de 240 ms", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Control+k");
    const veu = page.getByRole("dialog").locator("..");
    expect(await veu.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0.24s");
  });
});

test.describe("movimento reduzido", () => {
  test.use({ ...como("clo@mectria.com"), contextOptions: { reducedMotion: "reduce" } });

  test("a busca abre sem transição", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Control+k");
    const veu = page.getByRole("dialog").locator("..");
    expect(await veu.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  });
});

test.describe("celular", () => {
  test.use({ ...como("dir@mectria.com"), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("barra de baixo no lugar da lateral e nada vaza para o lado", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Seções no celular" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Seções", exact: true })).toBeHidden();
    for (const caminho of SECOES) {
      await page.goto(caminho);
      await expect(page.getByRole("navigation", { name: "Seções no celular" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), caminho).toBe(390);
    }
  });
});
