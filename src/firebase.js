import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAd9DGL2-sI5kKR7kxjZgDNwh0BWcd4NmU",
  authDomain: "personal-crm-2e587.firebaseapp.com",
  projectId: "personal-crm-2e587",
  storageBucket: "personal-crm-2e587.firebasestorage.app",
  messagingSenderId: "705752871232",
  appId: "1:705752871232:web:3bde6b2d3b70e103cb4aa5",
  measurementId: "G-S4R4VES60B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
