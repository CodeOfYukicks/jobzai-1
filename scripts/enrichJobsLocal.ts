/**
 * Local script to enrich a job directly
 * Run: npx tsx scripts/enrichJobsLocal.ts JOB_ID
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// Import enrichment functions from the compiled JS
async function enrichJobLocal(jobId: string) {
    // Use require since the functions are compiled to CommonJS
    const { enrichJob } = require('../functions/lib/utils/jobEnrichment');
    await enrichJob(jobId);
}

async function main() {
    const jobId = process.argv[2];

    console.log('🚀 Job Enrichment Tool (Local)');
    console.log('================================\n');

    if (!jobId || jobId === 'test') {
        console.log('🧪 Testing enrichment on first job...\n');
        const db = admin.firestore();
        const snapshot = await db.collection('jobs')
            .orderBy('postedAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('❌ No jobs found in database');
            process.exit(1);
        }

        const job = snapshot.docs[0];
        console.log(`Found job: ${job.id}`);
        console.log(`Title: ${job.data().title}`);
        console.log(`Company: ${job.data().company}\n`);

        await enrichJobLocal(job.id);

        console.log('\n✅ Test complete!');
        console.log(`\nView in Firestore: jobs/${job.id}`);
        process.exit(0);
    }

    console.log(`📝 Enriching job: ${jobId}\n`);

    try {
        await enrichJobLocal(jobId);
        console.log('\n✅ Done! Check Firestore to see the new fields:');
        console.log(`https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs/${jobId}`);
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
