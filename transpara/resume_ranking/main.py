import os
import argparse
import json
from src.data.embeddings import load_mbert_model
from src.models.ranking_model import rank_candidates, display_ranking, load_ranking_model
from src.utils.io_utils import load_candidate_pdfs, load_job_description
from src.analysis.chatgpt_explanation import generate_chatgpt_explanations
from src.analysis.gender_analysis import analyze_gender_bias_distribution
from src.analysis.shap_explanation import generate_shap_explanations
from src.utils.file_utils import clean_html, load_from_json, save_to_json
from src.utils.text_utils import compute_text_hash, extract_matched_keywords
from src.utils.job_desc_keyword_extraction import extract_keywords_from_job_description
from src.utils.firebase_utils import load_json_from_firebase
from training.train_model import prepare_training_data, train_ranking_model
from firebase_admin import firestore
from datetime import datetime

def run_pipeline(job_description_path: str, candidates_dir: str, job_id: str):
    job_description_text = load_job_description(job_description_path)
    job_description_text = clean_html(job_description_text)
    print("\nJob description text:", job_description_text)

    current_hash = compute_text_hash(job_description_text)
    candidate_files, candidate_texts = load_candidate_pdfs(candidates_dir)
    tokenizer, model = load_mbert_model()

    output_folders = {
        "models": os.path.join("output", "models", job_id),
        "reports": os.path.join("output", "reports", job_id)
    }
    
    os.makedirs(output_folders["models"], exist_ok=True)
    os.makedirs(output_folders["reports"], exist_ok=True)
    metadata_path = os.path.join(output_folders["reports"], "job_metadata.json")

    if os.path.exists(metadata_path):
        old_metadata = load_from_json(metadata_path)
        old_hash = old_metadata.get("job_hash")
    else:
        old_metadata = {}
        old_hash = None

    retrain_required = current_hash != old_hash
    print(f"Job description hash changed? {retrain_required}")

    if retrain_required:
        print("Extracting keywords from job description using GPT...")
        gpt_keywords = extract_keywords_from_job_description(job_description_text)
        sorted_gpt_keywords = sorted(gpt_keywords)

        # Save extracted keywords
        keywords_path = os.path.join(output_folders["reports"], "keywords.json")
        save_to_json({
            "job_id": job_id,
            "keywords": sorted_gpt_keywords
        }, keywords_path, upload_to_firebase=True)

        # Load full training CVs
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, ".."))
        training_data_dir = os.path.join(project_root, "resume_generator", "output")

        print(f"Loading training data from: {training_data_dir}")
        training_files, training_texts = load_candidate_pdfs(training_data_dir)

        print("Preparing training data using extracted keywords...")
        training_df = prepare_training_data(
            job_description_text=job_description_text,
            candidate_texts=training_texts,
            tokenizer=tokenizer,
            model=model,
            skill_keywords=sorted_gpt_keywords,
            gender_directions=None,
            synthetic=True
        )

        print("Training ranking model...")
        model_path = os.path.join(output_folders["models"], "ranking_model.joblib")
        trained_model, feature_names = train_ranking_model(
            features_df=training_df,
            save_path=model_path,
            output_folders=output_folders
        )

        save_to_json({
            "job_id": job_id,
            "job_hash": current_hash
        }, metadata_path)

    else:
        print("Job description unchanged. Skipping model retraining.")

        keywords_path = os.path.join(output_folders["reports"], "keywords.json")

        try:
            saved_keywords = load_json_from_firebase(job_id, "keywords.json").get("keywords", [])
            sorted_gpt_keywords = sorted(saved_keywords)
            print("☁️ Loaded GPT keywords from Firebase Storage.")
        except Exception as e:
            print(f"⚠️ Failed to load keywords from Firebase Storage: {e}")
            print("⏳ Re-extracting keywords using GPT...")

            sorted_gpt_keywords = extract_keywords_from_job_description(job_description_text)

            save_to_json({
                "job_id": job_id,
                "keywords": sorted_gpt_keywords
            }, keywords_path, upload_to_firebase=True)

        print("\n📌 Keyword Matches in Each Candidate CV:")
        for candidate_file, text in zip(candidate_files, candidate_texts):
            matched_keywords = extract_matched_keywords(text, sorted_gpt_keywords)
            print(f"- {candidate_file}: {len(matched_keywords)} matched keywords")
            print(f"  ➤ {matched_keywords}")
        model_path = os.path.join(output_folders["models"], "ranking_model.joblib")
        trained_model = load_ranking_model(model_path)

    # ✅ STEP 3: Run ranking pipeline with retrained model
    print("Running candidate ranking pipeline...\n")
    results = rank_candidates(
        job_description_text,
        candidate_texts,
        candidate_files,
        tokenizer,
        model,
        output_folders,
        job_id,
        custom_model=trained_model,
        custom_keywords=sorted_gpt_keywords
    )

    display_ranking(job_id)

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

    try:
        firestore_db = firestore.client()
        metadata_ref = firestore_db.collection("jobs").document(job_id).collection("analysis_metadata").document("summary")

        num_applicants = len(candidate_files)
        metadata_ref.set({
            "numApplicants": num_applicants,
            "lastAnalyzedAt": datetime.utcnow().isoformat()
        }, merge=True)

        print(f"✅ Analysis metadata updated: {num_applicants} applicants, {datetime.utcnow().isoformat()}")

    except Exception as e:
        print(f"⚠️ Failed to update analysis metadata in Firestore: {e}")

def main():
    parser = argparse.ArgumentParser(description="Candidate Ranking System")
    parser.add_argument('--job_description', type=str, required=True)
    parser.add_argument('--candidates_dir', type=str, required=True)
    parser.add_argument('--job_id', type=str, required=True)
    args = parser.parse_args()

    run_pipeline(args.job_description, args.candidates_dir, args.job_id)

if __name__ == "__main__":
    main()
