"""Gera o PDF do contrato a partir da minuta em markdown.

Uso: python3 contrato/gerar-pdf.py contrato/minuta-contrato-vN.md saida.pdf [rótulo]

Versão de assinatura: passe o CPF do interveniente pela variável de ambiente CPF_INTERVENIENTE
e grave a saída fora do repositório (CPF não é versionado).

Tira a nota interna do topo, troca as marcações [PREENCHER] por linhas em branco
e monta o bloco de assinaturas (assinatura eletrônica: sem testemunhas nem rubricas). Depende de reportlab e das fontes Liberation.
"""
import os
import re
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)
from reportlab.pdfgen import canvas

FONTES = "/usr/share/fonts/truetype/liberation/"
for nome, arquivo in [("Serif", "LiberationSerif-Regular"), ("Serif-B", "LiberationSerif-Bold"),
                      ("Serif-I", "LiberationSerif-Italic"), ("Serif-BI", "LiberationSerif-BoldItalic"),
                      ("Sans", "LiberationSans-Regular"), ("Sans-B", "LiberationSans-Bold")]:
    pdfmetrics.registerFont(TTFont(nome, FONTES + arquivo + ".ttf"))
pdfmetrics.registerFontFamily("Serif", normal="Serif", bold="Serif-B", italic="Serif-I", boldItalic="Serif-BI")

TINTA = colors.HexColor("#1A1A1A")
CINZA = colors.HexColor("#6B6B6B")
LINHA = colors.HexColor("#BDBDBD")
FUNDO = colors.HexColor("#F1F0EE")
DESTAQUE = colors.HexColor("#8A2A30")

LARGURA, ALTURA = A4
MARGEM_X, MARGEM_TOPO, MARGEM_BASE = 2.3 * cm, 2.4 * cm, 2.2 * cm
UTIL = LARGURA - 2 * MARGEM_X - 12  # o frame do reportlab tem 6 pt de respiro de cada lado

E = {
    "titulo": ParagraphStyle("titulo", fontName="Serif-B", fontSize=13.5, leading=18, alignment=TA_CENTER,
                             textColor=TINTA, spaceAfter=4),
    "subtitulo": ParagraphStyle("subtitulo", fontName="Sans", fontSize=8.5, leading=12, alignment=TA_CENTER,
                                textColor=CINZA, spaceAfter=16),
    "anexo": ParagraphStyle("anexo", fontName="Serif-B", fontSize=12.5, leading=17, alignment=TA_CENTER,
                            textColor=TINTA, spaceAfter=12),
    "clausula": ParagraphStyle("clausula", fontName="Serif-B", fontSize=10.5, leading=14, textColor=DESTAQUE,
                               spaceBefore=11, spaceAfter=4, keepWithNext=True),
    "sub": ParagraphStyle("sub", fontName="Serif-B", fontSize=10.5, leading=14, textColor=TINTA,
                          spaceBefore=9, spaceAfter=4, keepWithNext=True),
    "corpo": ParagraphStyle("corpo", fontName="Serif", fontSize=10.5, leading=14.6, alignment=TA_JUSTIFY,
                            textColor=TINTA, spaceAfter=5),
    "item": ParagraphStyle("item", fontName="Serif", fontSize=10.5, leading=14.6, alignment=TA_JUSTIFY,
                           textColor=TINTA, leftIndent=22, bulletIndent=8, spaceAfter=3),
    "celula": ParagraphStyle("celula", fontName="Serif", fontSize=8.8, leading=11.4, textColor=TINTA,
                             alignment=TA_LEFT),
    "celula_cab": ParagraphStyle("celula_cab", fontName="Serif-B", fontSize=8.8, leading=11.4, textColor=TINTA),
    "assin": ParagraphStyle("assin", fontName="Serif", fontSize=9.5, leading=12.5, alignment=TA_CENTER,
                            textColor=TINTA),
    "assin_rot": ParagraphStyle("assin_rot", fontName="Sans-B", fontSize=7.5, leading=10, alignment=TA_CENTER,
                                textColor=CINZA, spaceAfter=26),
}

BRANCO_CPF = "CPF nº ______________________"
CPF_INTERVENIENTE = os.environ.get("CPF_INTERVENIENTE", "").strip()
CPF_MARCELO = f"CPF nº {CPF_INTERVENIENTE}" if CPF_INTERVENIENTE else BRANCO_CPF
BRANCO_CURTO = "______________"


def preencher_brancos(texto):
    # o único CPF que fica no contrato é o do interveniente
    texto = re.sub(r"CPF \[PREENCHER[^\]]*\]", CPF_MARCELO, texto)
    texto = texto.replace("[PREENCHER: data]", "_____ de ____________________ de 2026")
    texto = texto.replace("[PREENCHER: mês]", "____________________")
    return re.sub(r"\[PREENCHER[^\]]*\]", BRANCO_CURTO, texto)


def inline(texto):
    texto = texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    texto = re.sub(r'"([^"]+)"', "“\\1”", texto)
    texto = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", texto)
    return texto


def tabela(linhas):
    celulas = [[c.strip() for c in l.strip().strip("|").split("|")] for l in linhas]
    cab, corpo = celulas[0], [r for r in celulas[2:]]
    n = len(cab)
    # cada coluna tem no mínimo a largura da sua palavra mais longa (nada quebra no meio da palavra);
    # o espaço que sobra é dividido pelo tamanho do texto de cada coluna
    minimos, pesos = [], []
    for i in range(n):
        textos = [re.sub(r"\*\*", "", r[i]) for r in corpo]
        palavras = [w for t in textos + [cab[i]] for w in t.split()] or ["x"]
        minimos.append(max(pdfmetrics.stringWidth(w, "Serif-B", 8.8) for w in palavras) + 14)
        pesos.append(min(max(max((len(t) for t in textos), default=8), 8), 70))
    sobra = max(UTIL - sum(minimos), 0)
    larguras = [m + sobra * p / sum(pesos) for m, p in zip(minimos, pesos)]
    dados = [[Paragraph(inline(c), E["celula_cab"]) for c in cab]]
    dados += [[Paragraph(inline(c), E["celula"]) for c in r] for r in corpo]
    t = Table(dados, colWidths=larguras, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FUNDO),
        ("GRID", (0, 0), (-1, -1), 0.5, LINHA),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return [t, Spacer(1, 7)]


def assinatura(rotulo, nome, cargo, entidade=None, cpf=True):
    partes = [Paragraph("_" * 42, E["assin"]), Paragraph(f"<b>{nome}</b>", E["assin"]),
              Paragraph(cargo, E["assin"])]
    if entidade:
        partes.append(Paragraph(entidade, E["assin"]))
    if cpf:
        partes.append(Paragraph(cpf if isinstance(cpf, str) else BRANCO_CPF, E["assin"]))
    partes.append(Paragraph(rotulo, E["assin_rot"]))
    return partes


def bloco_assinaturas(fecho):
    col = UTIL / 2
    linha1 = Table([[assinatura("CONTRATADA", "Lucas Cruvinel Boaretto", "Sócio administrador",
                                "Triângulo Solutions Brasil Ltda.", cpf=False),
                     assinatura("CONTRATANTE", "Arthur Menezes Jordão", "Presidente",
                                "Empresa Jr Engenharia Mecânica do Triângulo Mineiro", cpf=False)]],
                   colWidths=[col, col])
    linha2 = Table([[assinatura("INTERVENIENTE", "Marcelo Zaiden",
                                "Vice-Presidente e responsável pelo projeto", cpf=CPF_MARCELO)]], colWidths=[col])
    for t in (linha1, linha2):
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4),
                               ("RIGHTPADDING", (0, 0), (-1, -1), 4)]))
    return [KeepTogether(fecho + [Spacer(1, 26), linha1, linha2])]


def montar(md):
    linhas = md.splitlines()
    inicio = next(i for i, l in enumerate(linhas) if l.startswith("## CONTRATO"))
    linhas = linhas[inicio:]
    historia, i = [], 0
    while i < len(linhas):
        l = preencher_brancos(linhas[i].rstrip())
        if not l or l == "---":
            i += 1
            continue
        if l.startswith("## CONTRATO"):
            historia.append(Paragraph(inline(l[3:]), E["titulo"]))
            historia.append(Paragraph(ROTULO, E["subtitulo"]))
        elif l.startswith("## "):
            historia += [PageBreak(), Paragraph(inline(l[3:].replace(" · ", " — ")), E["anexo"])]
        elif l.startswith("### Cláusula"):
            historia.append(Paragraph(inline(l[4:].replace(" · ", " — ").upper()), E["clausula"]))
        elif l.startswith("### "):
            historia.append(Paragraph(inline(l[4:]), E["sub"]))
        elif l.startswith("| CONTRATADA | CONTRATANTE"):
            fecho = [historia.pop(-2), historia.pop()]  # parágrafo de fecho e data ficam com as assinaturas
            historia += bloco_assinaturas(fecho)
            while i + 1 < len(linhas) and not linhas[i + 1].startswith("## "):
                i += 1
            i += 1
            continue
        elif l.startswith("|"):
            bloco = []
            while i < len(linhas) and linhas[i].startswith("|"):
                bloco.append(preencher_brancos(linhas[i]))
                i += 1
            historia += tabela(bloco)
            continue
        elif l.startswith("- "):
            texto = l[2:]
            m = re.match(r"^([a-z]\))\s+(.*)", texto)
            marcador, texto = (m.group(1), m.group(2)) if m else ("•", texto)
            historia.append(Paragraph(inline(texto), E["item"], bulletText=marcador))
        elif re.match(r"^\d+\. ", l):
            num, texto = l.split(" ", 1)
            historia.append(Paragraph(inline(texto), E["item"], bulletText=num))
        else:
            texto = inline(l)
            texto = re.sub(r"^(\d+\.\d+\.)", r"<b>\1</b>", texto)
            historia.append(Paragraph(texto, E["corpo"]))
        i += 1
    return historia


class CanvasNumerado(canvas.Canvas):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self._paginas = []

    def showPage(self):
        self._paginas.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._paginas)
        for estado in self._paginas:
            self.__dict__.update(estado)
            self._moldura(total)
            super().showPage()
        super().save()

    def _moldura(self, total):
        self.setFont("Sans", 7.5)
        self.setFillColor(CINZA)
        y_topo = ALTURA - MARGEM_TOPO + 0.9 * cm
        self.drawString(MARGEM_X, y_topo, "Contrato de prestação de serviços · Triângulo Solutions × MecTRIA")
        self.drawRightString(LARGURA - MARGEM_X, y_topo, ROTULO.upper())
        self.setStrokeColor(LINHA)
        self.setLineWidth(0.5)
        self.line(MARGEM_X, y_topo - 5, LARGURA - MARGEM_X, y_topo - 5)
        y_base = MARGEM_BASE - 1.0 * cm
        self.line(MARGEM_X, y_base + 11, LARGURA - MARGEM_X, y_base + 11)
        self.drawString(MARGEM_X, y_base, f"Página {self._pageNumber} de {total}")


if __name__ == "__main__":
    origem, destino = sys.argv[1], sys.argv[2]
    ROTULO = sys.argv[3] if len(sys.argv) > 3 else "Minuta para revisão"
    with open(origem, encoding="utf-8") as f:
        historia = montar(f.read())
    doc = SimpleDocTemplate(destino, pagesize=A4, leftMargin=MARGEM_X, rightMargin=MARGEM_X,
                            topMargin=MARGEM_TOPO, bottomMargin=MARGEM_BASE,
                            title="Contrato de Prestação de Serviços · Triângulo Solutions × MecTRIA",
                            author="Triângulo Solutions Brasil Ltda.")
    doc.build(historia, canvasmaker=CanvasNumerado)
    print(destino)
