# Registro da execução · Hub comercial, fase 2 (rotina e follow-up)

Plano: [`docs/superpowers/plans/2026-11-03-hub-fase-2-rotina-followup.md`](../plans/2026-11-03-hub-fase-2-rotina-followup.md). Especificação: [`docs/15-hub-template.md`](../../15-hub-template.md). Executado em 02/11/2026, no modo nativo, com as 6 decisões do plano confirmadas pelo Lucas (meta de ligações: 1 a 2 por dia) e uma revisão final independente do branch inteiro.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits ebb3b10..b5a8eaa, tests: npm test → app 68/68; api 46/46; typecheck ok)
- Task 2: complete (commits b5a8eaa..7340a9e, tests: npx vitest run compartilhado → 4 arquivos 14/14; typecheck ok)
- Task 3: complete (commits 7340a9e..298cbfa, tests: npm run test:api → 6 arquivos 52/52; typecheck ok)
- Task 4: complete (commits 298cbfa..5c8c95d, tests: npm run test:api → 7 arquivos 61/61; typecheck ok)
- Task 5: complete (commits 5c8c95d..1193778, tests: npm run test:api → 8 arquivos 68/68; typecheck ok)
- Task 6: complete (commits 1193778..c670801, tests: npm test → app 76/76; api 80/80; typecheck ok; wrangler pages functions build ok)
- Task 7: complete (commits c670801..c17dccd, tests: npx vitest run → 16 arquivos 82/82; typecheck ok; FLIP medido no Chromium)
- Task 8: complete (commits c17dccd..5f3f345, tests: npx vitest run → 17 arquivos 89/89; typecheck ok; capturas claro, escuro e celular sem vazamento)
- Task 9: complete (commits 5f3f345..f92af39, tests: npx vitest run → 18 arquivos 94/94; typecheck ok)
- Task 10: complete (commits f92af39..68f1a2c, tests: npx vitest run → 19 arquivos 99/99; typecheck ok; capturas dos três cargos, notebook e celular, sem vazamento)
- Task 11: complete (commits 68f1a2c..5fa8127, tests: npm test → app 99/99; api 81/81; typecheck ok; npm run e2e → 19/19)

## Decisões antes de começar (varredura das interfaces)

- Task 4 → Task 5 (rotina usa os toques): listarFollowup devolve só o próximo toque, e a rotina precisa de todos os vencidos. Pre-flight: Ruling: rotina.ts consulta a tabela toques direto (toques com previsto_para <= dia de propostas em_followup do closer) em vez de listarFollowup — o brief da Task 5 pede um item por toque vencido — custo se errado: nenhum.
- Task 6 → Task 10 (Hoje): o Hoje do closer precisa da próxima reunião e dos números do mês, e o do hunter das diagnósticas que marcou, mas a Task 6 não tem rota para isso. Pre-flight: Ruling: a Task 6 ganha GET /api/reunioes (?de=AAAA-MM-DD&ate=AAAA-MM-DD; hunter: reuniões das oportunidades dele; closer: as dele; diretor: todas; Reuniao com closerNome) e GET /api/numeros/mes ({ propostas, ganhas } do mês, closer: as dele, diretor: todas; função numerosDoMes(db, quem, hoje) em followup.ts) — sem elas o Hoje da Task 10 não tem de onde ler — custo se errado: duas rotas a mais.

## Decisões tomadas durante a execução

- **Task 1:** o teste do JWT HS256 já passava antes da mudança (o jose não acha chave HS256 no JWKS RS256); ficou como teste de regressão e a mudança (algorithms e requiredClaims) entrou mesmo assim, como o plano prevê — custo se errado: nenhum.
- **Task 1:** atualizar() e atualizarProtegendoDiretor() dividem o montarSet; o PATCH usa só a protegida (null = último diretor, porque a pessoa já foi encontrada antes); acrescentado o teste "muda quem não é diretor sem olhar a contagem" — o brief não cobria o caso comum — custo se errado: nenhum.
- **Task 2:** os arquivos de conteúdo foram gerados executando o JS da versão 0.2 (fup.js, servicos.js, cold-call.js) e gravando o resultado, para não mudar uma palavra; os códigos dos toques são "D" + dia — o plano pede o texto sem mudança — custo se errado: nenhum.
- **Task 2:** lerReais recusa formatos ambíguos como "12.50" (null) e aceita "R$" e espaços; formatarReais troca o espaço fixo do Intl por espaço comum — o brief fixa "R$ 12.500,00" — custo se errado: quem digitar "12.50" vê erro e corrige.
- **Task 3:** listarReunioes recebe filtro { closerId?, hunterId? } em vez de só closerId, e Reuniao traz closerNome — a rota GET /api/reunioes do pre-flight filtra o hunter pelas oportunidades dele e o Hoje do hunter mostra o closer — custo se errado: nenhum.
- **Task 3:** closer ou diretor que marca diagnóstica não vira hunter da oportunidade (hunter_id null), e "assumir" grava no histórico uma linha com a mesma situação e o detalhe "assumida por {nome}"; NovaDiagnostica foi para compartilhado/oportunidade.ts (a tela também usa) — o brief não diz — custo se errado: nenhum.
- **Task 4:** o follow-up usa só a proposta mais recente de cada oportunidade (se o closer registrar de novo, a anterior e os toques dela saem da lista); a ordem desempata por data do próximo toque, data de apresentação e id — o brief não trata proposta reapresentada — custo se errado: toques antigos somem da lista.
- **Task 4:** numerosDoMes (do pre-flight) entrou nesta task com teste: propostas contam pelo mês de apresentação; ganhas, pelo mês do registro no histórico (UTC−3) e só se a oportunidade continua ganha; donoDoToque() acrescentado para a rota conferir o dono — o Hoje do closer precisa dos números — custo se errado: nenhum.
- **Task 4:** oportunidade criada por registro manual nasce direto em em_followup, com histórico null → em_followup e detalhe "proposta registrada" — evita duas linhas de histórico para um passo só — custo se errado: nenhum.
- **Task 5:** item de toque entra no dia quando está pendente com data até o dia, ou quando já foi gravado na rotina daquele dia (aí fica, e marca feito quando o toque é feito); pendente de proposta encerrada sai; gerado não feito que deixou de existir é removido da tabela rotinas do dia — sem isso, toque feito sumiria do dia ou ficaria para sempre — custo se errado: histórico de um dia pode mudar enquanto ele é o dia corrente.
- **Task 5:** rotinaDoDia ganhou o parâmetro persistir (padrão true); resumoDoTime usa false para o diretor não criar a rotina de quem não abriu o hub (o histórico continua 0/0); reunião cancelada não vira item; marcarItem recebe a Pessoa (não só o id), porque precisa do cargo para montar o dia — custo se errado: nenhum.
- **Task 5:** no meu teste do resumo, o total do Carlos estava errado (9); o certo é 8 (4 fixos + D0, D1, D3 e D5 vencidos) — erro do teste, corrigido antes de implementar — custo se errado: nenhum.
- **Task 6:** rotas GET /api/reunioes (padrão: hoje + 6 dias) e GET /api/numeros/mes entraram conforme o pre-flight; diasDepois foi para compartilhado/datas.ts (arquivo em functions/ só exporta rotas) e ganhou um teste escrito depois de mover o código (refatoração coberta pelas rotas) — custo se errado: nenhum.
- **Task 6:** regras de dono numa função eDonoDaOportunidade (diretor sempre; closer quando a oportunidade é dele ou não tem closer); proposta para oportunidade existente exige situação diagnostica_marcada ou proposta_marcada (senão 400) e dono (senão 403); valor "0" é recusado; resultado de toque precisa de 1 a 500 caracteres; ligação, PUT de rotina e PATCH de assumir validam o corpo — o brief não fixa esses detalhes — custo se errado: mensagens a ajustar.
- **Task 6:** GET /api/closers lista closers e diretores ativos para qualquer cargo logado (o hunter precisa escolher o closer da diagnóstica) — custo se errado: o hunter vê o nome dos closers.
- **Task 7:** o foco inicial vai para o primeiro elemento focável do conteúdo (não para "Sair do foco", que vem antes na ordem do Tab) — o brief diz "o primeiro elemento focável dentro"; para quem usa, começar na ação faz mais sentido — custo se errado: um Tab a mais para chegar à ação.
- **Task 7:** o FLIP zera transform e transition antes de medir — no StrictMode de desenvolvimento o efeito roda duas vezes e a segunda medida pegava a caixa já transformada, e aí não havia animação (medido no Chromium: escala 0,37 → 1 em 420 ms; com movimento reduzido, sem transformação). Não há teste automático de layout para isso no jsdom; o e2e da Task 11 cobre o movimento reduzido — custo se errado: o foco aparece sem crescer.
- **Task 7:** no celular (até 760 px), o foco ocupa a tela inteira; Medidor ganhou aria-valuetext e o teste "não passa do total" — o brief não detalha — custo se errado: nenhum.
- **Task 8:** criados os componentes Selecao e AreaDeTexto (com estilos em Campo.module.css) e CANAIS_DE_TOQUE foi para compartilhado/oportunidade.ts (a tela e a validação usam) — o brief não lista esses arquivos — custo se errado: nenhum.
- **Task 8:** ?toque=ID abre o toque só quando ele é o próximo da proposta (a lista só traz o próximo); proposta sem toque abre direto o Resultado; o canal sugerido de "WhatsApp + e-mail" é WhatsApp; o título do foco é "Toque {código} · {empresa}" — o brief não detalha — custo se errado: o link da rotina para um toque que não é o próximo só abre a lista.
- **Task 8:** o teste de navegação da busca (fase 1) esperava "Follow-up chega na fase 2." e passou a esperar o título "Follow-up", porque a tela agora existe; no teste novo, a lista de cartões é procurada dentro do main (o menu lateral também é lista) — custo se errado: nenhum.
- **Task 8:** com o foco aberto aparecem dois botões vermelhos (o da página, desfocado atrás, e o do foco) — a regra "um por tela" vale para o que está em foco; o fundo recua desfocado, como pede a spec — custo se errado: trocar o botão da página para secundário quando houver foco.
- **Task 9:** além do ChecklistDaRotina, Rotinas.tsx exporta o hook useRotinaDeHoje e o RotinaDoTime, para o Hoje (Task 10) reaproveitar; dia sem registro aparece como "Não abriu"; o diretor vê "em dia" ou "N atrasados" — o brief não detalha — custo se errado: nenhum.
- **Task 10:** VARIAVEIS ganhou decisor ("nome do decisor"), dor1 e dor2, para o roteiro de cold call mostrar [nome do decisor] e [primeira dor] — o brief pede "[nome do decisor]" — custo se errado: nenhum.
- **Task 10:** a diagnóstica marcada envia data e hora em dois campos (Data e Hora, que viram dataHora) e formato online por padrão; depois de salvar, o bloco volta aos botões e relê a contagem; ao sair do foco, o Hoje relê reuniões e rotina (useRotinaDeHoje ganhou recarregar) — o brief não detalha — custo se errado: nenhum.
- **Task 10:** o medidor da próxima reunião enche conforme a reunião se aproxima (valor = 1440 − minutos que faltam, total 1440); "Iniciar reunião" é o botão vermelho da tela, desligado; o roteiro diz "Aqui é o {vendedor}", que fica estranho com nome feminino ("o Helena"), mas o texto da versão 0.2 não muda nesta fase — custo se errado: revisar o roteiro na fase 3 (conteúdo dos playbooks).
- **Task 11:** o e2e achou que um toque feito antes de abrir a rotina do dia sumia do dia; a rotina passou a incluir os toques feitos no dia (date(feito_em, '-3 hours') = dia), com o teste "toque feito hoje antes de abrir a rotina aparece como feito" RED→GREEN — é o comportamento que o brief da Task 5 pede ("feito quando o toque está feito") — custo se errado: nenhum.
- **Task 11:** a semente usa um INSERT por toque (o D1 recusa um SELECT com sete UNION ALL) e limpa as tabelas da fase 2 antes das pessoas; os testes da fase 2 rodam em série (um depende do outro: o hunter marca, o closer registra, o diretor vê); as decisões da fase 2 já estavam no docs/07 desde a aprovação do plano (commit ebb3b10); docs/03 ganhou as tarefas 51 a 60, iguais às do script do ERP — custo se errado: nenhum.

## Revisão final: o que foi corrigido

Revisor independente; veredito "pronto com correções", nada crítico. Correções no commit `aaf76e2`. Resultado depois delas: typecheck sem erros, interface 105/105, API 89/89 e ponta a ponta 20/20.

- I1 limite de 100 parâmetros do D1 (listarFollowup, toquesDoDia, DELETE da rotina) — "volume: o follow-up do diretor funciona com 120 propostas na rua" e "volume: closer com 15 propostas inteiras vencidas ainda tem rotina" RED→GREEN, suite app 105/105, api 89/89, e2e 20/20.
- I2 histórico congelado — a rota do toque regrava a rotina do dono e a da ligação a de quem ligou; o dia de hoje entra no histórico mesmo em feriado — "histórico conta o toque e a ligação feitos depois de abrir a rotina" e "o dia de hoje entra no histórico mesmo em feriado" RED→GREEN, suite verde.
- I3 resultado reabria proposta encerrada — UPDATE condicional (só em_followup), campo oposto vazio, 409 "Essa proposta já foi encerrada."; assumir só oportunidade aberta (409) — "resultado só muda proposta em follow-up e limpa o campo oposto" e "resultado de proposta já encerrada dá 409; assumir oportunidade encerrada também" RED→GREEN, suite verde.
- I4 não havia onde assumir — NovaProposta marca "· de {nome}" nas oportunidades de colegas e assume antes de registrar — "proposta de oportunidade de colega: assume e depois registra" RED→GREEN, suite verde.
- I5 avisos por baixo do foco — o aviso vai por portal para o body, com z-index 70 (o #raiz cria a própria camada) — e2e "o aviso aparece por cima do modo foco" RED (validado sem a correção) → GREEN, e2e 20/20. O primeiro desenho do teste usava elementFromPoint sem desligar o pointer-events: none do aviso e nunca passaria; corrigido no teste.
- (re-graduado de ruling discordado) links da rotina para toques que não são o próximo não abriam nada — o link passa a ser /follow-up?proposta={id}, que abre o próximo toque da proposta — "o link do item de toque abre a proposta" e "abrir com ?proposta=ID mostra o próximo toque dessa proposta" RED→GREEN.
- (re-graduado de ruling discordado) dois botões vermelhos com o foco aberto — o botão da página vira secundário enquanto houver foco (Follow-up e Hoje do hunter) — "com o foco aberto, o botão da página deixa de ser vermelho" RED→GREEN.
- (re-graduado de ruling discordado) /api/closers para Projetos — 403 — "projetos não lista closers" RED→GREEN.
- (re-graduado de Minor: perde o formulário) Esc dentro de um campo fechava o foco — agora só tira o cursor do campo; o segundo Esc sai — "Esc dentro de um campo só tira o cursor do campo; o segundo Esc sai do foco" RED→GREEN.
- (re-graduado de Minor: contagem inflada sem desfazer) tecla segurada no bloco registrava dezenas de ligações — ignora e.repeat — "segurar a tecla no bloco não registra várias ligações" RED→GREEN.
- (re-graduado de Minor: promessa falsa na tela) texto da nutrição dizia "volta a ser procurada em 45 dias" — agora "A oportunidade sai do follow-up e fica em nutrição." — "nutrição não promete lembrete que o hub não faz" RED→GREEN.

## Revisão final: pontos menores adiados (decisão do Lucas)

- registrarProposta e criarDiagnostica gravam em vários passos; uma falha do D1 no meio pode deixar a oportunidade presa (juntar num db.batch).
- se a diagnóstica é criada e a contagem da ligação falha, uma nova tentativa cria uma segunda oportunidade.
- no 409 de toque já feito, a lista não é relida e o cartão repete o 409 ao abrir de novo.
- na tela Rotinas, a linha de hoje do histórico não é relida depois de marcar um item.
- no Hoje, um erro da rotina (PUT que falha ou 500) não aparece.
- pela API, contato com mais de 120 caracteres, telefone com mais de 40 e dor com mais de 500 são descartados sem aviso (a tela limita a dor).
- datas impossíveis (2026-02-30) e diagnóstica com data no passado passam pela API.
- o cabeçalho de Rotinas não mostra o dia por extenso que o plano pedia.
- o Medidor deixa aria-valuenow passar do máximo (3 de 2 ligações).
- atualizar() sem a proteção do último diretor continua exportada (só os testes usam).
- Ctrl K com o foco aberto põe a busca por baixo do foco, e Esc fecha os dois.

## Revisão final: itens deixados de fora pelo revisor e como ficaram

- fidelidade visual da Prancheta — conferida por capturas do implementador nos três cargos, claro, escuro e celular — custo se errado: ajustes visuais no aceite.
- e2e não rodado pelo revisor — o implementador rodou depois das correções: 20/20 — custo se errado: nenhum.
- toques vencidos não podem ser pulados e proposta registrada com atraso nasce com toques atrasados — é a regra da spec (atraso pela data prevista); o closer registra o resultado para encerrar — custo se errado: lista de atrasados longa para propostas registradas tarde.
- saudação e data do Hoje no horário do navegador — o time está todo em UTC−3 — custo se errado: saudação errada para quem estiver em outro fuso.
- feriados até 2027-12-25 e sem os municipais de Uberaba — conteúdo a manter, o arquivo avisa; entra na lista de pedidos à MecTRIA — custo se errado: um toque num feriado municipal.
- "Fulano alterou agora" quando dois closers editam — spec seção 9, para a fase 4, quando há edição concorrente de verdade — custo se errado: nenhum agora.
- checklist curto do hunter no Hoje — cosmético — custo se errado: nenhum.
- nome "Vinícius Miguel" nas fixtures — decisão da fase 1 — custo se errado: trocar um nome.
- consultas uma pessoa por vez em resumoDoTime — ~10 pessoas — custo se errado: lentidão com time grande.
- script do ERP citado no docs/03 — está no outro repositório e foi testado num Postgres — custo se errado: nenhum.
- NumeroRolante anunciado duas vezes (fundo e foco) para leitor de tela — polimento de acessibilidade — custo se errado: anúncio repetido.
- cliques rápidos no checkbox da rotina com respostas fora de ordem — risco baixo; o último PUT vale — custo se errado: o checkbox mostra o estado de um clique antes.
