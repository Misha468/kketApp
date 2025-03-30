// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzmqnjAHy73U3-_DiAsk_Y3hK_DBCHztQ",
  authDomain: "myapplicaton-68363.firebaseapp.com",
  projectId: "myapplicaton-68363",
  storageBucket: "myapplicaton-68363.firebasestorage.app",
  messagingSenderId: "408871161450",
  appId: "1:408871161450:web:da69b45a8a7fb8a6a24413",
  measurementId: "G-YS9G6GPR5R",
};
console.log(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getDatabase(app);

export { auth, db };
