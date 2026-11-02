# Hub comercial · Fase 3 (Diagnóstica) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O closer conduz a reunião diagnóstica inteira pelo hub: abre pela agenda (Reuniões), faz as perguntas GPCTBA + C&I e as técnicas do serviço uma de cada vez no painel, anota livremente com marcações, fecha com o próximo passo obrigatório e gera o briefing em PDF para Projetos. Junto, a seção Playbooks (consulta) e a busca de clientes, roteiros e objeções.

**Architecture:** Mesma estrutura das fases 1 e 2. O conteúdo da diagnóstica, dos serviços, das objeções e dos playbooks da versão 0.2 vai para `hub/compartilhado/dados/`, sem mudar o texto. As regras puras do roteiro e do briefing ficam em `hub/compartilhado/diagnostica.ts`. O banco ganha `fichas`, `anotacoes` e `pendencias` (migração `0003`), com a lógica em `hub/servidor/diagnostica.ts`. O painel guarda tudo no computador (localStorage) e sincroniza com o servidor a cada poucos segundos.

**Tech Stack:** a mesma, sem dependências novas. O PDF sai pela impressão do navegador ("Salvar como PDF"), a partir de uma página própria do briefing.

**Spec:** `docs/15-hub-template.md` (seções 5, 6 "Na diagnóstica", 8, 9, 10 e 11, fase 3). Registros das fases 1 e 2 em `docs/superpowers/registros/`.

## Decisões deste plano (o Lucas confirma)

1. **Uma janela na fase 3.** A diagnóstica roda no painel em tela cheia, em modo foco. A apresentação curta numa segunda janela entra com o motor de duas janelas, na fase 4.
2. **PDF pela impressão do navegador.** O briefing tem uma página própria, já formatada em A4 e no visual claro do manual da MecTRIA. O botão "Gerar PDF" abre o "Salvar como PDF" do navegador. Assim não entra nenhuma biblioteca nova.
3. **Rascunho no computador.** Respostas e anotações ficam no localStorage, por reunião, e vão para o servidor a cada 5 segundos. Sem internet, aparece "Sem internet · salvo neste computador", e o painel sincroniza sozinho quando a conexão volta (spec, seção 9).
4. **Pendência técnica.** Cada anotação marcada como "Técnico" vira uma pendência para Projetos, com prazo no próximo dia útil, porque a estimativa técnica sai no Dia 1. A tela de Projetos que responde às pendências chega na fase 6.
5. **Motivos de "não qualificou":** Sem orçamento; Sem urgência; Fora do que a MecTRIA faz; Quem decide não participa; Só pesquisando preço; Outro. Ficam no arquivo de dados, para o Marcelo validar.
6. **Conteúdo dos Playbooks:** o da versão 0.2, como rascunho até a validação com a MecTRIA (pendência 17 do `docs/07`).

## Global Constraints

- Tudo das fases 1 e 2 continua valendo (pt-BR, MecTRIA, versões fixas, sem `playwright install`, fuso de São Paulo, centavos, um botão vermelho por tela, nada é apagado, nenhum e-mail real).
- Conteúdo migrado de `hub-comercial/js/dados/` (`diagnostica.js`, `servicos.js`, `objecoes.js`, `proposta.js`, `cold-call.js`) sem mudar uma palavra. Arquivos gerados executando o JS da versão 0.2, como na fase 2.
- Roteiro da diagnóstica, nesta ordem:
  1. abertura (2 passos);
  2. blocos G, P, C, T, B, A e C&I (23 perguntas);
  3. perguntas técnicas do serviço (blocos `escopo` e `parametros`);
  4. escopo geral (4 perguntas);
  5. fechamento.
- Marcações de anotação: `objecao`, `tecnico`, `escopo`, `proximo_passo` (ou nenhuma).
- Fechamento obrigatório da diagnóstica:
  - **proposta marcada:** data e hora da apresentação, formato e quem decide. Cria a reunião de proposta, e a oportunidade vai para `proposta_marcada`;
  - **não qualificou:** um dos motivos da decisão 5. A oportunidade vai para `nutricao`.
- Atalhos no painel: setas (pergunta anterior e próxima), N (anotar), Esc (sair do campo; com o campo fechado, pede confirmação para sair do painel). Enquanto um campo de texto está em foco, as setas e o N não fazem nada.
- Permissões: só o closer dono da oportunidade (ou o diretor) abre, edita e encerra a ficha. O hunter vê as reuniões que marcou, mas não abre a ficha. Projetos não usa nada desta fase.

## Review Focus

- **Internet cai no meio da diagnóstica:** a resposta digitada continua na tela e no localStorage; quando a conexão volta, ela vai para o servidor sem duplicar. Testes nas Tasks 4 e 6.
- **Duas abas na mesma ficha:** a última alteração de cada pergunta vale (o servidor grava por pergunta), e nada se perde. Teste na Task 3.
- **Sair sem fechamento:** fechar o painel não encerra a reunião; ela fica `em_andamento` e volta no mesmo ponto. Encerrar sem resultado dá 400. Testes nas Tasks 3 e 6.
- **N e setas enquanto digita:** escrever "N" ou usar as setas dentro de uma resposta não abre anotação nem muda de pergunta. Teste na Task 6.
- **Serviço sem perguntas técnicas** (Emissão de Carbono, 0 perguntas): o roteiro pula direto para o escopo geral, sem passo vazio. Teste na Task 2.

---

### Task 1: Conteúdo da fase 3

**Files:** Create `hub/compartilhado/dados/{diagnostica,servicos-completos,objecoes,playbooks}.ts`, `hub/compartilhado/dados/conteudo.test.ts`. Modify `hub/compartilhado/dados/cold-call.ts` (acrescenta `ANTES_COLD_CALL`, `GATEKEEPER`, `TENTATIVAS_COLD_CALL`, `META_COLD_CALL_TEXTO`).

**Interfaces — Produces:**
- `DIAGNOSTICA: { duracao: string; origens: string[]; formatos: string[]; preparacao: string[]; abertura: { titulo: string; fala: string; dica?: string }[]; blocos: BlocoDiagnostica[]; escopoGeral: Pergunta[]; fechamento: { resumo; pacto; pactoDica; agendamento; agendamentoDica }; depois: string[]; resumoCliente: string }`;
- `type Pergunta = { id: string; chave?: string; tipo: "texto" | "curto" | "opcoes" | "numero"; texto: string; opcoes?: string[]; dica?: string; bloco?: string }`, `BlocoDiagnostica = { id; letra; titulo; briefing: "contexto" | "comercial" | "decisao"; intro; perguntas: Pergunta[] }`;
- `SERVICOS_COMPLETOS` (os 12, com todos os campos de `servicos.js`); `OBJECOES` (24), `ETAPAS_OBJECAO`; `PLAYBOOK_PROPOSTA` (`PROPOSTA` da 0.2); `MOTIVOS_NAO_QUALIFICOU` (decisão 5).

- [ ] **Step 1: Teste que falha** (`conteudo.test.ts`): `DIAGNOSTICA.blocos.map(b => b.letra)` é `["G","P","C","T","B","A","C&I"]`, e a soma das perguntas dá 23; `SERVICOS_COMPLETOS` tem 12, e o de `emissao-de-carbono` tem 0 perguntas; `OBJECOES` tem 24 e todas têm `objecao` e `contorno`; `MOTIVOS_NAO_QUALIFICOU` tem os 6 da decisão 5.
- [ ] **Step 2: Rodar** `cd hub && npx vitest run compartilhado/dados`. Expected: FAIL.
- [ ] **Step 3: Gerar** os arquivos executando o JS da 0.2 (como na fase 2) e escrever `MOTIVOS_NAO_QUALIFICOU`.
- [ ] **Step 4: Rodar** de novo. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Migra o conteúdo da diagnóstica, dos serviços, das objeções e dos playbooks"`

---

### Task 2: Regras do roteiro e do briefing

**Files:** Create `hub/compartilhado/diagnostica.ts`, `hub/compartilhado/diagnostica.test.ts`.

**Interfaces — Produces:**
- `type Passo = { id: string; grupo: "abertura" | "bloco" | "tecnica" | "escopo" | "fechamento"; letra?: string; titulo: string; pergunta?: Pergunta; fala?: string; dica?: string }`;
- `roteiroDaDiagnostica(servicoId: string): Passo[]` (ordem das Global Constraints; serviço sem perguntas não gera passo técnico);
- `type Respostas = Record<string, string>` (por id de pergunta);
- `valoresDasRespostas(respostas: Respostas): Record<string, string>` (troca o id pela `chave` da pergunta, por exemplo `c-dor` → `dor`);
- `resumoDoFechamento(respostas, contato: string): string` (o `fechamento.resumo`, preenchido com `preencherModelo`);
- `resumoParaCliente(respostas, contato): string` (o `resumoCliente`);
- `briefingDaFicha(ficha: { oportunidade; reuniao; respostas: Respostas; anotacoes: Anotacao[] }): SecaoBriefing[]`, com `SecaoBriefing = { titulo: string; itens: { pergunta: string; resposta: string }[] }`. As seções são "Contexto", "Comercial", "Decisão", "Técnico do serviço", "Escopo" e "Anotações técnicas". Pergunta sem resposta fica de fora, e seção vazia também.

- [ ] **Step 1: Testes que falham:**
  - "roteiro de climatização": começa em 2 passos de `abertura`, depois 23 de `bloco`; os passos `tecnica` são os 7 de climatização; depois 4 de `escopo` e 1 de `fechamento`;
  - "serviço sem perguntas técnicas pula direto ao escopo": `emissao-de-carbono` não tem passo `tecnica`;
  - "resumo do fechamento usa as respostas": com `dor` e `objetivo` respondidos e sem `impacto`, o texto contém a dor e "[" + rótulo + "]" no impacto;
  - "briefing separa por seção e omite o vazio": uma resposta de `b-orcamento` cai em "Comercial"; "Decisão" sem respostas não aparece; anotações `tecnico` aparecem em "Anotações técnicas" com o minuto.
- [ ] **Step 2: Rodar** `cd hub && npx vitest run compartilhado/diagnostica.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.** `VARIAVEIS` ganha os rótulos das chaves da diagnóstica (objetivo, tentativas, dor, porqueAgora, prazo, orcamento, pagamento, concorrencia, decisores, criterio, prazoDecisao, impacto, numeros, ganho, dias, data_proposta).
- [ ] **Step 4: Rodar** de novo. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Monta o roteiro da diagnóstica e o briefing a partir das respostas"`

---

### Task 3: Ficha, anotações e pendências no servidor

**Files:** Create `hub/migrations/0003_diagnostica.sql`, `hub/servidor/diagnostica.ts`, `hub/servidor/diagnostica.test.ts`. Modify `hub/compartilhado/oportunidade.ts` (tipos).

Tabelas:
- `fichas`: `reuniao_id`, `pergunta_id`, `resposta`, `autor_id`, `atualizado_em`, com `UNIQUE (reuniao_id, pergunta_id)`;
- `anotacoes`: `id`, `reuniao_id`, `id_cliente` (único), `minuto`, `passo`, `marcacao` (CHECK nas 4 ou NULL), `texto`, `autor_id`, `criado_em`;
- `pendencias`: `id`, `anotacao_id`, `oportunidade_id`, `texto`, `prazo`, `responsavel_id` (nulo até a fase 6), `situacao` (`aberta` | `respondida` | `fechada`), `resposta`, `criado_em`;
- `reunioes` ganha `iniciada_em`, `encerrada_em`, `resultado` (`proposta_marcada` | `nao_qualificou`), `motivo`, `briefing_enviado_em`.

**Interfaces — Produces:**
- `iniciarReuniao(db, reuniaoId, autor)`: `marcada` → `em_andamento` (idempotente);
- `salvarRespostas(db, reuniaoId, respostas: { perguntaId: string; resposta: string }[], autor)`: upsert por pergunta;
- `salvarAnotacao(db, reuniaoId, a: { idCliente: string; minuto: number; passo: string; marcacao: Marcacao | null; texto: string }, autor)`: idempotente pelo `idCliente`. "Técnico" cria a pendência com prazo no próximo dia útil;
- `fichaDaReuniao(db, reuniaoId): Promise<FichaCompleta | null>` (reunião, oportunidade, respostas, anotações, pendências);
- `encerrarDiagnostica(db, reuniaoId, f: FechamentoDiagnostica, autor)`, com `FechamentoDiagnostica = { resultado: "proposta_marcada"; dataHora: string; formato: "online" | "presencial"; quemDecide: string } | { resultado: "nao_qualificou"; motivo: string }`. Grava o histórico e, na proposta marcada, cria a reunião de proposta;
- `marcarBriefingEnviado(db, reuniaoId)`.

- [ ] **Step 1: Testes que falham:**
  - "iniciar muda para em andamento uma vez só";
  - "respostas: a última alteração de cada pergunta vale, e as outras ficam": duas gravações com perguntas diferentes e depois uma mudando uma delas;
  - "anotação repetida (mesmo idCliente) não duplica";
  - "anotação técnica cria pendência com prazo no próximo dia útil": anotada numa sexta, 13/11/2026, o prazo é segunda, 16/11;
  - "encerrar com proposta marcada cria a reunião de proposta e muda a situação": a reunião fica `concluida`, há uma reunião `proposta` na data dada e a oportunidade vai para `proposta_marcada`;
  - "não qualificou vai para nutrição com o motivo".
- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/diagnostica.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** de novo e a suíte da API. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Grava a ficha, as anotações e as pendências técnicas da diagnóstica"`

---

### Task 4: Rotas da diagnóstica

**Files:**
- Create:
  - `hub/functions/api/reunioes/[id].ts` (GET ficha);
  - `hub/functions/api/reunioes/[id]/iniciar.ts`, `respostas.ts` (PUT), `anotacoes.ts` (POST), `encerrar.ts` (POST) e `briefing.ts` (POST, marca como enviado);
  - `hub/servidor/rotas/fase3.test.ts`.
- Modify: `hub/functions/api/reunioes.ts` (vira `reunioes/index.ts`), `hub/servidor/validacao.ts`.

Regras:
- **Permissões:**
  - o closer dono ou o diretor: tudo;
  - o hunter que marcou: só o GET (ficha sem as respostas);
  - os outros: 403 `sem_permissao`.
- **Respostas:** até 200 por pedido e 2.000 caracteres cada.
- **Encerrar:**
  - sem resultado válido: 400;
  - reunião que não é diagnóstica: 400;
  - reunião já concluída: 409 "Essa reunião já foi encerrada."

- [ ] **Step 1: Testes que falham:** um por regra acima, mais "PUT de respostas repetido não duplica nada".
- [ ] **Step 2: Rodar** `cd hub && npm run test:api -- servidor/rotas/fase3.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a API inteira e o `wrangler pages functions build`. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Abre a API da ficha da diagnóstica"`

---

### Task 5: Rascunho no computador e sincronização

**Files:** Create `hub/src/diagnostica/rascunho.ts`, `hub/src/diagnostica/rascunho.test.ts`.

**Interfaces — Produces:**
- `useRascunho(reuniaoId: number, inicial: { respostas: Respostas; anotacoes: Anotacao[] }): { respostas; anotacoes; responder(perguntaId, texto); anotar(a); estado: "salvo" | "salvando" | "sem_internet" }`;
- grava no localStorage (`hub-diagnostica-{id}`) a cada mudança e manda as pendências a cada 5 s (PUT de respostas e POST de anotações). Quando volta a funcionar, manda o que faltou. Com o localStorage bloqueado, segue só com a memória.

- [ ] **Step 1: Testes que falham** (com `vi.useFakeTimers` e `fetch` falso):
  - "responde, espera 5 s e manda só o que mudou";
  - "sem internet guarda e mostra sem_internet; quando volta, manda e fica salvo";
  - "abrir de novo recupera o rascunho do localStorage antes do servidor responder";
  - "localStorage bloqueado não quebra".
- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/diagnostica`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** de novo. Expected: passam.
- [ ] **Step 5: Commit** `git commit -m "Guarda a diagnóstica no computador e sincroniza com o servidor"`

---

### Task 6: Painel da diagnóstica

**Files:** Create `hub/src/diagnostica/Painel.tsx`, `Pergunta.tsx`, `Anotacoes.tsx`, `Fechamento.tsx` (+ `.module.css`), `hub/src/diagnostica/painel.test.tsx`. Modify `hub/src/App.tsx` (rota `/reunioes/:id/diagnostica`).

Tela (tela cheia, modo foco, sem as barras do hub):
- **Topo:** empresa, o tempo total da reunião (mono), o estado do rascunho ("Salvo" / "Salvando…" / "Sem internet · salvo neste computador") e "Sair do painel".
- **Barra de segmentos dos grupos** (abertura, G, P, C, T, B, A, C&I, técnico, escopo e fechamento), com o atual aceso e os respondidos cheios.
- **Centro:**
  - o passo atual: a letra do bloco e o título;
  - a pergunta em letra grande e o campo conforme o tipo (texto, curto, opções, número);
  - a dica, quando houver;
  - "Anterior" e "Próxima", também pelas setas.
- **Lateral, as anotações:**
  - N abre o campo, com a marcação escolhida por botões (Objeção, Técnico, Escopo, Próximo passo);
  - Enter salva a anotação, carimbada com o minuto e o passo; Esc fecha;
  - a lista das anotações, a mais recente primeiro.
- **Fechamento (último passo):**
  - o resumo preenchido (`resumoDoFechamento`) e o pacto, com a dica;
  - a escolha "Proposta marcada" (data, hora, formato, quem decide) ou "Não qualificou" (motivo);
  - o botão primário "Encerrar diagnóstica". Depois de encerrar, o painel leva ao briefing.

- [ ] **Step 1: Testes que falham:**
  - "mostra uma pergunta por vez e as setas navegam";
  - "N abre a anotação; enquanto digita, N e setas não fazem nada";
  - "anotação técnica aparece com o minuto";
  - "sair do painel sem encerrar não chama o encerrar";
  - "fechamento exige o resultado": sem escolher, aparece "Escolha como a diagnóstica terminou."; com proposta marcada, o POST recebe data, hora, formato e quem decide;
  - "sem internet aparece no topo".
- [ ] **Step 2: Rodar** `cd hub && npx vitest run src/diagnostica`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** e tirar capturas (claro, escuro e notebook; no celular, o painel empilha). Expected: passam; nada vaza.
- [ ] **Step 5: Commit** `git commit -m "Adiciona o painel da diagnóstica com perguntas, anotações e fechamento"`

---

### Task 7: Briefing em PDF

**Files:** Create `hub/src/telas/Briefing.tsx`, `Briefing.module.css`, `Briefing.test.tsx`. Modify `hub/src/App.tsx` (rota `/reunioes/:id/briefing`).

Tela:
- página A4, sempre clara, com o cabeçalho MecTRIA (vinho), o cliente, o serviço, a data da diagnóstica e o closer, e as seções de `briefingDaFicha`;
- botões (que não saem na impressão):
  - "Gerar PDF" (`window.print()`);
  - "Copiar resumo para o cliente" (`resumoParaCliente`);
  - "Marcar como enviado para Projetos" (POST `/api/reunioes/:id/briefing`).
- `@media print`: sem as barras, sem a grade, margens de 18 mm.

- [ ] **Step 1: Testes que falham:**
  - "mostra as seções com as respostas";
  - "Gerar PDF chama a impressão";
  - "marcar como enviado chama a API e avisa".
- [ ] **Step 2–4:** rodar (FAIL), implementar, rodar (PASS) e conferir o PDF salvo pelo Chromium (`page.pdf()`), olhando a captura da primeira página.
- [ ] **Step 5: Commit** `git commit -m "Gera o briefing da diagnóstica para Projetos em PDF"`

---

### Task 8: Seção Reuniões

**Files:** Create `hub/src/telas/Reunioes.tsx`, `Reunioes.module.css`, `Reunioes.test.tsx`. Modify `hub/src/App.tsx`, `hub/compartilhado/permissoes.ts` (Reuniões passa a fase 3 pronta).

Tela:
- agenda dos próximos 7 dias e as diagnósticas passadas ainda sem resultado, agrupadas por dia;
- cada reunião mostra:
  - a hora, a empresa e o tipo;
  - o closer, quando quem vê é o diretor;
  - o botão "Iniciar", ou "Continuar" quando a reunião está em andamento;
  - o link "Briefing" quando ela já foi concluída;
- o "Iniciar reunião" do Hoje do closer passa a funcionar e leva ao painel.

- [ ] **Step 1: Testes que falham:**
  - "agenda agrupada por dia";
  - "Iniciar leva ao painel";
  - "em andamento mostra Continuar";
  - "o Iniciar reunião do Hoje fica ligado".
- [ ] **Step 2–4:** rodar (FAIL), implementar, rodar (PASS).
- [ ] **Step 5: Commit** `git commit -m "Adiciona a agenda de reuniões com Iniciar"`

---

### Task 9: Playbooks

**Files:** Create `hub/src/telas/Playbooks.tsx`, `Playbooks.module.css`, `Playbooks.test.tsx`. Modify `hub/src/App.tsx`.

Tela:
- abas Cold call, Diagnóstica, Proposta, Objeções e Follow-up, guardadas na URL (`/playbooks/objecoes`);
- **Objeções:** busca sem acento e filtro por etapa; cada objeção mostra a frase, o que há por trás dela e o contorno, com o botão "Copiar";
- **Diagnóstica:** os blocos e as perguntas;
- **Proposta:** os passos e os pactos;
- **Follow-up:** a cadência e as regras.

- [ ] **Step 1: Testes que falham:**
  - "abas mudam a URL";
  - "busca de objeção sem acento" ("preco" acha "Está caro");
  - "o hunter vê Cold call e Objeções".
- [ ] **Step 2–4:** rodar (FAIL), implementar, rodar (PASS).
- [ ] **Step 5: Commit** `git commit -m "Adiciona os playbooks de consulta"`

---

### Task 10: Busca de clientes, roteiros e objeções

**Files:** Modify `hub/src/busca/buscar.ts` (tipo `FonteAssincrona`), `hub/src/busca/fontes.ts`, `hub/src/busca/Busca.tsx`, `hub/src/busca/Busca.test.tsx`.

**Interfaces — Produces:**
- `type FonteAssincrona = (ctx) => Promise<ItemDeBusca[]>`, com `FONTES_ASSINCRONAS: FonteAssincrona[]`, carregadas quando a busca abre;
- **clientes:** de `GET /api/oportunidades`, com o grupo "Cliente"; abre o follow-up ou a reunião;
- **roteiros:** as abas dos playbooks;
- **objeções:** as 24, abrem `/playbooks/objecoes?o={id}`.

- [ ] **Step 1: Testes que falham:**
  - "acha o cliente pelo nome sem acento";
  - "acha a objeção 'caro'";
  - "fonte assíncrona que falha não derruba a busca".
- [ ] **Step 2–4:** rodar (FAIL), implementar, rodar (PASS).
- [ ] **Step 5: Commit** `git commit -m "Acrescenta clientes, roteiros e objeções à busca"`

---

### Task 11: Ponta a ponta da fase 3 e documentação

**Files:**
- Create: `hub/e2e/fase3.spec.ts`.
- Modify: `hub/e2e/semente.sql` (uma diagnóstica marcada para hoje do `clo@`), `hub/README.md`, `docs/07-decisoes-e-pendencias.md` (as 6 decisões), `docs/03-plano-erp.md` (o 55 e o que ficou).

- [ ] **Step 1: Escrever os testes:**
  - **closer conduz a diagnóstica:**
    - Reuniões → Iniciar;
    - responde 3 perguntas, uma anotação Técnico e outra Objeção;
    - fechamento com proposta marcada;
    - o briefing mostra as respostas;
    - "Marcar como enviado";
  - **queda de internet:** `context.setOffline(true)` no meio, responde, aparece "Sem internet · salvo neste computador"; `setOffline(false)`, aparece "Salvo"; recarrega e a resposta continua lá;
  - **não qualificou:** a oportunidade sai das diagnósticas e não aparece no follow-up;
  - **playbooks e busca:** Ctrl K, "caro" e Enter abre a objeção;
  - **PDF:** `page.pdf()` do briefing gera um arquivo com mais de 10 KB;
  - **celular:** Reuniões e Playbooks sem rolagem para o lado.
- [ ] **Step 2: Rodar** `cd hub && npm run typecheck && npm test && npm run e2e`. Expected: tudo passa (fases 1, 2 e 3).
- [ ] **Step 3: Documentar** e commit `git commit -m "Testa a fase 3 de ponta a ponta e atualiza a documentação"`
