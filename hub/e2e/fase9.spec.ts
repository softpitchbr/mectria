import { fileURLToPath } from "node:url";
import { expect, test, type Frame, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });
const arquivo = (nome: string) => fileURLToPath(new URL(`../apresentacoes/${nome}`, import.meta.url));
test.describe.configure({ mode: "serial" });

/** Na janela da apresentação, só um slide fica visível e tudo nele cabe nos 1280 × 720 do palco. */
async function umSlideQueCabe(quadro: Frame) {
  const resultado = await quadro.evaluate(() => {
    const visiveis = [...document.querySelectorAll("[data-slide]")].filter((s) => getComputedStyle(s).display !== "none");
    const caixa = visiveis[0]?.getBoundingClientRect();
    const fora = visiveis.length
      ? [...visiveis[0].querySelectorAll("*")]
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width && (r.bottom > caixa!.bottom + 1 || r.right > caixa!.right + 1 || r.top < caixa!.top - 1 || r.left < caixa!.left - 1)).length
      : -1;
    return { visiveis: visiveis.length, fora };
  });
  expect(resultado).toEqual({ visiveis: 1, fora: 0 });
}

const quadroDa = (janela: Page) => janela.frames().find((f) => f.url().includes("/api/"))!;

test.describe("a diretora envia as apresentações", () => {
  test.use(como("dir@mectria.com"));

  test("envia a da diagnóstica no topo de Serviços e a de Desenvolvimento de Produto", async ({ page }) => {
    await page.goto("/servicos");
    const diagnostica = page.locator("section", { has: page.getByRole("heading", { name: "Apresentação da diagnóstica" }) });
    await expect(diagnostica).toContainText("Sem apresentação");
    await diagnostica.getByLabel("Enviar apresentação (.html)").setInputFiles(arquivo("diagnostica.html"));
    await expect(diagnostica).toContainText(/diagnostica\.html · \d+ KB · versão 1/);

    await page.goto("/servicos/desenvolvimento-de-produto");
    const proposta = page.locator("section", { has: page.getByRole("heading", { name: "Apresentação de proposta" }) });
    await proposta.getByLabel("Enviar apresentação (.html)").setInputFiles(arquivo("desenvolvimento-de-produto.html"));
    await expect(proposta).toContainText(/desenvolvimento-de-produto\.html · \d+ KB · versão \d+/);
    await expect(page.getByRole("form", { name: "Serviço" }).getByRole("group", { name: "Slide 10" }).getByLabel("Título")).toHaveValue("Jornada de parcerias");
  });
});

test.describe("a hunter conduz a diagnóstica com a janela do cliente", () => {
  test.use(como("hun@mectria.com"));

  test("a apresentação acompanha o roteiro: agenda e, no bloco G, a escuta com Objetivos", async ({ page }) => {
    await page.goto("/reunioes");
    await page.locator("li", { hasText: "Solda Hunter" }).getByRole("button", { name: /Iniciar|Continuar/ }).click();
    await expect(page.getByRole("main", { name: "Painel da diagnóstica" })).toBeVisible();
    // Começa do início (a abertura), para a janela mostrar a agenda.
    await page.getByRole("button", { name: "Ir para Abertura" }).click();
    const [janela] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: /Abrir apresentação/ }).click()]);
    await expect(janela).toHaveTitle("Apresentação · Solda Hunter");
    const deck = janela.frameLocator('iframe[title="Apresentação · Solda Hunter"]');
    await expect(deck.getByRole("heading", { name: "Solda Hunter" })).toBeVisible();
    await umSlideQueCabe(quadroDa(janela));

    await page.getByRole("button", { name: "Ir para G" }).click();
    await expect(deck.getByRole("heading", { name: "Antes de desenhar, a gente escuta." })).toBeVisible();
    await expect(deck.locator('[aria-current="step"]')).toContainText("Objetivos");
    await umSlideQueCabe(quadroDa(janela));
    await page.getByRole("button", { name: "Sair do painel" }).click();
  });
});

test.describe("o closer conduz a proposta de Desenvolvimento de Produto", () => {
  test.use(como("clo@mectria.com"));

  test("o roteiro do serviço no painel e o preço revelado com as condições", async ({ page }) => {
    await page.goto("/reunioes");
    await page.locator("li", { hasText: "Torno Novo" }).getByRole("button", { name: /Iniciar|Continuar/ }).click();
    const [janela] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: /Abrir apresentação/ }).click()]);
    await page.getByRole("button", { name: "Começar reunião" }).click();
    await expect(page.getByText("1 de 13")).toBeVisible();
    const deck = janela.frameLocator('iframe[title="Apresentação · Torno Novo"]');
    await expect(deck.getByText("Proposta para Torno Novo")).toBeVisible();

    for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowRight");
    await expect(page.getByText("10 de 13")).toBeVisible();
    await expect(page.getByRole("region", { name: "Fala" })).toContainText("deixa eu te explicar como funciona a nossa jornada de parcerias");
    await expect(deck.getByText("Combinado?")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("12 de 13")).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Revelar o preço" }).click();
    await expect(deck.getByText("R$ 18.000,00")).toBeVisible();
    await expect(deck.getByText("Entrada de 30% e o restante em 3 vezes")).toBeVisible();
    await umSlideQueCabe(quadroDa(janela));
  });
});
