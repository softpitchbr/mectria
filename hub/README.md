# Hub comercial MecTRIA

O hub do vendedor da MecTRIA: login pelo e-mail, navegação por cargo (hunter, closer, diretor comercial e projetos), busca Ctrl K e o sistema visual Prancheta, nos temas claro e escuro. A especificação está em [`docs/15-hub-template.md`](../docs/15-hub-template.md).

Pronto até agora (fases 1 e 2 de 6):

- **Base:** login, cargos, navegação, busca, Time e os dois temas.
- **Rotina e follow-up:** o Hoje de cada cargo (bloco de ligações do hunter em modo foco, próxima reunião do closer, resumo do time para o diretor), a seção Rotinas (checklist do dia e histórico) e o Follow-up (cadência D0 a D15 em dias úteis, atraso e o toque em modo foco, com a mensagem pronta).

As outras seções mostram em que fase chegam.

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
  migrations/                      0001 pessoas · 0002 oportunidades, reuniões, propostas, toques, rotinas, ligações e histórico
  compartilhado/                   usado pela interface e pela API
    cargos.ts, pessoa.ts           cargos, rótulos e o tipo Pessoa
    permissoes.ts                  seções, fase de cada uma e quem pode fazer o quê
    texto.ts                       normalizar texto e e-mail
    datas.ts                       hoje em São Paulo, dias úteis, datas e reais
    cadencia.ts                    datas da cadência e preenchimento das mensagens
    oportunidade.ts                tipos de oportunidade, reunião, proposta, toque e rotina
    dados/                         conteúdo: cadência, feriados, serviços, rotinas e roteiro de cold call
    icones.ts                      nomes dos ícones
  servidor/                        lógica da API
    identidade.ts                  e-mail pelo JWT do Access (ou dev local)
    protecao.ts                    recusa pedidos de outros sites (CSRF)
    pessoas.ts                     tabela de pessoas
    oportunidades.ts               diagnóstica marcada, assumir, situação e histórico
    followup.ts                    proposta, toques, lista do follow-up, resultado e números do mês
    rotina.ts                      ligações, rotina do dia, histórico e resumo do time
    validacao.ts                   regras dos dados que chegam
    respostas.ts                   respostas JSON e códigos de erro
    rotas/                         testes das rotas (em functions/ todo arquivo vira rota)
  functions/api/                   rotas: _middleware (quem é a pessoa), eu, pessoas, closers, oportunidades,
                                   propostas, followup, toques, ligacoes, reunioes, rotina, time/resumo, numeros/mes, 404
  src/
    estilo/                        tokens, grade técnica e fontes
    tema/                          tema claro/escuro e teste de contraste
    componentes/                   Botao, Painel, Tag, Campo, Selecao, AreaDeTexto, Icone, Aviso, Foco, Medidor, NumeroRolante
    efeitos/luz.ts                 luz que segue o cursor na grade e nos cartões
    api/cliente.ts                 chamadas à API
    sessao/useEu.ts                quem está usando o hub
    shell/                         barras, topo, perfil, sem acesso, em construção
    busca/                         busca Ctrl K e as fontes de itens
    telas/                         Hoje (e hoje/ por cargo), FollowUp (e followup/), Rotinas, Time e Vitrine
  e2e/                             testes ponta a ponta e a semente do banco local
```

## Regra para as próximas fases

O conteúdo comercial (roteiros, perguntas GPCTBA, objeções, cadências, modelos de rotina) entra em **arquivos de dados** (`compartilhado/dados/`), separados das telas, como na versão 0.2 (`hub-comercial/js/dados/`). A cadência, os feriados, os serviços, as rotinas e o roteiro de cold call já estão lá; a meta de ligações (1 a 2 por dia) fica em `compartilhado/dados/rotinas.ts`. As telas só leem esses arquivos. Novos itens da busca entram como novas fontes em `src/busca/fontes.ts`, sem mudar a tela da busca.
