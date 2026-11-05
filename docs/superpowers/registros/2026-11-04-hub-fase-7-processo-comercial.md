# Registro da execução · Hub comercial, fase 7 (processo comercial)

Plano: [`docs/superpowers/plans/2026-11-04-hub-fase-7-processo-comercial.md`](../plans/2026-11-04-hub-fase-7-processo-comercial.md). Especificação: [`docs/17-processo-comercial.md`](../../17-processo-comercial.md). Executado em 04/11/2026, no modo na mesma sessão, depois do "bora construir" do Lucas.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits 0e0824e..671c285, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 2: complete (commits 671c285..5c23f0b, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  22.50s (transform 1.45s, setup 1.88s, collect 9.69s, tests 31.11s, environment 14.24s, prepare 3.29s))
- Task 3: complete (commits 38a12cc..40e5598, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 4: complete (commits 40e5598..f5ba515, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:api' → [vpw:debug] Shutting down runtimes...)
- Task 5: complete (commits f5ba515..43ec281, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  23.12s (transform 1.49s, setup 2.02s, collect 10.21s, tests 31.56s, environment 15.00s, prepare 3.30s))
- Task 6: complete (commits 43ec281..8365552, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 7: complete (commits 8365552..5006e1e, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 8: complete (commits 5006e1e..05cf14a, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 9: complete (commits 05cf14a..22fee45, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  23.80s (transform 1.59s, setup 2.05s, collect 10.49s, tests 32.58s, environment 15.64s, prepare 3.40s))
- Task 10: complete (commits 22fee45..f3116f3, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  25.09s (transform 1.49s, setup 2.18s, collect 10.73s, tests 33.57s, environment 17.27s, prepare 3.69s))
- Task 11: complete (commits f3116f3..fbf02fc, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test >/dev/null && npm run e2e' →   42 passed (1.5m))

## Decisões antes de começar (varredura das interfaces)

- T1→T2: ContagemLigacoes.conexoesSemana e "conexao" consumidos pelo bloco (sem conflito).
- T1→T8/T10: META_CONEXOES_SEMANA e resumoDoTime.conexoesSemana (sem conflito).
- T4→T5: registrarConfirmacao e Reuniao.fupsConfirmacao/confirmadaEm consumidos pela tela (sem conflito).
- T6→T8: listarReagendamentos alimenta o bloco reagendamentos (sem conflito).
- T7→T8: etapaDaProposta alimenta os blocos ap e construcao (sem conflito).
- T8→T9: DiaDeRotina.blocos consumido pela tela (sem conflito).

## Decisões tomadas durante a execução

- **Task 1:** o teste "ligações antigas continuam depois da migração" fica com o e2e (e2e:preparar aplica a 0007 sobre o banco local com dados); no pool de testes as migrações rodam sobre o banco vazio — custo se errado: uma falha da cópia só aparece no e2e.
- **Task 2:** o {nº de clientes} do roteiro virou a chave {clientes} (rótulo "nº de clientes"), porque o preenchimento só aceita chaves sem espaço; aparece como [nº de clientes] até ter o número — custo se errado: nenhum.
- **Task 2:** o passo 3 do roteiro não tem fala própria, só os dois desvios (3a e 3b de docs/17); o objetivo da ligação aparece acima do roteiro — custo se errado: nenhum.
- **Task 2:** o teste antigo do teclado passou a usar a tecla 3 para conexão e o medidor das conexões da semana; "Meta do dia batida" virou "Meta da semana batida" — custo se errado: nenhum.
- **Task 3:** Reuniao.observacoes é opcional no tipo (dados de teste antigos não têm o campo); vazio grava NULL — custo se errado: nenhum.
- **Task 5:** a Reuniao ganhou contato (opcional) para preencher {contato} da mensagem do grupo; {projetista} fica em colchetes para o hunter completar — custo se errado: nenhum.
- **Task 5:** depois de marcar, o formulário fica aberto com a mensagem para o Comercial & Projetos ("Copiar mensagem" e "Voltar às ligações"), em vez de fechar na hora — custo se errado: um clique a mais por diagnóstica marcada.
- **Task 5:** o FUP copia a mensagem antes de registrar; se o registro falhar, a mensagem já foi copiada e o aviso mostra o erro — custo se errado: o FUP sai sem ficar marcado no hub.
- **Task 6:** listarReagendamentos devolve Reuniao[] (a reunião cancelada traz empresa, contato e closer), não { oportunidade, reuniao } — basta para a tela e para a rotina — custo se errado: uma consulta a mais se outra tela precisar da oportunidade inteira.
- **Task 6:** o no-show não grava histórico (não há mudança de situação; evita o problema I1 da fase 6); o reagendamento leva as observações da última diagnóstica — custo se errado: o histórico não mostra o no-show (a reunião cancelada com o motivo mostra).
- **Task 7:** os dias "em negociação" no cartão do follow-up contam da apresentação da proposta (D0), sem consulta nova — é quando o lead entra em follow-up — custo se errado: diferença se a proposta foi registrada dias depois de apresentada.
- **Task 7:** valorPreparado e naEtapaDesde entram no SELECT_REUNIAO (subconsulta no histórico por reunião); com o volume de uma EJ a consulta continua pequena — custo se errado: agenda mais lenta com milhares de reuniões.
- **Task 8:** a tarefa que fica feita sozinha num bloco sem lead tem chave própria ("…-sem-lead"); quando um lead entra no bloco, aparece a tarefa de verdade, sem herdar o "feito" — custo se errado: nenhum.
- **Task 8:** ao gravar a rotina do dia, linhas fixas que não existem mais (chaves antigas) saem do dia; dias anteriores ficam como estavam no histórico — custo se errado: o dia da troca perde as marcações antigas.
- **Task 8:** os testes das fases 2 e 3 que listavam as chaves e os totais da rotina antiga foram ajustados aos blocos; o teste "reunião do dia vira item de confirmar" saiu (docs/17 tira as reuniões da rotina do closer) — custo se errado: nenhum.
- **Task 8:** confirmar a diagnóstica e reagendar pela rota atualizam a rotina do hunter na hora (como o toque faz com o closer) — custo se errado: nenhum.
- **Task 8:** confirmação e reagendamento ficam com link "/" (o Hoje do hunter, onde estão os botões) — custo se errado: um clique a mais.
- **Task 9:** cada bloco tem a sua lista ("Itens de {bloco}"), e a lista única "Itens da rotina" continua para um dia sem blocos; o medidor do topo mostra "% · feitos/total" — custo se errado: nenhum.
- **Task 11:** o e2e da fase 1 no celular achou a linha de Apresentações passando da tela com a etiqueta da etapa (438 px em 390); a linha agora quebra (flex-wrap) — custo se errado: nenhum.

## Revisão final

- revisor separado (modelo mais capaz), pacote 0e0824e..fbf02fc; nenhum crítico, 3 importantes, 9 menores.
- fixed I1 (depois do no-show o hub abria um briefing "em andamento" que podia ir para Projetos) — "o fechamento manda nao_compareceu" (volta ao Hoje com o aviso), "o briefing de uma reunião cancelada…" e "o briefing de um no-show não vai para Projetos" RED→GREEN; o briefing só é marcado como enviado depois da diagnóstica concluída
- fixed I2 (reunião cancelada hoje ainda mostrava Iniciar) — "a diagnóstica cancelada hoje mostra 'Não compareceu'…" RED→GREEN
- fixed I3 (a rotina do Hoje não atualizava depois de Confirmada e Reagendar) — "Confirmada atualiza a rotina do Hoje" RED→GREEN
- fixed M1, regraduado para importante (fechar com Esc depois de marcar deixava as conexões do Hoje sem o "marcou") — "marcar a diagnóstica atualiza as conexões do Hoje mesmo sem voltar às ligações" RED→GREEN
- fixed M4, regraduado para importante (orientações e tarefas dos blocos parafraseadas; o plano pede o texto de docs/17) — "as orientações e as tarefas dos blocos usam o texto de docs/17" RED→GREEN; suite app 257/257, api 179/179, e2e 42/42
- Ruling: o teste antigo "briefing marcado como enviado" passou a encerrar a diagnóstica antes (regra nova: só de diagnóstica concluída) — custo se errado: nenhum.
- minor (deferred): o foco se perde quando o formulário de marcar vira a mensagem do grupo.
- minor (deferred): o % do histórico pode contar um "Confirmar" feito de uma reunião que depois virou no-show.
- minor (deferred): a hora de cada FUP fica só no título/aria-label do botão (não aparece no toque).
- minor (deferred): "1 ligações hoje" (plural fixo).
- minor (deferred): o item de cold call na Rotinas mostra "1/8" sem dizer que são conexões; o cabeçalho da rotina no Hoje não mostra o %.
- minor (deferred): falta um índice em reunioes (oportunidade_id, tipo) para as subconsultas novas.
- minor (deferred): "Confirmada pelo cliente" usa o vermelho, que no Prancheta é alerta.
- minor (deferred): em docs/07, a linha da fase 7 ficou acima da linha da fase 6.
- Ruling (recusado a julgar): diagnóstica marcada por closer ou diretor (sem hunter) não tem botões de confirmação nem item na rotina — docs/17 só tem o hunter confirmando — custo se errado: o closer confirma por fora do hub.
- Ruling (recusado a julgar): closer sem nenhum lead fica com 100% pelas tarefas "sem lead" — é a regra de docs/17 — custo se errado: % alto sem trabalho.
- Ruling (recusado a julgar): o servidor aceita o no-show antes da hora da reunião e não trava os FUPs pelo horário — custo se errado: um no-show marcado cedo demais.
- Ruling (recusado a julgar): a cold message copiada sai com [contato] e [segmento], porque os dados do lead estão no CRM — custo se errado: o hunter completa à mão.

Verificação final: typecheck ok; app 257/257; api 179/179; e2e 42/42.

## Depois do merge (05/11/2026)

Quatro dos menores adiados foram corrigidos antes da reunião de 10/11, cada um com teste antes:
- "1 ligação hoje" no singular (Hoje do hunter e bloco de ligações);
- a hora de cada FUP no próprio botão ("FUP 2 · 13:00"; o FUP 1 diz "início do dia"), calculada por `horaDoFup` em `compartilhado/confirmacao.ts`;
- "Confirmada pelo cliente" com o check e a cor do texto, não o vermelho de alerta;
- o cold call na rotina mostra "1/8 conexões na semana", e o cabeçalho da rotina no Hoje mostra o % do dia.
