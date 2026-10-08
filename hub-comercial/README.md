# Hub comercial MecTRIA

O "site do vendedor": o processo comercial da MecTRIA num lugar só, da primeira ligação ao fechamento. É a base da etapa R (Retórica), adiantada em paralelo com a T. Decisão de 08/10/2026 em `docs/07-decisoes-e-pendencias.md`.

**Status:** versão 0.2 (08/10/2026), reorganizada para mostrar uma coisa por vez. Base para lapidar. Todo o conteúdo é rascunho até a validação com a MecTRIA. As marcações mostram o que falta (ver "Marcações").

## Como está organizado

Uma coisa por vez. Cada tela mostra só o que o vendedor precisa naquele momento; dicas (ⓘ), objeções, resumo da diagnóstica e o roteador de serviços abrem num painel lateral (no celular, uma folha que sobe de baixo).

| Aba | O que tem |
|---|---|
| **Início** | O que fazer hoje (toques de follow-up, propostas marcadas, diagnósticas do dia) e três atalhos |
| **Apresentações** | Um cartão por apresentação: diagnóstica, portfólio para o WhatsApp e uma proposta por serviço. "Para" escolhe o cliente, e a apresentação já abre com o nome e as dores dele |
| **Playbooks** | Cold call, reunião diagnóstica, apresentação de proposta e o processo comercial (do hunter ao closer) |
| **Follow-up** | Propostas na rua com o próximo toque de cada uma. No detalhe, só o próximo toque fica aberto, com a mensagem pronta |

**Modo reunião (diagnóstica e proposta):** uma etapa por vez, com "Anterior" e "Próximo" e a barra de etapas no topo.
- **Diagnóstica:** Cliente · Abertura · Objetivos · Planos · Desafios · Prazo · Orçamento · Decisão · Impacto (GPCTBA + C&I) · Serviço · Fechamento. O botão "Serviço" abre o roteador a qualquer momento: o vendedor busca pelo que o cliente falou ("galpão", "fiscalização") e marca o serviço; as perguntas técnicas dele entram na etapa Serviço. No fim, o briefing em PDF para Projetos.
- **Proposta:** Antes · os 12 passos da sequência fixa · Resultado. Cada passo mostra a fala com as dores do cliente e, quando tem, o micro pacto como um botão grande. "Apresentar" abre a apresentação do serviço já com o cliente; os pactos marcados nos slides aparecem no playbook.

## Apresentações: um arquivo para cada uma

```
apresentacoes/diagnostica.html          reunião diagnóstica
apresentacoes/portfolio.html            portfólio (o único que vai para o site público)
apresentacoes/propostas/<serviço>.html  uma proposta por serviço
apresentacoes/proposta-base.js          sequência padrão das propostas
apresentacoes/deck.js                   motor dos slides (teclado, toque, tela cheia, PDF, pactos)
```

Cada proposta tem um `CONFIG` no topo do arquivo com o que é só dela: a frase da capa, os slides que ela não usa (`ocultar`) e os slides a mais (`extras`). O que é comum a todas fica em `proposta-base.js`; os dados do serviço (método, escopo, céu e inferno) ficam em `js/dados/servicos.js`. Para criar uma apresentação nova, copie um arquivo de `propostas/` e registre em `js/dados/apresentacoes.js`.

## Como abrir

- **No computador:** abra `index.html` no Chrome ou no Edge. Não precisa instalar nada.
- **Hospedado:** qualquer hospedagem estática serve. **Não publicar no site público da MecTRIA:** o hub tem regras internas de preço e roteiros. Se for para a mesma conta Cloudflare do site, proteger com Cloudflare Access (só e-mails @mectria.com). O `index.html` já tem `noindex`.
- **O portfólio é a exceção:** ele é para o cliente e precisa ficar público (ex.: `mectria.com/portfolio`). Combinar com a frente Tela.

## Onde ficam os dados

No `localStorage` do navegador de cada vendedor (chave `hub-mectria:v1`). O botão de **Ajustes** (no canto do topo) exporta e importa o backup (.json; a importação junta os leads, e no mesmo lead vale o mais recente) e gera o **CSV das propostas** no formato do Histórico ampliado (tarefa 34): data, valor, status, motivo da perda, pactos feitos, se usou a nova apresentação.

Limite desta versão: os dados não são compartilhados entre vendedores. O próximo passo é uma base compartilhada (ver "Próximos passos").

## Onde mexer no conteúdo

Todo o texto fica em `js/dados/`. Não precisa mexer nas telas para mudar conteúdo.

| Arquivo | Conteúdo |
|---|---|
| `empresa.js` | Propósito, assinatura, diferenciais, números, fluxo de 3 dias, regras de condição (desconto, parcelas, validade) |
| `servicos.js` | Os 12 serviços da Carta: pistas, dores, gancho, perguntas técnicas, o que entregamos e o que fica com o cliente, método, céu e inferno, âncora de valor |
| `apresentacoes.js` | O catálogo de apresentações da aba Apresentações |
| `diagnostica.js` | Roteiro e perguntas GPCTBA + C&I da diagnóstica, fechamento e resumo para o cliente |
| `proposta.js` | Os 12 passos da apresentação, os 6 micro pactos e as regras de condição |
| `objecoes.js` | O guia de objeções, por etapa |
| `fup.js` | Cadência de follow-up, motivos de perda e feriados |
| `cold-call.js` | Roteiro de cold call, recepção e tentativas |

As falas usam variáveis entre chaves (`{dor}`, `{contato}`, `{prazo}`...), preenchidas com o que o vendedor registrou na diagnóstica. A lista está em `js/base.js` (`H.variaveis`).

## Marcações

- **Texto em vinho:** veio dos dados do lead.
- **[Texto em vermelho entre colchetes]:** o vendedor completa antes de falar ou mandar.
- **Selo VALIDAR:** depende de informação ou decisão da MecTRIA (`docs/14-pedidos-a-mectria.md`).

## Estrutura

```
index.html            o hub (rotas por #)
css/marca.css         cores e fontes do manual de identidade
css/hub.css           telas do hub
css/briefing.css      PDF do briefing (folha padrão de documentos do manual)
css/deck.css          apresentações em slides
js/dados/             conteúdo (ver acima)
js/base.js            estado, datas em dias úteis, variáveis, exportação
js/telas/comum.js     ícones, painel lateral, dicas, campos, pactos, objeções
js/telas/             uma tela por arquivo
js/hub.js             rotas e ajustes
apresentacoes/        um arquivo por apresentação (ver acima)
assets/               logo (principal e negativa) e símbolo, recortados do manual
```

Sem dependências nem build: HTML, CSS e JavaScript puro. A única coisa externa é a fonte Poppins (Google Fonts); sem internet, cai para a fonte do sistema.

## Próximos passos

1. **Validar o conteúdo com a MecTRIA:** objeções reais e motivos de perda com os closers (pedido 24), processo atual (25), Primal Branding (22), cliente ideal (23) e as políticas que respondem objeções (ART, revisões, sigilo, férias).
2. **Primeiro uso real:** colocar no follow-up as propostas que já estão na rua e usar o playbook na próxima diagnóstica.
3. **Base compartilhada:** levar os leads para uma base do time (planilha do Histórico, ou banco na mesma conta da hospedagem), com login pelo e-mail da MecTRIA.
4. **Etapa I (S6–S7):** a apresentação de proposta vira a versão interativa definitiva, com calculadora e o roteiro slide a slide.
