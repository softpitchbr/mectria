# Registro da execução · Hub comercial, fase 8 (cadastro de serviços e apresentações em HTML)

Plano: [`docs/superpowers/plans/2026-11-11-hub-fase-8-servicos-e-apresentacoes.md`](../plans/2026-11-11-hub-fase-8-servicos-e-apresentacoes.md). Especificação: as linhas "Apresentações em HTML interativo, conectadas ao hub", "O diretor cadastra serviços no hub" e "Serviços da MecTRIA" de [`docs/07-decisoes-e-pendencias.md`](../../07-decisoes-e-pendencias.md), e as seções 6 e 12 de [`docs/15-hub-template.md`](../../15-hub-template.md). Executado em 11/11/2026, no modo na mesma sessão, depois do "simbora" do Lucas. O contrato das apresentações ficou em [`hub/apresentacoes/CONTRATO.md`](../../../hub/apresentacoes/CONTRATO.md).

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits 50ceaca..5fc50b0, tests: npm test → app 266/266, api 181/181)
- Task 2: complete (commits 5fc50b0..3eb3791, tests: npm test → app 266/266, api 189/189)
- Task 3: complete (commits 3eb3791..2098eca, tests: npm test → app 266/266, api 195/195)
- Task 4: complete (commits 2098eca..e302f1d, tests: npm test → app 277/277, api 195/195)
- Task 5: complete (commits e302f1d..1d8c6d6, tests: npm test → app 283/283, api 202/202)
- Task 6: complete (commits 1d8c6d6..bed4f98, tests: npm test → app 290/290, api 202/202)
- Task 7: complete (commits bed4f98..2d72f73, tests: npm test → app 298/298, api 202/202)
- Task 8: complete (commits 2d72f73..047e9ee, tests: npm test → app 305/305, api 202/202)
- Task 9: complete (commits 047e9ee..9df1500, tests: npm test → app 312/312, api 202/202)
- Task 10: complete (commits 9df1500..68df775, tests: npm test → app 317/317, api 202/202)
- Task 11: complete (commits 68df775..168d183, tests: npm run typecheck && npm test && e2e → app 319/319, api 202/202, e2e 47/47)

## Decisões antes de começar (varredura das interfaces)

- T1→T2/T3/T5: Servico, listarServicos, Env.APRESENTACOES — consistentes.
- T4→T5: Interacoes/lerInteracoes usados em validarAndamento — consistentes.
- T4/T5→T7/T8: ApresentacaoNaJanela usa Interacoes; painel usa apresentacaoDaReuniao/dadosDaApresentacao — consistentes.
- T5→T6: FichaCompleta.perguntasDoServico consumido no painel da diagnóstica e no briefing — consistente.
- T7→T10: VistaDaApresentacao reutiliza QuadroDoHtml — consistente.

## Decisões tomadas durante a execução

- Task 3: Ruling: os testes da apresentação ficaram todos em servidor/rotas/fase8.test.ts (pela rota), sem servidor/apresentacoes.test.ts — a rota exercita salvar, remover e ler, e os cabeçalhos — custo se errado: nenhum teste unitário isolado do módulo
- Task 4: Ruling: as dores 2 a 4 do exemplo vêm de dados.doresDoServico (as dores cadastradas no serviço, uma por linha), com três genéricas de reserva — o plano dizia 'mais três exemplos'; usar as dores do serviço torna o exemplo útil e liga o cadastro à apresentação. Task 5 acrescenta doresDoServico em dadosDaApresentacao — custo se errado: uma chave a mais nos dados
- Task 4: Ruling: os rótulos das ações das dores são fixos ('Marcar a dor do cliente', 'Marcar a dor 2'...), porque a pronta sai antes do estado e reenviar a pronta criaria um laço estado↔pronta — custo se errado: o botão do painel não traz o texto da dor (o texto aparece em 'Na apresentação')
- Task 4: Ruling: tipos mínimos do JSDOM em src/teste/jsdom.d.ts (o pacote não traz tipos e não há @types/jsdom); o exemplo.html entra no teste por ?raw — custo se errado: nenhum em produção
- Task 5: Ruling: para o build seguir verde entre os commits, a Task 5 já adapta o app às assinaturas novas (painel da diagnóstica com ficha.perguntasDoServico, painel da proposta com sessao.servico) e deixa uma lista provisória servicosDaCarta() em followup/comum.ts e Apresentacoes.tsx, trocada pela API na Task 6 — custo se errado: código provisório por um commit
- Task 5: Ruling: dadosDaApresentacao recebe também o serviço (para doresDoServico, ver Task 4) — custo se errado: um parâmetro a mais
- Task 5: Ruling: o tudo.json (exportação completa do diretor) passa a trazer a tabela servicos; o HTML das apresentações fica só no KV e não entra no arquivo — custo se errado: o backup não leva os arquivos HTML (eles têm de ser guardados à parte)
- Task 5: Ruling: o CSV pega o nome pelo LEFT JOIN em servicos (com o id de reserva), sem carregar a lista no código — custo se errado: nenhum
- Task 6: Ruling: os testes 'o painel da diagnóstica usa as perguntas técnicas da ficha' e 'o briefing mostra a resposta de uma pergunta inativa' já passaram ao serem escritos, porque a Task 5 fez a troca; ficam como guarda de regressão — custo se errado: nenhum
- Task 7: Ruling: o QuadroDoHtml reenvia o estado inteiro quando os dados mudam (novo estado do painel), além de na pronta; o painel monta o estado com as interações atuais, então a reenvio não volta a apresentação a um estado velho — custo se errado: a apresentação redesenha uma vez a mais
- Task 7: Ruling: o painel já manda o estado no formato novo ({ apresentacao: { tipo: 'exemplo', slides } }) nesta task, para o build seguir verde; o html no painel é a Task 8 — custo se errado: nenhum
- Task 8: Ruling: acrescentado o teste 'andamento salvo num slide além do roteiro abre no último slide' (Review Focus: roteiro editado); o painel limita o índice ao roteiro e corrige o andamento — custo se errado: nenhum
- Task 8: Ruling: o painel confere de novo com lerMensagemDaApresentacao o que a janela repassa, antes de guardar — custo se errado: uma leitura a mais
- Task 9: Ruling: a edição fica na rota /servicos/:id dentro da própria seção (como playbooks/:aba), com a tela Servicos decidindo entre lista e edição; os auxiliares (letras aleatórias, linhas, mover) ficam em telas/servicos/edicao.ts — custo se errado: nenhum
- Task 9: Ruling: o tempo vazio no roteiro vai como inválido e o servidor recusa com a mensagem do limite (1 a 30), em vez de a tela validar antes — custo se errado: a mensagem vem do servidor
- Task 10: Ruling: a seção da apresentação virou um componente próprio (telas/servicos/ApresentacaoDoServico.tsx), fora do formulário (envio e remoção gravam na hora, sem o Salvar) — custo se errado: nenhum
- Task 10: Ruling: o arquivo é lido com FileReader em vez de file.text() (o JSDOM não tem Blob.text) — custo se errado: nenhum
- Task 10: Ruling: o teste antigo do catálogo passa a contar 2 cartões de 'ainda vem' (sai 'Uma proposta por serviço', como o plano pede) — custo se errado: nenhum
- Task 11: Ruling: o e2e roda com uma configuração local fora do git (e2e/playwright.local.config.ts, executablePath /opt/pw-browsers/chromium), porque o ambiente reconstruído tem o Chromium 1243 e o @playwright/test 1.56.1 procura o 1194; o CI usa a configuração do repositório — custo se errado: nenhum no repositório
- Task 11: Ruling: o e2e achou dois defeitos do exemplo.html que o JSDOM não via — o display:flex dos slides vencia o hidden (todos empilhados, o último por cima) e o hover que move o cartão da dor; corrigidos com [hidden]{display:none!important} no fim do estilo e sombra no lugar do movimento, cada um com teste (estilo computado; inicial maiúscula da dor) — custo se errado: nenhum
- Task 11: Ruling: os e2e antigos da fase 1 (9 seções do diretor) e da fase 3 (ficha de mentira sem perguntasDoServico) foram ajustados ao formato novo — custo se errado: nenhum

## Revisão final

Um revisor novo leu o branch inteiro (base 1514d40). Achou 1 Important e 8 Minor, e o veredito foi "não pronto para merge" pelo item 1. Ele concordou com todas as decisões da execução.

### Regraduações

- item 2 (proposta de oportunidade existente com serviço inativado) regraduado de Minor para Important — contraria a decisão 2 do plano e o Review Focus ("o que já existe continua") — custo se errado: nenhum, a correção é pequena
- item 3 (iframe navegando para a API com o login) regraduado para Important na parte da API — a especificação diz "sem acesso ao login"; a navegação para fora do hub o navegador não impede, então fica documentada no CONTRATO.md (revisar o HTML de terceiros) — custo se errado: um HTML malicioso enviado pelo diretor ainda pode levar os dados do cliente para fora
- item 4 (KV atrasado + cache de 1 h) regraduado para Important — mostraria a apresentação errada ao cliente — custo se errado: nenhum

### Corrigido (cada um com o teste que falhou antes)

- painel recarregado perde a pronta — "o painel que recarrega recebe de novo a pronta…" (janela.test) RED→GREEN, suite app 321/321, api 206/206, e2e 47/47
- serviço inativado bloqueia proposta de oportunidade existente — "a proposta de uma oportunidade que já existe aceita o serviço dela…" (fase8.test) e "a oportunidade com serviço inativado mostra o serviço dela no seletor" (FollowUp.test) RED→GREEN, suite idem
- API aberta dentro do iframe — "a apresentação em HTML não abre a API dentro do iframe…" (protecao.test) RED→GREEN, suite idem
- versão velha presa no endereço da nova — "cada versão fica na chave dela…" e "GET sem ?v… dá 404 sem cache" (fase8.test) RED→GREEN, suite idem

### Menores adiados

- o alerta "Quem decide não está na sala" procura o slide de id "investimento"; num roteiro personalizado sem ele, o alerta some
- "Sim, remover" e "Salvar" ficam os dois primários na edição do serviço (regra de um botão vermelho por tela)
- o campo da calculadora no painel guarda o que o vendedor digitou e não acompanha a mudança feita pelo cliente na apresentação
- um serviço chamado "Novo" ganha o id "novo", que colide com /servicos/novo
- HTML salvo fora do UTF-8 vira texto com "�" sem aviso (falta dizer "salve em UTF-8" no contrato e avisar na tela)

### O que o revisor deixou sem graduar, e a decisão

- deploy no meio de uma reunião (formato novo do estado) — fica; os deploys são feitos fora das reuniões — custo se errado: uma reunião com a janela quebrada até recarregar
- tempos limitados a 60 slides por reunião — fica; só passa disso com muitas trocas de roteiro na mesma reunião, e o fechamento continua possível — custo se errado: o andamento para de salvar nesse caso
- duas criações simultâneas do mesmo nome dão 500 em vez de 409 — fica; há um diretor — custo se errado: mensagem genérica
- sandbox do CSP com frame-ancestors no Firefox e no Safari — fica; o sandbox do próprio iframe vale em todos — custo se errado: comportamento não testado fora do Chromium
- estado extra antes da pronta no StrictMode — fica; só no desenvolvimento
- a lista de serviços não se atualiza nos outros cargos até recarregar, e falha na busca deixa o seletor vazio sem mensagem — fica; os serviços mudam raramente — custo se errado: o hunter não vê um serviço novo até recarregar
- anotação num slide que saiu do roteiro aparece como "Slide 0" — fica; cosmético
- rótulos fixos das ações das dores e ids repetidos de ação — fica (decisão da Task 4); ids repetidos só geram aviso no React
- tudo.json sem os HTML — fica, documentado no IMPLANTACAO.md
- apresentação que manda eventos sem parar — fica; o HTML é enviado pelo diretor — custo se errado: o painel pesa até a janela fechar
- a tela aponta para hub/apresentacoes, pasta do repositório — fica; quem desenha as apresentações é a Triângulo — custo se errado: o diretor não acha o modelo sozinho

## Testes no fim

- `npm run typecheck`: ok.
- `npm test`: app 321, API 206.
- e2e: 47 (com o Chromium já instalado no ambiente, por uma configuração local fora do git; ver a decisão da Task 11).
