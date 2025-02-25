﻿import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
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

// Utilisez l'émulateur uniquement en développement
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
