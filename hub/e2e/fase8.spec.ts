import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });
const EXEMPLO = fileURLToPath(new URL("../apresentacoes/exemplo.html", import.meta.url));
test.describe.configure({ mode: "serial" });

test.describe("a diretora cadastra os serviços", () => {
  test.use(como("dir@mectria.com"));

  test("cria um serviço com uma pergunta técnica", async ({ page }) => {
    await page.goto("/servicos");
    await expect(page.getByRole("list", { name: "Serviços" }).getByRole("listitem")).toHaveCount(12);
    await page.getByRole("button", { name: "Novo serviço" }).click();
    const form = page.getByRole("form", { name: "Serviço" });
    await form.getByLabel("Nome").fill("Inspeção de Caldeiras");
    await form.getByLabel("Sigla").fill("IC");
    await form.getByLabel("Dores (uma por linha)").fill("Caldeira sem laudo\nParada não programada");
    await form.getByRole("button", { name: "Adicionar pergunta" }).click();
    await form.getByRole("group", { name: "Pergunta 1" }).getByLabel("Texto da pergunta").fill("Quantas caldeiras são?");
    await form.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/servicos\/inspecao-de-caldeiras$/);
    await expect(page.getByRole("heading", { name: "Inspeção de Caldeiras", level: 1 })).toBeVisible();
  });

  test("envia o exemplo.html para Desenvolvimento de Produto e vê a apresentação", async ({ page }) => {
    await page.goto("/servicos/desenvolvimento-de-produto");
    const secao = page.locator("section", { has: page.getByRole("heading", { name: "Apresentação de proposta" }) });
    await expect(secao).toContainText("Sem apresentação própria");
    await secao.getByLabel("Enviar apresentação (.html)").setInputFiles(EXEMPLO);
    await expect(secao).toContainText(/exemplo\.html · \d+ KB · versão 1/);
    await secao.getByRole("button", { name: "Ver a apresentação" }).click();
    const foco = page.getByRole("dialog", { name: "Apresentação · Desenvolvimento de Produto" });
    const deck = foco.frameLocator('iframe[title="Apresentação · Desenvolvimento de Produto"]');
    await expect(deck.getByText("Proposta para Cliente de exemplo")).toBeVisible();
    await expect(foco.getByText("Slide 1 de 13")).toBeVisible();
    await foco.getByRole("button", { name: "Próximo" }).click();
    await expect(deck.getByRole("heading", { name: "O projeto que desenhamos para vocês" })).toBeVisible();
  });

  test("o endereço da apresentação vem isolado (sandbox allow-scripts)", async ({ page }) => {
    const r = await page.request.get("/api/servicos/desenvolvimento-de-produto/apresentacao?v=1");
    expect(r.status()).toBe(200);
    const csp = r.headers()["content-security-policy"];
    expect(csp).toMatch(/^sandbox allow-scripts;/);
    expect(csp).not.toContain("allow-same-origin");
    expect(csp).toContain("connect-src 'none'");
  });
});

test.describe("a hunter vê o serviço novo", () => {
  test.use(como("hun@mectria.com"));

  test("o serviço criado aparece ao marcar a diagnóstica", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Começar o bloco" }).click();
    const foco = page.getByRole("dialog", { name: "Bloco de ligações" });
    await foco.getByRole("button", { name: /Marcou diagnóstica/ }).click();
    const servico = page.getByRole("form", { name: "Marcar diagnóstica" }).getByLabel("Serviço");
    await expect(servico.locator("option", { hasText: "Inspeção de Caldeiras" })).toHaveCount(1);
  });
});

/** Abre o painel da proposta pela agenda e a janela da apresentação pelo painel. */
async function abrirReuniao(page: Page, empresa: string) {
  await page.goto("/reunioes");
  await page.locator("li", { hasText: empresa }).getByRole("button", { name: /Iniciar|Continuar/ }).click();
  await expect(page.getByRole("main", { name: "Painel da proposta" })).toBeVisible();
  const [janela] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: /Abrir apresentação|Reabrir apresentação/ }).click()]);
  await expect(janela).toHaveTitle(`Apresentação · ${empresa}`);
  return janela;
}

test.describe("o closer conduz a proposta com a apresentação em HTML", () => {
  test.use(como("clo@mectria.com"));

  test("a janela mostra o HTML, as setas passam o slide e o painel aciona a apresentação", async ({ page }) => {
    const janela = await abrirReuniao(page, "Prensa Nova");
    await page.getByRole("button", { name: "Começar reunião" }).click();
    await expect(page.getByText("1 de 13")).toBeVisible();
    const deck = janela.frameLocator('iframe[title="Apresentação · Prensa Nova"]');
    await expect(deck.getByText("Proposta para Prensa Nova")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("2 de 13")).toBeVisible();
    await expect(deck.getByRole("heading", { name: "O projeto que desenhamos para vocês" })).toBeVisible();

    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await expect(page.getByText("6 de 13")).toBeVisible();
    await deck.getByRole("button", { name: "A prensa manual trava duas vezes por semana" }).click();
    await expect(page.getByRole("region", { name: "Na apresentação" })).toContainText("A prensa manual trava duas vezes por semana");

    await page.bringToFront();
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
    await expect(page.getByText("12 de 13")).toBeVisible();
    await page.getByRole("button", { name: "Revelar o preço" }).click();
    await page.getByRole("button", { name: "Revelar o preço" }).click();
    await expect(deck.getByText("R$ 24.000,00")).toBeVisible();
    await expect(page.getByRole("region", { name: "Na apresentação" })).toContainText("Preço revelado até a etapa 2");

    await page.getByLabel("Horas paradas por mês").fill("10");
    await page.getByLabel("Custo da hora parada (R$)").fill("300");
    await expect(deck.getByText(/R\$\s36\.000/)).toBeVisible();
    await expect(deck.getByText(/se paga em 8 meses/)).toBeVisible();
  });
});
