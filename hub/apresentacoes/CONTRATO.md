# Apresentações em HTML: o contrato com o hub

Cada serviço pode ter a sua apresentação de proposta em HTML. O diretor envia o arquivo em **Serviços → o serviço → Apresentação de proposta**. Na reunião, a janela que o cliente vê abre esse HTML, e o painel do vendedor continua mandando: passa os slides, mostra a fala e aciona o que é interativo.

Este documento é para quem desenha as apresentações. O modelo pronto é o [`exemplo.html`](exemplo.html): os 13 slides da apresentação de exemplo, com dores clicáveis, preço revelado em 3 etapas e uma calculadora. Comece copiando ele.

## 1. O arquivo

- **Um arquivo `.html` só, de até 5 MB.** CSS, JavaScript, imagens e vídeos ficam dentro dele (imagens e vídeos em `data:`).
- **Fontes:** podem vir do Google Fonts (`fonts.googleapis.com` e `fonts.gstatic.com`) ou ficar em `data:`.
- **Sem internet:** a apresentação não consegue chamar nenhum endereço (`fetch`, `XMLHttpRequest` e `WebSocket` são bloqueados), nem carregar script ou imagem de fora.
- **Sem acesso ao hub:** ela roda isolada, sem o login de quem abriu. Não lê dados do hub, só o que o painel manda, e a API do hub não abre dentro dela.
- **Não navegue para outra página** (`location.href`, `window.open`, links para fora): o navegador não impede a apresentação de trocar a própria página, e os dados do cliente poderiam ir junto. Revise o HTML que vier de fora da MecTRIA antes de enviar.
- **Tamanho do slide:** desenhe em 1280 × 720 e escale para caber na janela, como o exemplo faz.

## 2. Como a reunião usa a apresentação

1. O vendedor abre a janela da apresentação pelo painel. A janela carrega o HTML.
2. A apresentação avisa que está pronta (`pronta`), com o número de slides, as ações e os campos.
3. O hub responde com o `estado`: o slide atual, os dados do cliente e o que já aconteceu na reunião.
4. A cada troca de slide no painel, o hub manda `slide`.
5. Quando o cliente clica numa dor, o preço é revelado ou um número da calculadora muda, a apresentação manda um `evento`. O painel mostra e guarda.
6. O vendedor também pode acionar tudo pelo painel: o hub manda `acionar` (um botão) ou `calcular` (os números).

**O roteiro manda no painel.** O número de slides, o título, a fala, a dica, o pacto e o tempo de cada slide vêm do roteiro do serviço (Serviços → Roteiro por slide). A apresentação precisa ter o mesmo número de slides do roteiro. Se não tiver, o painel avisa o vendedor (a janela do cliente nunca mostra aviso).

## 3. As mensagens

Todas vão por `postMessage` e têm `mectria: 1`.

### Do hub para a apresentação

| Mensagem | Quando | O que fazer |
|---|---|---|
| `{ mectria: 1, tipo: "estado", slide, dados, interacoes }` | Logo depois da `pronta`, e quando a janela reabre | Preencher os textos com `dados`, voltar o que já aconteceu (`interacoes`) e mostrar o `slide` |
| `{ mectria: 1, tipo: "slide", slide }` | O vendedor passou o slide | Mostrar o slide (o primeiro é 0) |
| `{ mectria: 1, tipo: "acionar", acao }` | O vendedor apertou uma ação no painel | Fazer a ação, como se o cliente tivesse clicado, e mandar o `evento` |
| `{ mectria: 1, tipo: "calcular", valores }` | O vendedor digitou um número no painel | Trocar os números da calculadora e mandar o `evento` |

`interacoes` é `{ dores: string[], precoEtapa: number, calculadora: { [campo]: number } }`.

### Da apresentação para o hub

| Mensagem | Quando |
|---|---|
| `{ mectria: 1, tipo: "pronta", slides, acoes, campos }` | Uma vez, assim que a página carrega |
| `{ mectria: 1, tipo: "evento", evento: "dor", valor, marcada }` | Uma dor foi marcada (`marcada: true`) ou desmarcada. `valor` é o texto da dor |
| `{ mectria: 1, tipo: "evento", evento: "preco", etapa }` | O preço foi revelado até a etapa `etapa` (1, 2, 3...) |
| `{ mectria: 1, tipo: "evento", evento: "calculadora", valores }` | Os números da calculadora mudaram |
| `{ mectria: 1, tipo: "tecla", tecla: "ArrowRight" }` ou `"ArrowLeft"` | Alguém apertou a seta dentro da apresentação |

`acoes` e `campos` são listas de `{ slide, id, rotulo }`:

- **ação:** vira um botão no painel, no slide indicado (ex.: `{ slide: 11, id: "revelar-preco", rotulo: "Revelar o preço" }`);
- **campo:** vira um campo numérico no painel (ex.: `{ slide: 11, id: "horas-paradas", rotulo: "Horas paradas por mês" }`).

## 4. Os dados do cliente

`dados` traz textos prontos para usar. O que ainda não foi preenchido não vem; mostre `[rótulo]` no lugar, como o exemplo.

| Chave | O que é |
|---|---|
| `empresa`, `contato` | A empresa e o primeiro nome do contato |
| `servico` | O nome do serviço |
| `data` | A data da reunião |
| `anos` | Os anos de MecTRIA |
| `entregamos`, `fica` | O escopo e o que fica com o cliente, numa frase |
| `prazoProjeto`, `equipe` | O prazo e o time do projeto |
| `valor` | O valor, já formatado (R$ 24.000,00) |
| `valorCentavos` | O mesmo valor, em centavos (2400000), para fazer contas |
| `parcelas`, `descontoAVista` | As condições de pagamento |
| `ancora`, `fraseValor` | Quem faria o projeto no mercado e a frase de valor da MecTRIA |
| `doresDoServico` | As dores cadastradas no serviço, uma por linha |
| `dor`, `objetivo`, `impacto`, `prazo`, `ganho`, `tentativas`, `porqueAgora`, `criterio`, `numeros`, `prazoDecisao` | As palavras do cliente na diagnóstica |

## 5. Regras

- **Aceite mensagens só da janela da reunião:** `if (e.source !== window.parent) return;`.
- **Mande para o hub com** `window.parent.postMessage(mensagem, "*")`.
- **Não troque de slide sozinha.** Uma seta ou um botão de "próximo" dentro da apresentação manda `tecla`, e o hub decide.
- **Slide que não existe:** fique no último.
- **Limites** (o hub ignora o que passar deles):
  - até 60 slides, 60 ações e 20 campos;
  - ids com letras minúsculas, números e hífen, até 40 caracteres; rótulos até 60;
  - texto da dor até 200 caracteres; até 20 dores marcadas;
  - etapa do preço de 0 a 10;
  - até 20 números na calculadora, cada um com valor absoluto até 1 trilhão.

## 6. Como testar

Envie o arquivo em Serviços e clique em **Ver a apresentação**. A vista mostra a apresentação com dados de exemplo, os botões das ações, os campos da calculadora e tudo o que ela mandar para o hub. Ela também avisa se o número de slides é diferente do roteiro.

## 7. Usando o kit

As apresentações da MecTRIA saem de uma base comum, em `hub/apresentacoes/fonte/`:

- `kit.css`: o visual do site (fundo escuro, vermelho de destaque, títulos grandes, rótulos em mono), o slide de 1280 × 720 e o desenho técnico que se desenha (`.desenho`, com `pathLength="1"` nas linhas);
- `kit.js`: o contrato, a escala, as setas, o rodapé "01 / 13" e os textos com `{chave}`.

Cada apresentação é um arquivo em `fonte/` com `<!-- kit:css -->` no `<head>`, os slides (`<section class="slide" data-slide="id">`), `<!-- kit:js -->` e, no fim, `Apresentacao.iniciar({ acoes, campos, aoEstado, aoAcionar, aoCalcular, aoSlide })`. Dentro dos slides:

- `data-modelo="Proposta para {empresa}"` preenche o texto com os dados (o que falta vira `[rótulo]`);
- `data-se="condicoes"` só aparece quando a chave tem valor; `data-senao="condicoes"`, só quando não tem;
- `Apresentacao.enviar({ evento: "dor", valor, marcada })` manda um evento ao hub.

Depois de mudar uma fonte ou o kit, monte:

```bash
npm run apresentacoes
```

Isso grava `hub/apresentacoes/<nome>.html`, com tudo dentro: é o arquivo que o diretor envia. O teste do kit falha se uma apresentação montada ficar desatualizada.
