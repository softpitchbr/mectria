# Decisões e pendências

Atualizar este arquivo sempre que algo for decidido ou resolvido.

## Decisões já tomadas

| Decisão | Origem |
|---|---|
| O site é a primeira macroetapa | Escopo PDF, por definição da MecTRIA |
| Home mais limpa, sem o cursor de fumaça, mantendo o motor | R2 11:10–11:48 (Lucas e Marcelo) |
| Sem identidade visual nova: Primal Branding sobre a identidade atual | R2 18:21 |
| A MecTRIA mantém e paga o domínio. Plugins e assinaturas (ex.: chatbot) também são dela. A Triângulo especifica e recomenda | R2 18:42–19:02 |
| Sem cobrança de site nem de hospedagem **durante** o projeto (cortesia) | R2 18:02 |
| Acompanhamento das primeiras reuniões reais é opcional (decisão de Marcelo e Arthur) | R2 15:07, 17:54 |
| Pós-venda de 2 meses. Depois a MecTRIA assume tudo | R2 19:18 |
| Pagamento atrelado a resultado, a ser detalhado no contrato | Reunião não gravada, confirmado na R2 27:48 |
| Começar pelo fechamento. Topo de funil, prospecção e pós-venda ficam para projetos futuros. **Revisto em 08/10:** a prospecção (cold call) entra na R, dentro do hub do vendedor; o pós-venda continua fora | R1 46:39, R2 30:42 · revisão: Lucas, 08/10/2026 |
| **Etapa R ampliada e adiantada.** Além do que está no contrato (proposta de valor, textos, processo visual e objeções), a R monta o processo comercial completo num **hub do vendedor** (`hub-comercial/`): apresentações (diagnóstica, portfólio para o WhatsApp, proposta por serviço), playbooks (cold call; diagnóstica com perguntas GPCTBA × Carta de Serviços e briefing em PDF para Projetos; proposta com checklist de micro pactos e guia de objeções) e cadência de follow-up. Começa já, em paralelo com a T, que está com o Matheus. A validação formal da copy continua em 12/11 | Lucas, 08/10/2026 |
| **Template novo do hub comercial** (especificação em `docs/15-hub-template.md`): ferramenta de habilidade e rotina, não CRM (o banco de leads fica fora); follow-up com atraso e Rotinas por cargo; banco e login na Cloudflare, custo zero, contas no nome da MecTRIA; logins de hunter, closer, diretor e Projetos; visual "Prancheta" claro e escuro com grade técnica e movimento; modo reunião em duas janelas e com o celular como controle; anotações livres marcadas no painel. Substitui a versão 0.2 do hub | Lucas, 01 e 02/11/2026 (brainstorming do template) |
| **Fase 2 do hub novo (rotina e follow-up)** (plano em `docs/superpowers/plans/2026-11-03-hub-fase-2-rotina-followup.md`): até a fase 4, o closer registra à mão a proposta apresentada e o hub cria os toques da cadência; na fase 4, o fechamento da reunião passa a criar os toques sozinho. Das ligações, o hub guarda só a contagem do dia por resultado (a lista de prospecção fica fora). **Meta diária de ligações: 1 a 2 por hunter, no máximo** (a rotina fica cumprida com 1). Reuniões só como agenda até a fase 3; números do diretor na fase 2: rotina, atrasados e reuniões da semana (conversão e valor vendido na fase 6); busca de clientes, roteiros e objeções na fase 3 | Lucas, 02/11/2026 (aprovação do plano da fase 2) |
| **Fase 3 do hub novo (diagnóstica)** (plano em `docs/superpowers/plans/2026-11-03-hub-fase-3-diagnostica.md`), **decisões a confirmar pelo Lucas**: a diagnóstica roda numa janela só (painel em tela cheia); as duas janelas ficam para a fase 4. O briefing sai em PDF pela impressão do navegador. O rascunho fica no computador e sincroniza a cada 5 segundos. Cada anotação "Técnico" vira pendência para Projetos com prazo no próximo dia útil. Motivos de "não qualificou": sem orçamento, sem urgência, fora do que a MecTRIA faz, quem decide não participa, só pesquisando preço, outro. Os Playbooks usam o conteúdo da versão 0.2 como rascunho até a validação. **Pontos que a revisão pediu para o Lucas rever:** (a) motivos: falta uma saída para a reunião que não aconteceu ("Remarcar" e "Cliente não compareceu"), "Outro" precisa de texto e "Quem decide não participa" choca com o playbook, que manda marcar com quem decide (o Marcelo valida); (b) pendência técnica: hoje nasce na hora da nota, com prazo de 1 dia útil, e Projetos só ganha tela na fase 6; alternativa: criar quando o briefing for marcado como enviado; (c) rascunho no computador: por quanto tempo fica (sugestão: apagar depois de encerrada e salva, pela LGPD) e o que fazer com duas abas abertas; (d) Esc no painel: hoje não sai (um Esc perdido não tira o closer da reunião), mas a spec diz "Esc: sair do campo ou do foco"; (e) o hunter vê nos Playbooks só Cold call e Objeções: confirmar se vê também a Diagnóstica. Na correção da revisão: a diagnóstica só inicia e encerra com a oportunidade ainda em "diagnóstica marcada" (senão a agenda mostra "A oportunidade já passou da diagnóstica"), e a reunião continua como "próxima" no Hoje até 60 minutos depois do horário | Construída e corrigida em 02/11/2026 com o pedido do Lucas de seguir sem parar; aguardando a confirmação |
| **Fase 4 do hub novo (reunião de proposta em duas janelas)** (plano em `docs/superpowers/plans/2026-11-03-hub-fase-4-proposta.md`), **decisões a confirmar pelo Lucas**: (1) as duas janelas se falam pelo próprio navegador, sem servidor, e os slides continuam passando sem internet; os Durable Objects ficam para a fase 5 (celular); (2) apresentação de exemplo com 13 slides (capa e os 12 passos do roteiro de proposta), preenchida com as variáveis do cliente e as palavras da diagnóstica; as apresentações por serviço são o subprojeto seguinte; (3) fechamento com os 4 resultados do playbook: "Vai decidir" e "Pediu ajuste" pedem data e quem decide e criam a proposta e os 7 toques sozinhos; "Fechou" marca ganha com o valor; "Perdeu" pede o motivo; o "Registrar proposta apresentada" continua para proposta feita fora do hub; (4) as variáveis (serviço, escopo, o que fica com o cliente, valor, parcelas, prazo, condições e time) são preparadas em Apresentações e copiadas para a proposta no fechamento; (5) a sala começa com quem decide e o contato, e o painel avisa no slide antes do preço e no do preço se ninguém decide; (6) tempo por bloco planejado pelo roteiro, vermelho quando passa; "pactos por reunião" no Hoje é a média do mês; (7) a diagnóstica continua numa janela só; (8) anotação "Técnico" vira pendência como na diagnóstica, e levar a resposta de Projetos ao follow-up fica para a fase 6. Na correção da revisão: "Fechou" pede o valor fechado separado do apresentado (o desconto à vista muda o valor vendido do mês); só um painel por reunião no mesmo navegador; a proposta começada e não fechada continua na agenda. **Pontos que a revisão pediu para o Lucas rever:** (a) a apresentação de exemplo mostra ao cliente as pendências "[Depoimento]", "[nº de projetos]" e "[valor de mercado]": usar com cliente real antes do subprojeto das apresentações, esconder essas linhas ou avisar antes de começar; (b) o aviso de quem decide aparece em "provas" e "investimento"; a alternativa é avisar desde "valor × preço"; (c) "pactos por reunião" conta só as reuniões feitas no hub (as registradas à mão ficam fora da média); (d) a nota "Escopo" poderia virar pendência para Projetos ou marcar a proposta como "preço a validar"; (e) a sincronização sem servidor exige as duas janelas no mesmo navegador e perfil, e a spec (seção 3) cita os Durable Objects; (f) por quanto tempo o rascunho fica no computador, agora também com os nomes de quem estava na sala (pendência (c) da fase 3) | Construída e corrigida em 03/11/2026 com o pedido do Lucas de seguir ("voce pode continuar o plano"); aguardando a confirmação |
| **Jornada de parcerias e FUPs de 7 dias** (rascunho em `docs/16-pitch-e-fups.md`): a jornada de parcerias é o eixo da apresentação de proposta e dos FUPs. Ela explica o MEJ (sem pró-labore; o resultado do projeto é o case do membro), por que o valor fica abaixo do mercado e pede uma formalidade de sim ou não em até 7 dias, para controlar a capacidade de produção. Entra no slide de valor × preço, antes do preço, e termina num pacto ("Combinado?"). A cadência passa a ter 7 dias corridos (D0, D1, uma ligação, a sexta fixa e o D7), com um FUP fixo de sexta que usa o ciclo de projetos de parceria que começa toda segunda. A cadência de 15 dias da versão 0.2 sai quando isto for validado. Janela de 7 dias corridos, todos os toques escritos pelo WhatsApp, e o ciclo de projetos de segunda passa a existir na MecTRIA. Depois do D7 sem resposta, nutrição com retorno em 45 dias até o hub ter a aba de Reativação (o closer escolhe o mês que o cliente indicou e o card volta nesse mês com a mensagem pronta). Precisam ser feitos antes da call com a MecTRIA na semana de 09/11 | Lucas, 04/11/2026; a validar com a MecTRIA na call |
| **Apresentações em HTML interativo, conectadas ao hub:** a janela separada da reunião continua; o que ela mostra passa a ser uma apresentação em HTML interativo, uma por serviço (a da diagnóstica é padrão), com design próprio, animações, dores clicáveis, preço revelado em etapas e calculadora. O hub controla a apresentação por um contrato pequeno: manda o slide atual e os dados do cliente, e recebe o que acontece nela (dor clicada, preço revelado, números da calculadora). O roteiro (fala, pacto e tempo por slide) fica no painel e passa a ser por serviço. Tudo o que é interativo também pode ser acionado pelo painel. É o Instrumento (S6 e S7), com plano próprio | Lucas, 04/11/2026 |
| **Serviços da MecTRIA:** a lista oficial é a carta de serviços (12). Todos podem ser vendidos; Emissão de Carbono está em estruturação. Os que mais fecham são Desenvolvimento de Produto e Desenho Técnico, então as primeiras apresentações de proposta são desses dois, junto com a da diagnóstica | MecTRIA, resposta no WhatsApp de 04/11/2026 |
| **O diretor cadastra serviços no hub:** cria ou edita um serviço (nome, sigla, resumo, dores, o que entregamos, o que fica com o cliente, âncora de valor, ativo ou em estruturação) e anexa a apresentação de proposta em HTML, o roteiro por slide (fala, dica, pacto e tempo) e as perguntas técnicas da diagnóstica. Os 12 da carta entram já cadastrados. Os arquivos ficam no Workers KV da Cloudflare (gratuito, sem cartão), e o HTML abre isolado na janela da apresentação, sem acesso ao login. Muda a decisão de 02/11 só para os serviços: cadências, objeções e playbooks continuam no código. Entra no plano do Instrumento, depois da fase 6 | Lucas, 04/11/2026 |
| **Contrato retomado:** contrato social da Triângulo registrado na JUCEMG em 23/10/2026 (NIRE 31218662179). Minuta v4 com o NIRE e a ratificação dos serviços desde o kick-off | Lucas, 25/10/2026 |
| Contrato pausado até o CNPJ da Triângulo (LTDA) ficar ativo (superado em 25/10) | Lucas, 08/10/2026 |
| **Kick-off na sexta, 09/10/2026.** Execução de 12/10 a 04/12, acompanhamento de 07/12/2026 a 05/02/2027 | Lucas, 06/10/2026 |
| **Contrato:** resultado líquido com trava; apuração a partir de dez/2026, quando a estrutura entra em uso; acompanhamento até fev/2027 com 1 reunião por mês e ajuste mensal do roteiro (contraproposta aos "até junho" do Marcelo); parcelas das etapas entregues devidas se a MecTRIA desistir ou não usar o processo (T 2, R 1, I 2, A 1) | Lucas, 06/10/2026 |
| **Publicação do site:** depois da validação do site (S3), sem data fixa; prazo final no fim da execução (04/12). A copy entra no site já publicado | Lucas, 06/10/2026 |
| **Quem assina pela MecTRIA:** Arthur Menezes Jordão, presidente e administrador no CNPJ desde 27/03/2026, e Marcelo Zaiden como interveniente | Dados do CNPJ enviados pelo Lucas, 07/10/2026 |
| **Média de referência: R$ 5.000/mês** (faturamento de 2025, ~R$ 60 mil ÷ 12), no lugar de R$ 5.429. A média de 2026 (jan. a out.) é R$ 4.080 (R$ 40.800 ÷ 10), registrada no Anexo III | Lucas, 08/10/2026, com os números do Marcelo (WhatsApp, 07/10) |
| **Assinatura só eletrônica:** sem via impressa, rubricas ou testemunhas; vale a data da última assinatura | Lucas, 07/10/2026 |
| **CPF no contrato:** só do interveniente (Marcelo). Lucas e Arthur assinam como representantes das empresas, sem CPF | Lucas, 07/10/2026 |
| **Responsável da MecTRIA pelas aprovações:** Marcelo Zaiden (VP), marcelo.zaiden@mectria.com | Lucas, 06/10/2026 |
| **Site novo fora do Wix, em hospedagem própria, criado pela Triângulo. Domínio pago pela MecTRIA.** A hospedagem será escolhida a partir das sugestões em `08-site-e-hospedagem.md` | Lucas, 05/10/2026 |

## Pendências e inconsistências

### 1. O escopo em PDF está desatualizado (alta)
O PDF de 21/09 não tem treinamento, roleplay, micro pactos, calculadora, roteiro do vendedor, chatbot, SEO local nem processo comercial visual. A S8 dele é "publicação e encerramento", e o pós-venda **proíbe novas versões de copy**, o que contradiz o "ajustar o roteiro a partir dos dados". **Atualizar o TAP antes de enviar ao Marcelo (tarefa 1).** Tabela completa em `02-escopo.md` seção C.

### 2. Hospedagem e saída do Wix (alta)
**Decidido em 05/10/2026:** hospedagem própria, fora do Wix. A Triângulo cria o site e a MecTRIA paga o domínio. **Ainda falta:**
- Escolher a hospedagem. Recomendação: Cloudflare no plano gratuito, com as contas no e-mail institucional da MecTRIA. Depende do stack do protótipo (perguntar ao Matheus).
- Atualizar a premissa 3 do TAP, que excluía a migração de plataforma.
- Levantar domínio, e-mail no domínio, Search Console, Analytics e Ad Grants no kick-off.
- Migrar o blog com redirecionamentos 301 e cancelar o Wix antes da renovação.
- Painel de edição e manual, porque a MecTRIA não mexe em código.

Detalhes e perguntas do kick-off em `08-site-e-hospedagem.md`.

### 3. Cláusula de pagamento por resultado (alta)
**Atualização 06/10/2026:** minuta v2 com as decisões do Lucas (hoje v4, `contrato/minuta-contrato-v4.md`): resultado líquido com trava, apuração de dez/2026 a dez/2027, acompanhamento até 05/02/2027, proteção se a MecTRIA não usar o processo. Faltam dados da MecTRIA, a base da média e a confirmação de quem assina. Ver `contrato/notas-v3.md`.

Métrica, linha de base, janela, fonte de dados, obrigações da MecTRIA, o que acontece se não bater e a troca de gestão. Lista completa em `05-comercial.md`.

### 4. Linha de base da conversão (média)
Três números circulam: ~30% ("3 em 10", R1), 25% (histórico usado na calculadora, R2) e ~0% (atual, R2). Escolher um e escrever no contrato e na planilha de taxa de fechamento.

### 5. Números falados errado na call (média)
Nunca repetir os valores da coluna da esquerda:

| Falado ou transcrito | Correto |
|---|---|
| R$ 4.950/mês | **R$ 4.860/mês** |
| R$ 54.900/ano | **R$ 58.320/ano** |
| "Economia de R$ 3.500" | **R$ 13.500** (18.000 − 4.500) |
| "Cortesias somam R$ 8,50" | **R$ 8.500** |
| "R$ 400 e R$ 500 à vista" | **R$ 4.500** |

### 6. Contrapartidas não estão escritas (média)
Foram combinadas numa reunião sem gravação. Formalizar (tarefa 2): o que é cada uma, prazo, e se valem mesmo sem resultado.

### 7. Responsável único da MecTRIA (média)
O escopo exige um responsável com autonomia para consolidar feedback e aprovar. Marcelo? Definir no kick-off, pensando na troca de gestão.

### 8. Feriados e calendário (baixa)
Com o kick-off em 09/10: 12/10 (seg, S1), 02/11 (seg, S4) e 20/11 (sex, S6). A execução termina em 04/12, um dia antes do prazo do ERP (05/12, sábado). O pós-venda atravessa o fim do ano e as férias da UFTM, quando muita gente sai da EJ. Planejar a capacitação com os trainees que ficam.

### 9. Indicadores (baixa · oportunidade)
No fim da R1 o Marcelo pediu ajuda com indicadores de comercial e marketing. A chamada caiu antes da resposta. A planilha de taxa de fechamento (tarefa 34) cobre só uma parte. Decidir se fica só nisso ou se vira proposta futura (painel de indicadores).

### 10. Consistência dos números da Triângulo (baixa)
São usados no pitch e vão aparecer no case:
- Teacher Lucas: "mais quatro novos alunos" (R2 02:52) × "dois alunos fechados" (R2 21:04) × deck "2 alunos em 1 semana".
- SEO da Triângulo: "7,9 em uma semana" (R2 02:31) × deck "cerca de 1 mês de site no ar".

### 11. Lacunas nas fontes (baixa)
- Datas das reuniões 1 e 2 e da reunião com o César ("segunda, 10h").
- A R1 começa com a reunião em andamento. A R2 termina em 33:20, no meio de uma fala.
- O que foi combinado no "bench" sem gravação depois da R1 (contrapartidas e pagamento por resultado) só aparece indiretamente na R2.
- Grafia certa da EJ do Lucas e do Pedro: "Projep" (deck) ou "Progep" (transcrição).

### 12. Data da publicação do site (resolvido)
**Decidido em 06/10 (Lucas):** o site é publicado depois da validação do site (S3, até 30/10), sem data fixa. Pode sair antes de 13/11; o prazo final no contrato é o fim da execução (04/12). A copy final entra no site já publicado.

### 13. Itens novos que entram na frente Tela (baixa)
- **Política de privacidade:** obrigatória pela LGPD, porque os formulários coletam dados pessoais. A MecTRIA fornece razão social, CNPJ e um e-mail de contato.
- **Feed do Instagram no site:** exige conta profissional da MecTRIA e liberação de acesso, porque a API antiga de exibição foi desativada.
- **Cases:** confirmar quais clientes podem ser citados. Projeto de engenharia costuma ter sigilo.

### 14. Acompanhamento: fevereiro × junho (média)
**Decidido em 06/10:** até 05/02/2027. É uma contraproposta aos "até junho" do Marcelo. Argumento para ele: o acompanhamento tem duração fixa e é prestado inteiro, pague a EJ antes ou depois. Se ele insistir em junho, a extensão é orçada à parte. Ver `contrato/notas-v3.md`.

### 15. Registro e atividades da Triângulo (resolvido em 25/10)
Contrato social registrado na JUCEMG em 23/10/2026, NIRE 31218662179, com consultoria em gestão e treinamento no objeto social. O texto abaixo é o histórico.


O contrato social de transformação em LTDA foi assinado em 05/10/2026. Confirmar o registro na JUCEMG antes de assinar com a MecTRIA. O objeto social não tem consultoria em gestão (CNAE 7020-4/00) nem treinamento (CNAE 8599-6/04). Ver com o contador como emitir a nota fiscal.

### 16. Materiais da MecTRIA recebidos em 08/10 (média)
Manual de identidade visual, Carta de Serviços e planilhas de precificação (2026 e v4). Resumos em `10-identidade-visual-mectria.md`, `11-carta-de-servicos.md` e `12-precificacao-mectria.md`. Decisões que eles abrem:
- **Lista oficial de serviços** para o site e a apresentação: a carta tem 11 ativos, a precificação v4 tem 7 abas e o protótipo fala em "sete frentes". Definir no kick-off.
- **Logo vetorial:** só temos o PNG extraído do manual. Pedir SVG, PDF ou AI.
- **Descritor do logo** ("Consultoria em Engenharia Mecânica") é diferente da assinatura oficial ("Empresa Júnior de Engenharia Mecânica da UFTM").
- **Fonte do corpo no site:** o manual usa Calibri, que não é fonte web.
- **Incentivo de fechamento:** a planilha antiga dava desconto para quem fechava em até 5 dias úteis; a v4 tirou. Decidir com o Marcelo se volta como gatilho do micro pacto de fechamento, respeitando o piso (desconto máximo de ~13%).
- **Planilha de taxa de fechamento (tarefa 34):** ampliar o Histórico deles em vez de criar outra planilha.
- **Status da planilha v4:** já está em uso? Quem montou?
- **Apresentação atual (Ap Gallu):** analisada só pelo texto (`13-apresentacao-atual-mectria.md`). Falta o PDF para ver o visual, saber se é o modelo padrão e receber mais 2 ou 3 propostas (uma ganha e uma perdida).

### 17. Etapa R ampliada: escopo, contrato e uso do hub (média)
**Decidido em 08/10 (Lucas):** a R monta o processo comercial completo no hub do vendedor (`hub-comercial/`). Falta resolver:
- **Contrato e TAP:** o Anexo I da minuta (hoje v4) lista para a R só "processo comercial visual" e "mapa de objeções". Cold call, roteiro da diagnóstica, cadência de follow-up e o hub vão além. Como o contrato está pausado, dá para escolher agora: registrar como cortesia ou ajustar o Anexo I numa minuta v4. O topo de funil era a "oportunidade futura" do post-it 7 (`03-plano-erp.md`).
- **Argumento a favor:** o Anexo II conta todo o valor vendido no mês, de qualquer canal. Mais propostas pela prospecção ativa também ajudam a liberar as parcelas, não só a conversão.
- ~~**Dados do hub:** decidir a base compartilhada e o login.~~ Decidido em 01/11: banco e login na Cloudflare, no nome da MecTRIA (`docs/15-hub-template.md`).
- **Hospedagem do hub:** privada (tem regras internas de preço). Só o portfólio vai para o site público.
- **Publicação do hub novo (`hub/`):** a fase 1 (base) está pronta e testada no repositório, mas só vai para o ar com as contas Cloudflare e GitHub criadas no e-mail institucional da MecTRIA. Previsão do Lucas em 02/11: terça-feira. Passo a passo em `hub/IMPLANTACAO.md`; precisa também do e-mail do diretor inicial e da lista de pessoas e cargos.
- **Uso antes da S8:** se o processo vai rodar já, combinar com o Marcelo uma apresentação curta do hub ao comercial antes da capacitação formal.
- **Conteúdo:** tudo é rascunho até a validação. Os pedidos novos estão em `14-pedidos-a-mectria.md` (itens 38 a 43).

