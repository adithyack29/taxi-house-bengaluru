import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5IUhoYZDR78VFvis-rBmnPLy7fed5HAQ",
  authDomain: "taxi-house-bengaluru.firebaseapp.com",
  projectId: "taxi-house-bengaluru",
  storageBucket: "taxi-house-bengaluru.firebasestorage.app",
  messagingSenderId: "647549150788",
  appId: "1:647549150788:web:b4324960d711c32616fe11",
  measurementId: "G-PJ135RSBP8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
