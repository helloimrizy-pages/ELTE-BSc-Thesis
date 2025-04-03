import torch
import numpy as np
from typing import Optional
from config.settings import GENDER_WORD_PAIRS, MODEL_SETTINGS

def compute_gender_subspace(tokenizer, model) -> torch.Tensor:
    from src.data.embeddings import get_text_embedding

    gender_diffs = []
    for male_word, female_word in GENDER_WORD_PAIRS:
        male_emb = get_text_embedding(male_word, tokenizer, model)
        female_emb = get_text_embedding(female_word, tokenizer, model)
        gender_diffs.append((male_emb - female_emb).numpy())

    gender_diffs = np.array(gender_diffs)
    U, s, Vt = np.linalg.svd(gender_diffs, full_matrices=False)
    return torch.tensor(Vt[:3]).float()

def debias_embedding(embedding: torch.Tensor, gender_directions: torch.Tensor, lambda_bias: Optional[float] = None) -> torch.Tensor:
    if lambda_bias is None:
        lambda_bias = MODEL_SETTINGS['lambda_bias']

    debiased_emb = embedding.clone()
    for direction in gender_directions:
        projection = torch.dot(debiased_emb, direction) / torch.dot(direction, direction)
        debiased_emb -= lambda_bias * projection * direction

    return debiased_emb

def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    a_norm = a / a.norm(p=2, dim=0, keepdim=True)
    b_norm = b / b.norm(p=2, dim=0, keepdim=True)
    return torch.dot(a_norm, b_norm).item()
