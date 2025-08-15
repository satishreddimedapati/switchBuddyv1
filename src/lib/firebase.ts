// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "switchbuddy-7ioes",
  "appId": "1:639744788063:web:387952a30587b3f03a3dea",
  "storageBucket": "switchbuddy-7ioes.firebasestorage.app",
  "apiKey": "AIzaSyD5gM4ICs6Io0EyswJ8ffQXoVEbbBdZe_k",
  "authDomain": "switchbuddy-7ioes.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "639744788063"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
