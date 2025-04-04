import os
import json
import spacy
import numpy as np

from uuid import uuid4
from collections import Counter
from typing import Dict, List, Optional, Any
from src.utils.file_utils import save_to_json, load_from_json, generate_candidate_id

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model not found. Please run: python -m spacy download en_core_web_sm")
    raise

LOW_BIAS_THRESHOLD = 1.0
MODERATE_BIAS_THRESHOLD = 3.0

def _get_gendered_terms(text: str) -> Dict[str, List[str]]:
    doc = nlp(text.lower())
    male_terms = [token.text for token in doc if token.text in 
                 {"he", "his", "him", "man", "men", "male", "father", 
                  "son", "brother", "uncle", "husband", "gentleman"}]
    female_terms = [token.text for token in doc if token.text in 
                   {"she", "her", "hers", "woman", "women", "female", "mother", 
                    "daughter", "sister", "aunt", "wife", "lady"}]
    return {
        'male_terms': male_terms,
        'female_terms': female_terms
    }

def _count_term_frequencies(terms: List[str]) -> Dict[str, int]:
    return dict(Counter(terms))

def generate_gender_bias_report(
    candidate_texts: List[str], 
    candidate_files: List[str], 
    bias_scores: List[float],
    output_folders: Optional[Dict[str, str]] = None
) -> str:
    new_entries = []
    for text, file, score in zip(candidate_texts, candidate_files, bias_scores):
        candidate_id = generate_candidate_id(file)
        candidate_file = os.path.basename(file)
        candidate_name = os.path.basename(candidate_file).replace('.pdf', '')
        gendered_terms = _get_gendered_terms(text)
        male_terms = gendered_terms['male_terms']
        female_terms = gendered_terms['female_terms']
        male_freq = _count_term_frequencies(male_terms)
        female_freq = _count_term_frequencies(female_terms)
        if score < LOW_BIAS_THRESHOLD:
            recommendation = "This resume uses gender-neutral language effectively."
        elif score < MODERATE_BIAS_THRESHOLD:
            recommendation = "This resume has some gender-specific language, but is generally balanced."
        else:
            recommendation = "This resume shows significant gender imbalance in language usage."
        candidate_report = {
            "id": candidate_id,
            "candidate_file": candidate_name,
            "gender_bias_score": round(score, 2),
            "male_terms": male_freq if male_freq else "none",
            "female_terms": female_freq if female_freq else "none",
            "recommendation": recommendation
        }
        new_entries.append(candidate_report)
    
    report_path = None
    if output_folders:
        report_path = os.path.join(output_folders["reports"], "gender_bias_analysis.json")
    
    if report_path and os.path.exists(report_path):
        existing_report = load_from_json(report_path)
        if "analysis_id" not in existing_report:
            existing_report["analysis_id"] = "gender_bias_" + str(uuid4())
    else:
        existing_report = {
            "analysis_id": "gender_bias_" + str(uuid4()),
            "title": "Gender Bias Analysis Report",
            "understanding": {
                "description": (
                    "The Gender Bias Score measures the imbalance between masculine and feminine "
                    "terms in the text. A score of 0 indicates perfect balance, while higher scores indicate "
                    "more gender-specific language."
                ),
                "calculation": "(|male_terms - female_terms| / total_words) * 100"
            },
            "candidate_analysis": [],
            "recommendations": [
                "Use gender-neutral job titles (e.g., 'chairperson' instead of 'chairman/chairwoman').",
                "Replace gendered pronouns with 'they/them' where possible.",
                "Focus on skills and achievements rather than personal attributes.",
                "Review for unconscious bias in language describing leadership, technical skills, etc."
            ]
        }
    
    existing_ids = {entry["id"] for entry in existing_report.get("candidate_analysis", [])}
    for entry in new_entries:
        if entry["id"] in existing_ids:
            print(f"Gender bias analysis for {entry['id']} already exists, skipping.")
        else:
            existing_report["candidate_analysis"].append(entry)
    
    # Update summary from all candidate entries
    if existing_report["candidate_analysis"]:
        scores = [entry["gender_bias_score"] for entry in existing_report["candidate_analysis"]]
        summary = {
            "average_bias": round(np.mean(scores), 2),
            "min_bias": round(min(scores), 2),
            "max_bias": round(max(scores), 2),
            "median_bias": round(np.median(scores), 2),
            "most_neutral_candidate": min(existing_report["candidate_analysis"], key=lambda x: x["gender_bias_score"])["candidate_file"],
            "least_neutral_candidate": max(existing_report["candidate_analysis"], key=lambda x: x["gender_bias_score"])["candidate_file"]
        }
        existing_report["summary"] = summary
    else:
        existing_report["summary"] = {}
    
    if report_path:
        save_to_json(existing_report, report_path)
        print(f"\nGender bias analysis generated and saved to {report_path}.")
    
    return json.dumps(existing_report, indent=2)
    
def analyze_gender_bias_distribution(
    candidate_texts: List[str],
    candidate_files: List[str],
    ranked_indices: Optional[np.ndarray] = None,
    output_folders: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    from src.models.linguistic_debiasing import compute_gender_bias_score

    bias_scores = [compute_gender_bias_score(text) for text in candidate_texts]
    candidate_names = [os.path.splitext(os.path.basename(file))[0] for file in candidate_files]

    gender_data = []
    for name, file, score in zip(candidate_names, candidate_files, bias_scores):
        gender_data.append({"id": name, "Candidate": name, "gender_bias_score": score, "File": os.path.basename(file)})

    avg_bias = np.mean(bias_scores)
    summary = {
        "average_bias": avg_bias,
        "min_bias": min(bias_scores),
        "max_bias": max(bias_scores),
        "median_bias": np.median(bias_scores),
        "most_neutral_candidate": candidate_names[np.argmin(bias_scores)],
        "least_neutral_candidate": candidate_names[np.argmax(bias_scores)]
    }

    report = generate_gender_bias_report(candidate_texts, candidate_files, bias_scores, output_folders)

    return {
        "bias_data": gender_data,
        "summary": summary,
        "report": report
    }
