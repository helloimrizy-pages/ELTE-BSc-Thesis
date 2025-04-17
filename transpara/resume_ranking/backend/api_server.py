import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import main as run_pipeline

import json
import tempfile
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from firebase_admin import credentials, initialize_app, storage, firestore
from src.utils.firebase_init import initialize_firebase

app = FastAPI()

initialize_firebase()

firestore_db = firestore.client()
bucket = storage.bucket()

# --- Request Schema ---
class AnalyzeRequest(BaseModel):
    jobId: str

def download_candidate_pdfs(job_id: str, local_folder: str) -> int:
    """
    Downloads all candidate PDFs for a given jobId from Firebase Storage to local folder.
    """
    prefix = f"applications/{job_id}/"
    blobs = bucket.list_blobs(prefix=prefix)
    count = 0

    for blob in blobs:
        if blob.name.lower().endswith(".pdf"):
            file_name = os.path.basename(blob.name)
            local_path = os.path.join(local_folder, file_name)
            blob.download_to_filename(local_path)
            count += 1

    return count


def download_job_description(job_id: str, output_path: str) -> bool:
    """
    Downloads job description text from Firestore for a given jobId.
    """
    job_ref = firestore_db.collection("jobs").document(job_id)
    job_data = job_ref.get()
    if not job_data.exists:
        return False

    job_dict = job_data.to_dict()
    job_text = job_dict.get("description", "")
    if not job_text:
        return False

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(job_text)
    return True


def load_json_report(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- API Route ---
@app.post("/api/analyze-candidates")
def analyze_candidates(request: AnalyzeRequest):
    job_id = request.jobId

    # Create temp data directory for this request
    temp_data_dir = os.path.join("data", job_id)
    os.makedirs(temp_data_dir, exist_ok=True)

    job_desc_path = os.path.join(temp_data_dir, "job_desc.txt")

    # Download job description and CVs from Firebase
    success = download_job_description(job_id, job_desc_path)
    if not success:
        raise HTTPException(status_code=404, detail="Job description not found in Firestore.")

    num_cvs = download_candidate_pdfs(job_id, temp_data_dir)
    if num_cvs == 0:
        raise HTTPException(status_code=404, detail="No candidate resumes found in Firebase Storage.")

    # Run backend pipeline
    print(f"Running pipeline for Job ID: {job_id}")
    pipeline_path = os.path.abspath("main.py")
    os.system(f"python {pipeline_path} --job_description {job_desc_path} --candidates_dir {temp_data_dir} --job_id {job_id}")

    output_dir = os.path.join("output", "reports", job_id)
    return {
        "ranking_results": load_json_report(os.path.join(output_dir, "ranking_results.json")),
        "shap_explanations": load_json_report(os.path.join(output_dir, "shap_explanations.json")),
        "chatgpt_explanations": load_json_report(os.path.join(output_dir, "chatgpt_explanations.json")),
        "gender_bias_report": load_json_report(os.path.join(output_dir, "gender_bias_analysis.json")),
        "candidate_texts": load_json_report(os.path.join(output_dir, "candidate_texts.json"))
    }

@app.get("/api/get-analysis/{job_id}")
def get_analysis(job_id: str):
    output_dir = os.path.join("output", "reports", job_id)
    return {
        "ranking_results": load_json_report(os.path.join(output_dir, "ranking_results.json")),
        "shap_explanations": load_json_report(os.path.join(output_dir, "shap_explanations.json")),
        "chatgpt_explanations": load_json_report(os.path.join(output_dir, "chatgpt_explanations.json")),
        "gender_bias_report": load_json_report(os.path.join(output_dir, "gender_bias_analysis.json")),
        "candidate_texts": load_json_report(os.path.join(output_dir, "candidate_texts.json"))
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/api/analysis-metadata/{job_id}")
def get_analysis_metadata(job_id: str):
    doc_ref = firestore_db.collection("jobs").document(job_id).collection("analysis_metadata").document("summary")
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return {}
