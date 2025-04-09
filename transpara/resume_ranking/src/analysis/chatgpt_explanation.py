import os
from uuid import uuid4
from typing import List, Dict, Any
from src.models.linguistic_debiasing import compute_gender_bias_score
from api.explanation_service import generate_chatgpt_explanation
from src.utils.file_utils import save_to_json, load_from_json, generate_candidate_id
from src.utils.firebase_utils import get_candidate_name_from_firestore

def generate_chatgpt_explanations(
    results: Dict[str, Any],
    job_description: str,
    candidate_files: List[str],
    candidate_texts: List[str],
    output_folders: Dict[str, str],
    job_id: str,
    top_n: int = 5
) -> str:
    report_path = os.path.join(output_folders["reports"], "chatgpt_explanations.json")
    
    if os.path.exists(report_path):
        existing_explanations = load_from_json(report_path)
        if "analysis_id" not in existing_explanations:
            existing_explanations["analysis_id"] = "chatgpt_" + str(uuid4())
    else:
        existing_explanations = {"analysis_id": "chatgpt_" + str(uuid4()), "explanations": []}
    
    existing_ids = {
        entry.get("id")
        for entry in existing_explanations.get("explanations", [])
        if entry.get("id") is not None
    }

    for rank, idx in enumerate(results["ranked_indices"][:top_n], 1):
        candidate_file = candidate_files[idx]
        candidate_id = generate_candidate_id(candidate_file)
        if candidate_id in existing_ids:
            print(f"ChatGPT explanation for {candidate_file} already exists, skipping.")
            continue

        candidate_name = get_candidate_name_from_firestore(job_id, os.path.basename(candidate_file))
        text = candidate_texts[idx]
        similarity = results["predictions"][idx]
        bias = compute_gender_bias_score(text)
        shap = results["explanations"][idx]

        explanation = generate_chatgpt_explanation(
            job_description,
            text,
            similarity,
            {
                "top_positive": [c for c in shap["contributors"] if c.get("positive")],
                "top_negative": [c for c in shap["contributors"] if not c.get("positive")],
            },
            bias
        )

        entry = {
            "id": candidate_id,
            "candidate_file": candidate_name,
            "rank": rank,
            "similarity_score": round(similarity, 4),
            "bias_score": round(bias, 2),
            "chatgpt_explanation": explanation
        }
        existing_explanations["explanations"].append(entry)
        # print(f"\nRank {rank} - {candidate_name} ChatGPT Explanation:")
        # print(explanation)

    save_to_json(existing_explanations, report_path)
    print(f"\nChatGPT explanations generated and saved to {report_path}")
    return report_path