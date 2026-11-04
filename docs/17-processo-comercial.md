# Processo comercial da MecTRIA

Rascunho de 04/11/2026, a partir do que o Lucas descreveu. É o "processo visual hunter → closer" da Retórica (tarefa 18 do `03-plano-erp.md`): um fluxo de rotina, no estilo BPMN, que o hub transforma no dia de cada pessoa. A divisão entre hunter e closer vem do livro *Receita Previsível*, adaptada ao jeito de uma empresa júnior.

Partes prontas: o dia do hunter, o roteiro de cold call (com um rascunho de cold message) e a confirmação da diagnóstica. Faltam a diagnóstica (quem conduz), o processo do closer na proposta e as objeções.

## 1. O dia do hunter

```mermaid
flowchart TD
    A[Abre Rotinas no hub] --> B[Leads 'Em contato' no CRM]
    B --> C[Reagendar quem não compareceu]
    C --> D[Bloco de cold call]
    D --> E{Falou com quem decide?}
    E -- não --> D
    E -- sim, é conexão --> F{Aceitou a reunião?}
    F -- não --> D
    F -- sim --> G[Marca a diagnóstica no hub, com as observações]
    G --> H[Confirmação: FUP 1, 2 e 3 no dia da reunião]
    H --> I{Confirmou?}
    I -- sim --> J[Avisa no grupo do comercial: confirmada com o closer]
    I -- não compareceu --> C
```

1. **Abre a aba Rotinas.** O dia começa pelo checklist do hub.
2. **Leads "Em contato".** Primeiro, os leads que já estão em conversa no CRM da MecTRIA. O nome exato da etiqueta é a confirmar.
3. **Reagendamentos.** Depois, quem não compareceu à diagnóstica (no-show), para marcar de novo.
4. **Cold call.** Só então as ligações novas.
   - O que conta é a **conexão**: a ligação em que o hunter fala com quem decide.
   - O foco da ligação é **despertar a curiosidade** para o lead aceitar a reunião, não explicar o serviço.
   - O script de cold call e o de cold message ainda vão ser escritos.
5. **Marca a diagnóstica.** Registra no hub, com as observações importantes da ligação ou do WhatsApp.
6. **Confirma a reunião** com as três mensagens da seção 3.
7. **Avisa o time.** Com a confirmação do lead, informa no grupo do comercial que a reunião está confirmada com o closer.

## 2. Cold call

O objetivo da ligação é um só: marcar 30 minutos para a diagnóstica. A ligação não explica o serviço; ela desperta a curiosidade pela jornada de parcerias. As chaves entre `{}` vêm do lead: `{contato}`, `{segmento}` (pelo CNAE da Casa de Dados) e `{hunter}`.

**1. Abertura: pedir um minuto.**

> Fala, {contato}, tudo bem? Aqui é o {hunter}, da MecTRIA. Estou te ligando porque queria dividir com você, em um minutinho, uma jornada de parcerias que estamos abrindo com empresas de {segmento}. Você tem esse minutinho para eu te contar a ideia?

Se não tiver o minuto, pedir 30 segundos:

> Te entendo. Me dá só 30 segundos? Se não fizer sentido, eu te deixo tranquilo.

**2. Quem é a MecTRIA, com uma pergunta.**

> Bacana, {contato}, que bom que você topou. A MecTRIA é uma empresa do Movimento Empresa Júnior, o que significa que a gente não recebe para tocar os nossos projetos. Inclusive, você já ouviu falar do Movimento Empresa Júnior?

**3a. Se não conhece:**

> Legal. O Movimento Empresa Júnior é uma extensão da universidade. Com a orientação de professores, os graduandos aplicam o que aprendem em projetos reais, como já fizemos com {nº de clientes} clientes.

**3b. Se já conhece:**

> Que bom! Então você sabe que são projetos reais, feitos por graduandos com a orientação de professores. Já fizemos isso com {nº de clientes} clientes.

**4. A ponte para a reunião.**

> A ideia é a gente ter uma primeira reunião para entender qual é a maior prioridade de vocês hoje e se existe sinergia para a nossa jornada de parcerias. Na reunião eu te explico melhor como ela funciona, mas já te adianto: pelo que vocês fazem em {segmento}, temos viabilidade e capacidade produtiva para desenhar um projeto juntos que fique bom para os dois lados.

**5. O pedido.**

> O primeiro passo seria reservar 30 minutinhos da sua semana para entender, na prática, se existe sinergia para um projeto juntos ou não.

Sugestão: fechar com duas opções de horário, para a resposta ser uma escolha e não um sim ou não. Por exemplo, "Fica melhor terça às 10h ou quinta às 15h?".

### Cold message (rascunho, a partir do roteiro)

Para o WhatsApp, quando a ligação não completa ou como primeiro contato.

> Oi, {contato}, tudo bem? Aqui é o {hunter}, da MecTRIA. Estamos abrindo uma jornada de parcerias com empresas de {segmento} e queria dividir a ideia com você. Somos uma empresa do Movimento Empresa Júnior: projetos reais de engenharia, feitos por graduandos da UFTM com orientação de professores. Topa reservar 30 minutos esta semana para ver se existe sinergia para um projeto juntos?

## 3. Confirmação da diagnóstica

Três mensagens pelo WhatsApp, no dia da reunião. Só sai a seguinte se a anterior ficou sem resposta.

**FUP 1 · Ao começar o dia da reunião.**

> Opa! Tudo bem? Sou o {hunter}, da MecTRIA. Muito prazer! Estou passando para confirmar nossa reunião agendada para {data}, às {hora}. Achei importante confirmar antes porque a agenda está bem movimentada, com algumas reuniões em sequência, então é importante pegar contigo essa confirmação para aproveitarmos a agenda. Tudo confirmado?

**FUP 2 · 2 horas antes, se não respondeu.**

> Oi! Acabei não pegando essa confirmação contigo, está tudo certo?

**FUP 3 · 30 minutos antes, se ainda não respondeu.**

> Está por aí? 🙏

**Quando o lead confirma**, o hunter avisa no grupo do comercial:

> Reunião confirmada: {empresa} ({contato}), {data} às {hora}, {formato}, com {closer}.

## 4. A diagnóstica

**Quem conduz (a confirmar com a MecTRIA).** Parece ser flexível: já houve diagnóstica conduzida pelo hunter junto com o closer. As combinações possíveis são hunter + projetista, closer + projetista, ou hunter + closer.

## 5. A proposta

Aqui começa o processo do closer. Próximo tema a descrever.

## 6. O que isso muda no hub

| O que muda | Onde | Hoje |
|---|---|---|
| A rotina do hunter segue a ordem do fluxo: leads "Em contato", reagendamentos, bloco de cold call e confirmações do dia | Rotinas | Bloco de ligações, WhatsApp e registro das diagnósticas |
| As ligações contam a **conexão** (falou com quem decide) separada de "atendeu" | Bloco de ligações | Não atendeu, atendeu e marcou |
| A diagnóstica marcada ganha o campo **Observações** | Marcar diagnóstica | Não tem |
| O roteiro do bloco de ligações passa a ser o da seção 2, com os desvios (30 segundos; conhece ou não o MEJ) e a cold message pronta para copiar | Bloco de ligações | Roteiro da versão 0.2 |
| Os 3 FUPs de confirmação aparecem como botões no dia da reunião, cada um na sua hora, com a mensagem pronta. "Confirmada" gera a mensagem do grupo | Hoje do hunter | Não tem |
| O fim da diagnóstica ganha "Cliente não compareceu", que volta a oportunidade para o hunter reagendar | Fechamento da diagnóstica | Só proposta marcada ou não qualificou |
| Se a diagnóstica puder ser conduzida pelo hunter, ele passa a poder abrir o painel | Permissões | Só o closer dono ou o diretor |

## 7. Em aberto

| # | Pergunta | Quem responde |
|---|---|---|
| 1 | O nome da etiqueta dos leads em conversa no CRM ("Em contato"?) | MecTRIA |
| 2 | Quem conduz a diagnóstica: hunter, closer, projetista, ou varia? | MecTRIA, na call |
| 3 | Qual é a meta do hunter: ligações ou conexões por dia? | Lucas e Marcelo |
| 4 | Em que grupo o hunter avisa a confirmação, e se o hub deve só gerar o texto para copiar | MecTRIA |
| 5 | Quantos clientes a MecTRIA já atendeu, para o {nº de clientes} do cold call (pedido 17) | MecTRIA |
| 6 | Os professores orientadores são todos doutores? O roteiro diz só "professores" até confirmar (pedido 18) | MecTRIA |
