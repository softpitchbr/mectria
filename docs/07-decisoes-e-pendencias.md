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
| Começar pelo fechamento. Topo de funil, prospecção e pós-venda ficam para projetos futuros | R1 46:39, R2 30:42 |

## Pendências e inconsistências

### 1. O escopo em PDF está desatualizado (alta)
O PDF de 21/09 não tem treinamento, roleplay, micro pactos, calculadora, roteiro do vendedor, chatbot, SEO local nem processo comercial visual. A S8 dele é "publicação e encerramento", e o pós-venda **proíbe novas versões de copy**, o que contradiz o "ajustar o roteiro a partir dos dados". **Atualizar o TAP antes de enviar ao Marcelo (tarefa 1).** Tabela completa em `02-escopo.md` seção C.

### 2. Plataforma do site: Wix ou hospedagem própria? (alta)
- O PDF diz "implementação na plataforma atual" e exclui a migração de plataforma. O Kanban fala em "acessos ao Wix".
- O protótipo roda **fora do Wix**, num servidor em Washington que vai para Guarulhos (parece Vercel, regiões `iad1` → `gru1`).
- Se o site novo não for no Wix, isso **é** uma migração de plataforma. Decidir e registrar:
  - Onde o site fica depois do projeto e **quem paga a hospedagem** depois do pós-venda.
  - Se a MecTRIA cancela o Wix Premium ou mantém algo nele.
  - Como **apontar o domínio** (DNS) e quem faz isso.
  - **Blog e URLs atuais:** migrar os posts do Wix e criar **redirecionamentos 301**, senão o ranqueamento que já existe se perde.
  - Onde o **chatbot** e os **formulários** vão rodar e para onde vão os leads.
  - Quem mantém o site depois. O PDF diz que é a MecTRIA, e ela não tem ninguém que saiba mexer (R1 00:32). Isso pede um site que a MecTRIA consiga editar ou um manual de uso.

### 3. Cláusula de pagamento por resultado (alta)
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
12/10 (seg, S2), 02/11 (seg, S5) e 20/11 (sex, S7, dia previsto para fechar o Instrumento). O prazo no ERP, 05/12/2026, é um sábado. O pós-venda atravessa o fim do ano e as férias da UFTM, quando muita gente sai da EJ. Planejar a capacitação com os trainees que ficam.

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
