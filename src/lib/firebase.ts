// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
