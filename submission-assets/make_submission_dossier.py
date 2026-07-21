"""Build the two-page Second Mind additional-information dossier."""

from io import BytesIO
from pathlib import Path
import sys
import tempfile

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from make_judge_brief import build as build_judge_brief


INK = colors.HexColor("#18211f")
SAGE = colors.HexColor("#5f7a68")
MUTED = colors.HexColor("#66706d")
LINE = colors.HexColor("#d9d5ca")
PAPER = colors.HexColor("#f7f4ec")
CARD = colors.HexColor("#fffdf8")
SAGE_PALE = colors.HexColor("#e9eee7")


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, 22 * mm, A4[0] - doc.rightMargin, 22 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.2)
    canvas.drawString(
        doc.leftMargin,
        15 * mm,
        "Abby Fitzgerald | Second Mind by Cognisyn | OpenAI Build Week 2026",
    )
    canvas.drawRightString(
        A4[0] - doc.rightMargin,
        15 * mm,
        "Think clearly. Stay yours.",
    )
    canvas.restoreState()


def thesis_pdf_bytes():
    buffer = BytesIO()
    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=15 * mm,
        bottomMargin=24 * mm,
        title="Second Mind - Founder Thesis",
        author="Abby Fitzgerald",
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
    doc.addPageTemplates([PageTemplate(id="thesis", frames=[frame], onPage=draw_page)])

    base = getSampleStyleSheet()
    eyebrow = ParagraphStyle(
        "Eyebrow",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=7.6,
        leading=9,
        textColor=SAGE,
        tracking=0.6,
        spaceAfter=5,
    )
    title = ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName="Times-Roman",
        fontSize=27,
        leading=30,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=7,
    )
    standfirst = ParagraphStyle(
        "Standfirst",
        parent=base["BodyText"],
        fontName="Times-Roman",
        fontSize=12,
        leading=16,
        textColor=SAGE,
        spaceAfter=10,
    )
    section = ParagraphStyle(
        "Section",
        parent=eyebrow,
        fontSize=8,
        leading=10,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=12.1,
        textColor=INK,
        spaceAfter=6,
    )
    compact = ParagraphStyle(
        "Compact",
        parent=body,
        fontSize=7.9,
        leading=10.8,
        spaceAfter=0,
    )
    quote = ParagraphStyle(
        "Quote",
        parent=base["BodyText"],
        fontName="Times-Italic",
        fontSize=12.2,
        leading=15.5,
        textColor=INK,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    note = ParagraphStyle(
        "Note",
        parent=body,
        fontSize=8.2,
        leading=11.6,
        spaceAfter=0,
    )

    def p(text, style=body):
        return Paragraph(text, style)

    def card(items, background=CARD, padding=10):
        table = Table([[items]], colWidths=[doc.width])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), background),
                    ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                    ("LEFTPADDING", (0, 0), (-1, -1), padding),
                    ("RIGHTPADDING", (0, 0), (-1, -1), padding),
                    ("TOPPADDING", (0, 0), (-1, -1), padding),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        return table

    comparison_rows = [
        [p("GENERAL CONVERSATIONAL AI", eyebrow), p("SECOND MIND", eyebrow)],
        [p("Starts from the current prompt", compact), p("Starts from explicit, user-selected context", compact)],
        [p("Memory may remain implicit", compact), p("People, events, evidence, and commitments are inspectable objects", compact)],
        [p("A fluent interpretation can dominate", compact), p("Observation, inference, confidence, alternatives, and unknowns remain separate", compact)],
        [p("A new prompt can silently change the frame", compact), p("Reported evidence stays fixed when the reasoning lens changes", compact)],
        [p("The assistant produces the answer", compact), p("The person reviews, edits, ignores, and remains the author", compact)],
    ]
    comparison = Table(comparison_rows, colWidths=[doc.width / 2, doc.width / 2])
    comparison.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), SAGE_PALE),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    story = [
        p("FOUNDER THESIS  |  SECOND MIND BY COGNISYN", eyebrow),
        p("AI should improve the path to an answer - not only the answer.", title),
        p(
            "Most AI products optimise for generating language. Second Mind optimises for constructing a clearer, more inspectable model of reality before language is generated.",
            standfirst,
        ),
        card(
            [
                p(
                    '"The goal is not to create a conversational AI. The goal is to augment human cognition while preserving human agency."',
                    quote,
                )
            ],
            background=SAGE_PALE,
            padding=12,
        ),
        Spacer(1, 8),
        p("THE PRODUCT THESIS", section),
        p(
            "People already ask AI to interpret messages, understand difficult relationships, and help with consequential communication. The danger is not only factual hallucination. It is <b>persuasive certainty built on incomplete context</b> - a fluent answer that hides the difference between what happened, what was inferred, and what remains unknown.",
        ),
        p(
            "Second Mind turns that distinction into product architecture. Natural inputs become evidence-linked records. Interpretations remain labelled and revisable. Confidence and alternative explanations remain visible. Changing the cognitive lens cannot silently change the reported facts. Suggestions remain optional, and the user remains the author.",
        ),
        p("THE DIFFERENCE IS ARCHITECTURAL", section),
        comparison,
        Spacer(1, 8),
        p("THE EDUCATIONAL OUTCOME", section),
        p(
            "Second Mind is designed to reinforce five habits: <b>What do I know? What am I inferring? How confident am I? What else could explain this? What evidence would change my mind?</b> The product succeeds when the user becomes more capable of asking those questions without the product.",
        ),
        p("BUILT WITH CODEX + GPT-5.6", section),
        p(
            "Codex with GPT-5.6 helped turn the thesis into a working system: a schema-versioned context model, local capture pipeline, exact-ID retrieval, five-lens reasoning contract, Communication Studio, browser-tested interactions, and an evaluation suite. The optional live path uses GPT-5.6 through the Responses API with structured output; the zero-cost judge path preserves the same epistemic contract without requiring a private key.",
        ),
        card(
            [
                p("A PERSONAL NOTE", section),
                p(
                    "I began with an idea for help during real-world conversations. Building it clarified something deeper: the most valuable AI may not be the system that answers fastest, but the one that helps a person notice how they reached a conclusion.",
                    note,
                ),
                Spacer(1, 5),
                p(
                    "Thank you to OpenAI for creating the tools, deadline, and space that allowed me to turn that idea into a working, testable product. The process taught me that preserving agency is not a limitation on intelligence. It is a requirement for intelligence people can trust.",
                    note,
                ),
            ],
            background=CARD,
            padding=10,
        ),
        Spacer(1, 4),
        p(
            "Second Mind should leave the user with a clearer model of reality - and still fully the author of the decision.",
            quote,
        ),
    ]

    doc.build(story)
    return buffer.getvalue()


def build(output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="second-mind-dossier-") as temp_dir:
        judge_path = Path(temp_dir) / "judge-brief.pdf"
        build_judge_brief(judge_path)

        writer = PdfWriter()
        writer.append(str(judge_path))
        writer.append(PdfReader(BytesIO(thesis_pdf_bytes())))
        writer.add_metadata(
            {
                "/Title": "Second Mind by Cognisyn - Submission Dossier",
                "/Author": "Abby Fitzgerald",
                "/Subject": "OpenAI Build Week 2026 additional information",
            }
        )
        with output_path.open("wb") as target:
            writer.write(target)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: make_submission_dossier.py OUTPUT.pdf")
    build(sys.argv[1])
