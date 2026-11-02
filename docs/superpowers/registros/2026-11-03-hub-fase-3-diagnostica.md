# Registro da execução · Hub comercial, fase 3 (diagnóstica)

Plano: [`docs/superpowers/plans/2026-11-03-hub-fase-3-diagnostica.md`](../plans/2026-11-03-hub-fase-3-diagnostica.md). Especificação: [`docs/15-hub-template.md`](../../15-hub-template.md). Executado em 02/11/2026, no modo nativo, a pedido do Lucas de seguir sem parar. As 6 decisões do plano **ainda não foram confirmadas pelo Lucas** (ver `docs/07-decisoes-e-pendencias.md`, linha da fase 3, com os pontos que a revisão pediu para ele rever). Houve uma revisão final independente do branch inteiro e uma rodada única de correções.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits 5b1b095..ecc1d7a, tests: npx vitest run compartilhado → conteúdo 4/4 e compartilhado verde; typecheck ok)
- Task 2: complete (commits ecc1d7a..0456b20, tests: npx vitest run compartilhado → 6 arquivos 25/25; typecheck ok)
- Task 3: complete (commits 0456b20..6a23423, tests: npm run test:api → 10 arquivos 96/96; typecheck ok)
- Task 4: complete (commits 6a23423..896ab51, tests: npm run test:api → 11 arquivos 101/101; typecheck ok; functions build ok)
- Task 5: complete (commits 896ab51..b89b48e, tests: npx vitest run → app verde (rascunho 5/5); typecheck ok)
- Task 6: complete (commits b89b48e..34e67bf, tests: npx vitest run → 23 arquivos 126/126; typecheck ok; capturas notebook escuro e celular sem vazamento)
- Task 7: complete (commits 34e67bf..7169c0f, tests: npx vitest run → 24 arquivos 129/129; typecheck ok; PDF do Chromium 38 KB)
- Task 8: complete (commits 7169c0f..ce6a2cc, tests: npx vitest run → 25 arquivos 132/132; typecheck ok)
- Task 9: complete (commits ce6a2cc..0eea7d6, tests: npx vitest run → 26 arquivos 137/137; typecheck ok)
- Task 10: complete (commits 0eea7d6..bd97530, tests: npx vitest run → 26 arquivos 140/140; typecheck ok)
- Task 11: complete (commits bd97530..d652fba, tests: npm test → app 141/141; api 101/101; typecheck ok; npm run e2e → 25/25)

## Decisões antes de começar (varredura das interfaces)

- Task 2 → Task 3 (briefingDaFicha recebe Anotacao, que a Task 3 define). Pre-flight: Ruling: os tipos Marcacao e Anotacao nascem na Task 2, em compartilhado/diagnostica.ts, e a Task 3 os usa — a Task 2 vem antes e precisa deles — custo se errado: nenhum.
- Task 6 (rota do painel "sem as barras do hub"): Pre-flight: Ruling: /reunioes/:id/diagnostica e /reunioes/:id/briefing ficam dentro da Raiz (sessão e sem acesso), mas fora do Layout, recebendo o eu por um contexto — a spec pede o painel em tela cheia — custo se errado: o painel mostraria as barras.

## Decisões tomadas durante a execução

- **Task 1:** os tipos seguem o conteúdo real da 0.2 (abertura com pacto; ceuInferno como listas antes/depois; serviços com ficaComClienteValidar e emEstruturacao opcionais); o resto de cold-call.js (antes, meta, gatekeeper, tentativas, privacidade) foi acrescentado a cold-call.ts — o brief lista só parte dos campos — custo se errado: nenhum.
- **Task 2:** Marcacao, ROTULO_MARCACAO e Anotacao ficam em compartilhado/diagnostica.ts (pre-flight); o passo de fechamento carrega o pacto e a dica; o briefingDaFicha recebe só { oportunidade: { servico }, respostas, anotacoes }; no meu teste, o id da pergunta de orçamento é b-faixa (corrigido antes de implementar) — custo se errado: nenhum.
- **Task 3:** iniciarReuniao não recebe o autor (não grava nada dele); salvarAnotacao recebe o dia (padrão: hoje em São Paulo) para o prazo da pendência ser testável; a reunião ganhou quem_decide (a de proposta guarda quem decide, que a fase 4 usa) e Reuniao passou a trazer quemDecide, iniciadaEm, encerradaEm, resultado, motivo e briefingEnviadoEm; encerrar é uma gravação condicional (uma vez só) — custo se errado: nenhum.
- **Task 4:** a conferência de acesso ficou num helper (servidor/acessoReuniao.ts) usado por todas as rotas da reunião; respostas e anotações continuam aceitas depois de encerrada (para corrigir o briefing); o GET do hunter que marcou devolve só reunião e oportunidade — o brief não detalha — custo se errado: nenhum.
- **Task 5:** a junção com a ficha do servidor acontece uma vez só (o que está pendente no computador vale mais); a primeira versão juntava a cada renderização e entrava em laço (estouro de memória no teste); erro que não é de rede mantém "salvando" e tenta de novo; o evento "online" sincroniza na hora; o hook expõe sincronizar() para o painel forçar antes de encerrar — custo se errado: nenhum.
- **Task 6:** as rotas foram reorganizadas — a Raiz passa o eu por Outlet, as seções ficam sob uma rota sem caminho com o Layout (ComBarras), e /reunioes/:id/diagnostica fica fora das barras (pre-flight) — custo se errado: nenhum.
- **Task 6:** o painel abre na primeira pergunta sem resposta quando já há respostas (senão, na abertura); a barra de segmentos é de botões "Ir para {parte}"; Esc com o cursor num campo tira o cursor; "Sair do painel" vai para /reunioes sem confirmação, porque nada se perde (rascunho no computador e no servidor); o relógio conta a partir de iniciadaEm do servidor — o brief pedia confirmação ao sair com Esc, mas o Esc não sai do painel — custo se errado: um clique a mais para voltar.
- **Task 7:** a folha do briefing tem cores fixas do tema claro (não depende do tema escolhido), a margem A4 de 18 mm fica no padding da folha (@page margin 0); "Gerar PDF" é o botão vermelho da página; quando já enviado, aparece "Enviado para Projetos" no lugar do botão; o PDF real do Chromium saiu com 38 KB e a captura em modo impressão conferida — custo se errado: nenhum.
- **Task 8:** a agenda pede 30 dias para trás e 6 para a frente e mostra o futuro mais as diagnósticas passadas sem resultado (marcadas "Sem resultado"); reunião de proposta aparece com "Iniciar" desligado (fase 4); o "Iniciar reunião" do Hoje liga só para diagnóstica; dois testes antigos mudaram porque o comportamento mudou de propósito (Iniciar ligado; seção em construção de exemplo passou a ser Apresentações); a permissoes.ts não precisou mudar (a fase da seção só decide o texto de "em construção") — custo se errado: nenhum.
- **Task 9:** o teste de busca usa "ESTA CARO" (acento e caixa) em vez de "preco", porque a objeção "Está caro." não traz a palavra "preço"; a busca olha frase, "por trás" e contorno; ?o={id} destaca a objeção (para a busca da Task 10); o hunter vê só Cold call e Objeções; a página avisa que o conteúdo é rascunho da 0.2 — custo se errado: nenhum.
- **Task 10:** roteiros e objeções são fontes síncronas (o conteúdo está no código); só clientes é assíncrona (GET /api/oportunidades), com Promise.allSettled; o cliente abre o follow-up (em follow-up ou encerrada), as reuniões (diagnóstica ou proposta marcada) ou o Hoje (hunter); o teste "um hunter não vê Ir para Time" passou a olhar só os itens "Ir para", porque objeções com "ir" e "para" no texto agora também aparecem; o teste da fonte que falha já passava antes (regressão) — custo se errado: nenhum.
- **Task 11:** o e2e achou um bug real — POST sem corpo (iniciar, briefing) ia sem Content-Type JSON e a proteção contra CSRF recusava; o cliente da API passou a mandar JSON em todo pedido que não é GET, com o teste "POST sem corpo também manda Content-Type JSON" RED→GREEN — custo se errado: nenhum.
- **Task 11:** a semente ganhou duas diagnósticas do Carlos para hoje às 23:00 e 23:30 (hora de São Paulo) e limpa as tabelas da fase 3; os testes do e2e usam busca exata nos botões "Ir para …", "Técnico" e "Objeção" (os nomes se repetem entre segmentos e marcações); o teste da busca da fase 1 passou a esperar o título "Playbooks"; as decisões da fase 3 entraram no docs/07 como "a confirmar pelo Lucas" — custo se errado: nenhum.

## Revisão final: o que foi corrigido

Revisor independente; veredito "não está pronto para merge", com um achado crítico (C1) e seis importantes (I1 a I6). Correções nos commits `8d7744f` (C1 e I3), `f1fd584` (I1 e I2), `fd048f4` (I4), `3db5e5c` (I5) e `9af09a6` (I6). Resultado depois delas: typecheck sem erros, interface 154/154, API 106/106 e ponta a ponta 26/26.

- C1 (encerrar/iniciar diagnóstica cuja oportunidade já andou) — "diagnóstica cuja oportunidade já passou dela não inicia nem encerra, e a situação não muda", "diagnóstica de oportunidade que já passou dela: iniciar e encerrar dão 409" e "diagnóstica cuja oportunidade já passou dela não oferece Iniciar…" RED→GREEN, suíte api 105/105, app 142/142
- I3 (encerrar e pendência técnica fora de transação) — "anotação técnica repetida depois de uma queda no meio cria a pendência uma vez só" RED→GREEN e "encerrar grava tudo de uma vez" (trava do comportamento), suíte api 105/105; encerrar virou um db.batch com as gravações seguintes condicionadas à primeira; a pendência nasce por INSERT…SELECT com NOT EXISTS no batch da anotação, e a migração 0004 cria o índice único em pendencias.anotacao_id.
- I1 (encerrar sem garantir que o rascunho chegou ao servidor) — "sincronizar espera o envio em andamento e só volta quando tudo chegou ao servidor", "sincronizar devolve false quando não conseguiu falar com o servidor", "ao desmontar (sair do painel), manda o que estava pendente" e "encerrar não passa enquanto há respostas sem salvar no servidor" RED→GREEN, suíte app 149/149; o sincronizar guarda a promessa do envio, espera por ela, repete até a fila esvaziar (no máximo 5 voltas) e devolve se conseguiu; o Fechamento bloqueia com "Ainda há respostas sem salvar no servidor. Confira a internet e tente de novo."; o envio também sai ao desmontar o painel e no pagehide (keepalive).
- I2 (erro que não é de rede travava a fila) — "anotação recusada pelo servidor (400) sai da fila, avisa e não trava as seguintes", "sem permissão (403) vira um estado visível, não fica em salvando" e "o campo da anotação aceita até 2.000 caracteres" RED→GREEN, suíte app 149/149; cada anotação vai sozinha; 400 sai da fila com o aviso "Essa anotação não foi salva: …"; 401/403 viram o estado "Não salvo no servidor · salvo neste computador" com a mensagem do servidor.
- I4 (PDF com margem só na primeira página, marca sumindo sem fundo, título errado) — "o título da página (nome do PDF) traz o cliente e o dia" (unidade) e "ficha longa sem fundo: margem em toda página, seção sem pular página e marca visível" (e2e) RED→GREEN, suíte app 150/150; @page com margin 18mm e a folha sem recuo na impressão; break-inside só no item e break-after: avoid no título da seção; print-color-adjust: exact na marca; document.title = "Briefing · {empresa} · {dia}". Conferido no PDF real com pdfplumber: 4 páginas, topo entre 19 e 21 mm e esquerda 18 mm em todas, e a caixa vinho da marca desenhada com printBackground: false.
- I5 (a próxima reunião sumia do Hoje na hora em que começava) — "a reunião que acabou de começar continua como a próxima; concluídas e as que já passaram da diagnóstica ficam de fora" e "reunião em andamento aparece com Continuar, mesmo passada a primeira hora" RED→GREEN, suíte app 152/152; regra pura proximaReuniao em src/telas/hoje/comum.ts: a em andamento primeiro, senão a primeira marcada até 60 min depois do horário.
- I6 (o briefing não trazia o próximo passo) — "a ficha traz a reunião de proposta combinada no fechamento" (api), "resumo para o cliente traz a data da proposta e o nome de quem vende" e "o briefing mostra o próximo passo e o resumo copiado leva a data e o closer" (app) RED→GREEN, suíte app 154/154, api 106/106; a ficha ganhou proximaReuniao (a primeira reunião de proposta criada depois da diagnóstica); o briefing mostra "Apresentação da proposta" e "Quem decide"; o resumo preenche {data_proposta} e {vendedor} (o closer da oportunidade).

**Decisões da rodada de correções:**

- C1 — em vez de o registrarProposta concluir a diagnóstica aberta, a agenda passa a mostrar "A oportunidade já passou da diagnóstica" no lugar do Iniciar e tira as passadas da lista de sem resultado — concluir à força gravaria um resultado "proposta marcada" e um briefing vazio para uma reunião que não passou pelo painel — custo se errado: a reunião antiga fica na agenda até a data sair da janela de 7 dias.
- C1 — o iniciar e o encerrar passam a aceitar só reunião do tipo diagnóstica (a fase 4 abre a de proposta), na mesma gravação condicional — custo se errado: nenhum até a fase 4.
- o teste antigo "fechamento exige o resultado e manda a proposta marcada" passava porque o encerrar engolia a falha da anotação pendente que o teste anterior deixou no localStorage (reunião 5 em todos); o arquivo passou a limpar o localStorage antes de cada teste e a esperar o envio com waitFor — custo se errado: nenhum.
- I5 — tolerância de 60 minutos depois do horário (o closer pode começar atrasado; a diagnóstica dura 30 a 45 min) — custo se errado: um número a trocar em TOLERANCIA_MIN.
- os exemplos de reunião nos testes do Hoje ganharam oportunidadeSituacao, que a API passou a devolver sempre (C1) — custo se errado: nenhum.

## Revisão final: pontos menores adiados (decisão do Lucas)

- M1 — ficha parcial (hunter que abre a URL do painel ou do briefing) derruba a tela com "Unexpected Application Error"; as telas de erro fora das barras não têm link de volta.
- M2 — o painel reabre na primeira pergunta sem resposta no servidor, ignorando as pendentes no computador e as puladas de propósito.
- M3 — relógio e minuto das notas contam desde a primeira abertura do painel (preparar antes ou continuar outro dia gera "1450 min").
- M4 — rascunho nunca apagado do localStorage (LGPD), duas abas na mesma reunião se sobrescrevem, "Fulano alterou agora" adiado, leitura do localStorage a cada renderização, corrida rara de GET depois de PUT.
- M5 — o Voltar do navegador depois de encerrar reabre o Fechamento e o clique dá 409.
- M6 — as rotas de respostas e anotações aceitam reunião de proposta e cancelada; na agenda do diretor aparece Iniciar nas reuniões de qualquer closer (iniciar e encerrar já recusam proposta desde a C1).
- M7 — Fechamento sem a fala de agendamento, a dica "Nunca saia sem a apresentação marcada" e a lista do "depois"; data da proposta aceita o passado; "Outro" não pede o texto.
- M8 — na busca, clientes ganhos, perdidos ou em nutrição levam a /follow-up, onde não aparecem; ?o= destaca a objeção mas não rola até ela.
- M9 — aviso de cópia que falhou manda selecionar texto que não está na página; notas "Escopo" fora do briefing; notas técnicas só com "Minuto N", sem a pergunta.
- M10 — ao mudar de passo o foco não vai para a resposta (uns 12 Tabs até ela); sugestão de Enter levar à resposta e o Esc da nota devolver o foco.
- M11 — sessão expirada do Access aparece como "Sem internet" (inferência; conferir navigator.onLine).
- M12 — lacunas de teste que sobraram: "N e setas" digita na nota e não na resposta; o e2e de "não qualificou" não confere que a oportunidade sai das diagnósticas (as demais lacunas da M12 foram cobertas nesta rodada).

## Revisão final: itens deixados de fora pelo revisor e como ficaram

- limite de consultas do D1 por chamada (o revisor não julgou) — a documentação do D1 diz que um db.batch() conta como uma consulta só no limite de 50 por chamada do plano grátis, e o maior roteiro tem 36 perguntas (desenvolvimento de produto), então o PUT de respostas não chega perto — custo se errado: um PUT grande falharia com 500 e o encerrar ficaria bloqueado com o aviso de "respostas sem salvar" (nada se perde; fica no computador).
- fidelidade visual aos mockups (não julgado) — os links são privados; o Lucas confere no roleplay de aceite — custo se errado: ajustes de estilo depois do roleplay.
- qualidade do conteúdo migrado (não julgado) — é o rascunho da 0.2, copiado sem mudar uma palavra e marcado como rascunho até a validação com a MecTRIA — custo se errado: nenhum no código; o conteúdo muda nos arquivos de dados.
- comportamento do Cloudflare Access quando a sessão expira (não julgado; M11 é inferência) — fica como menor adiado; um 401/403 da API já aparece como "Não salvo no servidor"; o redirecionamento do Access (status 0) segue como "Sem internet", e o rascunho fica no computador nos dois casos — custo se errado: o closer lê "Sem internet" quando precisava entrar de novo.
- e2e completo (não julgado) — rodado nesta rodada de correções (ver a linha da suíte final) — custo se errado: nenhum.
- painel no celular e no toque (não julgado) — fica para a fase 5, como a spec ordena — custo se errado: nenhum até lá.
- contraste das cores novas e "reduzir movimento" (não julgado) — as cores novas do painel e do briefing usam os tokens já medidos na fase 1 (vermelho-texto, suave, linha); o briefing usa cores fixas claras com o vinho #780000 sobre branco (contraste alto); sem animação nova — custo se errado: um ajuste de token.
- nome "Vinícius Miguel" como closer fictício nos testes de unidade (não julgado) — vem da fase 2 e é só dado de teste, sem e-mail real nem dado pessoal; trocar exigiria mexer em dezenas de testes sem efeito para quem usa — custo se errado: nenhum para o usuário; pode confundir quem lê os testes.
