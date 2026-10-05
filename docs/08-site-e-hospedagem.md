# Site e hospedagem

## Decisão (05/10/2026, Lucas)

- O site novo **sai do Wix** e vai para **hospedagem própria**.
- A **Triângulo cria o site**.
- A **MecTRIA paga o domínio**.
- A hospedagem ainda não foi escolhida. A Triângulo aceita sugestões. A recomendação está abaixo.

Isso muda o escopo: o PDF de 21/09 previa implementação "na plataforma atual" e excluía migração de plataforma (premissa 3). Ver a seção "O que muda no TAP".

---

## Recomendação

### 1. Todas as contas no nome da MecTRIA desde o primeiro dia

Hospedagem, repositório do código, Search Console, Analytics e chatbot ficam num **e-mail institucional da MecTRIA**, nunca no e-mail pessoal de um membro, porque muita gente sai no fim do ano. A Triângulo entra como membro convidado durante o projeto.

Motivos:
- Na entrega, basta remover o acesso da Triângulo. Não é preciso transferir nada às pressas.
- Cumpre o que foi prometido: "os arquivos são de vocês, tudo de vocês" (R1 25:14).
- O site não fica preso numa conta da Triângulo nem de um ex-membro, o que importa ainda mais com a troca de gestão.

### 2. Onde hospedar

**Recomendado: Cloudflare (Pages, ou Workers com arquivos estáticos), no plano gratuito.**
- **Custo zero depois do pós-venda.** A MecTRIA vem de duas gestões sem acumular caixa (R1 50:02), então um custo mensal novo vira uma objeção na planilha de investimentos do Marcelo.
- O plano gratuito permite uso comercial, e o tráfego de arquivos estáticos não tem limite.
- O site é entregue pela rede da Cloudflare, que tem servidor em São Paulo. Isso resolve o "Washington → Guarulhos" sem precisar escolher região: cada visitante recebe o site do ponto mais próximo.

**Alternativa: Vercel**, só se o protótipo depender de recursos dela (por exemplo, Next.js renderizado no servidor). Nesse caso, as funções devem ficar na região `gru1` (São Paulo). **Atenção:** o plano gratuito da Vercel (Hobby) é restrito a uso **não comercial**. O site de uma empresa, mesmo júnior, deveria estar no plano Pro, pago por mês e por membro. Esse é um custo que a MecTRIA teria que assumir depois do projeto.

> Os termos e limites dos dois serviços não puderam ser conferidos daqui. Confirmar nas páginas oficiais antes de fechar.

**A escolha final depende do stack do protótipo.** Perguntar ao Matheus em que tecnologia ele foi feito e onde está publicado hoje.

### 3. Velocidade: o problema provavelmente é o peso, não a distância

O protótipo demorou a carregar na call (R2 09:46). Num site estático servido por uma rede de distribuição de conteúdo (CDN), a distância pesa pouco. O que pesa são a fumaça (que já vai sair) e o motor animado. Como velocidade conta para o SEO, vale:
- Carregar o motor **depois** do conteúdo principal.
- Usar uma versão leve ou uma imagem parada no celular.
- Respeitar a configuração de "reduzir movimento" do aparelho.
- Medir o PageSpeed antes da validação do site (tarefa 14).

### 4. Domínio e DNS

- A MecTRIA paga. No kick-off, descobrir **onde o domínio está registrado** (comprado pelo Wix ou no Registro.br) e **quando vence**.
- Se foi comprado pelo Wix, **transferir para fora antes de cancelar o plano**.
- **E-mail:** se a MecTRIA usa e-mail no próprio domínio (ex.: Google Workspace), copiar os registros MX, SPF, DKIM e de verificação **antes** de mexer no DNS. Senão o e-mail da EJ para de funcionar.
- Apontar o domínio para o site novo só na virada, depois da validação formal.

### 5. Sair do Wix sem perder o Google

O site atual tem sitemaps de `blog-post`, `blog-category` e `page` (R1 06:55). Esses endereços já estão indexados.
1. Listar **todas** as URLs atuais a partir dos sitemaps do Wix.
2. Migrar os posts do blog: texto, imagens, data e autor.
3. Mapear cada URL antiga para a nova e criar **redirecionamentos 301** (arquivo de redirects da hospedagem).
4. Na virada: verificar o domínio no **Search Console**, enviar o sitemap novo e acompanhar erros 404 nas semanas seguintes.
5. Reinstalar o Analytics. Se a MecTRIA usa o **Google Ad Grants** (o "AdSense" da R1), atualizar os links dos anúncios.
6. Manter o Wix Premium ativo até a virada estar conferida e **cancelar antes da próxima renovação**. Sair do Wix também é **economia recorrente** para a MecTRIA, o que é um bom argumento para a planilha de investimentos do Marcelo.

### 6. Formulários e chatbot

- Os formulários de qualificação e de diagnóstico mandam o lead para **onde o comercial já trabalha** (planilha da Casa de Dados ou CRM) e avisam por e-mail. Lead parado numa caixa de entrada se perde.
- **Chatbot:** escolher um que funcione colando um script no site, sem depender de plataforma. A assinatura fica no nome da MecTRIA (já decidido).
- Processo seletivo: link ou formulário próprio.

### 7. Quem edita depois do projeto

Ninguém na MecTRIA mexe em código (R1 00:32), e o blog deve continuar com eles depois do projeto (R2 19:02). Sugestões:
- Um **painel de edição simples** para o blog e os textos principais. Exemplo: um CMS baseado em Git, como o Decap CMS, que é gratuito e guarda o conteúdo no próprio repositório.
- Um **manual curto** e 30 minutos de treino na entrega (pode entrar na tarefa 36).
- Listar o painel no escopo. É simples, mas o PDF exclui "funcionalidades não previstas".

---

## Custos para a MecTRIA

| Item | Quem paga | Observação |
|---|---|---|
| Domínio | MecTRIA | Renovação anual que já existe |
| Hospedagem durante o projeto | Triângulo (cortesia) | Na opção recomendada o plano é gratuito |
| Hospedagem depois do projeto | MecTRIA | R$ 0 na opção recomendada. Na Vercel, plano Pro mensal |
| Chatbot | MecTRIA | Plano escolhido na tarefa 13 |
| Wix Premium | MecTRIA | **Deixa de pagar** depois da virada |

## O que muda no TAP

- **Premissa 3** ("implementação na plataforma atual, migração excluída") vira algo como: "Site novo desenvolvido pela Triângulo Solutions e publicado em hospedagem própria, em contas da MecTRIA, com migração do conteúdo do blog e dos endereços do site atual (Wix)."
- **Hospedagem:** sem custo durante o projeto (cortesia). Depois, a conta e eventuais custos são da MecTRIA.
- **Domínio:** continua com a MecTRIA (já previsto).
- **Entrega final (S8):** contas, repositório do código e manual de edição entregues à MecTRIA.

## Perguntas para o kick-off

1. Em que stack o protótipo foi feito e onde está hoje? (Matheus)
2. Onde o domínio está registrado e quando vence?
3. Quando renova o Wix Premium?
4. A MecTRIA usa e-mail no próprio domínio?
5. Search Console, Analytics e Ad Grants já estão configurados? Quem tem acesso?
6. Qual e-mail institucional vai ser o dono das contas?
