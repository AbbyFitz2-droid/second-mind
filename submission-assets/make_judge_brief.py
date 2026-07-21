"""Generate the one-page Second Mind judge brief."""

from pathlib import Path
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


INK = colors.HexColor("#18211f")
SAGE = colors.HexColor("#5f7a68")
MUTED = colors.HexColor("#66706d")
LINE = colors.HexColor("#d9d5ca")
PAPER = colors.HexColor("#f7f4ec")
CARD = colors.HexColor("#fffdf8")


def paragraph(text, style):
    return Paragraph(text, style)


def card(content, width, padding=10):
    table = Table([[content]], colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CARD),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), padding),
                ("RIGHTPADDING", (0, 0), (-1, -1), padding),
                ("TOPPADDING", (0, 0), (-1, -1), padding - 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), padding - 1),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, 23 * mm, A4[0] - doc.rightMargin, 23 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.2)
    footer = "Abby Fitzgerald (solo) | Ireland | Built with Codex + GPT-5.6 | Evidence first, in product and process."
    canvas.drawString(doc.leftMargin, 16 * mm, footer)
    canvas.restoreState()


def build(output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=29 * mm,
        title="Second Mind by Cognisyn - Judge Brief",
        author="Abby Fitzgerald",
        subject="OpenAI Build Week 2026 submission brief",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="brief", frames=[frame], onPage=draw_page)])

    base = getSampleStyleSheet()
    eyebrow = ParagraphStyle(
        "Eyebrow",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=7.6,
        leading=9,
        textColor=SAGE,
        spaceAfter=4,
        tracking=0.5,
    )
    title = ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName="Times-Roman",
        fontSize=30,
        leading=32,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=2,
    )
    tagline = ParagraphStyle(
        "Tagline",
        parent=base["Normal"],
        fontName="Times-Roman",
        fontSize=12.5,
        leading=15,
        textColor=SAGE,
        spaceAfter=9,
    )
    intro = ParagraphStyle(
        "Intro",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=9.4,
        leading=13,
        textColor=INK,
        spaceAfter=9,
    )
    section = ParagraphStyle(
        "Section",
        parent=eyebrow,
        fontSize=7.8,
        leading=9.5,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=11.1,
        textColor=INK,
        spaceAfter=2.5,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=7.4,
        leading=9.5,
        textColor=MUTED,
    )
    number = ParagraphStyle(
        "Number",
        parent=body,
        fontSize=12,
        leading=13,
        textColor=SAGE,
        alignment=TA_LEFT,
    )
    link_color = "#466554"

    story = [
        paragraph("OPENAI BUILD WEEK 2026  |  APPS FOR YOUR LIFE  |  JUDGE BRIEF", eyebrow),
        paragraph("Second Mind <font name='Times-Italic' size='16' color='#66706d'>by Cognisyn</font>", title),
        paragraph("Context before composition. Think clearly. Stay yours.", tagline),
        paragraph(
            "Second Mind turns naturally captured <b>messages, notes, events, and screenshots</b> into evidence-linked, revisable context. It then helps people reason and communicate without turning an AI inference into fact or surrendering human agency.",
            intro,
        ),
    ]

    verify = [
        paragraph("VERIFY IN 60 SECONDS", section),
        paragraph(
            f"<b>Demo video (2:28)</b> &nbsp; <link href='https://youtu.be/n53Rs-6uDO4' color='{link_color}'>youtu.be/n53Rs-6uDO4</link>",
            body,
        ),
        paragraph(
            f"<b>Browser-ready app</b> &nbsp; <link href='https://codespaces.new/AbbyFitz2-droid/second-mind?quickstart=1' color='{link_color}'>codespaces.new/AbbyFitz2-droid/second-mind?quickstart=1</link> &nbsp; (then: npm start)",
            body,
        ),
        paragraph(
            f"<b>Repository</b> &nbsp; <link href='https://github.com/AbbyFitz2-droid/second-mind' color='{link_color}'>github.com/AbbyFitz2-droid/second-mind</link> &nbsp; (public, MIT)",
            body,
        ),
        paragraph(
            "<b>Fastest path</b> &nbsp; Capture a screenshot -> Try a fictional screenshot -> Situation -> People -> Interpretation -> Action.",
            small,
        ),
    ]
    story.extend([card(verify, doc.width), Spacer(1, 6)])

    advantage = [
        paragraph("THE ADVANTAGE: A REASONING ARCHITECTURE, NOT ANOTHER CHAT UI", section),
        paragraph(
            "<b>Invariant evidence.</b> Five lenses keep reported facts fixed while changing the cognitive operation, alternatives, unknowns, and next question. A regression test enforces the contract.",
            body,
        ),
        paragraph(
            "<b>Context before language.</b> Communication Studio uses selected relationship history, goals, preferences, and boundaries across Draft, Reply, Review, Rewrite, Predict, and Compare - without overwriting the user's original.",
            body,
        ),
        paragraph(
            "<b>Inspectable memory.</b> People, situations, commitments, evidence, and interpretations are separate editable objects. AI interpretations never become trusted memory automatically.",
            body,
        ),
        paragraph(
            "<b>Perspective without mind-reading.</b> Perspective Simulation rehearses plausible readings and misunderstanding risk, with evidence and confidence visible.",
            body,
        ),
    ]
    story.extend([card(advantage, doc.width), Spacer(1, 6)])

    metric_data = [
        [paragraph("68 / 68", number), paragraph("automated tests pass (npm test)", body)],
        [paragraph("28 / 28", number), paragraph("full-pipeline evaluations pass: intent, schema, and relationship isolation", body)],
        [paragraph("4,188", number), paragraph("ConvoKit conversations in a held-out zero-cost research baseline", body)],
        [paragraph("0", number), paragraph("cloud databases; local judge path needs no private API key", body)],
    ]
    metrics_table = Table(metric_data, colWidths=[24 * mm, doc.width - 24 * mm])
    metrics_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    proof = [paragraph("VERIFIED, REPRODUCIBLE, AND ZERO-COST BY DEFAULT", section), metrics_table]
    story.extend([card(proof, doc.width), Spacer(1, 6)])

    process = [
        paragraph("BUILT WITH CODEX + GPT-5.6", section),
        paragraph(
            "<b>Codex /feedback session:</b> 019f5bd7-32bc-77f0-8836-651fd258b040 - one continuous build record covering product decisions, code patches, browser testing, and repairs.",
            body,
        ),
        paragraph(
            "The optional live path uses GPT-5.6 through the OpenAI Responses API with a strict JSON schema. The reproducible judge path uses the same interface and epistemic contract with deterministic local reasoning and paid calls disabled.",
            body,
        ),
        paragraph(
            "Local run: <b>npm install</b> | <b>cp .env.example .env</b> | <b>npm start</b> - no API key needed.",
            small,
        ),
    ]
    story.append(card(process, doc.width))

    doc.build(story)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: make_judge_brief.py OUTPUT.pdf")
    build(sys.argv[1])
