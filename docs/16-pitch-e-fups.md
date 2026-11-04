# Pitch de parceria e FUPs de 7 dias

Rascunho de 04/11/2026, para a call com a MecTRIA na semana de 09/11. O pitch de parceria é o eixo: a apresentação de proposta, o fechamento e os FUPs giram em torno dele. Quando for validado, a cadência abaixo substitui a de 15 dias da versão 0.2 (que hoje está no hub só como estrutura).

## 1. Pitch de parceria

**Situação:** aguardando o material do Lucas sobre a parceria.

**Onde entra na proposta.** Depois do valor × preço (quanto o projeto vale no mercado sênior) vem o investimento: primeiro o preço de tabela, depois a condição de parceria, válida por 7 dias. É a mesma revelação em etapas do deck de referência (`06-referencias-de-execucao.md`).

**O que o pitch precisa explicar:**

1. O que é o Movimento Empresa Júnior e o lugar da MecTRIA nele.
2. Por que a condição de uma empresa júnior é mais flexível: sem fins lucrativos, a receita volta para a formação dos membros, e os projetos têm orientação de professores da UFTM.
3. O que é a condição de parceria, ou seja, o que o cliente ganha.
4. O que a parceria pede do cliente: a decisão em 7 dias e, se houver, uma contrapartida (case, depoimento, indicação).
5. Por que 7 dias: os projetos de parceria começam em ciclos, toda segunda-feira, com as equipes alocadas no fim de semana.

## 2. FUPs de 7 dias

### Regras

- A janela é de 7 dias corridos a partir da reunião (D0). No D7, a condição de parceria vence.
- Os toques só saem em dia útil.
- Toda janela de 7 dias passa por uma sexta-feira, e nela sai o **FUP fixo de sexta**. Se a sexta cai num dia que já teria toque, a mensagem de sexta fica no lugar dele. Se a reunião foi numa sexta, a sexta seguinte é o próprio D7, e as duas mensagens viram uma só.
- A ligação fica no meio da janela, num dia sem outro toque e fora da sexta.
- Sem resposta depois do D7, a proposta é registrada como perdida (com o motivo) ou vai para nutrição.

### Quando cai cada toque

| Reunião na | D0 | D1 | Ligação | Sexta fixa | D7 |
|---|---|---|---|---|---|
| Segunda | seg | ter | qua | sex | seg seguinte |
| Terça | ter | qua | qui | sex | ter seguinte |
| Quarta | qua | qui | seg | sex | qua seguinte |
| Quinta | qui | (a sexta fica no lugar) | ter | sex | qui seguinte |
| Sexta | sex | seg | qua | (é o próprio D7) | sex seguinte |

### As mensagens

As chaves entre `{}` o hub preenche sozinho: `{contato}`, `{servico}`, `{dor}` (com as palavras do cliente na diagnóstica), `{decisores}`, `{data_decisao}` (o D7) e `{vendedor}`.

**D0 · WhatsApp e e-mail, no mesmo dia.** Registrar o combinado e a data da resposta.

> Fala, {contato}, tudo bem? Obrigado pela reunião de hoje!
>
> Como combinamos, segue a proposta do projeto de {servico}, pensado para resolver o que você me contou: {dor}.
>
> A condição de parceria vale até {data_decisao}. Qualquer dúvida até lá, me chama por aqui.
>
> {vendedor}, da MecTRIA

**D1 · WhatsApp.** Destravar a dúvida que aparece depois e trazer quem decide.

> Fala, {contato}! Às vezes a dúvida aparece depois da reunião, quando vocês conversam internamente. Surgiu alguma pergunta sobre o projeto? Se ajudar, explico em 15 minutos para {decisores}.

**Ligação · no meio da janela.** Perguntar direto o que falta.

> {contato}, é o {vendedor}, da MecTRIA. Quero ser direto para não tomar seu tempo: o que falta para vocês decidirem? É sobre o projeto, o investimento ou o momento?

Se não atender, no WhatsApp:

> Tentei te ligar agora há pouco. Consegue 5 minutos hoje ou amanhã?

**Sexta fixa · WhatsApp.** Usar o ciclo de segunda para pedir o próximo passo.

> Fala, {contato}, tudo bem? Senti uma sinergia bacana na nossa reunião e por isso vim te mandar essa mensagem.
>
> Pensando na organização das equipes de projetos: toda segunda-feira começa um ciclo de novos projetos de parceria, e neste fim de semana vou me reunir com o time de Projetos para deixar as equipes pré-alocadas.
>
> Então queria entender: o que ainda precisamos alinhar para avançarmos?

**D7 · WhatsApp.** Fechar a janela sem pressão.

> Fala, {contato}, tudo bem? Hoje é o último dia da condição de parceria que conversamos. Se fizer sentido seguir, me dá um ok por aqui que eu já coloco vocês no próximo ciclo de projetos. Se agora não for o momento, sem problema: me avisa e eu deixo vocês tranquilos.

**Sexta que também é o D7** (reunião numa sexta):

> Fala, {contato}, tudo bem? Hoje fecha a condição de parceria que conversamos, e na segunda começa o próximo ciclo de projetos. Vou me reunir com o time de Projetos neste fim de semana para pré-alocar as equipes. O que ainda precisamos alinhar para vocês entrarem nesse ciclo?

## 3. Em aberto

| # | Pergunta | Quem responde |
|---|---|---|
| 1 | Os detalhes da parceria: o que o cliente ganha e o que ela pede dele | Lucas (material a caminho) |
| 2 | A condição vence em 7 dias corridos? A política comercial fala em fechar em até 5 dias úteis (pedido 27) | Lucas e Marcelo |
| 3 | O ciclo de projetos que começa toda segunda e a pré-alocação no fim de semana já existem na MecTRIA? A sexta fixa só funciona se isso for verdade. Quem é o "time de Projetos" que se reúne? | MecTRIA, na call |
| 4 | O D0 vai por WhatsApp e por e-mail, ou só por WhatsApp? | MecTRIA |
| 5 | Depois do D7 sem resposta: nutrição com retorno em 45 dias, como hoje, ou outro prazo? | Lucas e Marcelo |

## 4. No hub

Depois da validação, a cadência vira os novos dados de `hub/compartilhado/dados/cadencia.ts`, e a regra da sexta fixa entra no cálculo das datas (`hub/compartilhado/cadencia.ts`), com testes. O fechamento da proposta no hub já cria os toques sozinho; ele só passa a usar a janela de 7 dias.
