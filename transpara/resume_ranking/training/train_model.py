# python -m training.train_model

import os
import numpy as np
import pandas as pd
import joblib
import torch
import argparse
import sys

from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
from src.data.document_extraction import extract_text_from_pdf
from src.data.embeddings import load_mbert_model
from config.settings import create_output_folders, DEFAULT_SKILLS, MODEL_SETTINGS

def prepare_training_data(
    job_description_text: str,
    candidate_texts: List[str],
    tokenizer,
    model,
    skill_keywords: Optional[List[str]] = None,
    gender_directions: Optional[torch.Tensor] = None,
    synthetic: bool = True
) -> pd.DataFrame:
    """
    Prepare training data for the ranking model.
    
    Args:
        job_description_text: Text of the job description
        candidate_texts: List of candidate resume texts
        tokenizer: Transformer tokenizer
        model: Transformer model
        skill_keywords: List of skills to look for (uses DEFAULT_SKILLS if None)
        gender_directions: Gender direction vectors for debiasing
        synthetic: Whether to create synthetic training data from embeddings
                  (True) or use human-labeled scores (False)
    
    Returns:
        DataFrame with features and target scores for training
    """
    from src.data.embeddings import get_text_embedding, cosine_similarity, create_feature_vectors_dataset
    from src.models.linguistic_debiasing import compute_gender_bias_score
    
    if skill_keywords is None:
        skill_keywords = DEFAULT_SKILLS
    
    job_embedding = get_text_embedding(job_description_text, tokenizer, model)
    cv_embeddings = [get_text_embedding(text, tokenizer, model) for text in candidate_texts]
    
    if synthetic:
        scores = [cosine_similarity(job_embedding, cv_emb) for cv_emb in cv_embeddings]
        
        for i, text in enumerate(candidate_texts):
            gender_bias = compute_gender_bias_score(text)
            scores[i] = max(0.0, scores[i] - (gender_bias / 100))
    else:
        print("Warning: Non-synthetic mode selected but no human scores provided.")
        scores = None
    
    feature_df = create_feature_vectors_dataset(
        job_embedding, 
        cv_embeddings, 
        candidate_texts,
        gender_directions=gender_directions,
        skill_keywords=skill_keywords,
        similarity_scores=scores
    )
    
    return feature_df

def train_ranking_model(
    features_df: pd.DataFrame,
    save_path: Optional[str] = None,
    output_folders: Optional[Dict[str, str]] = None,
    param_grid: Optional[Dict[str, List[Any]]] = None
) -> Tuple[GradientBoostingRegressor, List[str]]:
    """
    Train a gradient boosting model for ranking candidates.
    
    Args:
        features_df: DataFrame with features and target scores
        save_path: Path to save the trained model
        output_folders: Dictionary mapping folder names to paths
        param_grid: Hyperparameter grid for GridSearchCV
    
    Returns:
        Tuple of (trained model, feature names)
    """
    if 'target_score' not in features_df.columns:
        raise ValueError("features_df must contain a 'target_score' column")
        
    X = features_df.drop('target_score', axis=1)
    y = features_df['target_score']
    
    if param_grid is None:
        param_grid = MODEL_SETTINGS['gbm_params']
    
    if len(X) <= 3:
        print(f"Warning: Small dataset ({len(X)} samples). Using simplified training.")
        best_model = _train_small_dataset(X, y)
    else:
        best_model = _train_with_cross_validation(X, y, param_grid)
    
    feature_importance = pd.DataFrame({
        'Feature': X.columns,
        'Importance': best_model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print("\nTop 10 Important Features:")
    print(feature_importance.head(10))
    
    if output_folders and save_path:
        save_path = os.path.join(output_folders['models'], os.path.basename(save_path))
    
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(best_model, save_path)
        print(f"Model saved to {save_path}")
    
    return best_model, X.columns.tolist()

def _train_small_dataset(X: pd.DataFrame, y: pd.Series) -> GradientBoostingRegressor:
    """
    Train a model on a small dataset without cross-validation.
    
    Args:
        X: Feature DataFrame
        y: Target Series
    
    Returns:
        Trained GradientBoostingRegressor
    """
    gbm = GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        random_state=42
    )
    
    gbm.fit(X, y)
    
    y_pred = gbm.predict(X)
    mse = mean_squared_error(y, y_pred)
    print(f"Training MSE: {mse:.4f}")
    
    return gbm

def _train_with_cross_validation(
    X: pd.DataFrame, 
    y: pd.Series, 
    param_grid: Dict[str, List[Any]]
) -> GradientBoostingRegressor:
    """
    Train a model using cross-validation with GridSearchCV.
    
    Args:
        X: Feature DataFrame
        y: Target Series
        param_grid: Hyperparameter grid
    
    Returns:
        Best GradientBoostingRegressor from cross-validation
    """
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training on {X_train.shape[0]} samples, validating on {X_val.shape[0]} samples")
    
    gbm = GradientBoostingRegressor(random_state=42)
    grid_search = GridSearchCV(gbm, param_grid, cv=3, scoring='neg_mean_squared_error')
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    
    y_pred = best_model.predict(X_val)
    mse = mean_squared_error(y_val, y_pred)
    
    try:
        r2 = r2_score(y_val, y_pred)
        print(f"Validation MSE: {mse:.4f}, R² Score: {r2:.4f}")
    except:
        print(f"Validation MSE: {mse:.4f}, R² Score: undefined")
    
    return best_model

def get_candidate_texts(candidates_dir: str):
    candidate_files = []
    candidate_texts = []
    for file in os.listdir(candidates_dir):
        file_path = os.path.join(candidates_dir, file)
        if os.path.isfile(file_path) and file.lower().endswith('.pdf'):
            candidate_files.append(file_path)
            text = extract_text_from_pdf(file_path)
            candidate_texts.append(text)
    return candidate_files, candidate_texts

def main():
    parser = argparse.ArgumentParser(description="Train Candidate Ranking Model")
    parser.add_argument(
        '--job_description',
        type=str,
        default='data/job_desc/data.txt',
        help="Path to the job description text file."
    )
    parser.add_argument(
        '--candidates_dir',
        type=str,
        default='data',
        help="Directory containing candidate PDF files."
    )
    args = parser.parse_args()

    if not os.path.exists(args.job_description):
        print(f"Job description file not found: {args.job_description}")
        return

    with open(args.job_description, 'r', encoding='utf-8') as f:
        job_description = f.read()

    if not os.path.isdir(args.candidates_dir):
        print(f"Candidate directory not found: {args.candidates_dir}")
        return

    candidate_files, candidate_texts = get_candidate_texts(args.candidates_dir)
    if not candidate_files:
        print("No candidate PDF files found.")
        return

    tokenizer, model = load_mbert_model()

    from datetime import datetime
    today = datetime.today().strftime('%Y%m%d')
    models_path = os.path.join("output", f"models_{today}")
    reports_path = os.path.join("output", "reports")

    os.makedirs(models_path, exist_ok=True)
    os.makedirs(reports_path, exist_ok=True)

    output_folders = {
        "models": models_path,
        "reports": reports_path
    }

    print("Preparing training data...")
    training_df = prepare_training_data(
        job_description_text=job_description,
        candidate_texts=candidate_texts,
        tokenizer=tokenizer,
        model=model,
        skill_keywords=DEFAULT_SKILLS,
        gender_directions=None,
        synthetic=True
    )

    print("Training ranking model...")
    model_path = os.path.join(output_folders['models'], "ranking_model.joblib")
    trained_model, feature_names = train_ranking_model(
        features_df=training_df,
        save_path=model_path,
        output_folders=output_folders
    )

    print("Model training complete.")
    print(f"Trained model saved at: {model_path}")

if __name__ == '__main__':
    main()
