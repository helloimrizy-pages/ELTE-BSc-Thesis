import os
import json
import csv
import shutil
from typing import Dict, List, Any, Optional, Union, TextIO

def ensure_dir_exists(directory_path: str) -> str:
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)
        print(f"Created directory: {directory_path}")
    return directory_path

def save_to_json(data: Any, file_path: str, indent: int = 2) -> str:
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