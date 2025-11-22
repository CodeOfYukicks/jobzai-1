/**
 * Script pour analyser la structure des jobs dans Firestore
 * et identifier quels champs manquent pour le filtrage
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeJobs() {
    console.log('🔍 Analyzing job documents in Firestore...\n');

    try {
        // Fetch 10 sample jobs
        const jobsQuery = query(collection(db, 'jobs'), limit(10));
        const snapshot = await getDocs(jobsQuery);

        if (snapshot.empty) {
            console.log('❌ No jobs found in database!');
            return;
        }

        console.log(`📊 Found ${snapshot.size} sample jobs\n`);

        // Analyze each job
        const fieldsPresent = new Map<string, number>();
        const sampleValues = new Map<string, Set<any>>();

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();

            if (index === 0) {
                console.log('📄 Sample job structure:');
                console.log(JSON.stringify(data, null, 2));
                console.log('\n' + '='.repeat(80) + '\n');
            }

            // Count which fields are present
            Object.keys(data).forEach(field => {
                fieldsPresent.set(field, (fieldsPresent.get(field) || 0) + 1);

                if (!sampleValues.has(field)) {
                    sampleValues.set(field, new Set());
                }
                sampleValues.get(field)!.add(typeof data[field] === 'object' ? JSON.stringify(data[field]) : data[field]);
            });
        });

        // Report on filter-related fields
        console.log('🎯 Filter-Related Fields Analysis:\n');

        const filterFields = [
            'type',
            'employmentType',
            'remote',
            'remotePolicy',
            'workLocation',
            'seniority',
            'level',
            'experienceLevel',
            'postedAt',
            'createdAt'
        ];

        filterFields.forEach(field => {
            const count = fieldsPresent.get(field) || 0;
            const percentage = ((count / snapshot.size) * 100).toFixed(0);
            const values = sampleValues.get(field);

            const status = count === snapshot.size ? '✅' : count > 0 ? '⚠️ ' : '❌';
            console.log(`${status} ${field}: ${count}/${snapshot.size} (${percentage}%)`);

            if (values && values.size > 0 && values.size < 20) {
                console.log(`   Sample values: ${Array.from(values).slice(0, 5).join(', ')}`);
            }
        });

        console.log('\n' + '='.repeat(80) + '\n');
        console.log('📋 All Fields Found:\n');

        Array.from(fieldsPresent.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([field, count]) => {
                const percentage = ((count / snapshot.size) * 100).toFixed(0);
                console.log(`  • ${field}: ${count}/${snapshot.size} (${percentage}%)`);
            });

        console.log('\n' + '='.repeat(80) + '\n');
        console.log('💡 Recommendations:\n');

        // Check what's missing
        const missingFields = filterFields.filter(f => !fieldsPresent.has(f) || fieldsPresent.get(f)! < snapshot.size);

        if (missingFields.length > 0) {
            console.log('❗ Missing or incomplete fields for filtering:');
            missingFields.forEach(f => console.log(`   - ${f}`));
            console.log('\n✨ Solution: Create a Cloud Function to enrich jobs with missing tags');
        } else {
            console.log('✅ All required fields are present!');
        }

    } catch (error) {
        console.error('❌ Error analyzing jobs:', error);
    }
}

analyzeJobs().then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
