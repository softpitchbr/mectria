# Diagnóstico da MecTRIA

O que se sabe da MecTRIA pelas reuniões 1 e 2. Os minutos entre parênteses apontam para as transcrições: **R1** é `reuniao-1-diagnostico.txt` e **R2** é `reuniao-2-apresentacao-proposta.txt`.

## Números do comercial

| Dado | Valor | Fonte |
|---|---|---|
| Propostas apresentadas por mês | 10 a 15 (usado: **12**) | R2 23:58 |
| Taxa de fechamento atual | "Agora tá zero" | R2 24:12 |
| Taxa histórica | 3 a 4 em cada 8 ("1 a cada 4" foi o número usado: **25%**) | R2 24:22 |
| Taxa citada no diagnóstico | ~3 em cada 10 propostas | R1 02:39 |
| Ticket médio | Maioria entre R$ 2.000 e R$ 4.000 (usado: **R$ 2.700**, sem outliers) | R2 25:02, 26:35 |
| Outliers | R$ 500 (Dois E-Tech, fechado agora) e um projeto de R$ 45 mil em negociação | R2 26:14 |
| Carro-chefe | Desenvolvimento de produtos (caro) | R2 26:18 |
| Perda de ligação até o decisor | 80% a 88% | R1 13:17 |
| Origem dos projetos fechados | **Todos** vieram da prospecção passiva (inbound) | R1 13:17 |
| Meta do projeto | 40% de conversão proposta → fechamento | R2 26:48 |
| Faturamento 2025 | ~R$ 60.000 (≈ R$ 5.000/mês) | Marcelo, WhatsApp 07/10/2026 |
| Faturamento 2026 (jan. a out.) | R$ 40.800: R$ 38.600 no portal da Brasil Júnior + R$ 2.200 da Uniube sem contrato (≈ R$ 4.080/mês) | Marcelo, WhatsApp 07/10/2026 |

**Atenção:** a meta parte de 25% (histórico), mas o número do momento é ~0%. A linha de base usada para medir "resultado" precisa estar no contrato (ver `07-decisoes-e-pendencias.md`).

## As seis frases que motivaram o projeto (R2 06:10)

1. "De cada dez propostas, a gente fecha umas três."
2. "O cliente só ficou quieto na hora de decidir."
3. "A apresentação é até razoável, mas é tipo um copia e cola." (no Canva)
4. "O site está desatualizado, ninguém aqui sabe mexer."
5. "O treinamento foi caro e não virou venda."
6. "Nossa entrega é de altíssimo nível e os clientes voltam."

## Antes e depois (como a proposta foi vendida)

| Antes | Depois |
|---|---|
| Cada reunião depende do ânimo do vendedor naquela semana (prova, trabalho) | Mesma estrutura em toda reunião, com micro pactos e provas |
| A apresentação muda de ordem conforme quem explica | Só muda o mínimo: logo do cliente, dores coletadas, preço, prazo, time |
| O cliente fica em silêncio na hora de decidir | Membro novo apresenta no mesmo nível em poucas semanas |
| Quando o melhor vendedor sai, o repertório vai junto | Processo padronizado e roteiro escrito |
| Treinamento ensina, mas ninguém acompanha a aplicação | Taxa de fechamento medida proposta a proposta |
| Cliente só descobre a qualidade depois de comprar | A qualidade da engenharia aparece **antes** do preço |

## Estrutura e contexto da EJ

- **Comercial** reestruturado no início do ano no modelo da Projep (Receita Previsível): Casa de Dados, Hunters (BDR) e Closers. O plano original foi criado pelo Lucas na Projep. (R1 03:11, R2 03:53)
- **Casa de Dados** (com o Marcelo): filtragem de leads pela API da Casa dos Dados, por região e CNAE, com score por IA que gera hipótese de dor, decisor e telefone. Terminado na semana da R1, o comercial ainda ia testar. A ideia é ligar direto para o decisor (top-down) e evitar o gatekeeper. (R1 14:12–15:24)
- **Marketing** reestruturado pelo Marcelo: antes cada pessoa cuidava de uma rede. Agora tem estruturador, editor de vídeo, responsáveis por conteúdo e um diretor de indicadores. Vai ter gestor de tráfego pago no futuro. João Guilherme cuida do meio de funil. (R1 49:25)
- Recuperaram um benefício do Google ("AdSense", provavelmente **Google Ad Grants**, confirmar) que a gestão passada tinha perdido. (R1 00:00)
- **Site**: Wix Premium, pago pela MecTRIA. Bonito (abas, provas sociais, serviços, formulário), mas o sitemap só tem `blog-post`, `blog-category` e `page`, sem palavras-chave locais. Chatbot com bug. (R1 00:32, 05:18–07:10)
- **Documentos internos** (POP etc.) estão organizados e funcionam. O problema não está aí. (R1 01:06)
- **Treinamento comercial** anterior: caro, quase 1 mês, de ponta a ponta (do cold call ao follow-up). Ajudou a organizar e visualizar o funil, mas não gerou vendas por prospecção ativa. Deixou a sensação de "testamos e não funciona". (R1 19:06–21:57)
- **Financeiro**: subiram do cluster 3 para o 4 (Brasil Júnior), mas duas gestões seguidas não acumularam caixa. O comercial vem de um investimento que ainda não deu retorno. (R1 48:41, 50:02)
- **Recompra**: o maior cliente já está no 4º ou 5º projeto e paga no Pix. Os clientes voltam pela qualidade. (R1 43:40–44:20)
- **Gestão**: troca de diretoria no fim do ano. O Marcelo concorre à presidência e quer deixar tudo alinhado. Pediu ajuda para convencer também a próxima diretoria. (R1 48:34, R2 30:18)
- **Pessoas**: muita gente sai no fim do ano, mas os trainees novos repõem o nível em poucas semanas, segundo o Marcelo. (R2 29:56)
- Já tentaram ligar para clientes antigos oferecendo desconto para bater meta. Não funcionou. (R1 43:19)

## O que o Marcelo quer (palavras dele)

- "Melhorar a conversão não só em números, mas também em porcentagem." (R1 02:24)
- "Destravar a prospecção ativa. Quero que eles funcionem em um sistema de engrenagem." (R1 12:27)
- Não quer que o vendedor **dependa menos**: quer que ele tenha **mais repertório e uma estrutura melhor** para performar. (R1 16:31)
- **Indicadores** para comercial e marketing: depois do levantamento inicial, ninguém coletou dados de novo e não dá para saber se o que foi implantado funciona. (R1 52:20) A chamada caiu antes da resposta.

## O que o time comercial sente

- Vinícius Miguel: a apresentação é "razoável": visual, organização e estrutura fracos. Na primeira reunião de proposta de que participou, o cliente ficou em silêncio no ponto de pausa, mesmo com as dores levantadas. (R1 07:41–17:46)
- João Guilherme: repertório é o ponto fraco. O cliente fica quieto mesmo com cases e know-how. (R1 18:00)

## Discussão sobre redes sociais (fora do escopo, mas registrada)

- Marcelo: falta conteúdo para cada etapa do funil, formatos validados e ganchos. A atração é fraca e a consolidação (meio de funil) não existe. (R1 01:41, 32:26)
- Lucas (ocasião de consumo, Kotler): a MecTRIA atende **necessidade**, não entretenimento. A energia de inbound deve ir para o **Google**. O Instagram serve para retenção, indicação e munição do vendedor (transformar negociações reais em posts para o vendedor mandar ao lead). Também ajuda a atrair universitários para a EJ. (R1 33:55–38:46)
- Vinicius Nicoletti: o Instagram funciona para reter atenção no curto prazo e para lançamentos ligados aos ciclos e eventos do MEJ, inclusive com tráfego pago. (R1 39:02–43:03)
- Isso não entra no projeto (gestão de redes e tráfego estão fora), mas pode virar proposta futura.
