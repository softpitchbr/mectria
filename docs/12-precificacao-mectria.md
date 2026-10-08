# Precificação da MecTRIA

Fontes recebidas em 08/10/2026:
- `referencias/mectria/planilha-precificacao-2026.xlsx`: a planilha **em uso em 2026**. Abas: Precificação, Precificação Galpão EM, Configuração, Histórico.
- `referencias/mectria/planilha-precificacao-v4.pdf`: a **versão 4**, mais completa. Abas: Briefing, Fluxo e matriz de responsabilidade, uma aba por serviço, Configuração, Histórico com Painel de Calibração. Só veio em PDF; **confirmar se a v4 já está em uso** e quem a montou.

## Como o preço é formado (v4)

```
Mão de obra (MO) = diretores × dias úteis × horas/dia × R$ 34,09
                 + assessores × dias úteis × horas/dia × R$ 30,68
  + % do serviço sobre a MO          (DT 15%, DP 25%, Otimização 20%, Estruturas 25%, NR-12 15%, Climatização 20%)
  + % de dificuldade sobre a MO      (Fácil 0%, Normal 15%, Complexo 30%)
  + adicionais do serviço            (DP: Automação +20%, Simulação +20%; DT: R$ 90 por folha; etc.)
  + urgência sobre o subtotal técnico (Apertado 15%, Urgente 30%, Crítico 60%, por limiares de dias de cada projeto)
  + custos diretos + ART (repasse da taxa do CREA, R$ 271)
  = CUSTO TOTAL (= preço mínimo, o "piso")
  + margem / fundo de reserva de 15%
  = PREÇO SUGERIDO (preço de tabela, à prazo)
```

- **À vista:** −10%, o que deixa só ~3% de margem ("Apertado").
- **Desconto máximo:** ~13%. Abaixo disso, prejuízo. Um desconto de 25% dá −14% de margem.
- **Parcelamento:** até 6x sem juros. Acima disso, os juros estão configurados em 0% na v4.
- **Hora-base:** salário médio de mercado ÷ 22 dias ÷ 8 h. Gerente/Diretor R$ 6.000 dá R$ 34,09/h; Assessor R$ 5.400 dá R$ 30,68/h. Os membros não recebem; é referência de valor.
- **Estruturas Metálicas:** R$/m² (Normal 8,50 · Complexo 9,50 · Alta complexidade 10,50).
- **NR-12 e Climatização:** custo por máquina ou por ambiente, multiplicado pela quantidade, mais % do tipo (NR-12 Simples 10%, Média 20%, Complexa 30%; Split 10%, Multi-split/VRF 20%, Central/Chiller 35%).
- **Simulação:** % por tipo de análise (estática linear 15% até CFD/transiente 85%), mais 15% por caso de carga extra.

### Exemplos da v4 (preço sugerido, à prazo)

| Serviço | Projeto de exemplo | Preço |
|---|---|---|
| Desenho Técnico | Ar comprimido, 8 folhas, complexo, urgente | R$ 1.399 |
| Estruturas Metálicas | Quadra de futebol, 160 m² | R$ 1.799 |
| Simulação (CAE) | Não-linear, 3 casos, urgente | R$ 6.279 |
| Otimização | 23 dias, complexo | R$ 7.574 |
| NR-12 | 3 máquinas, adequação média | R$ 7.904 |
| Climatização | 4 ambientes, VRF, complexo | R$ 9.864 |
| Desenvolvimento de Produto | Aletadora de tubos, 70 dias, automação + simulação | R$ 56.618 |

## Briefing da reunião diagnóstica (v4)

É a "entrada única" do processo: sem briefing completo, a precificação não começa. O Comercial preenche na reunião:
1. **Identificação:** cliente, contato, data, responsável comercial, serviço provável, origem do lead.
2. **Contexto e objetivo:** a dor principal, o resultado esperado, o que já tentaram e por que não resolveu, por que agora.
3. **Escopo técnico:** o que está incluído e o que não está, normas aplicáveis, se precisa de ART.
4. **Parâmetros para a planilha:** folhas, dias, horas, equipe, dimensões, máquinas, prazo, dificuldade, automação e simulação, custos diretos.
5. **Comercial:** investimento esperado, prazo desejado, forma de pagamento, parcelas, sensibilidade a preço, concorrência no processo.
6. **Decisão:** quem decide, prazo para decidir, critério de escolha declarado.

## Fluxo de precificação (v4): 3 dias úteis do briefing à proposta

| Etapa | Dono | Quando |
|---|---|---|
| 1. Reunião diagnóstica + briefing | Comercial | Dia 1, manhã |
| 2. Estimativa técnica | Projetos | Dia 1, tarde |
| 3. Precificação | Adm-Financeiro | Dia 2, manhã |
| 4. Validação da proposta | Comercial + Diretoria (aprova) | Dia 2, tarde |
| 5. Envio ao cliente | Comercial | Dia 3 |
| 6. Registro no Histórico | Adm-Financeiro | No fechamento |
| 7. Calibração | Diretoria + Financeiro | Trimestral |

O fast track faz projetos simples em 2 dias. Tem matriz de responsabilidade (quem executa, quem aprova, quem é consultado, quem é informado) para cada atividade. O objetivo declarado é substituir o "precifica aí" do WhatsApp.

## Histórico de 2026

| Início | Projeto | Serviço | Planilha | Real | Δ |
|---|---|---|---|---|---|
| 26/01 | OT_Análise termoestrutural | Otimização | R$ 4.205 | R$ 4.600 | +9,4% |
| 09/02 | DP_Concha amamentadora | Desenv. de Produto | R$ 1.657 | R$ 1.450 | −12,5% |
| 12/02 | PT_Ralo inteligente | Desenv. de Produto | R$ 4.804 | R$ 2.700 | **−43,8%** |
| 25/03 | DP_Painel eletrônico | — | — | — | — |
| 06/04 | DP_Processador de alho | — | — | — | — |
| 06/04 | DT_Container cromatografia | — | — | — | — |

- Só 3 projetos têm valor real, somando R$ 8.750. O faturamento de 2026 informado pelo Marcelo é de R$ 40.800. **O histórico está incompleto**, então a calibração da planilha ainda não funciona.
- **Só os projetos ganhos são registrados.** Não há propostas perdidas, nem status, nem motivo de perda.
- Prefixos dos nomes: DP = Desenvolvimento de Produto, DT = Desenho Técnico, OT = Otimização, PT = Prototipagem, SIM = Simulação, NR = NR-12.
- Os nomes dos projetos são dados de clientes. **Não usar no site nem na apresentação sem autorização.**

## Planilha 2026 (em uso): diferenças e problemas

Vale comentar com o Marcelo. Não é escopo nosso, mas mostra cuidado.
1. **ART a 20% do projeto** (com mínimo de R$ 500). A v4 já corrige para repasse da taxa real (R$ 103 a R$ 271).
2. **Não tem margem.** O "valor final" é o custo somado. A v4 acrescenta 15%.
3. **Incentivo de fechamento:** "fechando em até 5 dias úteis" dá 15% à vista ou 5% à prazo. Isso sumiu na v4 e é **decisão comercial** a tomar (ver abaixo).
4. **Bug na aba Galpão:** a fórmula usa "Fácil/Normal/Complexo", mas a Configuração define "Normal/Complexo/Alta Complexidade". Assim, "Normal" cobra R$ 15/m², a tarifa de "Complexo": 50% acima do previsto.
5. **À vista e à prazo invertidos entre abas:** na aba Galpão, o à prazo é o valor final ÷ 0,9 e o à vista é o valor final; na outra aba é o contrário.
6. **ART com exatamente R$ 2.500** dá zero (as condições usam > e <).
7. **Histórico:** o "prazo real" fica negativo quando não há data final.

---

## O que isso muda no nosso trabalho

1. **O briefing alimenta a apresentação (I).** A apresentação só varia o mínimo. Esse mínimo é exatamente o que o briefing coleta:
   - dor, objetivo, "o que já tentaram" e "por que agora" → slides de "céu e inferno";
   - escopo incluído e não incluído → slide da proposta;
   - decisor, critério, sensibilidade a preço e concorrência → preparo do closer para os micro pactos e as objeções.
   - **Proposta:** a apresentação web lê os campos do briefing. O vendedor preenche uma vez e a apresentação se monta.
2. **Valor × preço e calculadora (I).**
   - O preço de tabela é o "valor". O "preço MecTRIA" vem com as condições.
   - **O roteiro precisa dizer o limite:** desconto máximo de ~13%. O à vista já leva a margem a ~3%.
   - O histórico mostra descontos de −12,5% e −43,8% sobre a planilha. Isso confirma o diagnóstico de que a venda cede no preço porque o valor não aparece antes.
3. **Incentivo para fechar na call ou no mesmo dia (I).** O micro pacto de fechamento ganha força com uma condição por tempo, como o antigo "fechando em até 5 dias úteis". **Decidir com o Marcelo** se volta e com quais números, respeitando o piso.
4. **Processo comercial visual (R).** Não reinventar: desenhar o caminho hunter → reunião diagnóstica (briefing) → fluxo de 3 dias → apresentação → fechamento → histórico, usando a matriz de responsabilidade da v4.
5. **Planilha de taxa de fechamento (A, tarefa 34).** Em vez de uma planilha paralela, **ampliar o Histórico** com:
   - todas as propostas, inclusive perdidas;
   - data da proposta, status (ganha, perdida, pendente) e motivo da perda;
   - vendedor e se usou a nova apresentação.
   - Isso mede a conversão e já serve de base para o **relatório mensal** do contrato (contratos assinados no mês).
6. **Ticket médio.** Os projetos de 2026 com valor ficaram entre R$ 1.450 e R$ 4.600, o que confirma os R$ 2.700 usados na tese de lucro. Os exemplos da v4 mostram projetos de produto muito maiores.
