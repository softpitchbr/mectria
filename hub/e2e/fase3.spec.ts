import { expect, test, type Page } from "@playwright/test";

const como = (email: string) => ({ extraHTTPHeaders: { "X-Dev-Email": email } });
test.describe.configure({ mode: "serial" });

function amanha(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + 86_400_000));
}

async function iniciar(page: Page, empresa: string) {
  await page.goto("/reunioes");
  const linha = page.locator("li", { hasText: empresa });
  await linha.getByRole("button", { name: /Iniciar|Continuar/ }).click();
  await expect(page.getByRole("main", { name: "Painel da diagnóstica" })).toBeVisible();
}

async function responder(page: Page, texto: string) {
  await page.getByRole("button", { name: "Ir para G", exact: true }).click();
  await page.getByLabel("Resposta").fill(texto);
}

test.describe("closer conduz a diagnóstica", () => {
  test.use(como("clo@mectria.com"));

  test("pergunta, anota, fecha e gera o briefing", async ({ page }) => {
    await iniciar(page, "Torno Hoje");
    await responder(page, "Chegar a 26 °C no galpão às 15 h");
    await page.getByRole("button", { name: "Ir para C", exact: true }).click();
    await page.getByLabel("Resposta").fill("O galpão passa de 38 °C à tarde");

    await page.getByLabel("Resposta").blur();
    await page.keyboard.press("n");
    await page.getByRole("button", { name: "Técnico", exact: true }).click();
    await page.getByRole("textbox", { name: "Anotação" }).fill("Pé-direito de 9 m");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await page.keyboard.press("n");
    await page.getByRole("button", { name: "Objeção", exact: true }).click();
    await page.getByRole("textbox", { name: "Anotação" }).fill("Achou caro o outro orçamento");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("list", { name: "Anotações" })).toContainText("Pé-direito de 9 m");

    await page.getByRole("button", { name: "Ir para Fechamento", exact: true }).click();
    const form = page.getByRole("form", { name: "Fechamento da diagnóstica" });
    await form.getByRole("radio", { name: "Proposta marcada" }).check();
    await form.getByLabel("Data da apresentação").fill(amanha());
    await form.getByLabel("Hora").fill("14:00");
    await form.getByLabel("Quem decide").fill("Bia e o sócio");
    await form.getByRole("button", { name: "Encerrar diagnóstica" }).click();

    await expect(page).toHaveURL(/\/reunioes\/\d+\/briefing$/);
    await expect(page.getByRole("heading", { name: "Briefing para Projetos" })).toBeVisible();
    await expect(page.getByText("O galpão passa de 38 °C à tarde")).toBeVisible();
    await expect(page.getByText("Pé-direito de 9 m")).toBeVisible();
    await page.getByRole("button", { name: "Marcar como enviado para Projetos" }).click();
    await expect(page.getByRole("status").last()).toContainText("Briefing marcado como enviado para Projetos.");

    const pdf = await page.pdf({ format: "A4", printBackground: true });
    expect(pdf.length).toBeGreaterThan(10_000);
  });

  test("sem internet guarda no computador e sincroniza quando volta", async ({ page, context }) => {
    await iniciar(page, "Prensa Fria");
    await context.setOffline(true);
    await responder(page, "Parar os acidentes na prensa");
    await expect(page.getByText("Sem internet · salvo neste computador")).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
    await expect(page.getByText("Salvo", { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await page.getByRole("button", { name: "Ir para G", exact: true }).click();
    await expect(page.getByLabel("Resposta")).toHaveValue("Parar os acidentes na prensa");
  });

  test("não qualificou: sai das diagnósticas e não entra no follow-up", async ({ page }) => {
    await iniciar(page, "Prensa Fria");
    await page.getByRole("button", { name: "Ir para Fechamento", exact: true }).click();
    const form = page.getByRole("form", { name: "Fechamento da diagnóstica" });
    await form.getByRole("radio", { name: "Não qualificou" }).check();
    await form.getByLabel("Motivo").selectOption("Sem orçamento");
    await form.getByRole("button", { name: "Encerrar diagnóstica" }).click();
    await expect(page.getByText("Não qualificou: Sem orçamento")).toBeVisible();
    await page.goto("/follow-up");
    await expect(page.getByRole("heading", { level: 1, name: "Follow-up" })).toBeVisible();
    await expect(page.getByRole("main")).not.toContainText("Prensa Fria");
  });

  test("Ctrl K, caro e Enter abre a objeção no playbook", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("esta caro");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/playbooks\/objecoes\?o=caro$/);
    await expect(page.locator("#objecao-caro")).toBeVisible();
  });
});

test.describe("celular · fase 3", () => {
  test.use({ ...como("clo@mectria.com"), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("Reuniões e Playbooks sem rolagem para o lado", async ({ page }) => {
    for (const caminho of ["/reunioes", "/playbooks/objecoes", "/playbooks/proposta"]) {
      await page.goto(caminho);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => document.documentElement.scrollWidth), caminho).toBe(390);
    }
  });
});

test.describe("briefing impresso", () => {
  test.use(como("clo@mectria.com"));

  test("ficha longa sem fundo: margem em toda página, seção sem pular página e marca visível", async ({ page }) => {
    const longa = "O cliente explicou com detalhes como o galpão esquenta à tarde e o que já tentou. ".repeat(6);
    const respostas: Record<string, string> = {};
    for (const id of ["g-resultado", "g-medida", "g-maior", "p-tentativas", "p-alternativa", "c-dor", "c-exemplo", "t-porque-agora", "t-prazo", "b-faixa", "a-decisores", "a-processo", "ci-negativa", "ci-numeros", "e-incluido", "e-normas"]) respostas[id] = longa;
    await page.route("**/api/reunioes/900", (rota) =>
      rota.fulfill({
        json: {
          reuniao: {
            id: 900, oportunidadeId: 900, empresa: "Fundição Longa", tipo: "diagnostica", dataHora: "2026-11-13T10:00", formato: "online",
            situacao: "concluida", closerId: null, closerNome: "Carlos Closer", quemDecide: null, iniciadaEm: null, encerradaEm: null,
            resultado: "proposta_marcada", motivo: null, briefingEnviadoEm: null, oportunidadeSituacao: "proposta_marcada",
          },
          oportunidade: { id: 900, empresa: "Fundição Longa", contato: "Ana", servico: "climatizacao", closerId: null, situacao: "proposta_marcada" },
          respostas,
          anotacoes: [1, 2, 3].map((n) => ({ idCliente: `a${n}`, minuto: n * 10, passo: "c-dor", marcacao: "tecnico", texto: longa })),
          pendencias: [],
        },
      }),
    );
    await page.goto("/reunioes/900/briefing");
    await expect(page.getByRole("heading", { name: "Briefing para Projetos" })).toBeVisible();
    await expect(page).toHaveTitle("Briefing · Fundição Longa · Sex, 13/11");

    await page.emulateMedia({ media: "print" });
    const impressao = await page.evaluate(() => {
      const regras = [...document.styleSheets].flatMap((f) => [...f.cssRules]);
      const paginas = regras.flatMap((r) => (r instanceof CSSMediaRule ? [...r.cssRules] : [r])).filter((r) => r instanceof CSSPageRule) as CSSPageRule[];
      const folha = getComputedStyle(document.querySelector("article")!);
      const marca = getComputedStyle(document.querySelector("article header > div")!);
      const secao = getComputedStyle(document.querySelector("article section")!);
      const titulo = getComputedStyle(document.querySelector("article section h2")!);
      return {
        margem: paginas.map((p) => p.style.getPropertyValue("margin")),
        recuoDaFolha: folha.paddingTop,
        corDaMarca: marca.getPropertyValue("print-color-adjust") || marca.getPropertyValue("-webkit-print-color-adjust"),
        secaoInteira: secao.breakInside,
        tituloSozinho: titulo.breakAfter,
      };
    });
    expect(impressao).toEqual({ margem: ["18mm"], recuoDaFolha: "0px", corDaMarca: "exact", secaoInteira: "auto", tituloSozinho: "avoid" });

    const pdf = await page.pdf({ format: "A4", printBackground: false, preferCSSPageSize: true });
    const paginas = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(paginas.length).toBeGreaterThan(1);
  });
});
