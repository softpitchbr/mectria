# Hub comercial MecTRIA

O "site do vendedor": o processo comercial da MecTRIA num lugar só, da primeira ligação ao fechamento. É a base da etapa R (Retórica), adiantada em paralelo com a T. Decisão de 08/10/2026 em `docs/07-decisoes-e-pendencias.md`.

**Status:** versão 0.1, base para lapidar. Todo o conteúdo é rascunho até a validação com a MecTRIA. As marcações mostram o que falta (ver "Marcações").

## O que tem

| Aba | Ferramenta | O que faz |
|---|---|---|
| **Início** | Processo visual | As 7 etapas, do hunter ao closer, com dono, saída e indicador (tarefa 18). Mostra o que fazer hoje: toques de follow-up, propostas marcadas, diagnósticas paradas |
| **Apresentações** | Diagnóstica | Apoio curto para a reunião diagnóstica: combinado, quem somos, serviços, como trabalhamos, próximo passo |
| | Portfólio | Página para mandar no WhatsApp (abre no celular e sai em PDF), com mensagem pronta |
| | Proposta por serviço | Um modelo por serviço da Carta, na sequência fixa, com micro pactos clicáveis que gravam no lead. É a base da apresentação interativa da etapa I |
| **Playbooks** | Cold call | Roteiro top-down para o decisor, ganchos por serviço, recepção, tentativas e objeções da ligação. Ao marcar a diagnóstica, cria o lead |
| | Reunião diagnóstica | Roteiro e perguntas GPCTBA + C&I, roteador de serviços (o que o cliente fala → que serviço explorar), perguntas técnicas de cada serviço, fechamento com micro pacto e agenda da proposta. **Gera o briefing em PDF para Projetos** no formato do Briefing da planilha v4 |
| | Apresentação de proposta | Roteiro dos 12 passos com as dores do cliente, checklist dos 6 micro pactos, o que foi coletado na diag ao lado e o guia rápido de objeções. Registra como a reunião terminou |
| **Follow-up** | Cadência | Propostas apresentadas, com 7 toques em 15 dias úteis (D0, D1, D3, D5, D8, D12, D15), mensagem pronta, botão de WhatsApp e e-mail, e resultado (ganho, perdido com motivo, nutrição). Aceita propostas que já estão na rua |

## Como abrir

- **No computador:** abra `index.html` no Chrome ou no Edge. Não precisa instalar nada.
- **Hospedado:** qualquer hospedagem estática serve. **Não publicar no site público da MecTRIA:** o hub tem regras internas de preço e roteiros. Se for para a mesma conta Cloudflare do site, proteger com Cloudflare Access (só e-mails @mectria.com). O `index.html` já tem `noindex`.
- **O portfólio é a exceção:** ele é para o cliente e precisa ficar público (ex.: `mectria.com/portfolio`). Combinar com a frente Tela.

## Onde ficam os dados

No `localStorage` do navegador de cada vendedor (chave `hub-mectria:v1`). O menu **Dados** exporta e importa o backup (.json; a importação junta os leads, e no mesmo lead vale o mais recente) e gera o **CSV das propostas** no formato do Histórico ampliado (tarefa 34): data, valor, status, motivo da perda, pactos feitos, se usou a nova apresentação.

Limite desta versão: os dados não são compartilhados entre vendedores. O próximo passo é uma base compartilhada (ver "Próximos passos").

## Onde mexer no conteúdo

Todo o texto fica em `js/dados/`. Não precisa mexer nas telas para mudar conteúdo.

| Arquivo | Conteúdo |
|---|---|
| `empresa.js` | Propósito, assinatura, diferenciais, números, fluxo de 3 dias, regras de condição (desconto, parcelas, validade) |
| `servicos.js` | Os 12 serviços da Carta: pistas, dores, gancho, perguntas técnicas, o que entregamos e o que fica com o cliente, método, céu e inferno, âncora de valor |
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
js/telas/             uma tela por arquivo
js/hub.js             rotas, campos ligados ao lead, menu Dados
apresentacoes/        diagnóstica, portfólio e proposta (deck.js é o motor dos slides)
assets/               logo (principal e negativa) e símbolo, recortados do manual
```

Sem dependências nem build: HTML, CSS e JavaScript puro. A única coisa externa é a fonte Poppins (Google Fonts); sem internet, cai para a fonte do sistema.

## Próximos passos

1. **Validar o conteúdo com a MecTRIA:** objeções reais e motivos de perda com os closers (pedido 24), processo atual (25), Primal Branding (22), cliente ideal (23) e as políticas que respondem objeções (ART, revisões, sigilo, férias).
2. **Primeiro uso real:** colocar no follow-up as propostas que já estão na rua e usar o playbook na próxima diagnóstica.
3. **Base compartilhada:** levar os leads para uma base do time (planilha do Histórico, ou banco na mesma conta da hospedagem), com login pelo e-mail da MecTRIA.
4. **Etapa I (S6–S7):** a apresentação de proposta vira a versão interativa definitiva, com calculadora e o roteiro slide a slide.
