import os
import json
import csv
import shutil
import hashlib

from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional, Union, TextIO

def ensure_dir_exists(directory_path: str) -> str:
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)
        print(f"Created directory: {directory_path}")
    return directory_path

def save_to_json(data: Any, file_path: str, indent: int = 2, upload_to_firebase: bool = False) -> Optional[str]:
    if upload_to_firebase:
        from src.utils.firebase_utils import upload_json_to_firebase
        firebase_path = os.path.relpath(file_path, start="output/")
        upload_json_to_firebase(data, firebase_path)
        return None

    directory = os.path.dirname(file_path)
    if directory:
        ensure_dir_exists(directory)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)

    return file_path

def load_from_json(file_path: str) -> Any:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_user_id(file_name: str) -> str:
    return os.path.basename(file_name).split("_")[0]

def clean_html(raw_html: str) -> str:
    return BeautifulSoup(raw_html, "html.parser").get_text()
