//src\firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase config values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAozLiTvq8XjweAkMVetSyE5BqmWrc54Qw",
  authDomain: "business-card-64459.firebaseapp.com",
  projectId: "business-card-64459",
  storageBucket: "business-card-64459.firebasestorage.app",
  messagingSenderId: "943022881240",
  appId: "1:943022881240:web:d7d691ecf01353f52e5aad",
  measurementId: "G-M4C266464N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);