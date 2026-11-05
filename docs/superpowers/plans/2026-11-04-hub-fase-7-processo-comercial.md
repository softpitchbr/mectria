# Hub comercial · Fase 7 (processo comercial: rotina por blocos, conexões, confirmação e no-show) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O hub passa a seguir o processo comercial de `docs/17`. A rotina vira blocos de prioridade com o % do dia. O hunter registra a conexão (falou com quem decide) e vê as 8 conexões da semana. A diagnóstica marcada ganha observações, a confirmação em 3 FUPs e o "Cliente não compareceu", que volta para o hunter reagendar. O closer vê há quantos dias cada lead está na etapa, com alerta depois de 3 dias em construção de proposta.

**Architecture:** É a mesma das fases anteriores.
- **Regras puras** em `hub/compartilhado/`: a semana de São Paulo, a etapa da proposta e os blocos da rotina.
- **Conteúdo** em `hub/compartilhado/dados/`: o cold call novo, a cold message, os FUPs de confirmação, as mensagens dos grupos e os blocos com as orientações.
- **Migração `0007`:** conexão nas ligações, observações e confirmação nas reuniões.
- **Telas:** o bloco de ligações, a rotina em blocos, o Hoje do hunter (confirmações, reagendamentos e meta da semana), o fechamento da diagnóstica, Apresentações e Follow-up (dias na etapa), e o Hoje do diretor (conexões por hunter).

**Tech Stack:** a mesma, sem dependências novas.

**Spec:** `docs/17-processo-comercial.md`:
- seção "Metas";
- seções 1 (dia do hunter), 2 (cold call), 3 (confirmação), 4 (diagnóstica) e 5 (dia do closer);
- seção 6 ("O que isso muda no hub").

## Decisões deste plano (a confirmar pelo Lucas)

1. **Ligação com 4 resultados:** Não atendeu (1), Atendeu sem falar com quem decide (2), Conexão: falou com quem decide (3), Marcou a diagnóstica (4).
   - "Marcou" também conta como conexão.
   - A meta é de 8 conexões por semana, por hunter.
   - A semana vai de segunda a domingo, na hora de São Paulo.
2. **Item "Fazer o bloco de cold call":** continua feito com 1 ligação no dia. O item mostra as conexões da semana (de 8).
3. **No-show:**
   - "Cliente não compareceu" cancela a reunião com o motivo "Cliente não compareceu".
   - A oportunidade continua em `diagnostica_marcada` e entra em "Reagendamentos" do hunter que marcou.
   - Reagendar cria uma diagnóstica nova; uma só, mesmo com duplo clique.
4. **Construção × Apresentação de Proposta (AP):**
   - Uma oportunidade em `proposta_marcada` com a reunião de proposta sem valor preparado está em construção; com o valor preparado, está em AP.
   - Os dias na etapa contam da entrada na situação atual, pelo histórico que muda a situação (`de IS NOT para`).
   - O alerta aparece com mais de 3 dias corridos em construção.
5. **Blocos da rotina:**
   - Cada bloco tem uma tarefa fixa, que fica feita sozinha quando o bloco não tem nenhum lead.
   - Os itens gerados (toques do dia, reagendar, confirmar, reativar) entram no bloco deles.
   - As reuniões do dia saem da rotina do closer.
6. **Confirmação:**
   - O hub registra qual FUP saiu (1, 2 ou 3) e o "Confirmada".
   - As mensagens são copiadas para o WhatsApp.
   - As duas mensagens de grupo vão para o Comercial & Projetos ("ao marcar" e "confirmada"), com `{projetista}` em branco para completar.
7. **Observações ao marcar:** até 1.000 caracteres. Aparecem no painel da diagnóstica, no briefing e na confirmação.
8. **Fala do cold call:** usa o roteiro da seção 2 de `docs/17` sem mudar uma palavra. O `{nº de clientes}` fica como chave a preencher até o Marcelo responder (pedido 17).

## Global Constraints

- Tudo das fases 1 a 6 continua valendo:
  - pt-BR e MecTRIA;
  - centavos e fuso de São Paulo;
  - um botão vermelho por tela;
  - gravações em várias etapas num `db.batch` condicionado;
  - nenhuma consulta com lista de ids;
  - pedidos que mudam dados em JSON;
  - conteúdo só em `compartilhado/dados/`.
- As falas novas (cold call, cold message, FUP 1, 2 e 3, mensagem do grupo) são as de `docs/17`, sem mudar uma palavra.
- Meta: `META_CONEXOES_SEMANA = 8`. A meta antiga de 1 a 2 ligações por dia sai das telas.
- O hunter mexe só nas oportunidades que marcou; o closer dono e o diretor também podem.

## Review Focus

- **Virada da semana:** uma conexão no domingo às 22h de São Paulo conta na semana que termina nesse domingo. Teste na Task 1.
- **Rotina gravada antes da troca para blocos:** dias com chaves antigas (`confirmar-reunioes`, `hipotese-de-dor`, ...) continuam no histórico e no %, sem quebrar a tela. Teste na Task 8.
- **Reagendar duas vezes ao mesmo tempo:** só uma reunião nova. Teste na Task 6.
- **FUP fora de ordem ou depois de concluída:** FUP 3 antes do 2 é recusado (409); confirmar uma reunião concluída ou cancelada é recusado. Teste na Task 4.
- **Proposta registrada à mão, sem reunião de proposta:** não entra em construção nem em AP, e não quebra a rotina do closer. Teste na Task 7.

---

### Task 1: Conexão nas ligações e a semana de São Paulo

**Files:**
- Create: `hub/migrations/0007_processo.sql`.
  - Recria `ligacoes` com `CHECK (resultado IN ('nao_atendeu','atendeu','conexao','marcou'))`, copiando as linhas.
  - Adiciona `reunioes.observacoes TEXT`, `reunioes.fups_confirmacao INTEGER NOT NULL DEFAULT 0` e `reunioes.confirmada_em TEXT`.
- Modify:
  - `hub/compartilhado/datas.ts`: `inicioDaSemana(dia): string`, a segunda-feira da semana do dia.
  - `hub/compartilhado/oportunidade.ts`: `ResultadoLigacao` ganha `"conexao"`; `ContagemLigacoes` ganha `conexao`, `conexoesSemana` e `metaConexoesSemana`.
  - `hub/compartilhado/dados/rotinas.ts`: `META_CONEXOES_SEMANA = 8`.
  - `hub/servidor/rotina.ts`: contar e registrar conexões; `resumoDoTime` traz `conexoesSemana` dos hunters.
  - `hub/servidor/validacao.ts`: `validarLigacao` aceita `"conexao"`.
- Tests: `compartilhado/datas.test.ts`, `servidor/rotina.test.ts` e `servidor/rotas/fase7.test.ts`.

**Interfaces — Produces:**
- `inicioDaSemana(dia: string): string`.
- `contarLigacoes(db, pessoaId, dia): ContagemLigacoes`, com `conexoesSemana` = conexão + marcou, de segunda até o dia.
- `ResumoPessoa.conexoesSemana?: number`, só para hunters.

- [ ] **Testes:**
  - "inicioDaSemana: quarta 11/11/2026 dá segunda 09/11; domingo 15/11 dá 09/11; segunda 16/11 dá 16/11";
  - "conexão e marcou contam na semana; atendeu e não atendeu não";
  - "conexão de domingo às 22h em São Paulo conta na semana que termina no domingo";
  - "ligações antigas continuam depois da migração";
  - "resumo do time traz as conexões da semana dos hunters";
  - "POST /api/ligacoes aceita conexao e recusa outro valor".
- [ ] RED, implementação, GREEN, commit `git commit -m "Registra a conexão nas ligações e conta as conexões da semana"`

### Task 2: Cold call novo no bloco de ligações

**Files:**
- Modify:
  - `hub/compartilhado/dados/cold-call.ts`: `ROTEIRO_COLD_CALL` com os 5 passos da seção 2 de `docs/17`, cada um `{ titulo, fala, desvios?: { quando, fala }[], dica? }`; `COLD_MESSAGE`. Os desvios são o pedido de 30 segundos no passo 1, e o 3a e o 3b no passo 3.
  - `hub/src/telas/hoje/BlocoDeLigacoes.tsx`: 4 botões e teclas 1 a 4; o roteiro com os desvios; "Copiar cold message", com `{hunter}` preenchido pelo primeiro nome; o medidor das conexões da semana (de 8).
  - `hub/src/telas/Playbooks.tsx`: a aba Cold call mostra os desvios e a cold message.
- Tests: `src/telas/hoje/hoje.test.tsx`, `src/telas/Playbooks.test.tsx` e `compartilhado/dados` (teste do conteúdo).

- [ ] **Testes:**
  - "o roteiro é o de docs/17: abertura pede um minutinho e o desvio pede 30 segundos";
  - "tecla 3 registra conexão; tecla 4 abre marcar diagnóstica";
  - "o bloco mostra conexões da semana de 8";
  - "copiar cold message leva o nome do hunter".
- [ ] RED, implementação, GREEN, commit `git commit -m "Troca o roteiro do cold call e registra a conexão no bloco"`

### Task 3: Observações ao marcar a diagnóstica

**Files:**
- Modify:
  - `NovaDiagnostica` ganha `observacoes?: string`, com até 1.000 caracteres em `validarNovaDiagnostica`.
  - `criarDiagnostica` grava `reunioes.observacoes`.
  - `Reuniao` ganha `observacoes: string | null`, em `SELECT_REUNIAO` e `reuniaoDeLinha`.
  - `hub/src/telas/hoje/MarcarDiagnostica.tsx` ganha o campo "Observações".
  - O painel da diagnóstica mostra as observações no topo da ficha.
  - `hub/src/telas/Briefing.tsx` ganha a linha "Observações do hunter".
- Tests: `servidor/oportunidades.test.ts`, `servidor/rotas/fase7.test.ts`, `src/telas/hoje/hoje.test.tsx` e `src/telas/Briefing.test.tsx`.

- [ ] **Testes:**
  - "marcar diagnóstica grava as observações";
  - "observação com mais de 1.000 caracteres dá 400";
  - "o formulário manda as observações";
  - "o briefing mostra as observações do hunter".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona as observações ao marcar a diagnóstica"`

### Task 4: Confirmação da diagnóstica no servidor

**Files:**
- Create: `hub/compartilhado/dados/confirmacao.ts`, com o texto de `docs/17`, seção 3:
  - `FUPS_CONFIRMACAO: { numero: 1 | 2 | 3; quando: string; modelo: string }[]`;
  - `MENSAGEM_GRUPO_MARCADA`;
  - `MENSAGEM_GRUPO_CONFIRMADA`;
  - `GRUPO_CONFIRMACAO = "Comercial & Projetos"`.
- Create: `hub/servidor/confirmacao.ts` e o teste; rota `POST /api/reunioes/:id/confirmacao` com o corpo `{ fup: 1 | 2 | 3 }` ou `{ confirmada: true }`.
- Modify:
  - `Reuniao` ganha `fupsConfirmacao: number` e `confirmadaEm: string | null`;
  - `VARIAVEIS` ganha `hunter`, `hora`, `formato` e `projetista`.

**Interfaces — Produces:** `registrarConfirmacao(db, reuniaoId, acao: { fup: 1 | 2 | 3 } | { confirmada: true }): Promise<Reuniao>`. As regras:
- o FUP n só sai depois do n−1;
- repetir o mesmo FUP não muda nada;
- só vale para diagnóstica marcada ou em andamento;
- "confirmada" grava `confirmada_em` uma vez;
- os erros são `fora_de_ordem` e `ja_encerrada`, ambos 409.

- [ ] **Testes:**
  - "FUP 1, 2 e 3 em ordem";
  - "FUP 3 antes do 2 dá fora_de_ordem";
  - "confirmada grava a hora uma vez";
  - "reunião concluída ou cancelada recusa";
  - "o hunter que marcou e o closer dono confirmam; outro hunter recebe 403".
- [ ] RED, implementação, GREEN, commit `git commit -m "Registra os FUPs de confirmação e a reunião confirmada"`

### Task 5: Confirmação na tela do hunter

**Files:**
- Modify:
  - `hub/src/telas/hoje/HojeHunter.tsx`: a diagnóstica de hoje ganha os botões "FUP 1", "FUP 2" e "FUP 3". Cada um mostra o "quando", copia a mensagem preenchida e registra o FUP. "Confirmada" registra e copia a mensagem do grupo; depois dela, a reunião mostra "Confirmada".
  - `hub/src/telas/hoje/MarcarDiagnostica.tsx`: depois de marcar, mostra a mensagem "ao marcar" para o Comercial & Projetos, com "Copiar".
- Tests: `src/telas/hoje/hoje.test.tsx`.

- [ ] **Testes:**
  - "FUP 1 copia a mensagem com o nome do hunter, a data e a hora e registra";
  - "o FUP 2 só fica disponível depois do 1";
  - "Confirmada copia a mensagem do grupo com a empresa e o formato";
  - "depois de marcar aparece a mensagem para o Comercial & Projetos".
- [ ] RED, implementação, GREEN, commit `git commit -m "Mostra a confirmação da diagnóstica no Hoje do hunter"`

### Task 6: Cliente não compareceu e reagendamentos

**Files:**
- Modify:
  - `FechamentoDiagnostica` ganha `{ resultado: "nao_compareceu" }`;
  - `encerrarDiagnostica`: no "nao_compareceu", um batch põe a reunião em `cancelada` com o motivo "Cliente não compareceu" e `encerrada_em`, e registra o histórico `diagnostica_marcada → diagnostica_marcada` com o detalhe "Cliente não compareceu";
  - `validarFechamento`;
  - `hub/src/diagnostica/Fechamento.tsx`: terceira opção, "Cliente não compareceu".
- Create: `hub/servidor/reagendamento.ts` e o teste; rotas `GET /api/reagendamentos` e `POST /api/oportunidades/:id/reagendar` (`{ dataHora, formato }`).

**Interfaces — Produces:**
- `listarReagendamentos(db, quem): { oportunidade; reuniao: Reuniao }[]`: oportunidades em `diagnostica_marcada` cuja última diagnóstica foi cancelada por "Cliente não compareceu" e que não têm diagnóstica marcada ou em andamento. O hunter vê as que marcou; o closer, as dele; o diretor, todas.
- `reagendarDiagnostica(db, oportunidadeId, { dataHora, formato }, autor): Reuniao`: INSERT…SELECT condicionado a não haver diagnóstica marcada ou em andamento. O erro `ja_reagendada` dá 409.
- Na tela, o Hoje do hunter ganha a lista "Reagendar", com data, hora e formato em foco.

- [ ] **Testes:**
  - "não compareceu cancela a reunião e mantém a oportunidade em diagnóstica marcada";
  - "a oportunidade aparece em reagendamentos do hunter que marcou";
  - "reagendar cria uma reunião só, mesmo chamado duas vezes";
  - "o fechamento manda nao_compareceu";
  - "o Hoje do hunter reagenda em foco".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona o cliente não compareceu e os reagendamentos do hunter"`

### Task 7: Etapa e dias na etapa

**Files:**
- Create: `hub/compartilhado/etapa.ts`:
  - `etapaDaProposta(reuniaoDeProposta: { valorPreparado: boolean } | null): "construcao" | "ap" | null`;
  - `diasNaEtapa(desde: string, hoje: string): number`;
  - `ALERTA_CONSTRUCAO_DIAS = 3`.
- Modify:
  - `listarReunioes` traz `valorPreparado`, se a variável `valor` do JSON não é null, e `naEtapaDesde`, a data da última entrada na situação atual pelo histórico com `de IS NOT para`;
  - `listarFollowup` traz `naEtapaDesde`;
  - `hub/src/telas/Apresentacoes.tsx`: cada proposta mostra "Em construção há N dias" (alerta vermelho com mais de 3 dias) ou "Apresentação marcada";
  - `hub/src/telas/FollowUp.tsx`: o cartão mostra "Em negociação há N dias".
- Tests: `compartilhado/etapa.test.ts`, `servidor/oportunidades.test.ts`, `src/telas/Apresentacoes.test.tsx` e `src/telas/FollowUp.test.tsx`.

- [ ] **Testes:**
  - "sem valor preparado é construção; com valor, AP; sem reunião de proposta, null";
  - "dias na etapa contam pelo histórico que muda a situação";
  - "Apresentações mostra o alerta com 4 dias em construção";
  - "o cartão do follow-up mostra os dias em negociação".
- [ ] RED, implementação, GREEN, commit `git commit -m "Mostra há quantos dias cada lead está na etapa"`

### Task 8: Rotina por blocos no servidor

**Files:**
- Modify:
  - `hub/compartilhado/dados/rotinas.ts`: `BLOCOS_DA_ROTINA: Record<Cargo, BlocoDaRotina[]>`, no lugar de `ROTINA_FIXA`, com os títulos e as orientações de `docs/17` (seções 1 e 5).
  - `hub/compartilhado/oportunidade.ts`: `ItemRotina` ganha `bloco: string`; `DiaDeRotina` ganha `blocos: { id; titulo; orientacao: string | null; feitos; total }[]`.
  - `hub/servidor/rotina.ts`: monta os blocos e tira as reuniões do dia da rotina do closer.

Os blocos de cada cargo:
- **Hunter:**
  - `conversa`, com o fixo "Abrir os leads em conversa no CRM (status Contato estabelecido e marcador Retornar)";
  - `reagendamentos`, com os itens gerados "Reagendar {empresa}", feitos quando a reagendada já tem reunião nova;
  - `cold-call`, com o fixo automático "Fazer o bloco de cold call" e a contagem de conexões da semana de 8;
  - `confirmacoes`, com os itens gerados "Confirmar a diagnóstica de {empresa} às {hora}", feitos quando confirmada.
- **Closer:**
  - `fechamento`, com o fixo "Fazer o FUP de todos os leads em negociação" (feito sozinho sem lead em follow-up) e os toques do dia;
  - `ap`, com o fixo "Definir o próximo passo dos leads em Apresentação de Proposta" (feito sozinho sem lead em AP);
  - `construcao`, com o fixo "Construir as propostas pendentes e mandar o briefing para Projetos" (feito sozinho sem lead em construção);
  - `reativacao`, com os "Reativar {empresa}".
- **Diretor e Projetos:** sem blocos.

**Interfaces — Produces:** `type BlocoDaRotina = { id: string; titulo: string; orientacao: string | null; fixos: { chave: string; titulo: string; automaticoQuandoVazio?: true }[] }`. `ROTINA_FIXA` deixa de existir; `atualizarRotinaDe` olha `BLOCOS_DA_ROTINA[cargo].length`.

- [ ] **Testes:**
  - "rotina do closer em 4 blocos na ordem fechamento, AP, construção, reativação";
  - "bloco sem lead tem a tarefa feita";
  - "as reuniões do dia não entram na rotina do closer";
  - "rotina do hunter em 4 blocos com o cold call mostrando conexões da semana";
  - "dia gravado com chaves antigas continua no histórico e o % não quebra";
  - "% do dia: feitos sobre total de todos os blocos".
- [ ] RED, implementação, GREEN, commit `git commit -m "Organiza a rotina em blocos de prioridade"`

### Task 9: Rotina por blocos na tela

**Files:**
- Modify: `hub/src/telas/Rotinas.tsx`:
  - `ChecklistDaRotina` agrupa por bloco, com o título, "feitas de total" e a orientação;
  - o topo mostra o % do dia;
  - `RotinaDoTime` mostra o % por pessoa.
- Modify: `HojeHunter.tsx` e `HojeCloser.tsx`, que usam o checklist novo.
- Tests: `src/telas/Rotinas.test.tsx` e `src/telas/hoje/hoje.test.tsx`.

- [ ] **Testes:**
  - "a rotina aparece em blocos com feitas de total e a orientação";
  - "o topo mostra o % do dia";
  - "o resumo do time mostra o % de cada pessoa".
- [ ] RED, implementação, GREEN, commit `git commit -m "Mostra a rotina em blocos com o % do dia"`

### Task 10: Metas no Hoje

**Files:** Modify `HojeHunter.tsx` ("Conexões na semana", com medidor de 8) e `HojeDiretor.tsx` ("Conexões na semana" por hunter, de 8, a partir do `resumoDoTime`). Tests: `src/telas/hoje/hoje.test.tsx`.

- [ ] **Testes:** "o hunter vê 3 de 8 conexões na semana"; "o diretor vê as conexões da semana de cada hunter".
- [ ] RED, implementação, GREEN, commit `git commit -m "Mostra as metas de conexões da semana"`

### Task 11: Ponta a ponta e documentação

- [ ] **Semente:** uma diagnóstica de hoje da Helena ainda sem confirmação, um no-show da Helena para reagendar e uma proposta em construção há 4 dias.
- [ ] **`e2e/fase7.spec.ts`:**
  - o hunter registra conexão pela tecla 3 e vê a semana;
  - manda o FUP 1 e confirma;
  - reagenda o no-show;
  - o closer vê a rotina em blocos e o alerta de construção.
- [ ] **Documentação:**
  - `hub/README.md`;
  - `docs/07` (decisões da fase 7, "a confirmar");
  - `docs/03` (tarefa nova da fase 7);
  - `docs/17`, seção 6, com "feito" em cada linha construída.
- [ ] `npm run typecheck && npm test && npm run e2e` verdes; commit `git commit -m "Testa a fase 7 de ponta a ponta e atualiza a documentação"`

## Fora desta fase

- A troca do `{nº de clientes}` pelo número real (pedido 17).
- O grupo definitivo da mensagem de "confirmada" (a confirmar em 10/11).
- As apresentações em HTML por serviço (Instrumento) e o cadastro de serviços pelo diretor: um plano próprio.
- Os menores adiados da revisão da fase 6.
