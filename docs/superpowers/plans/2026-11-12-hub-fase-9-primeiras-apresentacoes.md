# Hub comercial · Fase 9 (as primeiras apresentações: diagnóstica, Desenvolvimento de Produto e Desenho Técnico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** As três primeiras apresentações em HTML, com a identidade do site novo: a da diagnóstica (igual para todos) e as de proposta de Desenvolvimento de Produto e de Desenho Técnico. Para a diagnóstica, o hub ganha a apresentação geral, enviada pelo diretor, e o painel da diagnóstica passa a abrir a janela do cliente, com a apresentação acompanhando o roteiro sozinha.

**Architecture:**
- **Kit das apresentações** em `hub/apresentacoes/fonte/`: um CSS e um JS comuns (o contrato da fase 8, a escala, os slides, as teclas e o preenchimento dos textos) e um arquivo por apresentação. O script `npm run apresentacoes` monta cada uma num `.html` só, com tudo dentro, em `hub/apresentacoes/`. É esse arquivo que o diretor envia.
- **Apresentação geral da diagnóstica:** migração `0009` (tabela `apresentacoes_gerais`, com a linha `diagnostica`), as rotas `/api/apresentacoes` e `/api/apresentacoes/diagnostica?v=N` (a mesma proteção da fase 8) e a seção no topo de Serviços.
- **Painel da diagnóstica:** "Abrir apresentação" usa a mesma janela e o mesmo canal da proposta. Cada passo do roteiro corresponde a um slide, e o painel manda o bloco atual nos dados.
- **Roteiros de Desenvolvimento de Produto e de Desenho Técnico:** ficam em `hub/apresentacoes/roteiros/*.json` e entram no banco pela migração `0010` (só onde o diretor ainda não personalizou).

**Tech Stack:** a mesma, sem dependências novas. As animações são SVG e CSS, sem biblioteca 3D.

**Spec:**
- `docs/07-decisoes-e-pendencias.md`: as linhas "Apresentações em HTML interativo, conectadas ao hub", "Serviços da MecTRIA" (as primeiras são Desenvolvimento de Produto e Desenho Técnico, junto com a da diagnóstica) e "As apresentações seguem a identidade do site novo" (12/11/2026).
- `docs/15-hub-template.md`, seção 6: na diagnóstica, a apresentação é curta e igual para todos.
- `docs/16-pitch-e-fups.md`, seção 1: a fala da jornada de parcerias entra no slide de valor × preço, antes do preço.
- `hub/apresentacoes/CONTRATO.md`: o contrato da fase 8.

## Decisões deste plano (a confirmar pelo Lucas)

1. **Fontes:** Inter Tight (títulos e texto) e IBM Plex Mono (rótulos), pelo Google Fonts, que o isolamento da fase 8 permite. Quando o código do site chegar, troca-se pelas dele no kit, sem mexer nas apresentações.
2. **Visual:** o destaque é o vermelho da MecTRIA (#c8102e, a conferir com o site). O "do papel à peça" vira desenho técnico animado em SVG: as linhas se desenham e a peça se completa. O motor 3D do site fica para quando houver o código dele.
3. **A apresentação da diagnóstica acompanha o roteiro sozinha, sem setas próprias.** O vendedor só passa as perguntas, como hoje. São 5 slides:
   - "agenda" no acordo de agenda;
   - "quem-somos" no "Quem somos, em 1 minuto";
   - "escuta" durante GPCTBA + C&I e as perguntas técnicas, com o bloco atual em destaque ("Objetivos", "Planos"...);
   - "como-trabalhamos" (do papel à peça) no escopo geral;
   - "proximo-passo" no fechamento.
4. **Apresentação geral:** é só a da diagnóstica, por enquanto; o portfólio fica para depois. O diretor envia no topo de Serviços, com o mesmo envio, vista e remoção dos serviços. Sem ela, a diagnóstica continua sem janela.
5. **Propostas de Desenvolvimento de Produto e Desenho Técnico:**
   - os mesmos 13 slides do roteiro padrão, com o conteúdo de cada serviço;
   - o roteiro de cada uma vem da migração `0010`; a fala de valor × preço traz a jornada de parcerias de `docs/16`, com o pacto "Combinado?".
6. **Investimento sem a política comercial:**
   - mostra o valor e as condições que o closer preparou (campo "Condições" da preparação), em 3 etapas: o mercado, a jornada e o valor;
   - parcelas e desconto fixos ficam fora até a política existir.
7. **Calculadoras:**
   - Desenvolvimento de Produto: horas por mês no processo manual × custo da hora, que dá o custo do ano e em quantos meses o projeto se paga;
   - Desenho Técnico: retrabalhos por mês × custo de cada retrabalho, a mesma conta.
8. **O que ainda não chegou** aparece como `[rótulo]`: professores (prova social), cases e depoimentos. Os números são os do site.

## Global Constraints

- Tudo da fase 8 continua valendo:
  - o contrato (`CONTRATO.md`): mensagens só de `window.parent`, `mectria: 1` e os limites;
  - um `.html` só, de até 5 MB, sem chamar a internet;
  - nenhum dado do cliente sai da apresentação.
- Os textos que vêm do site ("Antes de desenhar, a gente escuta.", "Mais do que engenharia: propósito, aprendizado e transformação real.", a missão) e de `docs/16` (a jornada) entram sem mudar uma palavra.
- **Números:** os do site, nunca os errados da call (+R$ 4.860/mês e +R$ 58.320/ano valem só para a tese; R$ 4.950 e R$ 54.900 não aparecem).
- MecTRIA escrito sempre assim. As cores da empresa de marketing do Lucas não entram.
- `[hidden]` sempre com `display: none !important` no fim do CSS do kit (o defeito que o e2e achou na fase 8).
- Cada apresentação montada é igual à que está no repositório: o teste falha se alguém mudar a fonte e esquecer de montar.
- Nunca rodar `playwright install` neste ambiente.

## Review Focus

- **A janela da diagnóstica aberta depois de começar:** pula direto para o slide do passo atual, com o bloco certo. Teste na Task 4.
- **Diagnóstica sem a apresentação geral enviada:** o painel funciona como hoje, sem botão nem erro. Teste na Task 4.
- **Dados que faltam** (sem valor, sem condições, sem dor): a apresentação mostra o `[rótulo]` e não quebra a calculadora (nada de "NaN" nem "R$ 0"). Testes nas Tasks 5 a 7.
- **Roteiro e apresentação desalinhados:** o número e os ids dos slides de cada roteiro batem com os da apresentação. Teste na Task 8.
- **Apresentação montada desatualizada:** o teste do kit compara a montagem com o arquivo do repositório. Teste na Task 1.

---

### Task 1: Kit e montagem das apresentações

**Files:**
- Create:
  - `hub/apresentacoes/fonte/kit.css`: os tokens do visual escuro, o slide 1280 × 720 escalado, rótulo mono, título, contagem "01 / 13", a marca e o `[hidden]` no fim;
  - `hub/apresentacoes/fonte/kit.js`: o contrato;
  - `hub/apresentacoes/montar.mjs`;
  - `hub/src/apresentacao/kit.test.ts`;
  - `hub/src/apresentacao/decks.ts`: o auxiliar de teste que abre uma apresentação montada no JSDOM, como o de `exemplo.test.ts`.
- Modify: `hub/package.json` (o script `apresentacoes`) e `hub/apresentacoes/CONTRATO.md` (seção "Usando o kit").

**Interfaces — Produces:**
- `kit.js` expõe `window.Apresentacao.iniciar(opcoes)`, com `opcoes`:
  - `acoes: AcaoDoSlide[]` e `campos: CampoDoSlide[]`;
  - `aoEstado(estado: { slide, dados, interacoes }): void`, `aoAcionar(acao: string): void`, `aoCalcular(valores): void`.
- Ele também expõe:
  - `Apresentacao.enviar(evento)`, que manda `{ mectria: 1, tipo: "evento", ... }`;
  - `Apresentacao.dados()`;
  - `Apresentacao.preencher()`, que preenche `[data-modelo]` com `{chave}` e mostra `[rótulo]` com os rótulos do hub para o que falta;
  - `Apresentacao.reais(n)`.
- O kit cuida sozinho de:
  - os slides `[data-slide]`, com `data-ativo="sim"` e `hidden`;
  - a escala;
  - as setas (manda `tecla`, a não ser num `input`);
  - a `pronta`, com o número de slides.
- `montar.mjs`:
  - lê cada `fonte/*.html` que não é o kit;
  - troca `<!-- kit:css -->` e `<!-- kit:js -->` pelo conteúdo do kit;
  - grava `apresentacoes/<nome>.html`;
  - exporta `montar(nome): string` para o teste.
- `abrirDeck(html)` em `decks.ts` devolve `{ janela, doc, recebidas, enviar, esperar }`.

- [ ] **Testes:**
  - "cada apresentação montada é igual à do repositório";
  - "o kit avisa a pronta com o número de slides e as ações";
  - "o kit preenche {chave} e mostra o rótulo do hub no que falta";
  - "só o slide atual fica visível (estilo computado)";
  - "a seta vira tecla, menos dentro de um campo";
  - "mensagem que não vem de window.parent é ignorada".
  Use uma apresentação mínima de teste, em `fonte/teste.html`, montada só pelo teste.
- [ ] RED, implementação, GREEN, commit `git commit -m "Cria o kit das apresentações em HTML e a montagem"`

### Task 2: Apresentação geral da diagnóstica no servidor

**Files:**
- Create:
  - `hub/migrations/0009_apresentacoes_gerais.sql`: a tabela `apresentacoes_gerais (id TEXT PRIMARY KEY CHECK (id IN ('diagnostica')), apresentacao TEXT, apresentacao_versao INTEGER NOT NULL DEFAULT 0, atualizado_em, atualizado_por TEXT)`, com a linha `diagnostica`;
  - `hub/functions/api/apresentacoes/index.ts`: GET, qualquer cargo, devolve `[{ id, apresentacao }]`;
  - `hub/functions/api/apresentacoes/[id].ts`: GET `?v=N` (o HTML isolado), PUT e DELETE só o diretor.
- Modify:
  - `hub/servidor/apresentacoes.ts`: as funções recebem o lugar, `{ tabela: "servicos" | "apresentacoes_gerais"; id }`, e a chave do KV vira `apresentacao/{id}/{v}` ou `geral/{id}/{v}`;
  - `hub/servidor/protecao.ts`: `/api/apresentacoes/{id}` também abre em quadro;
  - `hub/compartilhado/servico.ts`: `urlDaApresentacaoGeral(id, arquivo)`.
- Tests: `hub/servidor/rotas/fase9.test.ts` e `hub/servidor/rotas/protecao.test.ts`.

**Interfaces — Produces:**
- `ApresentacaoGeral { id: "diagnostica"; apresentacao: ArquivoDaApresentacao | null }`.
- `GET /api/apresentacoes` → `ApresentacaoGeral[]`.

- [ ] **Testes:**
  - "o diretor envia a apresentação da diagnóstica; o hunter lê a lista e o HTML com o cabeçalho isolado";
  - "a versão da diagnóstica fica na chave dela e não mistura com a de um serviço";
  - "o closer não envia (403)";
  - "id que não é diagnostica dá 404";
  - "a API da diagnóstica abre em quadro; o resto da API, não".
- [ ] RED, implementação, GREEN, commit `git commit -m "Guarda a apresentação geral da diagnóstica"`

### Task 3: A apresentação da diagnóstica na tela Serviços

**Files:**
- Modify:
  - `hub/src/telas/servicos/ApresentacaoDoServico.tsx` vira `ApresentacaoEmHtml.tsx`, com as props `{ titulo, caminho, arquivo, aoMudar, vista }`;
  - `hub/src/apresentacao/VistaDaApresentacao.tsx` recebe `{ url, titulo, dados, totalDoRoteiro | null }`, e a montagem dos dados de exemplo do serviço sai para quem chama;
  - `hub/src/telas/servicos/Servicos.tsx`: no topo, o cartão "Apresentação da diagnóstica (igual para todos)", com envio, vista e remoção.
- Tests: `hub/src/telas/servicos/servicos.test.tsx` (os da fase 8 continuam passando).

- [ ] **Testes:**
  - "o diretor envia a apresentação da diagnóstica no topo de Serviços";
  - "Ver a apresentação da diagnóstica abre com dados de exemplo e sem alerta de roteiro".
- [ ] RED, implementação, GREEN, commit `git commit -m "Permite enviar a apresentação da diagnóstica em Serviços"`

### Task 4: O painel da diagnóstica abre a janela

**Files:**
- Modify:
  - `hub/compartilhado/diagnostica.ts` e `hub/compartilhado/oportunidade.ts` (`FichaCompleta.servicoNome`);
  - `hub/servidor/diagnostica.ts` (`fichaDaReuniao` traz o nome do serviço);
  - `hub/src/diagnostica/Painel.tsx` e `Painel.module.css`.
- Tests: `hub/compartilhado/diagnostica.test.ts`, `hub/servidor/rotas/fase9.test.ts` e `hub/src/diagnostica/painel.test.tsx`.

**Interfaces — Produces:**
- `SLIDES_DA_DIAGNOSTICA = ["agenda", "quem-somos", "escuta", "como-trabalhamos", "proximo-passo"] as const`.
- `slideDoPasso(passo: Passo): number`:
  - `abertura-1` → 0 e `abertura-2` → 1;
  - grupos `bloco` e `tecnica` → 2;
  - `escopo` → 3; `fechamento` → 4.
- `dadosDaDiagnostica(ficha, passo): Record<string, string>`:
  - `empresa`, `contato` (primeiro nome) e `data`;
  - `etapa`: o título do bloco, "Técnico" ou "Escopo";
  - `etapas`: os títulos dos blocos GPCTBA + C&I, separados por "\n";
  - `servico`: o nome do serviço, da ficha.
- `FichaCompleta` ganha `servicoNome: string`.
- O painel:
  - busca `GET /api/apresentacoes`; com a da diagnóstica, mostra "Abrir apresentação" e o lembrete de qual janela compartilhar;
  - manda pelo canal `{ tipo: "estado", empresa, slide: slideDoPasso(atual), apresentacao: { tipo: "html", url, dados: dadosDaDiagnostica(...), interacoes: INTERACOES_VAZIAS } }` na `pronta` e a cada troca de passo;
  - avisa a janela no fim (`fim`);
  - mantém as setas como hoje (passam as perguntas).

- [ ] **Testes:**
  - "slideDoPasso leva a abertura, os blocos, o escopo e o fechamento aos 5 slides";
  - "dadosDaDiagnostica traz a etapa do bloco atual";
  - "com a apresentação da diagnóstica, o painel abre a janela e manda o slide do passo atual";
  - "a janela aberta no meio da diagnóstica recebe o slide e a etapa do passo atual";
  - "sem a apresentação da diagnóstica, o painel não mostra o botão nem dá erro";
  - "encerrar a diagnóstica fecha a janela".
- [ ] RED, implementação, GREEN, commit `git commit -m "Faz o painel da diagnóstica abrir a apresentação"`

### Task 5: A apresentação da diagnóstica

**Files:**
- Create:
  - `hub/apresentacoes/fonte/diagnostica.html`, montada em `hub/apresentacoes/diagnostica.html`;
  - `hub/src/apresentacao/diagnostica.test.ts`.

**Conteúdo (5 slides):**
- **agenda:** "Diagnóstica · {empresa}", os 40 minutos em três tempos (entender, mostrar como trabalhamos, decidir juntos se faz sentido) e a data.
- **quem-somos:**
  - o bloco "Quem somos" do site, sem mudar o texto: o título, os dois parágrafos e a missão;
  - as faixas UFTM, FEJEMG, NÚCLEO TRIÂNGULO e BRASIL JÚNIOR;
  - os quatro números do site.
- **escuta:**
  - "Antes de desenhar, a gente escuta." (do site);
  - a lista das etapas da diagnóstica (`dados.etapas`), com a atual (`dados.etapa`) em destaque e as anteriores marcadas como feitas.
- **como-trabalhamos:** "Do papel à peça", com as 4 etapas (Diagnóstico, Modelo, Simulação, Desenho) e o desenho técnico que se desenha em SVG.
- **proximo-passo:** "O próximo passo: a proposta", com o que acontece até a apresentação da proposta (o time de projetos monta e a gente volta com o projeto e o investimento).

- [ ] **Testes:**
  - "avisa a pronta com 5 slides";
  - "o slide escuta destaca a etapa atual e marca as anteriores";
  - "sem etapas nos dados, o slide escuta não quebra";
  - "os textos do site entram sem mudar uma palavra".
- [ ] RED, implementação, `npm run apresentacoes`, GREEN, commit `git commit -m "Cria a apresentação da diagnóstica"`

### Task 6: A proposta de Desenvolvimento de Produto

**Files:**
- Create:
  - `hub/apresentacoes/fonte/desenvolvimento-de-produto.html`, montada;
  - `hub/apresentacoes/roteiros/desenvolvimento-de-produto.json`: 13 `SlideDoRoteiro`, com os ids do roteiro padrão;
  - `hub/src/apresentacao/desenvolvimento-de-produto.test.ts`.

**Conteúdo:** os 13 slides do roteiro padrão, com o visual do site.
- **capa:** "Proposta para {empresa}", {servico} e {data}.
- **proposito:** o "Mais do que engenharia" do site.
- **numeros:** os quatro do site.
- **time:**
  - {equipe};
  - "[professores orientadores]";
  - "Com o apoio de professores doutores" (do site).
- **ceu-inferno:** as dores clicáveis, a do cliente ({dor}) e as do serviço (`doresDoServico`), com "Se ficar como está: {impacto}" e "Com o projeto: {objetivo}".
- **metodo:**
  - "Do papel à peça", com as etapas do método de Desenvolvimento de Produto da carta;
  - a máquina que passa do traço ao sólido em SVG;
  - "Entregamos: {entregamos}", "Fica com vocês: {fica}" e "Prazo: {prazoProjeto}".
- **valor-preco:**
  - "Feito por {ancora}: [valor de mercado]";
  - a jornada de parcerias em 3 tópicos (sem pró-labore, o case do membro, o sim ou não em 7 dias).
- **provas:** "[Caso de Desenvolvimento de Produto, com autorização do cliente]" e "[Depoimento]".
- **investimento:** o preço em 3 etapas pela ação `revelar-preco` (o mercado, a jornada e {valor} com {condicoes}) e a calculadora de horas no processo manual.
- **fechamento:** os próximos passos e o sim ou não até {data_decisao}, ou "em até 7 dias" quando não houver data.
- As ações são `dor-1` a `dor-4` e `revelar-preco`; os campos, `horas-manuais` e `custo-hora`.
- **Roteiro:** as falas do playbook. A de valor × preço tem a jornada de `docs/16` palavra por palavra, termina em "Combinado?" e tem o pacto "valor". As falas de método e investimento citam o serviço.

- [ ] **Testes:**
  - "avisa a pronta com os 13 slides do roteiro, as ações e os campos";
  - "o roteiro tem 13 slides com os ids do padrão e a jornada de parcerias na fala de valor × preço";
  - "a calculadora sem valor do projeto mostra o custo do ano e não o payback, sem NaN";
  - "revelar o preço três vezes mostra o mercado, a jornada e o valor com as condições";
  - "sem condições, o investimento mostra só o valor".
- [ ] RED, implementação, `npm run apresentacoes`, GREEN, commit `git commit -m "Cria a proposta de Desenvolvimento de Produto"`

### Task 7: A proposta de Desenho Técnico

**Files:**
- Create:
  - `hub/apresentacoes/fonte/desenho-tecnico.html`, montada;
  - `hub/apresentacoes/roteiros/desenho-tecnico.json`;
  - `hub/src/apresentacao/desenho-tecnico.test.ts`.

**Conteúdo:** a mesma estrutura da Task 6, com:
- o método e o que entregamos de Desenho Técnico da carta;
- a animação de uma folha de desenho com vistas e cotas se desenhando;
- a calculadora de retrabalho (campos `retrabalhos-mes` e `custo-retrabalho`).

- [ ] **Testes:** os mesmos cinco da Task 6, com os campos de Desenho Técnico.
- [ ] RED, implementação, `npm run apresentacoes`, GREEN, commit `git commit -m "Cria a proposta de Desenho Técnico"`

### Task 8: Os roteiros entram no banco

**Files:**
- Create:
  - `hub/migrations/0010_roteiros_dp_dt.sql`, gerada a partir dos dois JSON por um script no scratchpad: `UPDATE servicos SET roteiro = ?, atualizado_por = 'Triângulo' WHERE id = ? AND roteiro IS NULL`;
  - `hub/src/apresentacao/roteiros.test.ts`.
- Tests: `hub/servidor/servicos.test.ts`.

- [ ] **Testes:**
  - "a migração 0010 grava os roteiros de Desenvolvimento de Produto e de Desenho Técnico iguais aos JSON";
  - "um roteiro já personalizado pelo diretor não é sobrescrito" (a coluna preenchida antes da migração);
  - "cada roteiro passa no validarServico e tem os mesmos ids e o mesmo número de slides da apresentação montada".
- [ ] RED, implementação, GREEN, commit `git commit -m "Leva os roteiros de Desenvolvimento de Produto e Desenho Técnico para o banco"`

### Task 9: Ponta a ponta e documentação

- [ ] **Semente:** limpa a apresentação geral da diagnóstica e volta os roteiros de Desenvolvimento de Produto e Desenho Técnico aos da migração 0010.
- [ ] **`e2e/fase9.spec.ts`:**
  - a diretora envia `diagnostica.html` no topo de Serviços;
  - a Helena abre a diagnóstica da Solda Hunter: a janela mostra a agenda, e "Escuta" com "Objetivos" quando ela chega ao bloco G;
  - a diretora envia `desenvolvimento-de-produto.html`, e o Carlos conduz a Prensa Nova até o investimento revelado.
  - Na janela, só um slide fica visível e cada um cabe em 1280 × 720.
- [ ] **Documentação:**
  - `hub/README.md` e `hub/apresentacoes/CONTRATO.md` (o kit e como montar);
  - `docs/07` (as decisões da fase 9, "a confirmar") e `docs/03` (a tarefa nova);
  - `docs/18-roteiro-da-demo.md` (a parte nova da demo).
- [ ] `npm run typecheck && npm test && npm run e2e` verdes; commit `git commit -m "Testa a fase 9 de ponta a ponta e atualiza a documentação"`

## Fora desta fase

- O motor 3D do site e as fontes exatas dele (quando o código do site chegar).
- Os professores, os cases e a política comercial (pedidos em `docs/14`); até lá, ficam como `[rótulo]`.
- As apresentações dos outros 10 serviços e o portfólio.
- Os menores adiados da fase 8.
