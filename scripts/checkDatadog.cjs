const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'jobzai'
    });
}

const db = admin.firestore();

async function check() {
    console.log('Checking for Datadog jobs...');
    const snapshot = await db.collection('jobs')
        .where('company', '>=', 'Datadog')
        .where('company', '<=', 'Datadog\uf8ff')
        .get();

    console.log(`Found ${snapshot.size} jobs starting with "Datadog"`);

    if (snapshot.size > 0) {
        const job = snapshot.docs[0].data();
        console.log('Example job:', job.title, job.company);
    } else {
        // Check case insensitive (manual scan of a few jobs or just search for 'datadog' in company field via list)
        // Since we can't easily do case-insensitive query without full scan or specific field
        console.log('Checking all jobs for "datadog" in company name (case insensitive)...');
        const allJobs = await db.collection('jobs').select('company').get();
        const matches = allJobs.docs.filter(d => d.data().company && d.data().company.toLowerCase().includes('datadog'));
        console.log(`Found ${matches.length} jobs with "datadog" in company name (case insensitive)`);
    }
}

check().catch(console.error);
