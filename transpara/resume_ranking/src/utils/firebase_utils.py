from firebase_admin import credentials, firestore
from src.utils.firebase_init import initialize_firebase
from firebase_admin import storage

import tempfile
import os
import json

initialize_firebase()
firestore_db = firestore.client()

def get_candidate_name_from_firestore(job_id: str, user_id: str) -> str:
    doc_ref = firestore_db.collection("jobs").document(job_id).collection("applications").document(user_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        return f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
    return user_id

def get_candidate_id_from_firestore(job_id: str, user_id: str) -> str:
    doc_ref = firestore_db.collection("jobs").document(job_id).collection("applications").document(user_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        candidate_id = data.get("candidateID")
        if candidate_id:
            return candidate_id
        else:
            print(f"⚠️ 'candidateID' not found in Firestore for userId={user_id}")
    else:
        print(f"⚠️ Firestore document not found: /jobs/{job_id}/applications/{user_id}")
    return user_id


def upload_json_to_firebase(data: dict, path: str) -> str:
    bucket = storage.bucket()
    blob = bucket.blob(path)

    with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".json") as tmp:
        json.dump(data, tmp, indent=2, ensure_ascii=False)
        tmp_path = tmp.name

    blob.upload_from_filename(tmp_path, content_type="application/json")
    os.remove(tmp_path)

    return f"gs://{bucket.name}/{path}"

def load_json_from_firebase(job_id: str, filename: str) -> dict:
    bucket = storage.bucket()
    blob = bucket.blob(f"reports/{job_id}/{filename}")

    with tempfile.NamedTemporaryFile(mode="r+", delete=False) as temp_file:
        blob.download_to_filename(temp_file.name)
        temp_file.seek(0)
        return json.load(temp_file)
