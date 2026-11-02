// Conteúdo migrado de hub-comercial/js/dados/servicos.js (versão 0.2), sem mudar o texto. Rascunho até a validação com a MecTRIA.
import type { Pergunta } from "./diagnostica";

export interface ServicoCompleto {
  id: string;
  nome: string;
  sigla: string;
  resumo: string;
  pistas: string[];
  dores: string[];
  gancho: string;
  entregamos: string[];
  ficaComCliente: string[];
  metodo: string[];
  ceuInferno: Record<string, string[]>;
  perguntas: Pergunta[];
  objecoes: string[];
  ancoraValor: string;
  precificacao: string;
  /** Itens de "fica com o cliente" que a MecTRIA ainda precisa confirmar. */
  ficaComClienteValidar?: boolean | string[] | string;
  /** Serviço ainda sendo estruturado pela MecTRIA. */
  emEstruturacao?: boolean | string;
}

export const SERVICOS_COMPLETOS: ServicoCompleto[] = [
  {
    "id": "desenvolvimento-de-produto",
    "nome": "Desenvolvimento de Produto",
    "sigla": "DP",
    "resumo": "Máquinas e equipamentos do zero, adaptação, nacionalização ou melhoria.",
    "pistas": [
      "processo manual",
      "máquina nova",
      "equipamento importado",
      "nacionalizar",
      "adaptar máquina",
      "ideia de produto"
    ],
    "dores": [
      "Processo manual, lento ou com risco para o operador",
      "Equipamento importado caro ou sem peça de reposição",
      "Ideia de produto sem projeto para fabricar",
      "Máquina que não acompanha mais a produção"
    ],
    "gancho": "Vocês têm algum processo ainda manual, ou alguma máquina que gostariam de adaptar ou nacionalizar?",
    "entregamos": [
      "Modelagem CAD 3D",
      "Desenhos 2D para fabricação",
      "Simulações, quando aplicável",
      "Lista de componentes",
      "Manual de montagem"
    ],
    "ficaComCliente": [
      "Fabricação e montagem física, pelo cliente ou por parceiros"
    ],
    "metodo": [
      "Visita técnica e levantamento",
      "Concepção e escolha da solução com o cliente",
      "Modelagem 3D e dimensionamento",
      "Simulação, quando aplicável",
      "Detalhamento 2D para fabricação",
      "Lista de componentes e manual de montagem",
      "Revisão com o professor orientador e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Processo que depende de mão de obra e do dia do operador",
        "Risco no manuseio",
        "Qualidade que varia de lote para lote"
      ],
      "depois": [
        "Processo padronizado e mais seguro",
        "Projeto documentado para fabricar e manter",
        "Capacidade previsível"
      ]
    },
    "perguntas": [
      {
        "id": "dp-funcao",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "O que a máquina ou o produto precisa fazer? Qual é a entrada e a saída do processo?"
      },
      {
        "id": "dp-tipo",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "É do zero, adaptação, nacionalização ou melhoria de algo que já existe?",
        "opcoes": [
          "Do zero",
          "Adaptação",
          "Nacionalização",
          "Melhoria"
        ]
      },
      {
        "id": "dp-capacidade",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Qual capacidade esperada? (peças por hora, carga, dimensões)"
      },
      {
        "id": "dp-referencias",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "Tem fotos, vídeos, desenhos ou uma máquina de referência?",
        "dica": "Peça para mandar no WhatsApp logo depois da reunião."
      },
      {
        "id": "dp-normas",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Precisa atender alguma norma? (NR-12, alimentícia, outra)"
      },
      {
        "id": "dp-automacao",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Vai precisar de automação (acionamento hidráulico, pneumático, sensores)?",
        "opcoes": [
          "Sim",
          "Não",
          "Não sabe"
        ],
        "dica": "Adicional de +20% na v4."
      },
      {
        "id": "dp-simulacao",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Precisa de simulação de resistência, fadiga ou térmica?",
        "opcoes": [
          "Sim",
          "Não",
          "Não sabe"
        ],
        "dica": "Adicional de +20% na v4."
      },
      {
        "id": "dp-prototipo",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Vai querer um protótipo para validar antes de produzir?",
        "opcoes": [
          "Sim",
          "Não",
          "Não sabe"
        ],
        "dica": "Se sim, inclua também Prototipagem."
      },
      {
        "id": "dp-fabricacao",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Quem vai fabricar? Já tem serralheria, usinagem ou fornecedor?",
        "dica": "Antecipa a objeção \"vocês fabricam?\"."
      }
    ],
    "objecoes": [
      "fabricam",
      "eletrica",
      "prazo-longo",
      "caro"
    ],
    "ancoraValor": "projeto de máquina com escritório de engenharia ou engenheiro sênior",
    "precificacao": "Dias × equipe × hora-base, +25% do serviço, dificuldade e adicionais (Automação +20%, Simulação +20%)."
  },
  {
    "id": "desenho-tecnico",
    "nome": "Desenho Técnico",
    "sigla": "DT",
    "resumo": "Desenhos 2D e modelos 3D de produtos novos ou por engenharia reversa de peças físicas.",
    "pistas": [
      "peça sem desenho",
      "fornecedor único",
      "copiar uma peça",
      "desenho antigo",
      "peça importada"
    ],
    "dores": [
      "Peça que só um fornecedor faz, e sem desenho",
      "Desenhos antigos, à mão ou desatualizados",
      "Peça importada com prazo longo de reposição",
      "Fabricante pedindo desenho para orçar"
    ],
    "gancho": "Vocês têm peças de reposição que dependem de um fornecedor só, ou peças sem desenho técnico?",
    "entregamos": [
      "Desenhos 2D padronizados, com tolerâncias e medidas",
      "Modelagem 3D",
      "Arquivos conforme ABNT e ISO"
    ],
    "ficaComCliente": [
      "Fabricação das peças a partir dos arquivos"
    ],
    "metodo": [
      "Levantamento das peças ou do conceito",
      "Medição da peça física (engenharia reversa), quando houver",
      "Modelagem 3D",
      "Desenhos 2D com tolerâncias",
      "Revisão e entrega dos arquivos"
    ],
    "ceuInferno": {
      "antes": [
        "Dependência de um fornecedor para repor peça",
        "Máquina parada esperando peça",
        "Orçamentos que não comparam a mesma coisa"
      ],
      "depois": [
        "Desenho próprio para cotar com qualquer fabricante",
        "Reposição mais rápida",
        "Padrão de fabricação documentado"
      ]
    },
    "perguntas": [
      {
        "id": "dt-pecas",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantas peças ou conjuntos?"
      },
      {
        "id": "dt-folhas",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Estimativa de folhas de desenho",
        "dica": "R$ 90 por folha na v4. Se o cliente não souber, Projetos estima."
      },
      {
        "id": "dt-reversa",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Existe peça física para medir (engenharia reversa)?",
        "opcoes": [
          "Sim",
          "Não"
        ]
      },
      {
        "id": "dt-finalidade",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Para que vai usar os desenhos? (fabricar, cotar, documentar, manutenção)"
      },
      {
        "id": "dt-formato",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Em que formato precisa dos arquivos? (PDF, DWG, STEP)"
      },
      {
        "id": "dt-complexidade",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Complexidade",
        "opcoes": [
          "Fácil",
          "Normal",
          "Complexo"
        ]
      }
    ],
    "objecoes": [
      "fabricam",
      "caro",
      "so-orcamento"
    ],
    "ancoraValor": "desenho técnico com projetista ou escritório de engenharia",
    "precificacao": "Por folha (R$ 90 na v4), +15% do serviço e dificuldade."
  },
  {
    "id": "prototipagem",
    "nome": "Prototipagem e Validação Experimental",
    "sigla": "PT",
    "resumo": "Testar o funcionamento mecânico antes da produção em escala.",
    "pistas": [
      "testar antes",
      "protótipo",
      "validar",
      "não sei se funciona",
      "produzir em escala"
    ],
    "dores": [
      "Medo de investir na produção sem saber se funciona",
      "Produto que falha em uso e ninguém sabe por quê",
      "Ajuste caro depois que o lote ou o molde está pronto"
    ],
    "gancho": "Vocês têm algum produto que precisa ser testado antes de ir para a produção?",
    "entregamos": [
      "Protótipo funcional",
      "Relatórios de validação",
      "Diagnóstico de falhas",
      "Ajustes no projeto"
    ],
    "ficaComCliente": [
      "Produção em escala"
    ],
    "ficaComClienteValidar": true,
    "metodo": [
      "Definição do que precisa ser validado",
      "Construção do protótipo",
      "Ensaios físicos",
      "Diagnóstico de falhas e ajustes no projeto",
      "Relatório de validação"
    ],
    "ceuInferno": {
      "antes": [
        "Investir no lote sem saber se funciona",
        "Descobrir a falha no cliente final"
      ],
      "depois": [
        "Decisão de produção com base em ensaio",
        "Falhas corrigidas ainda no projeto"
      ]
    },
    "perguntas": [
      {
        "id": "pt-validar",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "O que exatamente precisa ser validado? (funcionamento, resistência, durabilidade)"
      },
      {
        "id": "pt-projeto",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Já existe projeto ou desenho do produto?",
        "opcoes": [
          "Sim",
          "Não",
          "Parcial"
        ],
        "dica": "Se não existir, comece por Desenvolvimento de Produto."
      },
      {
        "id": "pt-quantidade",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos protótipos ou iterações?"
      },
      {
        "id": "pt-materiais",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Materiais e processos previstos (entram como custos diretos)"
      },
      {
        "id": "pt-ensaios",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Que ensaio ou critério de aprovação o cliente espera?"
      }
    ],
    "objecoes": [
      "prazo-longo",
      "caro"
    ],
    "ancoraValor": "desenvolvimento de protótipo com empresa de engenharia",
    "precificacao": "Sem aba própria na v4. No Histórico, foi precificado como Desenvolvimento de Produto."
  },
  {
    "id": "climatizacao",
    "nome": "Climatização",
    "sigla": "CL",
    "resumo": "Conforto térmico, qualidade do ar e eficiência energética em ambientes comerciais, hospitalares e residenciais.",
    "pistas": [
      "calor",
      "ar-condicionado",
      "conta de energia",
      "qualidade do ar",
      "umidade",
      "reforma",
      "clínica"
    ],
    "dores": [
      "Ambiente quente mesmo com o ar ligado",
      "Conta de energia alta",
      "Ar-condicionado comprado sem dimensionamento",
      "Exigência de renovação de ar (clínicas e hospitais)"
    ],
    "gancho": "O ar-condicionado de vocês foi dimensionado para a ocupação de hoje, ou foi sendo comprado aos poucos?",
    "entregamos": [
      "Dimensionamento térmico",
      "Renovação de ar e controle de umidade",
      "Planta de localização de equipamentos e dutos"
    ],
    "ficaComCliente": [
      "Compra dos equipamentos",
      "Instalação"
    ],
    "metodo": [
      "Levantamento dos ambientes e da ocupação",
      "Cálculo de carga térmica",
      "Escolha do sistema",
      "Renovação de ar e umidade",
      "Planta de equipamentos e dutos",
      "Revisão e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Equipamento sub ou superdimensionado",
        "Conta de energia alta",
        "Reclamação de conforto"
      ],
      "depois": [
        "Sistema certo para cada ambiente",
        "Compra de equipamentos sem desperdício",
        "Ar dentro do exigido"
      ]
    },
    "perguntas": [
      {
        "id": "cl-ambientes",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos ambientes?"
      },
      {
        "id": "cl-area",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Área aproximada de cada ambiente (m²)"
      },
      {
        "id": "cl-uso",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Uso dos ambientes",
        "opcoes": [
          "Comercial",
          "Hospitalar ou clínica",
          "Residencial",
          "Industrial"
        ]
      },
      {
        "id": "cl-sistema",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Tipo de sistema pretendido",
        "opcoes": [
          "Split",
          "Multi-split ou VRF",
          "Central ou chiller",
          "Não sabe"
        ],
        "dica": "+10%, +20% e +35% na v4."
      },
      {
        "id": "cl-ocupacao",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Quantas pessoas e quais equipamentos geram calor?"
      },
      {
        "id": "cl-plantas",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Tem planta baixa do local?",
        "opcoes": [
          "Sim",
          "Não"
        ]
      },
      {
        "id": "cl-instalacao",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Quem vai comprar e instalar os equipamentos?",
        "dica": "Antecipa a objeção \"vocês instalam?\"."
      }
    ],
    "objecoes": [
      "instalam",
      "caro",
      "so-orcamento"
    ],
    "ancoraValor": "projeto de climatização com engenheiro mecânico projetista",
    "precificacao": "Custo por ambiente × quantidade, +20% do serviço e % do tipo de sistema."
  },
  {
    "id": "estruturas-metalicas",
    "nome": "Estruturas Metálicas",
    "sigla": "EM",
    "resumo": "Galpões, mezaninos, chalés e suportes de equipamentos pesados.",
    "pistas": [
      "galpão",
      "mezanino",
      "ampliação",
      "cobertura",
      "suporte de equipamento",
      "estrutura"
    ],
    "dores": [
      "Ampliação sem projeto estrutural",
      "Estrutura existente sem memória de cálculo",
      "Serralheria pedindo projeto para orçar",
      "Equipamento pesado sem suporte dimensionado"
    ],
    "gancho": "Vocês têm alguma ampliação prevista, como galpão ou mezanino?",
    "entregamos": [
      "Memória de cálculo estrutural",
      "Simulações",
      "Detalhamento 2D e 3D para fabricação"
    ],
    "ficaComCliente": [
      "Fabricação e montagem",
      "Fundação civil",
      "Soldagem"
    ],
    "metodo": [
      "Levantamento do uso, das cargas e do local",
      "Concepção estrutural",
      "Cálculo e simulação",
      "Detalhamento 2D e 3D para fabricação",
      "Memória de cálculo e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Estrutura com aço a mais ou com risco",
        "Orçamentos de serralheria sem base comum"
      ],
      "depois": [
        "Estrutura calculada, sem aço a mais",
        "Projeto para cotar com qualquer serralheria",
        "Memória de cálculo para a fiscalização"
      ]
    },
    "perguntas": [
      {
        "id": "em-uso",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "O que vai ser construído?",
        "opcoes": [
          "Galpão",
          "Mezanino",
          "Chalé",
          "Suporte de equipamento",
          "Outro"
        ]
      },
      {
        "id": "em-area",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Área em m²",
        "dica": "Preço por m² na v4: Normal 8,50 · Complexo 9,50 · Alta complexidade 10,50."
      },
      {
        "id": "em-vao",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Vão livre e altura"
      },
      {
        "id": "em-cargas",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Cargas especiais? (ponte rolante, equipamento, estoque)"
      },
      {
        "id": "em-local",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Onde fica? Já tem projeto arquitetônico?"
      },
      {
        "id": "em-complexidade",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Complexidade",
        "opcoes": [
          "Normal",
          "Complexo",
          "Alta complexidade"
        ]
      },
      {
        "id": "em-execucao",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Quem fabrica, faz a fundação e monta?",
        "dica": "Fundação civil e soldagem ficam com o cliente."
      }
    ],
    "objecoes": [
      "fabricam",
      "caro",
      "art"
    ],
    "ancoraValor": "projeto estrutural com engenheiro calculista",
    "precificacao": "Por m² conforme a complexidade, +25% do serviço."
  },
  {
    "id": "layout",
    "nome": "Gestão e Planejamento de Layout",
    "sigla": "LY",
    "resumo": "Lean Manufacturing em áreas industriais, estoques e centros logísticos.",
    "pistas": [
      "falta de espaço",
      "fluxo",
      "gargalo",
      "estoque bagunçado",
      "mudança de fábrica",
      "rota de fuga"
    ],
    "dores": [
      "Falta de espaço ou fluxo cruzado",
      "Gargalo na produção",
      "Mudança ou ampliação de planta sem planejamento",
      "Rotas de fuga fora da norma"
    ],
    "gancho": "O espaço da produção ou do estoque está dando conta, ou já tem gargalo de fluxo?",
    "entregamos": [
      "Plantas 2D e 3D do novo layout",
      "Rotas de fuga conforme normas",
      "Relatório de melhoria de fluxo"
    ],
    "ficaComCliente": [
      "Mudança física e obras"
    ],
    "metodo": [
      "Levantamento do fluxo atual",
      "Mapeamento de gargalos",
      "Alternativas de layout",
      "Planta 2D e 3D e rotas de fuga",
      "Relatório de melhoria e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Fluxo cruzado e deslocamento à toa",
        "Gargalo travando a produção"
      ],
      "depois": [
        "Fluxo contínuo",
        "Espaço aproveitado",
        "Rotas de fuga dentro da norma"
      ]
    },
    "perguntas": [
      {
        "id": "ly-area",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Área e tipo do espaço (fábrica, estoque, centro logístico)"
      },
      {
        "id": "ly-postos",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos postos, máquinas ou estantes?"
      },
      {
        "id": "ly-objetivo",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Objetivo principal (capacidade, segurança, organização, mudança)"
      },
      {
        "id": "ly-planta",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Tem planta atual?",
        "opcoes": [
          "Sim",
          "Não"
        ]
      },
      {
        "id": "ly-complexidade",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Complexidade",
        "opcoes": [
          "Fácil",
          "Normal",
          "Complexo"
        ]
      }
    ],
    "objecoes": [
      "caro",
      "prazo-longo"
    ],
    "ancoraValor": "consultoria de layout industrial",
    "precificacao": "Pode ser a aba Otimização da v4 (a confirmar): dias × equipe, +20% do serviço."
  },
  {
    "id": "plano-de-manutencao",
    "nome": "Plano de Manutenção",
    "sigla": "PM",
    "resumo": "Da manutenção corretiva para a preventiva e a preditiva.",
    "pistas": [
      "máquina quebra",
      "parada",
      "manutenção corretiva",
      "apagar incêndio",
      "peça de reposição"
    ],
    "dores": [
      "Máquina parando sem aviso",
      "Manutenção só quando quebra",
      "Ninguém sabe o histórico de falhas",
      "Estoque de peças desorganizado"
    ],
    "gancho": "Hoje a manutenção de vocês é mais apagar incêndio, ou já tem um plano preventivo?",
    "entregamos": [
      "Planos preventivo e preditivo",
      "Cronogramas",
      "Matriz de falhas (FMEA)",
      "Banco de dados de peças"
    ],
    "ficaComCliente": [
      "Execução dos reparos, pela equipe do cliente"
    ],
    "metodo": [
      "Inventário dos equipamentos",
      "Histórico e criticidade",
      "Matriz de falhas (FMEA)",
      "Plano e cronograma",
      "Banco de peças e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Parada não planejada",
        "Custo alto de reparo urgente"
      ],
      "depois": [
        "Paradas planejadas",
        "Peças certas em estoque",
        "Histórico para decidir"
      ]
    },
    "perguntas": [
      {
        "id": "pm-equipamentos",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos equipamentos entram no plano?"
      },
      {
        "id": "pm-hoje",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Como é a manutenção hoje?",
        "opcoes": [
          "Só corretiva",
          "Alguma preventiva",
          "Preventiva estruturada"
        ]
      },
      {
        "id": "pm-paradas",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Quantas paradas não planejadas por mês? Quanto custa uma hora parada?",
        "dica": "Esse número alimenta a calculadora da proposta."
      },
      {
        "id": "pm-equipe",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Tem equipe de manutenção própria? Quantas pessoas?"
      },
      {
        "id": "pm-software",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Usam algum software ou planilha de manutenção?"
      }
    ],
    "objecoes": [
      "caro",
      "ja-temos-engenheiro"
    ],
    "ancoraValor": "consultoria de engenharia de manutenção",
    "precificacao": "Sem aba própria na v4."
  },
  {
    "id": "nr-12",
    "nome": "Adequação à NR-12",
    "sigla": "NR",
    "resumo": "Segurança dos operadores e cumprimento da legislação em máquinas.",
    "pistas": [
      "fiscalização",
      "auditoria",
      "acidente",
      "máquina antiga",
      "proteção",
      "notificação",
      "NR-12"
    ],
    "dores": [
      "Notificação ou fiscalização do Ministério do Trabalho",
      "Auditoria de cliente exigindo NR-12",
      "Acidente ou quase acidente",
      "Máquinas antigas sem proteção"
    ],
    "gancho": "As máquinas de vocês já passaram por análise de risco da NR-12?",
    "entregamos": [
      "Análise de riscos documentada",
      "Projetos de adequação (grades e proteções fixas e móveis)",
      "Laudos e manuais"
    ],
    "ficaComCliente": [
      "Compra e instalação das proteções"
    ],
    "metodo": [
      "Inventário das máquinas",
      "Análise de risco por máquina",
      "Projeto de adequação",
      "Laudo técnico e manuais",
      "Revisão e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Risco de multa, interdição ou acidente",
        "Auditoria de cliente travando contrato"
      ],
      "depois": [
        "Máquinas com análise de risco e laudo",
        "Projeto de proteção pronto para instalar",
        "Documentação para fiscalização e auditoria"
      ]
    },
    "perguntas": [
      {
        "id": "nr-maquinas",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantas máquinas?"
      },
      {
        "id": "nr-tipos",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "Quais máquinas? (tipo, idade, fabricante)"
      },
      {
        "id": "nr-complexidade",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Nível de adequação esperado",
        "opcoes": [
          "Simples",
          "Média",
          "Complexa"
        ],
        "dica": "+10%, +20% e +30% na v4."
      },
      {
        "id": "nr-gatilho",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "O que motivou agora?",
        "opcoes": [
          "Fiscalização ou notificação",
          "Auditoria de cliente",
          "Acidente",
          "Prevenção"
        ],
        "dica": "É o \"por que agora\". Anote as palavras do cliente."
      },
      {
        "id": "nr-documentos",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Já tem inventário, laudos ou análises anteriores?"
      },
      {
        "id": "nr-prazo",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Tem prazo dado pela fiscalização ou pela auditoria?",
        "dica": "Prazo curto entra como urgência na v4 (+15% a +60%)."
      }
    ],
    "objecoes": [
      "instalam",
      "caro",
      "art",
      "prazo-longo"
    ],
    "ancoraValor": "laudo e projeto de NR-12 com empresa de segurança de máquinas",
    "precificacao": "Custo por máquina × quantidade, +15% do serviço e % do nível de adequação."
  },
  {
    "id": "tratamento-acustico",
    "nome": "Tratamento Acústico",
    "sigla": "AC",
    "resumo": "Controle de ruído e vibração em máquinas ou salas.",
    "pistas": [
      "barulho",
      "ruído",
      "vibração",
      "reclamação de vizinho",
      "isolamento"
    ],
    "dores": [
      "Reclamação da vizinhança",
      "Ruído alto para os trabalhadores",
      "Vibração em máquina ou estrutura"
    ],
    "gancho": "Vocês têm problema de ruído ou vibração, com os funcionários ou com a vizinhança?",
    "entregamos": [
      "Estudo das fontes de ruído",
      "Especificação de materiais isolantes e absorvedores (ex.: NBR 10151)"
    ],
    "ficaComCliente": [
      "Compra e instalação dos materiais"
    ],
    "ficaComClienteValidar": true,
    "metodo": [
      "Levantamento das fontes",
      "Medições",
      "Estudo de soluções",
      "Especificação de materiais",
      "Relatório e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Reclamação e risco de multa",
        "Desconforto e risco à saúde"
      ],
      "depois": [
        "Ruído dentro da norma",
        "Solução especificada antes de comprar material"
      ]
    },
    "perguntas": [
      {
        "id": "ac-fonte",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "O que gera o ruído ou a vibração?"
      },
      {
        "id": "ac-quem",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Quem é afetado?",
        "opcoes": [
          "Vizinhança",
          "Trabalhadores",
          "Clientes ou usuários",
          "Equipamentos"
        ]
      },
      {
        "id": "ac-medicao",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Já tem medição de ruído?",
        "opcoes": [
          "Sim",
          "Não"
        ]
      },
      {
        "id": "ac-ambiente",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Tamanho do ambiente ou quantidade de máquinas"
      }
    ],
    "objecoes": [
      "instalam",
      "caro"
    ],
    "ancoraValor": "consultoria em acústica",
    "precificacao": "Sem aba na v4. A Carta não diz o que fica com o cliente."
  },
  {
    "id": "simulacao-computacional",
    "nome": "Simulação Computacional",
    "sigla": "SIM",
    "resumo": "FEA (tensões e fadiga) e CFD (escoamentos e trocas térmicas).",
    "pistas": [
      "peça quebrando",
      "trinca",
      "fadiga",
      "superaquecimento",
      "escoamento",
      "aliviar peso"
    ],
    "dores": [
      "Peça que trinca ou quebra em uso",
      "Superaquecimento",
      "Projeto com material a mais por insegurança",
      "Precisa provar que aguenta antes de fabricar"
    ],
    "gancho": "Vocês têm alguma peça que quebra ou trinca em uso, ou um projeto que precisa provar que aguenta?",
    "entregamos": [
      "Relatório com mapas de tensão",
      "Zonas críticas de fadiga ou perfis térmicos",
      "Falhas e otimizações apontadas"
    ],
    "ficaComCliente": [
      "Alterações físicas na peça ou no equipamento"
    ],
    "ficaComClienteValidar": true,
    "metodo": [
      "Definição do problema e dos casos de carga",
      "Geometria e materiais",
      "Simulação (FEA ou CFD)",
      "Análise dos resultados",
      "Relatório com recomendações"
    ],
    "ceuInferno": {
      "antes": [
        "Falha descoberta em campo",
        "Material a mais por insegurança"
      ],
      "depois": [
        "Falha prevista no computador",
        "Peça otimizada com segurança"
      ]
    },
    "perguntas": [
      {
        "id": "sim-tipo",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Tipo de análise",
        "opcoes": [
          "Estática linear",
          "Não-linear",
          "Fadiga",
          "Térmica",
          "CFD ou transiente",
          "Não sabe"
        ],
        "dica": "De 15% a 85% na v4, conforme o tipo."
      },
      {
        "id": "sim-casos",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos casos de carga?",
        "dica": "+15% por caso extra na v4."
      },
      {
        "id": "sim-cad",
        "bloco": "escopo",
        "tipo": "opcoes",
        "texto": "Tem a geometria em CAD?",
        "opcoes": [
          "Sim",
          "Não"
        ],
        "dica": "Se não tiver, inclua Desenho Técnico."
      },
      {
        "id": "sim-objetivo",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "Que pergunta a simulação precisa responder?"
      },
      {
        "id": "sim-material",
        "bloco": "parametros",
        "tipo": "curto",
        "texto": "Materiais e condições de uso"
      }
    ],
    "objecoes": [
      "caro",
      "estudantes"
    ],
    "ancoraValor": "simulação FEA ou CFD com consultoria especializada",
    "precificacao": "% por tipo de análise (15% a 85%) e +15% por caso de carga extra."
  },
  {
    "id": "automacao-e-controle",
    "nome": "Automação e Controle",
    "sigla": "AUT",
    "resumo": "Circuitos hidráulicos, pneumáticos e eletropneumáticos.",
    "pistas": [
      "pneumático",
      "hidráulico",
      "acionamento",
      "automatizar",
      "cilindro",
      "sequência"
    ],
    "dores": [
      "Acionamento manual e repetitivo",
      "Circuito pneumático ou hidráulico sem documentação",
      "Sequência de máquina que falha"
    ],
    "gancho": "Vocês têm algum acionamento ainda manual que poderia ser pneumático ou hidráulico?",
    "entregamos": [
      "Lógica de acionamento mecânico e fluídico",
      "Diagramas de comando",
      "Dimensionamento inicial",
      "Lista de sensores"
    ],
    "ficaComCliente": [
      "Automação elétrica avançada e programação complexa",
      "Painéis e cabeamento"
    ],
    "metodo": [
      "Levantamento do processo e da sequência",
      "Lógica de acionamento",
      "Dimensionamento dos atuadores",
      "Diagramas de comando e lista de sensores",
      "Revisão e entrega"
    ],
    "ceuInferno": {
      "antes": [
        "Operação manual e lenta",
        "Circuito sem documentação"
      ],
      "depois": [
        "Sequência automática documentada",
        "Componentes dimensionados para comprar"
      ]
    },
    "perguntas": [
      {
        "id": "aut-processo",
        "bloco": "escopo",
        "tipo": "texto",
        "texto": "Que movimento ou sequência precisa ser automatizado?"
      },
      {
        "id": "aut-tipo",
        "bloco": "parametros",
        "tipo": "opcoes",
        "texto": "Tecnologia",
        "opcoes": [
          "Pneumática",
          "Hidráulica",
          "Eletropneumática",
          "Não sabe"
        ]
      },
      {
        "id": "aut-atuadores",
        "bloco": "parametros",
        "tipo": "numero",
        "texto": "Quantos atuadores (cilindros, motores), aproximadamente?"
      },
      {
        "id": "aut-eletrica",
        "bloco": "escopo",
        "tipo": "curto",
        "texto": "Quem cuida da parte elétrica, do painel e da programação?",
        "dica": "Fica com o cliente ou com um parceiro."
      }
    ],
    "objecoes": [
      "eletrica",
      "caro"
    ],
    "ancoraValor": "projeto de automação com empresa integradora",
    "precificacao": "Na v4 entra como adicional de Desenvolvimento de Produto (+20%)."
  },
  {
    "id": "emissao-de-carbono",
    "nome": "Emissão de Carbono (Emissão Zero)",
    "sigla": "CO2",
    "emEstruturacao": true,
    "resumo": "Diagnóstico de carbono e eficiência energética industrial. Em estruturação: não ofertar até a MecTRIA liberar.",
    "pistas": [],
    "dores": [],
    "gancho": "",
    "entregamos": [
      "Metodologias de diagnóstico de carbono",
      "Projetos de eficiência energética industrial"
    ],
    "ficaComCliente": [],
    "metodo": [],
    "ceuInferno": {
      "antes": [],
      "depois": []
    },
    "perguntas": [],
    "objecoes": [],
    "ancoraValor": "",
    "precificacao": "Sem precificação."
  }
];
