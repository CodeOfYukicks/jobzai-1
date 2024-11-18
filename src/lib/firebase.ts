import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDn9EcNwseR_Z8cEGeQPbo-jxyF4KRYv5Q",
  authDomain: "jobzai.firebaseapp.com",
  projectId: "jobzai",
  storageBucket: "jobzai.firebasestorage.app",
  messagingSenderId: "408604248427",
  appId: "1:408604248427:web:74f1d51c8146dda1ef242e",
  measurementId: "G-M2CG9CM4EJ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configuration CORS pour Firebase Storage
const corsConfig = {
  origin: [
    'http://localhost:5174',
    'http://localhost:3000',
    'https://jobzai.firebaseapp.com'
  ],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  maxAge: 3600
};

// Appliquer les headers CORS aux requ├¬tes Storage
if (storage) {
  storage._customHeaders = {
    'Access-Control-Allow-Origin': corsConfig.origin.join(','),
    'Access-Control-Allow-Methods': corsConfig.methods.join(','),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(','),
    'Access-Control-Max-Age': corsConfig.maxAge.toString()
  };
}

// Connecter ├á l'├®mulateur uniquement en d├®veloppement local
if (import.meta.env.DEV) {
  // connectFunctionsEmulator(functions, "localhost", 5001);
}
