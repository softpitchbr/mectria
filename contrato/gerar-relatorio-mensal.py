"""Gera a planilha modelo do relatório mensal do contrato (Anexo IV).

Uso: python3 contrato/gerar-relatorio-mensal.py contrato/relatorio-mensal-mectria.xlsx

A MecTRIA preenche as abas Contratos e Propostas e muda o "Último mês informado"
em Parâmetros. Resumo mensal e Extrato são calculados por fórmula. Funciona no
Excel e no Google Sheets (só funções clássicas: SUMIFS, COUNTIFS, INT, MIN, MAX).
Depois de gerar, rode o recalc da skill de planilhas para gravar os valores.
"""
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

FONTE = "Arial"
GRAFITE = "303030"
CINZA = "606060"
ENTRADA = PatternFill("solid", fgColor="FFF2CC")   # células que a MecTRIA preenche
CABEC = PatternFill("solid", fgColor="303030")
AUTO = PatternFill("solid", fgColor="F3F1EE")      # colunas calculadas
FINA = Side(style="thin", color="C8C8C8")
BORDA = Border(left=FINA, right=FINA, top=FINA, bottom=FINA)

MOEDA = '"R$" #,##0.00;-"R$" #,##0.00;"-"'
DATA = "dd/mm/yyyy"
MES = "mmm/yyyy"
PCT = '0.0%;-0.0%;"-"'
LINHAS = 300  # linhas disponíveis em Contratos e Propostas

SERVICOS = ["Desenvolvimento de Produto", "Desenho Técnico", "Prototipagem e Validação",
            "Climatização", "Estruturas Metálicas", "Layout", "Plano de Manutenção", "NR-12",
            "Tratamento Acústico", "Simulação Computacional", "Automação e Controle", "Outro"]
MOTIVOS = ["Preço", "Prazo", "Escolheu concorrente", "Adiou ou desistiu do projeto",
           "Sem resposta", "Escopo não atende", "Outro"]


def f(bold=False, size=10, color=GRAFITE, italic=False):
    return Font(name=FONTE, bold=bold, size=size, color=color, italic=italic)


def titulo(ws, texto, sub=None):
    ws["A1"] = texto
    ws["A1"].font = f(bold=True, size=14)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = f(size=10, color=CINZA, italic=True)


def cabecalho(ws, linha, colunas, larguras):
    for i, (nome, larg) in enumerate(zip(colunas, larguras), start=1):
        c = ws.cell(row=linha, column=i, value=nome)
        c.font = Font(name=FONTE, bold=True, size=10, color="FFFFFF")
        c.fill = CABEC
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = BORDA
        ws.column_dimensions[get_column_letter(i)].width = larg
    ws.row_dimensions[linha].height = 32


def lista(ws, intervalo, opcoes):
    dv = DataValidation(type="list", formula1='"' + ",".join(opcoes) + '"', allow_blank=True)
    dv.error = "Escolha uma opção da lista."
    ws.add_data_validation(dv)
    dv.add(intervalo)


def p(nome):
    """Referência absoluta a um parâmetro."""
    return f"'Parâmetros'!{PARAM[nome]}"


wb = Workbook()

# ── Como preencher ───────────────────────────────────────────────────────────
ws = wb.active
ws.title = "Como preencher"
titulo(ws, "Relatório mensal · Contrato Triângulo Solutions × MecTRIA",
       "Modelo do Anexo IV do contrato. Uma planilha só, atualizada todo mês até o dia 5.")
texto = [
    ("O que é", "É o relatório da cláusula 5.7 do contrato. A parte de VENDAS define o pagamento (Anexo II). "
                "A parte de PROPOSTAS mede o projeto (taxa de fechamento) e não muda o valor de nenhuma parcela."),
    ("Quem preenche", "O responsável pelo projeto na MecTRIA (cláusula 5.1), ou alguém indicado por ele."),
    ("Quando", "Até o dia 5 de cada mês, com os dados do mês anterior. O primeiro é o de dezembro de 2026, até 05/01/2027. "
               "Mês sem venda também precisa ser informado: basta atualizar o campo \"Último mês informado\"."),
    ("Como", "1) Lance cada contrato assinado no mês na aba Contratos. "
             "2) Lance cada proposta apresentada na aba Propostas e atualize a situação das que foram decididas. "
             "3) Na aba Parâmetros, mude o \"Último mês informado\" para o mês que você está fechando. "
             "4) Mande um e-mail para triangulosolutionsbrasil@gmail.com avisando que o relatório do mês está atualizado."),
    ("Depois", "A Triângulo confere e manda o extrato até o dia 10. A MecTRIA paga as parcelas do mês até o dia 15 "
               "ou contesta por escrito até a mesma data, apontando o erro."),
    ("Células", "Amarelo claro = você preenche. Cinza claro = calculado sozinho, não mexa. "
                "As abas Resumo mensal e Extrato são só de leitura."),
    ("Cancelamento", "Contrato cancelado em até 30 dias da assinatura: marque \"Sim\" em Cancelado e a data. "
                     "O valor é descontado no mês do cancelamento. Cancelamento depois de 30 dias não desconta."),
    ("Comprovação", "A Triângulo pode pedir cópia dos contratos ou o registro no portal da Brasil Júnior, "
                    "e a MecTRIA envia em até 10 dias."),
]
r = 4
for rot, txt in texto:
    ws.cell(row=r, column=1, value=rot).font = f(bold=True)
    c = ws.cell(row=r, column=2, value=txt)
    c.font = f()
    c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(row=r, column=1).alignment = Alignment(vertical="top")
    ws.row_dimensions[r].height = 15 * (1 + len(txt) // 95)
    r += 1
ws.column_dimensions["A"].width = 16
ws.column_dimensions["B"].width = 110

r += 1
ws.cell(row=r, column=1, value="Exemplos de preenchimento (só para mostrar o formato; não entram nas contas)").font = f(bold=True)
r += 1
ex_c = ["Contratos:", "Indústria Exemplo Ltda · NR-12 · assinado em 14/12/2026 · R$ 7.900,00 · 3x no boleto · proposta P-012 · Cancelado: Não"]
ex_p = ["Propostas:", "P-012 · Indústria Exemplo Ltda · NR-12 · closer Ana · apresentada em 10/12/2026 · R$ 7.900,00 · "
                     "apresentação nova: Sim · Ganha em 14/12/2026 · fechado por R$ 7.900,00"]
ex_q = ["", "P-013 · Comércio Modelo · Climatização · apresentada em 11/12/2026 · R$ 9.800,00 · Perdida em 20/12/2026 · motivo: Preço"]
for linha in (ex_c, ex_p, ex_q):
    for j, v in enumerate(linha, start=1):
        c = ws.cell(row=r, column=j, value=v)
        c.font = f(italic=True, color=CINZA)
        c.alignment = Alignment(wrap_text=True)
    r += 1

# ── Parâmetros ───────────────────────────────────────────────────────────────
ws = wb.create_sheet("Parâmetros")
titulo(ws, "Parâmetros do contrato", "Valores do Anexo II. Só o \"Último mês informado\" é preenchido pela MecTRIA.")
cabecalho(ws, 4, ["Parâmetro", "Valor", "Origem"], [44, 18, 60])
PARAM = {}
params = [
    ("ultimo", "Último mês informado", None, MES, "Preenchido pela MecTRIA a cada relatório (o 1º dia do mês, ex.: 01/12/2026)."),
    ("media", "Média de referência por mês", 5000, MOEDA, "Anexo II e III: faturamento de 2025 ÷ 12."),
    ("ganho", "Resultado acumulado por parcela", 1250, MOEDA, "Anexo II, regra 1."),
    ("parcela", "Valor de cada parcela", 750, MOEDA, "Cláusula 3.1: 6 parcelas de R$ 750,00."),
    ("maxparc", "Máximo de parcelas", 6, "0", "Cláusula 3.1."),
    ("maxmes", "Máximo de parcelas pagas por mês", 2, "0", "Anexo II, regra 3."),
    ("inicio", "Início da apuração", date(2026, 12, 1), MES, "Anexo II: período de 01/12/2026 a 31/12/2027."),
    ("fim", "Último mês que libera parcela", date(2027, 12, 1), MES, "Anexo II, regra 4: liberação até 31/12/2027."),
    ("cancel", "Dias para o cancelamento descontar", 30, "0", "Anexo II: contrato cancelado em até 30 dias da assinatura."),
]
for i, (chave, nome, valor, fmt, origem) in enumerate(params, start=5):
    ws.cell(row=i, column=1, value=nome).font = f(bold=chave == "ultimo")
    c = ws.cell(row=i, column=2, value=valor)
    c.number_format = fmt
    c.font = f(color="0000FF" if chave != "ultimo" else GRAFITE)
    c.fill = ENTRADA if chave == "ultimo" else PatternFill()
    c.border = BORDA
    ws.cell(row=i, column=3, value=origem).font = f(color=CINZA)
    PARAM[chave] = f"$B${i}"
ws["B5"].comment = Comment("Mude para o mês que você está informando. As linhas do Extrato só são calculadas até este mês.", "Triângulo")
dv = DataValidation(type="date", operator="between", formula1="DATE(2026,10,1)", formula2="DATE(2028,12,1)", allow_blank=True)
dv.error = "Informe uma data (o 1º dia do mês)."
ws.add_data_validation(dv)
dv.add("B5")
ws.freeze_panes = "A5"

# ── Contratos ────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Contratos")
titulo(ws, "Contratos assinados", "Um contrato por linha. É a base do pagamento (Anexo II).")
cols = ["Nº", "Cliente", "Serviço", "Data de assinatura", "Valor total do contrato (R$)", "Forma de pagamento",
        "Nº da proposta", "Cancelado?", "Data do cancelamento", "Desconta na apuração? (automático)",
        "Mês da venda (automático)", "Mês do desconto (automático)", "Observações"]
cabecalho(ws, 4, cols, [6, 30, 26, 14, 16, 18, 12, 11, 14, 16, 13, 13, 30])
for row in range(5, 5 + LINHAS):
    for col in range(1, 14):
        c = ws.cell(row=row, column=col)
        c.font = f()
        c.border = BORDA
        c.fill = AUTO if col in (10, 11, 12) else ENTRADA
    ws.cell(row=row, column=4).number_format = DATA
    ws.cell(row=row, column=5).number_format = MOEDA
    ws.cell(row=row, column=9).number_format = DATA
    ws.cell(row=row, column=11).number_format = MES
    ws.cell(row=row, column=12).number_format = MES
    ws.cell(row=row, column=10).value = (
        f'=IF(OR(D{row}="",H{row}<>"Sim",I{row}=""),"",'
        f'IF(I{row}-D{row}<={p("cancel")},"Sim","Não (após o prazo)"))')
    ws.cell(row=row, column=11).value = f'=IF(D{row}="","",DATE(YEAR(D{row}),MONTH(D{row}),1))'
    ws.cell(row=row, column=12).value = f'=IF(J{row}="Sim",DATE(YEAR(I{row}),MONTH(I{row}),1),"")'
lista(ws, f"C5:C{4 + LINHAS}", SERVICOS)
lista(ws, f"H5:H{4 + LINHAS}", ["Sim", "Não"])
ws.freeze_panes = "C5"

# ── Propostas ────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Propostas")
titulo(ws, "Propostas apresentadas", "Uma proposta por linha. Mede o projeto; não muda o pagamento.")
cols = ["Nº", "Cliente", "Serviço", "Closer", "Data da apresentação", "Valor proposto (R$)",
        "Usou a apresentação nova?", "Situação", "Data da decisão", "Valor fechado (R$)", "Motivo da perda",
        "Observações", "Mês da apresentação (automático)", "Mês da decisão (automático)"]
cabecalho(ws, 4, cols, [7, 28, 24, 16, 14, 15, 13, 12, 14, 15, 22, 28, 14, 14])
for row in range(5, 5 + LINHAS):
    for col in range(1, 15):
        c = ws.cell(row=row, column=col)
        c.font = f()
        c.border = BORDA
        c.fill = AUTO if col in (13, 14) else ENTRADA
    ws.cell(row=row, column=5).number_format = DATA
    ws.cell(row=row, column=6).number_format = MOEDA
    ws.cell(row=row, column=9).number_format = DATA
    ws.cell(row=row, column=10).number_format = MOEDA
    ws.cell(row=row, column=13).number_format = MES
    ws.cell(row=row, column=14).number_format = MES
    ws.cell(row=row, column=13).value = f'=IF(E{row}="","",DATE(YEAR(E{row}),MONTH(E{row}),1))'
    ws.cell(row=row, column=14).value = (
        f'=IF(OR(I{row}="",H{row}="Em aberto",H{row}=""),"",DATE(YEAR(I{row}),MONTH(I{row}),1))')
lista(ws, f"C5:C{4 + LINHAS}", SERVICOS)
lista(ws, f"G5:G{4 + LINHAS}", ["Sim", "Não"])
lista(ws, f"H5:H{4 + LINHAS}", ["Em aberto", "Ganha", "Perdida"])
lista(ws, f"K5:K{4 + LINHAS}", MOTIVOS)
ws.freeze_panes = "C5"

FIM = 4 + LINHAS
C = lambda col: f"Contratos!${col}$5:${col}${FIM}"
P = lambda col: f"Propostas!${col}$5:${col}${FIM}"

# ── Resumo mensal ────────────────────────────────────────────────────────────
ws = wb.create_sheet("Resumo mensal")
titulo(ws, "Resumo mensal", "Calculado sozinho. Out. e nov. de 2026 são a base de comparação, antes da nova estrutura; não entram no pagamento.")
cols = ["Mês", "Vendido no mês (R$)", "Cancelamentos descontados (R$)", "Vendido líquido (R$)", "Contratos assinados",
        "Propostas apresentadas", "Com a apresentação nova", "% com a apresentação nova", "Ganhas no mês",
        "Perdidas no mês", "Taxa de fechamento", "Valor proposto das ganhas (R$)", "Valor fechado das ganhas (R$)",
        "Desconto médio", "Ticket médio (R$)"]
cabecalho(ws, 4, cols, [11, 15, 15, 15, 11, 12, 12, 12, 10, 10, 11, 15, 15, 10, 14])
meses = [date(2026 + (m - 1) // 12, (m - 1) % 12 + 1, 1) for m in range(10, 10 + 15)]  # out/2026 a dez/2027
for i, mes in enumerate(meses, start=5):
    a = f"$A{i}"
    vals = [
        mes,
        f"=SUMIFS({C('E')},{C('K')},{a})",
        f"=SUMIFS({C('E')},{C('L')},{a})",
        f"=B{i}-C{i}",
        f"=COUNTIFS({C('K')},{a})",
        f"=COUNTIFS({P('M')},{a})",
        f'=COUNTIFS({P("M")},{a},{P("G")},"Sim")',
        f'=IF(F{i}=0,"",G{i}/F{i})',
        f'=COUNTIFS({P("N")},{a},{P("H")},"Ganha")',
        f'=COUNTIFS({P("N")},{a},{P("H")},"Perdida")',
        f'=IF(I{i}+J{i}=0,"",I{i}/(I{i}+J{i}))',
        f'=SUMIFS({P("F")},{P("N")},{a},{P("H")},"Ganha")',
        f'=SUMIFS({P("J")},{P("N")},{a},{P("H")},"Ganha")',
        f'=IF(L{i}=0,"",1-M{i}/L{i})',
        f'=IF(I{i}=0,"",M{i}/I{i})',
    ]
    fmts = [MES, MOEDA, MOEDA, MOEDA, "0", "0", "0", PCT, "0", "0", PCT, MOEDA, MOEDA, PCT, MOEDA]
    for j, (v, fmt) in enumerate(zip(vals, fmts), start=1):
        c = ws.cell(row=i, column=j, value=v)
        c.number_format = fmt
        c.font = f(bold=j == 1, color=CINZA if mes < date(2026, 12, 1) else GRAFITE)
        c.border = BORDA
ws["K4"].comment = Comment("Ganhas ÷ (ganhas + perdidas) decididas no mês. Meta do projeto: 40%.", "Triângulo")
ws["N4"].comment = Comment("1 − valor fechado ÷ valor proposto, só das ganhas. A planilha de precificação v4 indica desconto máximo de ~13%.", "Triângulo")
ws.freeze_panes = "B5"

# ── Extrato ──────────────────────────────────────────────────────────────────
ws = wb.create_sheet("Extrato")
titulo(ws, "Extrato do pagamento pelo resultado (Anexo II)",
       "Calculado sozinho até o \"Último mês informado\". Linhas de 2028 só pagam parcelas já liberadas.")
cols = ["Mês", "Vendido líquido (R$)", "Média de referência (R$)", "Diferença (R$)", "Resultado acumulado (R$)",
        "Parcelas pela conta", "Parcelas liberadas (com trava)", "Parcelas pagas no mês", "Total de parcelas pagas",
        "Valor a pagar no mês (R$)", "Vencimento", "Situação"]
cabecalho(ws, 4, cols, [11, 15, 15, 14, 16, 11, 13, 11, 11, 15, 12, 24])
meses_ext = [date(2026 + (m - 1) // 12, (m - 1) % 12 + 1, 1) for m in range(12, 12 + 16)]  # dez/2026 a mar/2028
for i, mes in enumerate(meses_ext, start=5):
    ap = f'AND($A{i}<={p("ultimo")},{p("ultimo")}<>"")'          # mês já informado
    dentro = f'$A{i}<={p("fim")}'                                   # ainda libera parcela
    e_ant = "0" if i == 5 else f"N(E{i - 1})"
    g_ant = "0" if i == 5 else f"N(G{i - 1})"
    i_ant = "0" if i == 5 else f"N(I{i - 1})"
    vals = [
        mes,
        f"=IF(AND({ap},{dentro}),IFERROR(INDEX('Resumo mensal'!$D$5:$D$19,MATCH($A{i},'Resumo mensal'!$A$5:$A$19,0)),0),\"\")",
        f'=IF(AND({ap},{dentro}),{p("media")},"")',
        f'=IF(B{i}="","",B{i}-C{i})',
        f'=IF(D{i}="","",{e_ant}+D{i})',
        f'=IF(E{i}="","",MIN({p("maxparc")},MAX(0,INT(E{i}/{p("ganho")}))))',
        f'=IF({ap},MAX({g_ant},N(F{i})),"")',
        f'=IF(G{i}="","",MIN({p("maxmes")},G{i}-{i_ant}))',
        f'=IF(H{i}="","",{i_ant}+H{i})',
        f'=IF(H{i}="","",H{i}*{p("parcela")})',
        f"=DATE(YEAR($A{i}),MONTH($A{i})+1,15)",
        f'=IF(I{i}="","",IF(I{i}>={p("maxparc")},IF(H{i}>0,"Pagar até o vencimento · quita o contrato","Quitado"),IF(H{i}>0,"Pagar até o vencimento","Sem parcela no mês")))',
    ]
    fmts = [MES, MOEDA, MOEDA, MOEDA, MOEDA, "0", "0", "0", "0", MOEDA, DATA, "@"]
    for j, (v, fmt) in enumerate(zip(vals, fmts), start=1):
        c = ws.cell(row=i, column=j, value=v)
        c.number_format = fmt
        c.font = f(bold=j in (1, 10, 12))
        c.border = BORDA
        if j >= 2:
            c.fill = AUTO
ws["G4"].comment = Comment("Parcela liberada não volta a ficar suspensa (Anexo II, regra 2).", "Triângulo")
ws["K4"].comment = Comment("Dia 15 do mês seguinte (Anexo II, regra 5). A Triângulo manda o extrato até o dia 10.", "Triângulo")
ws.freeze_panes = "B5"

for sheet in wb.worksheets:
    sheet.sheet_view.showGridLines = sheet.title in ("Contratos", "Propostas")

wb.save(sys.argv[1])
print(sys.argv[1])
