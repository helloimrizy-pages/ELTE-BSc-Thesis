import numpy as np
import pandas as pd
import shap
import os

from typing import Dict, List, Tuple, Optional, Any, Union
from uuid import uuid4
from src.utils.file_utils import save_to_json, load_from_json, extract_user_id
from src.utils.firebase_utils import get_candidate_name_from_firestore, get_candidate_id_from_firestore

from config.settings import MODEL_SETTINGS

def generate_model_explanations(
    model: Any,
    feature_names: List[str],
    X: pd.DataFrame,
    skill_keywords: Optional[List[str]] = None
) -> Tuple[List[Dict[str, Any]], np.ndarray, pd.DataFrame]:

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    base_value = explainer.expected_value

    if len(feature_names) != shap_values.shape[1]:
        print(f"Warning: Mismatch between feature_names ({len(feature_names)}) and shap_values shape ({shap_values.shape[1]})")
        feature_names = X.columns.tolist()
        print(f"Using DataFrame columns as feature names ({len(feature_names)})")

    shap_df = pd.DataFrame(shap_values, columns=feature_names)
    explanations = []

    for idx, row in enumerate(shap_values):
        sorted_idx = np.argsort(-np.abs(row))
        top_contributors = []

        for i in sorted_idx[:MODEL_SETTINGS['top_contributors']]:
            feature_name = feature_names[i]
            shap_value = row[i]
            feature_value = X.iloc[idx, i]
            display_name = _get_descriptive_feature_name(feature_name, skill_keywords)

            top_contributors.append({
                "feature": display_name,
                "impact": float(shap_value),
                "value": float(feature_value),
                "positive": bool(shap_value > 0)
            })

        base_value_scalar = float(base_value[0]) if isinstance(base_value, np.ndarray) else float(base_value)
        row_sum = float(np.sum(row))
        final_prediction = base_value_scalar + row_sum

        explanations.append({
            "base_value": base_value_scalar,
            "prediction": final_prediction,
            "contributors": top_contributors
        })

    return explanations, shap_values, shap_df

def generate_shap_explanations(
    candidate_files: List[str],
    explanations: List[Dict[str, Any]],
    output_folders: Dict[str, str],
    job_id: str
) -> None:
    """
    Save SHAP explanations to a JSON report, skipping existing ones based on candidate ID.
    """
    shap_results_path = os.path.join(output_folders["reports"], "shap_explanations.json")

    if os.path.exists(shap_results_path):
        existing_shap = load_from_json(shap_results_path)
        if "analysis_id" not in existing_shap:
            existing_shap["analysis_id"] = "shap_" + str(uuid4())
    else:
        existing_shap = {"analysis_id": "shap_" + str(uuid4()), "shap": []}

    existing_shap_ids = {entry["id"] for entry in existing_shap.get("shap", [])}

    for idx, explanation in enumerate(explanations):
        file_name = os.path.basename(candidate_files[idx])
        user_id = extract_user_id(file_name)
        candidate_id = get_candidate_id_from_firestore(job_id, user_id)
        candidate_name = get_candidate_name_from_firestore(job_id, user_id)

        if candidate_id in existing_shap_ids:
            print(f"SHAP analysis for {candidate_name} already exists, skipping.")
            continue

        entry = {
            "id": candidate_id,
            "candidate_file": candidate_name,
            "base_value": explanation.get("base_value"),
            "prediction": explanation.get("prediction"),
            "contributors": explanation.get("contributors")
        }
        existing_shap["shap"].append(entry)

    save_to_json(existing_shap, shap_results_path)
    print(f"SHAP analysis saved to {shap_results_path}")

def _get_descriptive_feature_name(feature_name: str, skill_keywords: Optional[List[str]] = None) -> str:
    if feature_name.startswith("skill_") and skill_keywords is not None:
        skill_name = feature_name.replace("skill_", "")
        return f"Skill: {skill_name.capitalize()}"
    elif feature_name == "cosine_similarity":
        return "Overall CV-Job Similarity"
    elif feature_name == "gender_bias_score":
        return "Gender Neutrality Score"
    elif feature_name.startswith("embed_dim_"):
        dim_num = feature_name.replace("embed_dim_", "")
        return f"Semantic Context Factor {dim_num}"
    elif feature_name.startswith("embed_diff_"):
        dim_num = feature_name.replace("embed_diff_", "")
        return f"Concept Gap {dim_num}"
    else:
        return f"Feature: {feature_name.replace('_', ' ').title()}"

def format_explanation_for_hr(
    explanation: Dict[str, Any],
    candidate_name: str,
    job_title: str
) -> str:
    base_value = explanation["base_value"]
    prediction = explanation["prediction"]
    contributors = explanation["contributors"]

    if hasattr(base_value, '__iter__'):
        base_value = float(base_value[0] if len(base_value) > 0 else 0)

    if hasattr(prediction, '__iter__'):
        prediction = float(prediction[0] if len(prediction) > 0 else 0)

    positive_factors = [c for c in contributors if c["positive"]]
    negative_factors = [c for c in contributors if not c["positive"]]

    explanation_text = f"Candidate: {candidate_name}\n"
    explanation_text += f"Position: {job_title}\n"
    explanation_text += f"Match Score: {prediction:.2f} (average is {base_value:.2f})\n\n"

    explanation_text += _format_factors("Strengths", positive_factors, sign="+")
    explanation_text += _format_factors("Concerns", negative_factors, sign="-")

    return explanation_text

def _format_factors(title: str, factors: List[Dict[str, Any]], sign: str = "+") -> str:
    if not factors:
        return f"{title}:\n• No significant factors identified\n"
    output = f"{title}:\n"
    for factor in factors[:3]:
        impact = abs(factor["impact"])
        output += f"• {factor['feature']}: {'Contributes +' if sign == '+' else 'Decreases by '}{impact:.3f}\n"
    return output
