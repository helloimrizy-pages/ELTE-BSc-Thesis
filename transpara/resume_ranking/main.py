import os
import argparse
from src.data.embeddings import load_mbert_model
from src.models.ranking_model import rank_candidates, display_ranking
from src.utils.io_utils import load_candidate_pdfs, load_job_description
from src.analysis.chatgpt_explanation import generate_chatgpt_explanations
from src.analysis.gender_analysis import analyze_gender_bias_distribution
from src.analysis.shap_explanation import generate_shap_explanations

def run_pipeline(job_description_path: str, candidates_dir: str, job_id: str):
    job_description_text = load_job_description(job_description_path)
    candidate_files, candidate_texts = load_candidate_pdfs(candidates_dir)
    tokenizer, model = load_mbert_model()

    output_folders = {
        "models": os.path.join("output", "models"),
        "reports": os.path.join("output", "reports", job_id)
    }

    os.makedirs(output_folders["reports"], exist_ok=True)

    print("Running candidate ranking pipeline...\n")
    results = rank_candidates(
        job_description_text, candidate_texts, candidate_files, tokenizer, model, output_folders, job_id
    )

    display_ranking(os.path.join(output_folders["reports"], "ranking_results.json"))

    print("\nRunning SHAP explanations...")
    generate_shap_explanations(candidate_files, results["explanations"], output_folders, job_id)

    print("\nGenerating ChatGPT explanations...")
    generate_chatgpt_explanations(
        results, job_description_text, candidate_files, candidate_texts, output_folders, job_id
    )

    print("\nRunning gender bias analysis...")
    analyze_gender_bias_distribution(
        candidate_texts,
        candidate_files,
        ranked_indices=results["ranked_indices"],
        output_folders=output_folders,
        job_id=job_id
    )

def main():
    parser = argparse.ArgumentParser(description="Candidate Ranking System")
    parser.add_argument('--job_description', type=str, required=True)
    parser.add_argument('--candidates_dir', type=str, required=True)
    parser.add_argument('--job_id', type=str, required=True)
    args = parser.parse_args()

    run_pipeline(args.job_description, args.candidates_dir, args.job_id)

if __name__ == "__main__":
    main()
