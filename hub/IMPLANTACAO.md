# Implantação do hub na conta da MecTRIA

Passo a passo para publicar o hub em `hub.mectria.com`. Tudo é feito com o **e-mail institucional da MecTRIA**, nunca com o da Triângulo. A Triângulo entra só como membro convidado e sai em 05/02/2027.

Pré-requisito: Node 22 e o repositório do hub clonado. Os comandos rodam dentro da pasta `hub/`.

## 1. Conta Cloudflare

1. Criar a conta em cloudflare.com com o e-mail institucional da MecTRIA.
2. Ficar no plano Free. Não cadastrar cartão.
3. No terminal: `npx wrangler login` (abre o navegador para autorizar a conta da MecTRIA).

## 2. Banco de dados (D1)

```bash
npx wrangler d1 create hub-mectria
```

O comando mostra um `database_id`. No `wrangler.toml`, trocar os dois `database_id = "PREENCHER"` (seções `env.production` e `env.preview`) por esse valor. A seção de cima, com `database_id = "local"`, é do desenvolvimento e fica como está.

## 3. Tabelas

```bash
npx wrangler d1 migrations apply hub-mectria --remote
```

Rodar de novo sempre que uma fase nova trouxer arquivos em `migrations/`.

## 4. Projeto no Pages

1. Criar o repositório do hub no GitHub da MecTRIA e subir o código.
2. No painel da Cloudflare: Workers & Pages → Create → Pages → conectar o GitHub da MecTRIA e escolher o repositório.
3. Configuração do build:
   - pasta raiz (root directory): `hub`;
   - comando de build: `npm ci && npm run build`;
   - pasta de saída: `dist`.
4. Variável de ambiente do build: `NODE_VERSION = 22`.

## 5. Variáveis de produção

Com o `wrangler.toml` no repositório, o Pages lê as variáveis dele (o painel mostra, mas não deixa editar). Por isso:

- **No `wrangler.toml`** (seções `env.production.vars` e `env.preview.vars`), trocar `PREENCHER` em:
  - `ACCESS_EQUIPE`: o nome da equipe do Zero Trust (o que vem antes de `.cloudflareaccess.com`, passo 6);
  - `ACCESS_AUD`: o "Application Audience (AUD) Tag" da aplicação do Access (passo 6).
  - `AMBIENTE` já está como `producao`. **Nunca** trocar para `dev` fora da máquina local.
- **Como segredo** (não vai para o repositório): o e-mail do primeiro diretor.

```bash
npx wrangler pages secret put DIRETOR_INICIAL --project-name hub-mectria
```

Enquanto `ACCESS_EQUIPE` e `ACCESS_AUD` estiverem como `PREENCHER`, ninguém entra: o hub recusa toda chamada. É de propósito.

## 6. Login (Cloudflare Zero Trust)

1. Abrir Zero Trust no painel e criar a equipe (por exemplo, `mectria`). O plano Free cobre até 50 pessoas.
2. Settings → Authentication → Login methods: deixar **One-time PIN** (a pessoa digita o e-mail e recebe um código).
3. Access → Applications → Add an application → Self-hosted:
   - domínios: `hub.mectria.com` e `hub-mectria.pages.dev` (e `*.hub-mectria.pages.dev`, para as prévias);
   - copiar o **Application Audience (AUD) Tag** para o `ACCESS_AUD` do passo 5.
4. Política da aplicação (Allow):
   - e-mails terminados em `@mectria.com`;
   - e os e-mails avulsos de quem for cadastrado no Time sem e-mail institucional.

O Access deixa entrar quem está na política; o hub ainda confere se a pessoa está cadastrada e ativa no Time. As duas listas precisam andar juntas.

## 7. Domínio próprio

No projeto do Pages: Custom domains → `hub.mectria.com`. Isso depende do acesso ao DNS de `mectria.com` (pedido 2 da MecTRIA). Até lá, o hub fica em `hub-mectria.pages.dev`, também protegido pelo Access.

## 8. Primeiro acesso

1. Publicar (um push no repositório já dispara o build).
2. A pessoa do `DIRETOR_INICIAL` abre o hub, entra com o código do e-mail e vira diretor comercial automaticamente (só acontece quando ainda não há diretor ativo).
3. Em Time, o diretor cadastra o resto do time com nome, e-mail e cargo.

## 9. Triângulo

1. Em Manage Account → Members, convidar o e-mail da Triângulo com acesso de administrador, para o acompanhamento.
2. No GitHub da MecTRIA, convidar a Triângulo como colaboradora do repositório.
3. Em **05/02/2027**, remover a Triângulo das duas contas.

## Custos

| Item | Plano grátis | Se passar |
|---|---|---|
| Pages (o site) | Sem limite de visitas; 500 builds por mês | Não se aplica ao volume da MecTRIA |
| Workers / Functions (a API) | 100 mil chamadas por dia | Plano pago: US$ 5/mês |
| D1 (o banco) | 5 milhões de leituras e 100 mil gravações por dia; 5 GB | Plano pago: US$ 5/mês |
| Access (o login) | Até 50 pessoas | Cerca de US$ 7/mês por pessoa acima de 50 |
| Durable Objects (reunião em tempo real, fase 4) | **A confirmar** se entra no grátis | US$ 5/mês (plano pago) |

O volume da MecTRIA (umas 10 pessoas e algumas centenas de oportunidades por ano) fica muito abaixo desses limites. O plano grátis não tem prazo e não pausa por falta de uso. Onde ver o consumo: painel da Cloudflare → Workers & Pages → Overview, e D1 → hub-mectria → Metrics.

**Duas confirmações ao criar a conta:**

1. Se o plano grátis cobre os Durable Objects.
2. Por quantos dias o D1 permite voltar o banco no tempo (Time Travel) no plano grátis.

## Se algo der errado

- **Ninguém consegue entrar:** conferir `ACCESS_EQUIPE`, `ACCESS_AUD` e se o build mais recente terminou.
- **Uma pessoa entra no Access mas vê "Seu e-mail não tem acesso ao hub":** ela não está cadastrada no Time, ou está inativa.
- **O time ficou sem diretor:** `npx wrangler d1 execute hub-mectria --remote --command "UPDATE pessoas SET cargo = 'diretor', ativo = 1 WHERE email = 'email@mectria.com'"`.
