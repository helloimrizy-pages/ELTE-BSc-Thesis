import os
import argparse
from src.data.embeddings import load_mbert_model
from src.models.ranking_model import rank_candidates, display_ranking
from src.utils.io_utils import load_candidate_pdfs, load_job_description
from src.analysis.chatgpt_explanation import generate_chatgpt_explanations
from src.analysis.gender_analysis import analyze_gender_bias_distribution
from src.analysis.shap_explanation import generate_shap_explanations

def main():
    parser = argparse.ArgumentParser(description="Candidate Ranking System")
    parser.add_argument('--job_description', type=str, default='data/job_desc/data.txt')
    parser.add_argument('--candidates_dir', type=str, default='data')
    args = parser.parse_args()

    job_description = load_job_description(args.job_description)
    candidate_files, candidate_texts = load_candidate_pdfs(args.candidates_dir)
    tokenizer, model = load_mbert_model()

    output_folders = {
        "models": os.path.join("output", "models"),
        "reports": os.path.join("output", "reports")
    }

    print("Running candidate ranking pipeline...\n")
    results = rank_candidates(
        job_description, candidate_texts, candidate_files, tokenizer, model, output_folders
    )

    display_ranking(os.path.join(output_folders["reports"], "ranking_results.json"))
    
    print("\nRunning SHAP explanations...")
    generate_shap_explanations(candidate_files, results["explanations"], output_folders)

    print("\nGenerating ChatGPT explanations...")
    generate_chatgpt_explanations(
        results, job_description, candidate_files, candidate_texts, output_folders
    )

    print("\nRunning gender bias analysis...")
    analyze_gender_bias_distribution(candidate_texts, candidate_files, ranked_indices=results["ranked_indices"], output_folders=output_folders)

if __name__ == "__main__":
    main()
