"""Gera a planilha do relatório mensal do contrato (Anexo IV), versão didática.

Uso: python3 contrato/gerar-relatorio-mensal.py contrato/relatorio-mensal-mectria.xlsx

Abas: Comece aqui (3 passos), Vendas e Propostas (a MecTRIA preenche), Painel
(números do mês e extrato; só a coluna "Mês fechado?" é preenchida) e Config
(oculta: parâmetros do contrato e listas). Cores e fonte do manual da MecTRIA.
Só funções clássicas (SUMIFS, COUNTIFS, SUMPRODUCT, INDEX/MATCH), que rodam no
Excel e no Google Sheets. Depois de gerar, rode o recalc da skill de planilhas.
"""
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

# Identidade da MecTRIA (docs/10-identidade-visual-mectria.md)
VINHO, GRAFITE, CINZA, NEVOA, LINHA = "780000", "303030", "606060", "F3F1EE", "D9D9D9"
FONTE = "Calibri"
FUNDO_NEVOA = PatternFill("solid", fgColor=NEVOA)
SEM_FUNDO = PatternFill(fill_type=None)

MOEDA = '"R$" #,##0.00;-"R$" #,##0.00;"–"'
DATA = "dd/mm/yyyy"
MES = "mmm/yyyy"
PCT = '0%;-0%;"–"'
INTEIRO = '0;-0;"–"'

PRIMEIRA, LINHAS = 7, 200          # linhas de dados das abas de entrada
ULTIMA = PRIMEIRA + LINHAS - 1

SERVICOS = ["Desenvolvimento de Produto", "Desenho Técnico", "Prototipagem e Validação", "Climatização",
            "Estruturas Metálicas", "Layout", "Plano de Manutenção", "NR-12", "Tratamento Acústico",
            "Simulação Computacional", "Automação e Controle", "Outro"]
MOTIVOS = ["Preço", "Prazo", "Escolheu outra empresa", "Adiou ou desistiu", "Sumiu, sem resposta",
           "Escopo não atende", "Outro"]


def fonte(size=11, bold=False, color=GRAFITE, italic=False, strike=False):
    return Font(name=FONTE, size=size, bold=bold, color=color, italic=italic, strike=strike)


def linha_fina(cor=LINHA):
    return Border(bottom=Side(style="thin", color=cor))


def preparar(ws, larguras, cor_aba):
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = cor_aba
    for col, larg in larguras.items():
        ws.column_dimensions[col].width = larg
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True


def cabeca(ws, titulo, subtitulo):
    ws["B2"] = titulo
    ws["B2"].font = fonte(22, True, VINHO)
    ws["B3"] = subtitulo
    ws["B3"].font = fonte(11, color=CINZA)
    ws.row_dimensions[2].height = 34


def colunas(ws, linha, itens):
    """itens: lista de (coluna, título, ajuda). Escreve o cabeçalho e a linha de ajuda logo abaixo."""
    for col, titulo, ajuda in itens:
        c = ws[f"{col}{linha}"]
        c.value = titulo
        c.font = fonte(11, True)
        c.alignment = Alignment(wrap_text=True, vertical="bottom")
        c.border = Border(bottom=Side(style="medium", color=VINHO))
        h = ws[f"{col}{linha + 1}"]
        h.value = ajuda
        h.font = fonte(9, color=CINZA, italic=True)
        h.alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[linha].height = 32
    ws.row_dimensions[linha + 1].height = 28


def validar(ws, intervalo, formula, titulo, mensagem, erro="Escolha uma opção da lista."):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True, showInputMessage=True,
                        promptTitle=titulo, prompt=mensagem, errorTitle="Valor inválido", error=erro)
    ws.add_data_validation(dv)
    dv.add(intervalo)


def ajuda(ws, intervalo, titulo, mensagem, tipo=None, **kw):
    dv = DataValidation(type=tipo, allow_blank=True, showInputMessage=True, promptTitle=titulo,
                        prompt=mensagem, errorTitle="Valor inválido", **kw)
    ws.add_data_validation(dv)
    dv.add(intervalo)


def campos(ws, cols, formatos):
    """Formata as linhas de dados: sublinhado fino, formato por coluna."""
    for r in range(PRIMEIRA, ULTIMA + 1):
        ws.row_dimensions[r].height = 20
        for col in cols:
            c = ws[f"{col}{r}"]
            c.font = fonte()
            c.border = linha_fina()
            c.alignment = Alignment(vertical="center")
            if col in formatos:
                c.number_format = formatos[col]


def meses(inicio_ano, inicio_mes, n):
    return [date(inicio_ano + (inicio_mes - 1 + k) // 12, (inicio_mes - 1 + k) % 12 + 1, 1) for k in range(n)]


wb = Workbook()

# ═════════════════════════════════════ Config (oculta) ═══════════════════════
cfg = wb.active
cfg.title = "Config"
cfg["A1"] = "Parâmetros do contrato (Anexo II) e listas das abas. Não altere."
PARAM = {}
for i, (chave, nome, valor) in enumerate([
        ("media", "Média de referência por mês", 5000),
        ("ganho", "Resultado acumulado por parcela", 1250),
        ("parcela", "Valor de cada parcela", 750),
        ("maxparc", "Máximo de parcelas", 6),
        ("maxmes", "Máximo de parcelas pagas por mês", 2),
        ("fim", "Último mês que libera parcela", date(2027, 12, 1)),
        ("cancel", "Dias para o cancelamento descontar", 30)], start=3):
    cfg[f"A{i}"] = nome
    cfg[f"B{i}"] = valor
    if isinstance(valor, date):
        cfg[f"B{i}"].number_format = MES
    PARAM[chave] = f"Config!$B${i}"
LISTAS = {}
for col, nome, itens in [("D", "Serviços", SERVICOS), ("E", "Motivos", MOTIVOS), ("F", "Sim/Não", ["Não", "Sim"]),
                         ("G", "Resultado", ["Em aberto", "Ganhou", "Perdeu"]), ("H", "Fechado", ["Sim"])]:
    cfg[f"{col}2"] = nome
    for k, item in enumerate(itens, start=3):
        cfg[f"{col}{k}"] = item
    LISTAS[nome] = f"Config!${col}$3:${col}${2 + len(itens)}"
cfg.sheet_state = "hidden"

# ═════════════════════════════════════ Comece aqui ═══════════════════════════
ws = wb.create_sheet("Comece aqui", 0)
preparar(ws, {"A": 3, "B": 7, "C": 34, "D": 70, "E": 3}, VINHO)
cabeca(ws, "Relatório mensal", "Contrato MecTRIA × Triângulo Solutions · Anexo IV")

ws["B5"] = "TODO MÊS, ATÉ O DIA 5"
ws["B5"].font = fonte(10, True, CINZA)
passos = [
    ("1", "Lance as vendas do mês", "Aba Vendas. Cada contrato assinado vira uma linha: cliente, serviço, data e valor. "
                                     "Se um contrato for cancelado em até 30 dias, marque Sim e a data do cancelamento."),
    ("2", "Atualize as propostas", "Aba Propostas. Cada proposta apresentada vira uma linha. "
                                    "Quando o cliente decidir, preencha o resultado."),
    ("3", "Feche o mês no Painel", "Aba Painel. Escolha Sim na coluna \"Mês fechado?\" e avise por e-mail: "
                                    "triangulosolutionsbrasil@gmail.com. Mês sem venda também se fecha."),
]
r = 6
for num, titulo, texto in passos:
    ws[f"B{r}"] = num
    ws[f"B{r}"].font = fonte(26, True, VINHO)
    ws[f"B{r}"].alignment = Alignment(horizontal="center", vertical="center")
    ws[f"C{r}"] = titulo
    ws[f"C{r}"].font = fonte(13, True)
    ws[f"C{r}"].alignment = Alignment(vertical="center", wrap_text=True)
    ws[f"D{r}"] = texto
    ws[f"D{r}"].font = fonte(11)
    ws[f"D{r}"].alignment = Alignment(vertical="center", wrap_text=True)
    for col in "BCD":
        ws[f"{col}{r}"].fill = FUNDO_NEVOA
    ws.row_dimensions[r].height = 50
    ws.row_dimensions[r + 1].height = 6
    r += 2

ws[f"B{r}"] = "DEPOIS"
ws[f"B{r}"].font = fonte(10, True, CINZA)
r += 1
for texto in ["Até o dia 10, a Triângulo confere e confirma o valor do mês.",
              "Até o dia 15, a MecTRIA paga as parcelas do mês ou aponta o erro por escrito."]:
    ws[f"C{r}"] = "•  " + texto
    ws[f"C{r}"].font = fonte(11)
    r += 1

r += 1
ws[f"B{r}"] = "BOM SABER"
ws[f"B{r}"].font = fonte(10, True, CINZA)
r += 1
for texto in ["Só as Vendas mudam o pagamento. As Propostas medem o projeto: a meta é fechar 40% das propostas decididas.",
              "Errou? Corrija a linha. Tudo é recalculado sozinho.",
              "O Painel é só leitura. A única coisa que se preenche nele é a coluna \"Mês fechado?\"."]:
    ws[f"C{r}"] = "•  " + texto
    ws[f"C{r}"].font = fonte(11)
    r += 1

r += 1
ws[f"B{r}"] = "LEGENDA"
ws[f"B{r}"].font = fonte(10, True, CINZA)
r += 1
ws[f"C{r}"] = "Campo para preencher"
ws[f"C{r}"].border = linha_fina(GRAFITE)
ws[f"C{r}"].font = fonte(11, color=CINZA, italic=True)
ws[f"D{r}"] = "Linha embaixo, fundo branco. Algumas têm lista: clique na célula e escolha."
ws[f"D{r}"].font = fonte(11)
r += 1
ws[f"C{r}"] = "Calculado sozinho"
ws[f"C{r}"].fill = FUNDO_NEVOA
ws[f"C{r}"].font = fonte(11, color=CINZA, italic=True)
ws[f"D{r}"] = "Fundo cinza claro. Não precisa mexer."
ws[f"D{r}"].font = fonte(11)

# ═════════════════════════════════════ Vendas ════════════════════════════════
ws = wb.create_sheet("Vendas")
preparar(ws, {"A": 3, "B": 30, "C": 26, "D": 16, "E": 17, "F": 12, "G": 16, "H": 34}, GRAFITE)
cabeca(ws, "Vendas", "Um contrato assinado por linha. É isto que define o pagamento das parcelas.")
colunas(ws, 5, [
    ("B", "Cliente", "Nome da empresa · ex.: Indústria Silva Ltda"),
    ("C", "Serviço", "Escolha na lista"),
    ("D", "Data da assinatura", "ex.: 14/12/2026"),
    ("E", "Valor do contrato", "Valor total · ex.: 7.900,00"),
    ("F", "Cancelou?", "Só desconta se for em até 30 dias"),
    ("G", "Data do cancelamento", "Só se cancelou"),
    ("H", "Observação", "Opcional"),
])
campos(ws, "BCDEFGH", {"D": DATA, "E": MOEDA, "G": DATA})
validar(ws, f"C{PRIMEIRA}:C{ULTIMA}", f"={LISTAS['Serviços']}", "Serviço", "Escolha o serviço vendido.")
validar(ws, f"F{PRIMEIRA}:F{ULTIMA}", f"={LISTAS['Sim/Não']}", "Cancelou?",
        "Deixe em branco ou Não. Sim só se o contrato foi cancelado; o desconto vale para cancelamento em até 30 dias.")
ajuda(ws, f"D{PRIMEIRA}:D{ULTIMA}", "Data da assinatura", "Digite a data, ex.: 14/12/2026.", "date",
      operator="greaterThan", formula1="DATE(2025,1,1)", error="Digite uma data, ex.: 14/12/2026.")
ajuda(ws, f"E{PRIMEIRA}:E{ULTIMA}", "Valor do contrato", "Valor total do contrato, sem R$. ex.: 7900", "decimal",
      operator="greaterThanOrEqual", formula1="0", error="Digite só o número, ex.: 7900.")
ajuda(ws, f"G{PRIMEIRA}:G{ULTIMA}", "Data do cancelamento", "Só se cancelou. ex.: 20/12/2026.", "date",
      operator="greaterThan", formula1="DATE(2025,1,1)", error="Digite uma data, ex.: 20/12/2026.")
# auxiliares ocultas: mês da venda, se o cancelamento desconta e o mês do desconto
for r in range(PRIMEIRA, ULTIMA + 1):
    ws[f"J{r}"] = f'=IF(D{r}="","",DATE(YEAR(D{r}),MONTH(D{r}),1))'
    ws[f"K{r}"] = f'=IF(AND(F{r}="Sim",G{r}<>"",D{r}<>""),IF(G{r}-D{r}<={PARAM["cancel"]},"Sim","Não"),"")'
    ws[f"L{r}"] = f'=IF(K{r}="Sim",DATE(YEAR(G{r}),MONTH(G{r}),1),"")'
for col in "JKL":
    ws.column_dimensions[col].hidden = True
ws.conditional_formatting.add(f"B{PRIMEIRA}:H{ULTIMA}",
                              FormulaRule(formula=[f'$K{PRIMEIRA}="Sim"'], font=fonte(color="9A9A9A", strike=True)))
ws.freeze_panes = f"B{PRIMEIRA}"

# ═════════════════════════════════════ Propostas ═════════════════════════════
ws = wb.create_sheet("Propostas")
preparar(ws, {"A": 3, "B": 28, "C": 24, "D": 16, "E": 14, "F": 15, "G": 13, "H": 13, "I": 14, "J": 15,
              "K": 22, "L": 28}, GRAFITE)
cabeca(ws, "Propostas", "Uma proposta apresentada por linha. Mede o projeto e não muda o pagamento.")
colunas(ws, 5, [
    ("B", "Cliente", "ex.: Comércio Modelo"),
    ("C", "Serviço", "Escolha na lista"),
    ("D", "Quem apresentou", "Nome do closer"),
    ("E", "Data da apresentação", "ex.: 10/12/2026"),
    ("F", "Valor proposto", "ex.: 9.800,00"),
    ("G", "Usou a apresentação nova?", "Sim ou Não"),
    ("H", "Resultado", "Em aberto, Ganhou ou Perdeu"),
    ("I", "Data do resultado", "Quando o cliente decidiu"),
    ("J", "Valor fechado", "Só se ganhou"),
    ("K", "Por que perdeu?", "Só se perdeu"),
    ("L", "Observação", "Opcional"),
])
campos(ws, "BCDEFGHIJKL", {"E": DATA, "F": MOEDA, "I": DATA, "J": MOEDA})
validar(ws, f"C{PRIMEIRA}:C{ULTIMA}", f"={LISTAS['Serviços']}", "Serviço", "Escolha o serviço da proposta.")
validar(ws, f"G{PRIMEIRA}:G{ULTIMA}", f"={LISTAS['Sim/Não']}", "Apresentação nova",
        "Sim se a reunião usou a apresentação nova do projeto.")
validar(ws, f"H{PRIMEIRA}:H{ULTIMA}", f"={LISTAS['Resultado']}", "Resultado",
        "Em aberto enquanto o cliente não decide. Depois, Ganhou ou Perdeu e a data.")
validar(ws, f"K{PRIMEIRA}:K{ULTIMA}", f"={LISTAS['Motivos']}", "Por que perdeu?", "O principal motivo, na lista.")
for col, tit in (("E", "Data da apresentação"), ("I", "Data do resultado")):
    ajuda(ws, f"{col}{PRIMEIRA}:{col}{ULTIMA}", tit, "Digite a data, ex.: 10/12/2026.", "date",
          operator="greaterThan", formula1="DATE(2025,1,1)", error="Digite uma data, ex.: 10/12/2026.")
for col, tit in (("F", "Valor proposto"), ("J", "Valor fechado")):
    ajuda(ws, f"{col}{PRIMEIRA}:{col}{ULTIMA}", tit, "Digite só o número, sem R$. ex.: 9800", "decimal",
          operator="greaterThanOrEqual", formula1="0", error="Digite só o número, ex.: 9800.")
# auxiliares ocultas: mês da apresentação e mês do resultado
for r in range(PRIMEIRA, ULTIMA + 1):
    ws[f"N{r}"] = f'=IF(E{r}="","",DATE(YEAR(E{r}),MONTH(E{r}),1))'
    ws[f"O{r}"] = f'=IF(OR(I{r}="",H{r}="",H{r}="Em aberto"),"",DATE(YEAR(I{r}),MONTH(I{r}),1))'
for col in "NO":
    ws.column_dimensions[col].hidden = True
ws.conditional_formatting.add(f"H{PRIMEIRA}:H{ULTIMA}",
                              FormulaRule(formula=[f'$H{PRIMEIRA}="Ganhou"'], font=fonte(bold=True, color=VINHO)))
ws.conditional_formatting.add(f"B{PRIMEIRA}:L{ULTIMA}",
                              FormulaRule(formula=[f'$H{PRIMEIRA}="Perdeu"'], font=fonte(color="9A9A9A")))
ws.freeze_panes = f"B{PRIMEIRA}"

# ═════════════════════════════════════ Painel ════════════════════════════════
ws = wb.create_sheet("Painel")
preparar(ws, {"A": 3, "B": 15, "C": 13, "D": 16, "E": 17, "F": 13, "G": 13, "H": 16, "I": 13, "J": 26,
              "K": 3, "N": 10}, VINHO)
cabeca(ws, "Painel", "Calculado sozinho. Feche cada mês na coluna \"Mês fechado?\" quando o relatório estiver pronto.")

V = lambda col: f"Vendas!${col}${PRIMEIRA}:${col}${ULTIMA}"
P = lambda col: f"Propostas!${col}${PRIMEIRA}:${col}${ULTIMA}"

# ── tabela de pagamento ──
T1 = 13                               # cabeçalho
pag = meses(2026, 12, 16)              # dez/2026 a mar/2028
S, E1 = T1 + 2, T1 + 2 + len(pag) - 1  # primeira e última linha de dados
ws[f"B{T1 - 1}"] = "PAGAMENTO · regras do Anexo II do contrato"
ws[f"B{T1 - 1}"].font = fonte(10, True, CINZA)
colunas(ws, T1, [
    ("B", "Mês", ""),
    ("C", "Mês fechado?", "Escolha Sim"),
    ("D", "Vendido no mês", "Vendas − cancelamentos"),
    ("E", "Resultado acumulado", "Vendido − R$ 5.000 por mês"),
    ("F", "Parcelas liberadas", "1 a cada R$ 1.250"),
    ("G", "Parcelas do mês", "Até 2 por mês"),
    ("H", "Valor a pagar", "R$ 750 por parcela"),
    ("I", "Vence em", "Dia 15"),
    ("J", "Situação", ""),
])
for r, mes in zip(range(S, E1 + 1), pag):
    pos_2027 = mes > date(2027, 12, 1)
    ws[f"B{r}"] = mes
    ws[f"B{r}"].number_format = MES
    ws[f"B{r}"].font = fonte(11, True, CINZA if pos_2027 else GRAFITE)
    ws[f"B{r}"].alignment = Alignment(horizontal="left")
    c = ws[f"C{r}"]
    c.font = fonte(11, True, VINHO)
    c.border = linha_fina(GRAFITE)
    c.alignment = Alignment(horizontal="center")
    c.protection = Protection(locked=False)
    f = f'$C{r}="Sim"'
    if pos_2027:
        ws[f"D{r}"] = "–"
        ws[f"E{r}"] = "–"
        ws[f"N{r}"] = ""
    else:
        ws[f"D{r}"] = (f'=IF({f},SUMIFS({V("E")},{V("J")},$B{r})-SUMIFS({V("E")},{V("L")},$B{r}),"")')
        ws[f"E{r}"] = (f'=IF({f},SUMIFS($D${S}:$D{r},$C${S}:$C{r},"Sim")'
                       f'-{PARAM["media"]}*COUNTIFS($C${S}:$C{r},"Sim"),"")')
        # auxiliar oculta: parcelas pela conta, antes da trava
        ws[f"N{r}"] = f'=IF(E{r}="","",MIN({PARAM["maxparc"]},MAX(0,INT(E{r}/{PARAM["ganho"]}))))'
    ws[f"F{r}"] = f'=IF({f},MAX($N${S}:$N{r}),"")'
    anteriores = "0" if r == S else f"SUM($G${S}:$G{r - 1})"
    ws[f"G{r}"] = f'=IF({f},MIN({PARAM["maxmes"]},F{r}-{anteriores}),"")'
    ws[f"H{r}"] = f'=IF(G{r}="","",G{r}*{PARAM["parcela"]})'
    ws[f"I{r}"] = f'=IF(N(G{r})>0,DATE(YEAR($B{r}),MONTH($B{r})+1,15),"")'
    ws[f"J{r}"] = (f'=IF(NOT({f}),"",IF(SUM($G${S}:$G{r})>={PARAM["maxparc"]},'
                   f'IF(G{r}>0,"Pagar · quita o contrato","Quitado"),'
                   f'IF(G{r}>0,"Pagar até o dia 15","Sem parcela no mês")))')
    for col, fmt in zip("DEFGHIJ", [MOEDA, MOEDA, INTEIRO, INTEIRO, MOEDA, DATA, "@"]):
        cel = ws[f"{col}{r}"]
        cel.number_format = fmt
        cel.fill = FUNDO_NEVOA
        cel.font = fonte(11, bold=col in "HJ", color=CINZA if pos_2027 and col in "DE" else GRAFITE)
        cel.alignment = Alignment(horizontal="right" if col in "DEFGHI" else "left")
    ws.row_dimensions[r].height = 20
ws.column_dimensions["N"].hidden = True
validar(ws, f"C{S}:C{E1}", f"={LISTAS['Fechado']}", "Mês fechado?",
        "Escolha Sim quando as abas Vendas e Propostas estiverem atualizadas com este mês. Depois, avise por e-mail.")
ws[f"B{E1 + 1}"] = "De jan. a mar./2028 só se pagam parcelas já liberadas até dez./2027."
ws[f"B{E1 + 1}"].font = fonte(9, color=CINZA, italic=True)

# ── tabela comercial ──
T2 = E1 + 4
com = meses(2026, 10, 15)               # out/2026 a dez/2027
S2, E2 = T2 + 2, T2 + 2 + len(com) - 1
ws[f"B{T2 - 1}"] = "COMERCIAL · mede o projeto e não muda o pagamento"
ws[f"B{T2 - 1}"].font = fonte(10, True, CINZA)
colunas(ws, T2, [
    ("B", "Mês", ""),
    ("C", "Propostas", "Apresentadas no mês"),
    ("D", "Ganhou", "Decididas no mês"),
    ("E", "Perdeu", "Decididas no mês"),
    ("F", "Taxa de fechamento", "Meta: 40%"),
    ("G", "Apresentação nova", "% das propostas"),
    ("H", "Desconto médio", "Fechado × proposto"),
    ("I", "Ticket médio", "Por proposta ganha"),
    ("J", "", ""),
])
for r, mes in zip(range(S2, E2 + 1), com):
    base = mes < date(2026, 12, 1)
    a = f"$B{r}"
    ws[f"B{r}"] = mes
    ws[f"B{r}"].number_format = MES
    ws[f"B{r}"].font = fonte(11, True, CINZA if base else GRAFITE)
    ws[f"B{r}"].alignment = Alignment(horizontal="left")
    ganhou = f'SUMIFS({P("J")},{P("O")},{a},{P("H")},"Ganhou")'
    proposto = f'SUMIFS({P("F")},{P("O")},{a},{P("H")},"Ganhou")'
    vals = {
        "C": f"=COUNTIFS({P('N')},{a})",
        "D": f'=COUNTIFS({P("O")},{a},{P("H")},"Ganhou")',
        "E": f'=COUNTIFS({P("O")},{a},{P("H")},"Perdeu")',
        "F": f'=IF(D{r}+E{r}=0,"",D{r}/(D{r}+E{r}))',
        "G": f'=IF(C{r}=0,"",COUNTIFS({P("N")},{a},{P("G")},"Sim")/C{r})',
        "H": f'=IF({proposto}=0,"",1-{ganhou}/{proposto})',
        "I": f'=IF(D{r}=0,"",{ganhou}/D{r})',
    }
    for col, fmt in zip("CDEFGHI", [INTEIRO, INTEIRO, INTEIRO, PCT, PCT, PCT, MOEDA]):
        cel = ws[f"{col}{r}"]
        cel.value = vals[col]
        cel.number_format = fmt
        cel.fill = FUNDO_NEVOA
        cel.font = fonte(11, bold=col == "F", color=CINZA if base else GRAFITE)
        cel.alignment = Alignment(horizontal="right")
    if base:
        ws[f"J{r}"] = "antes do projeto"
        ws[f"J{r}"].font = fonte(9, color=CINZA, italic=True)
    ws.row_dimensions[r].height = 20
TOT = E2 + 1
ws[f"B{TOT}"] = "Desde dez/2026"
ws[f"B{TOT}"].font = fonte(11, True, VINHO)
dez = S2 + 2                            # linha de dez/2026
tot = {
    "C": f"=SUM(C{dez}:C{E2})",
    "D": f"=SUM(D{dez}:D{E2})",
    "E": f"=SUM(E{dez}:E{E2})",
    "F": f'=IF(D{TOT}+E{TOT}=0,"",D{TOT}/(D{TOT}+E{TOT}))',
    "G": f'=IF(C{TOT}=0,"",COUNTIFS({P("N")},">="&$B${dez},{P("G")},"Sim")/C{TOT})',
}
for col, fmt in zip("CDEFG", [INTEIRO, INTEIRO, INTEIRO, PCT, PCT]):
    cel = ws[f"{col}{TOT}"]
    cel.value = tot[col]
    cel.number_format = fmt
    cel.font = fonte(11, True, VINHO)
    cel.alignment = Alignment(horizontal="right")
    cel.border = Border(top=Side(style="thin", color=VINHO))
ws[f"B{TOT}"].border = Border(top=Side(style="thin", color=VINHO))
ws.conditional_formatting.add(f"F{S2}:F{E2}",
                              FormulaRule(formula=[f'AND(ISNUMBER(F{S2}),F{S2}>=0.4)'], font=fonte(bold=True, color=VINHO)))

# ── cartões de resumo (linhas 5 a 10) ──
ULT = f"$N$5"                            # auxiliar oculta: último mês fechado
ws[ULT.replace("$", "")] = f'=SUMPRODUCT(MAX(($C${S}:$C${E1}="Sim")*$B${S}:$B${E1}))'
linha_do = lambda col: f'INDEX(${col}${S}:${col}${E1},MATCH({ULT},$B${S}:$B${E1},0))'
linha_com = lambda col: f'INDEX(${col}${S2}:${col}${E2},MATCH({ULT},$B${S2}:$B${E2},0))'
cartoes = [
    ("B", "C", "Último mês fechado", f'=IF({ULT}=0,"nenhum",{ULT})', MES, "Feche o mês na tabela abaixo"),
    ("D", "E", "Vendido no mês", f'=IF({ULT}=0,"–",IFERROR({linha_do("D")},"–"))', MOEDA,
     "Base do pagamento"),
    ("F", "G", "Taxa de fechamento no mês", f'=IF({ULT}=0,"–",IFERROR(IF({linha_com("F")}="","–",{linha_com("F")}),"–"))',
     PCT, "Meta: 40% · só conta proposta decidida"),
    ("H", "J", "Parcelas pagas", f'=SUM($G${S}:$G${E1})&" de "&{PARAM["maxparc"]}', "@",
     None),
]
for c1, c2, rotulo, formula, fmt, nota in cartoes:
    ws.merge_cells(f"{c1}5:{c2}5")
    ws.merge_cells(f"{c1}6:{c2}7")
    ws.merge_cells(f"{c1}8:{c2}8")
    ws[f"{c1}5"] = rotulo
    ws[f"{c1}5"].font = fonte(10, True, CINZA)
    ws[f"{c1}6"] = formula
    ws[f"{c1}6"].font = fonte(24, True, VINHO)
    ws[f"{c1}6"].number_format = fmt
    ws[f"{c1}6"].alignment = Alignment(horizontal="left", vertical="center")
    if nota:
        ws[f"{c1}8"] = nota
    ws[f"{c1}8"].font = fonte(9, color=CINZA, italic=True)
    for rr in range(5, 9):
        for cc in range(ws[f"{c1}5"].column, ws[f"{c2}5"].column + 1):
            ws.cell(row=rr, column=cc).fill = FUNDO_NEVOA
ws["H8"] = (f'=IF({ULT}=0,"",IF(N({linha_do("H")})>0,"A pagar no mês: R$ "&FIXED({linha_do("H")},2,FALSE),'
            f'"Nada a pagar no mês"))')
ws.row_dimensions[6].height = 24
ws.row_dimensions[7].height = 24

ws.protection.sheet = True
ws.protection.formatCells = False
ws.protection.formatColumns = False
ws.freeze_panes = "A4"

wb.move_sheet("Config", offset=len(wb.sheetnames) - 1 - wb.sheetnames.index("Config"))
for aba in wb.worksheets:
    aba.sheet_view.tabSelected = aba.title == "Comece aqui"
wb.active = 0
wb.save(sys.argv[1])
print(sys.argv[1])
