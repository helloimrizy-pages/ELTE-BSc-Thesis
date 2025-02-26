// File: src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDilwouDtny-U9VaGkg7HRwsOpg4bLoTQg",
  authDomain: "transpara-b2266.firebaseapp.com",
  projectId: "transpara-b2266",
  storageBucket: "transpara-b2266.firebasestorage.app",
  messagingSenderId: "345304537780",
  appId: "1:345304537780:web:5b8b5fd75b8485f59c95e1",
  measurementId: "G-5Y1TJJYC1J",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
