import { initializeApp } from 'firebase/app';
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
// Spécifier la région us-central1 pour correspondre aux fonctions déployées
export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);
export const storage = getStorage(app);

// Utilisez l'émulateur uniquement si explicitement activé via variable d'environnement
// Par défaut, utilisez les fonctions déployées même en local (évite les problèmes CORS)
const useEmulator = import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true';
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (useEmulator && isLocalhost) {
  console.log('🔧 Using Firebase Functions Emulator (localhost:5001)');
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // Si l'emulator est déjà connecté, ignorer l'erreur
    console.warn('Functions emulator already connected or not available');
  }
} else if (isLocalhost) {
  console.log('🌐 Using deployed Firebase Functions (even in local development)');
}
