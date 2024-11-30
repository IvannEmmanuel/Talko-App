import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAycIxax0kln2TPfziTAvPuHW-zoBf_1Mg",
  authDomain: "talko-app.firebaseapp.com",
  projectId: "talko-app",
  storageBucket: "talko-app.firebasestorage.app",
  messagingSenderId: "941650063407",
  appId: "1:941650063407:web:7e8b37208bf3a9125596da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app)
const realtimeDb = getDatabase(app);

export { app, auth, db, realtimeDb };