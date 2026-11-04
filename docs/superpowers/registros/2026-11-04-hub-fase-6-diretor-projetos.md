# Registro da execução · Hub comercial, fase 6 (diretor, Projetos, cadência de 7 dias e reativação)

Plano: [`docs/superpowers/plans/2026-11-04-hub-fase-6-diretor-projetos.md`](../plans/2026-11-04-hub-fase-6-diretor-projetos.md). Especificação: [`docs/15-hub-template.md`](../../15-hub-template.md) e [`docs/16-pitch-e-fups.md`](../../16-pitch-e-fups.md). Executado em 04/11/2026, no modo na mesma sessão, depois do "pode seguir" do Lucas.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits 485a528..340ae50, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 2: complete (commits 340ae50..c15d3e5, tests: bash -c 'cd hub && npm run test:app' →    Duration  21.08s (transform 1.54s, setup 1.81s, collect 8.91s, tests 29.58s, environment 13.70s, prepare 2.98s))
- Task 3: complete (commits 17daf7d..832a0bc, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:api' → [vpw:debug] Shutting down runtimes...)
- Task 4: complete (commits 832a0bc..e6fb4cf, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:api' → [vpw:debug] Shutting down runtimes...)
- Task 5: complete (commits e6fb4cf..ca38289, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  20.76s (transform 1.41s, setup 1.79s, collect 8.65s, tests 29.23s, environment 13.24s, prepare 2.98s))
- Task 6: complete (commits ca38289..960aa73, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 7: complete (commits 960aa73..ac49c1a, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:api' → [vpw:debug] Shutting down runtimes...)
- Task 8: complete (commits ac49c1a..96e267e, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  21.49s (transform 1.61s, setup 1.89s, collect 9.79s, tests 29.66s, environment 13.90s, prepare 2.96s))
- Task 9: complete (commits 96e267e..0b3e2ff, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm run test:app' →    Duration  22.51s (transform 1.75s, setup 1.87s, collect 10.38s, tests 30.78s, environment 14.76s, prepare 3.08s))
- Task 10: complete (commits 0b3e2ff..1f13f6d, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test' → [vpw:debug] Shutting down runtimes...)
- Task 11: complete (commits 1f13f6d..ede597e, tests: bash -c 'cd hub && npm run typecheck >/dev/null && npm test >/dev/null && npm run e2e' →   38 passed (1.2m))

## Decisões antes de começar (varredura das interfaces)

- T1→T2: T2 usa a data do D7; consome a função de datas da cadência da T1 (sem conflito; T2 reaproveita).
- T3→T7/T9: migração 0006 da T3 traz pendencias.respondida_em/respondida_por usados na T7; retomarEm da T3 usado na T9 (sem conflito).
- T4→T5: numerosDoTime (inclui rotina) consumido pela aba Mês (sem conflito).
- T6→T5: botões de exportação ficam na T6, que modifica Time.tsx depois da T5 (sem conflito).
- T7→T8: rotas de pendências/briefings consumidas pela tela Briefings (sem conflito).

## Decisões tomadas durante a execução

- **Task 1:** sexta fixa feriado cujo dia útil anterior é o D0 (reunião na quinta antes de sexta feriado) — não sai SEXTA; o D1 vai para o dia útil seguinte — o plano só diz "desde que não seja o D0" — custo se errado: um toque a menos nessa semana.
- **Task 1:** reunião numa sexta com o D7 empurrado por feriado para a segunda — sem SEXTA separada e o D7 usa a mensagem normal (a mensagem junta só quando o D7 cai numa sexta) — a mensagem junta fala de "hoje" e "na segunda" — custo se errado: texto do D7 dessa semana.
- **Task 1:** testes das fases 2 e 4 que contavam 7 toques ou os textos da 0.2 foram ajustados à cadência nova (contagem via datasDaCadencia, títulos "D0 · WhatsApp") — o plano manda ajustar com ruling — custo se errado: nenhum além do teste.
- **Task 1:** a LIGACAO usa "Na ligação: ... Se não atender, no WhatsApp: ..." como a 0.2 fazia, com as falas de docs/16 sem mudar uma palavra — custo se errado: só a moldura do texto.
- **Task 2:** o teste antigo do fechamento limpa a data antes de checar "Informe a data da decisão." — a data agora já vem no D7 — custo se errado: nenhum.
- **Task 3:** adiarReativacao e perderNaReativacao recebem o autor (o plano dava adiarReativacao(db, id, retomarEm)) — precisam do histórico e da conferência de dono — custo se errado: uma assinatura.
- **Task 3:** "adiar" grava no histórico nutricao→nutricao com "Retomar em …", e a rotina marca "Reativar {empresa}" como feito quando há histórico saindo de nutrição no dia — é o único jeito de o item contar no % sem coluna nova — custo se errado: o item some ou fica pendente.
- **Task 3:** retomarEm é um dia (AAAA-MM-DD, o 1º do mês escolhido), válido deste mês em diante; mesesDesde = dias/30,44 arredondado, no mínimo 1, contado da última reunião ou apresentação — custo se errado: o {tempo} da mensagem erra por um mês.
- **Task 3:** rotas extras de erro em servidor/errosDaReativacao.ts; "fora_da_nutricao" dá 409 — custo se errado: nenhum.
- **Task 4:** numerosDoTime devolve também `mes`; porCloser lista só closers ativos; o % da rotina conta os dias em que a pessoa abriu a rotina (feitos ÷ itens gravados no mês), para todas as pessoas ativas — sem registro de dia não aberto não há total — custo se errado: quem nunca abre a rotina aparece com 0 de 0, não com 0%.
- **Task 4:** tempo médio = da data da diagnóstica (reunião) à data do registro de ganha/perdida, nas decididas no mês, com uma casa decimal; oportunidades sem diagnóstica ficam fora — custo se errado: média diferente da esperada.
- **Task 4:** "closer" nas objeções é o closer dono da oportunidade, como no plano, mesmo quando o hunter anotou — custo se errado: nome trocado na lista.
- **Task 5:** o mês é escolhido numa lista dos últimos 12 meses (select), não num campo type=month — o campo de mês varia entre navegadores e no jsdom — custo se errado: mês mais antigo que 12 meses não aparece na tela (a API aceita).
- **Task 5:** o teste antigo do Hoje do diretor deixou de checar o aviso "chegam na fase 6"; o bloco "Este mês" ganhou teste próprio — custo se errado: nenhum.
- **Task 6:** as duas exportações ficam numa rota só, /api/exportar/[arquivo] (historico.csv e tudo.json) — o roteamento de arquivo com ponto no nome nas Pages Functions é incerto — custo se errado: nenhum, os endereços são os do plano.
- **Task 6:** o CSV traz uma linha por proposta apresentada no mês, com o resultado até agora (decidida em = registro de ganha, perdida ou nutrição); campos que começam com = + - @ ganham apóstrofo (proteção contra fórmula no Excel); valores no formato 12.500,00 — custo se errado: o diretor esperava só as decididas no mês.
- **Task 6:** o contato apagado vira "Dados apagados (LGPD)" (não vazio), para as listas continuarem legíveis; textos livres das anotações não são varridos — custo se errado: um nome dito numa anotação continua lá.
- **Task 6:** o botão do diretor fica no briefing (/reunioes/:id/briefing), porque o hub não tem uma página de ficha da oportunidade; a confirmação é um grupo na própria página — custo se errado: o diretor precisa achar a reunião para apagar.
- **Task 7:** a lista de Projetos traz as abertas (pelo prazo, atrasadas primeiro) e depois as respondidas que faltam fechar; o diretor também responde e fecha — o plano fala só das abertas, mas fechar exige ver as respondidas — custo se errado: uma seção a mais na lista.
- **Task 7:** Projetos lê só a ficha da diagnóstica; a reunião de proposta (com valores) dá 403 — "Projetos não vê valores" — custo se errado: Projetos não abre o briefing de uma proposta (não existe briefing de proposta).
- **Task 7:** Pendencia ganhou respondidaEm e respondidaPor como campos opcionais, e ItemFollowup.respostasTecnicas opcional, para não mexer nos dados de teste das fases anteriores — custo se errado: nenhum.
- **Task 7:** o teste da fase 3 que esperava 403 de Projetos na ficha passou a esperar 200 (e 403 ao iniciar) — regra nova da fase 6 — custo se errado: nenhum.
- **Task 8:** o "link para o PDF" do briefing abre a página do briefing (/reunioes/:id/briefing), onde fica o Gerar PDF — o PDF é gerado pelo navegador, não guardado — custo se errado: um clique a mais.
- **Task 8:** o teste do shell "seção de fase futura" virou "diretor abre Briefings" — não sobra seção em construção; o componente EmConstrucao fica para seções futuras — custo se errado: nenhum.
- **Task 8:** o card do follow-up mostra a última resposta de Projetos e o toque em foco lista todas, para o closer usar na mensagem — custo se errado: nenhum.
- **Task 9:** "Retomar em" oferece os próximos 12 meses (o 1º dia de cada um) e, vazio, os 45 dias padrão; vale também no "não qualificou" da diagnóstica — custo se errado: o cliente que pediu para voltar ainda este mês cai no padrão.
- **Task 9:** o teste antigo "nutrição não promete lembrete que o hub não faz" virou "nutrição pede o mês para retomar" — o hub agora lembra — custo se errado: nenhum.
- **Task 9:** "Perdida" na reativação também ganhou teste (o plano listava só três) — custo se errado: nenhum.
- **Task 10:** os testes das fases 1 e 3 que diziam "o hunter só vê a reunião" e "o hunter vê Hoje, Playbooks e Rotinas" foram ajustados à regra nova (hunter conduz a diagnóstica e vê Reuniões; Ctrl K ganha "Ir para Reuniões") — decisão do Lucas e da MecTRIA em 04/11 — custo se errado: nenhum.
- **Task 10:** achado da Task 7 corrigido aqui — GET /api/reunioes/:id devolvia só reunião e oportunidade para quem não é dono, e o briefing de Projetos ficaria sem respostas; agora Projetos recebe a ficha inteira da diagnóstica (teste "Projetos recebe a ficha completa..." RED→GREEN) — custo se errado: nenhum.
- **Task 10:** no Hoje do hunter, "Iniciar" só aparece na diagnóstica do dia ainda em diagnostica_marcada; a agenda (Reuniões) mostra "Proposta com o closer …" no lugar do botão — custo se errado: o hunter abre a diagnóstica de outro dia pela agenda, não pelo Hoje.
- **Task 11:** o e2e do diretor confere o link do CSV e baixa pela API (page.request) — o download do navegador no teste sai sem o cabeçalho X-Dev-Email e recebe 401; em produção vai o cookie do Access — custo se errado: um download real quebrado em produção passaria no e2e.
- **Task 11:** o e2e da fase 1 que listava as seções do hunter ganhou "Reuniões" (regra da Task 10) — custo se errado: nenhum.

## Revisão final

(a preencher com o resultado da revisão do branch)

