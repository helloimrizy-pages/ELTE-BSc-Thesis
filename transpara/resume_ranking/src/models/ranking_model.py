import os
import json
from uuid import uuid4
import numpy as np
from joblib import load
from typing import List
from src.data.embeddings import get_text_embedding, create_feature_vectors_dataset
from src.models.linguistic_debiasing import mitigate_gender_bias
from src.models.embedding_debiasing import compute_gender_subspace
from src.analysis.shap_explanation import generate_model_explanations
from api.openai_client import initialize_openai_client
from src.utils.file_utils import save_to_json, load_from_json, generate_candidate_id

def load_ranking_model(model_path: str) -> any:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    return load(model_path)

def predict_with_ranking_model(model: any, features_df) -> (np.ndarray, any):
    X = features_df.drop('target_score', axis=1) if 'target_score' in features_df.columns else features_df
    predictions = model.predict(X)
    result_df = features_df.copy()
    result_df['predicted_score'] = predictions
    return predictions, result_df

def rank_candidates(
    job_description_text: str,
    candidate_texts: List[str],
    candidate_files: List[str],
    tokenizer,
    model,
    output_folders: dict = None,
) -> dict:

    job_description_text_mitigated = mitigate_gender_bias(job_description_text)
    candidate_texts_mitigated = [mitigate_gender_bias(text) for text in candidate_texts]

    from config.settings import DEFAULT_SKILLS
    skill_keywords = DEFAULT_SKILLS
    gender_directions = compute_gender_subspace(tokenizer, model)

    print("Loading ranking model...\n")
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

    print("Predicting match scores...\n")
    predictions, results_df = predict_with_ranking_model(ranking_model, test_features)
    ranked_indices = np.argsort(-predictions)

    ranking_results_path = os.path.join(output_folders['reports'], "ranking_results.json")
    if os.path.exists(ranking_results_path):
        existing_ranking = load_from_json(ranking_results_path)
        if "analysis_id" not in existing_ranking:
            existing_ranking["analysis_id"] = "ranking_" + str(uuid4())
    else:
        existing_ranking = {"analysis_id": "ranking_" + str(uuid4()), "ranking": []}

    existing_ids = {entry["id"] for entry in existing_ranking.get("ranking", [])}

    for rank, idx in enumerate(ranked_indices, start=1):
        candidate_file = candidate_files[idx]
        candidate_id = generate_candidate_id(candidate_file)
        candidate_name = os.path.basename(candidate_file).replace('.pdf', '')

        if candidate_id in existing_ids:
            print(f"Ranking result for {candidate_name} already exists, skipping.")
            continue

        entry = {
            "id": candidate_id,
            "rank": rank,
            "candidate_file": candidate_name,
            "score": round(predictions[idx], 4)
        }
        existing_ranking["ranking"].append(entry)

    save_to_json(existing_ranking, ranking_results_path)
    print(f"Ranking results saved to {ranking_results_path}")

    explanations, shap_values, shap_df = generate_model_explanations(
        ranking_model, feature_names, test_features
    )

    return {
        "model": ranking_model,
        "predictions": predictions,
        "ranked_indices": ranked_indices,
        "feature_names": feature_names,
        "output_folders": output_folders,
        "explanations": explanations
    }

def display_ranking(ranking_path: str):
    with open(ranking_path, "r", encoding="utf-8") as f:
        ranking = json.load(f)
    print("\nCandidate Ranking Results:")
    for result in ranking["ranking"]:
        print(f"{result['rank']}. {result['candidate_file']} - Score: {result['score']:.4f}")