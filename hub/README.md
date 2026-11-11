# Hub comercial MecTRIA

O hub do vendedor da MecTRIA: login pelo e-mail, navegação por cargo (hunter, closer, diretor comercial e projetos), busca Ctrl K e o sistema visual Prancheta, nos temas claro e escuro. A especificação está em [`docs/15-hub-template.md`](../docs/15-hub-template.md).

Pronto até agora (fases 1 a 4 e 6 a 8; a 5, o celular como controle, fica para depois):

- **Base:** login, cargos, navegação, busca, Time e os dois temas.
- **Rotina e follow-up:** o Hoje de cada cargo (bloco de ligações do hunter em modo foco, próxima reunião do closer, resumo do time para o diretor), a seção Rotinas (checklist do dia e histórico) e o Follow-up (janela de 7 dias com D0, D1, ligação, sexta fixa e D7, atraso e o toque em modo foco, com a mensagem pronta; as propostas antigas continuam com os toques D3 a D15).
- **Diagnóstica:** a agenda em Reuniões, o painel em tela cheia (GPCTBA + C&I e as perguntas técnicas do serviço, uma de cada vez; anotações com N e marcações; fechamento obrigatório), o rascunho guardado no computador quando a internet cai, o briefing para Projetos em PDF, os Playbooks de consulta e a busca de clientes, roteiros e objeções.
- **Reunião de proposta em duas janelas:** a seção Apresentações (preparar as variáveis de cada cliente e o catálogo com a apresentação de exemplo de 13 slides), a janela da apresentação que o cliente vê, o painel sincronizado pelo próprio navegador (fala com as palavras do cliente, pactos, quem está na sala, tempo por bloco, objeções com O, anotações com N e o aviso de quem decide antes do preço) e o fechamento obrigatório, que registra a proposta, sugere o D7 como data da decisão e cria os toques de follow-up sozinho.
- **Diretor, Projetos e reativação (fase 6):** os números do mês no Hoje do diretor e na aba Mês de Time (propostas, fechadas, conversão, valor vendido, tempo da diagnóstica à decisão, números por closer, % da rotina de cada pessoa e objeções), as exportações (CSV do histórico do mês e todos os dados em JSON) e a exclusão de dados pessoais a pedido (LGPD) no briefing; a seção Briefings e o Hoje de Projetos, com as pendências técnicas respondidas em foco e a resposta no card do follow-up; a aba Reativação, com o mês para retomar escolhido ao mandar para nutrição; e o hunter conduzindo a diagnóstica que marcou.
- **Processo comercial (fase 7):** a rotina em blocos de prioridade com o % do dia (hunter: leads em conversa, reagendamentos, cold call e confirmações; closer: fechamento, AP, construção e reativação, com a tarefa feita sozinha quando o bloco está vazio), a conexão nas ligações e a meta de 8 conexões por semana, o cold call novo com os desvios e a cold message, as observações ao marcar a diagnóstica, os FUPs de confirmação e a mensagem para o Comercial & Projetos, o "Cliente não compareceu" com o reagendamento do hunter e há quantos dias cada lead está na etapa (alerta depois de 3 dias em construção).
- **Serviços e apresentações em HTML (fase 8):** os serviços saíram do código e foram para o banco, já com os 12 da carta. Na seção Serviços, o diretor cria e edita cada um (nome, sigla, resumo, dores, o que entregamos, o que fica com o cliente, âncora de valor e situação), as perguntas técnicas da diagnóstica (a salva é desativada, não apagada) e o roteiro por slide (fala, dica, pacto e tempo). Ele também envia a apresentação de proposta em HTML, que fica no Workers KV. Na reunião, a janela do cliente abre esse HTML num iframe isolado (sem o login, sem chamar a internet e sem abrir a API do hub), e o painel continua mandando: passa os slides, mostra a fala do roteiro do serviço, aciona as ações (revelar o preço, marcar uma dor) e digita os números da calculadora; o que a apresentação conta volta para o painel e fica no andamento. O contrato e o modelo estão em [`apresentacoes/`](apresentacoes/CONTRATO.md).

- Interface: React + Vite, servida pelo Cloudflare Pages.
- API: Pages Functions em `functions/api/`, com a lógica em `servidor/`.
- Banco: Cloudflare D1, com as tabelas em `migrations/`.
- Login: Cloudflare Access em produção; em desenvolvimento, o e-mail vem do `.dev.vars` ou do cabeçalho `X-Dev-Email`, e só em `localhost`.

Para publicar na conta da MecTRIA, veja [`IMPLANTACAO.md`](IMPLANTACAO.md).

## Rodar na sua máquina

Precisa de Node 22.

```bash
cd hub
npm install
cp .dev.vars.exemplo .dev.vars      # escolha quem você é em DEV_EMAIL
npm run e2e:preparar                # recria o banco local: pessoas fictícias e uma proposta atrasada (e2e/semente.sql)
npm run build
npx wrangler pages dev dist         # abre em http://localhost:8788
```

Para ver o hub como outro cargo, troque o `DEV_EMAIL` no `.dev.vars` por outro e-mail da semente (`dir@`, `clo@`, `hun@`, `pro@` ou `ex@mectria.com`) e reinicie o `wrangler pages dev`.

Só a interface, sem API: `npm run dev` (Vite). Útil para mexer em estilo; a página `/vitrine` mostra todos os componentes nos dois temas.

## Testar

```bash
npm run typecheck   # tipos da interface e da API
npm test            # interface (jsdom) e API (runtime da Cloudflare com D1 local)
npm run e2e         # ponta a ponta no Chromium (recria o banco local antes)
```

O CI (`.github/workflows/hub.yml`) roda os três em todo push que mexe em `hub/`.

## Onde fica cada coisa

```
hub/
  migrations/                      0001 pessoas · 0002 oportunidades, reuniões, propostas, toques, rotinas, ligações e histórico · 0003 fichas, anotações e pendências · 0004 uma pendência por anotação · 0005 preparação, andamento e desfecho da proposta · 0006 mês para retomar e resposta das pendências · 0007 conexão nas ligações, observações e confirmação da diagnóstica · 0008 serviços (com os 12 da carta) e as interações da apresentação na reunião
  compartilhado/                   usado pela interface e pela API
    cargos.ts, pessoa.ts           cargos, rótulos e o tipo Pessoa
    permissoes.ts                  seções, fase de cada uma e quem pode fazer o quê
    texto.ts                       normalizar texto e e-mail
    datas.ts                       hoje em São Paulo, dias úteis, datas e reais
    cadencia.ts                    datas da cadência e preenchimento das mensagens
    oportunidade.ts                tipos de oportunidade, reunião, proposta, toque, rotina e ficha
    diagnostica.ts                 roteiro da diagnóstica, resumos e o briefing
    proposta.ts                    variáveis da proposta, slides (do exemplo ou do roteiro do serviço), falas com as palavras do cliente e pactos
    servico.ts                     o serviço: tipos, situação, pergunta técnica, slide do roteiro e o endereço da apresentação
    contrato-apresentacao.ts       as mensagens entre o hub e a apresentação em HTML, conferidas e cortadas nos limites
    dados/                         conteúdo: cadência, feriados, rotinas, cold call, diagnóstica, objeções, proposta, empresa, a apresentação de exemplo e a carta de serviços (a semente da migração 0008)
    icones.ts                      nomes dos ícones
  servidor/                        lógica da API
    identidade.ts                  e-mail pelo JWT do Access (ou dev local)
    protecao.ts                    recusa pedidos de outros sites (CSRF)
    pessoas.ts                     tabela de pessoas
    oportunidades.ts               diagnóstica marcada, assumir, situação e histórico
    followup.ts                    proposta, toques, lista do follow-up, resultado e números do mês
    reativacao.ts                  oportunidades em nutrição: lista do mês, adiar, marcar reunião e perdida
    numeros.ts                     números do mês do diretor
    exportar.ts                    CSV do histórico, exportação completa e exclusão de dados pessoais (LGPD)
    pendencias.ts                  pendências técnicas de Projetos e os briefings enviados
    confirmacao.ts                 FUPs de confirmação e a diagnóstica confirmada
    reagendamento.ts               cliente não compareceu: a lista e o reagendamento do hunter
    rotina.ts                      ligações, rotina do dia, histórico e resumo do time
    diagnostica.ts                 ficha, anotações, pendências técnicas e fechamento da diagnóstica
    proposta.ts                    preparação, andamento e fechamento da proposta (proposta e toques numa transação)
    acessoReuniao.ts               quem abre e quem edita uma reunião
    errosDaReuniao.ts              os 409 e 400 das gravações da reunião
    validacao.ts                   regras dos dados que chegam
    servicos.ts                    serviços: lista, criar e editar (só o diretor)
    apresentacoes.ts               o HTML de cada serviço no Workers KV e os cabeçalhos que o isolam
    respostas.ts                   respostas JSON e códigos de erro
    rotas/                         testes das rotas (em functions/ todo arquivo vira rota)
  functions/api/                   rotas: _middleware (quem é a pessoa), eu, pessoas, closers, oportunidades,
                                   propostas, followup, toques, ligacoes, reunioes (a ficha, a proposta, as variáveis e o andamento),
                                   rotina, time/resumo, time/numeros, numeros/mes, reativacao, reagendamentos, pendencias, briefings, exportar,
                                   servicos (e a apresentação de cada um), 404
  src/
    estilo/                        tokens, grade técnica e fontes
    tema/                          tema claro/escuro e teste de contraste
    componentes/                   Botao, Painel, Tag, Campo, Selecao, AreaDeTexto, Icone, Aviso, Foco, Medidor, NumeroRolante
    efeitos/luz.ts                 luz que segue o cursor na grade e nos cartões
    api/cliente.ts                 chamadas à API
    sessao/useEu.ts                quem está usando o hub
    shell/                         barras, topo, perfil, sem acesso, em construção
    busca/                         busca Ctrl K e as fontes de itens (inclusive clientes, roteiros e objeções)
    diagnostica/                   painel da diagnóstica e o rascunho no computador
    servicos/                      a lista dos serviços, buscada uma vez da API para todas as telas
    reuniao/                       painel da proposta, canal entre as janelas, andamento no computador, fechamento e o painel diante da apresentação em HTML
    apresentacao/                  o slide, a janela da apresentação que o cliente vê, o iframe isolado do HTML e a vista para conferir uma apresentação
    telas/                         Hoje (e hoje/), FollowUp (e followup/, com a Reativação), Rotinas, Reunioes, Briefing, Briefings, Playbooks, Apresentacoes, Time (e time/, a aba Mês), servicos/ (lista e edição) e Vitrine
  apresentacoes/                   o contrato das apresentações em HTML (CONTRATO.md) e a apresentação de exemplo (exemplo.html)
  e2e/                             testes ponta a ponta e a semente do banco local
```

## Regra para as próximas fases

O conteúdo comercial (roteiros, perguntas GPCTBA, objeções, cadências, modelos de rotina) entra em **arquivos de dados** (`compartilhado/dados/`), separados das telas, como na versão 0.2 (`hub-comercial/js/dados/`). A cadência, os feriados, as rotinas e o roteiro de cold call já estão lá; a meta de 8 conexões por semana fica em `compartilhado/dados/rotinas.ts`. A exceção são os serviços: desde a fase 8 ficam no banco e o diretor edita em Serviços. As telas só leem esses arquivos. Novos itens da busca entram como novas fontes em `src/busca/fontes.ts`, sem mudar a tela da busca.
