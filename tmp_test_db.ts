import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config extracted from src/lib/firebase.ts
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "dummy",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: "jobzai-1", // Based on previous conversations, project id is usually jobzai-1
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    const q = collection(db, 'blog_posts');
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by createdAt descending
    posts.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });

    console.log("Found", posts.length, "posts. Showing latest 5:");
    for (let i = 0; i < Math.min(5, posts.length); i++) {
        const p = posts[i];
        console.log(`-- Post ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Status: ${p.status}`);
        console.log(`category: ${p.category}`);
        if (p.scheduledAt) {
            console.log(`scheduledAt:`, p.scheduledAt);
        }
        if (p.createdAt) {
            console.log(`createdAt:`, p.createdAt);
        }
    }
    process.exit(0);
}

main().catch(console.error);
