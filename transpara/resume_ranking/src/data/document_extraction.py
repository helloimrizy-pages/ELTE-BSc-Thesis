import os
import pdfplumber
import pytesseract
import logging
logging.getLogger("pdfminer").setLevel(logging.ERROR)

from pdf2image import convert_from_path
from typing import Optional, List

def is_text_based_pdf(pdf_path: str) -> bool:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                if page.extract_text(strip=True):
                    return True
        return False
    except Exception as e:
        print(f"Error checking PDF: {e}")
        return False

def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
    if is_text_based_pdf(pdf_path):
        return _extract_text_directly(pdf_path)
    else:
        return extract_text_with_ocr(pdf_path)

def _extract_text_directly(pdf_path: str) -> str:
    extracted_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF with pdfplumber: {e}")
        return ""
    return extracted_text

def extract_text_with_ocr(pdf_path: str, dpi: int = 300) -> str:
    try:
        text = ""
        images = convert_from_path(pdf_path, dpi=dpi)
        
        for i, image in enumerate(images):
            image_path = f"temp_page_{i+1}.jpg"
            try:
                image.save(image_path, "JPEG")
                
                page_text = pytesseract.image_to_string(image)
                text += page_text + "\n"
            finally:
                if os.path.exists(image_path):
                    os.remove(image_path)
                    
        return text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def extract_text_from_multiple_pdfs(pdf_paths: List[str]) -> List[str]:
    extracted_texts = []
    for pdf_path in pdf_paths:
        text = extract_text_from_pdf(pdf_path)
        extracted_texts.append(text)
    
    return extracted_texts