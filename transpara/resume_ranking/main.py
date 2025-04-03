import os
import argparse

from src.data.embeddings import load_mbert_model
from src.models.ranking_model import enhanced_ranking_pipeline
from src.utils.io_utils import load_candidate_pdfs, load_job_description, display_ranking
from src.analysis.chatgpt_explanation import generate_chatgpt_explanations

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

    print("Running candidate ranking pipeline...")
    results = enhanced_ranking_pipeline(
        job_description, candidate_texts, candidate_files, tokenizer, model, output_folders
    )

    display_ranking(os.path.join(output_folders["reports"], "ranking_results.json"))
    
    generate_chatgpt_explanations(
        results, job_description, candidate_files, candidate_texts, output_folders["reports"]
    )

if __name__ == "__main__":
    main()