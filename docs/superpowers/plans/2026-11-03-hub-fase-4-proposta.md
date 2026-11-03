# Hub comercial · Fase 4 (Reunião de proposta em duas janelas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O closer prepara a proposta de cada cliente na seção Apresentações e conduz a reunião de proposta pelo hub. A apresentação abre numa janela própria, que é a que o cliente vê. O painel fica sincronizado com ela e mostra a fala do slide com as palavras do cliente, os pactos, quem está na sala, o tempo por bloco, as objeções e as anotações. O fechamento é obrigatório e cria a proposta e os toques de follow-up sozinho.

**Architecture:** As duas janelas conversam pelo próprio navegador (`BroadcastChannel`), sem servidor de tempo real. O painel manda e a janela da apresentação só desenha. As regras puras (variáveis, falas, slides, pactos) ficam em `hub/compartilhado/proposta.ts`. A lógica do banco fica em `hub/servidor/proposta.ts`, e a migração é a `0005`. O estado da reunião (sala, pactos, tempos, slide) fica no computador e vai para o servidor a cada 5 segundos, como o rascunho da fase 3, que também guarda as anotações.

**Tech Stack:** a mesma, sem dependências novas.

**Spec:** `docs/15-hub-template.md` (seções 5, 6 "Forma 1" e "O que o painel mostra", 8, 9, 10 e 11, fase 4). Registros das fases 1 a 3 em `docs/superpowers/registros/`.

## Decisões deste plano (o Lucas confirma)

1. **Sincronização sem servidor.** As duas janelas se falam pelo navegador (`BroadcastChannel`), então os slides continuam passando mesmo sem internet. Os Durable Objects (custo a confirmar) entram na fase 5, com o celular, que precisa do servidor.
2. **Apresentação de exemplo.** São 13 slides: a capa e os 12 passos do roteiro de proposta da 0.2, no visual claro da MecTRIA. Eles são preenchidos com as variáveis do cliente e com as palavras da diagnóstica. As apresentações de verdade, por serviço, são o subprojeto seguinte (spec, seção 12).
3. **Fechamento com os 4 resultados do playbook:**
   - **Vai decidir (data combinada)** e **Pediu ajuste na proposta:** pedem a data da decisão e quem decide, registram a proposta e criam os 7 toques sozinhos (D0 a D15, contados de hoje). A oportunidade vai para o follow-up.
   - **Fechou:** registra a proposta e marca a oportunidade como ganha, com o valor.
   - **Perdeu:** registra a proposta e marca a oportunidade como perdida, com um dos motivos da fase 2.
   - O "Registrar proposta apresentada" da fase 2 continua, para a proposta apresentada fora do hub.
4. **Variáveis de cada cliente:**
   - são elas: serviço, escopo, o que fica com o cliente, valor, parcelas, prazo, condições e time;
   - são preparadas em Apresentações, em modo foco, e ficam guardadas na reunião de proposta; no fechamento, são copiadas para a proposta;
   - o escopo e o que fica com o cliente começam com o texto do serviço (Carta de Serviços), e as parcelas começam em 6.
5. **Quem está na sala:**
   - começa com quem decide (do fechamento da diagnóstica) e com o contato, se for outra pessoa;
   - antes de começar, o closer acrescenta pessoas e marca quem decide;
   - se ninguém estiver marcado, o painel avisa no slide antes do preço e no slide do preço (spec, seção 6, "Alertas").
6. **Tempo por bloco e pactos:**
   - o tempo planejado vem do roteiro (por exemplo, 2 min);
   - o tempo real conta enquanto o slide está na tela e fica vermelho quando passa do planejado;
   - "Pactos por reunião", no Hoje do closer, é a média de pactos das reuniões de proposta concluídas no mês.
7. **A diagnóstica continua numa janela só.** O motor de duas janelas serve para qualquer apresentação, mas a apresentação curta da diagnóstica entra com o conteúdo das apresentações.
8. **Anotações na proposta funcionam como na diagnóstica.** "Técnico" vira pendência para Projetos, com prazo no próximo dia útil. Levar a resposta de Projetos para a mensagem do follow-up seguinte fica para a fase 6, quando Projetos ganha a tela. "Escopo" fica registrado na reunião; o hub não tem cargo de Adm-Fin.

## Global Constraints

- Tudo das fases 1 a 3 continua valendo:
  - pt-BR e MecTRIA;
  - versões fixas e sem `playwright install`;
  - fuso de São Paulo e dinheiro em centavos;
  - um botão vermelho por tela; nada é apagado; nenhum e-mail real;
  - pedidos que mudam dados vão em JSON; nenhuma consulta com lista de ids;
  - gravações em várias etapas vão num `db.batch` condicionado.
- **A janela do cliente nunca mostra** roteiro, fala, dica, aviso, anotação, nem o estado da internet.
- O título da janela da apresentação é "Apresentação · {empresa}". O painel lembra: "No Meet ou no Zoom, compartilhe só a janela “Apresentação · {empresa}”."
- **Atalhos do painel:**
  - setas: slide anterior e próximo;
  - N: anotar;
  - O: objeções;
  - Esc: sai do campo; com as objeções abertas, fecha as objeções.
  - Enquanto um campo está em foco, as setas, o N e o O não fazem nada.
  - As setas apertadas na janela da apresentação também passam o slide (a janela avisa o painel).
- Pactos (6, ids do `PLAYBOOK_PROPOSTA`): `agenda`, `dor`, `duvida`, `cliente`, `valor` e `fechamento`.
- Resultados do fechamento: `ganho`, `decidir`, `ajuste` e `perdido`, com os rótulos de `PLAYBOOK_PROPOSTA.resultados`.
- **Permissões:** só o closer dono da oportunidade (ou o diretor) prepara, conduz e encerra a proposta. A reunião de proposta só inicia e encerra com a oportunidade em `proposta_marcada`; senão dá 409 "Essa oportunidade já passou da proposta.".

## Review Focus

- **A janela da apresentação fecha ou recarrega no meio.** "Reabrir apresentação" volta no mesmo slide, e a janela recarregada pede o estado ao painel. Testes nas Tasks 6 e 7.
- **A internet cai no meio da proposta.** Os slides continuam passando, e pactos, tempos e anotações ficam no computador. O encerrar só passa depois que tudo chega ao servidor. Testes nas Tasks 5 e 8 e no e2e.
- **O painel é recarregado (F5) no meio.** Ele volta no mesmo slide, com os pactos e os tempos. Teste na Task 5.
- **Encerrar duas vezes, ou a proposta já registrada à mão:** dá 409, e nenhuma proposta nem toque se duplica (`UNIQUE` em `propostas.reuniao_id` e gravação condicional). Teste na Task 3.
- **Digitar o nome de alguém na sala ou uma anotação** com setas, N ou O não passa slide nem abre nada. Teste na Task 7.

---

### Task 1: Conteúdo e regras puras da proposta

**Files:** Create `hub/compartilhado/dados/empresa.ts`, `hub/compartilhado/dados/apresentacao-exemplo.ts`, `hub/compartilhado/proposta.ts`, `hub/compartilhado/proposta.test.ts`. Modify `hub/compartilhado/dados/cadencia.ts` (`VARIAVEIS` ganha os rótulos das chaves novas).

**Interfaces — Produces:**
- `EMPRESA`, gerado executando `hub-comercial/js/dados/empresa.js` (como nas fases 2 e 3). Os anos são calculados a partir de `fundacao`, não do valor gerado.
- `APRESENTACAO_EXEMPLO: { id: string; passo: string | null; rotulo: string; titulo: string; linhas: string[] }[]` — 13 slides:
  - `capa` (passo null), seguida dos 12 ids de `PLAYBOOK_PROPOSTA.passos`, na mesma ordem;
  - textos com `{chave}` e pendências com `[rótulo]`;
  - nenhum dado inventado da MecTRIA: números e casos ficam como `[nº de projetos]`, `[Caso do mesmo serviço…]`.
- **Tipos:**
  - `type IdPacto = "agenda" | "dor" | "duvida" | "cliente" | "valor" | "fechamento"`;
  - `interface VariaveisProposta { servico: string; escopo: string; ficaComCliente: string; valor: number | null; parcelas: number; prazo: string; condicoes: string; equipe: string }`;
  - `interface PessoaNaSala { nome: string; decide: boolean }`, `interface PactoFeito { id: IdPacto; minuto: number }`;
  - `interface Andamento { sala: PessoaNaSala[]; pactos: PactoFeito[]; tempos: Record<string, number>; slide: number }`;
  - `type DesfechoProposta = "ganho" | "decidir" | "ajuste" | "perdido"`;
  - `type FechamentoProposta = { desfecho: "decidir" | "ajuste"; valor: number; dataDecisao: string; quemDecide: string; observacao?: string } | { desfecho: "ganho"; valor: number } | { desfecho: "perdido"; valor: number; motivo: string }`;
  - `interface SessaoProposta { reuniao: Reuniao; oportunidade: Oportunidade; variaveis: VariaveisProposta; andamento: Andamento; anotacoes: Anotacao[]; respostasDaDiagnostica: Respostas }`;
  - `type Parte = { texto: string; tipo: "texto" | "cliente" | "variavel" | "falta" }`;
  - `interface SlideDaProposta { id: string; indice: number; rotulo: string; titulo: string; linhas: string[]; fala: string; dica?: string; tempoPlanejado: number /* s */; pacto: IdPacto | null }`;
  - `interface SlideMontado { id: string; rotulo: Parte[]; titulo: Parte[]; linhas: Parte[][] }`.
- **Funções:**
  - `variaveisIniciais(servicoId: string): VariaveisProposta`: escopo e o que fica com o cliente do serviço, uma linha por item; `parcelas: 6`; `valor: null`.
  - `faltandoNaProposta(v): string[]`: na ordem "Valor", "Escopo", "Prazo", "Time".
  - `slidesDaProposta(): SlideDaProposta[]`:
    - junta `APRESENTACAO_EXEMPLO` com os passos (fala, dica, pacto e o tempo de "2 min", que vira 120);
    - a capa fica com 60 s e sem fala.
  - `valoresDaProposta({ oportunidade, variaveis, respostas, hoje }): { valores: Record<string, string>; doCliente: Set<string> }`:
    - porta o `H.variaveis` da 0.2 (`hub-comercial/js/base.js:192-245`): primeiro nome do contato, `MEIO_DE_FRASE` com a inicial minúscula, `anos`, `parcelas`, `descontoAVista` "10", `fraseValor`, `ancora` do serviço;
    - acrescenta `empresa`, `servico` (o nome), `data` (`formatarDia(hoje)`), `valor` (`formatarReais`), `entregamos` e `fica` (linhas juntadas com "; ", minúsculas), `prazoProjeto` e `equipe`;
    - `doCliente` tem as chaves que vieram das respostas da diagnóstica.
  - `partesDoModelo(modelo, valores, doCliente): Parte[]`:
    - `{chave}` com valor vira `cliente` (se estiver em `doCliente`) ou `variavel`;
    - `{chave}` sem valor vira `falta`, com `[rótulo]`;
    - um `[texto]` literal vira `falta`;
    - o resto vira `texto`.
  - `montarSlides(slides, valores, doCliente): SlideMontado[]`.
  - `quemDecideNaSala(sala): string`: os nomes marcados, juntados com " e ".

- [ ] **Step 1: Teste que falha** (`proposta.test.ts`):
  - `slidesDaProposta()` tem 13 itens; o 5º (índice 4) é `ceu-inferno`, com `tempoPlanejado` 300 e `pacto` "dor"; a soma dos pactos dá os 6 ids;
  - `variaveisIniciais("climatizacao").escopo` contém o primeiro item de `entregamos` do serviço;
  - `faltandoNaProposta(variaveisIniciais("nr-12"))` é `["Valor", "Prazo", "Time"]`;
  - com a resposta `c-dor` = "O galpão passa de 38 °C", `valoresDaProposta(...).valores.dor` é "o galpão passa de 38 °C" e `doCliente.has("dor")`;
  - `partesDoModelo("Hoje: {dor}. [nº]", …)` é `[{texto:"Hoje: ",tipo:"texto"},{texto:"o galpão passa de 38 °C",tipo:"cliente"},{texto:". ",tipo:"texto"},{texto:"[nº]",tipo:"falta"}]`;
  - `{valor}` sem valor vira `falta` com o rótulo de `VARIAVEIS`;
  - `quemDecideNaSala([{nome:"Bia",decide:true},{nome:"Ana",decide:false},{nome:"Rui",decide:true}])` é "Bia e Rui";
  - nenhum texto de `APRESENTACAO_EXEMPLO` contém "4.950" nem "54.900".
- [ ] **Step 2: Rodar** `cd hub && npx vitest run compartilhado/proposta.test.ts`. Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implementar** os três arquivos e os rótulos novos em `VARIAVEIS`.
- [ ] **Step 4: Rodar** de novo e `npm run typecheck`. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a apresentação de exemplo e as regras da proposta"`

---

### Task 2: Banco e servidor da preparação e do andamento

**Files:** Create `hub/migrations/0005_proposta.sql`, `hub/servidor/proposta.ts`, `hub/servidor/proposta.test.ts`. Modify `hub/servidor/oportunidades.ts` (`SELECT_REUNIAO`, `LinhaReuniao`, `reuniaoDeLinha`), `hub/compartilhado/oportunidade.ts` (`Reuniao.desfecho: DesfechoProposta | null`), `hub/servidor/diagnostica.ts` (`iniciarReuniao` vale para os dois tipos).

**Migração 0005:**
- em `reunioes`: as colunas `variaveis`, `sala`, `pactos` e `tempos` (TEXT com JSON), `slide_atual` (INTEGER NOT NULL DEFAULT 0) e `resultado_proposta` (CHECK nos 4 desfechos);
- em `propostas`: `reuniao_id` (REFERENCES reunioes) e `escopo`, `fica_com_cliente`, `prazo`, `condicoes` e `equipe` (TEXT NOT NULL DEFAULT '');
- `CREATE UNIQUE INDEX propostas_reuniao ON propostas (reuniao_id)`.

**Interfaces — Produces** (`servidor/proposta.ts`):
- `salvarVariaveis(db, reuniaoId, v: VariaveisProposta): Promise<void>`: só reunião de proposta não concluída, senão `Error("nao_e_proposta" | "ja_encerrada")`.
- `salvarAndamento(db, reuniaoId, a: Andamento): Promise<void>`: só reunião de proposta; a última gravação vale.
- `sessaoDaProposta(db, reuniaoId): Promise<SessaoProposta | null>`:
  - sem variáveis guardadas, usa `variaveisIniciais(oportunidade.servico)`;
  - sem andamento guardado, a sala começa com `quem_decide` (decide) e com o contato, se for outra pessoa;
  - as anotações são só desta reunião;
  - `respostasDaDiagnostica` vem da última diagnóstica concluída da oportunidade (`{}` se não houver).
- `iniciarReuniao`: a condição da oportunidade passa a depender do tipo (`CASE reunioes.tipo WHEN 'diagnostica' THEN 'diagnostica_marcada' ELSE 'proposta_marcada' END`).

- [ ] **Step 1: Testes que falham** (`proposta.test.ts`), com a diagnóstica encerrada com "proposta marcada" (quem decide "Bia"), contato "Ana" e a resposta `c-dor`:
  - "sessão nova traz as variáveis iniciais do serviço, a sala com quem decide e as respostas da diagnóstica": `sala` é `[{nome:"Bia",decide:true},{nome:"Ana",decide:false}]` e `respostasDaDiagnostica["c-dor"]` está preenchida;
  - "variáveis e andamento gravados voltam na sessão";
  - "reunião de proposta inicia só com a oportunidade em proposta_marcada": depois de `registrarProposta`, dá `ja_passou`;
  - "salvarVariaveis recusa reunião de diagnóstica" (`nao_e_proposta`).
- [ ] **Step 2: Rodar** `cd hub && npx vitest run --config vitest.api.config.ts servidor/proposta.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar** a migração, o servidor e o campo `desfecho`.
- [ ] **Step 4: Rodar** a suíte da API e `npm run typecheck`. Expected: passa (os testes da fase 3 continuam verdes).
- [ ] **Step 5: Commit** `git commit -m "Guarda a preparação e o andamento da reunião de proposta"`

---

### Task 3: Fechamento da proposta e pactos por reunião

**Files:** Modify `hub/servidor/proposta.ts`, `hub/servidor/proposta.test.ts`, `hub/servidor/followup.ts` (`numerosDoMes`), `hub/servidor/followup.test.ts`.

**Interfaces — Produces:**
- `encerrarProposta(db, reuniaoId, f: FechamentoProposta, autor: Pessoa, hoje = hojeEmSaoPaulo()): Promise<{ reuniao: Reuniao; propostaId: number }>`.
  - É um `db.batch` só, com cada passo condicionado ao primeiro:
    1. conclui a reunião (`tipo = 'proposta'`, situação `marcada`/`em_andamento` e oportunidade em `proposta_marcada`), gravando `resultado_proposta`, `encerrada_em` e a observação ou o motivo em `motivo`;
    2. `INSERT … SELECT` da proposta, com `reuniao_id` e as variáveis copiadas: `apresentada_em = hoje`; `data_decisao` e `quem_decide` só em decidir/ajuste; `dor` é a resposta `c-dor` da diagnóstica;
    3. em decidir/ajuste, os 7 toques de `datasDaCadencia(hoje)`, um `INSERT … SELECT` por toque, a partir da proposta desta reunião;
    4. o histórico, de `proposta_marcada` para `em_followup`, `ganha` ou `perdida`;
    5. a oportunidade: situação, `valor_fechado` (ganho) e `motivo_perda` (perdido).
  - Erros: `nao_encontrada`, `nao_e_proposta`, `ja_encerrada` e `ja_passou` (a mesma `motivoDaRecusa` da fase 3, generalizada).
- `numerosDoMes` passa a devolver `{ propostas; ganhas; pactosPorReuniao: number | null }`: a média de `json_array_length(pactos)` das reuniões de proposta concluídas no mês (UTC−3), com o mesmo filtro de closer.

- [ ] **Step 1: Testes que falham:**
  - "vai decidir cria a proposta, os 7 toques e põe no follow-up": `listarFollowup` tem 1 item, com o toque D0 de hoje; `propostas.reuniao_id` é a reunião; o escopo foi copiado;
  - "fechou marca ganha com o valor e não cria toques": `numerosDoMes(...).ganhas` é 1;
  - "perdeu marca perdida com o motivo";
  - "encerrar de novo dá ja_encerrada e não duplica proposta nem toques";
  - "proposta registrada à mão antes: encerrar dá ja_passou e nada muda";
  - "pactos por reunião é a média do mês": com 2 reuniões, de 4 e 2 pactos, dá 3, e sem reunião dá null.
- [ ] **Step 2: Rodar** a suíte da API. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte da API. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Fecha a reunião de proposta criando a proposta e os toques numa transação"`

---

### Task 4: Rotas e validação

**Files:**
- Create `hub/functions/api/reunioes/[id]/proposta.ts` (GET), `hub/functions/api/reunioes/[id]/variaveis.ts` (PUT) e `hub/functions/api/reunioes/[id]/andamento.ts` (PUT).
- Modify `hub/functions/api/reunioes/[id]/encerrar.ts` (decide pelo tipo), `hub/functions/api/reunioes/[id]/iniciar.ts` (a mensagem do 409 depende do tipo) e `hub/servidor/validacao.ts`.
- Test: `hub/servidor/rotas/fase4.test.ts`.

**Interfaces — Produces:**
- `validarVariaveis`:
  - serviço entre os 12;
  - escopo e o que fica com o cliente até 2.000 caracteres; prazo, condições e time até 500;
  - valor null ou um inteiro de 1 a 10¹⁰; parcelas de 1 a 12.
- `validarAndamento`:
  - sala com até 12 pessoas, nome de 1 a 80 caracteres e `decide` booleano;
  - pactos com ids válidos, sem repetição, e minuto de 0 a 600;
  - tempos só com ids de slide e de 0 a 36.000;
  - slide de 0 a 12.
- `validarFechamentoProposta`:
  - valor inteiro maior que 0;
  - em decidir/ajuste, `dataDecisao` em AAAA-MM-DD, não antes de hoje em São Paulo, e quem decide com 2 caracteres ou mais;
  - motivo entre os `MOTIVOS_PERDA`; observação até 500.
- **Rotas** (todas com `acessarReuniao(..., true)`):
  - `GET /proposta` responde `SessaoProposta`, e 400 "Essa reunião não é uma proposta." se for diagnóstica;
  - `PUT /variaveis` e `PUT /andamento` respondem `{ ok: true }`;
  - `POST /encerrar` de proposta responde `{ reuniao, propostaId }`;
  - 409: "Essa reunião já foi encerrada." e "Essa oportunidade já passou da proposta." (a de diagnóstica continua "…da diagnóstica.").

- [ ] **Step 1: Testes que falham** (`fase4.test.ts`, no estilo de `fase3.test.ts`):
  - o closer dono lê a sessão, salva as variáveis e o andamento e encerra com "decidir" (200 e `propostaId`); de novo, dá 409;
  - outro closer e Projetos recebem 403, e o diretor passa;
  - variáveis com serviço inexistente, andamento com o pacto "xyz" e fechamento com data de ontem dão 400;
  - `GET /proposta` numa diagnóstica dá 400.
- [ ] **Step 2: Rodar** `npx vitest run --config vitest.api.config.ts servidor/rotas/fase4.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte da API e o typecheck. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Adiciona as rotas da reunião de proposta"`

---

### Task 5: Canal entre as janelas, estado da reunião e rascunho do andamento

**Files:** Create `hub/src/reuniao/canal.ts`, `hub/src/reuniao/sessao.ts`, `hub/src/reuniao/andamento.ts` e os testes `canal.test.ts`, `sessao.test.ts` e `andamento.test.ts`.

**Interfaces — Produces:**
- `type MensagemReuniao = { tipo: "pronta" } | { tipo: "viva" } | { tipo: "estado"; empresa: string; slides: SlideMontado[]; slide: number } | { tipo: "slide"; slide: number } | { tipo: "tecla"; tecla: "ArrowRight" | "ArrowLeft" } | { tipo: "fim" }`.
- `abrirCanal(reuniaoId: number, aoReceber: (m: MensagemReuniao) => void): { enviar(m: MensagemReuniao): void; fechar(): void }`: usa o `BroadcastChannel` "hub-reuniao-{id}"; se o navegador não tiver, não faz nada.
- **Funções puras de `sessao.ts`:**
  - `avancar(a, total)` e `voltar(a)` param nas pontas; `irPara(a, i, total)`;
  - `alternarPacto(a, id, minuto)` marca e desmarca;
  - `somarTempo(a, slideId, segundos)`;
  - `precisaDeQuemDecide(a, slides): boolean`: ninguém na sala com `decide` e o slide atual é o `investimento` ou o anterior a ele.
- `useAndamento(reuniaoId, inicial: Andamento | null, intervalo = 5000) => { andamento; mudar(f: (a: Andamento) => Andamento): void; estado: EstadoRascunho; sincronizar(): Promise<boolean> }`:
  - guarda em localStorage `hub-proposta-{id}` (`{ andamento, pendente, versao }`);
  - junta uma vez só, e o que está pendente no computador vale mais que o servidor;
  - manda `PUT /andamento` com o estado inteiro;
  - a versão impede tirar da fila o que mudou durante o envio;
  - segue os mesmos erros e estados de `useRascunho` (sem internet, sem permissão, 400 com aviso);
  - envia ao desmontar e no `pagehide`.

- [ ] **Step 1: Testes que falham:**
  - "mensagem enviada num canal chega no outro da mesma reunião e não no de outra";
  - "avançar no último slide fica no último"; "pacto marcado duas vezes desmarca";
  - "sem quem decide, avisa no valor × preço e no investimento, e não avisa nos outros";
  - "andamento muda, espera 5 s e manda o estado inteiro";
  - "painel recarregado volta no mesmo slide, com os pactos": o localStorage pendente vale mais que o servidor;
  - "sincronizar espera o envio em andamento e devolve false sem internet".
- [ ] **Step 2: Rodar** `npx vitest run src/reuniao`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** de novo. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Liga as duas janelas da reunião e guarda o andamento no computador"`

---

### Task 6: Janela da apresentação

**Files:** Create `hub/src/apresentacao/Slide.tsx`, `Slide.module.css`, `JanelaDaApresentacao.tsx`, `JanelaDaApresentacao.module.css` e `janela.test.tsx`. Modify `hub/src/App.tsx` (rota `/apresentacao/:id` dentro da Raiz e fora das barras).

**Interfaces — Produces:**
- `<Slide slide={SlideMontado} escala?: number />`:
  - quadro de 1280 × 720, em cores fixas claras (fundo branco e vinho #780000), com a escala ajustada à largura do contêiner;
  - `falta` aparece como `[rótulo]` em texto comum (o cliente não vê destaque nenhum);
  - é o mesmo componente da miniatura no painel e do catálogo.
- **A janela:**
  - ao abrir, manda `pronta` e depois `viva` a cada 2 s;
  - desenha o `estado` recebido e troca de slide com `slide`;
  - as setas apertadas nela viram `tecla`;
  - `fim` fecha a janela;
  - o título fica "Apresentação · {empresa}";
  - antes do primeiro estado, mostra só a marca MecTRIA.

- [ ] **Step 1: Testes que falham** (`janela.test.tsx`, com o canal de verdade):
  - "a janela pede o estado e desenha o slide que o painel mandar": manda `estado` com o slide 1 e mostra o título do slide 1; com `slide: 4`, mostra o do 4;
  - "seta na janela da apresentação avisa o painel";
  - "o título da janela é Apresentação · {empresa}";
  - "a janela não mostra fala nem anotação": o texto da fala do slide não aparece.
- [ ] **Step 2: Rodar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar.** Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Adiciona a janela da apresentação que o cliente vê"`

---

### Task 7: Painel da proposta (antes de começar e ao vivo)

**Files:**
- Create `hub/src/reuniao/PainelDaProposta.tsx`, `AntesDeComecar.tsx`, `Sala.tsx`, `ObjecoesDaReuniao.tsx`, `Painel.module.css` e `painel.test.tsx`.
- Modify `hub/src/App.tsx` (rota `/reunioes/:id/proposta` fora das barras).
- Reaproveita `src/diagnostica/Anotacoes.tsx` e `useRascunho` (só para as anotações; `passo` = id do slide).

**Comportamento:**
- **Antes de começar** (reunião `marcada`):
  - quem está na sala: acrescentar com Enter, marcar "Decide" e tirar;
  - o que falta preparar (`faltandoNaProposta`), com o link "Preparar em Apresentações";
  - "Abrir apresentação" (`window.open("/apresentacao/{id}", "hub-apresentacao-{id}", "popup,left=0,top=0,width=…70%…,height=…")`);
  - o lembrete de qual janela compartilhar;
  - "Começar reunião" (o botão vermelho) faz `POST /iniciar`.
- **Ao vivo:**
  - no topo: "AO VIVO", o tempo total, a empresa, quem está na sala (com a marca em quem decide) e o estado do rascunho;
  - "5 de 13", com 13 segmentos ("Ir para o slide N");
  - o tempo do bloco, real contra o planejado (`1:20 / 2:00`), com `data-estourou` quando passa;
  - a fala com as `Parte` (`cliente` em `<mark>`, `falta` destacada) e a dica;
  - o pacto do slide como botão grande ("Pacto: {texto}", `aria-pressed`) e "N de 6 pactos";
  - o aviso de quem decide (`role="alert"`, "Quem decide não está na sala. Segure o preço e marque a conversa com quem decide.");
  - a miniatura do próximo slide e os botões "← Voltar" e "Próximo →"; no último slide, "Próximo →" vira "Ir para o fechamento";
  - as objeções da etapa "proposta" com a tecla O (com busca);
  - as anotações com a tecla N;
  - "Reabrir apresentação" quando não chega `viva` há mais de 5 s.
- **Por baixo:**
  - um relógio de 1 s chama `somarTempo` no slide atual;
  - cada troca de slide manda `slide`, e `pronta` recebe o `estado` inteiro;
  - `tecla` avança ou volta.
- **Um botão vermelho:** o pacto quando o slide tem pacto; senão, "Próximo →".

- [ ] **Step 1: Testes que falham** (`painel.test.tsx`, com `fingirApi` e a sessão de exemplo):
  - "antes de começar mostra a sala com quem decide e o lembrete da janela";
  - "Começar chama iniciar e mostra 1 de 13";
  - "seta passa o slide e o canal manda o slide novo";
  - "pacto feito conta 1 de 6 e desfaz no segundo clique";
  - "a fala destaca as palavras do cliente";
  - "o tempo do bloco fica vermelho quando passa do planejado": com timers falsos, 121 s no slide 1;
  - "sem quem decide, avisa antes do preço";
  - "digitar o nome na sala e a anotação não passa slide";
  - "O abre as objeções e Esc fecha";
  - "sem sinal da janela, aparece Reabrir apresentação".
- [ ] **Step 2: Rodar** `npx vitest run src/reuniao/painel.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte do app e o typecheck. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Adiciona o painel da reunião de proposta"`

---

### Task 8: Fechamento obrigatório da proposta

**Files:** Create `hub/src/reuniao/FechamentoDaProposta.tsx`. Modify `PainelDaProposta.tsx` and `painel.test.tsx`.

**Comportamento:**
- **Campos:**
  - os quatro resultados de `PLAYBOOK_PROPOSTA.resultados` em botões de opção;
  - "Valor apresentado", que já vem das variáveis;
  - em decidir/ajuste, "Data da decisão" (`min` = hoje) e "Quem decide" (começa com `quemDecideNaSala`); em ajuste, também "O que ajustar";
  - em perdido, "Motivo" (`MOTIVOS_PERDA`).
- **"Encerrar reunião":**
  - antes de mandar, espera `andamento.sincronizar()` e `rascunho.sincronizar()`; se falhar, mostra "Ainda há dados sem salvar no servidor. Confira a internet e tente de novo.";
  - depois, manda `fim` pelo canal e avisa: "Proposta no follow-up, com os toques criados." / "Proposta registrada como ganha." / "Proposta registrada como perdida.";
  - por fim, navega com `replace` para `/follow-up` (decidir/ajuste) ou `/reunioes` (ganho/perdido).

- [ ] **Step 1: Testes que falham:**
  - "fechamento exige o resultado, a data e quem decide, e manda vai decidir": o corpo do POST é `{ desfecho: "decidir", valor, dataDecisao, quemDecide: "Bia" }`, e a URL vira `/follow-up`;
  - "perdeu pede o motivo";
  - "encerrar não passa com o andamento sem salvar".
- [ ] **Step 2: Rodar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte do app. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Adiciona o fechamento obrigatório da proposta"`

---

### Task 9: Seção Apresentações

**Files:** Create `hub/src/telas/Apresentacoes.tsx`, `Apresentacoes.module.css` e `Apresentacoes.test.tsx`. Modify `hub/src/App.tsx` (a seção deixa de ser "em construção").

**Comportamento:**
- **"Propostas para preparar":** as reuniões de proposta marcadas dos próximos 30 dias, com a oportunidade em `proposta_marcada` (vindas de `GET /api/reunioes?de=&ate=`). Cada uma tem "Preparar", que abre em modo foco o formulário das variáveis:
  - "Serviço", "Escopo incluído", "O que fica com o cliente", "Valor", "Parcelas", "Prazo", "Condições" e "Time";
  - "Falta para a reunião: …", ao vivo;
  - "Salvar" faz `PUT /variaveis` e avisa "Proposta de {empresa} salva.".
- **"Catálogo":**
  - a apresentação de exemplo, com as miniaturas dos 13 slides (`Slide` com valores de exemplo);
  - os cartões "Reunião diagnóstica", "Portfólio" e "Uma proposta por serviço", com "Chega com o subprojeto das apresentações.".

- [ ] **Step 1: Testes que falham:**
  - "lista as propostas para preparar e abre o foco com as variáveis";
  - "salvar manda as variáveis com o valor em centavos e avisa";
  - "o catálogo mostra os 13 slides de exemplo";
  - "o hunter não vê Apresentações" (já coberto por `permissoes`; o teste confere a tela de sem acesso).
- [ ] **Step 2: Rodar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte do app. Expected: passa (o teste antigo da seção "em construção" é ajustado, com ruling).
- [ ] **Step 5: Commit** `git commit -m "Adiciona a seção Apresentações com a preparação da proposta"`

---

### Task 10: Agenda, Hoje e números

**Files:** Modify `hub/src/telas/Reunioes.tsx`, `hub/src/telas/hoje/HojeCloser.tsx`, `hub/src/telas/hoje/comum.ts` e os testes deles.

**Comportamento:**
- **Agenda:** a reunião de proposta tem "Iniciar"/"Continuar", que leva a `/reunioes/{id}/proposta`.
  - `jaPassou` vale para os dois tipos: na proposta, é a oportunidade fora de `proposta_marcada`, com "A oportunidade já passou da proposta".
  - A proposta concluída mostra "Concluída · {rótulo do desfecho}".
- **Hoje do closer:**
  - "Iniciar reunião"/"Continuar reunião" ligado também para a proposta;
  - `proximaReuniao` exclui a proposta cuja oportunidade já passou dela;
  - "Pactos por reunião" mostra `pactosPorReuniao` com uma casa decimal (`3,0`), ou "—" quando é null.

- [ ] **Step 1: Testes que falham:**
  - "Iniciar da proposta leva ao painel da proposta";
  - "proposta cuja oportunidade já andou não oferece Iniciar";
  - "o Hoje mostra pactos por reunião".
- [ ] **Step 2: Rodar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** a suíte do app. Expected: passa.
- [ ] **Step 5: Commit** `git commit -m "Liga a reunião de proposta na agenda e no Hoje"`

---

### Task 11: Ponta a ponta e documentação

**Files:**
- Modify `hub/e2e/semente.sql` (a proposta do Carlos de hoje, às 23:45 em São Paulo, com a oportunidade "Caldeiraria Sul" em `proposta_marcada`, a diagnóstica concluída com `c-dor` e quem decide "Bia").
- Create `hub/e2e/fase4.spec.ts`.
- Modify `hub/README.md`, `hub/IMPLANTACAO.md` (Durable Objects na fase 5; migração 0005), `docs/07-decisoes-e-pendencias.md` (linha da fase 4, "a confirmar") e `docs/03-plano-erp.md` (tarefa 56).

- [ ] **Step 1: Testes de ponta a ponta:**
  - "prepara a proposta em Apresentações";
  - "conduz a proposta com as duas janelas sincronizadas": abre a janela (`page.waitForEvent("popup")`) e confere que o título dela tem a empresa; Começar; a seta passa o slide nas duas; pacto, anotação Técnico, o aviso de quem decide com a Bia desmarcada; fecha com "Vai decidir"; a URL vira `/follow-up` e aparece "Caldeiraria Sul";
  - "a janela fechada reabre no mesmo slide";
  - "sem internet, os slides continuam passando e o painel mostra Sem internet; quando volta, mostra Salvo".
- [ ] **Step 2: Rodar** `cd hub && npm run e2e`. Expected: as fases 1 a 4 passam.
- [ ] **Step 3: Documentação** e as decisões no `docs/07`, como "a confirmar pelo Lucas".
- [ ] **Step 4: Rodar** `npm run typecheck && npm test && npm run e2e`. Expected: tudo verde.
- [ ] **Step 5: Commit** `git commit -m "Testa a fase 4 de ponta a ponta e atualiza a documentação"`
