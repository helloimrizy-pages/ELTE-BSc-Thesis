import os
import numpy as np
import pandas as pd
import spacy
import json

from src.utils.file_utils import save_to_json
from collections import Counter
from typing import Dict, List, Optional, Any

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model not found. Please run: python -m spacy download en_core_web_sm")
    raise

LOW_BIAS_THRESHOLD = 1.0
MODERATE_BIAS_THRESHOLD = 3.0

def analyze_gender_bias_distribution(
    candidate_texts: List[str],
    candidate_files: List[str],
    ranked_indices: Optional[np.ndarray] = None,
    output_folders: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    from src.models.linguistic_debiasing import compute_gender_bias_score

    bias_scores = [compute_gender_bias_score(text) for text in candidate_texts]
    candidate_names = [os.path.basename(file).replace('.pdf', '') for file in candidate_files]

    gender_data = pd.DataFrame({
        'Candidate': candidate_names,
        'Gender Bias Score': bias_scores,
        'File': [os.path.basename(file) for file in candidate_files]
    })

    if ranked_indices is not None:
        gender_data['Rank'] = len(candidate_files)
        for rank, idx in enumerate(ranked_indices, start=1):
            if idx < len(candidate_files):
                gender_data.loc[idx, 'Rank'] = rank

    avg_bias = np.mean(bias_scores)
    summary = {
        'average_bias': avg_bias,
        'min_bias': min(bias_scores),
        'max_bias': max(bias_scores),
        'median_bias': np.median(bias_scores),
        'most_neutral_candidate': candidate_names[np.argmin(bias_scores)],
        'least_neutral_candidate': candidate_names[np.argmax(bias_scores)]
    }

    report = generate_gender_bias_report(candidate_texts, candidate_files, bias_scores, output_folders)

    return {
        'bias_data': gender_data.to_dict(orient='records'),
        'summary': summary,
        'report': report
    }

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
    
    avg_bias = sum(bias_scores) / len(bias_scores) if bias_scores else 0

    report_data = {
        "title": "Gender Bias Analysis Report",
        "summary": {
            "average_gender_bias_score": round(avg_bias, 2),
            "range": f"{min(bias_scores):.2f} - {max(bias_scores):.2f}"
        },
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

    for text, file, score in zip(candidate_texts, candidate_files, bias_scores):
        name = os.path.basename(file).replace('.pdf', '')
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
            "name": name,
            "gender_bias_score": round(score, 2),
            "male_terms": male_freq if male_freq else "none",
            "female_terms": female_freq if female_freq else "none",
            "recommendation": recommendation
        }
        report_data["candidate_analysis"].append(candidate_report)

    report_json = json.dumps(report_data, indent=2)

    if output_folders:
        report_path = os.path.join(output_folders["reports"], "gender_bias_report.json")
        save_to_json(report_data, report_path)
    
    print(f"\nGender bias report generated and saved to {report_path}.")
    
    return report_json
