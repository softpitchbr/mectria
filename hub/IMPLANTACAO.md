# Implantação do hub na conta da MecTRIA

Passo a passo para publicar o hub em `hub.mectria.com`. Tudo é feito com o **e-mail institucional da MecTRIA**, nunca com o da Triângulo. A Triângulo entra só como membro convidado e sai em 05/02/2027.

Pré-requisito: Node 22 e o repositório do hub clonado. Os comandos rodam dentro da pasta `hub/`.

## 1. Conta Cloudflare

1. Criar a conta em cloudflare.com com o e-mail institucional da MecTRIA.
2. Ficar no plano Free. Não cadastrar cartão.
3. No terminal: `npx wrangler login` (abre o navegador para autorizar a conta da MecTRIA).

## 2. Bancos de dados (D1)

São dois: o de produção e o das prévias (os endereços de teste que o Pages cria para cada branch). Assim, teste nunca suja os dados reais.

```bash
npx wrangler d1 create hub-mectria
npx wrangler d1 create hub-mectria-previa
```

Cada comando mostra um `database_id`. No `wrangler.toml`:

- o de `hub-mectria` entra no lugar de `PREENCHER`, na seção `env.production`;
- o de `hub-mectria-previa` entra no lugar de `PREENCHER-PREVIA`, na seção `env.preview`.

A seção de cima, com `database_id = "local"`, é do desenvolvimento e fica como está.

## 3. Tabelas

```bash
npx wrangler d1 migrations apply hub-mectria --remote
npx wrangler d1 migrations apply hub-mectria-previa --remote
```

Rodar de novo sempre que uma fase nova trouxer arquivos em `migrations/`: primeiro na prévia, depois em produção.

## 4. Login (Cloudflare Zero Trust)

1. Abrir Zero Trust no painel e criar a equipe (por exemplo, `mectria`). O plano Free cobre até 50 pessoas. Anotar o nome da equipe: é o que vem antes de `.cloudflareaccess.com`.
2. Settings → Authentication → Login methods: deixar **One-time PIN** (a pessoa digita o e-mail e recebe um código).
3. Access → Applications → Add an application → Self-hosted:
   - domínios: `hub.mectria.com`, `hub-mectria.pages.dev` e `*.hub-mectria.pages.dev` (as prévias);
   - em **Cookie settings**, ligar **SameSite: Lax** (protege contra sites de fora que tentem agir com a sessão de quem está logado);
   - copiar o **Application Audience (AUD) Tag**: ele vai no passo 6.
4. Política da aplicação (Allow):
   - e-mails terminados em `@mectria.com`;
   - e os e-mails avulsos de quem for cadastrado no Time sem e-mail institucional.

O Access deixa entrar quem está na política; o hub ainda confere se a pessoa está cadastrada e ativa no Time. As duas listas precisam andar juntas.

## 5. Projeto no Pages

1. Criar o repositório do hub no GitHub da MecTRIA e subir o código.
2. No painel da Cloudflare: Workers & Pages → Create → Pages → conectar o GitHub da MecTRIA e escolher o repositório. Usar `hub-mectria` como nome do projeto (os comandos abaixo usam esse nome).
3. Configuração do build:
   - pasta raiz (root directory): `hub`;
   - comando de build: `npm ci && npm run build`;
   - pasta de saída: `dist`.
4. Variável de ambiente do build: `NODE_VERSION = 22`.

Enquanto o passo 6 não for feito, o hub publicado recusa todo mundo. É de propósito.

## 6. Variáveis de produção

Com o `wrangler.toml` no repositório, o Pages lê as variáveis dele (o painel mostra, mas não deixa editar). Por isso:

- **No `wrangler.toml`** (seções `env.production.vars` e `env.preview.vars`), trocar `PREENCHER` em:
  - `ACCESS_EQUIPE`: o nome da equipe do passo 4;
  - `ACCESS_AUD`: o AUD Tag do passo 4.
  - `AMBIENTE` já está como `producao`. **Nunca** trocar para `dev` fora da máquina local.
- **Como segredo** (não vai para o repositório): o e-mail do primeiro diretor, em produção e na prévia.

```bash
npx wrangler pages secret put DIRETOR_INICIAL --project-name hub-mectria
```

Para a prévia, pelo painel: projeto `hub-mectria` → Settings → Variables and Secrets → ambiente **Preview** → Add → tipo **Secret**, nome `DIRETOR_INICIAL`.

Fazer o commit do `wrangler.toml` com os valores e o push: o Pages publica de novo.

## 7. Domínio próprio

No projeto do Pages: Custom domains → `hub.mectria.com`. Isso depende do acesso ao DNS de `mectria.com` (pedido 2 da MecTRIA). Até lá, o hub fica em `hub-mectria.pages.dev`, também protegido pelo Access.

## 8. Primeiro acesso

1. A pessoa do `DIRETOR_INICIAL` abre o hub, entra com o código do e-mail e vira diretor comercial automaticamente (só acontece quando ainda não há diretor ativo). O nome entra a partir do e-mail (`marcelo.silva@` vira "Marcelo Silva") e pode ser corrigido em Time → Renomear.
2. Em Time, o diretor cadastra o resto do time com nome, e-mail e cargo.

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
| Durable Objects (celular como controle, fase 5) | **A confirmar** se entra no grátis | US$ 5/mês (plano pago) |

Na fase 4, as duas janelas da reunião (a apresentação e o painel) se falam pelo próprio navegador, sem servidor de tempo real. Os Durable Objects só entram na fase 5, com o celular.

O volume da MecTRIA (umas 10 pessoas e algumas centenas de oportunidades por ano) fica muito abaixo desses limites. O plano grátis não tem prazo e não pausa por falta de uso. Onde ver o consumo: painel da Cloudflare → Workers & Pages → Overview, e D1 → hub-mectria → Metrics.

**Duas confirmações ao criar a conta:**

1. Se o plano grátis cobre os Durable Objects.
2. Por quantos dias o D1 permite voltar o banco no tempo (Time Travel) no plano grátis.

## Se algo der errado

- **Ninguém consegue entrar:** conferir `ACCESS_EQUIPE`, `ACCESS_AUD` e se o build mais recente terminou.
- **Uma pessoa entra no Access mas vê "Seu e-mail não tem acesso ao hub":** ela não está cadastrada no Time, ou está inativa.
- **O time ficou sem diretor:** `npx wrangler d1 execute hub-mectria --remote --command "UPDATE pessoas SET cargo = 'diretor', ativo = 1 WHERE email = 'email@mectria.com'"`.
