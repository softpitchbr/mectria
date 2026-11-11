# Hub comercial · Fase 8 (cadastro de serviços e apresentações em HTML) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Os serviços saem do código e vão para o banco: o diretor cria e edita cada serviço (dados, perguntas técnicas da diagnóstica e roteiro por slide) e anexa a apresentação de proposta em HTML. Na reunião de proposta, a janela que o cliente vê abre esse HTML isolado, e o painel continua controlando os slides, as ações (preço revelado, dores, calculadora) e o roteiro.

**Architecture:** A mesma das fases anteriores, com duas peças novas.
- **Serviços no D1** (migração `0008`), já com os 12 da carta. As telas leem `GET /api/servicos`; só o diretor grava.
- **Apresentações no Workers KV** (`APRESENTACOES`). O HTML é servido por `/api/servicos/:id/apresentacao` com `Content-Security-Policy: sandbox allow-scripts` e abre num `<iframe sandbox="allow-scripts">`, sem acesso ao login, ao hub ou à internet.
- **Contrato** em `compartilhado/contrato-apresentacao.ts`: o hub manda o slide, os dados do cliente, as ações e os números; a apresentação avisa quando está pronta (slides, ações e campos) e o que acontece nela (dor, preço, calculadora, setas). A janela da apresentação faz a ponte entre o canal da reunião (BroadcastChannel) e o iframe (postMessage).
- **Sem apresentação própria,** a reunião continua com a apresentação de exemplo de hoje.

**Tech Stack:** a mesma, sem dependências novas. Só um binding novo do Workers KV.

**Spec:** `docs/07-decisoes-e-pendencias.md`, seção 12:
- "Apresentações em HTML interativo, conectadas ao hub" (Lucas, 04/11/2026);
- "O diretor cadastra serviços no hub" (Lucas, 04/11/2026);
- "Serviços da MecTRIA" (MecTRIA, 04/11/2026).

Também `docs/15-hub-template.md`, seções 6 (modo reunião) e 12 (o que ficou para este subprojeto).

## Decisões deste plano (a confirmar pelo Lucas)

1. **Onde fica:** seção nova "Serviços", só para o diretor, no fim do menu.
2. **Situação do serviço:**
   - **Ativo** e **Em estruturação** podem ser vendidos. Em estruturação aparece com o aviso nas listas.
   - **Inativo** sai das listas de oportunidade nova. O que já existe com ele continua funcionando.
   - Nada é apagado.
3. **Perguntas técnicas:** a pergunta salva não é apagada, é desativada. Ela sai das diagnósticas novas e continua nos briefings que já têm resposta.
4. **O arquivo da apresentação:**
   - Um `.html` só, de até 5 MB, com tudo dentro: CSS, JavaScript, imagens e fontes em `data:`. As fontes do Google Fonts são a exceção permitida.
   - O HTML não fala com a internet nem com o hub (`connect-src 'none'`).
   - Trocar o arquivo cria uma versão nova; a anterior não fica guardada.
5. **Roteiro por slide:**
   - Sem roteiro próprio, a reunião usa o roteiro padrão (os 13 slides da apresentação de exemplo).
   - O roteiro define o painel: número de slides, título, fala, dica, pacto e tempo.
   - A apresentação diz quantos slides tem. Se os números não batem, o painel avisa (nunca a janela do cliente).
   - O roteiro só vale para o serviço com apresentação própria. Sem ela, vale o da apresentação de exemplo.
6. **O que a apresentação conta ao hub** (dores marcadas, etapa do preço, números da calculadora):
   - fica gravado no andamento da reunião;
   - volta para a apresentação quando a janela é reaberta.
7. **Ações e campos:** a apresentação declara, por slide, as ações (ex.: "Revelar o preço") e os campos numéricos da calculadora. O painel mostra um botão para cada ação e um campo para cada número.
8. **Apresentação de exemplo em HTML** (`hub/apresentacoes/exemplo.html`):
   - os mesmos 13 slides da de hoje;
   - dores clicáveis, preço em 3 etapas e uma calculadora de "quanto custa ficar como está";
   - é o modelo para quem desenhar as apresentações de verdade.
9. **Fica para depois:** a apresentação da diagnóstica em HTML. A diagnóstica continua sem janela.

## Global Constraints

- Tudo das fases 1 a 7 continua valendo:
  - pt-BR e MecTRIA;
  - centavos e fuso de São Paulo;
  - um botão vermelho por tela;
  - gravações em várias etapas num `db.batch` condicionado;
  - parâmetros numerados (`?1`), nenhuma consulta com lista de ids;
  - pedidos que mudam dados em JSON;
  - cadências, objeções e playbooks continuam em `compartilhado/dados/`.
- Nenhum segredo, e-mail real de membro da MecTRIA, credencial ou id real de recurso da Cloudflare no repositório. O KV usa `id = "local"` em dev e `PREENCHER` em produção e prévia.
- O HTML da apresentação nunca roda com a origem do hub:
  - o iframe tem `sandbox="allow-scripts"`, sem `allow-same-origin`;
  - a resposta tem `Content-Security-Policy` com `sandbox allow-scripts` e `connect-src 'none'`;
  - toda mensagem que vem dele passa por `lerMensagemDaApresentacao` antes de entrar no painel ou no banco.
- Os 12 serviços da migração são os de `SERVICOS_COMPLETOS`, sem mudar um texto.
- Limites:
  - `LIMITE_DA_APRESENTACAO = 5 * 1024 * 1024` bytes;
  - até 30 perguntas e 40 slides de roteiro por serviço;
  - tempo do slide de 1 a 30 minutos.
- Nunca rodar `playwright install` neste ambiente.

## Review Focus

- **O endereço da apresentação aberto direto no navegador:** continua isolado, porque o cabeçalho tem `sandbox allow-scripts` sem `allow-same-origin`, e o HTML não chama a API com o login de quem abriu. Teste na Task 3.
- **Mensagem estranha vindo do iframe** (de outra janela, sem `mectria: 1`, texto gigante, número infinito, 500 dores): é ignorada ou cortada nos limites, e nada disso chega ao banco. Testes nas Tasks 4 e 7.
- **Roteiro e apresentação com números de slides diferentes, ou roteiro editado com a reunião aberta:** o painel avisa e o andamento continua salvando. Testes nas Tasks 5 e 8.
- **Serviço inativado com oportunidades e propostas dele:** o nome continua nas telas e no CSV, a preparação da proposta continua salvando e ele não aparece para oportunidade nova. Testes nas Tasks 5 e 6.
- **Arquivo errado:** com mais de 5 MB ou sem `<html`, é recusado com a mensagem certa, no navegador e no servidor. Testes nas Tasks 3 e 10.

---

### Task 1: Serviços no banco, com os 12 da carta

**Files:**
- Create:
  - `hub/compartilhado/servico.ts` (tipos e regras puras);
  - `hub/migrations/0008_servicos.sql`;
  - `hub/servidor/servicos.ts`, só com `listarServicos` nesta task;
  - `hub/servidor/servicos.test.ts`.
- Modify:
  - `hub/compartilhado/dados/servicos-completos.ts`: ganha `servicosDaCarta()`. O comentário do topo passa a dizer que o arquivo é a carta de origem e a semente da migração 0008.
  - `hub/wrangler.toml`: `[[kv_namespaces]] binding = "APRESENTACOES"`, com `id = "local"`, e as versões `env.production` e `env.preview` com `PREENCHER` e `PREENCHER-PREVIA`.
  - `hub/vitest.api.config.ts`: `kvNamespaces: ["APRESENTACOES"]`.
  - `hub/servidor/tipos.ts`: `Env.APRESENTACOES: KVNamespace`.

**Interfaces — Produces** (`compartilhado/servico.ts`):
- `type SituacaoServico = "ativo" | "em_estruturacao" | "inativo"`, com `ROTULO_SITUACAO_SERVICO`: "Ativo", "Em estruturação", "Inativo".
- `interface PerguntaTecnica extends Pergunta { inativa?: boolean }`.
- `interface SlideDoRoteiro { id: string; titulo: string; fala: string; dica?: string; pacto: IdPacto | null; tempo: number }`, com `tempo` em minutos.
- `interface ArquivoDaApresentacao { arquivo: string; bytes: number; versao: number; enviadaEm: string; enviadaPor: string }`.
- `interface Servico`:
  - campos `id`, `nome`, `sigla`, `resumo`, `dores: string[]`, `entregamos: string[]`, `ficaComCliente: string[]`, `ancoraValor`, `situacao`, `perguntas: PerguntaTecnica[]`;
  - `roteiro: SlideDoRoteiro[] | null`, em que null é o roteiro padrão;
  - `apresentacao: ArquivoDaApresentacao | null`, em que null é a de exemplo.
- `type DadosDoServico = Omit<Servico, "id" | "apresentacao">`: o que o diretor manda.
- `vendavel(s: Pick<Servico, "situacao">): boolean`: tudo menos inativo.
- `idDoServico(nome: string): string`: sem acento, minúsculo, hífens, até 60 caracteres.
- `urlDaApresentacao(s: Pick<Servico, "id" | "apresentacao">): string | null`: `/api/servicos/{id}/apresentacao?v={versao}`.
- `servicosDaCarta(): Servico[]`, em `servicos-completos.ts`:
  - os 12 na ordem da carta, com `situacao` "em_estruturacao" para quem tem `emEstruturacao`;
  - `roteiro` e `apresentacao` null.
- `listarServicos(db): Promise<Servico[]>`, por `ordem`.

**Migração `0008`:**
- Tabela `servicos`:
  - `id TEXT PRIMARY KEY`, `ordem INTEGER NOT NULL`;
  - `nome`, `sigla`, `resumo`, `ancora_valor`;
  - `dores`, `entregamos`, `fica_com_cliente` e `perguntas`, em JSON;
  - `situacao` com `CHECK`;
  - `roteiro TEXT` e `apresentacao TEXT`, os dois JSON e nulos;
  - `apresentacao_versao INTEGER NOT NULL DEFAULT 0`;
  - `atualizado_em`, e `atualizado_por TEXT` com o nome de quem salvou (sem chave estrangeira: os testes apagam `pessoas`).
- Os 12 `INSERT`. São gerados uma vez a partir de `servicosDaCarta()` por um script no scratchpad (`node --experimental-strip-types`). O SQL fica no repositório; o script, não.
- `ALTER TABLE reunioes ADD COLUMN interacoes TEXT`.

- [ ] **Testes:**
  - "a migração 0008 cadastra os 12 serviços da carta, na ordem, com as perguntas": `listarServicos(env.DB)` igual a `servicosDaCarta()`;
  - "Emissão de Carbono entra em estruturação e sem perguntas";
  - "idDoServico: 'Adequação à NR-12' dá 'adequacao-a-nr-12'";
  - "vendavel: inativo não; ativo e em estruturação sim";
  - "urlDaApresentacao traz a versão; sem apresentação, null".
- [ ] RED, implementação, GREEN, commit `git commit -m "Leva os serviços para o banco, com os 12 da carta"`

### Task 2: O diretor cria e edita serviços (servidor)

**Files:**
- Modify:
  - `hub/servidor/servicos.ts`;
  - `hub/servidor/validacao.ts` (`validarServico`);
  - `hub/compartilhado/permissoes.ts` (`podeCadastrarServicos`, só o diretor).
- Create:
  - `hub/functions/api/servicos/index.ts`: GET para qualquer cargo; POST só o diretor, com 201 e o serviço.
  - `hub/functions/api/servicos/[id].ts`: GET para qualquer cargo; PUT só o diretor.
  - `hub/servidor/rotas/fase8.test.ts`.

**Interfaces — Produces:**
- `buscarServico(db, id): Promise<Servico | null>`.
- `criarServico(db, dados: DadosDoServico, autor: Pessoa): Promise<Servico>`:
  - id por `idDoServico(nome)`; se já existe, `-2`, `-3`;
  - `ordem` = maior + 1, no próprio `INSERT … SELECT`;
  - lança `Error("nome_duplicado")`, com o nome comparado sem acento e sem maiúscula.
- `atualizarServico(db, id, dados, autor): Promise<Servico | null>`: null quando não existe; lança `nome_duplicado`.
- `idsDosServicos(db, { soVendaveis }: { soVendaveis: boolean }): Promise<Set<string>>`.
- `validarServico(corpo): Validado<DadosDoServico>`:
  - nome de 2 a 80;
  - sigla de 1 a 6 (letras e números, guardada em maiúsculas);
  - resumo até 300; âncora até 500;
  - dores até 12, entregamos e fica com o cliente até 20, cada item de 1 a 200;
  - situação da lista.
- Perguntas (até 30):
  - id `/^[a-z0-9-]{1,60}$/`, único no serviço e diferente dos ids das perguntas da base (`DIAGNOSTICA.blocos` e `DIAGNOSTICA.escopoGeral`);
  - texto de 1 a 300; tipo de `TipoPergunta`;
  - opções de 2 a 10, cada uma de 1 a 80, obrigatórias só no tipo "opcoes";
  - dica até 300; bloco "escopo" ou "parametros"; `inativa` booleano.
- Roteiro: null ou de 1 a 40 slides:
  - id `/^[a-z0-9-]{1,40}$/` e único;
  - título de 1 a 120; fala até 2.000; dica até 500;
  - pacto de `IDS_PACTO` ou null; tempo inteiro de 1 a 30.

- [ ] **Testes:**
  - "o hunter lista os serviços, mas não cria nem edita (403)";
  - "o diretor cria Serviço Novo, que vai para o fim da lista, com id servico-novo";
  - "nome repetido, sem acento ou maiúscula, dá 409";
  - "o diretor edita a âncora e inativa o serviço";
  - "pergunta com o id de uma pergunta da base dá 400";
  - "pergunta de opções sem opções dá 400";
  - "roteiro com 41 slides ou tempo 0 dá 400";
  - "GET de um serviço que não existe dá 404".
- [ ] RED, implementação, GREEN, commit `git commit -m "Permite ao diretor criar e editar serviços"`

### Task 3: A apresentação em HTML no Workers KV

**Files:**
- Create:
  - `hub/servidor/apresentacoes.ts`;
  - `hub/functions/api/servicos/[id]/apresentacao.ts`: GET para qualquer cargo; PUT e DELETE só o diretor.
- Modify:
  - `hub/servidor/validacao.ts` (`validarArquivoDaApresentacao`);
  - `hub/compartilhado/servico.ts` (`LIMITE_DA_APRESENTACAO`).
- Tests: `hub/servidor/apresentacoes.test.ts` e `hub/servidor/rotas/fase8.test.ts`.

**Interfaces — Produces:**
- `salvarApresentacao(env: Pick<Env, "DB" | "APRESENTACOES">, servicoId, a: { arquivo: string; html: string }, autor: Pessoa): Promise<Servico | null>`:
  - confere que o serviço existe;
  - grava a chave `apresentacao/{id}` no KV;
  - depois soma 1 em `apresentacao_versao` e grava o JSON de `ArquivoDaApresentacao` num `UPDATE … RETURNING` (o `SET` lê a versão antiga, então `versao` sai igual à coluna nova);
  - `enviadaPor` = nome do autor.
- `removerApresentacao(env, servicoId): Promise<Servico | null>`: `apresentacao = NULL` no D1, depois apaga a chave no KV. A versão não volta.
- `lerApresentacao(env, servicoId): Promise<string | null>`.
- `CABECALHOS_DA_APRESENTACAO`:
  - `Content-Type: text/html; charset=utf-8`;
  - `Content-Security-Policy: sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; img-src data: blob:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'`;
  - `X-Content-Type-Options: nosniff`; `Referrer-Policy: no-referrer`; `Cache-Control: private, max-age=3600`.
- `validarArquivoDaApresentacao(corpo): Validado<{ arquivo: string; html: string }>`:
  - `arquivo` de 1 a 120, terminado em `.html` ou `.htm`;
  - `html` com `<html` ou `<!doctype html` (sem maiúscula), e até `LIMITE_DA_APRESENTACAO` bytes em UTF-8.
  - Mensagens:
    - "A apresentação passa de 5 MB. Diminua as imagens e envie de novo.";
    - "Envie um arquivo .html.".

- [ ] **Testes:**
  - "o diretor envia a apresentação; o GET devolve o mesmo HTML com o cabeçalho sandbox allow-scripts, sem allow-same-origin";
  - "enviar de novo soma a versão (1, 2); remover deixa a apresentação null e o GET dá 404; enviar depois dá versão 3";
  - "arquivo com mais de 5 MB dá 400 com a mensagem";
  - "arquivo sem <html dá 400";
  - "o closer lê, mas não envia nem remove (403)";
  - "PUT para serviço que não existe dá 404 e não grava no KV".
- [ ] RED, implementação, GREEN, commit `git commit -m "Guarda a apresentação de cada serviço no Workers KV, isolada do hub"`

### Task 4: O contrato entre o hub e a apresentação, e o exemplo em HTML

**Files:**
- Create:
  - `hub/compartilhado/contrato-apresentacao.ts` e `.test.ts`;
  - `hub/apresentacoes/exemplo.html`: a apresentação de exemplo dos 13 slides, no visual claro da MecTRIA (os tokens de `src/apresentacao/Slide.module.css`);
  - `hub/apresentacoes/CONTRATO.md`: o contrato em pt-BR, para quem for desenhar as apresentações;
  - `hub/src/apresentacao/exemplo.test.ts`, que roda o `exemplo.html` num JSDOM com `runScripts: "dangerously"`.

**Interfaces — Produces:**
- `interface Interacoes { dores: string[]; precoEtapa: number; calculadora: Record<string, number> }` e `INTERACOES_VAZIAS`.
- `interface AcaoDoSlide { slide: number; id: string; rotulo: string }` e `interface CampoDoSlide { slide: number; id: string; rotulo: string }`.
- `type ParaApresentacao`, todas com `mectria: 1`:
  - `{ tipo: "estado"; slide; dados: Record<string, string>; interacoes }`;
  - `{ tipo: "slide"; slide }`;
  - `{ tipo: "acionar"; acao: string }`;
  - `{ tipo: "calcular"; valores: Record<string, number> }`.
- `type EventoDaApresentacao`:
  - `{ evento: "dor"; valor: string; marcada: boolean }`;
  - `{ evento: "preco"; etapa: number }`;
  - `{ evento: "calculadora"; valores: Record<string, number> }`.
- `type DaApresentacao`, todas com `mectria: 1`:
  - `{ tipo: "pronta"; slides: number; acoes: AcaoDoSlide[]; campos: CampoDoSlide[] }`;
  - `{ tipo: "evento" } & EventoDaApresentacao`;
  - `{ tipo: "tecla"; tecla: "ArrowRight" | "ArrowLeft" }`.
- `lerMensagemDaApresentacao(dado: unknown): DaApresentacao | null`. Limites:
  - slides de 1 a 60; até 60 ações e 20 campos;
  - id `/^[a-z0-9-]{1,40}$/`; rótulo de 1 a 60;
  - texto da dor de 1 a 200; etapa de 0 a 10;
  - até 20 números; chave `/^[A-Za-z0-9_-]{1,40}$/`; número finito com valor absoluto até 1e12.
  - Campo a mais é ignorado; ações e campos ausentes viram `[]`.
- `lerInteracoes(dado: unknown): Interacoes | null`: até 20 dores, os mesmos limites.
- `aplicarEvento(i: Interacoes, e: EventoDaApresentacao): Interacoes`:
  - dor marcada entra uma vez só (até 20) e desmarcada sai;
  - o preço troca a etapa;
  - a calculadora troca os números.
- **exemplo.html:**
  - os slides têm os ids e a ordem de `APRESENTACAO_EXEMPLO`;
  - os textos usam as chaves de `valoresDaProposta`; a que falta aparece como "[rótulo]";
  - `ceu-inferno` tem as dores clicáveis: a dor do cliente (`dados.dor`) e mais três exemplos. Cada dor também é uma ação (`dor-1` a `dor-4`), para o painel marcar;
  - `investimento` revela o preço em 3 etapas pela ação `revelar-preco` (âncora, valor e parcelas) e tem a calculadora (`horas-paradas` por mês × `custo-hora`, que dá o custo do ano e em quantos meses o projeto se paga, usando `dados.valorCentavos`);
  - as setas apertadas nele vão para o hub como `tecla`;
  - ele aceita mensagens só de `window.parent`.

- [ ] **Testes:**
  - "lê a pronta com ações e campos; sem ações vira []";
  - "recusa mensagem sem mectria: 1, tipo desconhecido, slides 0 ou 61";
  - "corta: dor de 201 caracteres, número infinito e 21 números são recusados";
  - "aplicarEvento: marcar a mesma dor duas vezes deixa uma; desmarcar tira; preço troca a etapa";
  - "lerInteracoes recusa 21 dores";
  - "o exemplo avisa pronta com 13 slides, a ação revelar-preco e os campos horas-paradas e custo-hora";
  - "o exemplo mostra o slide pedido e a empresa dos dados";
  - "clicar numa dor do exemplo manda o evento dor marcada";
  - "acionar revelar-preco três vezes manda as etapas 1, 2 e 3";
  - "calcular manda o evento calculadora com os números".
- [ ] RED, implementação, GREEN, commit `git commit -m "Define o contrato das apresentações em HTML e converte a de exemplo"`

### Task 5: Proposta e diagnóstica leem o serviço do banco

**Files:**
- Modify:
  - `hub/compartilhado/proposta.ts`;
  - `hub/compartilhado/diagnostica.ts`;
  - `hub/compartilhado/oportunidade.ts` (`FichaCompleta.perguntasDoServico`);
  - `hub/servidor/proposta.ts`, `hub/servidor/diagnostica.ts`, `hub/servidor/exportar.ts`, `hub/servidor/validacao.ts`;
  - as rotas que validam serviço: nova diagnóstica, nova proposta e `variaveis`;
  - `functions/api/reunioes/[id]/andamento.ts`.
- Delete: `hub/compartilhado/dados/servicos.ts`. Quem usava a lista passa a ler o banco; o teste de `cadencia.test.ts` que contava os 12 vai para `servicosDaCarta()`.
- Tests:
  - `compartilhado/proposta.test.ts`, `compartilhado/diagnostica.test.ts`;
  - `servidor/proposta.test.ts`, `servidor/exportar.test.ts`;
  - `servidor/rotas/fase4.test.ts`, `servidor/rotas/fase8.test.ts`.

**Interfaces — Consumes:** `Servico`, `buscarServico` e `idsDosServicos` (Tasks 1 e 2); `Interacoes` e `lerInteracoes` (Task 4).

**Interfaces — Produces:**
- `variaveisIniciais(servicoId: string, servico: Pick<Servico, "entregamos" | "ficaComCliente"> | null): VariaveisProposta`.
- `valoresDaProposta(ctx)`: o ctx ganha `servico: Pick<Servico, "nome" | "ancoraValor"> | null`; `servico` e `ancora` saem dele.
- `roteiroPadrao(): SlideDoRoteiro[]`: os 13 da apresentação de exemplo, com fala, dica, pacto e tempo do `PLAYBOOK_PROPOSTA`, e o tempo em minutos.
- `slidesDaProposta(roteiro?: SlideDoRoteiro[] | null): SlideDaProposta[]`:
  - sem roteiro, os 13 de hoje;
  - com roteiro, `rotulo` "" e `linhas` [].
- `apresentacaoDaReuniao(servico: Servico | null): { slides: SlideDaProposta[]; html: string | null }`:
  - com apresentação: `html` = `urlDaApresentacao` e os slides do roteiro do serviço (ou do padrão);
  - sem apresentação: `html` null e os slides de exemplo.
- `dadosDaApresentacao(valores, variaveis): Record<string, string>`: os valores mais `valorCentavos`, quando há valor.
- `Andamento.interacoes?: Interacoes`.
- `SessaoProposta.servico: Servico | null`: o serviço de `variaveis.servico`.
- `roteiroDaDiagnostica(perguntasDoServico: Pergunta[]): Passo[]`.
- `briefingDaFicha(ficha)`: lê `ficha.perguntasDoServico`, com as inativas.
- `FichaCompleta.perguntasDoServico: PerguntaTecnica[]`.
- `valoresDasRespostas` usa só as perguntas da base (as do serviço não têm chave).
- **Validação:**
  - nova diagnóstica e nova proposta recebem `ReadonlySet` de `idsDosServicos(db, { soVendaveis: true })`;
  - `validarVariaveis` recebe o de todos os serviços;
  - `validarAndamento` passa a aceitar qualquer id de slide `/^[a-z0-9-]{1,40}$/` (até 60) e slide de 0 a 59, mais `interacoes` opcional por `lerInteracoes`.
- `salvarAndamento` grava `reunioes.interacoes`, e `sessaoDaProposta` devolve.
- `exportar` pega os nomes de `listarServicos`.

- [ ] **Testes:**
  - "roteiroPadrao tem os 13 slides com as falas do playbook";
  - "slidesDaProposta com roteiro usa o título e o tempo em segundos";
  - "apresentacaoDaReuniao sem apresentação usa o exemplo; com apresentação, o roteiro do serviço, ou o padrão quando ele é null";
  - "a sessão da proposta traz o serviço do banco; editar a âncora muda os valores";
  - "andamento com interações é gravado e volta na sessão";
  - "andamento com id de slide fora do exemplo é aceito; slide 60 dá 400";
  - "marcar diagnóstica com serviço inativo dá 400; o que não existe também";
  - "a preparação de uma proposta cujo serviço foi inativado continua salvando";
  - "a ficha traz as perguntas do serviço; a pergunta inativa continua no briefing e sai do roteiro";
  - "o CSV usa o nome do serviço do banco, também para o inativo".
- [ ] RED, implementação, GREEN, commit `git commit -m "Faz a proposta e a diagnóstica lerem o serviço do banco"`

### Task 6: As telas leem os serviços da API

**Files:**
- Create: `hub/src/servicos/servicos.ts` e `.test.tsx`.
- Modify:
  - `hub/src/teste/ajuda.tsx`: `fingirApi` responde `GET /api/servicos` com `servicosDaCarta()` quando o teste não define a rota;
  - `hub/src/teste/preparar.ts`: `esquecerServicos()` no `afterEach`;
  - `hub/src/telas/followup/comum.ts`: saem `nomeDoServico` e `OPCOES_SERVICO`;
  - `NovaProposta.tsx`, `MarcarDiagnostica.tsx`, `ToqueEmFoco.tsx`, `FollowUp.tsx`, `Briefing.tsx` e `Apresentacoes.tsx` (o seletor da preparação e o catálogo de exemplo);
  - `hub/src/diagnostica/Painel.tsx`, que usa `ficha.perguntasDoServico` sem as inativas.

**Interfaces — Produces:**
- `useServicos(): Servico[] | null`: busca uma vez e guarda para todas as telas.
- `recarregarServicos(): Promise<void>`: avisa quem está usando.
- `esquecerServicos(): void`: só para os testes.
- `nomeDoServico(servicos: Servico[] | null, id: string): string`: "" enquanto carrega; o id se não achar.
- `opcoesDeServico(servicos: Servico[] | null, atual?: string): { valor: string; rotulo: string }[]`:
  - os vendáveis, com " (em estruturação)" no rótulo de quem está em estruturação;
  - mais o atual, mesmo inativo, para a preparação de uma proposta antiga.
- O catálogo de exemplo de Apresentações usa a Climatização da lista; se ela não existir, fica sem nome de serviço.

- [ ] **Testes:**
  - "useServicos busca uma vez para dois componentes";
  - "opcoesDeServico tira o inativo, marca o em estruturação e mantém o atual";
  - "marcar diagnóstica mostra o serviço criado pelo diretor e não mostra o inativo";
  - "o follow-up mostra o nome do serviço vindo da API";
  - "o painel da diagnóstica usa as perguntas técnicas da ficha";
  - "o briefing mostra a resposta de uma pergunta inativa".
- [ ] RED, implementação, GREEN, commit `git commit -m "Faz as telas lerem os serviços da API"`

### Task 7: A janela da apresentação abre o HTML

**Files:**
- Create: `hub/src/apresentacao/QuadroDoHtml.tsx` e `.module.css`.
- Modify:
  - `hub/src/reuniao/canal.ts`;
  - `hub/src/apresentacao/JanelaDaApresentacao.tsx`.
- Tests: `hub/src/apresentacao/janela.test.tsx`, `hub/src/apresentacao/quadro.test.tsx` e `hub/src/reuniao/canal.test.ts`.

**Interfaces — Consumes:** o contrato (Task 4).

**Interfaces — Produces:**
- `type ApresentacaoNaJanela`:
  - `{ tipo: "exemplo"; slides: SlideMontado[] }`;
  - `{ tipo: "html"; url: string; dados: Record<string, string>; interacoes: Interacoes }`.
- `MensagemReuniao` muda:
  - "estado" passa a ser `{ tipo: "estado"; empresa; slide; apresentacao: ApresentacaoNaJanela }`, no lugar de `slides`;
  - novas, do painel para a janela: `{ tipo: "acionar"; acao }` e `{ tipo: "calcular"; valores }`;
  - nova, da janela para o painel: `{ tipo: "apresentacao"; mensagem: Exclude<DaApresentacao, { tipo: "tecla" }> }`.
- `QuadroDoHtml`:
  - props `{ url; titulo; slide; dados; interacoes; aoReceber(m: DaApresentacao): void; ref?: Ref<{ acionar(acao: string): void; calcular(valores: Record<string, number>): void }> }`;
  - desenha `<iframe sandbox="allow-scripts" allow="" referrerPolicy="no-referrer">` ocupando a área;
  - só ouve mensagens com `e.source === iframe.contentWindow`, lidas por `lerMensagemDaApresentacao`;
  - responde a "pronta" com o "estado" mais recente; a troca de slide manda "slide";
  - a troca de `url` recria o iframe.
- A janela:
  - desenha `Slide` no exemplo e `QuadroDoHtml` no html;
  - repassa `tecla` do iframe ao canal como a tecla de hoje, e "pronta" e "evento" como `apresentacao`;
  - leva `acionar` e `calcular` do canal ao iframe;
  - continua sem chamar a API.

- [ ] **Testes:**
  - "a janela com estado html mostra o iframe isolado (sandbox allow-scripts, sem allow-same-origin)";
  - "a pronta do iframe recebe o estado com o slide, os dados e as interações";
  - "mensagem de outra origem (source diferente) é ignorada";
  - "a seta apertada no iframe vira tecla no canal; o evento da dor vira apresentacao no canal";
  - "acionar do canal chega ao iframe";
  - "a janela com estado exemplo continua desenhando os slides de hoje".
- [ ] RED, implementação, GREEN, commit `git commit -m "Abre a apresentação em HTML na janela da reunião"`

### Task 8: O painel controla a apresentação em HTML

**Files:**
- Modify:
  - `hub/src/reuniao/PainelDaProposta.tsx` e `Painel.module.css`;
  - `hub/src/reuniao/andamento.ts`, se a mudança das interações precisar passar pelo `mudar` silencioso.
- Create: `hub/src/reuniao/NaApresentacao.tsx`: as ações e os campos do slide atual, e o que a apresentação contou.
- Tests: `hub/src/reuniao/painel.test.tsx`.

**Interfaces — Consumes:** `apresentacaoDaReuniao`, `dadosDaApresentacao` e `aplicarEvento` (Tasks 4 e 5); as mensagens novas do canal (Task 7).

**O painel:**
- Os slides vêm de `apresentacaoDaReuniao(sessao.servico)`. Com `html`, o "estado" leva `{ tipo: "html", url, dados: dadosDaApresentacao(valores, variaveis), interacoes }`.
- Recebe pela janela:
  - "pronta": guarda os slides, as ações e os campos;
  - "evento": `andamento.mudar` com `aplicarEvento`, gravado com o resto do andamento.
- Mostra (só com `html`):
  - um botão para cada ação do slide atual, que manda `acionar`;
  - um campo numérico para cada campo do slide atual, que manda `calcular` com os números já guardados mais o novo;
  - "Na apresentação": dores marcadas, etapa do preço e os números da calculadora;
  - o alerta "A apresentação tem {n} slides e o roteiro tem {m}. Ajuste o roteiro em Serviços." quando os números não batem;
  - "A seguir" com o título do próximo slide, no lugar da miniatura.

- [ ] **Testes:**
  - "com apresentação própria, o painel usa o roteiro do serviço (fala e número de slides) e manda o estado html";
  - "a pronta com 12 slides para um roteiro de 13 mostra o alerta só no painel";
  - "o botão Revelar o preço manda acionar revelar-preco";
  - "o evento da dor aparece em Na apresentação e vai no próximo andamento salvo";
  - "o campo Horas paradas manda calcular com o número";
  - "sem apresentação própria, o painel continua com os 13 slides de exemplo e a miniatura".
- [ ] RED, implementação, GREEN, commit `git commit -m "Faz o painel controlar a apresentação em HTML"`

### Task 9: Tela Serviços: lista e edição

**Files:**
- Modify:
  - `hub/compartilhado/permissoes.ts`: `Secao` ganha `"servicos"` (rótulo "Serviços", caminho `/servicos`, fase 8, só o diretor), no fim de `SECOES`;
  - `hub/compartilhado/icones.ts` e `hub/src/componentes/Icone.tsx`: o ícone `servicos`;
  - `hub/src/App.tsx`: as rotas `servicos` e `servicos/:id` (`novo` cria).
- Create:
  - `hub/src/telas/servicos/Servicos.tsx`: a lista, com nome, sigla, situação, "Apresentação própria" ou "Exemplo", número de perguntas e "Novo serviço";
  - `hub/src/telas/servicos/EditarServico.tsx` e `.module.css`: os dados, com dores, entregamos e fica com o cliente em textos de um item por linha;
  - `hub/src/telas/servicos/EditorDePerguntas.tsx`:
    - texto, tipo, opções (uma por linha), dica e bloco;
    - subir e descer;
    - "Desativar" e "Reativar" para a pergunta salva; "Remover" só para a nova;
    - o id da pergunta nova é `{sigla em minúsculas}-{6 letras aleatórias}`;
  - `hub/src/telas/servicos/EditorDoRoteiro.tsx`:
    - "Usa o roteiro padrão (13 slides)", com "Personalizar o roteiro", que copia o `roteiroPadrao()`;
    - para cada slide: título, fala, dica, pacto (Nenhum ou um dos 6) e tempo em minutos;
    - subir, descer, remover e "Adicionar slide";
    - "Voltar ao roteiro padrão";
  - `hub/src/telas/servicos/servicos.test.tsx`.
- Salvar manda o serviço inteiro (POST ou PUT), avisa "Serviço salvo." e chama `recarregarServicos()`.

- [ ] **Testes:**
  - "o closer não vê Serviços no menu e /servicos mostra sem acesso";
  - "a lista mostra os 12 com a situação; Emissão de Carbono em estruturação";
  - "criar um serviço manda nome, sigla e as dores linha a linha";
  - "adicionar pergunta de opções manda as opções; a pergunta salva tem Desativar e não Remover";
  - "personalizar o roteiro traz os 13 slides; mudar o tempo e salvar manda o roteiro";
  - "voltar ao roteiro padrão manda roteiro null";
  - "erro do servidor (409) aparece no formulário".
- [ ] RED, implementação, GREEN, commit `git commit -m "Cria a tela Serviços para o diretor editar os serviços"`

### Task 10: A apresentação na tela Serviços e no catálogo

**Files:**
- Create:
  - `hub/src/apresentacao/VistaDaApresentacao.tsx`: `QuadroDoHtml` com Anterior e Próximo, as ações e os campos do slide, "Slide i de n", o alerta de roteiro diferente e o que a apresentação contou. Usa dados de exemplo: empresa "Cliente de exemplo", `variaveisIniciais` do serviço, sem respostas.
- Modify:
  - `hub/src/telas/servicos/EditarServico.tsx`, seção "Apresentação de proposta" (só para o serviço salvo):
    - o arquivo atual (nome, tamanho, versão, enviada em e por), ou "Sem apresentação própria: a reunião usa a de exemplo.";
    - "Enviar apresentação (.html)", que lê o arquivo com `file.text()` e confere o tamanho antes de enviar;
    - "Ver a apresentação", em modo foco;
    - "Remover apresentação", com confirmação;
  - `hub/src/telas/Apresentacoes.tsx`: o catálogo ganha um cartão por serviço com apresentação própria, com "Ver", e sai o "Uma proposta por serviço" de "ainda vem".
- Tests: `hub/src/telas/servicos/servicos.test.tsx` e `hub/src/telas/Apresentacoes.test.tsx`.

- [ ] **Testes:**
  - "enviar um .html manda arquivo e html e mostra a versão nova";
  - "arquivo de mais de 5 MB é recusado na tela, sem chamar a API";
  - "remover pede confirmação e manda DELETE";
  - "Ver a apresentação abre o iframe do serviço, e Próximo passa o slide";
  - "o catálogo mostra o cartão do serviço com apresentação própria".
- [ ] RED, implementação, GREEN, commit `git commit -m "Permite enviar e ver a apresentação de cada serviço"`

### Task 11: Ponta a ponta e documentação

- [ ] **Semente (`e2e/semente.sql`):**
  - volta os serviços ao estado da migração: apaga os que não são da carta e limpa a apresentação e o roteiro de Desenvolvimento de Produto;
  - cria "Prensa Nova" (Desenvolvimento de Produto), com a proposta marcada para hoje com o Carlos, a diagnóstica concluída com a dor e as variáveis preparadas (valor 24.000,00, prazo e time).
- [ ] **`e2e/fase8.spec.ts`:**
  - a diretora cria um serviço com uma pergunta, e a Helena o vê ao marcar a diagnóstica;
  - a diretora envia o `exemplo.html` para Desenvolvimento de Produto e vê a apresentação;
  - o endereço da apresentação vem com `sandbox allow-scripts`, conferido por `page.request`;
  - o Carlos conduz a reunião da Prensa Nova: a janela mostra a apresentação em HTML, a seta passa o slide nos dois lados, a dor clicada aparece no painel, "Revelar o preço" mostra o valor na janela e o campo da calculadora muda o número na janela.
- [ ] **Documentação:**
  - `hub/README.md`: serviços, apresentações e o contrato;
  - `hub/IMPLANTACAO.md`: criar o namespace KV e trocar o `PREENCHER`;
  - `docs/07`: as decisões da fase 8, "a confirmar";
  - `docs/03`: a tarefa nova da fase 8;
  - `docs/15`, seção 12: o que ficou pronto.
- [ ] `npm run typecheck && npm test && npm run e2e` verdes; commit `git commit -m "Testa a fase 8 de ponta a ponta e atualiza a documentação"`

## Fora desta fase

- O conteúdo das apresentações de verdade (Diagnóstica, Desenvolvimento de Produto e Desenho Técnico): números verificáveis, professores, cases e política comercial (pedidos em `docs/14`).
- A apresentação da diagnóstica em HTML, com a janela na diagnóstica.
- Histórico de versões das apresentações, com volta para uma anterior.
- O celular como controle da reunião (fase 5).
- Os menores adiados das revisões das fases 6 e 7.
