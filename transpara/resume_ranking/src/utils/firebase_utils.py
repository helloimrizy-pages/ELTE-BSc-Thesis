from firebase_admin import credentials, firestore
from src.utils.firebase_init import initialize_firebase

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
