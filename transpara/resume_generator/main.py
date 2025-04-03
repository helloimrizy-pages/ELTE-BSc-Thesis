import json
import os
from datetime import datetime
from templates.pdf_generator import generate_cv_pdf
from utils.file_utils import ensure_dir_exists

DATA_PATH = "data/cv_data.json"
OUTPUT_BASE_DIR = "output"

def main():
    json_filename = os.path.splitext(os.path.basename(DATA_PATH))[0]
    
    date_str = datetime.now().strftime("%Y%m%d")
    
    output_subfolder = f"{json_filename}_{date_str}"
    output_dir = os.path.join(OUTPUT_BASE_DIR, output_subfolder)
    
    ensure_dir_exists(output_dir)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        cv_entries = json.load(f)

    for entry in cv_entries:
        generate_cv_pdf(entry, output_dir)
        print(f"Generated CV: {entry['filename']} in {output_subfolder}")

if __name__ == "__main__":
    main()
