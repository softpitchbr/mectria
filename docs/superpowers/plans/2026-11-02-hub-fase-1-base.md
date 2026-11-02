# Hub comercial · Fase 1 (Base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a base do hub novo: projeto React + Cloudflare (Pages, Functions, D1), login pela identidade do Cloudflare Access, cadastro de pessoas e cargos, o esqueleto com navegação por cargo, a busca Ctrl K e o sistema visual Prancheta nos dois temas.

**Architecture:** Um app em `hub/`: a interface React (Vite) é servida pelo Cloudflare Pages; a API são Pages Functions em `hub/functions/api/`, com a lógica em `hub/servidor/`; o banco é D1 com migrações em `hub/migrations/`. Tipos e regras usados dos dois lados (cargos, permissões, normalização de texto) ficam em `hub/compartilhado/`. Em produção a identidade vem do JWT do Cloudflare Access; em desenvolvimento, de um cabeçalho `X-Dev-Email` aceito só quando `AMBIENTE=dev`.

**Tech Stack:** React 19.1, react-router 7, Vite 7, TypeScript 5.9, Vitest 3.2 (jsdom para a interface; `@cloudflare/vitest-pool-workers` 0.8.71 para a API), Wrangler 4.35, jose 6, Playwright 1.56.1, @fontsource (Poppins, IBM Plex Sans, IBM Plex Mono).

**Spec:** `docs/15-hub-template.md` (seções 3, 4, 5, 7 e 11, fase 1).

**Fases seguintes:** cada fase da seção 11 da spec ganha o seu plano quando a anterior for entregue (2 · rotina e follow-up, 3 · diagnóstica, 4 · proposta em duas janelas, 5 · celular, 6 · diretor e Projetos).

## Global Constraints

- Tudo em português do Brasil: interface, mensagens de erro, nomes de arquivos e funções, commits. Escrever sempre **MecTRIA**.
- Versões fixas (sem `^`) no `hub/package.json`: react 19.1.10, react-dom 19.1.10, react-router 7.18.5, vite 7.3.7, @vitejs/plugin-react 5.1.4, typescript 5.9.3, vitest 3.2.4, @cloudflare/vitest-pool-workers 0.8.71, wrangler 4.35.0, @cloudflare/workers-types 4.20250906.0, jose 6.2.15, @testing-library/react 16.3.3, @testing-library/user-event 14.6.8, @testing-library/jest-dom 6.9.1, jsdom 26.1.0, @playwright/test 1.56.1, @fontsource/poppins 5.3.0, @fontsource/ibm-plex-sans 5.3.0, @fontsource/ibm-plex-mono 5.3.0.
- Playwright usa o Chromium já instalado (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); nunca rodar `playwright install` neste ambiente.
- Cargos: `hunter`, `closer`, `diretor`, `projetos`.
- Tokens de cor, valores exatos (escuro / claro): fundo #16171A / #F2F1EE; painel #1F2024 / #FFFFFF; painel em foco #27282D / #FAF9F7; linha #34353B / #E2DFD9; linha viva #4A4B52 / #CDC8C0; texto #EEEDE9 / #1F1E1C; texto suave #A19E99 / #6B6762; vermelho-texto #EF5A5F / #B3242A; vermelho (ação, texto branco) #C1272D nos dois; vinho #780000 nos dois.
- Grade técnica: linha fina a cada 16 px e forte a cada 64 px. Fina rgba(31,30,28,.035) / forte rgba(31,30,28,.07) no claro; fina rgba(255,255,255,.025) / forte rgba(255,255,255,.055) no escuro. Perto do cursor, grade rgba(31,30,28,.08) no claro e rgba(255,255,255,.09) no escuro.
- Fontes: Poppins 600 nos títulos, IBM Plex Sans 400/500 no texto, IBM Plex Mono 500 em números, prazos e códigos, com `font-variant-numeric: tabular-nums`.
- Movimento: 140 ms (resposta), 240 ms (abrir e fechar), 420 ms (mudar de modo), curva única `cubic-bezier(.2, .8, .2, 1)`. Com `prefers-reduced-motion: reduce`, nenhuma animação nem transição.
- Contraste mínimo de 4,5:1 nos dois temas. Texto vermelho só sobre o fundo e o painel.
- Um botão vermelho (`Botao` variante `primario`) por tela.
- Tema: padrão "sistema"; escolha lembrada no navegador; atributo `data-theme="dark" | "light"` no `<html>`, ausente em "sistema".
- Celular: até 760 px de largura, a barra lateral vira barra embaixo.
- Nada é apagado: pessoa sai com `ativo = 0`.
- Nenhum segredo, e-mail real de membro da MecTRIA nem credencial da Triângulo no repositório.

## Review Focus

- **E-mail com maiúsculas ou espaços** (" Carlos@MecTRIA.com "): no login e no cadastro, deve casar com a mesma pessoa. Testes nas Tasks 4 e 5.
- **Último diretor:** desativar a si mesmo, ou rebaixar ou desativar o último diretor ativo, deixaria o time sem ninguém para gerenciar. Deve ser recusado com mensagem clara. Teste na Task 9.
- **Navegador sem localStorage** (aba anônima ou bloqueio): o tema e o app têm que funcionar, só sem lembrar a escolha. Teste na Task 2.
- **Busca sem acento e com maiúsculas** ("objecao", "REUNIOES"): deve achar "Objeções" e "Reuniões". Teste na Task 8.
- **Pessoa desativada com o hub aberto:** a próxima chamada à API devolve 403 e a tela troca para "sem acesso", sem tela quebrada. Testes nas Tasks 5 e 7.

---

## Mapa de arquivos

```
hub/
  package.json, tsconfig.json, vite.config.ts, vitest.config.ts, vitest.api.config.ts, wrangler.toml, .dev.vars.exemplo
  index.html
  migrations/0001_pessoas.sql
  compartilhado/cargos.ts          tipo Cargo, lista e rótulos
  compartilhado/icones.ts          tipo NomeIcone (usado pela interface e pelas seções)
  compartilhado/permissoes.ts      seções, quem vê cada uma, quem gerencia pessoas
  compartilhado/texto.ts           normalizar(texto) e normalizarEmail(email)
  servidor/tipos.ts                Env e Pessoa
  servidor/respostas.ts            json(), erro()
  servidor/pessoas.ts              acesso ao D1 (buscar, listar, criar, atualizar)
  servidor/identidade.ts           e-mail a partir do Access ou do cabeçalho de dev
  functions/api/_middleware.ts     identifica a pessoa em toda chamada /api
  functions/api/eu.ts              GET  /api/eu
  functions/api/pessoas/index.ts   GET e POST /api/pessoas
  functions/api/pessoas/[id].ts    PATCH /api/pessoas/:id
  src/main.tsx, src/App.tsx        entrada e rotas
  src/estilo/tokens.css, base.css, fontes.ts
  src/tema/tema.ts, ChaveTema.tsx, contraste.ts
  src/componentes/                 Botao, Painel, Tag, Campo, Icone, Aviso (+ .module.css)
  src/efeitos/luz.ts               useLuzDoCursor, usePosicaoNoElemento
  src/api/cliente.ts               fetch com erro tipado e evento de "sem acesso"
  src/sessao/useEu.ts
  src/shell/                       Layout, BarraLateral, BarraDeBaixo, Topo, Perfil, SemAcesso, EmConstrucao
  src/busca/buscar.ts, fontes.ts, Busca.tsx
  src/telas/Hoje.tsx, Time.tsx, Vitrine.tsx
  e2e/playwright.config.ts, e2e/semente.sql, e2e/fase1.spec.ts
  README.md, IMPLANTACAO.md
.github/workflows/hub.yml
```

Testes ficam ao lado do arquivo testado (`*.test.ts` ou `*.test.tsx`). Os de `servidor/` e `functions/` rodam no pool de Workers; os de `src/` e `compartilhado/` rodam em jsdom.

---

### Task 1: Projeto base e integração contínua

**Files:**
- Create: `hub/package.json`, `hub/tsconfig.json` (com `types: ["@cloudflare/workers-types", "@cloudflare/vitest-pool-workers"]` para `servidor/` e `functions/`), `hub/vite.config.ts`, `hub/vitest.config.ts`, `hub/vitest.api.config.ts`, `hub/wrangler.toml`, `hub/.dev.vars.exemplo`, `hub/index.html`, `hub/src/main.tsx`, `hub/src/App.tsx`, `hub/src/App.test.tsx`, `hub/.gitignore`, `.github/workflows/hub.yml`

**Interfaces:**
- Produces: scripts `dev` (vite), `build` (tsc -b && vite build, saída `dist/`), `typecheck`, `test:app` (`vitest run`), `test:api` (`vitest run --config vitest.api.config.ts`), `test` (os dois), `e2e` (Task 10). `wrangler.toml` com `name = "hub-mectria"`, `pages_build_output_dir = "dist"`, `compatibility_date = "2025-09-01"`, binding D1 `DB` (`database_name = "hub-mectria"`, `database_id = "local"`, `migrations_dir = "migrations"`) e `[vars] AMBIENTE = "dev"`.

- [ ] **Step 1: Escrever o teste que falha** em `hub/src/App.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("mostra o nome do hub", () => {
  render(<App />);
  expect(screen.getByText("Hub comercial MecTRIA")).toBeInTheDocument();
});
```

- [ ] **Step 2: Criar o projeto** com as versões fixas das Global Constraints; `vitest.config.ts` com `environment: "jsdom"`, `include: ["src/**/*.test.{ts,tsx}", "compartilhado/**/*.test.ts"]` e `setupFiles` importando `@testing-library/jest-dom/vitest`; `vitest.api.config.ts` com `defineWorkersConfig` (de `@cloudflare/vitest-pool-workers/config`), `include: ["servidor/**/*.test.ts", "functions/**/*.test.ts"]`, `miniflare.d1Databases: ["DB"]`, `bindings: { AMBIENTE: "dev", TEST_MIGRATIONS: await readD1Migrations("migrations") }`.

Run: `cd hub && npm install && npm run test:app`
Expected: FAIL, `App` ainda não existe ou não mostra o texto.

- [ ] **Step 3: `App()` em `hub/src/App.tsx`** devolve um `<h1>Hub comercial MecTRIA</h1>` (substituído na Task 7).

- [ ] **Step 4: Rodar e verificar**

Run: `cd hub && npm run test:app && npm run typecheck && npm run build`
Expected: 1 teste passa; typecheck sem erros; `dist/index.html` gerado.

- [ ] **Step 5: Integração contínua** em `.github/workflows/hub.yml`: em push e pull request que mexam em `hub/**`, Node 22, `working-directory: hub`, passos `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. (O e2e entra no workflow na Task 10.)

- [ ] **Step 6: Commit**

```bash
git add hub .github/workflows/hub.yml
git commit -m "Cria o projeto base do hub novo (React, Vite e Cloudflare Pages)"
```

### Task 2: Tokens, temas e contraste

**Files:**
- Create: `hub/src/estilo/tokens.css`, `hub/src/tema/tema.ts`, `hub/src/tema/tema.test.ts`, `hub/src/tema/contraste.ts`, `hub/src/tema/contraste.test.ts`, `hub/src/tema/ChaveTema.tsx`, `hub/src/tema/ChaveTema.test.tsx`
- Modify: `hub/src/main.tsx` (importa `tokens.css` e aplica o tema salvo antes do primeiro render)

**Interfaces:**
- Produces: `type EscolhaTema = "sistema" | "escuro" | "claro"`; `resolverTema(escolha: EscolhaTema, prefereEscuro: boolean): "escuro" | "claro"`; `lerEscolhaTema(armazenamento?: Storage | null): EscolhaTema`; `salvarEscolhaTema(escolha: EscolhaTema, armazenamento?: Storage | null): void`; `aplicarTema(escolha: EscolhaTema, raiz?: HTMLElement): void`; `contraste(corA: string, corB: string): number` (razão WCAG 2.1, hex de 6 dígitos); componente `<ChaveTema />` (três botões "Sistema", "Escuro", "Claro", com `aria-pressed`). Chave do armazenamento: `hub-tema`. Tokens CSS: `--fundo, --painel, --painel-alto, --linha, --linha-viva, --texto, --suave, --vermelho, --vermelho-texto, --vinho, --grade-fina, --grade-forte, --grade-luz, --luz, --realce, --sombra, --rapido, --medio, --lento, --curva`.

- [ ] **Step 1: Escrever os testes que falham**

`tema.test.ts`:

```ts
test("sistema segue o computador", () => {
  expect(resolverTema("sistema", true)).toBe("escuro");
  expect(resolverTema("sistema", false)).toBe("claro");
  expect(resolverTema("claro", true)).toBe("claro");
});
test("escolha inválida ou ausente vira sistema", () => {
  const s = new Map<string, string>([["hub-tema", "azul"]]);
  const falso = { getItem: (k: string) => s.get(k) ?? null, setItem: () => {} } as unknown as Storage;
  expect(lerEscolhaTema(falso)).toBe("sistema");
});
test("navegador sem localStorage não quebra", () => {
  const quebrado = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } } as unknown as Storage;
  expect(lerEscolhaTema(quebrado)).toBe("sistema");
  expect(() => salvarEscolhaTema("escuro", quebrado)).not.toThrow();
});
test("aplicarTema escreve data-theme só quando a escolha é fixa", () => {
  const raiz = document.createElement("html");
  aplicarTema("escuro", raiz); expect(raiz.getAttribute("data-theme")).toBe("dark");
  aplicarTema("claro", raiz); expect(raiz.getAttribute("data-theme")).toBe("light");
  aplicarTema("sistema", raiz); expect(raiz.hasAttribute("data-theme")).toBe(false);
});
```

`contraste.test.ts` (os pares de uso real, os dois temas):

```ts
const escuro = { fundo: "#16171A", painel: "#1F2024", alto: "#27282D", texto: "#EEEDE9", suave: "#A19E99", vermelhoTexto: "#EF5A5F" };
const claro = { fundo: "#F2F1EE", painel: "#FFFFFF", alto: "#FAF9F7", texto: "#1F1E1C", suave: "#6B6762", vermelhoTexto: "#B3242A" };
test.each([["escuro", escuro], ["claro", claro]])("contraste mínimo no tema %s", (_n, t) => {
  for (const f of [t.fundo, t.painel, t.alto]) {
    expect(contraste(t.texto, f)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.suave, f)).toBeGreaterThanOrEqual(4.5);
  }
  for (const f of [t.fundo, t.painel]) expect(contraste(t.vermelhoTexto, f)).toBeGreaterThanOrEqual(4.5);
});
test("texto branco nos botões de marca", () => {
  expect(contraste("#FFFFFF", "#C1272D")).toBeGreaterThanOrEqual(4.5);
  expect(contraste("#FFFFFF", "#780000")).toBeGreaterThanOrEqual(4.5);
});
test("valor conhecido", () => {
  expect(contraste("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
});
```

`ChaveTema.test.tsx`: clicar em "Escuro" deixa esse botão com `aria-pressed="true"`, grava `escuro` em `localStorage["hub-tema"]` e põe `data-theme="dark"` em `document.documentElement`.

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/tema`. Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar** as funções e o componente nas assinaturas acima. `tokens.css` no formato: valores do claro em `:root`; os do escuro em `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … ; color-scheme: dark } }` e repetidos em `:root[data-theme="dark"]`. `--curva: cubic-bezier(.2, .8, .2, 1)`, `--rapido: 140ms`, `--medio: 240ms`, `--lento: 420ms`. `--realce`: rgba(255,255,255,.9) claro, rgba(255,255,255,.07) escuro. `--sombra`: `0 1px 2px rgba(31,30,28,.05), 0 6px 20px -12px rgba(31,30,28,.18)` claro, `0 1px 0 rgba(0,0,0,.3), 0 10px 30px -18px rgba(0,0,0,.7)` escuro. `--luz`: rgba(120,0,0,.05) claro, rgba(255,255,255,.06) escuro.

- [ ] **Step 4: Rodar** `cd hub && npx vitest run src/tema`. Expected: todos passam.

- [ ] **Step 5: Commit** `git commit -m "Adiciona os tokens da Prancheta, os temas claro e escuro e o teste de contraste"`

### Task 3: Fundo com grade, luz do cursor e componentes básicos

**Files:**
- Create: `hub/compartilhado/icones.ts`, `hub/src/estilo/base.css`, `hub/src/estilo/fontes.ts`, `hub/src/efeitos/luz.ts`, `hub/src/efeitos/luz.test.ts`, `hub/src/componentes/{Botao,Painel,Tag,Campo,Icone,Aviso}.tsx` (+ `.module.css`), `hub/src/componentes/componentes.test.tsx`, `hub/src/telas/Vitrine.tsx`

**Interfaces:**
- Produces:
  - `useLuzDoCursor(): void`: grava `--cx` e `--cy` (px) em `document.documentElement` com `requestAnimationFrame`; não faz nada quando `matchMedia("(pointer: coarse)")` ou `matchMedia("(prefers-reduced-motion: reduce)")` casam.
  - `usePosicaoNoElemento(ref: RefObject<HTMLElement>): void`: grava `--x` e `--y` relativos ao elemento.
  - `<Botao variante?: "primario" | "secundario" | "fantasma" (padrão "secundario") …props de button />`
  - `<Painel foco?: boolean>` (fundo `--painel` ou `--painel-alto`, borda `--linha`, `box-shadow: inset 0 1px 0 var(--realce), var(--sombra)`, brilho que segue o cursor via `usePosicaoNoElemento`)
  - `<Tag tipo?: "neutro" | "atrasado" | "hoje">`
  - `<Campo rotulo: string … props de input>` (rótulo ligado por `id`)
  - `<Icone nome: NomeIcone tamanho?: number>`, com o tipo em `compartilhado/icones.ts`: `type NomeIcone = "hoje" | "reunioes" | "followup" | "playbooks" | "apresentacoes" | "rotinas" | "time" | "briefings" | "busca" | "sair" | "mais" | "fechar"` (traço 1.7, `currentColor`, `aria-hidden`)
  - `avisar(texto: string): void` e `<Avisos />` (aviso no rodapé por 2,4 s, com `role="status"`)

- [ ] **Step 1: Escrever os testes que falham**

`luz.test.ts`: com `matchMedia` falso devolvendo `matches: true` para `(pointer: coarse)`, disparar `pointermove` não grava `--cx`; com `matches: false` para tudo, grava `--cx` após o próximo frame (usar `vi.useFakeTimers` e avançar o rAF).

`componentes.test.tsx`:
- `<Botao variante="primario">Iniciar</Botao>` renderiza um `button` com a classe da variante primária.
- `<Campo rotulo="E-mail" />` deixa o input acessível por `getByLabelText("E-mail")`.
- `<Tag tipo="atrasado">Atrasado</Tag>` tem a classe de atraso.
- `<Icone nome="busca" />` tem `aria-hidden="true"`.
- `avisar("Salvo")` mostra "Salvo" num `role="status"` e some depois de 2.400 ms.

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/efeitos src/componentes`. Expected: FAIL.

- [ ] **Step 3: Implementar** os componentes nas interfaces acima.
  - `base.css`:
    - `body` com `background-color: var(--fundo)` e a grade em quatro `linear-gradient` (64 px forte e 16 px fina, valores das Global Constraints);
    - uma camada `body::before` fixa com a grade em `--grade-luz` e `mask-image: radial-gradient(260px circle at var(--cx) var(--cy), #000, transparent 70%)`, escondida em `(pointer: coarse)`;
    - tipografia com os papéis de fonte;
    - a regra global de `prefers-reduced-motion`.
  - `fontes.ts` importa `@fontsource/poppins/600.css`, `@fontsource/ibm-plex-sans/400.css`, `@fontsource/ibm-plex-sans/500.css` e `@fontsource/ibm-plex-mono/500.css`.
  - `Vitrine.tsx` (rota `/vitrine`, só em desenvolvimento) mostra todos os componentes nos estados principais, para conferência visual.

- [ ] **Step 4: Rodar** `cd hub && npx vitest run src/efeitos src/componentes && npm run typecheck`. Expected: passam.

- [ ] **Step 5: Commit** `git commit -m "Adiciona a grade técnica, a luz do cursor e os componentes básicos"`

### Task 4: Banco de pessoas

**Files:**
- Create: `hub/migrations/0001_pessoas.sql`, `hub/compartilhado/cargos.ts`, `hub/compartilhado/texto.ts`, `hub/compartilhado/texto.test.ts`, `hub/servidor/tipos.ts`, `hub/servidor/pessoas.ts`, `hub/servidor/pessoas.test.ts`

**Interfaces:**
- Produces:
  - `type Cargo = "hunter" | "closer" | "diretor" | "projetos"`; `CARGOS: Cargo[]`; `ROTULO_CARGO: Record<Cargo, string>` = `{ hunter: "Hunter", closer: "Closer", diretor: "Diretor comercial", projetos: "Projetos" }`.
  - `normalizar(texto: string): string` (sem acentos, minúsculas, espaços colapsados, sem espaços nas pontas).
  - `normalizarEmail(email: string): string` (trim e minúsculas).
  - `interface Env { DB: D1Database; AMBIENTE: "dev" | "producao"; ACCESS_EQUIPE?: string; ACCESS_AUD?: string; DIRETOR_INICIAL?: string }`.
  - `interface Pessoa { id: number; nome: string; email: string; cargo: Cargo; ativo: boolean; criadoEm: string; atualizadoEm: string }`.
  - Em `servidor/pessoas.ts`:
    - `buscarPorEmail(db: D1Database, email: string): Promise<Pessoa | null>`
    - `buscarPorId(db, id: number): Promise<Pessoa | null>`
    - `listar(db): Promise<Pessoa[]>` (ativas primeiro, depois por nome)
    - `criar(db, dados: { nome: string; email: string; cargo: Cargo }): Promise<Pessoa>`
    - `atualizar(db, id: number, mudancas: Partial<Pick<Pessoa, "nome" | "cargo" | "ativo">>): Promise<Pessoa>`
    - `contarDiretoresAtivos(db): Promise<number>`

Tabela `pessoas`:

```sql
CREATE TABLE pessoas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL CHECK (cargo IN ('hunter', 'closer', 'diretor', 'projetos')),
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 1: Escrever os testes que falham**

`texto.test.ts`: `normalizar("  Objeções   Técnicas ")` dá `"objecoes tecnicas"`; `normalizarEmail(" Carlos@MecTRIA.com ")` dá `"carlos@mectria.com"`.

`pessoas.test.ts` (antes de cada teste: `applyD1Migrations(env.DB, env.TEST_MIGRATIONS)` e `DELETE FROM pessoas`):
- `criar` grava o e-mail normalizado, e `buscarPorEmail(db, " CARLOS@mectria.com")` acha a mesma pessoa.
- `criar` com um e-mail já existente (outra caixa) rejeita com erro `"email_duplicado"`.
- `atualizar(db, id, { ativo: false })` mantém a pessoa em `listar` com `ativo: false` e atualiza `atualizadoEm`.
- `contarDiretoresAtivos` ignora diretores inativos.

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/pessoas.test.ts && npx vitest run compartilhado`. Expected: FAIL.

- [ ] **Step 3: Implementar** nas assinaturas acima. Converter as colunas de `snake_case` para `camelCase` num só lugar (`deLinha`). Traduzir o erro de `UNIQUE` do D1 para `Error("email_duplicado")`.

- [ ] **Step 4: Rodar** os mesmos comandos. Expected: passam.

- [ ] **Step 5: Commit** `git commit -m "Cria a tabela de pessoas e o acesso a ela"`

### Task 5: Identidade e login

**Files:**
- Create: `hub/servidor/identidade.ts`, `hub/servidor/identidade.test.ts`, `hub/servidor/respostas.ts`, `hub/functions/api/_middleware.ts`, `hub/functions/api/eu.ts`, `hub/functions/api/eu.test.ts`

**Interfaces:**
- Consumes: `buscarPorEmail`, `criar`, `contarDiretoresAtivos` (Task 4); `normalizarEmail` (Task 4).
- Produces:
  - `json(dados: unknown, status = 200): Response` e `erro(codigo: CodigoErro, mensagem: string): Response`, com `type CodigoErro = "sem_identidade" | "sem_acesso" | "invalido" | "conflito" | "nao_encontrado" | "ultimo_diretor"`. Status: 401, 403, 400, 409, 404 e 409. Corpo: `{ erro, mensagem }`.
  - `emailDaRequisicao(req: Request, env: Env, opcoes?: { jwks?: JWTVerifyGetKey }): Promise<string | null>`:
    - em `producao`, valida `Cf-Access-Jwt-Assertion` com jose, usando `issuer = https://${ACCESS_EQUIPE}.cloudflareaccess.com`, `audience = ACCESS_AUD` e chaves de `${issuer}/cdn-cgi/access/certs`, ou `opcoes.jwks` nos testes;
    - em `dev`, usa o cabeçalho `X-Dev-Email`.
  - O middleware põe a pessoa em `context.data.pessoa` (tipo `Pessoa`) para todas as rotas `/api/*`.
  - `GET /api/eu` devolve `{ id, nome, email, cargo }`.

Regra do primeiro diretor: se o e-mail não está cadastrado, é igual a `normalizarEmail(env.DIRETOR_INICIAL)` e `contarDiretoresAtivos` dá 0, o middleware cria a pessoa com cargo `diretor` e nome igual à parte do e-mail antes do @, e segue.

- [ ] **Step 1: Escrever os testes que falham**

`identidade.test.ts` (chaves geradas com `generateKeyPair("RS256")` e `createLocalJWKSet`):
- Em `producao`, um JWT válido (issuer e audience certos, claim `email: "Ana@MecTRIA.com"`) devolve `"ana@mectria.com"`.
- Em `producao`, um JWT com audience errada devolve `null`.
- **Em `producao`, o cabeçalho `X-Dev-Email` é ignorado** e devolve `null`.
- Em `dev`, `X-Dev-Email: " Ana@mectria.com "` devolve `"ana@mectria.com"`.

`eu.test.ts` (chamando `onRequest` do middleware e depois `onRequestGet` de `eu.ts`, com `env` de `cloudflare:test` e `AMBIENTE: "dev"`):
- sem identidade, 401 `sem_identidade`;
- e-mail não cadastrado, 403 `sem_acesso`;
- pessoa ativa, 200 com `{ nome, email, cargo }`;
- pessoa desativada, 403 `sem_acesso`;
- `DIRETOR_INICIAL = "marcelo@mectria.com"` com a tabela vazia, e login com `X-Dev-Email: Marcelo@MecTRIA.com`, dá 200, cargo `diretor`, e a pessoa fica gravada;
- `DIRETOR_INICIAL` já com um diretor ativo cadastrado (outro e-mail), e login com o e-mail de `DIRETOR_INICIAL` não cadastrado, dá 403.

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/identidade.test.ts functions/api/eu.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementar** nas assinaturas acima. O middleware responde as falhas com `erro(...)` e, no sucesso, chama `context.next()`.

- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.

- [ ] **Step 5: Commit** `git commit -m "Identifica a pessoa pelo Cloudflare Access e cria o primeiro diretor"`

### Task 6: Permissões compartilhadas

**Files:**
- Create: `hub/compartilhado/permissoes.ts`, `hub/compartilhado/permissoes.test.ts`

**Interfaces:**
- Consumes: `Cargo` (Task 4); `NomeIcone` (Task 3).
- Produces:
  - `type Secao = "hoje" | "reunioes" | "followup" | "playbooks" | "apresentacoes" | "rotinas" | "time" | "briefings"`
  - `SECOES: { id: Secao; rotulo: string; caminho: string; icone: NomeIcone; fase: number }[]`, nesta ordem:
    - Hoje `/` fase 2
    - Reuniões `/reunioes` fase 3
    - Follow-up `/follow-up` fase 2
    - Playbooks `/playbooks` fase 3
    - Apresentações `/apresentacoes` fase 4
    - Rotinas `/rotinas` fase 2
    - Time `/time` fase 1
    - Briefings `/briefings` fase 6
  - `podeVer(cargo: Cargo, secao: Secao): boolean`
  - `secoesDoCargo(cargo: Cargo): Secao[]` (na ordem de `SECOES`)
  - `podeGerenciarPessoas(cargo: Cargo): boolean` (só `diretor`)

Matriz (spec, seções 4 e 5):

| Seção | hunter | closer | diretor | projetos |
|---|---|---|---|---|
| hoje | sim | sim | sim | sim |
| reunioes | | sim | sim | |
| followup | | sim | sim | |
| playbooks | sim | sim | sim | |
| apresentacoes | | sim | sim | |
| rotinas | sim | sim | sim | |
| time | | | sim | |
| briefings | | | sim | sim |

- [ ] **Step 1: Escrever o teste que falha**

```ts
test("seções de cada cargo", () => {
  expect(secoesDoCargo("hunter")).toEqual(["hoje", "playbooks", "rotinas"]);
  expect(secoesDoCargo("closer")).toEqual(["hoje", "reunioes", "followup", "playbooks", "apresentacoes", "rotinas"]);
  expect(secoesDoCargo("diretor")).toEqual(["hoje", "reunioes", "followup", "playbooks", "apresentacoes", "rotinas", "time", "briefings"]);
  expect(secoesDoCargo("projetos")).toEqual(["hoje", "briefings"]);
});
test("só o diretor gerencia pessoas", () => {
  expect(CARGOS.filter(podeGerenciarPessoas)).toEqual(["diretor"]);
});
```

- [ ] **Step 2: Rodar** `cd hub && npx vitest run compartilhado/permissoes.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar** com a matriz acima. `NomeIcone` vem de `compartilhado/icones.ts` (Task 3).
- [ ] **Step 4: Rodar** o mesmo comando. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Define as seções e as permissões de cada cargo"`

### Task 7: Esqueleto do app

**Files:**
- Create: `hub/src/api/cliente.ts`, `hub/src/api/cliente.test.ts`, `hub/src/sessao/useEu.ts`, `hub/src/shell/{Layout,BarraLateral,BarraDeBaixo,Topo,Perfil,SemAcesso,EmConstrucao}.tsx` (+ `.module.css`), `hub/src/shell/shell.test.tsx`, `hub/src/telas/Hoje.tsx`
- Modify: `hub/src/App.tsx` (rotas), `hub/src/App.test.tsx`

**Interfaces:**
- Consumes: `secoesDoCargo`, `podeVer`, `SECOES` (Task 6); `ROTULO_CARGO` (Task 4); `ChaveTema` (Task 2); componentes (Task 3).
- Produces:
  - `api<T>(caminho: string, init?: RequestInit): Promise<T>`: lança `ErroApi { status: number; codigo: string; mensagem: string }` e, em 403 `sem_acesso`, dispara o evento `hub:sem-acesso` em `window`.
  - `useEu(): { estado: "carregando" } | { estado: "ok"; eu: Eu } | { estado: "sem_acesso" } | { estado: "erro"; mensagem: string }`, com `type Eu = { id: number; nome: string; email: string; cargo: Cargo }`. Passa para `sem_acesso` também quando recebe o evento `hub:sem-acesso`.
  - Rotas: uma por item de `SECOES`, mais `/vitrine` (só com `import.meta.env.DEV`). A seção fora de `secoesDoCargo` mostra `<SemAcesso />`; a seção de fase > 1 mostra `<EmConstrucao secao fase />`; Hoje mostra a saudação.

Textos:
- `SemAcesso`: "Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA."
- `EmConstrucao`: "{rótulo} chega na fase {fase}."
- `Hoje`: "Bom dia", "Boa tarde" ou "Boa noite" (antes de 12h, antes de 18h, depois) + ", {primeiro nome}" e a data por extenso ("Segunda, 2 de novembro").
- Desktop: barra lateral de ícones com o rótulo ao passar o mouse (`aria-label` em cada link), topo com o botão da busca ("Buscar · Ctrl K") e o perfil (nome, cargo, `ChaveTema`, "Sair" para `/cdn-cgi/access/logout`).
- Até 760 px: barra embaixo com até 4 seções e "Mais", que abre a lista das outras.

- [ ] **Step 1: Escrever os testes que falham**

`cliente.test.ts`: uma resposta 403 `{ erro: "sem_acesso" }` faz `api()` lançar `ErroApi` com `codigo "sem_acesso"` e dispara `hub:sem-acesso`; uma resposta 200 devolve o JSON.

`shell.test.tsx` (com `fetch` falso para `/api/eu`):
- hunter vê os links Hoje, Playbooks e Rotinas, e **não** vê Time;
- diretor vê os 8;
- hunter abrindo `/time` vê "Seu e-mail não tem acesso ao hub";
- `/api/eu` respondendo 403 mostra "Seu e-mail não tem acesso ao hub. Fale com o diretor comercial da MecTRIA.";
- **um 403 `sem_acesso` em outra chamada, depois de logado, troca a tela para a mensagem de sem acesso**;
- às 14h, "Boa tarde, Vinícius" para `nome: "Vinícius Miguel"`.

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/api src/shell src/App.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar** nas interfaces acima, com `createBrowserRouter` e `RouterProvider` de `react-router`.
- [ ] **Step 4: Rodar** o mesmo comando e `npm run typecheck`. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Monta o esqueleto do hub com a navegação de cada cargo"`

### Task 8: Busca Ctrl K

**Files:**
- Create: `hub/src/busca/buscar.ts`, `hub/src/busca/buscar.test.ts`, `hub/src/busca/fontes.ts`, `hub/src/busca/Busca.tsx`, `hub/src/busca/Busca.module.css`, `hub/src/busca/Busca.test.tsx`
- Modify: `hub/src/shell/Layout.tsx` (monta `<Busca />` e o atalho)

**Interfaces:**
- Consumes: `normalizar` (Task 4); `secoesDoCargo`, `SECOES` (Task 6); `aplicarTema`, `salvarEscolhaTema` (Task 2).
- Produces:
  - `interface ItemDeBusca { id: string; titulo: string; grupo: string; palavras?: string[]; executar: () => void }`
  - `type FonteDeBusca = (ctx: { eu: Eu; navegar: (caminho: string) => void }) => ItemDeBusca[]`
  - `buscar(consulta: string, itens: ItemDeBusca[], limite = 8): ItemDeBusca[]`
  - `FONTES: FonteDeBusca[]`, com três fontes nesta fase:
    - navegação: "Ir para {rótulo}" para cada seção permitida;
    - tema: "Usar tema do sistema", "Usar tema escuro", "Usar tema claro";
    - conta: "Sair".

    As fases seguintes acrescentam fontes (objeções, clientes, roteiros) sem mudar `Busca.tsx`.
- Regra de `buscar`:
  - Cada palavra da consulta normalizada precisa estar em `normalizar(titulo + " " + palavras)`.
  - Pontua 3 se o título começa com a consulta, 2 se alguma palavra do título começa com ela, 1 nos outros casos.
  - Empata pela ordem original.
  - Consulta vazia devolve os primeiros `limite` itens.

- [ ] **Step 1: Escrever os testes que falham**

`buscar.test.ts`:

```ts
const itens = ["Ir para Reuniões", "Ir para Follow-up", "Usar tema escuro", "Objeções frequentes"].map((titulo, i) => ({ id: String(i), titulo, grupo: "g", executar: () => {} }));
test("ignora acento e caixa", () => {
  expect(buscar("objecao", itens).map((i) => i.titulo)).toEqual(["Objeções frequentes"]);
  expect(buscar("REUNIOES", itens).map((i) => i.titulo)).toEqual(["Ir para Reuniões"]);
});
test("todas as palavras precisam aparecer", () => {
  expect(buscar("tema escuro", itens).map((i) => i.titulo)).toEqual(["Usar tema escuro"]);
  expect(buscar("tema claro", itens)).toEqual([]);
});
test("começo do título vem primeiro", () => {
  const r = buscar("ir", [...itens, { id: "x", titulo: "Mandar briefing", grupo: "g", palavras: ["ir"], executar: () => {} }]);
  expect(r[0].titulo).toBe("Ir para Reuniões");
});
test("consulta vazia sugere os primeiros", () => {
  expect(buscar("", itens, 2)).toHaveLength(2);
});
```

`Busca.test.tsx`:
- `Ctrl+K` abre a busca com o foco no campo;
- digitar "follow" e apertar Enter navega para `/follow-up`;
- as setas mudam o item selecionado (`aria-selected`);
- `Esc` fecha;
- um hunter não vê "Ir para Time".

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/busca`. Expected: FAIL.
- [ ] **Step 3: Implementar** nas interfaces acima. `Busca.tsx` é um `role="dialog"` com `aria-modal`, sobre um véu com `backdrop-filter: blur(6px)`, e entra com 240 ms de duração.
- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a busca geral com Ctrl K"`

### Task 9: Time: gestão de pessoas

**Files:**
- Create: `hub/functions/api/pessoas/index.ts`, `hub/functions/api/pessoas/[id].ts`, `hub/functions/api/pessoas/pessoas.api.test.ts`, `hub/src/telas/Time.tsx`, `hub/src/telas/Time.module.css`, `hub/src/telas/Time.test.tsx`
- Modify: `hub/src/App.tsx` (rota `/time` mostra `Time`, não `EmConstrucao`)

**Interfaces:**
- Consumes: `listar`, `criar`, `atualizar`, `buscarPorId`, `contarDiretoresAtivos` (Task 4); `json`, `erro` (Task 5); `podeGerenciarPessoas` (Task 6); `api` (Task 7); componentes (Task 3).
- Produces:
  - `GET /api/pessoas` devolve `Pessoa[]`.
  - `POST /api/pessoas`, com corpo `{ nome, email, cargo }`, devolve 201 com a `Pessoa`.
  - `PATCH /api/pessoas/:id`, com corpo parcial `{ nome?, cargo?, ativo? }`, devolve a `Pessoa`.
  - Os três endpoints recusam com 403 `sem_acesso` quem não é diretor.

Validação:
- nome com 2 a 80 caracteres depois do trim;
- e-mail no formato `^[^@\s]+@[^@\s]+\.[^@\s]+$` depois de `normalizarEmail`;
- cargo em `CARGOS`.

Erros:
- validação: 400 `invalido`, com a mensagem do campo;
- e-mail repetido: 409 `conflito`, "Já existe uma pessoa com esse e-mail.";
- desativar a si mesmo: 409 `conflito`, "Você não pode desativar o seu próprio acesso.";
- rebaixar ou desativar o último diretor ativo: 409 `ultimo_diretor`, "O time precisa de pelo menos um diretor comercial ativo.";
- id inexistente: 404.

Tela Time:
- Lista: nome, e-mail, `ROTULO_CARGO`, ativo.
- Formulário "Adicionar pessoa": nome, e-mail e cargo, com o botão primário "Adicionar".
- Em cada linha: trocar o cargo (select) e "Desativar" ou "Reativar".
- Os erros da API aparecem junto do formulário.
- Os sucessos aparecem com `avisar`.

- [ ] **Step 1: Escrever os testes que falham**

`pessoas.api.test.ts` (com um diretor `dir@mectria.com` e um closer `clo@mectria.com` semeados):
- closer chamando `GET /api/pessoas` recebe 403;
- diretor cria `{ nome: "Rita", email: " Rita@MecTRIA.com ", cargo: "projetos" }` e recebe 201 com `email "rita@mectria.com"`;
- repetir com `"RITA@mectria.com"` dá 409 `conflito`;
- `cargo: "gerente"` dá 400 `invalido`;
- **o diretor desativando a si mesmo recebe 409 `conflito` e continua ativo**;
- **último diretor:** com dois diretores (A e B), A desativa B e recebe 200. Depois, A tenta mudar o próprio cargo para closer e recebe 409 `ultimo_diretor`; A continua diretor;
- `PATCH /api/pessoas/999` dá 404.

`Time.test.tsx` (com `fetch` falso):
- a lista mostra "Diretor comercial" no cargo do diretor;
- enviar o formulário com o e-mail repetido mostra "Já existe uma pessoa com esse e-mail.";
- clicar em "Desativar" chama o PATCH com `{ ativo: false }`.

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- functions/api/pessoas && npx vitest run src/telas/Time.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar** nas interfaces acima.
- [ ] **Step 4: Rodar** os mesmos comandos. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a gestão de pessoas e cargos para o diretor"`

### Task 10: Teste ponta a ponta, implantação e documentação

**Files:**
- Create: `hub/e2e/playwright.config.ts`, `hub/e2e/semente.sql`, `hub/e2e/fase1.spec.ts`, `hub/README.md`, `hub/IMPLANTACAO.md`
- Modify: `hub/package.json` (scripts `e2e:preparar` e `e2e`), `.github/workflows/hub.yml` (roda o e2e), `README.md` da raiz (linha do `hub/` no índice)

**Interfaces:**
- Consumes: tudo das Tasks 1 a 9.
- Produces:
  - `npm run e2e:preparar` faz `wrangler d1 migrations apply hub-mectria --local` e `wrangler d1 execute hub-mectria --local --file e2e/semente.sql`.
  - `npm run e2e` usa `playwright test -c e2e/playwright.config.ts`, com `webServer`: `npm run build && wrangler pages dev dist --port 8788`.
  - `semente.sql` cria `dir@mectria.com` (diretor), `clo@mectria.com` (closer), `hun@mectria.com` (hunter), `pro@mectria.com` (projetos) e `ex@mectria.com` (closer inativo). São e-mails fictícios.
  - Cada teste usa `extraHTTPHeaders: { "X-Dev-Email": … }`.

- [ ] **Step 1: Escrever os testes** em `fase1.spec.ts`:
  - **diretor:** vê as 8 seções; abre Time; adiciona "Ana Teste" (`ana@mectria.com`, closer) e ela aparece na lista;
  - **hunter:** vê Hoje, Playbooks e Rotinas; abrindo `/time` direto, vê a mensagem de sem acesso;
  - **inativo:** `ex@mectria.com` vê "Seu e-mail não tem acesso ao hub";
  - **tema:** escolher "Escuro" no perfil deixa `data-theme="dark"` e isso continua depois de recarregar;
  - **busca:** `Ctrl+K`, digitar "playbooks" e Enter vai para `/playbooks`;
  - **celular (390 × 844):** a barra de baixo aparece, a lateral some, e `document.documentElement.scrollWidth` é igual a 390 em todas as seções do diretor;
  - **reduzir movimento** (`reducedMotion: "reduce"`): a busca abre sem transição (o `transition-duration` computado do véu é `0s`).
- [ ] **Step 2: Rodar** `cd hub && npm run e2e:preparar && npm run e2e`. Expected: todos passam (se algum falhar, corrigir na Task de origem e repetir).
- [ ] **Step 3: Escrever `IMPLANTACAO.md`**, o passo a passo para a conta da MecTRIA:
  1. Criar a conta Cloudflare com o e-mail institucional.
  2. `wrangler d1 create hub-mectria` e trocar o `database_id` no `wrangler.toml`.
  3. `wrangler d1 migrations apply hub-mectria --remote`.
  4. Criar o projeto Pages ligado ao repositório da MecTRIA, com a pasta `hub`, o build `npm ci && npm run build` e a saída `dist`.
  5. Variáveis de produção: `AMBIENTE=producao`, `ACCESS_EQUIPE`, `ACCESS_AUD`, `DIRETOR_INICIAL`.
  6. Zero Trust:
     - criar a equipe e o login por código no e-mail (one-time PIN);
     - criar uma aplicação self-hosted para `hub.mectria.com` e para o domínio `*.pages.dev`;
     - criar a política que permite e-mails terminados em `@mectria.com` e os e-mails avulsos cadastrados no Time.
  7. Domínio próprio `hub.mectria.com` no Pages.
  8. Primeiro acesso do diretor inicial.
  9. Convidar a Triângulo como membro e removê-la em 05/02/2027.

  Junto, o resumo de custos da spec (seção 3) e as duas confirmações pendentes: Durable Objects no plano grátis e quantos dias o D1 volta no tempo.
- [ ] **Step 4: Escrever `hub/README.md`**: como rodar (`npm install`, `cp .dev.vars.exemplo .dev.vars`, `npm run e2e:preparar`, `npx wrangler pages dev` depois de `npm run build`, ou `npm run dev` só para a interface), como testar, onde fica cada coisa (o mapa de arquivos deste plano) e a regra de que o conteúdo das fases seguintes entra em arquivos de dados. Acrescentar o `hub/` no índice do `README.md` da raiz e marcar o `hub-comercial/` como versão 0.2, a ser substituída.
- [ ] **Step 5: Ligar o e2e no workflow** (`npx playwright install --with-deps chromium` só no CI) e rodar tudo localmente: `cd hub && npm run typecheck && npm test && npm run e2e`. Expected: tudo passa.
- [ ] **Step 6: Commit** `git commit -m "Testa a fase 1 de ponta a ponta e documenta a implantação"`

---

## Entrega da fase 1

Ao final: `npm test` e `npm run e2e` passam e o CI está verde. Tiro capturas do Hoje, do Time, da busca e da vitrine nos dois temas, no notebook e no celular, e mostro ao Lucas. A implantação real depende do e-mail institucional e do acesso ao DNS (spec, seção 14). Até lá, o hub roda localmente e no CI.
