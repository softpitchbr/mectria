# Hub comercial: especificação do template

Especificação do **template do hub comercial da MecTRIA**: a interface principal, como ela funciona, o sistema visual, o modo reunião, os dados e o login. É o primeiro subprojeto do hub. As apresentações, os playbooks e a copy vêm depois, cada um com a sua especificação, e usam este template.

Desenhado com o Lucas entre 01/11 e 02/11/2026, parte por parte, com aprovação de cada uma. Os mockups aprovados estão nos links da seção 13.

## 1. Objetivo

**O que o Lucas pediu:** o hub da versão 0.2 (`hub-comercial/`) ficou com cara de IA. O novo tem que ser moderno e premium, personalizado, amigável para o vendedor e provocar o "nossa, isso é incrível". Primeiro vem o template (a interface principal e o jeito de funcionar); depois, as apresentações e as outras entregas.

**O que é o hub:** uma ferramenta de **habilidade e rotina comercial**, não um CRM. Ele diz ao vendedor o que fazer e o que falar em cada momento (roteiros, playbooks, scripts, cadências, apresentações, perguntas da diagnóstica), organiza a rotina de cada cargo e controla o follow-up de cada proposta, inclusive o atraso. A lista de prospecção continua no banco de leads da MecTRIA, fora do hub.

**Usos:** reunião diagnóstica, reunião de fechamento, follow-ups, scripts comerciais, playbooks, cadências, rotinas e a edição das poucas variáveis da apresentação de proposta de cada cliente.

**Como saber que deu certo:**
- Na sessão de aceite (seção 10), o Marcelo e dois vendedores usam o hub num roleplay e reagem com o "nossa".
- Um closer conduz uma proposta inteira numa tela só, sem o cliente ver o roteiro.
- Toda proposta apresentada termina com o próximo passo registrado e entra no follow-up.
- O diretor vê, numa tela, a rotina e os atrasos de cada pessoa do time.

## 2. Decisões

| Decisão | Origem |
|---|---|
| O hub é de habilidade e rotina, não CRM. O banco de leads fica fora; um cliente só entra no hub quando vira diagnóstica marcada | Lucas, 01/11/2026 |
| O hub controla o atraso de cada follow-up e tem uma aba de Rotinas por cargo | Lucas, 01/11/2026 |
| Usado em todos os aparelhos; o principal é o notebook. Na reunião online, o vendedor tem uma tela só | Lucas, 01/11/2026 |
| Banco e login na Cloudflare, custo zero, com todas as contas no nome da MecTRIA (opção A da comparação de custos) | Lucas, 01/11/2026 |
| Têm login: hunter, closer e diretor comercial. Projetos entra como cargo e passa a valer se a MecTRIA cadastrar alguém de Projetos | Lucas, 01/11/2026 |
| Visual "Prancheta" (CAD como lembrança, misturado com produto tech moderno e movimento), com modo foco quando o vendedor entra numa ação | Lucas, 02/11/2026 |
| Tema claro e escuro; o escuro é grafite, não preto; a grade técnica fica no fundo de todas as telas | Lucas, 02/11/2026 |
| Modo reunião em duas formas: duas janelas lado a lado (padrão) e o celular como controle remoto | Lucas, 02/11/2026 |
| Painel da reunião com anotações livres marcadas (Objeção, Técnico, Escopo, Próximo passo), quem está na sala, tempo por bloco e fechamento obrigatório | Lucas, 02/11/2026 |
| Interface em React. Roteiros, perguntas, objeções e cadências ficam em arquivos do código; um editor para o diretor fica para depois | Lucas, 02/11/2026 (aprovação da Parte 1) |

## 3. Arquitetura

**Aplicativo web**, aberto no navegador, sem instalar nada. Endereço proposto: `hub.mectria.com`. Enquanto o DNS não estiver acessível, roda no endereço provisório da Cloudflare (`*.pages.dev`).

| Peça | Serviço Cloudflare | Função |
|---|---|---|
| Interface | Pages | O hub em React, servido de graça e com uso comercial permitido |
| Servidor | Workers (Pages Functions) | A API que lê e grava os dados, sempre conferindo o cargo de quem pede |
| Banco | D1 | As tabelas da seção 7 |
| Login | Access (Zero Trust) | A pessoa digita o e-mail, recebe um código e entra. Sem senha. Só e-mails cadastrados pelo diretor |
| Tempo real | Durable Objects | A sessão de reunião que liga a janela da apresentação, o painel e o celular |

**Custos.** No plano grátis: 5 milhões de leituras e 100 mil gravações por dia no banco, 5 GB e até 50 pessoas com login. O volume da MecTRIA (umas 10 pessoas e algumas centenas de oportunidades por ano) fica muito abaixo disso. O plano grátis não tem prazo e não pausa por falta de uso. Se um dia for preciso, o plano pago é de US$ 5/mês; acima de 50 pessoas com login, cada uma a mais custa cerca de US$ 7/mês. **A confirmar ao criar a conta:** se o plano grátis cobre os Durable Objects (senão, US$ 5/mês) e por quantos dias o D1 permite voltar o banco no tempo.

**Entrega à MecTRIA.**
1. As contas (Cloudflare e GitHub) são criadas no e-mail institucional da MecTRIA, nunca no da Triângulo.
2. A Triângulo entra como membro convidado e sai no fim do acompanhamento (05/02/2027).
3. O código fica num repositório da MecTRIA.
4. No plano grátis não se cadastra cartão.
5. Junto vai um manual de custos de uma página: o que é grátis, o que gera cobrança, onde ver o consumo e o que fazer perto do limite.

**Conteúdo.** Roteiros, perguntas, objeções, cadências e os modelos de rotina ficam em arquivos de dados do código, separados das telas, como na versão 0.2 (`hub-comercial/js/dados/`). A Triângulo ajusta esses arquivos todo mês durante o acompanhamento.

**Versão 0.2.** O hub atual sai do ar quando o novo for liberado. O conteúdo dele (perguntas GPCTBA, perguntas por serviço, roteiros, objeções, cadências) é reaproveitado; a interface é refeita.

## 4. Cargos e permissões

| Cargo | Vê | Edita |
|---|---|---|
| **Hunter** | Hoje, Playbooks, Rotinas e as oportunidades que ele marcou | As oportunidades que ele marcou, até a diagnóstica |
| **Closer** | Tudo do comercial, inclusive as oportunidades de todo o time (para assumir a de um colega) | As próprias oportunidades, reuniões, propostas e follow-ups |
| **Diretor comercial** | Tudo, mais a seção Time | Tudo; cadastra pessoas, define cargos e pode apagar os dados de um contato a pedido (LGPD) |
| **Projetos** | Briefings, fichas e pendências técnicas | As pendências técnicas (responder e fechar) |

A permissão é conferida no servidor, não só na tela. O cargo Projetos entra no template, mas só passa a valer na prática quando o diretor cadastrar alguém de Projetos.

## 5. Navegação e telas

**Estrutura fixa:**
- **Barra lateral de ícones,** que mostram o nome ao passar o mouse. No celular, ela vira uma barra embaixo.
- **Barra de cima** com a busca geral (Ctrl K), que acha roteiro, objeção, serviço ou cliente, e o perfil com o cargo.
- **Chave de tema** (Sistema, Escuro, Claro) no perfil.

| Seção | O que tem | Quem vê |
|---|---|---|
| **Hoje** | A tela inicial, diferente por cargo (abaixo) | Todos os cargos |
| **Reuniões** | Agenda de diagnósticas e apresentações. Cada uma abre a ficha e tem "Iniciar" | Closer, diretor |
| **Follow-up** | Propostas na rua com o próximo toque, atrasados primeiro | Closer, diretor |
| **Playbooks** | Consulta: cold call, diagnóstica, proposta, objeções e cadências | Hunter, closer, diretor |
| **Apresentações** | O catálogo (diagnóstica, portfólio, uma proposta por serviço) e a edição das variáveis de cada cliente | Closer, diretor |
| **Rotinas** | O checklist do dia do cargo e o histórico dos dias cumpridos | Hunter, closer |
| **Time** | Pessoas, cargos e convites, e a visão do time | Diretor |
| **Briefings** | Fichas, PDFs e pendências técnicas que chegaram das reuniões | Projetos, diretor |

O diretor vê todas as seções.

**O "Hoje" de cada cargo:**
- **Hunter:** bloco de ligações do dia (meta e contador), tentativas pendentes e diagnósticas que ele marcou.
- **Closer:** a próxima reunião em destaque (com contagem regressiva e "Iniciar reunião"), a rotina do dia, os follow-ups (atrasados primeiro) e os números do mês: propostas, fechadas e pactos por reunião.
- **Diretor:** quem cumpriu a rotina, follow-ups atrasados por pessoa, reuniões da semana, propostas, conversão e valor vendido no mês.
- **Projetos:** briefings novos e pendências técnicas abertas, com prazo.

**Modo foco.** Toda ação específica abre em foco: iniciar uma diagnóstica, começar o bloco de cold call, fazer um toque de follow-up ou preparar a proposta de um cliente. O bloco da ação cresce a partir do cartão em que o vendedor clicou. O resto da tela recua, desfocado, sem sumir. Há um só botão principal e "Sair do foco" no canto.

**Cold call.** O hunter liga a partir da lista da Casa de Dados. O hub mostra o roteiro e o gancho do serviço; quando ele marca uma diagnóstica, registra ali e o hub cria a oportunidade.

**Rotinas.** A rotina do dia junta os itens fixos do cargo com os itens gerados pelo dia (toques de follow-up vencendo, reuniões de hoje, briefings a mandar). Modelos iniciais, a validar com o Marcelo:
- **Hunter:** fazer o bloco de ligações (meta diária a combinar), mandar WhatsApp nas tentativas sem resposta e registrar as diagnósticas marcadas.
- **Closer:** confirmar as reuniões do dia, escrever a hipótese de dor das diagnósticas, fazer os toques de follow-up do dia, mandar os briefings para Projetos no mesmo dia e registrar o resultado de cada reunião.

## 6. Modo reunião

**Forma 1 · Duas janelas lado a lado (padrão).**
1. O vendedor clica em "Iniciar reunião".
2. O hub abre a apresentação numa janela própria e vira um painel estreito à direita, em modo foco (cerca de 70% de tela para a apresentação e 30% para o painel).
3. No Meet ou no Zoom, o vendedor compartilha só a janela da apresentação. Antes de começar, o painel lembra qual janela compartilhar.
4. O vendedor passa os slides pelo painel ou pelo teclado e nunca toca na janela que o cliente vê.

**Forma 2 · Celular como controle.** O notebook mostra a apresentação em tela cheia. O vendedor escolhe "Usar o celular como controle" e lê um QR code com o celular, que já está logado; o celular vira o painel. Serve na reunião online e, principalmente, na presencial.

**O que o painel mostra na reunião de proposta:**
- Ao vivo, com o tempo total, o cliente e **quem está na sala**, com a marca em quem decide.
- O slide atual (por exemplo, 5 de 13) com a barra de progresso em segmentos e o **tempo do bloco**, planejado contra o real. Fica vermelho quando passa.
- A **fala** do slide, com as palavras do cliente (vindas da diagnóstica) destacadas.
- O **pacto** do slide, como um botão grande, e quantos pactos já foram feitos (de 6).
- As **objeções**, na tecla O.
- As **anotações livres** (detalhadas abaixo).
- A miniatura do próximo slide e os botões Voltar e Próximo.

**Anotações livres:**
- A tecla N abre o campo e, enquanto o vendedor digita, as setas não passam slide.
- Cada anotação fica carimbada com o slide e o minuto.
- Cada uma pode ter uma marcação, que decide para onde ela vai depois:
  - **Objeção:** fica registrada para a revisão mensal do roteiro.
  - **Técnico:** vira uma pendência para Projetos, com prazo, e entra na mensagem de follow-up seguinte.
  - **Escopo:** o preço volta para Projetos e Adm-Fin validarem. O vendedor não dá preço de cabeça.
  - **Próximo passo:** alimenta o follow-up.

**Alertas:** se quem decide não estiver na sala, o painel avisa antes do slide de preço (segurar o preço e marcar a conversa com quem decide).

**Fechamento obrigatório:** a reunião só termina com o próximo passo registrado (decisão, data e quem decide), e isso cria os toques de follow-up.

**Na diagnóstica,** a apresentação é curta e igual para todos. O painel vira o roteiro de perguntas GPCTBA + C&I (uma de cada vez) e as perguntas técnicas do serviço, com as respostas anotadas ali. As anotações livres funcionam igual. No fim, a ficha está salva e o briefing para Projetos sai pronto em PDF. A diagnóstica também tem fechamento obrigatório: termina com a apresentação da proposta marcada (data, hora e quem decide) ou com "não qualificou" e o motivo, que manda a oportunidade para nutrição.

**Atalhos no notebook:** setas (slides), N (anotar), O (objeções), Ctrl K (busca), Esc (sair do campo ou do foco).

**Fica para o subprojeto das apresentações:** os números do cliente digitados no painel atualizando a calculadora ao vivo no slide de investimento.

## 7. Sistema visual "Prancheta"

**Conceito.** CAD como lembrança, não como cópia, misturado com produto tech moderno e movimento. O que o cliente vê (apresentações, PDF, portfólio) é sempre claro e segue o manual da MecTRIA.

**Temas.** Claro e escuro. O padrão segue o sistema do computador e a escolha do vendedor fica lembrada.

| Token | Escuro | Claro |
|---|---|---|
| Fundo | #16171A | #F2F1EE |
| Painel | #1F2024 | #FFFFFF |
| Painel em foco | #27282D | #FAF9F7 |
| Linha | #34353B | #E2DFD9 |
| Linha viva | #4A4B52 | #CDC8C0 |
| Texto | #EEEDE9 | #1F1E1C |
| Texto suave | #A19E99 | #6B6762 |
| Vermelho (texto) | #EF5A5F | #B3242A |
| Vermelho Energia (ação, com texto branco) | #C1272D | #C1272D |
| Vinho MecTRIA (identidade) | #780000 | #780000 |

- **Cartões:** mais claros que o fundo, com borda visível e uma linha de luz no topo. No claro, uma sombra bem leve.
- **Grade técnica:** fica no fundo de todas as telas, com linha fina a cada 16 px e forte a cada 64 px, bem sutil, e acende perto do cursor. No celular, fica quieta.
- **Fontes:** Poppins 600 nos títulos (do manual), IBM Plex Sans no texto e IBM Plex Mono em números, prazos e códigos, sempre alinhados.
- **Componentes:**
  - botão principal, secundário e fantasma;
  - marcadores (atrasado, hoje, técnico);
  - "quem está na sala";
  - busca Ctrl K;
  - barra de segmentos;
  - lista com código (D+8, S3);
  - checklist da rotina;
  - **medidor** (a cota de desenho técnico como instrumento, por exemplo a contagem até a reunião);
  - aviso de confirmação.
- **Movimento:** 140 ms para responder ao clique, 240 ms para abrir e fechar, 420 ms para mudar de modo, com uma curva única e nada quicando.
  - O que se move: o número que mudou rola, o pacto feito fecha a linha e desenha o check, os segmentos varrem, o modo foco cresce a partir do cartão e os cartões têm brilho que segue o mouse.
  - Com "reduzir movimento" ligado no sistema, tudo fica parado.
- **Regras:**
  - Um botão vermelho por tela.
  - Texto vermelho só sobre o fundo e o painel (sobre o painel em foco, o contraste não chega a 4,5:1).
  - Números em mono.
  - Detalhe técnico só onde informa algo.
  - Teclado primeiro no notebook.
  - Contraste mínimo de 4,5:1 nos dois temas.

## 8. Dados

| Tabela | O que guarda |
|---|---|
| **pessoas** | Nome, e-mail, cargo e se está ativa |
| **oportunidades** | Empresa, contato, telefone, e-mail, cidade, segmento, origem, serviço provável, quem marcou (hunter), closer responsável, situação (diagnóstica marcada, proposta marcada, em follow-up, ganha, perdida, nutrição), motivo da perda e valor fechado |
| **reunioes** | Oportunidade, tipo (diagnóstica ou proposta), data e hora, formato, quem esteve na sala (com quem decide), pactos feitos, tempo de cada bloco e situação (marcada, em andamento, concluída) |
| **fichas** | As respostas da diagnóstica, uma por pergunta (GPCTBA, C&I e as técnicas do serviço) |
| **anotacoes** | Reunião, slide, minuto, marcação, texto e autor |
| **pendencias** | As anotações "Técnico": texto, prazo, responsável em Projetos, situação e resposta |
| **propostas** | As variáveis da apresentação (serviço, escopo incluído e o que fica com o cliente, valor, prazo, condições, time), a data de apresentação, o resultado e a decisão combinada |
| **toques** | Os toques de follow-up de cada proposta: qual (D0 a D15), data prevista, quando foi feito, canal e resultado. Atrasado é o toque com data prevista antes de hoje e ainda não feito |
| **rotinas** | Os itens do dia de cada pessoa, com a origem (fixo do cargo ou gerado) e quando foi feito |
| **historico** | Toda mudança de situação de uma oportunidade, com data e autor |

**Regras:**
- Nada é apagado; o que sai fica marcado como inativo. A exceção é o pedido de exclusão de dados pessoais (LGPD), feito pelo diretor.
- **Durante a reunião,** a sessão em tempo real é temporária. Respostas, anotações e pactos são salvos no banco a cada poucos segundos e também no computador, para não perder nada se a internet cair.
- **Números do diretor:** saem do histórico. São eles: conversão (ganhas sobre decididas), tempo entre a diagnóstica e a decisão, pactos por reunião, objeções mais frequentes, rotina cumprida por pessoa e follow-ups atrasados.
- **Saídas:**
  - o CSV para o Histórico da MecTRIA (a planilha de taxa de fechamento);
  - o valor vendido no mês, que é o relatório mensal do contrato;
  - a exportação completa (backup) para o diretor.

## 9. Erros e situações

| Situação | O que acontece |
|---|---|
| A internet cai | O painel continua funcionando e guarda tudo no computador. Aparece "Sem internet · salvo neste computador" e, quando a conexão volta, ele sincroniza sozinho |
| O celular desconecta | A apresentação continua no notebook e o teclado assume. O aviso aparece só no painel, nunca na janela do cliente. Para voltar, é só ler o QR code de novo |
| A janela da apresentação fecha | "Reabrir apresentação", no painel, volta no mesmo slide |
| Compartilhou a tela errada | O painel lembra qual janela compartilhar antes de começar, e a capacitação treina isso |
| Dois closers editam a mesma oportunidade | Vale a última alteração de cada campo, e o outro vê "Fulano alterou agora" |
| O login expira | O login dura o dia todo. Se cair, o rascunho fica guardado e volta depois do login |
| Um dado é apagado por engano | Nada é apagado de verdade. O diretor tem a exportação completa e o banco pode voltar a um ponto anterior |
| Uma pessoa sem permissão tenta abrir algo | O servidor recusa e a tela mostra o que ela pode fazer |

## 10. Testes e aceite

**Automáticos, antes de cada entrega:**
- **Regras:** dias úteis e feriados, datas da cadência, preenchimento das falas, permissões por cargo, geração da rotina do dia e atraso de follow-up.
- **Servidor:** leitura e gravação com acesso por cargo.
- **Fluxos no navegador:**
  - diagnóstica até o PDF;
  - proposta com pactos, anotações e fechamento obrigatório;
  - follow-up até o resultado;
  - modo reunião com as duas janelas sincronizadas;
  - celular pareando;
  - queda de internet no meio da reunião.
- **Aparência:** capturas das telas principais nos dois temas, no notebook e no celular, e com "reduzir movimento".

**Aceite:** uma sessão de 30 minutos com o Marcelo e dois vendedores, num roleplay de reunião de verdade. O hub só vai para o time depois desse aceite.

## 11. Ordem de construção

O plano de implementação segue estas fases, cada uma testável e mostrável sozinha:

1. **Base:** conta Cloudflare, login, banco, cargos, o esqueleto com navegação, busca e os dois temas do sistema visual.
2. **Rotina e follow-up:** o Hoje de cada cargo, as Rotinas, o Follow-up com atraso e o modo foco dos toques.
3. **Diagnóstica:** ficha, perguntas no painel, anotações, fechamento obrigatório e o briefing em PDF.
4. **Reunião de proposta em duas janelas:** a janela da apresentação (com uma apresentação de exemplo), o painel sincronizado, os pactos, quem está na sala, o tempo por bloco e a criação dos toques.
5. **Celular como controle:** o pareamento por QR code e o painel no celular.
6. **Diretor e Projetos:** a seção Time, os números, os Briefings e as pendências técnicas.

## 12. Fora deste subprojeto

- **Conteúdo das apresentações:** a diagnóstica, o portfólio e as propostas por serviço, com valor × preço e calculadora. Este template entrega o motor da janela da apresentação e a sincronização.
- **Revisão do conteúdo dos playbooks e da copy** (Retórica), com as respostas da MecTRIA.
- **Editor de roteiros** para o diretor mexer sem a Triângulo.
- **Integração com o banco de leads** da MecTRIA.
- **Calculadora ao vivo** no painel.

## 13. Referências

- Direções visuais comparadas (a escolhida foi a A, Prancheta): https://claude.ai/artifact/7Y21dupqG2KXnphdzBxPwx
- Modo reunião, com o painel e o celular: https://claude.ai/artifact/QkSKBQAq9FcHEWVvy9JHCB
- Sistema visual Prancheta, versão 4, com temas e movimento: https://claude.ai/artifact/BQtzqK1PbcQtKXqLa6K1X6
- Comparação de custos: decisão de 01/11 na seção 2. As fontes estão no histórico da conversa e precisam ser conferidas nas páginas oficiais ao criar a conta.

Os links são privados do Lucas. Para outra pessoa abrir, ele compartilha pelo menu Share de cada página.

## 14. O que falta para começar a implementação

| # | O quê | De quem |
|---|---|---|
| 1 | E-mail institucional da MecTRIA para ser dono das contas (Cloudflare e GitHub) | MecTRIA (pedido 5 do `docs/14`) |
| 2 | Acesso ao DNS de mectria.com para criar `hub.mectria.com`. Até lá, endereço provisório | MecTRIA (pedido 2) |
| 3 | Lista das pessoas, com e-mail e cargo | MecTRIA (diretor comercial) |
| 4 | Validação dos modelos de rotina e da meta diária de ligações | Marcelo (pedido 43) |
| 5 | Confirmar se o plano grátis cobre os Durable Objects e por quantos dias o D1 volta no tempo | Triângulo, ao criar a conta |
