# Registro da execução · Hub comercial, fase 9 (as primeiras apresentações em HTML)

Plano: [`docs/superpowers/plans/2026-11-12-hub-fase-9-primeiras-apresentacoes.md`](../plans/2026-11-12-hub-fase-9-primeiras-apresentacoes.md). Especificação: as linhas "Apresentações em HTML interativo, conectadas ao hub", "Serviços da MecTRIA" e "As apresentações seguem a identidade do site novo" de [`docs/07-decisoes-e-pendencias.md`](../../07-decisoes-e-pendencias.md), a seção 6 de [`docs/15-hub-template.md`](../../15-hub-template.md), a seção 1 de [`docs/16-pitch-e-fups.md`](../../16-pitch-e-fups.md) e o contrato em [`hub/apresentacoes/CONTRATO.md`](../../../hub/apresentacoes/CONTRATO.md). Executado de 12 a 13/11/2026, no modo na mesma sessão, depois do "continua aí" do Lucas.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada.

## Tarefas concluídas

- Task 1: complete (commits cbab1e9..e5dfcdb, tests: npm run test:app → 328/328; typecheck ok)
- Task 2: complete (commits e5dfcdb..fdeb10d, tests: npm test → app 328/328, api 211/211; typecheck ok)
- Task 3: complete (commits fdeb10d..3f7ecb8, tests: npm run test:app → 330/330; typecheck ok)
- Task 4: complete (commits 3f7ecb8..3090b0d, tests: npm test → app 336/336, api 212/212; typecheck ok)
- Task 5: complete (commits 3090b0d..0f2e94a, tests: npm run test:app → 340/340; prints dos 5 slides conferidos no Chromium, sem nada fora do slide)
- Task 6: complete (commits 0f2e94a..5439a8b, tests: npm test → app 349/349, api 212/212; prints dos 13 slides conferidos)
- Task 7: complete (commits 5439a8b..66e0e11, tests: npm run test:app → 358/358; prints conferidos)
- Task 8: complete (commits 66e0e11..ff374e4, tests: npm test → app 358/358 (3 rodadas), api 215/215; typecheck ok)
- Task 9: complete (commits ff374e4..57873a0, tests: npm run typecheck && npm test && e2e → app 358/358, api 215/215, e2e 50/50)

## Decisões antes de começar (varredura das interfaces)

- T1→T5/T6/T7: window.Apresentacao (iniciar, enviar, preencher, reais) e abrirDeck — consistentes.
- T2→T3/T4: ApresentacaoGeral e GET /api/apresentacoes — consistentes.
- T4→T5: dadosDaDiagnostica (etapa, etapas, empresa, contato, data, servico) e SLIDES_DA_DIAGNOSTICA (5) — o deck da Task 5 lê as mesmas chaves e tem os mesmos ids.
- T6/T7→T8: roteiros/*.json com os ids do roteiro padrão — a migração 0010 lê os mesmos arquivos.

## Decisões tomadas durante a execução

- Task 1: Ruling: a montagem é uma função pura em apresentacoes/montagem.ts (usada pelo teste via import.meta.glob ?raw) e o script de linha de comando apresentacoes/montar.ts roda com node --experimental-strip-types, sem dependência nova — custo se errado: nenhum
- Task 1: Ruling: o kit põe sozinho o rodapé '01 / 13' + MecTRIA em cada slide (a não ser data-sem-rodape) e ganhou data-se/data-senao para mostrar um trecho só quando a chave existe — custo se errado: nenhum
- Task 1: Ruling: as partes interativas comuns (dores, preço em etapas, calculadora) ficam para a Task 6, onde são usadas e testadas — custo se errado: nenhum
- Task 2: Ruling: urlDaApresentacaoGeral recebe a ApresentacaoGeral inteira (como urlDaApresentacao recebe o serviço), não (id, arquivo) — custo se errado: nenhum
- Task 2: Ruling: o núcleo de gravar/remover em servidor/apresentacoes.ts ficou genérico por 'lugar' (serviço ou geral), mantendo as funções da fase 8; o tudo.json passa a levar a tabela apresentacoes_gerais — custo se errado: nenhum
- Task 3: Ruling: o componente de envio virou genérico (ApresentacaoEmHtml) com textos, endereço e vista passados por quem usa; os dados de exemplo (do serviço e da diagnóstica) saíram para funções exportadas em VistaDaApresentacao; fingirApi responde GET /api/apresentacoes com a diagnóstica sem arquivo — custo se errado: nenhum
- Task 4: Ruling: a lista de etapas da diagnóstica inclui 'Técnico' só quando o serviço tem perguntas técnicas ativas; a etapa fica vazia fora dos blocos e das técnicas — custo se errado: nenhum
- Task 4: Ruling: a seta apertada dentro da apresentação da diagnóstica passa a pergunta no painel (como a seta no painel), e o lembrete de qual janela compartilhar fica no title do botão; abrirJanela e JANELA_SUMIU_MS saíram para src/reuniao/janela.ts, usados pelos dois painéis — custo se errado: o lembrete aparece só ao passar o mouse
- Task 5: Ruling: o kit passou a ter um só movimento por troca de slide (fade do slide inteiro), sem a entrada escalonada de cada elemento; o que se mexe é o desenho técnico — custo se errado: nenhum
- Task 5: Ruling: o vitest passa a processar o CSS de apresentacoes/fonte (css.include), porque o ?raw de .css chegava vazio e o teste de montagem comparava sem o CSS — custo se errado: nenhum
- Task 5: Ruling: o slide agenda mostra o nome da empresa grande e 'Hoje, a conversa é sobre vocês.' (sem artigo antes do nome, que varia de empresa para empresa) — custo se errado: nenhum
- Task 6: Ruling: o preço em 3 etapas é o mercado (âncora e [valor de mercado]), a MecTRIA (frase de valor) e o valor com as condições; a jornada de parcerias ficou inteira no slide de valor × preço, antes do investimento, como pede docs/16 — custo se errado: o teste do plano ('o mercado, a jornada e o valor') mudou de nome para 'o mercado, a MecTRIA e o valor'
- Task 6: Ruling: as partes interativas (dores, preço, calculadora) entraram no kit como opções de iniciar(), com as ações e os campos montados sozinhos; data-se esvazia o trecho sem a chave e data-lista desenha itens — custo se errado: nenhum
- Task 6: Ruling: valoresDaProposta ganhou condicoes (com o rótulo 'condições de pagamento') e dadosDaApresentacao ganhou entregamosItens e ficaItens com a grafia original ({entregamos} vem em minúsculas para o meio da fala e mostrava 'cad 3d') — custo se errado: duas chaves a mais nos dados
- Task 6: Ruling: os roteiros de DP e DT foram gerados juntos a partir do roteiroPadrao() (falas mudadas: números do site, time com professores doutores e [nome do professor], método do serviço, jornada de docs/16 palavra por palavra em valor × preço, investimento com {condicoes}, fechamento sem 'à vista ou parcelado') — custo se errado: as falas novas ainda precisam do olhar do Lucas
- Task 7: Ruling: o método de Desenho Técnico usa as etapas do serviço (levantamento, medição, modelo, desenho) no lugar de diagnóstico/simulação, que não existem nele — custo se errado: a história 'do papel à peça' fica com etapas diferentes da diagnóstica
- Task 8: Ruling: o teste 'ids iguais aos da apresentação montada' ficou coberto pelos testes de cada apresentação (deck e roteiro comparados com os ids do roteiro padrão); o de validarServico foi para servidor/servicos.test.ts; o teste antigo da migração 0008 passou a ignorar o roteiro (a 0010 grava DP e DT) — custo se errado: nenhum
- Task 8: Ruling: a suíte completa mostrou duas corridas da fase 8: (1) nos testes do iframe, a mensagem disparada antes do useEffect que ouve as mensagens (corrigido no teste, esperando os efeitos com act); (2) em useServicos, a resposta de uma busca antiga gravava a lista velha depois de recarregar ou esquecer — bug real, corrigido com uma geração, com o teste 'uma busca antiga que chega depois de recarregar não troca a lista nova' RED→GREEN — custo se errado: nenhum
- Task 9: Ruling: a proposta do e2e é a Torno Novo (semente nova), porque a Prensa Nova já fica em andamento pelo e2e da fase 8; a semente mantém os roteiros de DP e DT da 0010 e limpa os dos outros serviços — custo se errado: nenhum
- Task 9: Ruling: docs/18 ganhou a seção 8 (a demo das apresentações) sem reescrever a demo de 10/11, que é registro — custo se errado: nenhum

## Revisão final

Um revisor novo leu o branch inteiro (base 9194658). Não achou nada Critical nem Important; deu o branch como pronto para merge e recomendou corrigir os três primeiros menores antes de mostrar as apresentações a um cliente. O Lucas pediu essas três correções.

### Corrigido (cada um com o teste que falhou antes)

- linhas de centro contínuas — "as linhas de centro do desenho ficam em traço-ponto" e "nenhuma linha de centro tem pathLength" (diagnostica.test) RED→GREEN; o print no Chromium mostrou que o estilo computado não bastava (o pathLength="1" escalava o padrão), suite app 362/362, api 215/215, e2e 50/50
- MECTRIA no rodapé — "a marca no rodapé é MecTRIA, não em maiúsculas" RED→GREEN, suite idem
- artigo antes do nome da empresa — "o próximo passo não põe artigo antes do nome da empresa" RED→GREEN, suite idem

### Decisões da revisão

- os itens 1 a 3 (Minor) entraram na correção porque o Lucas pediu ("pode corrigir os três") — custo se errado: nenhum
- o fechamento sempre diz "em até 7 dias" (sem {data_decisao}), porque a data da decisão só existe depois do fechamento — custo se errado: nenhum
- o revisor não julgou a fidelidade dos textos e do visual ao site (os prints não estão no repositório) nem o mérito das falas novas: ficam para o Lucas validar — custo se errado: um texto diferente do site

### Menores adiados

- "[valor de mercado]" fixo na primeira etapa do preço, sem chave para preencher
- a dor 1 sem dado é clicável e manda "[dor do cliente]"; a dor com mais de 200 caracteres é descartada pelo contrato sem aviso
- o painel da diagnóstica não tem o guarda de dono (duas abas respondem à janela)
- o lembrete de qual janela compartilhar na diagnóstica fica só no title do botão
- os dados de exemplo da vista são recriados a cada render e zeram as interações do deck quando o pai renderiza de novo
- "Fica com vocês" sem o [rótulo] quando falta
- afirmações sobre o professor orientador ("com a revisão do professor orientador", "professores doutores da UFTM, que acompanham as decisões técnicas") a validar pelo Lucas
- CONTRATO.md sem as opções dores/preco/calculadora e os atributos data-*; a vista da diagnóstica não confere os 5 slides; docs/07 cita "[a preencher]" no lugar dos rótulos reais

## Testes no fim

- `npm run typecheck`: ok.
- `npm test`: app 362, API 215.
- e2e: 50 (com o Chromium já instalado no ambiente, por uma configuração local fora do git).
