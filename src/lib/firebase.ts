import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDn9EcNwseR_Z8cEGeQPbo-jxyF4KRYv5Q",
  authDomain: "jobzai.firebaseapp.com",
  projectId: "jobzai",
  storageBucket: "jobzai.firebasestorage.app",
  messagingSenderId: "408604248427",
  appId: "1:408604248427:web:74f1d51c8146dda1ef242e",
  measurementId: "G-M2CG9CM4EJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence);

// Helper function to upload image to Firebase Storage
export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, `images/${path}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Helper function to get image URL from Firebase Storage
export const getImageUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, `images/${path}`);
  return getDownloadURL(storageRef);
};

// Helper function to get all step images
export const getStepImages = async (): Promise<string[]> => {
  const stepUrls = [];
  for (let i = 1; i <= 5; i++) {
    const url = await getImageUrl(`step${i}.png`);
    stepUrls.push(url);
  }
  return stepUrls;
};

// Helper function to get all feature icons
export const getFeatureIcons = async (): Promise<Record<string, string>> => {
  const icons = ['dashboard', 'credit', 'tracking'];
  const iconUrls: Record<string, string> = {};
  
  for (const icon of icons) {
    iconUrls[icon] = await getImageUrl(`${icon}-icon.png`);
  }
  
  return iconUrls;
};

export default app;