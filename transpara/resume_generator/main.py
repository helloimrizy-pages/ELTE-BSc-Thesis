import json
import os
from datetime import datetime
from templates.pdf_generator import generate_cv_pdf
from utils.file_utils import ensure_dir_exists

DATA_PATH = "data/cv_data.json"
OUTPUT_DIR = "output"

def main():
    ensure_dir_exists(OUTPUT_DIR)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        cv_entries = json.load(f)

    for entry in cv_entries:
        generate_cv_pdf(entry, OUTPUT_DIR)
        print(f"Generated CV: {entry['filename']} in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
