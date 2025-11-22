// Quick Fix Script: Link Existing CV Analysis to Job Application
// This script helps you manually link an existing CV analysis to a job application

/**
 * HOW TO USE THIS SCRIPT:
 * 
 * 1. Open your browser console (F12 → Console tab)
 * 2. Make sure you're logged in to the app
 * 3. Copy and paste this entire script into the console
 * 4. Run the linkAnalysisToJob function with the appropriate IDs
 * 
 * Example:
 * linkAnalysisToJob('analysis-id-here', 'job-id-here')
 */

async function linkAnalysisToJob(analysisId, jobApplicationId) {
    console.log('🔗 Starting manual link process...');
    console.log('Analysis ID:', analysisId);
    console.log('Job Application ID:', jobApplicationId);

    try {
        // Get Firebase auth
        const auth = window.firebase?.auth();
        if (!auth) {
            throw new Error('Firebase auth not found. Make sure you are on the app page.');
        }

        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in. Please log in first.');
        }

        console.log('Current user:', user.uid);

        // Get Firestore
        const db = window.firebase?.firestore();
        if (!db) {
            throw new Error('Firestore not found.');
        }

        // Update the job application with the analysis ID
        const jobRef = db.collection('users').doc(user.uid)
            .collection('jobApplications').doc(jobApplicationId);

        await jobRef.update({
            cvAnalysisId: analysisId,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Successfully linked analysis to job application!');
        console.log('You can now close the job modal and reopen it to see the Resume Lab section.');

        alert('✅ Analysis linked successfully! Close and reopen the job modal to see Resume Lab.');

    } catch (error) {
        console.error('❌ Error linking analysis:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Helper function to find analysis and job IDs
async function findMyAnalysesAndJobs() {
    try {
        const auth = window.firebase?.auth();
        const db = window.firebase?.firestore();
        const user = auth?.currentUser;

        if (!user) {
            console.error('No user logged in');
            return;
        }

        console.log('📋 Fetching your analyses...');
        const analysesSnapshot = await db.collection('users').doc(user.uid)
            .collection('analyses').get();

        console.log('📊 Your CV Analyses:');
        analysesSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.company} - ${data.jobTitle}`);
            console.log(`    ID: ${doc.id}`);
            console.log(`    Score: ${data.matchScore}%`);
            console.log('');
        });

        console.log('📋 Fetching your job applications...');
        const jobsSnapshot = await db.collection('users').doc(user.uid)
            .collection('jobApplications').get();

        console.log('💼 Your Job Applications:');
        jobsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.companyName} - ${data.position}`);
            console.log(`    ID: ${doc.id}`);
            console.log(`    Has CV Analysis: ${data.cvAnalysisId ? 'Yes (' + data.cvAnalysisId + ')' : 'No'}`);
            console.log('');
        });

        console.log('💡 To link an analysis to a job, use:');
        console.log('linkAnalysisToJob("analysis-id", "job-id")');

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

console.log('✅ Link script loaded!');
console.log('');
console.log('Available commands:');
console.log('  - findMyAnalysesAndJobs()  → List all your analyses and jobs with their IDs');
console.log('  - linkAnalysisToJob(analysisId, jobId)  → Link an analysis to a job');
console.log('');
console.log('Example usage:');
console.log('  1. Run: findMyAnalysesAndJobs()');
console.log('  2. Copy the IDs you want to link');
console.log('  3. Run: linkAnalysisToJob("abc123", "xyz789")');
