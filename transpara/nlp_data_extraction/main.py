import pdfplumber
import os
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

def is_text_based_pdf(pdf_path):
    """Check if PDF contains extractable text."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                if page.extract_text(strip=True):
                    return True
        return False
    except Exception as e:
        print(f"Error checking PDF: {e}")
        return False

def extract_text_with_ocr(pdf_path):
    """Extract text from scanned PDF using Tesseract OCR."""
    try:
        text = ""
        images = convert_from_path(pdf_path)
        
        for i, image in enumerate(images):
            image_path = f"temp_page_{i+1}.jpg"
            image.save(image_path, "JPEG")
            
            page_text = pytesseract.image_to_string(Image.open(image_path))
            text += page_text + "\n"
            
            
            os.remove(image_path)
            
        return text
    except Exception as e:
        print(f"OCR Error: {e}")
        return None

def main():
    pdf_path = "data/cv.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    if is_text_based_pdf(pdf_path):
        print("Text-based PDF detected. Extracting text...")
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    else:
        print("Scanned PDF detected. Using OCR...")
        text = extract_text_with_ocr(pdf_path)

    if text:
        print("\nExtracted Text:\n")
        print(text.strip())
    else:
        print("Failed to extract text")

if __name__ == "__main__":
    main()