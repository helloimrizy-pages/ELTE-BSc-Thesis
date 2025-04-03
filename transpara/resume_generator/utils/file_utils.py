import os

def ensure_dir_exists(directory: str):
    if not os.path.exists(directory):
        os.makedirs(directory)
