import os
import numpy as np
import pandas as pd
import json

from typing import Dict, List, Optional, Any
from joblib import load
from src.data.embeddings import get_text_embedding, create_feature_vectors_dataset
from src.models.linguistic_debiasing import mitigate_gender_bias
from src.models.embedding_debiasing import compute_gender_subspace
from src.analysis.shap_explanation import generate_model_explanations
from api.openai_client import initialize_openai_client


def load_ranking_model(model_path: str) -> Any:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    return load(model_path)


def predict_with_ranking_model(model: Any, features_df: pd.DataFrame) -> (np.ndarray, pd.DataFrame):
    X = features_df.drop('target_score', axis=1) if 'target_score' in features_df.columns else features_df
    predictions = model.predict(X)
    result_df = features_df.copy()
    result_df['predicted_score'] = predictions
    return predictions, result_df


def enhanced_ranking_pipeline(
    job_description_text: str,
    candidate_texts: List[str],
    candidate_files: List[str],
    tokenizer,
    model,
    output_folders: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    openai_client = initialize_openai_client()

    if output_folders is None:
        output_folders = {
            "models": os.path.join("resume_ranking", "output", "models"),
            "reports": os.path.join("resume_ranking", "output", "reports")
        }

    job_description_text_mitigated = mitigate_gender_bias(job_description_text)
    candidate_texts_mitigated = [mitigate_gender_bias(text) for text in candidate_texts]

    from config.settings import DEFAULT_SKILLS
    skill_keywords = DEFAULT_SKILLS
    gender_directions = compute_gender_subspace(tokenizer, model)

    print("Loading ranking model...")
    model_path = os.path.join(output_folders['models'], "ranking_model.joblib")
    ranking_model = load_ranking_model(model_path)

    test_features = create_feature_vectors_dataset(
        get_text_embedding(job_description_text_mitigated, tokenizer, model),
        [get_text_embedding(text, tokenizer, model) for text in candidate_texts_mitigated],
        candidate_texts_mitigated,
        gender_directions=gender_directions,
        skill_keywords=skill_keywords
    )
    feature_names = list(test_features.columns)

    print("Predicting match scores...")
    predictions, results_df = predict_with_ranking_model(ranking_model, test_features)
    ranked_indices = np.argsort(-predictions)

    print("Generating explanations...")
    explanations, shap_values, _ = generate_model_explanations(
        ranking_model, feature_names, test_features, skill_keywords
    )

    ranking_results = {
        "ranking": [
            {
                "rank": rank,
                "candidate": os.path.basename(candidate_files[idx]),
                "score": round(predictions[idx], 4)
            }
            for rank, idx in enumerate(ranked_indices, start=1)
        ]
    }
    ranking_results_path = os.path.join(output_folders['reports'], "ranking_results.json")
    with open(ranking_results_path, "w", encoding="utf-8") as f:
        json.dump(ranking_results, f, indent=2)
    print(f"Ranking results saved to {ranking_results_path}")

    return {
        "model": ranking_model,
        "predictions": predictions,
        "ranked_indices": ranked_indices,
        "explanations": explanations,
        "shap_values": shap_values,
        "feature_names": feature_names,
        "output_folders": output_folders
    }
