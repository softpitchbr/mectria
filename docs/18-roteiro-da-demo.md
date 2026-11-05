# Roteiro da demo do hub · terça, 10/11, às 18h30

Para o Lucas conduzir a reunião com a MecTRIA. São cerca de 40 minutos de demonstração e 10 de pedidos. O hub roda no computador dele, com dados de exemplo, um cargo em cada aba do navegador. Em cada parte, **Mostre** é o que fazer na tela e **Pergunte** é o que validar. As respostas vão para `07-decisoes-e-pendencias.md`, e os pedidos que faltarem, para `14-pedidos-a-mectria.md`.

## Antes da reunião (15 minutos antes)

1. **Recriar os dados de exemplo no dia.** As datas da semente são relativas a hoje, então rode no próprio dia 10/11. No PowerShell, dentro da pasta `hub`:

   ```powershell
   npm install
   npm run e2e:preparar
   npm run build
   ```

   O `npm install` só é preciso na primeira vez. O `e2e:preparar` apaga tudo e recria as pessoas e os clientes de exemplo. Rode de novo depois do ensaio, para começar a reunião do zero.

2. **Abrir uma janela do PowerShell para cada cargo**, todas na pasta `hub`, e deixar rodando:

   ```powershell
   npx wrangler pages dev dist --port 8788 --inspector-port 9230 --binding DEV_EMAIL=dir@mectria.com
   npx wrangler pages dev dist --port 8789 --inspector-port 9231 --binding DEV_EMAIL=clo@mectria.com
   npx wrangler pages dev dist --port 8790 --inspector-port 9232 --binding DEV_EMAIL=hun@mectria.com
   npx wrangler pages dev dist --port 8791 --inspector-port 9233 --binding DEV_EMAIL=pro@mectria.com
   ```

   As quatro usam o mesmo banco: o que um cargo faz aparece na hora para os outros.

3. **Abrir as quatro abas no navegador**, nesta ordem:

   | Aba | Endereço | Quem | Cargo |
   |---|---|---|---|
   | 1 | `localhost:8790` | Helena Hunter | hunter |
   | 2 | `localhost:8789` | Carlos Closer | closer |
   | 3 | `localhost:8791` | Paulo Projetos | Projetos |
   | 4 | `localhost:8788` | Diana Diretora | diretor |

4. **Os clientes de exemplo** que a demo usa:

   | Cliente | Onde aparece | Para mostrar |
   |---|---|---|
   | Caldeira Confirma | Hoje da Helena | Os FUPs de confirmação e o "Confirmada" |
   | Usina Faltosa | Hoje da Helena | O reagendamento de quem não compareceu |
   | Solda Hunter | Hoje da Helena | O hunter conduzindo a diagnóstica |
   | Caldeiraria Sul | Reuniões do Carlos e Briefings do Paulo e da Diana | A reunião de proposta em duas janelas e o briefing (com o botão da LGPD) |
   | Molde Atrasado | Apresentações do Carlos | O alerta de mais de 3 dias em construção |
   | Fundição Atrasada | Follow-up do Carlos | O follow-up atrasado (cadência antiga) |
   | Usinagem Pendente | Briefings do Paulo e Follow-up do Carlos | A dúvida técnica respondida por Projetos |
   | Forja Nutrida | Follow-up do Carlos, aba Reativação | A reativação com a mensagem pronta |
   | Bomba Ganha | Hoje da Diana | A venda do mês nos números |

5. **Se algo travar:** recarregue a aba. Se um passo já foi feito no ensaio, pare as quatro janelas (Ctrl+C), rode `npm run e2e:preparar` e suba de novo.

## 1. A ideia do hub (3 minutos)

**Mostre** a aba 4 (Diana), só a tela Hoje, para dar a visão geral.

**Fale:** o hub junta num lugar só a rotina de cada pessoa, os roteiros, o follow-up e os números. Não é um CRM: os leads continuam no CRM de vocês, e o hub cuida do que acontece da ligação até o fechamento.

**Pergunte:** a ideia faz sentido para o dia a dia de vocês (ponto V1 do PDF)?

## 2. O dia do hunter (10 minutos) · aba 1, Helena

**Mostre:**
1. **Hoje:** as conexões da semana, de 8, no lugar da meta antiga de ligações por dia.
2. **Rotinas:** a rotina em quatro blocos, na ordem do dia: leads em conversa, reagendamentos, cold call e confirmações, com o % do dia.
3. **Começar o bloco:**
   - o roteiro do cold call, com os desvios ("Me dá só 30 segundos?", conhece ou não o Movimento Empresa Júnior);
   - as teclas 1 a 4: não atendeu, atendeu, conexão e marcou;
   - aperte 3 e mostre o medidor da semana subir;
   - "Copiar cold message".
4. **Tecla 4 (marcou):** preencha um cliente qualquer, com Observações. Depois de marcar, aparece a mensagem para o Comercial & Projetos, perguntando se algum projetista pode no horário.
5. **Caldeira Confirma**, em "Diagnósticas que marquei":
   - FUP 1, que copia a mensagem pronta, e só depois o FUP 2;
   - "Confirmada", que copia o aviso do grupo.
6. **Usina Faltosa**, em "Reagendar quem não compareceu": "Reagendar", com a data e a hora.
7. **Solda Hunter:** "Iniciar" abre o painel da diagnóstica. Mostre uma pergunta, o N para anotar e a marcação "Técnico", que vira uma pendência para Projetos. Saia sem encerrar.

**Pergunte:**
- A meta de 8 conexões por semana está certa? A diagnóstica marcada conta como conexão?
- Os "leads em conversa" no CRM são o status "Contato estabelecido" mais o marcador "Retornar"?
- O texto do cold call e da cold message está bom? Enquanto não houver o número de clientes, pode ficar "como já fizemos em mais de 130 projetos", como no site?
- As duas mensagens (marcada e confirmada) vão mesmo para o Comercial & Projetos? A confirmada cita o projetista?
- A diagnóstica é normalmente hunter + projetista. O closer participa às vezes?

## 3. A proposta (10 minutos) · aba 2, Carlos

**Mostre:**
1. **Rotinas:** os quatro blocos do closer, na ordem: fechamento e negociação, Apresentação de Proposta (AP), construção de proposta e reativação. A tarefa de um bloco sem lead fica feita sozinha. A regra é "sempre pra direita".
2. **Apresentações:** Molde Atrasado aparece "Em construção há 4 dias", com o alerta "Passou de 3 dias". Abra "Preparar" na Caldeiraria Sul, preencha o valor e salve. A proposta passa de construção para pronta.
3. **Reuniões → Caldeiraria Sul → Iniciar → Abrir apresentação:**
   - a janela que o cliente vê fica ao lado do painel;
   - passe os slides pelas setas;
   - marque um pacto e quem decide na sala;
   - O abre as objeções.
4. **Fechamento:** no último slide, "Ir para o fechamento". Escolha "Vai decidir": a data da decisão já vem no D7, os 7 dias da jornada de parcerias. Encerre a reunião.

**Pergunte:**
- A ordem dos blocos e as orientações estão como o time trabalha?
- "Em construção" é a proposta sem valor preparado no hub? Os 3 dias valem em dias corridos?
- A fala da jornada de parcerias e o "sim ou não em até 7 dias" ficam assim?
- Existe um incentivo para fechar rápido? O Vinícius sugeriu um "micro pacto": o valor vale até o D7.

## 4. Projetos (3 minutos) · aba 3, Paulo

**Mostre:**
1. **Hoje:** as pendências abertas e os briefings novos (o da Caldeiraria Sul).
2. **Briefings → "Responder: Qual a vazão necessária no galpão?" (Usinagem Pendente):** escreva a resposta e envie. Depois, mostre o "Fechar".

**Pergunte:** quem de Projetos recebe os briefings e responde as dúvidas? O prazo de 1 dia útil para cada dúvida serve?

## 5. O follow-up (5 minutos) · aba 2, Carlos de novo

**Mostre:**
1. **Follow-up:**
   - a Caldeiraria Sul, recém-fechada, com os toques de 7 dias: D0, D1, ligação, sexta fixa e D7;
   - abra o toque e mostre a mensagem pronta.
2. **Usinagem Pendente:** o cartão mostra "Projetos respondeu: …", a resposta que o Paulo acabou de dar.
3. **Fundição Atrasada:** uma proposta antiga, atrasada, que continua com a cadência de antes.
4. **Aba Reativação → Forja Nutrida:**
   - a mensagem pronta, com "há mais ou menos 2 meses";
   - "Marcar reunião", "Ainda não" (escolhe o mês) e "Perdida".

**Pergunte:**
- Os textos dos FUPs de 7 dias ficam como estão?
- Sem um mês combinado, a reativação volta em 45 dias. Serve?

## 6. Os números do diretor (5 minutos) · aba 4, Diana

**Mostre:**
1. **Hoje:**
   - "Este mês": propostas, fechadas, conversão e o valor vendido (Bomba Ganha, R$ 9.000);
   - as conexões da semana de cada hunter;
   - a rotina do time, com o % de cada pessoa.
2. **Time → aba Mês:**
   - os números por closer, o % da rotina e as objeções do mês;
   - "Baixar o histórico do mês (CSV)".
3. **LGPD:** em Briefings, abra o da Caldeiraria Sul. "Apagar dados pessoais (LGPD)" mostra a confirmação. Clique em Cancelar.

**Pergunte:**
- Quem é o diretor comercial no hub?
- A conversão é ganhas ÷ (ganhas + perdidas) do mês?
- O valor vendido é o mesmo número do relatório mensal do contrato (Anexo IV da minuta v5)?
- O CSV pode seguir as colunas da planilha do Histórico de vocês? Peça a planilha (pedido 33).

## 7. O que ainda não está e o que precisamos (10 minutos)

**Ainda não está:**
- As apresentações em HTML interativo, uma por serviço. O Instrumento começa em 16/11, por Desenvolvimento de Produto e Desenho Técnico.
- O celular como controle da reunião.
- O hub publicado com os logins de cada pessoa.
- Os roteiros da diagnóstica e da proposta, que ainda são os modelos da versão 0.2.

**Precisamos para seguir** (seção 1 de `14-pedidos-a-mectria.md`):
- **Para publicar o hub:** o e-mail institucional dono das contas, o acesso ao DNS de mectria.com e a lista de quem terá login, com o cargo.
- **Para as apresentações:**
  - os números verificáveis: de onde vêm o 100% do site e o 70% abaixo do mercado;
  - os professores orientadores e quem assina a ART;
  - os cases com autorização;
  - a política comercial: parcelas, desconto à vista e desconto máximo.
- **Combinados:** as datas das validações (copy na quinta, 12/11) e se a reunião de terça às 18h30 passa a ser fixa.
