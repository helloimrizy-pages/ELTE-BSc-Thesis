import pdfplumber
import os

def is_text_based_pdf(pdf_path):
    """
    Check if the PDF is text-based by attempting to extract text from each page.
    Returns True if at least one page has extractable text.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    return True
        return False
    except Exception as e:
        print(f"Error checking PDF type: {e}")
        return False

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a text-based PDF using pdfplumber.
    Returns the extracted text as a single string.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        return extracted_text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def main():
    # Specify your PDF file path
    pdf_path = "data/cv.pdf"  # Change this to your actual PDF file path

    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}")
        return

    if is_text_based_pdf(pdf_path):
        text = extract_text_from_pdf(pdf_path)
        if text:
            print("Extracted text:\n")
            print(text)
        else:
            print("No text could be extracted from the PDF.")
    else:
        print("This PDF does not appear to be text-based. It may be scanned. Consider using OCR methods.")

if __name__ == "__main__":
    main()

