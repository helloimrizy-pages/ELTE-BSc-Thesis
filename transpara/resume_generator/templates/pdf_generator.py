from fpdf import FPDF

def generate_cv_pdf(data: dict, save_dir: str = "output"):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    def section(title, items):
        pdf.set_font("Helvetica", 'B', 14)
        pdf.cell(0, 10, title, ln=True)
        pdf.set_font("Helvetica", size=12)
        if isinstance(items, list):
            for line in items:
                pdf.multi_cell(0, 8, line.replace("–", "-"))
        else:
            pdf.multi_cell(0, 8, items.replace("–", "-"))
        pdf.ln(5)

    # Header
    pdf.set_font("Helvetica", 'B', 16)
    pdf.cell(200, 10, data["name"], ln=True, align='C')
    pdf.set_font("Helvetica", size=12)
    pdf.cell(200, 8, data["location"], ln=True, align='C')
    pdf.cell(200, 8, f'{data["email"]} | {data["phone"]} | {data["linkedin"]} | {data["github"]}', ln=True, align='C')
    pdf.ln(10)

    section("Education", data["education"])
    section("Work Experience", data["experience"])
    section("Skills", data["skills"])
    section("Certificates", data["certificates"])
    section("Awards", data["awards"])

    pdf.output(f"{save_dir}/{data['filename']}")
