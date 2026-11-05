# Hub comercial · Fase 2 (Rotina e follow-up) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o Hoje de cada cargo, a seção Rotinas, o Follow-up com atraso e o modo foco dos toques, sobre a base da fase 1, e fechar os sete pontos menores adiados da revisão da fase 1.

**Architecture:** Mesma estrutura da fase 1 (`hub/`). Regras puras de datas, cadência e rotina ficam em `hub/compartilhado/` e servem aos dois lados; o conteúdo (cadência, feriados, serviços, rotinas fixas, roteiro de cold call) fica em `hub/compartilhado/dados/`, migrado da versão 0.2. O servidor ganha as tabelas de oportunidades, reuniões, propostas, toques, rotinas, ligações e histórico (migração `0002`), com a lógica em `hub/servidor/` e as rotas em `hub/functions/api/`. A interface ganha o componente de modo foco e as telas Follow-up, Rotinas e o Hoje de cada cargo.

**Tech Stack:** a mesma da fase 1, sem dependências novas.

**Spec:** `docs/15-hub-template.md` (seções 4, 5, 7, 8, 9, 10 e 11, fase 2). Registro da fase 1: `docs/superpowers/registros/2026-11-02-hub-fase-1-base.md`.

## Decisões deste plano (confirmadas pelo Lucas em 02/11/2026)

1. **Ponte até a fase 4.** O fechamento obrigatório da reunião de proposta, que cria os toques, só chega na fase 4. Até lá, o closer usa "Registrar proposta apresentada" no Follow-up (empresa ou oportunidade existente, serviço, valor, data em que apresentou, data combinada para a decisão e quem decide). Isso cria a proposta e os toques da cadência. Na fase 4, o fechamento da reunião de proposta passa a criar os toques sozinho (pedido do Lucas ao confirmar); o botão continua para propostas apresentadas fora do hub.
2. **Bloco de ligações do hunter.** A lista de prospecção continua fora do hub. O hub só conta as ligações do dia por resultado (não atendeu, atendeu, marcou diagnóstica), numa tabela `ligacoes` que não está na seção 8 da spec. "Tentativas pendentes" é o número de "não atendeu" do dia, que alimenta o item "Mandar WhatsApp nas tentativas sem resposta".
3. **Meta diária de ligações:** de 1 a 2 por dia, no máximo (Lucas, 02/11). O item da rotina fica cumprido com 1 ligação; o medidor vai até 2, a meta do dia. Os valores ficam no arquivo de dados.
4. **Reuniões nesta fase:** só agenda (oportunidade, tipo, data e hora, formato, situação). "Iniciar reunião" aparece desligado com "chega na fase 3".
5. **Números do diretor nesta fase:** rotina de hoje por pessoa, follow-ups atrasados por pessoa e reuniões da semana. Conversão, valor vendido e o resto dos números ficam para a fase 6. No Hoje do closer, "propostas" e "fechadas" do mês entram agora; "pactos por reunião" mostra "—" até a fase 4.
6. **Busca:** clientes, roteiros e objeções entram como fontes na fase 3, junto com os Playbooks.

## Global Constraints

- Tudo em português do Brasil: interface, mensagens de erro, nomes de arquivos e funções, commits. Escrever sempre **MecTRIA**.
- Versões fixas da fase 1, sem dependência nova. Playwright usa o Chromium já instalado (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); nunca rodar `playwright install` neste ambiente.
- Datas sempre no fuso de São Paulo (`America/Sao_Paulo`, UTC−3, sem horário de verão). Dia como texto `AAAA-MM-DD`; data e hora de reunião como `AAAA-MM-DDTHH:MM`, hora local.
- Dinheiro em centavos (inteiro) no banco e na API; na tela, `R$ 12.500,00`.
- Cadência (dias úteis contados da apresentação, D0 = dia da reunião): D0 WhatsApp + e-mail; D1 WhatsApp; D3 Ligação; D5 WhatsApp; D8 Ligação; D12 E-mail; D15 WhatsApp. Nutrição: 45 dias. Textos dos modelos, motivos de perda e regras: os de `hub-comercial/js/dados/fup.js`, sem mudar uma palavra.
- Feriados (não contam como dia útil): 2026-10-12, 2026-11-02, 2026-11-20, 2026-12-25, 2027-01-01, 2027-02-08, 2027-02-09, 2027-03-26, 2027-04-21, 2027-05-01, 2027-05-27, 2027-09-07, 2027-10-12, 2027-11-02, 2027-11-15, 2027-11-20, 2027-12-25.
- Situações da oportunidade: `diagnostica_marcada`, `proposta_marcada`, `em_followup`, `ganha`, `perdida`, `nutricao`. Atrasado = toque com data prevista antes de hoje, ainda não feito, de proposta cuja oportunidade está `em_followup`.
- Rotinas fixas (spec, seção 5); ligações: mínimo 1 e meta 2 por dia (Lucas, 02/11):
  - hunter: "Fazer o bloco de ligações", "Mandar WhatsApp nas tentativas sem resposta", "Registrar as diagnósticas marcadas";
  - closer: "Confirmar as reuniões do dia", "Escrever a hipótese de dor das diagnósticas", "Mandar os briefings para Projetos no mesmo dia", "Registrar o resultado de cada reunião". Os toques do dia entram como itens gerados, um por toque.
- Permissões (spec, seção 4), sempre conferidas no servidor:
  - hunter cria diagnóstica e vê só as oportunidades que marcou;
  - closer vê todas, assume a de um colega e registra propostas, toques e resultados das suas;
  - diretor faz tudo;
  - projetos não usa nada desta fase (403 `sem_permissao`).
- Modo foco: o bloco cresce a partir do cartão clicado em 420 ms com a curva `cubic-bezier(.2, .8, .2, 1)`; o resto recua desfocado; um só botão principal; "Sair do foco" no canto; Esc sai. Com "reduzir movimento", sem animação.
- Um botão vermelho (`Botao` `primario`) por tela, contando o que está em foco. Texto vermelho só sobre fundo e painel.
- Nada é apagado: oportunidade e proposta encerram por situação; toque feito não volta a pendente.
- Nenhum segredo, e-mail real de membro da MecTRIA nem credencial da Triângulo no repositório.

## Review Focus

- **Fim de semana e feriado na cadência:** proposta apresentada na sexta 13/11/2026 (feriado em 20/11) tem D1 em 16/11, D5 em 23/11, D8 em 26/11, D12 em 02/12 e D15 em 07/12. Teste na Task 2.
- **Virada do dia no fuso:** às 23h30 de 02/11 em São Paulo (02h30 UTC de 03/11), "hoje" ainda é 02/11, e um toque previsto para 03/11 não aparece como atrasado. Testes nas Tasks 2 e 4.
- **Proposta encerrada:** depois de ganha, perdida ou nutrição, os toques que sobraram não aparecem como atrasados, nem na rotina, nem no resumo do diretor. Testes nas Tasks 4 e 5.
- **Toque registrado duas vezes** (duplo clique ou duas abas): o segundo registro dá 409 `conflito` e não muda o horário do primeiro. Teste na Task 4.
- **Valor digitado do jeito brasileiro** ("12.500,00", "12500", "R$ 12.500"): vira 1250000 centavos; "abc" ou negativo dá 400. Teste na Task 6.

---

## Mapa de arquivos

```
hub/
  migrations/0002_rotina_followup.sql      oportunidades, reunioes, propostas, toques, rotinas, ligacoes, historico
  compartilhado/
    datas.ts                               hoje em São Paulo, dias úteis, formatos de data e de dinheiro
    cadencia.ts                            datas da cadência e preenchimento dos modelos
    oportunidade.ts                        tipos e rótulos de oportunidade, reunião, proposta, toque, rotina
    dados/feriados.ts, cadencia.ts, servicos.ts, rotinas.ts, cold-call.ts   conteúdo
  servidor/
    oportunidades.ts                       diagnóstica marcada, listar, assumir, mudar situação (+ histórico)
    followup.ts                            proposta, toques, lista do follow-up, resultado
    rotina.ts                              ligações, rotina do dia, marcar item, histórico, resumo do time
    validacao.ts                           (+ regras novas)
    rotas/*.test.ts                        testes das rotas novas
  functions/api/
    closers.ts                             GET   quem pode ser closer
    oportunidades/index.ts, [id].ts        GET, POST · PATCH (assumir)
    oportunidades/[id]/resultado.ts        POST  ganha, perdida ou nutrição
    propostas.ts                           POST  registrar proposta apresentada
    followup.ts                            GET   propostas na rua com o próximo toque
    toques/[id].ts                         PATCH toque feito
    ligacoes.ts                            GET, POST
    rotina/index.ts, [chave].ts, historico.ts   GET · PUT · GET
    time/resumo.ts                         GET   (diretor)
  src/
    componentes/Foco.tsx, Medidor.tsx, NumeroRolante.tsx (+ .module.css)
    telas/FollowUp.tsx, followup/{ToqueEmFoco,NovaProposta,Resultado}.tsx
    telas/Rotinas.tsx
    telas/hoje/{HojeHunter,BlocoDeLigacoes,MarcarDiagnostica,HojeCloser,HojeDiretor}.tsx
  e2e/fase2.spec.ts, e2e/semente.sql (+ dados da fase 2)
```

---

### Task 1: Acertos da revisão da fase 1

**Files:**
- Modify: `hub/src/tema/tema.ts`, `hub/src/tema/tema.test.ts`, `hub/functions/api/pessoas/[id].ts`, `hub/servidor/pessoas.ts`, `hub/servidor/pessoas.test.ts`, `hub/servidor/rotas/pessoas.test.ts`, `hub/servidor/identidade.ts`, `hub/servidor/identidade.test.ts`, `hub/src/busca/Busca.tsx`, `hub/src/busca/Busca.test.tsx`, `.github/workflows/hub.yml`, `hub/package.json`

**Interfaces:**
- Produces: `atualizarProtegendoDiretor(db, id, mudancas): Promise<Pessoa | null>` em `servidor/pessoas.ts` (null quando a mudança deixaria o time sem diretor ativo); `lerEscolhaTema` passa a lembrar a última escolha em memória quando o armazenamento falha.

- [ ] **Step 1: Escrever os testes que falham**
  - `tema.test.ts` · "sem armazenamento, lembra a escolha enquanto a aba está aberta": com um `Storage` que lança erro, `salvarEscolhaTema("escuro", quebrado)` e depois `lerEscolhaTema(quebrado)` dá `"escuro"`.
  - `pessoas.test.ts` · "listar ordena nomes com acento como o português": nomes "Zeca", "Álvaro", "Érica" e "Bruno" saem `["Álvaro", "Bruno", "Érica", "Zeca"]`.
  - `pessoas.test.ts` · "atualizarProtegendoDiretor recusa rebaixar o último diretor e grava quando há outro": com um diretor só, rebaixar dá `null` e ele continua diretor; com dois, dá a pessoa com `cargo: "closer"`.
  - `identidade.test.ts` · "JWT HS256 é recusado": um token HS256 assinado com um segredo qualquer, com issuer, audience e email certos, devolve `null`.
  - `Busca.test.tsx` · "clicar numa área vazia da caixa mantém o foco no campo": abrir a busca, digitar "xyzw", clicar no texto "Nada encontrado…", e o combobox continua com o foco.

- [ ] **Step 2: Rodar** `cd hub && npm test`. Expected: os cinco novos falham (o do JWT HS256 pode passar já hoje; se passar, anotar no ledger e manter como teste de regressão).

- [ ] **Step 3: Implementar**
  - `tema.ts`: uma variável de módulo com a última escolha salva; `lerEscolhaTema` usa ela quando o armazenamento lança erro.
  - `pessoas.ts`: `listar` ordena no JS com `Intl.Collator("pt-BR", { sensitivity: "base" })` (ativas primeiro).
  - `atualizarProtegendoDiretor`: um só `UPDATE … WHERE id = ? AND (<não tira diretor> OR (SELECT COUNT(*) FROM pessoas WHERE cargo = 'diretor' AND ativo = 1 AND id <> ?) >= 1) RETURNING *`. O PATCH usa ele no lugar de contar e depois gravar.
  - `identidade.ts`: `jwtVerify` com `algorithms: ["RS256"]` e `requiredClaims: ["email"]`.
  - `Busca.tsx`: `onMouseDown` com `preventDefault` na caixa do diálogo, fora do campo.
  - `hub.yml`: `permissions: { contents: read }`.
  - `package.json`: tirar `--passWithNoTests` de `test:api`.

- [ ] **Step 4: Rodar** `cd hub && npm run typecheck && npm test`. Expected: tudo passa.

- [ ] **Step 5: Commit** `git commit -m "Fecha os pontos menores da revisão da fase 1"`

---

### Task 2: Datas, cadência e conteúdo

**Files:**
- Create: `hub/compartilhado/datas.ts`, `hub/compartilhado/datas.test.ts`, `hub/compartilhado/cadencia.ts`, `hub/compartilhado/cadencia.test.ts`, `hub/compartilhado/dados/{feriados,cadencia,servicos,rotinas,cold-call}.ts`

**Interfaces:**
- Produces:
  - `hojeEmSaoPaulo(agora?: Date): string`; `ehDiaUtil(dia: string, feriados?: readonly string[]): boolean`; `somarDiasUteis(dia: string, n: number, feriados?: readonly string[]): string`; `instanteLocal(dataHora: string): Date` (lê `AAAA-MM-DDTHH:MM` como UTC−3); `formatarDia(dia: string): string` ("Seg, 9/11"); `formatarReais(centavos: number): string` ("R$ 12.500,00"); `lerReais(texto: string): number | null` (centavos). O padrão de `feriados` é `FERIADOS`.
  - `type CodigoToque = "D0" | "D1" | "D3" | "D5" | "D8" | "D12" | "D15"`; `datasDaCadencia(apresentadaEm: string, feriados?: readonly string[]): { codigo: CodigoToque; previstoPara: string }[]`; `preencherModelo(modelo: string, valores: Record<string, string | undefined>): string`.
  - Dados:
    - `FERIADOS: readonly string[]`;
    - `CADENCIA: { codigo: CodigoToque; dia: number; canal: string; objetivo: string; modelo: string; dica?: string }[]`;
    - `NUTRICAO: { dias: 45; modelo: string }`, `MOTIVOS_PERDA: readonly string[]`, `REGRAS_FOLLOWUP: readonly string[]`;
    - `VARIAVEIS: Record<string, string>` (rótulo de cada `{chave}`: contato → "nome do contato", servico → "serviço", dor → "dor do cliente", data_decisao → "data da decisão", vendedor → "seu nome", decisores → "quem decide", validade → "validade da proposta", link_conteudo → "link do conteúdo");
    - `SERVICOS: { id: string; nome: string }[]` (os 12 de `servicos.js`, mesmos ids e nomes);
    - `MINIMO_LIGACOES_DIA = 1`, `META_LIGACOES_DIA = 2`, `ROTINA_FIXA: Record<Cargo, { chave: string; titulo: string }[]>` (chaves `ligacoes`, `whatsapp-tentativas`, `registrar-diagnosticas`, `confirmar-reunioes`, `hipotese-de-dor`, `briefings`, `resultado-reunioes`; diretor e projetos sem itens);
    - `ROTEIRO_COLD_CALL: { titulo: string; fala: string; dica?: string }[]` (os 5 passos de `cold-call.js`).

- [ ] **Step 1: Escrever os testes que falham**

`datas.test.ts`:
```ts
test("hoje é o dia de São Paulo", () => {
  expect(hojeEmSaoPaulo(new Date("2026-11-03T02:30:00Z"))).toBe("2026-11-02");
  expect(hojeEmSaoPaulo(new Date("2026-11-03T03:00:00Z"))).toBe("2026-11-03");
});
test("dia útil pula fim de semana e feriado", () => {
  expect(ehDiaUtil("2026-11-02")).toBe(false); // Finados
  expect(ehDiaUtil("2026-11-03")).toBe(true);
  expect(ehDiaUtil("2026-11-07")).toBe(false); // sábado
  expect(somarDiasUteis("2026-11-13", 5)).toBe("2026-11-23"); // pula 20/11
  expect(somarDiasUteis("2026-11-13", 0)).toBe("2026-11-13");
});
test("instante local da reunião é UTC−3", () => {
  expect(instanteLocal("2026-11-09T14:00").toISOString()).toBe("2026-11-09T17:00:00.000Z");
});
test("dinheiro do jeito brasileiro", () => {
  expect(lerReais("12.500,00")).toBe(1250000);
  expect(lerReais("12500")).toBe(1250000);
  expect(lerReais("R$ 12.500")).toBe(1250000);
  expect(lerReais("1.234,5")).toBe(123450);
  expect(lerReais("abc")).toBeNull();
  expect(lerReais("-10")).toBeNull();
  expect(formatarReais(1250000)).toBe("R$ 12.500,00");
  expect(formatarDia("2026-11-09")).toBe("Seg, 9/11");
});
```

`cadencia.test.ts`:
```ts
test("datas da cadência a partir de uma sexta antes de feriado", () => {
  expect(datasDaCadencia("2026-11-13")).toEqual([
    { codigo: "D0", previstoPara: "2026-11-13" },
    { codigo: "D1", previstoPara: "2026-11-16" },
    { codigo: "D3", previstoPara: "2026-11-18" },
    { codigo: "D5", previstoPara: "2026-11-23" },
    { codigo: "D8", previstoPara: "2026-11-26" },
    { codigo: "D12", previstoPara: "2026-12-02" },
    { codigo: "D15", previstoPara: "2026-12-07" },
  ]);
});
test("o que falta no modelo vira colchete com o rótulo", () => {
  expect(preencherModelo("Oi, {contato}! {servico} até {data_decisao}.", { contato: "Ana", servico: "Climatização" }))
    .toBe("Oi, Ana! Climatização até [data da decisão].");
});
test("os modelos da cadência são os da versão 0.2", () => {
  expect(CADENCIA.map((t) => [t.codigo, t.canal])).toEqual([
    ["D0", "WhatsApp + e-mail"], ["D1", "WhatsApp"], ["D3", "Ligação"], ["D5", "WhatsApp"],
    ["D8", "Ligação"], ["D12", "E-mail"], ["D15", "WhatsApp"],
  ]);
  expect(SERVICOS).toHaveLength(12);
  expect(MOTIVOS_PERDA).toContain("Escopo (queria fabricação ou instalação)");
});
```

- [ ] **Step 2: Rodar** `cd hub && npx vitest run compartilhado`. Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar.**
  - `hojeEmSaoPaulo`: usar `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })`.
  - Contas de dia: em UTC ao meio-dia, para não escorregar de dia.
  - Conteúdo: copiado de `hub-comercial/js/dados/fup.js`, `servicos.js` e `cold-call.js`. Nos modelos, `{chave}` fica como está.

- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.

- [ ] **Step 5: Commit** `git commit -m "Adiciona as regras de datas e dias úteis, a cadência e o conteúdo da fase 2"`

---

### Task 3: Oportunidades e reuniões no banco

**Files:**
- Create: `hub/migrations/0002_rotina_followup.sql`, `hub/compartilhado/oportunidade.ts`, `hub/servidor/oportunidades.ts`, `hub/servidor/oportunidades.test.ts`

**Interfaces:**
- Produces:
  - Em `compartilhado/oportunidade.ts`:
    - `type Situacao` e `SITUACOES`; `ROTULO_SITUACAO` = { diagnostica_marcada: "Diagnóstica marcada", proposta_marcada: "Proposta marcada", em_followup: "Em follow-up", ganha: "Ganha", perdida: "Perdida", nutricao: "Nutrição" };
    - `interface Oportunidade { id; empresa; contato; telefone; email; cidade; segmento; origem; servico; hunterId: number | null; closerId: number | null; closerNome: string | null; situacao: Situacao; motivoPerda: string | null; valorFechado: number | null; criadoEm; atualizadoEm }`;
    - `interface Reuniao { id; oportunidadeId; empresa; tipo: "diagnostica" | "proposta"; dataHora: string; formato: "online" | "presencial"; situacao: "marcada" | "em_andamento" | "concluida" | "cancelada"; closerId: number | null }`.
  - Em `servidor/oportunidades.ts`:
    - `criarDiagnostica(db, dados: NovaDiagnostica, autor: Pessoa): Promise<{ oportunidade: Oportunidade; reuniao: Reuniao }>`, com `NovaDiagnostica = { empresa; contato; telefone; email?; cidade?; segmento?; servico; closerId; dataHora; formato }`. Grava `hunterId = autor.id` quando o autor é hunter, `origem = "cold call"` e histórico `null → diagnostica_marcada`;
    - `listarOportunidades(db, quem: Pessoa): Promise<Oportunidade[]>` (hunter: só `hunter_id = quem.id`; os outros: todas). Ordem: atualizadas por último primeiro;
    - `buscarOportunidade(db, id)`;
    - `mudarSituacao(db, id, para: Situacao, autorId: number, extra?: { motivoPerda?: string; valorFechado?: number }): Promise<Oportunidade>`, que grava o histórico;
    - `assumir(db, id, closer: Pessoa): Promise<Oportunidade>`, que grava o histórico com detalhe "assumida por {nome}";
    - `listarReunioes(db, de: string, ate: string, closerId?: number): Promise<Reuniao[]>`.

Tabelas (todas com `criado_em`/`atualizado_em` como em `pessoas`):

```sql
CREATE TABLE oportunidades (id INTEGER PRIMARY KEY AUTOINCREMENT, empresa TEXT NOT NULL, contato TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', cidade TEXT NOT NULL DEFAULT '', segmento TEXT NOT NULL DEFAULT '',
  origem TEXT NOT NULL DEFAULT '', servico TEXT NOT NULL, hunter_id INTEGER REFERENCES pessoas(id), closer_id INTEGER REFERENCES pessoas(id),
  situacao TEXT NOT NULL CHECK (situacao IN ('diagnostica_marcada','proposta_marcada','em_followup','ganha','perdida','nutricao')),
  motivo_perda TEXT, valor_fechado INTEGER, ...);
CREATE TABLE reunioes (id, oportunidade_id NOT NULL REFERENCES oportunidades(id), tipo CHECK (tipo IN ('diagnostica','proposta')),
  data_hora TEXT NOT NULL, formato CHECK (formato IN ('online','presencial')),
  situacao TEXT NOT NULL DEFAULT 'marcada' CHECK (situacao IN ('marcada','em_andamento','concluida','cancelada')), ...);
CREATE TABLE propostas (id, oportunidade_id NOT NULL REFERENCES oportunidades(id), servico TEXT NOT NULL, valor INTEGER NOT NULL,
  apresentada_em TEXT NOT NULL, data_decisao TEXT, quem_decide TEXT NOT NULL DEFAULT '', dor TEXT NOT NULL DEFAULT '', validade TEXT, ...);
CREATE TABLE toques (id, proposta_id NOT NULL REFERENCES propostas(id), codigo TEXT NOT NULL, previsto_para TEXT NOT NULL,
  feito_em TEXT, canal TEXT, resultado TEXT, autor_id INTEGER REFERENCES pessoas(id), UNIQUE (proposta_id, codigo));
CREATE TABLE rotinas (id, pessoa_id NOT NULL REFERENCES pessoas(id), dia TEXT NOT NULL, chave TEXT NOT NULL, titulo TEXT NOT NULL,
  origem TEXT NOT NULL CHECK (origem IN ('fixo','gerado')), feito_em TEXT, UNIQUE (pessoa_id, dia, chave));
CREATE TABLE ligacoes (id, pessoa_id NOT NULL REFERENCES pessoas(id), dia TEXT NOT NULL,
  resultado TEXT NOT NULL CHECK (resultado IN ('nao_atendeu','atendeu','marcou')), criado_em ...);
CREATE TABLE historico (id, oportunidade_id NOT NULL REFERENCES oportunidades(id), de TEXT, para TEXT NOT NULL, detalhe TEXT,
  autor_id INTEGER REFERENCES pessoas(id), em TEXT NOT NULL DEFAULT (datetime('now')));
```
Índices: `toques(previsto_para)`, `reunioes(data_hora)`, `oportunidades(closer_id)`, `oportunidades(hunter_id)`, `ligacoes(pessoa_id, dia)`.

- [ ] **Step 1: Escrever os testes que falham** em `oportunidades.test.ts` (migrações aplicadas e tabelas limpas antes de cada teste; pessoas fictícias `hun@`, `clo@`, `clo2@` e `dir@mectria.com`):
  - "hunter marca diagnóstica e o histórico registra": `criarDiagnostica` como hunter cria a oportunidade `diagnostica_marcada` com `hunterId` do hunter, `closerId` informado e `origem "cold call"`, e uma reunião `diagnostica` `marcada` na data e hora dadas; o histórico tem uma linha `de null` para `diagnostica_marcada`.
  - "hunter só vê as que marcou": dois hunters, uma oportunidade de cada; `listarOportunidades(hunterA)` devolve só a dele; o closer vê as duas.
  - "assumir passa a oportunidade e registra quem assumiu": `assumir(id, clo2)` muda `closerId`, e o histórico tem o detalhe "assumida por Clara Closer 2".
  - "mudarSituacao para perdida guarda o motivo": `motivoPerda "Preço"`, histórico `em_followup → perdida`.
  - "reuniões da semana": `listarReunioes("2026-11-09", "2026-11-15")` traz só as daquele intervalo, ordenadas por `dataHora`.

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/oportunidades.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.** A conversão `snake_case` para `camelCase` fica num `deLinha` por tabela; `closerNome` vem de um JOIN com `pessoas`.
- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Cria as tabelas da fase 2 e o registro de oportunidades e reuniões"`

---

### Task 4: Propostas, toques e follow-up

**Files:**
- Create: `hub/servidor/followup.ts`, `hub/servidor/followup.test.ts`
- Modify: `hub/compartilhado/oportunidade.ts`

**Interfaces:**
- Consumes: `datasDaCadencia`, `hojeEmSaoPaulo` (Task 2); `mudarSituacao`, `criarDiagnostica` (Task 3).
- Produces:
  - Tipos `Proposta`, `Toque { id; propostaId; codigo: CodigoToque; previstoPara; feitoEm: string | null; canal: string | null; resultado: string | null }`, `ItemFollowup { oportunidade: Oportunidade; proposta: Proposta; proximo: Toque | null; atrasados: number; estado: "atrasado" | "hoje" | "em_dia" | "sem_toque" }`.
  - `registrarProposta(db, dados: NovaProposta, autor: Pessoa): Promise<{ proposta: Proposta; toques: Toque[] }>`, com `NovaProposta = { oportunidadeId?: number; empresa?: string; contato?: string; telefone?: string; servico: string; valor: number; apresentadaEm: string; dataDecisao?: string; quemDecide: string; dor?: string; validade?: string }`. Sem `oportunidadeId`, cria a oportunidade (`origem "registro manual"`, `closerId = autor.id`). Situação vai para `em_followup` (histórico). Os toques saem de `datasDaCadencia(apresentadaEm)`.
  - `listarFollowup(db, quem: Pessoa, hoje: string): Promise<ItemFollowup[]>`:
    - entram só as oportunidades `em_followup`;
    - o closer vê as dele, e o diretor vê todas;
    - ordem: `atrasado`, `hoje`, `em_dia` (pelo próximo toque) e `sem_toque` por último.
  - `registrarToque(db, toqueId, dados: { canal: string; resultado: string }, autor: Pessoa): Promise<Toque>`. Lança `Error("toque_ja_feito")` se `feito_em` já existe.
  - `registrarResultado(db, oportunidadeId, r: { resultado: "ganha"; valor: number } | { resultado: "perdida"; motivo: string } | { resultado: "nutricao" }, autor: Pessoa): Promise<Oportunidade>`.

- [ ] **Step 1: Escrever os testes que falham** em `followup.test.ts`:
  - "registrar proposta cria os 7 toques da cadência": apresentada em `2026-11-13`, os toques têm as datas do teste da Task 2, todos com `feitoEm null`, e a oportunidade fica `em_followup`.
  - "atrasado, hoje e em dia": com hoje `2026-11-18`:
    - proposta A de `2026-11-13` com D0 e D1 feitos fica `estado "hoje"` (D3 em 18/11);
    - proposta B de `2026-11-09` sem nada feito fica `estado "atrasado"`, com `atrasados` igual ao número de toques vencidos;
    - proposta C de `2026-11-18` fica `estado "hoje"`;
    - ordem B, A, C.
  - "virada do dia": com hoje `hojeEmSaoPaulo(new Date("2026-11-03T02:30:00Z"))`, um toque previsto para `2026-11-03` dá `estado "em_dia"`, não `"atrasado"` nem `"hoje"`.
  - "toque registrado duas vezes": o segundo `registrarToque` lança `toque_ja_feito`, e o `feitoEm` do primeiro não muda.
  - "proposta encerrada sai do follow-up": depois de `registrarResultado(… { resultado: "perdida", motivo: "Preço" })`, `listarFollowup` não traz a proposta, mesmo com toques vencidos.
  - "ganha guarda o valor fechado": `valorFechado 1250000` e o histórico `em_followup → ganha`.
  - "closer vê as dele; diretor vê todas".

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/followup.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar** nas assinaturas acima. O estado sai de `previstoPara` contra `hoje` (texto `AAAA-MM-DD` compara direto).
- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Registra propostas, gera os toques da cadência e calcula o atraso do follow-up"`

---

### Task 5: Ligações, rotina do dia e resumo do time

**Files:**
- Create: `hub/servidor/rotina.ts`, `hub/servidor/rotina.test.ts`
- Modify: `hub/compartilhado/oportunidade.ts`

**Interfaces:**
- Consumes: `ROTINA_FIXA`, `MINIMO_LIGACOES_DIA`, `META_LIGACOES_DIA` (Task 2); `listarFollowup`, `listarReunioes` (Tasks 3 e 4).
- Produces:
  - Tipos:
    - `ItemRotina { chave: string; titulo: string; origem: "fixo" | "gerado"; feito: boolean; automatico: boolean; contagem?: { feitas: number; meta: number }; link?: string }`;
    - `DiaDeRotina { dia: string; itens: ItemRotina[]; feitos: number; total: number }`;
    - `ResumoPessoa { pessoa: { id; nome; cargo }; rotina: { feitos: number; total: number }; atrasados: number }`;
    - `ContagemLigacoes { total: number; naoAtendeu: number; atendeu: number; marcou: number; meta: number }`.
  - `registrarLigacao(db, pessoaId, dia, resultado: "nao_atendeu" | "atendeu" | "marcou"): Promise<ContagemLigacoes>`; `contarLigacoes(db, pessoaId, dia): Promise<ContagemLigacoes>`.
  - `rotinaDoDia(db, pessoa: Pessoa, dia: string): Promise<DiaDeRotina>`:
    - junta os itens fixos do cargo com os gerados:
      - closer: um item por toque das suas propostas `em_followup` com `previstoPara <= dia`, chave `toque:{id}`, título `"{código} · {canal} · {empresa}"`, `automatico: true`, `link "/follow-up?toque={id}"`, feito quando o toque está feito;
      - closer: um item por reunião dele no dia, chave `reuniao:{id}`, título `"Confirmar a {diagnóstica|apresentação} com {empresa} às HH:MM"`;
    - `ligacoes` é automático e fica feito quando `total >= MINIMO_LIGACOES_DIA`; a contagem mostra `feitas` contra `META_LIGACOES_DIA`;
    - grava os itens em `rotinas` (insere os que faltam, atualiza `feito_em` dos automáticos), para o histórico ficar estável.
  - `marcarItem(db, pessoaId, dia, chave, feito: boolean): Promise<DiaDeRotina>`. Lança `Error("item_automatico")` para itens automáticos e `Error("item_inexistente")` para chave que não está no dia.
  - `historicoDeRotina(db, pessoaId, ate: string, dias = 14): Promise<{ dia: string; feitos: number; total: number }[]>`: só dias úteis, do mais recente para o mais antigo, com `0/0` quando a pessoa não abriu o hub.
  - `resumoDoTime(db, hoje: string): Promise<ResumoPessoa[]>`: hunters e closers ativos, em ordem de nome (pt-BR).

- [ ] **Step 1: Escrever os testes que falham** em `rotina.test.ts`:
  - "rotina fixa do hunter e contador de ligações": 3 itens fixos; sem ligação, `ligacoes` não está feito; com 1, fica feito e a contagem é `{ feitas: 1, meta: 2 }`; `contarLigacoes` separa `naoAtendeu`, `atendeu` e `marcou`, com `meta: 2`.
  - "closer ganha um item por toque do dia, e o toque feito marca o item": com 2 toques vencidos, `itens` traz `toque:{id}` para os dois; depois de `registrarToque` num deles, ele aparece `feito: true`.
  - "proposta encerrada não gera item": depois de `registrarResultado`, os toques dela somem da rotina do dia.
  - "marcar item manual e recusar automático": `marcarItem(…, "confirmar-reunioes", true)` deixa feito; `marcarItem(…, "toque:1", true)` lança `item_automatico`.
  - "histórico só com dias úteis": `historicoDeRotina(…, "2026-11-18", 5)` devolve `["2026-11-18", "2026-11-17", "2026-11-16", "2026-11-13", "2026-11-12"]`, com `0/0` nos dias sem registro.
  - "resumo do time": dois closers e um hunter; `atrasados` conta só toques de propostas `em_followup`; o diretor não aparece.

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/rotina.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** o mesmo comando. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Monta a rotina do dia por cargo, o contador de ligações e o resumo do time"`

---

### Task 6: Rotas da API da fase 2

**Files:**
- Create: `hub/functions/api/closers.ts`, `hub/functions/api/oportunidades/index.ts`, `hub/functions/api/oportunidades/[id].ts`, `hub/functions/api/oportunidades/[id]/resultado.ts`, `hub/functions/api/propostas.ts`, `hub/functions/api/followup.ts`, `hub/functions/api/toques/[id].ts`, `hub/functions/api/ligacoes.ts`, `hub/functions/api/rotina/index.ts`, `hub/functions/api/rotina/[chave].ts`, `hub/functions/api/rotina/historico.ts`, `hub/functions/api/time/resumo.ts`, `hub/servidor/rotas/fase2.test.ts`
- Modify: `hub/servidor/validacao.ts`

**Interfaces:**
- Consumes: Tasks 3, 4 e 5; `pedidoDeOutroSite`, `erro`, `json` (fase 1).
- Produces (o dia de hoje é sempre `hojeEmSaoPaulo()` no servidor; o cliente não manda o dia):

| Rota | Quem | Corpo | Resposta |
|---|---|---|---|
| `GET /api/closers` | todos | — | `{ id, nome }[]` dos closers e diretores ativos |
| `GET /api/oportunidades` | hunter, closer, diretor | — | `Oportunidade[]` (hunter só as dele) |
| `POST /api/oportunidades` | hunter, closer, diretor | `NovaDiagnostica` | 201 `{ oportunidade, reuniao }` |
| `PATCH /api/oportunidades/:id` | closer, diretor | `{ assumir: true }` | `Oportunidade` |
| `POST /api/oportunidades/:id/resultado` | closer dono, diretor | `{ resultado, valor?, motivo? }` | `Oportunidade` |
| `POST /api/propostas` | closer, diretor | `NovaProposta` (valor como texto) | 201 `{ proposta, toques }` |
| `GET /api/followup` | closer, diretor | — | `ItemFollowup[]` |
| `PATCH /api/toques/:id` | closer dono, diretor | `{ canal, resultado }` | `Toque` |
| `GET /api/ligacoes` · `POST /api/ligacoes` | hunter, diretor | `{ resultado }` | `ContagemLigacoes` |
| `GET /api/rotina` | hunter, closer | — | `DiaDeRotina` |
| `PUT /api/rotina/:chave` | hunter, closer | `{ feito: boolean }` | `DiaDeRotina` |
| `GET /api/rotina/historico` | hunter, closer | — | histórico de 14 dias úteis |
| `GET /api/time/resumo` | diretor | — | `{ pessoas: ResumoPessoa[], reunioesDaSemana: Reuniao[] }` |

Erros:
- cargo sem a permissão: 403 `sem_permissao`;
- validação: 400 `invalido`, com a mensagem do campo;
- toque já feito: 409 `conflito`, "Esse toque já foi registrado.";
- item automático: 409 `conflito`, "Esse item se marca sozinho.";
- oportunidade, toque ou item inexistente: 404.

Validação nova em `validacao.ts`:
- `validarNovaDiagnostica`:
  - empresa e contato de 2 a 120 caracteres;
  - telefone com pelo menos 8 dígitos;
  - `servico` em `SERVICOS`;
  - `closerId` de closer ou diretor ativo;
  - `dataHora` no formato `AAAA-MM-DDTHH:MM`;
  - `formato` online ou presencial.
- `validarNovaProposta`:
  - `valor` lido com `lerReais`;
  - `apresentadaEm` no formato `AAAA-MM-DD` e não no futuro;
  - `quemDecide` obrigatório;
  - com `oportunidadeId`, a oportunidade existe e está em `diagnostica_marcada` ou `proposta_marcada`;
  - sem ele, `empresa` é obrigatória.
- `validarResultado`:
  - `ganha` exige `valor`;
  - `perdida` exige `motivo` de `MOTIVOS_PERDA`.
- `validarToque`: `canal` em WhatsApp, Ligação, E-mail ou Presencial; `resultado` com até 500 caracteres.

- [ ] **Step 1: Escrever os testes que falham** em `servidor/rotas/fase2.test.ts` (mesmo padrão de `pessoas.test.ts`: middleware + rota, `X-Dev-Email`, `Content-Type: application/json`):
  - "projetos recebe 403 sem_permissao em follow-up, rotina e oportunidades";
  - "hunter cria diagnóstica, vê só a dele, e não registra proposta (403)";
  - "closer registra proposta com valor '12.500,00' e recebe 7 toques; o valor gravado é 1250000";
  - "valor 'abc' ou '-10' dá 400 invalido";
  - "closer não registra toque de proposta de outro closer (403) até assumir; depois de assumir, registra";
  - "toque registrado duas vezes dá 409 conflito";
  - "PUT de item automático dá 409; de item manual, devolve o dia com o item feito";
  - "resumo do time é só do diretor (closer recebe 403)";
  - "perdida sem motivo dá 400; com 'Preço', 200 e situação perdida".

- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/rotas/fase2.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar** as rotas. As regras de cargo ficam em `compartilhado/permissoes.ts`, ao lado das da fase 1, todas `(cargo: Cargo) => boolean`:
  - `podeMarcarDiagnostica`: hunter, closer e diretor;
  - `podeCuidarDoFollowup`: closer e diretor (assumir, propostas, follow-up, toques e resultado);
  - `temRotina`: hunter e closer;
  - `podeContarLigacoes`: hunter e diretor;
  - `podeVerResumoDoTime`: diretor.

  "Closer dono" é o closer em `oportunidades.closer_id`; o diretor passa sempre. A tela usa as mesmas funções para esconder o que a pessoa não pode fazer.
- [ ] **Step 4: Rodar** `cd hub && npm run test:api && npx wrangler pages functions build --outdir /tmp/fn`. Expected: passam; o build compila.
- [ ] **Step 5: Commit** `git commit -m "Abre a API da rotina, do follow-up e das oportunidades por cargo"`

---

### Task 7: Modo foco, medidor e número que rola

**Files:**
- Create: `hub/src/componentes/Foco.tsx`, `Foco.module.css`, `Medidor.tsx`, `Medidor.module.css`, `NumeroRolante.tsx`, `NumeroRolante.module.css`, `hub/src/componentes/fase2.test.tsx`
- Modify: `hub/src/telas/Vitrine.tsx` (mostra os três)

**Interfaces:**
- Produces:
  - `<Foco titulo: string origem?: HTMLElement | null aoSair: () => void>{children}</Foco>`:
    - um `role="dialog"` com `aria-modal` e `aria-label={titulo}`, num portal em `document.body`;
    - o véu desfoca o resto (`backdrop-filter: blur(6px)`) e o botão "Sair do foco" fica no canto;
    - Esc sai, o Tab fica preso dentro, e ao fechar o foco volta para `origem`;
    - a entrada usa FLIP: mede o retângulo de `origem` e anima de lá até o tamanho final em `var(--lento)` com `var(--curva)`; sem `origem`, só aparece.
  - `<Medidor rotulo: string valor: number total: number texto: string>`: a cota de desenho técnico (linha com setas nas pontas e o texto no meio), com `role="meter"`, `aria-valuenow`, `aria-valuemin=0` e `aria-valuemax=total`; o trecho preenchido é `valor/total`.
  - `<NumeroRolante valor: number />`: quando o número muda, o novo entra rolando de baixo (140 ms); `aria-live="polite"`; o texto é sempre o valor atual em mono.

- [ ] **Step 1: Escrever os testes que falham** em `fase2.test.tsx`:
  - "Foco abre como diálogo e Esc sai devolvendo o foco": um botão de origem abre o `Foco`; o diálogo tem `aria-modal="true"`; o primeiro elemento focável dentro recebe o foco; Esc chama `aoSair`; ao desmontar, o foco volta para o botão.
  - "Sair do foco chama aoSair".
  - "Tab fica preso": com dois botões dentro, o Tab no último volta para "Sair do foco".
  - "Medidor expõe a medida": `valor 30 total 45` tem `role="meter"` com `aria-valuenow="30"` e `aria-valuemax="45"`, e mostra o `texto`.
  - "NumeroRolante mostra o valor novo": rerender de 3 para 4 mostra "4".

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/componentes`. Expected: FAIL.
- [ ] **Step 3: Implementar.** Com `prefers-reduced-motion`, a regra global da fase 1 já zera as transições; o FLIP não liga o `transition` quando `matchMedia("(prefers-reduced-motion: reduce)")` casa.
- [ ] **Step 4: Rodar** o mesmo comando e conferir `/vitrine` nos dois temas (captura). Expected: passam; o foco cresce do cartão.
- [ ] **Step 5: Commit** `git commit -m "Adiciona o modo foco, o medidor e o número que rola"`

---

### Task 8: Tela Follow-up

**Files:**
- Create: `hub/src/telas/FollowUp.tsx`, `FollowUp.module.css`, `hub/src/telas/followup/ToqueEmFoco.tsx`, `NovaProposta.tsx`, `Resultado.tsx`, `hub/src/telas/FollowUp.test.tsx`
- Modify: `hub/src/App.tsx` (rota `/follow-up` mostra `FollowUp`)

**Interfaces:**
- Consumes: rotas da Task 6; `Foco` (Task 7); `CADENCIA`, `preencherModelo`, `formatarDia`, `formatarReais`, `MOTIVOS_PERDA` (Task 2); `ROTULO_SITUACAO` (Task 3).
- Produces: a tela abre o toque de `?toque={id}` direto em foco (usado pelos links da rotina).

Tela:
- Cabeçalho: "Follow-up", com a contagem "N na rua · M atrasados" em mono. O botão primário da tela é "Registrar proposta apresentada".
- Lista: um cartão por proposta, em grupos "Atrasados", "Hoje" e "Próximos" (e "Sem toque" no fim).
- Cada cartão mostra:
  - empresa, serviço e valor;
  - o próximo toque como código (`D3`) com canal e data (`Qua, 18/11`);
  - a `Tag` `atrasado` ("Atrasado · 2 toques") ou `hoje`;
  - o closer, quando quem vê é o diretor.
- Clicar no cartão abre o toque em foco (`ToqueEmFoco`), crescendo do cartão:
  - objetivo e canal;
  - a mensagem do modelo preenchida (contato, serviço, dor, data da decisão, vendedor = primeiro nome de quem está logado, decisores = quem decide, validade), com o que falta entre colchetes;
  - o botão "Copiar mensagem" (`navigator.clipboard.writeText`, com `avisar("Mensagem copiada.")`);
  - a dica, quando houver;
  - o formulário "Toque feito": canal pré-escolhido e o resultado em texto, com o botão primário "Registrar toque";
  - o link "Registrar resultado da proposta", que troca o conteúdo do foco por `Resultado` (Ganha + valor; Perdida + motivo; Nutrição).
- `NovaProposta` em foco: escolher uma oportunidade em `diagnostica_marcada` ou `proposta_marcada` (lista de `GET /api/oportunidades`) ou "Empresa nova"; os campos de `NovaProposta`; o botão primário "Registrar proposta". Ao salvar, avisa "Proposta registrada. 7 toques na agenda."

- [ ] **Step 1: Escrever os testes que falham** em `FollowUp.test.tsx` (fetch falso, como na fase 1):
  - "atrasados vêm primeiro, com a tag e o código do toque": duas propostas, uma atrasada e uma de hoje; a primeira da lista tem "Atrasado" e "D1".
  - "toque em foco mostra a mensagem preenchida e o que falta entre colchetes": com contato "Ana" e sem `dor`, o texto contém "Oi, Ana!" e "[dor do cliente]".
  - "registrar toque manda canal e resultado e tira o atraso": o PATCH recebe `{ canal: "WhatsApp", resultado: "Respondeu que decide sexta" }`; a lista recarregada não tem mais "Atrasado".
  - "perdida exige motivo": sem motivo, o botão não envia e aparece "Escolha o motivo."; com "Preço", o POST recebe `{ resultado: "perdida", motivo: "Preço" }`.
  - "nova proposta com valor brasileiro": o POST recebe `valor: "12.500,00"` e o aviso diz "Proposta registrada. 7 toques na agenda.".
  - "abrir com ?toque=ID já mostra o toque em foco".
  - "o 409 de toque já feito aparece no foco": "Esse toque já foi registrado.".

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/telas/FollowUp.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** o mesmo comando, `npm run typecheck` e a captura de `/follow-up` (claro, escuro e celular). Expected: passam; nada vaza no celular.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a tela de follow-up com o toque em modo foco"`

---

### Task 9: Tela Rotinas

**Files:**
- Create: `hub/src/telas/Rotinas.tsx`, `Rotinas.module.css`, `hub/src/telas/Rotinas.test.tsx`
- Modify: `hub/src/App.tsx` (rota `/rotinas`)

**Interfaces:**
- Consumes: `GET /api/rotina`, `PUT /api/rotina/:chave`, `GET /api/rotina/historico`, `GET /api/time/resumo` (Task 6); `Medidor`, `NumeroRolante` (Task 7).
- Produces: `<ChecklistDaRotina dia: DiaDeRotina aoMarcar: (chave, feito) => void />`, exportado de `Rotinas.tsx` e usado no Hoje (Task 10).

Tela:
- **Hunter e closer:**
  - cabeçalho com o dia por extenso e o `Medidor` "Rotina de hoje" (`feitos/total`);
  - o checklist (`ChecklistDaRotina`):
    - cada item manual é um checkbox; ao marcar, a linha se fecha e o check se desenha;
    - os automáticos mostram "marca sozinho" e, quando têm `link`, viram link;
    - o item de ligações mostra a contagem (`1/2`);
  - abaixo, "Últimos 14 dias úteis": uma linha por dia com a barra de segmentos `feitos/total` e "Cumprida" quando completa.
- **Diretor:** a tela mostra "Rotina do time hoje", com o resumo de cada pessoa (nome, cargo, `feitos/total`, atrasados), em vez do próprio checklist.

- [ ] **Step 1: Escrever os testes que falham** em `Rotinas.test.tsx`:
  - "marcar item manual chama o PUT e atualiza o medidor": o PUT de `confirmar-reunioes` recebe `{ feito: true }` e o medidor passa de `1/5` para `2/5`.
  - "item automático não tem checkbox e o de toque leva ao follow-up": o item `toque:7` é link para `/follow-up?toque=7`.
  - "histórico mostra 'Cumprida' só no dia completo".
  - "diretor vê a rotina do time": dois resumos, com "3/4" e "1 atrasado".

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/telas/Rotinas.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** o mesmo comando e `npm run typecheck`. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a tela de rotinas com o checklist do dia e o histórico"`

---

### Task 10: O Hoje de cada cargo

**Files:**
- Create: `hub/src/telas/hoje/HojeHunter.tsx`, `BlocoDeLigacoes.tsx`, `MarcarDiagnostica.tsx`, `HojeCloser.tsx`, `HojeDiretor.tsx` (+ `.module.css`), `hub/src/telas/hoje/hoje.test.tsx`
- Modify: `hub/src/telas/Hoje.tsx` (saudação da fase 1 + o bloco do cargo; Projetos mostra "Briefings e pendências técnicas chegam na fase 6.")

**Interfaces:**
- Consumes: Tasks 6, 7, 8 e 9; `ROTEIRO_COLD_CALL`, `SERVICOS`, `formatarDia`, `instanteLocal` (Task 2).

Telas:
- **Hunter:**
  - cartão "Bloco de ligações": `NumeroRolante` com o total, meta, `Medidor` e "N sem resposta para o WhatsApp". O botão primário "Começar o bloco" abre `BlocoDeLigacoes` em foco, crescendo do cartão:
    - à esquerda, o roteiro (`ROTEIRO_COLD_CALL`, com `{vendedor}` preenchido e `{decisor}` como "[nome do decisor]");
    - à direita, três botões grandes: "Não atendeu" (tecla 1), "Atendeu" (tecla 2) e "Marcou diagnóstica" (tecla 3), mais o contador;
    - "Marcou diagnóstica" abre `MarcarDiagnostica` no mesmo foco (empresa, contato, telefone, serviço, closer de `GET /api/closers`, data e hora, formato) e, ao salvar, conta a ligação como `marcou` e avisa "Diagnóstica marcada com {closer} para {dia} às {hora}.";
  - "Diagnósticas que marquei": as próximas, com data, empresa e closer;
  - o checklist da rotina, em versão curta.
- **Closer:**
  - "Próxima reunião": empresa, tipo, data e hora, e o `Medidor` da contagem regressiva ("faltam 2 h 15 min", total de 24 h). "Iniciar reunião" fica desligado, com a dica "chega na fase 3";
  - a rotina do dia (checklist);
  - "Follow-ups": os 5 primeiros da lista, atrasados primeiro, com link para a tela;
  - "Este mês": propostas registradas e fechadas (ganhas) no mês, em `NumeroRolante`; pactos por reunião com "—".
- **Diretor:**
  - "Rotina do time hoje" (resumo);
  - "Follow-ups atrasados por pessoa" (só quem tem atraso, do maior para o menor);
  - "Reuniões da semana" (dia, hora, empresa, tipo, closer);
  - um cartão "Conversão e valor vendido chegam na fase 6".

- [ ] **Step 1: Escrever os testes que falham** em `hoje.test.tsx`:
  - "hunter registra ligações pelo teclado no bloco em foco": abrir o bloco, apertar 1 e 2; o POST recebe `nao_atendeu` e `atendeu`; o contador mostra 2, o medidor `2/2` e "Meta do dia batida"; "1 sem resposta".
  - "marcar diagnóstica cria a oportunidade e conta a ligação": o POST `/api/oportunidades` recebe empresa, serviço `"climatizacao"`, closer e `dataHora "2026-11-10T14:00"`; depois, um POST `/api/ligacoes` com `marcou`; o aviso cita o closer.
  - "closer vê a próxima reunião com a contagem": às `2026-11-09T11:45` locais, com reunião às 14:00, aparece "faltam 2 h 15 min"; o botão "Iniciar reunião" está desligado.
  - "diretor vê atrasados por pessoa em ordem": "Carlos · 3" antes de "Clara · 1"; quem não tem atraso não aparece.
  - "Projetos vê o aviso da fase 6".

- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/telas/hoje`. Expected: FAIL.
- [ ] **Step 3: Implementar.** A contagem regressiva atualiza a cada 30 s com `setInterval`, limpo ao desmontar.
- [ ] **Step 4: Rodar** `cd hub && npx vitest run && npm run typecheck` e capturas do Hoje dos quatro cargos (claro, escuro, celular). Expected: passam; um botão vermelho por tela.
- [ ] **Step 5: Commit** `git commit -m "Monta o Hoje de cada cargo com o bloco de ligações em foco"`

---

### Task 11: Ponta a ponta da fase 2 e documentação

**Files:**
- Create: `hub/e2e/fase2.spec.ts`
- Modify: `hub/e2e/semente.sql` (dados da fase 2 com datas relativas: `date('now', '-10 days')` etc.), `hub/README.md` (seções novas, mapa de arquivos), `docs/07-decisoes-e-pendencias.md` (as 6 decisões deste plano, com origem "plano da fase 2, aprovado pelo Lucas em …"), `docs/03-plano-erp.md` (tarefas do hub novo, a partir da 51)

**Interfaces:**
- Consumes: tudo das Tasks 1 a 10.

- [ ] **Step 1: Escrever os testes** em `fase2.spec.ts`:
  - **hunter:** começa o bloco, registra 2 ligações pelo teclado, marca uma diagnóstica com `clo@` para amanhã às 14:00, e vê a diagnóstica em "Diagnósticas que marquei";
  - **closer:**
    - registra a proposta dessa oportunidade (apresentada hoje, valor "8.000,00");
    - o Follow-up mostra o D0 em "Hoje";
    - registra o D0 (WhatsApp, "Mandei a proposta");
    - a rotina mostra o item do toque feito;
  - **atraso:** a semente tem uma proposta de 10 dias úteis atrás sem toque feito, e ela aparece em "Atrasados" com a tag;
  - **diretor:** o Hoje mostra o closer da semente em "Follow-ups atrasados por pessoa";
  - **resultado:** o closer marca a proposta atrasada como perdida ("Preço"), e ela sai do Follow-up e do resumo do diretor;
  - **modo foco:**
    - Esc fecha o toque em foco e o foco volta para o cartão;
    - com movimento reduzido, a transição do foco mede `0s`;
  - **celular (390 × 844):** Hoje, Follow-up e Rotinas sem rolagem lateral, como closer e como hunter.
- [ ] **Step 2: Rodar** `cd hub && npm run typecheck && npm test && npm run e2e`. Expected: tudo passa (fase 1 e fase 2). Se algo falhar, corrigir na Task de origem e repetir.
- [ ] **Step 3: Documentar** o README, as decisões em `docs/07` e as tarefas no `docs/03`.
- [ ] **Step 4: Commit** `git commit -m "Testa a fase 2 de ponta a ponta e atualiza a documentação"`
