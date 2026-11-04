# Hub comercial · Fase 6 (Diretor, Projetos, cadência de 7 dias e reativação) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O diretor vê os números do mês e o time numa tela e exporta os dados. Projetos recebe os briefings e responde as dúvidas técnicas com prazo. O follow-up passa à cadência de 7 dias com a sexta fixa, e a nutrição ganha a reativação no mês que o cliente indicou.

**Architecture:** É a mesma das fases anteriores.
- **Regras puras** em `hub/compartilhado/`: a cadência nova e o tempo desde a reunião.
- **Lógica no servidor** em `hub/servidor/`: `numeros.ts`, `pendencias.ts`, `reativacao.ts` e `exportar.ts`.
- **Migração `0006`:** `oportunidades.retomar_em` e os campos da resposta das pendências.
- **Telas:** a seção Briefings (Projetos e diretor), o Hoje de Projetos, os números no Hoje do diretor e a aba Reativação no Follow-up.

**Tech Stack:** a mesma, sem dependências novas.

**Spec:** `docs/15-hub-template.md`:
- seção 4 (Projetos e LGPD);
- seção 5 (Hoje do diretor e de Projetos, Briefings);
- seção 8 (números do diretor e saídas);
- seção 11, fase 6.

E `docs/16-pitch-e-fups.md` (cadência de 7 dias, sexta fixa e reativação, decididos pelo Lucas em 04/11/2026).

## Decisões deste plano (confirmadas pelo Lucas em 04/11/2026)

1. **A fase 6 vem antes da 5.** Os números do diretor e o Projetos entram antes do roleplay de aceite. O celular como controle fica opcional para o aceite.
2. **Conversão do mês:** ganhas ÷ (ganhas + perdidas) decididas no mês. Nutrição não conta como decisão.
3. **Valor vendido no mês:** soma do valor fechado das oportunidades ganhas no mês, pela data do registro de "ganha", no fuso de São Paulo. É o número do relatório mensal do contrato.
4. **Objeções do mês:** lista das anotações marcadas "Objeção" (texto, empresa, closer, data), as mais recentes primeiro. "Mais frequentes" exige objeções com identificador e fica para o conteúdo novo.
5. **CSV do Histórico:** colunas genéricas até chegar a planilha da MecTRIA (pedido 33). As colunas são empresa, serviço, closer, apresentada em, decidida em, resultado, valor apresentado, valor fechado e motivo.
6. **LGPD:** o diretor apaga os dados pessoais de um contato. Saem contato, telefone, e-mail, quem decide e os nomes da sala. Ficam os dados do projeto. O histórico registra "dados pessoais apagados a pedido (LGPD)".
7. **Reativação:**
   - ao mandar para nutrição, o closer escolhe o mês para retomar; sem escolha, são 45 dias;
   - "Marcar reunião" cria uma diagnóstica nova para a mesma oportunidade, que volta para `diagnostica_marcada`.
8. **Pendência respondida no follow-up:** a resposta de Projetos aparece no card do follow-up da oportunidade, para entrar no próximo toque (spec, seção 6, "Técnico").
9. **Cadência de 7 dias:**
   - D0;
   - D1 (no dia útil seguinte; se for sexta, a sexta fixa fica no lugar);
   - ligação (D0 + 2 dias úteis, pulando a sexta);
   - sexta fixa (a primeira sexta depois do D0; se for feriado, o dia útil anterior, desde que não seja o D0);
   - D7 (D0 + 7 dias corridos; se cair em feriado, o dia útil seguinte).
   - Reunião numa sexta: a sexta seguinte é o D7, com a mensagem das duas juntas.
   - As propostas antigas continuam com os toques que já têm.
10. **% da rotina no mês por pessoa** (meta nova de `docs/17`): itens de rotina feitos ÷ itens do mês, por pessoa, na tabela `rotinas`. As 8 conexões por semana ficam para o plano do processo comercial, porque a ligação ainda não registra a conexão.
11. **O hunter conduz a diagnóstica** (normalmente hunter + projetista, resposta da MecTRIA em 04/11/2026):
   - o hunter que marcou a diagnóstica abre, conduz e encerra o painel dela; o closer dono e o diretor continuam podendo;
   - a seção Reuniões passa a aparecer para o hunter, com as reuniões das oportunidades dele; ele só tem "Iniciar" nas diagnósticas;
   - a proposta continua só do closer dono e do diretor.

## Global Constraints

- Tudo das fases 1 a 4 continua valendo (pt-BR, MecTRIA, centavos, fuso de São Paulo, um botão vermelho por tela, gravações em várias etapas num `db.batch` condicionado, nenhuma consulta com lista de ids, pedidos que mudam dados em JSON).
- **Permissões:**
  - Projetos vê os briefings, as fichas e as pendências, e responde e fecha pendências; não vê follow-up, valores nem números.
  - O diretor vê tudo, exporta e apaga dados pessoais.
  - O closer vê as respostas das pendências das oportunidades dele.
- As mensagens novas (D0, D1, ligação, sexta, D7, reativação) são as de `docs/16-pitch-e-fups.md`, sem mudar uma palavra.
- Códigos dos toques novos: `D0`, `D1`, `LIGACAO`, `SEXTA` e `D7`. Os antigos (`D3`, `D5`, `D8`, `D12`, `D15`) continuam válidos para as propostas já registradas.

## Review Focus

- **Virada do mês e fuso:** uma ganha registrada às 22h do dia 30 em São Paulo conta no mês 30, não no seguinte. Teste na Task 4.
- **Proposta antiga com a cadência de 15 dias:** os toques dela continuam aparecendo e vencendo, e a rotina não quebra. Teste na Task 1.
- **Projetos digitando o endereço de outra tela:** `/follow-up` e `/api/followup` dão 403 e a tela de sem acesso. Teste na Task 7.
- **Apagar dados pessoais duas vezes, ou depois o briefing:** a segunda vez não falha, e o briefing e o PDF não mostram mais o nome. Teste na Task 6.
- **Nutrição antiga, sem `retomar_em`:** aparece na reativação 45 dias depois da entrada em nutrição (pela data do histórico). Teste na Task 3.
- **Hunter digitando o endereço da proposta ou da diagnóstica de outro hunter:** 403 e a tela de sem acesso. Teste na Task 10.

---

### Task 1: Cadência de 7 dias com a sexta fixa

**Files:** Modify `hub/compartilhado/cadencia.ts`, `hub/compartilhado/dados/cadencia.ts` (as 5 mensagens novas e a da sexta que é o D7), `hub/compartilhado/cadencia.test.ts`, `hub/servidor/rotina.ts` e `hub/src/telas/followup/*` (rótulo dos códigos novos).

**Interfaces — Produces:**
- `type CodigoToque = "D0" | "D1" | "LIGACAO" | "SEXTA" | "D7" | "D3" | "D5" | "D8" | "D12" | "D15"`;
- `datasDaCadencia(apresentadaEm, feriados?)`: as regras da decisão 9;
- `ROTULO_TOQUE: Record<CodigoToque, string>` ("D0", "D1", "Ligação", "Sexta", "D7"…);
- `modeloDoToque(codigo, apresentadaEm)`: devolve a mensagem da sexta que também é o D7 quando a reunião foi numa sexta.

- [ ] **Step 1: Testes que falham:**
  - "cadência de 7 dias pelo dia da reunião": reunião na segunda 09/11/2026 dá D0 09/11, D1 10/11, LIGACAO 11/11, SEXTA 13/11 e D7 16/11. As outras linhas seguem a tabela de `docs/16`: quarta tem a ligação na segunda seguinte, quinta tem a sexta no lugar do D1 e a ligação na segunda, e sexta tem o D7 na sexta seguinte, sem SEXTA separada.
  - "sexta feriado vai para o dia útil anterior": 20/11/2026 é feriado.
  - "D7 em feriado vai para o dia útil seguinte".
  - "toques antigos D3 a D15 continuam com rótulo e entram na rotina".
- [ ] **Step 2: Rodar.** Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** `npm test`. Expected: passa (os testes da fase 2 que esperavam a cadência de 15 dias são ajustados, com ruling).
- [ ] **Step 5: Commit** `git commit -m "Troca a cadência para 7 dias com o FUP fixo de sexta"`

### Task 2: Fechamento da proposta com o D7

**Files:** Modify `hub/src/reuniao/FechamentoDaProposta.tsx` e o teste.

- [ ] "Vai decidir" e "Pediu ajuste" já vêm com a data da decisão no D7 (hoje + 7 corridos; se for feriado, o dia útil seguinte). O closer pode trocar. Teste RED→GREEN no `painel.test.tsx`.
- [ ] Commit `git commit -m "Preenche a data da decisão com o D7 no fechamento da proposta"`

### Task 3: Reativação no servidor

**Files:** Create `hub/migrations/0006_fase6.sql` (`oportunidades.retomar_em TEXT`; `pendencias.respondida_em`, `respondida_por`), `hub/servidor/reativacao.ts` e o teste; Modify `registrarResultado` (nutrição recebe `retomarEm`), `encerrarDiagnostica` (não qualificou recebe `retomarEm`), `hub/servidor/rotina.ts` (item "Reativar {empresa}") e as rotas.

**Interfaces — Produces:**
- `listarReativacao(db, quem, hoje): ItemReativacao[]`. Lista as oportunidades em nutrição com `retomar_em ≤ hoje`; sem `retomar_em`, usa a entrada em nutrição + 45 dias. O closer vê as dele e o diretor vê todas. Cada item traz `{ oportunidade, ultimaReuniao, mesesDesde }`.
- `adiarReativacao(db, id, retomarEm)`.
- `reativarComReuniao(db, id, NovaReuniao, autor)`: num batch, cria a diagnóstica e volta a oportunidade para `diagnostica_marcada`, só se ela ainda estiver em nutrição.
- `perderNaReativacao(db, id, motivo, autor)`.
- Rotas `GET /api/reativacao`, `POST /api/reativacao/:id/{adiar,reuniao,perdida}`.

- [ ] **Testes:**
  - "nutrição com retomar_em em dezembro só aparece em dezembro";
  - "nutrição antiga sem retomar_em aparece 45 dias depois do histórico";
  - "marcar reunião volta para diagnostica_marcada e cria a diagnóstica, uma vez só";
  - "adiar troca o mês";
  - "a rotina do closer ganha Reativar {empresa} no dia".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona a reativação das oportunidades em nutrição"`

### Task 4: Números do diretor no servidor

**Files:** Create `hub/servidor/numeros.ts` e o teste; rota `GET /api/time/numeros?mes=AAAA-MM`.

**Interfaces — Produces:** `numerosDoTime(db, mes): { propostas; ganhas; perdidas; conversao: number | null; valorVendido; tempoMedioDias: number | null; pactosPorReuniao: number | null; objecoes: { texto; empresa; closer; dia }[]; porCloser: { pessoa; propostas; ganhas; valorVendido }[]; rotina: { pessoa; feitos; total }[] }`.

- [ ] **Testes:**
  - "conversão é ganhas sobre decididas e ignora nutrição";
  - "valor vendido soma o valor fechado das ganhas do mês";
  - "ganha às 22h do dia 30 em São Paulo conta no próprio mês";
  - "tempo médio da diagnóstica à decisão em dias";
  - "objeções do mês, as mais recentes primeiro";
  - "% da rotina do mês por pessoa soma os itens feitos e o total dos dias do mês";
  - "só o diretor acessa a rota".
- [ ] RED, implementação, GREEN, commit `git commit -m "Calcula os números do mês para o diretor"`

### Task 5: Números no Hoje do diretor e na seção Time

**Files:** Modify `hub/src/telas/hoje/HojeDiretor.tsx`, `hub/src/telas/Time.tsx` (aba "Mês") e os testes.

- [ ] **O que entra:**
  - no Hoje do diretor, um bloco do mês com propostas, fechadas, conversão e valor vendido;
  - em Time, a aba "Mês", com a escolha do mês, os números por closer, o % da rotina de cada pessoa no mês, as objeções do mês e os botões de exportação (Task 6).
- [ ] **Testes:** "Hoje do diretor mostra conversão e valor vendido do mês"; "a aba Mês troca o mês e relê os números".
- [ ] RED, implementação, GREEN, commit `git commit -m "Mostra os números do mês ao diretor"`

### Task 6: Saídas e LGPD

**Files:** Create `hub/servidor/exportar.ts` e o teste; rotas `GET /api/exportar/historico.csv?mes=` e `GET /api/exportar/tudo.json`, e `POST /api/oportunidades/:id/apagar-dados-pessoais` (só o diretor); Modify `Time.tsx` (botões) e a ficha da oportunidade (o botão do diretor, com confirmação).

- [ ] **Testes:**
  - "CSV do mês com as colunas da decisão 5, separado por ponto e vírgula e com BOM para o Excel";
  - "exportação completa traz todas as tabelas";
  - "apagar dados pessoais limpa contato, telefone, e-mail, quem decide e a sala, registra no histórico e pode ser repetido";
  - "o briefing de uma oportunidade apagada não mostra o nome";
  - "closer e Projetos recebem 403".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona as exportações e a exclusão de dados pessoais"`

### Task 7: Pendências técnicas no servidor

**Files:** Create `hub/servidor/pendencias.ts` e o teste; rotas `GET /api/pendencias`, `POST /api/pendencias/:id/responder` e `POST /api/pendencias/:id/fechar`, `GET /api/briefings`; Modify `acessarReuniao` (Projetos lê a ficha e o briefing) e `listarFollowup` (traz as pendências respondidas).

- [ ] **Testes:**
  - "Projetos lista as abertas, as atrasadas primeiro";
  - "responder grava a resposta, quem respondeu e quando";
  - "fechar só depois de responder";
  - "o card do follow-up traz a resposta";
  - "Projetos não acessa /api/followup nem os números";
  - "closer não responde pendência".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona as pendências técnicas para Projetos"`

### Task 8: Seção Briefings e Hoje de Projetos

**Files:** Create `hub/src/telas/Briefings.tsx` e o teste; Modify `hub/src/App.tsx` (a seção deixa de estar "em construção"), `hub/src/telas/Hoje.tsx` (Hoje de Projetos) e `hub/src/telas/FollowUp.tsx` (mostrar a resposta no card).

- [ ] **O que entra:**
  - **Briefings:** os enviados para Projetos (os mais novos primeiro, com link para o PDF) e as pendências abertas com prazo (atrasado ou hoje), cada uma respondida em modo foco;
  - **Hoje de Projetos:** briefings novos e pendências abertas.
- [ ] **Testes:**
  - "Projetos vê os briefings e responde uma pendência em foco";
  - "o diretor vê a seção Briefings";
  - "o closer não vê Briefings";
  - "o card do follow-up mostra a resposta de Projetos".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona a seção Briefings e o Hoje de Projetos"`

### Task 9: Aba Reativação e o "Retomar em"

**Files:** Modify `hub/src/telas/followup/Resultado.tsx` (nutrição pede o mês), `hub/src/diagnostica/Fechamento.tsx` (não qualificou pede o mês) e `hub/src/telas/FollowUp.tsx` (aba Reativação); Create `hub/src/telas/followup/Reativacao.tsx` e o teste.

- [ ] **O que entra:**
  - a aba lista os cards do mês, com a mensagem de `docs/16` e o `{tempo}` preenchido;
  - "Copiar mensagem";
  - "Marcar reunião" abre a data e a hora em foco;
  - "Ainda não" pede o novo mês;
  - "Perdida" pede o motivo.
- [ ] **Testes:**
  - "nutrição pede o mês para retomar e manda retomarEm";
  - "a mensagem de reativação sai com '3 meses'";
  - "marcar reunião manda a nova diagnóstica";
  - "ainda não troca o mês".
- [ ] RED, implementação, GREEN, commit `git commit -m "Adiciona a aba Reativação ao follow-up"`

### Task 10: O hunter conduz a diagnóstica

**Files:** Modify `hub/compartilhado/permissoes.ts` (`reunioes` inclui o hunter), `hub/servidor/acessoReuniao.ts` (o hunter que marcou é dono da diagnóstica, não da proposta), `hub/src/telas/Reunioes.tsx` (o hunter só tem ação nas diagnósticas) e `hub/src/telas/hoje/HojeHunter.tsx` ("Iniciar" na diagnóstica do dia); Test `hub/compartilhado/permissoes.test.ts`, `hub/servidor/rotas/fase6.test.ts` e `hub/src/telas/Reunioes.test.tsx`.

- [ ] **Testes:**
  - "o hunter vê a seção Reuniões";
  - "o hunter que marcou inicia, anota e encerra a diagnóstica";
  - "o hunter recebe 403 na proposta e na diagnóstica de outro hunter";
  - "o closer dono continua conduzindo a diagnóstica";
  - "na agenda do hunter, a proposta não tem Iniciar".
- [ ] RED, implementação, GREEN, commit `git commit -m "Deixa o hunter conduzir a diagnóstica que marcou"`

### Task 11: Ponta a ponta e documentação

- [ ] **Semente:** uma oportunidade em nutrição com o mês de retomar já vencido, uma pendência técnica aberta e uma ganha no mês.
- [ ] **`e2e/fase6.spec.ts`:**
  - o diretor vê os números e exporta o CSV;
  - Projetos responde uma pendência e o closer vê a resposta no follow-up;
  - o closer reativa marcando uma reunião;
  - a proposta nova cria os toques de 7 dias;
  - o hunter conduz a diagnóstica que marcou.
- [ ] **Documentação:**
  - `hub/README.md`;
  - `docs/07` (decisões da fase 6, "a confirmar");
  - `docs/03` (tarefa 58, construída e em revisão).
- [ ] `npm run typecheck && npm test && npm run e2e` verdes; commit `git commit -m "Testa a fase 6 de ponta a ponta e atualiza a documentação"`

## Fora desta fase

- **As apresentações em HTML interativo, uma por serviço, mais a padrão da diagnóstica** (Instrumento, S6 e S7): um plano próprio. A janela separada continua; ela passa a carregar o HTML do serviço, e o hub controla a apresentação por um contrato (slide atual e dados do cliente de um lado; dor clicada, preço revelado e calculadora do outro). O roteiro por slide fica no painel e passa a ser por serviço (decisão do Lucas, 04/11/2026, no `docs/07`).
- **Celular como controle** (fase 5).
- **A troca dos textos da versão 0.2** pelo conteúdo real (processos, objeções e playbooks), quando o Lucas entregar.
