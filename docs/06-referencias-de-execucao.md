# Referências para a execução

O que já foi mostrado ou explicado e serve de base para as frentes T e I.

## T · Protótipo do site (mostrado na R2, 09:41–12:07)

Finalizado no dia da R2. Hospedado num servidor em **Washington**, que deve ir para **Guarulhos** por latência. Carregou devagar na call. O próprio Lucas avisou que "não necessariamente é o oficial", serve para mostrar até onde dá para chegar.

**Home, na ordem mostrada:**
1. Cursor responsivo que "ilumina" a foto do time ao fundo. O cursor com **fumaça** sai.
2. Cases da MecTRIA.
3. **Motor** animado, que acelera e "abre" sozinho. **Fica**: o Marcelo e o time gostaram.
4. "Sete frentes de engenharia, o mesmo rigor": os serviços.
5. Jornada do parceiro, interativa, "da entrada até a expedição".
6. Foto do time com propósito e storytelling.
7. Valores.
8. Blog (base para SEO).
9. Feed do Instagram clicável dentro do site.
10. Vídeo da MecTRIA.
11. Processo seletivo.
12. Formulário de diagnóstico.
13. Depois: chatbot, newsletter.

**Feedback:** tirar a fumaça, deixar a home mais limpa, manter o motor. A interação ajuda a conversão porque as pessoas brincam no site e compartilham (alunos da UFTM inclusive), o que ajuda o orgânico.

**Palavras-chave de SEO local citadas:** consultoria em Uberaba, engenharia mecânica em Uberaba, projetista em Uberaba. Busca menos disputada, para pegar demanda represada (R1 47:06).

**Exemplo de sitemap mostrado (o da Triângulo):** uma página por termo + cidade ("sistemas personalizados Uberaba", "automação de processos Uberaba", "software de gestão Uberaba"). O da MecTRIA hoje só tem blog-post, blog-category e page.

## I · Como a apresentação de proposta deve funcionar (R1 25:26–31:37 e R2)

### Princípio
Processo é **intencionalidade em tudo o que se apresenta**. A estrutura é fixa e só varia o mínimo: marca do cliente, dores coletadas, preço, prazo e time. "A máquina do cara é diferente, o serviço é o mesmo." O gatilho central é a **coerência** (Cialdini): micro pactos que o cliente vai confirmando, muitas vezes sem perceber, até o fechamento ser só a consequência lógica.

### Sequência fixa (como o Lucas usa e como deve ficar para a MecTRIA)
1. **Propósito / lado social**, para diferenciar. Para a MecTRIA, algo como "fomentar o empreendedorismo local por meio de soluções de engenharia" (lema do MEJ, a validar com a MecTRIA).
2. **Histórico em números**: números reais e verificáveis.
3. **Time**: humanizar, conectar o cliente com quem está por trás.
4. **Duas jornadas ("céu e inferno")**: a jornada no **mercado sênior** e a jornada **com a MecTRIA (MEJ)**. Aqui entram as variáveis do cliente: os problemas dele e o "depois" com a MecTRIA.
5. **O projeto / método**: escopo, etapas e métricas, com interação (o cursor guia a atenção).
6. **Micro pacto 1: "Ficou alguma dúvida sobre o projeto?"** Se houver, volta ao método. Se não, check e segue.
7. **Micro pacto 2: "Tirando o preço da mesa, você seria nosso cliente?"** Se sim, o projeto está aceito e só falta acertar o preço. ("Seria cliente porque é de graça ou porque o projeto é bom?")
8. **Valor × preço**: quanto isso vale no mercado sênior e quanto custa na MecTRIA (melhor custo-benefício). Serve também para downsell.
9. **Hall da fama / provas sociais**, depois mais provas sociais.
10. **Calculadora com o preço**: ROI do cliente na tela.

Sempre na mesma ordem, com os mesmos micro pactos e as mesmas analogias (ex.: Peter Drucker, "o que não se mede não se gerencia"). Objetivo: **fechar na call ou no mesmo dia**.

### Formatos
- **Web interativa e responsiva**, para prender a atenção ("chiclete aos olhos").
- **PDF** para visita presencial ou uso offline.
- **Roteiro do vendedor slide a slide**: "primeiro aprende a ler o script, depois desenvolve o próprio". Serve também de playbook para quem não fez o treinamento.

## Deck de referência: `referencias/apresentacao-institucional-triangulo.html`

Apresentação institucional interativa da própria Triângulo. É o **modelo técnico** para a apresentação web da MecTRIA (tarefa 26). O conteúdo é de outro cliente (CRM "Jornada Comercial", planos de R$ 5.500 e R$ 2.500) e **não** deve ser reaproveitado.

O que dá para reaproveitar:
- Um único arquivo HTML, com o conteúdo num objeto `CONFIG` no topo do script. O que muda entre reuniões fica num lugar só.
- `?para=Nome` personaliza a capa e o rodapé com o nome do cliente.
- **Micro pactos clicáveis** no rodapé dos slides, com resumo "Até aqui concordamos em X de Y" no slide de investimento.
- **Dores clicáveis** ("isso acontece aí?"), que revelam causa e solução, com contador.
- Slide de pergunta em vermelho ("Tirando o preço da mesa...").
- **Preço travado e borrado**, revelado em etapas: plano 1, depois a condição de parceria, com contagem animada e economia calculada. Volta a travar se o vendedor sair do slide antes de revelar tudo.
- Navegação por teclado (setas, `S` marca o pacto do slide, `F` tela cheia), índice, swipe, URL com `#slide`.
- No celular vira rolagem vertical. Tem CSS de impressão (`@page 1600×900`), que serve para gerar o PDF.
- Tema escuro com o vermelho da Triângulo e fonte Poppins. Para a MecTRIA, trocar pela identidade visual dela.
