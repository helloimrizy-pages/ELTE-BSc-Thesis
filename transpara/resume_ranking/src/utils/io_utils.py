import os
import json
from typing import List, Tuple
from src.data.document_extraction import extract_text_from_pdf

def load_job_description(path: str) -> str:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Job description not found: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def load_candidate_pdfs(directory: str) -> Tuple[List[str], List[str]]:
    if not os.path.isdir(directory):
        raise NotADirectoryError(f"Candidate directory not found: {directory}")
    files, texts = [], []
    for file in os.listdir(directory):
        if file.lower().endswith('.pdf'):
            file_path = os.path.join(directory, file)
            files.append(file_path)
            texts.append(extract_text_from_pdf(file_path))
    if not files:
        raise FileNotFoundError("No PDF files found in candidate directory.")
    return files, texts