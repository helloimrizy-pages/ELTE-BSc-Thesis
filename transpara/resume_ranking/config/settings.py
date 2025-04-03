import os
from typing import Dict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

OUTPUT_PATHS = {
    'reports': os.path.join(OUTPUT_DIR, 'reports')
}

MODEL_SETTINGS = {
    'embedding_model': 'bert-base-multilingual-cased',
    'max_length': 512,
    'pooling': 'cls',
    'lambda_bias': 1.0,
    
    'gbm_params': {
        'n_estimators': [50, 100, 200],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 4, 5],
        'min_samples_split': [2, 5]
    },
    
    'sample_dims': 50,
    
    'shap_nsamples': 500,
    'top_contributors': 10,
    
    'gpt_model': 'gpt-4o-mini',
    'gpt_temperature': 0.2,
    'gpt_max_tokens': 350
}

DEFAULT_SKILLS = [
    "python", "nlp", "machine learning", "deep learning", "data science",
    "statistics", "tensorflow", "pytorch", "sklearn", "pandas", "numpy", 
    "language models", "neural networks", "algorithms", "ai", "computer vision",
    "data visualization", "big data", "spark", "sql", "database", "cloud",
    "aws", "azure", "gcp", "kubernetes", "docker", "git", "ci/cd"
]

GENDERED_TERMS = {
    "he": "they", "she": "they", "his": "their", "her": "their",
    "him": "them", "man": "person", "woman": "person", "boy": "child",
    "girl": "child", "male": "person", "female": "person", 
    "father": "parent", "mother": "parent", "businessman": "businessperson",
    "businesswoman": "businessperson", "chairman": "chairperson",
    "chairwoman": "chairperson", "sir": "person", "madam": "person",
    "gentleman": "person", "lady": "person", "husband": "spouse",
    "wife": "spouse", "son": "child", "daughter": "child"
}

GENDER_WORD_PAIRS = [
    ("male", "female"), ("man", "woman"), ("boy", "girl"),
    ("he", "she"), ("his", "hers"), ("father", "mother"),
    ("son", "daughter"), ("uncle", "aunt"), ("husband", "wife"),
    ("gentleman", "lady"), ("king", "queen"), ("actor", "actress"),
    ("prince", "princess"), ("waiter", "waitress"), ("lord", "lady")
]

ATTRIBUTE_SETS = {
    "career": ["executive", "management", "professional", "salary", "office"],
    "family": ["home", "parents", "children", "family", "marriage"]
}

def create_output_folders() -> Dict[str, str]:
    for folder_path in OUTPUT_PATHS.values():
        os.makedirs(folder_path, exist_ok=True)
        print(f"Created folder: {folder_path}")
    
    return OUTPUT_PATHS