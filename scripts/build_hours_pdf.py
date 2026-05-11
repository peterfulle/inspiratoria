"""Generate a black & white PDF from HORAS_INGENIERIA.md."""
import re
from pathlib import Path
from markdown_pdf import MarkdownPdf, Section

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "HORAS_INGENIERIA.md"
OUT = ROOT / "HORAS_INGENIERIA.pdf"

CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { color: #000 !important; background: #fff !important; }
body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10.5pt; line-height: 1.45; color: #000; }
h1 { font-size: 22pt; margin: 18pt 0 10pt; border-bottom: 2px solid #000; padding-bottom: 4pt; }
h2 { font-size: 15pt; margin: 16pt 0 8pt; border-bottom: 1px solid #000; padding-bottom: 3pt; page-break-after: avoid; }
h3 { font-size: 12.5pt; margin: 12pt 0 6pt; page-break-after: avoid; }
h4 { font-size: 11pt; margin: 10pt 0 4pt; font-style: italic; page-break-after: avoid; }
p  { margin: 4pt 0; text-align: justify; }
ul, ol { margin: 4pt 0 6pt 18pt; padding: 0; }
li { margin: 2pt 0; }
strong, b { font-weight: 700; color: #000; }
em, i { font-style: italic; }
a { color: #000; text-decoration: underline; }
blockquote { border-left: 2px solid #000; margin: 8pt 0; padding: 4pt 10pt; font-style: italic; }
code { font-family: 'Courier New', monospace; font-size: 9.5pt; background: #fff; padding: 0 2pt; border: 1px solid #000; border-radius: 2pt; }
pre { font-family: 'Courier New', monospace; font-size: 9pt; background: #fff; border: 1px solid #000; padding: 6pt 8pt; white-space: pre-wrap; word-wrap: break-word; line-height: 1.35; page-break-inside: avoid; }
pre code { border: none; padding: 0; font-size: 9pt; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 9.5pt; page-break-inside: avoid; }
th, td { border: 1px solid #000; padding: 4pt 6pt; text-align: left; vertical-align: top; }
th { font-weight: 700; border-bottom: 2px solid #000; }
hr { border: none; border-top: 1px solid #000; margin: 12pt 0; }
"""


def main() -> None:
    md_text = SRC.read_text(encoding="utf-8")
    md_text = re.sub(r"\[([^\]]+)\]\(#[^)]+\)", r"\1", md_text)

    pdf = MarkdownPdf(toc_level=2, optimize=True)
    pdf.meta["title"] = "Inspiratoria — Detalle de horas de ingeniería"
    pdf.meta["author"] = "Inspiratoria"
    pdf.meta["subject"] = "Engineering hours breakdown"

    pdf.add_section(Section(md_text, toc=False), user_css=CSS)
    pdf.save(str(OUT))
    print(f"OK -> {OUT}  ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
