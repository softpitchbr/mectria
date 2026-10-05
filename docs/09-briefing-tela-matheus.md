# Briefing da frente Tela (para o Matheus)

**Para:** Matheus Miguel · **Responsável pelo projeto:** Pedro Mega · **Copy e treino:** Lucas
**Primeira entrega:** site novo em homologação, validado pela MecTRIA até **23/10/2026** (fim da S3).

## Em 30 segundos

- **Projeto:** reestruturação comercial e digital da MecTRIA, EJ de Engenharia Mecânica da UFTM. Meta: levar a conversão de proposta para fechamento de 25% para 40%.
- **Sua frente:** T · Tela, de 05/10 a 23/10. Site novo, SEO local, robots.txt e llms.txt, CTAs, formulários e chatbot.
- **O que vem depois e mexe no site:** a copy final (R · Retórica, com o Lucas) entra no site na S5. Construa agora com os textos atuais ou provisórios, mas com o **conteúdo separado do layout**, para a troca não dar retrabalho.
- **Dependência:** o kick-off depende da aprovação do contrato (tarefas 1 a 5). Se atrasar, o cronograma anda junto. A seção 2 lista o que dá para adiantar sem a MecTRIA.

## Já decidido

- O site sai do Wix para hospedagem própria. A Triângulo cria o site e a MecTRIA paga o domínio.
- Hospedagem, repositório, Search Console, Analytics e chatbot ficam no **e-mail institucional da MecTRIA**. A Triângulo entra como membro.
- Home mais limpa: o cursor com fumaça sai e o motor fica.
- Fica a identidade visual atual da MecTRIA. Não tem logo nem identidade nova.
- Chatbot: a Triângulo especifica e a MecTRIA assina.
- Sem cobrança de hospedagem durante o projeto.
- Fora do escopo: gestão de redes, tráfego pago, audiovisual, artigos recorrentes no blog e manutenção depois do pós-venda.

## 1. Perguntas para você responder antes do kick-off

1. Em que tecnologia o protótipo foi feito? Framework, e se é estático ou renderiza no servidor.
2. Onde ele está publicado hoje, em qual conta e em qual repositório?
3. O motor é 3D/WebGL, vídeo ou canvas? Quanto pesa a home?
4. Dá para publicar como site estático? A sugestão é Cloudflare no plano gratuito, na conta da MecTRIA. Se precisar da Vercel, diga por quê: o plano grátis dela não permite uso comercial.
5. Quanto tempo leva o ajuste da home (tirar a fumaça, limpar, otimizar o motor)?

## 2. O que dá para começar já, sem a MecTRIA

Tudo aqui usa informação pública e é aproveitado mesmo se o kick-off atrasar.

- [ ] **Inventário de URLs do site atual:** abrir `/sitemap.xml` do domínio e os sitemaps internos (`blog-post`, `blog-category`, `page`). Montar uma planilha com URL atual · título · tipo · URL nova · ação (manter, redirecionar ou remover). Essa planilha vira o mapa de redirecionamentos 301.
- [ ] **Medição do "antes":** PageSpeed no celular e no computador, e quantas páginas o Google indexa hoje (busca `site:dominio`).
- [ ] **Chatbot atual:** testar, anotar o que quebra (console do navegador, F12) e qual ferramenta é.
- [ ] **Inventário de conteúdo:** páginas, serviços (as "sete frentes"), cases, depoimentos, posts, imagens, vídeo e links das redes.
- [ ] **Palavras-chave locais:** partir de "engenharia mecânica Uberaba", "projetista Uberaba", "consultoria em engenharia Uberaba", "desenvolvimento de produto Uberaba" e uma por serviço. Conferir o volume no Planejador de Palavras-chave do Google. Regra: uma página por serviço + cidade.
- [ ] **Ajuste do protótipo:** tirar a fumaça, limpar a home, carregar o motor depois do conteúdo, versão leve no celular e respeito ao "reduzir movimento".
- [ ] **Proposta de mapa de páginas** para aprovar no kick-off:
  - Home
  - Serviços: uma página por frente, com a cidade no título
  - Cases
  - Sobre: propósito, história, time e valores
  - Blog, com os posts migrados do Wix
  - Processo seletivo
  - Contato e formulário de diagnóstico
  - **Política de privacidade:** os formulários coletam dados pessoais, então é obrigatória pela LGPD

## 3. O que pedir à MecTRIA no kick-off

### Acessos
- [ ] Wix (colaborador ou admin), para exportar posts, imagens e formulários.
- [ ] Domínio: onde está registrado, quando vence e quem mexe no DNS com a gente.
- [ ] Se usam e-mail no próprio domínio (ex.: Google Workspace). Precisamos copiar os registros antes de mexer no DNS.
- [ ] Google: Search Console, Analytics, Google Ads/Ad Grants e perfil da empresa no Google, se existirem.
- [ ] Instagram: conta profissional e alguém que libere o acesso. O feed dentro do site depende disso, porque a API antiga de exibição foi desativada.
- [ ] Um e-mail institucional (não pessoal) para ser o dono das contas.
- [ ] Data de renovação do Wix Premium.

### Materiais
- [ ] Logo em vetor (SVG, AI ou PDF) nas versões colorida, branca e preta.
- [ ] Cores e fontes da identidade, ou o manual, se existir.
- [ ] Fotos do time e de projetos em alta resolução, com autorização de uso.
- [ ] Vídeo institucional (arquivo ou link).
- [ ] Carta de serviços: as sete frentes, para quem é cada uma e exemplos.
- [ ] Cases: cliente, problema, solução, resultado e **se pode citar o nome**. Projeto de engenharia costuma ter sigilo.
- [ ] Depoimentos e logos de clientes, com autorização.
- [ ] Números verificáveis: projetos entregues, anos de EJ, clientes atendidos.
- [ ] Propósito, missão e valores.
- [ ] Processo seletivo: datas, etapas e link.
- [ ] Contato oficial: WhatsApp comercial, e-mail e endereço (entram no SEO local).
- [ ] Dados para a política de privacidade: razão social, CNPJ e e-mail para pedidos sobre dados pessoais.

### Comercial (com o Marcelo e o Vinícius Miguel)
- [ ] Para onde vai cada lead do formulário (planilha da Casa de Dados, CRM ou e-mail) e quem recebe.
- [ ] Quais perguntas qualificam um lead, para o formulário de qualificação e o de diagnóstico.
- [ ] O que o chatbot deve fazer (tirar dúvidas, qualificar, mandar para o WhatsApp), quem responde e quanto podem pagar pelo plano.

### Governança
- [ ] Quem é o **responsável único** pelas aprovações (exigência do escopo).
- [ ] Data da reunião de validação do site. Sugestão: quinta, 22/10.

## 4. Como fazer a primeira entrega

### S1 · 05/10 a 09/10
- Kick-off com a MecTRIA.
- Contas criadas no e-mail da MecTRIA. Repositório e homologação no ar.
- **Homologação bloqueada para o Google** (noindex ou senha). Senão o Google indexa duas versões do site.
- Protótipo ajustado e mapa de páginas aprovado.

### S2 · 12/10 a 16/10 (12/10 é feriado)
- Páginas internas responsivas, com o conteúdo separado do layout.
- Formulários ligados ao destino combinado e testados de ponta a ponta.
- Posts do blog migrados.
- Mapa de redirecionamentos 301 pronto.
- sitemap.xml por palavra-chave, robots.txt e llms.txt.
- Dados estruturados de empresa local: nome, endereço, telefone e serviços.
- Chatbot: duas ou três opções com preço enviadas para a MecTRIA escolher e assinar.

### S3 · 19/10 a 23/10
- Chatbot instalado, se já assinado.
- Revisão em celular, tablet e computador, no Chrome e no Safari. PageSpeed, links, formulários e acessibilidade básica (contraste, textos alternativos).
- **Validação formal na homologação** (tarefa 14), com feedback consolidado por escrito pelo responsável único.
- Arquitetura e layout congelados depois da aprovação. O que vier depois é mudança de escopo e passa pelo Pedro.

### Publicação (virada)
Não é no fim da S3. **Sugestão:** publicar depois da validação da copy, no fim da S5 (~06/11), para subir uma vez só, já com os textos finais. Isso também dá ao Google umas três semanas a mais antes do treinamento da S8. O PDF do escopo previa a publicação na S8. Decidir com Pedro e Lucas.

Ordem da virada:
1. Copiar os registros de e-mail do DNS atual.
2. Ativar os redirecionamentos 301.
3. Apontar o domínio.
4. Tirar o bloqueio de indexação.
5. Enviar o sitemap no Search Console.
6. Testar formulários, chatbot e anúncios.
7. Acompanhar os erros 404 por duas semanas.
8. Só então cancelar o Wix, antes da renovação.

## 5. A entrega está pronta quando

- [ ] Todas as páginas do mapa aprovado estão na homologação.
- [ ] Funciona bem no celular, no tablet e no computador.
- [ ] PageSpeed no celular dentro da meta combinada (sugestão: 80 ou mais).
- [ ] Formulários entregam no destino combinado (testado).
- [ ] sitemap.xml, robots.txt e llms.txt prontos para a virada.
- [ ] Planilha de redirecionamentos completa.
- [ ] Chatbot especificado, e instalado se a MecTRIA já assinou.
- [ ] Contas no nome da MecTRIA.
- [ ] Validação formal registrada.

## 6. Cuidados

- Escreva sempre **MecTRIA**.
- No site, só números verificáveis.
- Imagem, logo de cliente ou case só com autorização.
- Pedido fora do escopo (identidade nova, redes, páginas a mais): anote e passe para o Pedro.
- Não mexer no DNS nem cancelar o Wix antes da virada.

## Mensagem para o Matheus (WhatsApp)

> Matheus, segue o briefing da frente Tela da MecTRIA (S1 a S3, validação do site até 23/10). Decidimos que o site sai do Wix para hospedagem própria, com as contas no nome da MecTRIA. Antes do kick-off preciso de 5 respostas tuas: (1) em que tecnologia o protótipo foi feito, (2) onde ele está publicado hoje e em qual conta, (3) o que é o motor e quanto pesa a home, (4) se dá para publicar como site estático (a ideia é Cloudflare grátis), (5) quanto tempo leva o ajuste da home. Enquanto o contrato não sai, já dá para fazer o inventário de URLs do site atual, a medição do PageSpeed e as palavras-chave, que não dependem deles.
