/**
 * Check a specific Peloton job to see its description
 */
const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

async function checkJob() {
    const jobsSnapshot = await db.collection('jobs')
        .where('company', '==', 'Peloton')
        .limit(5)
        .get();
    
    if (jobsSnapshot.empty) {
        console.log('No Peloton marketing job found');
        return;
    }
    
    const job = jobsSnapshot.docs[0].data();
    
    console.log('Job Title:', job.title);
    console.log('\nExperience Level:', job.experienceLevels);
    console.log('Employment Type:', job.employmentTypes);
    console.log('\nDescription (first 500 chars):');
    console.log('---');
    console.log(job.description?.substring(0, 500));
    console.log('---');
    console.log('\nHas HTML tags?', /<[^>]+>/.test(job.description));
    console.log('Has &nbsp;?', /&nbsp;/.test(job.description));
}

checkJob().then(() => process.exit(0)).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

