import os
from typing import List, Dict, Any
from src.models.linguistic_debiasing import compute_gender_bias_score
from api.explanation_service import generate_chatgpt_explanation
from src.utils.file_utils import save_to_json

def generate_chatgpt_explanations(
    results: Dict[str, Any],
    job_description: str,
    candidate_files: List[str],
    candidate_texts: List[str],
    output_folders: str,
    top_n: int = 5
) -> str:

    explanations = {"explanations": []}

    for rank, idx in enumerate(results["ranked_indices"][:top_n], 1):
        name = os.path.basename(candidate_files[idx])
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

        explanations["explanations"].append({
            "rank": rank,
            "candidate": name,
            "similarity_score": round(similarity, 4),
            "bias_score": round(bias, 2),
            "chatgpt_explanation": explanation
        })

        print(f"\nRank {rank} - {name} Explanation:")
        print(explanation)

    if output_folders:
        report_path = os.path.join(output_folders, "chatgpt_explanations.json")
        save_to_json(explanations, report_path)

    print(f"\nChatGPT explanations generated and saved to {report_path}")

    return report_path
