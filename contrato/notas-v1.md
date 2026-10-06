# Notas da minuta v1

Decisões e dados que faltam para fechar o contrato. Minuta: `minuta-contrato-v1.md`.

## Proposta do Marcelo para a cláusula de resultado

Recebida em 06/10/2026. Imagem original em `referencias/clausula-performance-marcelo.png`. Transcrição:

> **Mentoria: pagamento pelo resultado**
> A mentoria custa R$ 4.500 (6 parcelas de R$ 750) e só é paga com resultado. **Resultado** é o que a MecTRIA vender acima da sua média mensal de 2026 (R$ 5.429), somado desde janeiro. A regra:
> - **Cada parcela exige R$ 1.250 de ganho acumulado.** Parcelas liberadas = ganho acumulado ÷ R$ 1.250, arredondado para baixo, até 6. Para pagar as 6, a EJ precisa vender R$ 7.500 acima da média no total (não por mês).
> - **A parcela é paga no mês em que o resultado aparece,** medido pelo vendido, sem esperar o dinheiro do cliente entrar.
> - **Resultado grande antecipa parcelas.** Um mês forte pode liberar várias parcelas de uma vez, com limite de 2 por mês (R$ 1.500) para proteger o caixa. Quitadas as 6, todo o ganho seguinte fica com a EJ.
> - **Parcela sem resultado fica suspensa** e é paga assim que o acumulado alcançar o valor, até dezembro de 2027. Depois disso, deixa de ser devida.
> - **O serviço continua até junho, mesmo que a EJ quite antes.** Pagar antes não pode significar receber menos mentoria.
>
> **Por que R$ 1.250 por parcela:** de cada R$ 1.000 vendidos a mais, só ~R$ 810 viram caixa (10% de atraso e 10% de custo dos projetos). R$ 7.500 de ganho viram ~R$ 6.075 de caixa, o que cobre os R$ 4.500 com ~35% de folga para o atraso das parcelas dos clientes.

### As contas batem
- 6 × R$ 750 = R$ 4.500. 6 × R$ 1.250 = R$ 7.500.
- R$ 1.000 × 0,9 × 0,9 = R$ 810. R$ 7.500 × 0,81 = R$ 6.075. R$ 6.075 ÷ R$ 4.500 = 1,35, ou seja, 35% de folga.
- A Triângulo recebe 60% de cada real de ganho até quitar (R$ 750 ÷ R$ 1.250).
- Com a tese de lucro (+R$ 4.860/mês), o ganho de R$ 7.500 sai em menos de 2 meses de efeito. Com o limite de 2 parcelas por mês, a quitação leva no mínimo 3 meses.

### O que é bom para a Triângulo e foi mantido
- **Resultado medido pelo total vendido, sem discutir se a venda veio do projeto.** Evita briga de atribuição e é fácil de auditar.
- Parcela paga pela venda assinada, sem esperar o dinheiro do cliente.
- Mês forte antecipa parcelas.

## Decisões para o Lucas

### D1. Ganho líquido ou bruto? (mais importante)
O texto do Marcelo permite as duas leituras. "Vender acima da média mensal, somado" sugere bruto. "R$ 7.500 acima da média **no total**" sugere líquido.

- **Bruto:** soma só os meses acima da média. Mês fraco não desconta.
- **Líquido:** total vendido menos a média × meses. Mês fraco desconta.

**O problema do bruto:** a oscilação normal paga parcelas sem melhora nenhuma. Se a MecTRIA alternar meses de R$ 3.000 e R$ 7.858, a média continua R$ 5.429, mas o ganho bruto em 12 meses é R$ 14.574 e libera as 6 parcelas. No líquido, o mesmo cenário libera zero. Alguém da próxima diretoria pode apontar isso e contestar.

**Recomendação: líquido, com trava** (parcela liberada não volta a ficar suspensa). Isso é o que está na minuta. Os motivos:
- É justo e defensável: a Triângulo só recebe se a média subir de verdade, o mesmo discurso da call ("se não move o ponteiro, não faz sentido").
- A trava protege a Triângulo de perder uma parcela já conquistada num mês fraco.

No exemplo do Anexo II, o líquido quita em maio e o bruto quitaria em abril. A diferença é pequena quando o resultado é real.

### D2. A partir de quando conta?
"Somado desde janeiro" deve ser **janeiro de 2027**. A minuta usa essa data. Ela fecha um ano-calendário inteiro contra a média de 2026 e coincide com a nova gestão.
- A alternativa é começar em dezembro de 2026, logo depois da capacitação da S8. No modelo líquido, isso só ajuda se dezembro vender acima da média, o que é improvável no fim do ano.
- **Atenção:** janeiro e fevereiro são férias na UFTM e devem começar abaixo da média. Os pagamentos atrasam, mas a janela até dezembro compensa.

### D3. Acompanhamento até junho de 2027?
A proposta do Marcelo estende o serviço até junho de 2027. O escopo original tinha 2 meses de pós-venda (até ~fev/2027), então são **~4 meses a mais de trabalho**.

**Recomendação: aceitar, com o conteúdo limitado** como está no Anexo I: 1 reunião por mês, ajuste mensal do roteiro, WhatsApp com resposta em 2 dias úteis e pequenas correções. Os motivos:
- Aumenta a chance de resultado, e o pagamento depende disso.
- Rende material para o case.
- Acompanha a gestão do Marcelo.

### D4. Proteção se a MecTRIA não usar o processo
A resposta à pergunta do Marcelo "e se não der resultado?" precisa estar no contrato do lado da Triângulo também. Sem resultado **porque o processo não foi usado**, o risco não pode ser só da Triângulo. Cláusulas 11.2 e 11.3:
- Se a MecTRIA rescindir sem justa causa ou parar de usar a apresentação, o roteiro, a planilha ou o relatório, ficam devidas as parcelas das etapas entregues: **T = 2, R = 1, I = 2, A = 1**.
- Os pesos são uma sugestão. Ajuste se quiser.

### D5. Data de publicação do site
A minuta deixa em aberto: fim da S5 (sugestão do briefing da Tela) ou S8 (escopo original).

### Ajustes que fiz no texto do Marcelo
- "Paga no mês em que o resultado aparece" virou **apuração mensal, relatório até o dia 5 e pagamento até o dia 15 do mês seguinte**. Não dá para pagar no mesmo mês uma venda assinada no dia 28.
- "Até dezembro de 2027, depois deixa de ser devida" agora vale para a **liberação**. Parcela liberada em dezembro, mas retida pelo limite de 2 por mês, continua devida em 2028.
- "Mentoria" virou o projeto inteiro (Método TRIA). Assim, os R$ 4.500 cobrem site, copy, apresentação e treino, e não só a mentoria.
- Incluí: definição de "vendido" (contrato assinado, valor total, cancelamento em até 30 dias descontado), média fixa com a base no Anexo III e verificação pelos contratos ou pelo portal da Brasil Júnior.

## O que pedir à MecTRIA

1. Razão social, CNPJ, endereço e natureza jurídica.
2. **Estatuto ou ata de posse:** quem pode assinar contratos e se são necessárias duas assinaturas. A gestão muda no fim do ano, então confirmar quem assina agora.
3. **Base da média de R$ 5.429:** quais meses de 2026 entraram e quanto foi vendido em cada um (Anexo III).
4. Confirmar que "desde janeiro" é janeiro de 2027.
5. Confirmar a leitura líquida ou bruta, com o exemplo do Anexo II na mão.
6. Nome do responsável único pelas aprovações e e-mail para comunicações formais.

## Do lado da Triângulo (conferir antes de assinar)

1. **Registro do contrato social:** o contrato de transformação foi assinado em 05/10/2026. Confirmar na JUCEMG e no cartão do CNPJ que o nome já é "TRIÂNGULO SOLUTIONS BRASIL LTDA". Se ainda não for, usar o nome que constar no CNPJ na data da assinatura.
2. **Atividades no CNPJ (falar com o contador):** o objeto social tem desenvolvimento de software sob encomenda, promoção de vendas e apoio administrativo. Não tem **consultoria em gestão empresarial** (CNAE 7020-4/00) nem **treinamento profissional e gerencial** (CNAE 8599-6/04), que descrevem boa parte deste projeto. Ver se dá para emitir a nota com as atividades atuais ou se vale incluir essas duas na próxima alteração contratual.
3. **Quem assina:** os três sócios administram isoladamente, então qualquer um assina sozinho. A minuta usa o Lucas.
4. **Dados pessoais:** os CPFs dos signatários só entram na versão final de assinatura. O contrato social não foi salvo no repositório porque tem CPF, RG e endereço residencial dos sócios.

> A minuta foi escrita para negociação entre as partes. Antes de assinar, vale uma leitura de advogado ou do contador da Triângulo, principalmente das cláusulas 3, 9 e 11.
