import torch
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
from transformers import AutoTokenizer, AutoModel

from config.settings import MODEL_SETTINGS

def load_mbert_model(model_name: Optional[str] = None):
    if model_name is None:
        model_name = MODEL_SETTINGS['embedding_model']
        
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    
    return tokenizer, model

def get_text_embedding(
    text: str,
    tokenizer,
    model,
    max_length: Optional[int] = None,
    pooling: str = 'cls'
) -> torch.Tensor:
    
    if max_length is None:
        max_length = MODEL_SETTINGS['max_length']
    
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length,
        padding="max_length"
    )
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    if pooling == 'cls':
        return outputs.last_hidden_state[:, 0, :].squeeze(0)
    else:
        return torch.mean(outputs.last_hidden_state, dim=1).squeeze(0)

def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    a_norm = a / a.norm(p=2, dim=0, keepdim=True)
    b_norm = b / b.norm(p=2, dim=0, keepdim=True)
    
    similarity = torch.dot(a_norm, b_norm).item()
    
    return similarity

def extract_skill_keywords(text: str, skill_keywords: List[str]) -> Dict[str, int]:
    text = text.lower()
    return {skill: text.count(skill.lower()) for skill in skill_keywords}

def create_feature_vector(
    job_embedding: torch.Tensor,
    cv_embedding: torch.Tensor,
    gender_directions: Optional[torch.Tensor] = None,
    text: Optional[str] = None,
    skill_keywords: Optional[List[str]] = None
) -> Dict[str, float]:
    
    features = {}
    
    cos_sim = cosine_similarity(job_embedding, cv_embedding)
    features["cosine_similarity"] = cos_sim
    
    if gender_directions is not None:
        cv_embedding_debiased = debias_embedding(cv_embedding.clone(), gender_directions)
    else:
        cv_embedding_debiased = cv_embedding.clone()
    
    embed_dim = cv_embedding_debiased.shape[0]
    sample_dims = MODEL_SETTINGS['sample_dims']
    step = embed_dim // sample_dims
    
    for i in range(0, embed_dim, step):
        if i < embed_dim:
            features[f"embed_dim_{i}"] = cv_embedding_debiased[i].item()
    
    diff_embedding = torch.abs(job_embedding - cv_embedding_debiased)
    for i in range(0, embed_dim, step):
        if i < embed_dim:
            features[f"embed_diff_{i}"] = diff_embedding[i].item()
    
    if text is not None and skill_keywords is not None:
        skill_counts = extract_skill_keywords(text, skill_keywords)
        for skill, count in skill_counts.items():
            features[f"skill_{skill}"] = count
    
    return features

def create_feature_vectors_dataset(
    job_embedding: torch.Tensor,
    cv_embeddings: List[torch.Tensor],
    cv_texts: Optional[List[str]] = None,
    gender_directions: Optional[torch.Tensor] = None,
    skill_keywords: Optional[List[str]] = None,
    similarity_scores: Optional[List[float]] = None
) -> pd.DataFrame:
    
    data = []
    for idx, cv_embedding in enumerate(cv_embeddings):
        features = create_feature_vector(
            job_embedding, 
            cv_embedding, 
            gender_directions=gender_directions,
            text=cv_texts[idx] if cv_texts else None,
            skill_keywords=skill_keywords
        )
        
        if similarity_scores is not None:
            features["target_score"] = similarity_scores[idx]
            
        data.append(features)
    
    return pd.DataFrame(data)

def debias_embedding(embedding: torch.Tensor, gender_directions: torch.Tensor, lambda_bias: float = 1.0) -> torch.Tensor:
    for direction in gender_directions:
        projection = torch.dot(embedding, direction) / torch.dot(direction, direction)
        embedding -= lambda_bias * projection * direction
    return embedding