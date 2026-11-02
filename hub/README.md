# Hub comercial MecTRIA

O hub do vendedor da MecTRIA: login pelo e-mail, navegação por cargo (hunter, closer, diretor comercial e projetos), busca Ctrl K e o sistema visual Prancheta, nos temas claro e escuro. A especificação está em [`docs/15-hub-template.md`](../docs/15-hub-template.md). Esta é a **fase 1 de 6** (a base); as outras seções mostram em que fase chegam.

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
npm run e2e:preparar                # cria o banco local com as pessoas fictícias de e2e/semente.sql
npm run build
npx wrangler pages dev dist         # abre em http://localhost:8788
```

Para ver o hub como outro cargo, troque o `DEV_EMAIL` no `.dev.vars` por outro e-mail da semente (`dir@`, `clo@`, `hun@`, `pro@` ou `ex@mectria.com`) e reinicie o `wrangler pages dev`.

Só a interface, sem API: `npm run dev` (Vite). Útil para mexer em estilo; a página `/vitrine` mostra todos os componentes nos dois temas.

## Testar

```bash
npm run typecheck   # tipos da interface e da API
npm test            # interface (jsdom) e API (runtime da Cloudflare com D1 local)
npm run e2e         # ponta a ponta no Chromium, com wrangler pages dev
```

O CI (`.github/workflows/hub.yml`) roda os três em todo push que mexe em `hub/`.

## Onde fica cada coisa

```
hub/
  migrations/0001_pessoas.sql      tabela de pessoas (ninguém é apagado: quem sai fica inativo)
  compartilhado/                   usado pela interface e pela API
    cargos.ts                      cargos e rótulos
    permissoes.ts                  seções, fase de cada uma e quem vê o quê
    pessoa.ts                      tipo Pessoa
    texto.ts                       normalizar texto e e-mail
    icones.ts                      nomes dos ícones
  servidor/                        lógica da API
    identidade.ts                  e-mail pelo JWT do Access (ou dev local)
    pessoas.ts                     acesso à tabela de pessoas
    validacao.ts                   regras dos dados de pessoas
    respostas.ts                   respostas JSON e códigos de erro
    rotas/                         testes das rotas (em functions/ todo arquivo vira rota)
  functions/api/                   rotas: _middleware (quem é a pessoa), eu, pessoas, 404
  src/
    estilo/                        tokens, grade técnica e fontes
    tema/                          tema claro/escuro e teste de contraste
    componentes/                   Botao, Painel, Tag, Campo, Icone, Aviso
    efeitos/luz.ts                 luz que segue o cursor na grade e nos cartões
    api/cliente.ts                 chamadas à API
    sessao/useEu.ts                quem está usando o hub
    shell/                         barras, topo, perfil, sem acesso, em construção
    busca/                         busca Ctrl K e as fontes de itens
    telas/                         Hoje, Time e Vitrine
  e2e/                             teste ponta a ponta e a semente do banco local
```

## Regra para as próximas fases

O conteúdo comercial (roteiros, perguntas GPCTBA, objeções, cadências, modelos de rotina) entra em **arquivos de dados**, separados das telas, como na versão 0.2 (`hub-comercial/js/dados/`). As telas só leem esses arquivos. Novos itens da busca entram como novas fontes em `src/busca/fontes.ts`, sem mudar a tela da busca.
