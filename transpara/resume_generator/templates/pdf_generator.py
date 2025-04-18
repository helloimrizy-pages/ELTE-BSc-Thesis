from fpdf import FPDF
import os

def generate_cv_pdf(data: dict, save_dir: str = "output"):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Path to TTF font files
    FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
    print(f"Font directory: {FONT_DIR}")
    os.makedirs(FONT_DIR, exist_ok=True)
    FONT_PATH_REGULAR = os.path.join(FONT_DIR, "DejaVuSans.ttf")
    FONT_PATH_BOLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")

    # Make sure font files exist
    if not os.path.exists(FONT_PATH_REGULAR) or not os.path.exists(FONT_PATH_BOLD):
        raise FileNotFoundError("Missing DejaVuSans fonts. Place DejaVuSans.ttf and DejaVuSans-Bold.ttf in the fonts folder.")

    # Add UTF-8 font with bold variant
    pdf.add_font("DejaVu", "", FONT_PATH_REGULAR, uni=True)
    pdf.add_font("DejaVu", "B", FONT_PATH_BOLD, uni=True)
    pdf.set_font("DejaVu", "B", 16)

    # Header
    pdf.cell(200, 10, data["name"], ln=True, align='C')
    pdf.set_font("DejaVu", "", 12)
    pdf.cell(200, 8, data["location"], ln=True, align='C')
    pdf.cell(200, 8, f'{data["email"]} | {data["phone"]} | {data["linkedin"]} | {data["github"]}', ln=True, align='C')
    pdf.ln(10)

    def section(title, items):
        pdf.set_font("DejaVu", "B", 14)
        pdf.cell(0, 10, title, ln=True)
        pdf.set_font("DejaVu", "", 12)
        if isinstance(items, list):
            for line in items:
                pdf.multi_cell(0, 8, line)
        else:
            pdf.multi_cell(0, 8, items)
        pdf.ln(5)

    section("Education", data["education"])
    section("Work Experience", data["experience"])
    section("Skills", data["skills"])
    section("Certificates", data["certificates"])
    section("Awards", data["awards"])

    pdf.output(f"{save_dir}/{data['filename']}")
