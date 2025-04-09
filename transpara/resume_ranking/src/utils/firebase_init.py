import firebase_admin
from firebase_admin import credentials, initialize_app

def initialize_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-adminsdk.json")
        return initialize_app(cred, {
            'storageBucket': 'transpara-b2266.firebasestorage.app'
        })
