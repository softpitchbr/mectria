import { expect, test } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });
test.describe.configure({ mode: "serial" });

const hojeSp = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const amanha = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + 86_400_000));

test.describe("diretor", () => {
  test.use(como("dir@mectria.com"));

  test("vê os números do mês e exporta o CSV", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Este mês" })).toContainText("R$ 9.000,00");
    await page.goto("/time");
    await page.getByRole("tab", { name: "Mês" }).click();
    await expect(page.getByRole("region", { name: "Resumo do mês" })).toContainText("Valor vendido");
    await expect(page.getByRole("table", { name: "Números por closer" })).toContainText("Carlos Closer");
    // O download do navegador não leva o cabeçalho de login do ambiente de teste (em produção vai o cookie do
    // Cloudflare Access); por isso o teste confere o link e baixa o arquivo pela API.
    const link = page.getByRole("link", { name: "Baixar o histórico do mês (CSV)" });
    await expect(link).toHaveAttribute("href", `/api/exportar/historico.csv?mes=${hojeSp().slice(0, 7)}`);
    const csv = await page.request.get((await link.getAttribute("href"))!);
    expect(csv.headers()["content-disposition"]).toBe(`attachment; filename="historico-${hojeSp().slice(0, 7)}.csv"`);
    expect(await csv.text()).toContain("Bomba Ganha;");
  });
});

test.describe("Projetos", () => {
  test.use(como("pro@mectria.com"));

  test("responde a pendência técnica em foco", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Pendências abertas" })).toContainText("Qual a vazão necessária no galpão?");
    await page.getByRole("link", { name: "Responder em Briefings" }).click();
    await page.getByRole("button", { name: "Responder: Qual a vazão necessária no galpão?" }).click();
    const foco = page.getByRole("dialog", { name: "Pendência · Usinagem Pendente" });
    await foco.getByLabel("Resposta").fill("Uns 3 m³/h; cabe na proposta como está.");
    await foco.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(page.getByRole("status")).toContainText("Resposta enviada.");
    await expect(page.getByRole("button", { name: "Fechar: Qual a vazão necessária no galpão?" })).toBeVisible();
  });
});

test.describe("closer", () => {
  test.use(como("clo@mectria.com"));

  test("vê a resposta de Projetos no card do follow-up", async ({ page }) => {
    await page.goto("/follow-up");
    await expect(page.getByRole("button", { name: /Usinagem Pendente/ })).toContainText("Projetos respondeu: Uns 3 m³/h");
  });

  test("reativa a oportunidade em nutrição marcando uma reunião", async ({ page }) => {
    await page.goto("/rotinas");
    await expect(page.locator("li", { hasText: "Reativar Forja Nutrida" })).toBeVisible();
    await page.goto("/follow-up?aba=reativacao");
    const cartao = page.getByRole("article", { name: "Reativar Forja Nutrida" });
    await expect(cartao.getByLabel("Mensagem de reativação")).toContainText("Opa, Davi, tudo bem? A gente conversou há mais ou menos 2 meses");
    await cartao.getByRole("button", { name: "Marcar reunião" }).click();
    const foco = page.getByRole("dialog", { name: "Marcar reunião · Forja Nutrida" });
    await foco.getByLabel("Data").fill(amanha());
    await foco.getByLabel("Hora").fill("10:00");
    await foco.getByRole("button", { name: "Marcar a reunião" }).click();
    await expect(page.getByRole("status")).toContainText("Reunião marcada com Forja Nutrida.");
    await page.goto("/reunioes");
    await expect(page.locator("li", { hasText: "Forja Nutrida" })).toBeVisible();
  });

  test("a proposta nova cria os toques da janela de 7 dias", async ({ page }) => {
    const r = await page.request.post("/api/propostas", {
      data: { empresa: "Janela Sete", contato: "Ana", servico: "climatizacao", valor: "8.000,00", apresentadaEm: hojeSp(), quemDecide: "Ana (sócia)" },
    });
    expect(r.status()).toBe(201);
    const { toques } = (await r.json()) as { toques: { codigo: string }[] };
    const codigos = toques.map((t) => t.codigo);
    expect(codigos[0]).toBe("D0");
    expect(codigos.at(-1)).toBe("D7");
    expect(codigos.some((c) => ["D3", "D5", "D8", "D12", "D15"].includes(c))).toBe(false);
    await page.goto("/follow-up");
    await expect(page.getByRole("button", { name: /Janela Sete/ })).toContainText("D0");
  });
});

test.describe("hunter", () => {
  test.use(como("hun@mectria.com"));

  test("conduz a diagnóstica que marcou", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Iniciar a diagnóstica de Solda Hunter" }).click();
    await expect(page.getByRole("main", { name: "Painel da diagnóstica" })).toBeVisible();
    await page.goto("/reunioes");
    await expect(page.locator("li", { hasText: "Solda Hunter" }).getByRole("button", { name: /Iniciar|Continuar/ })).toBeVisible();
  });
});
