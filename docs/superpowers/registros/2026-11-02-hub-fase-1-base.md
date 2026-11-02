# Registro da execução · Hub comercial, fase 1 (base)

Plano: [`docs/superpowers/plans/2026-11-02-hub-fase-1-base.md`](../plans/2026-11-02-hub-fase-1-base.md). Especificação: [`docs/15-hub-template.md`](../../15-hub-template.md). Executado em 02/11/2026, no modo nativo (escolha do Lucas), com uma revisão final independente do branch inteiro.

Cada decisão traz o que foi decidido, o porquê e o custo se estiver errada. Elas valem como referência para as fases 2 a 6.

## Tarefas concluídas

- Task 1: complete (commits 051342e..6a8e971, tests: npm test → app 1/1 pass; api sem testes ainda (passWithNoTests); typecheck e build ok)
- Task 2: complete (commits 6a8e971..f3e7bd4, tests: npx vitest run → 4 arquivos, 11/11 pass)
- Task 3: complete (commits f3e7bd4..cd8d17b, tests: npx vitest run → 6 arquivos, 22/22 pass; typecheck e build ok)
- Task 4: complete (commits cd8d17b..590e918, tests: npm test → app 7 arquivos 24/24; api 1 arquivo 6/6; typecheck ok)
- Task 5: complete (commits 590e918..81b27ba, tests: npm test → app 24/24; api 3 arquivos 18/18; typecheck e wrangler pages functions build ok)
- Task 6: complete (commits 81b27ba..e6f0ba8, tests: npx vitest run compartilhado → 2 arquivos 6/6; typecheck ok)
- Task 7: complete (commits e6f0ba8..1b59c58, tests: npx vitest run → 10 arquivos 42/42; typecheck ok; conferência visual notebook e celular)
- Task 8: complete (commits 1b59c58..6ccbe7e, tests: npx vitest run → 12 arquivos 57/57; typecheck ok; véu 0.24s e 0s com movimento reduzido no Chromium)
- Task 9: complete (commits 6ccbe7e..5fffa7e, tests: npm test → app 13 arquivos 63/63; api 4 arquivos 33/33; typecheck ok; conferência visual notebook e celular)
- Task 10: complete (commits 5fffa7e..511e338, tests: npm test → app 63/63; api 35/35; typecheck ok; npm run e2e → 9/9)

## Decisões tomadas durante a execução

- **Task 1:** tsconfig único do brief → dois (tsconfig.app.json com DOM e tsconfig.api.json com tipos Workers) referenciados por tsconfig.json — tipos DOM e Workers conflitam num só projeto — custo se errado: juntar os dois arquivos.
- **Task 1:** build "tsc -b && vite build" → "npm run typecheck && vite build" — tsc -b exige composite/emit; typecheck com --noEmit nos dois projetos faz a mesma checagem — custo se errado: trocar um script.
- **Task 1:** test:api com --passWithNoTests — não há teste de API até a Task 4 e o CI não pode falhar por isso — custo se errado: um teste de API ausente passaria calado (a Task 4 cria os primeiros).
- **Task 1:** criado servidor/ambiente-teste.d.ts (tipos de ProvidedEnv de cloudflare:test: DB, AMBIENTE, TEST_MIGRATIONS) — sem ele tsconfig.api.json não tem entradas e o typecheck falha (TS18003); são os tipos dos bindings que vitest.api.config.ts entrega — custo se errado: na Task 4 passar a estender Env.
- **Task 1:** adicionados @types/react 19.1.17 e @types/react-dom 19.1.11, migrations/.gitkeep e css.modules non-scoped no vitest — necessários para typecheck, para readD1Migrations achar a pasta e para testes de classe em jsdom — custo se errado: dependências a mais.
- **Task 1:** npm audit aponta 9 vulnerabilidades só em dependências de desenvolvimento (vitest/tinypool, wrangler/ws/sharp/zod); produção = 0 — as versões são as fixadas pela compatibilidade pool-workers 0.8.71; nada disso vai para o navegador nem para o Worker — custo se errado: risco na máquina de quem desenvolve; revisar ao subir versões.
- **Task 2:** --grade-fina/--grade-forte/--grade-luz sem valor na spec → valores do artefato aprovado hub-sistema-visual.html (--grade do artefato = --grade-luz) — é o visual que o Lucas aprovou — custo se errado: ajustar três valores.
- **Task 2:** criado ChaveTema.module.css (fora da lista do brief) e tokens de tempo zerados em prefers-reduced-motion — o componente precisa de estilo e a spec pede respeito a movimento reduzido — custo se errado: um arquivo de estilo a mais.
- **Task 2:** componentes com export default (como App) — o plano não fixa; as tarefas seguintes seguem o mesmo padrão — custo se errado: trocar imports.
- **Task 3:** usePosicaoNoElemento recebe RefObject<HTMLElement | null> (brief: RefObject<HTMLElement>) — useRef(null) do React 19 tipa assim — custo se errado: nenhum em tempo de execução.
- **Task 3:** o brilho do cartão também desliga em pointer coarse e movimento reduzido, e sem matchMedia a luz fica desligada — mesma regra da grade ("no celular, fica quieta") — custo se errado: cartão sem brilho em navegador sem matchMedia.
- **Task 3:** /vitrine entra pelo pathname em App.tsx (só com import.meta.env.DEV) até a Task 7 trocar por rota do react-router; App já monta <Avisos /> e useLuzDoCursor — não há roteador antes da Task 7 — custo se errado: a Task 7 reescreve App de qualquer jeito.
- **Task 3:** grade com background-attachment: fixed no body, alinhada à camada de luz fixa — se a grade rolasse com a página, a luz desalinharia; no iOS (sem fixed) a luz já está desligada — custo se errado: screenshot de página inteira mostra a grade só na primeira dobra.
- **Task 4:** globals: true no vitest.api.config.ts e "vitest/globals" nos tipos do tsconfig.api.json — os testes de jsdom já usam globais e compartilhado/*.test.ts é checado pelos dois tsconfigs — custo se errado: nenhum.
- **Task 4:** ambiente-teste.d.ts passou a estender Env (import type + declare module) — os testes precisam de env.DB tipado — custo se errado: nenhum.
- **Task 4:** atualizar() de id inexistente lança Error("nao_encontrada"); listar desempata por id — o brief não diz; a Task 9 traduz para 404 — custo se errado: renomear o código de erro.
- **Task 5:** eu.test.ts foi para servidor/rotas/ (brief: functions/api/) e o include do vitest.api ficou só servidor/**/*.test.ts — no Pages todo arquivo em functions/ vira rota, e um teste ali importaria cloudflare:test no build — custo se errado: nenhum; as Tasks 9 seguem o mesmo lugar.
- **Task 5:** DadosApi { pessoa: Pessoa } em servidor/tipos.ts — o brief fala de context.data.pessoa sem nomear o tipo — custo se errado: renomear.
- **Task 5:** em produção sem ACCESS_EQUIPE ou ACCESS_AUD ninguém entra (null); JWT sem claim email → null; corrida de dois primeiros acessos do DIRETOR_INICIAL relê a pessoa — falhar fechado é o seguro — custo se errado: hub fechado até configurar as variáveis (documentado na Task 10).
- **Task 5:** mensagem do 401 sem_identidade = "Não conseguimos identificar você. Entre de novo pelo login da MecTRIA."; respostas JSON com Cache-Control: no-store — a spec não fixa o texto; dados de pessoa não devem ficar em cache — custo se errado: trocar o texto.
- **Task 7:** seção fora do cargo mostra "Seu acesso não inclui {Seção}. Fale com o diretor comercial da MecTRIA." (o brief pedia "Seu e-mail não tem acesso ao hub") — quem já entrou no hub e lê que o e-mail não tem acesso fica confuso; a frase do brief continua na tela de sem acesso total — custo se errado: trocar uma frase (o e2e da Task 10 usa a nova).
- **Task 7:** RouterProvider importado de "react-router" e não de "react-router/dom" — no vitest os dois caminhos carregam cópias diferentes do contexto e a tela quebra — custo se errado: sem flushSync nas navegações (não usamos).
- **Task 7:** criados Marca.tsx, App.module.css, src/teste/ajuda.tsx (fetch falso e PESSOAS fictícias) e afterEach com unstubAllGlobals/useRealTimers em preparar.ts; App.test ganhou o caso de página não encontrada — peças que o brief não lista mas o esqueleto precisa — custo se errado: arquivos a mais.
- **Task 7:** seção de fase 1 sem tela (Time) mostra EmConstrucao até a Task 9; Hoje mostra a saudação e um cartão "chega na fase 2"; Perfil tem "Entrar com outro e-mail" na tela de sem acesso total (logout do Access) — o brief não diz o que a seção Time mostra antes da Task 9 — custo se errado: nenhum após a Task 9.
- **Task 8:** buscar compara também no singular (objecoes → objecao, ais → al, eis → el, ns → m, res/ses/zes, s) além do trecho cru — só com trecho, "objecao" não acha "Objeções" (teste do brief e Review Focus); o trecho cru continua achando quem ainda está digitando — custo se errado: algum falso positivo em palavras curtas. O teste extra de plural foi escrito depois da regra (o RED foi o "objecao" do brief).
- **Task 8:** pontuação 2 = a consulta começa numa palavra do título (" " + título contém " " + consulta), o que cobre consulta de várias palavras — o brief diz "alguma palavra do título começa com ela" — custo se errado: ordem diferente em consultas de várias palavras.
- **Task 8:** entrada da busca com transition + @starting-style (véu 240 ms, caixa sobe de -8 px e 0,97) em vez de animation — o e2e da Task 10 mede transition-duration do véu; com movimento reduzido mede 0s (conferido no Chromium) — custo se errado: navegador sem @starting-style abre sem animação.
- **Task 8:** Ctrl K e Cmd K alternam a busca; o botão do topo abre; Tab fica preso no campo; clicar no véu fecha; o foco volta para onde estava — o brief não detalha — custo se errado: nenhum.
- **Task 9:** testes da API de pessoas em servidor/rotas/pessoas.test.ts (brief: functions/api/pessoas/pessoas.api.test.ts) — mesma razão da Task 5: em functions/ viraria rota — custo se errado: nenhum.
- **Task 9:** interface Pessoa movida para compartilhado/pessoa.ts e reexportada por servidor/tipos.ts — a tela Time precisa do tipo e o tsconfig da interface não aceita os tipos do Workers (D1Database) — custo se errado: nenhum.
- **Task 9:** validação em servidor/validacao.ts com mensagens próprias (nome 2–80 caracteres, e-mail nome@dominio.com, cargo da lista, ativo booleano, PATCH vazio = "Nada para mudar.", corpo que não é objeto JSON = 400) e nome com espaços colapsados; id não numérico = 404 — o brief fixa as regras mas não os textos — custo se errado: trocar textos.
- **Task 9:** o 403 de não diretor nas rotas de pessoas usa o código sem_acesso (como pede o brief), o que no front troca a tela inteira para "sem acesso"; só acontece se um diretor for rebaixado com o Time aberto — custo se errado: nesse caso raro a pessoa vê "sem acesso" em vez de voltar ao Hoje (recarregar resolve).
- **Task 9:** checagem do último diretor é contar-e-depois-gravar, sem trava atômica — dois diretores se rebaixando no mesmo instante é improvável — custo se errado: time sem diretor ativo; o DIRETOR_INICIAL não reentra porque já existe cadastrado (conserto via wrangler d1 execute).
- **Task 9:** na tela, o diretor não vê Desativar na própria linha; quem muda o próprio cargo é levado ao Hoje (recarrega); a nova pessoa entra no fim da lista até recarregar — o brief não detalha — custo se errado: nenhum.
- **Task 10:** SEGURANÇA — modo dev (X-Dev-Email) só vale com hostname localhost/127.0.0.1/[::1], e o wrangler.toml ganhou env.production e env.preview com AMBIENTE=producao (ACCESS_* e database_id = PREENCHER) — o Pages usa o [vars] do wrangler.toml em produção, então AMBIENTE=dev iria para o ar e qualquer pessoa logada no Access poderia se passar pelo diretor; com PREENCHER ninguém entra (falha fechada) — custo se errado: quem rodar o hub local por um IP da rede (não localhost) não entra.
- **Task 10:** DEV_EMAIL no .dev.vars (só em dev local) como alternativa ao cabeçalho — sem ele, o README não teria como abrir o hub no navegador local — custo se errado: nenhum em produção (bloqueado pelo hostname e pelo AMBIENTE).
- **Task 10:** functions/api/[[rota]].ts responde 404 JSON para /api sem rota — sem ela o Pages devolvia a página do app com 200 e o cliente lia null como sucesso (RED visto no e2e: 200) — custo se errado: nenhum.
- **Task 10:** npm run e2e já roda e2e:preparar antes (o brief separa) e o diretor confere a pessoa nova depois de recarregar; reducedMotion vai em contextOptions (no use direto o Playwright 1.56 ignora; o teste falhou com 0.24s) e há um teste irmão que mede 0.24s sem a preferência — rodar o e2e duas vezes sem preparar daria 409 na Ana — custo se errado: nenhum.
- **Task 10:** DIRETOR_INICIAL em produção é segredo (wrangler pages secret put), não variável no wrangler.toml — é e-mail real de membro da MecTRIA, que não pode ir para o repositório — custo se errado: um comando a mais na implantação.
- **Task 10:** hub-comercial/ marcado como versão 0.2 a ser substituída no README da raiz, com a linha do hub/ — pedido do brief — custo se errado: nenhum.

## Revisão final: o que foi corrigido

Revisor independente; veredito "pronto com correções". Correções no commit `3c483b1`. Resultado depois delas: typecheck sem erros, interface 66/66, API 42/42 e ponta a ponta 9/9.

- C1 CSRF no POST/PATCH (form text/plain ou Origin/Sec-Fetch-Site de outro site) — protecao.test.ts 3 testes RED→GREEN, suite app 66/66, api 42/42, e2e 9/9; IMPLANTACAO pede SameSite=Lax no Access.
- I1 recusa por cargo usava sem_acesso e trocava a tela inteira — "closer chamando GET /api/pessoas recebe 403" (agora sem_permissao) RED→GREEN, suite verde.
- I2 prévias gravavam no banco de produção — env.preview usa hub-mectria-previa (config e IMPLANTACAO; sem teste automatizável, é configuração do Pages).
- I3 sem edição de nome e primeiro diretor com nome cru — "Renomear troca o nome com Enter…" e "Esc desiste…" RED→GREEN; "DIRETOR_INICIAL … entra como diretor" (nome "Diretor Inicial") RED→GREEN, suite verde.
- (re-graduado de Minor 3 para Important: e-mail colado do WhatsApp trava o login da pessoa) caracteres invisíveis e ".." no e-mail — "normalizarEmail tira caracteres invisíveis", "e-mail colado com caractere invisível é gravado limpo" e o caso "rita@mectria..com" RED→GREEN, suite verde.
- (re-graduado de Minor 7: regra do projeto) marcelo@mectria.com nos testes trocado por diretor.inicial@mectria.com — coberto pelo mesmo teste do I3.
- (re-graduado de Minor 10: quem implanta trava no passo 5) IMPLANTACAO cria o Access antes de pedir o AUD — documento, sem teste.

## Revisão final: pontos menores adiados (decisão do Lucas)

- chave de tema marca "Sistema" sem localStorage depois de trocar o tema (o tema aplicado está certo).
- corrida do último diretor (contar e depois gravar); UPDATE condicional resolveria.
- ordenação por nome joga iniciais acentuadas (Álvaro, Érica) para o fim; usar Intl.Collator pt-BR.
- endurecer o JWT com algorithms ["RS256"] e requiredClaims ["email"] (hoje não é explorável).
- busca não prende o foco se clicar numa área não focável do diálogo.
- CI sem permissions: { contents: read }.
- --passWithNoTests ainda no test:api.

## Revisão final: itens deixados de fora pelo revisor e como ficaram

- headers de segurança e CSP — o Access protege a frente e a fase 1 não tem conteúdo de terceiros; entra numa fase seguinte — custo se errado: menos defesa em profundidade contra XSS.
- login que expira no meio do uso vira erro de "rede" — a spec trata disso junto com o rascunho, nas fases seguintes; a mensagem já diz para recarregar — custo se errado: uma mensagem pouco precisa.
- 404 em vez de 405 para método sem rota — cosmético para uma API interna — custo se errado: nenhum.
- CSRF no wrangler pages dev local com DEV_EMAIL — só afeta a máquina de quem desenvolve, e a proteção nova vale também lá — custo se errado: nenhum.
- build duplicado no CI — só tempo de CI — custo se errado: um minuto por execução.
- fidelidade visual — conferida por capturas no Chromium (vitrine, esqueleto, busca, Time, claro, escuro e celular) — custo se errado: ajustes visuais na sessão de aceite.
- nome real "Vinícius Miguel" na fixture de teste — a regra cobre e-mails e documentos, não nomes, e o e-mail da fixture é fictício — custo se errado: trocar um nome.
- npm audit em dependências de desenvolvimento — já coberto pelo ruling da Task 1 — custo se errado: risco só na máquina de quem desenvolve.
- Durable Objects e Time Travel no plano grátis — pendências da spec, documentadas no IMPLANTACAO — custo se errado: US$ 5/mês.
- limite de taxa na API — o Access protege a frente e o time tem ~10 pessoas — custo se errado: nenhum realista.
- UNIQUE do e-mail sensível a maiúsculas no banco — toda escrita normaliza; só SQL manual furaria — custo se errado: duplicata via SQL manual.
- @starting-style em navegador antigo — só perde a animação — custo se errado: nenhum.
