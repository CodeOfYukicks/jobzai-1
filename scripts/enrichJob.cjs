/**
 * Direct enrichment script - runs the compiled function code
 */

const admin = require('firebase-admin');
const { enrichJob } = require('../functions/lib/utils/jobEnrichment');

// Initialize with explicit project
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'jobzai'
    });
}

const jobId = process.argv[2];

async function main() {
    console.log('🚀 Job Enrichment Tool\n');

    if (!jobId || jobId === 'test') {
        console.log('🧪 Finding first job...\n');
        const db = admin.firestore();
        const snapshot = await db.collection('jobs')
            .orderBy('postedAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('❌ No jobs found');
            process.exit(1);
        }

        const job = snapshot.docs[0];
        const data = job.data();
        console.log(`📝 Job ID: ${job.id}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Company: ${data.company}\n`);

        console.log('🔄 Enriching...\n');
        await enrichJob(job.id);

        console.log('\n✅ Done! View at:');
        console.log(`https://console.firebase.google.com/project/jobzai-39f7e/firestore/data/jobs/${job.id}`);
    } else {
        console.log(`📝 Enriching job: ${jobId}\n`);
        await enrichJob(jobId);
        console.log('\n✅ Done!');
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
