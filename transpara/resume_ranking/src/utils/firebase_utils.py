from firebase_admin import credentials, firestore
from src.utils.firebase_init import initialize_firebase

initialize_firebase()
firestore_db = firestore.client()

def get_candidate_name_from_firestore(job_id: str, file_name: str) -> str:
    doc_ref = firestore_db.collection("applications").document(f"{job_id}_{file_name}")
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        return f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
    return file_name.replace(".pdf", "")
