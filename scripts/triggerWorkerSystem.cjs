/**
 * 🚀 Trigger the Worker System Manually
 * 
 * This script creates tasks in Firestore that will be automatically
 * processed by fetchJobsWorker (already deployed)
 * 
 * Run: node scripts/triggerWorkerSystem.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

// Import sources configuration
const ATS_SOURCES = [
    // Greenhouse (68 companies)
    { provider: 'greenhouse', company: 'stripe' },
    { provider: 'greenhouse', company: 'datadog' },
    { provider: 'greenhouse', company: 'airbnb' },
    { provider: 'greenhouse', company: 'gitlab' },
    { provider: 'greenhouse', company: 'coinbase' },
    { provider: 'greenhouse', company: 'robinhood' },
    { provider: 'greenhouse', company: 'figma' },
    { provider: 'greenhouse', company: 'discord' },
    { provider: 'greenhouse', company: 'plaid' },
    { provider: 'greenhouse', company: 'affirm' },
    { provider: 'greenhouse', company: 'benchling' },
    { provider: 'greenhouse', company: 'gusto' },
    { provider: 'greenhouse', company: 'chime' },
    { provider: 'greenhouse', company: 'brex' },
    { provider: 'greenhouse', company: 'amplitude' },
    { provider: 'greenhouse', company: 'airtable' },
    { provider: 'greenhouse', company: 'segment' },
    { provider: 'greenhouse', company: 'dropbox' },
    { provider: 'greenhouse', company: 'doordash' },
    { provider: 'greenhouse', company: 'instacart' },
    { provider: 'greenhouse', company: 'grubhub' },
    { provider: 'greenhouse', company: 'lyft' },
    { provider: 'greenhouse', company: 'squarespace' },
    { provider: 'greenhouse', company: 'etsy' },
    { provider: 'greenhouse', company: 'pinterest' },
    { provider: 'greenhouse', company: 'reddit' },
    { provider: 'greenhouse', company: 'twitch' },
    { provider: 'greenhouse', company: 'uber' },
    { provider: 'greenhouse', company: 'asana' },
    { provider: 'greenhouse', company: 'atlassian' },
    { provider: 'greenhouse', company: 'autodesk' },
    { provider: 'greenhouse', company: 'duolingo' },
    { provider: 'greenhouse', company: 'flexport' },
    { provider: 'greenhouse', company: 'hashicorp' },
    { provider: 'greenhouse', company: 'hudl' },
    { provider: 'greenhouse', company: 'hubspot' },
    { provider: 'greenhouse', company: 'intercom' },
    { provider: 'greenhouse', company: 'databricks' },
    { provider: 'greenhouse', company: 'snowflake' },
    { provider: 'greenhouse', company: 'confluent' },
    { provider: 'greenhouse', company: 'cockroachlabs' },
    { provider: 'greenhouse', company: 'mongodb' },
    { provider: 'greenhouse', company: 'elastic' },
    { provider: 'greenhouse', company: 'cloudflare' },
    { provider: 'greenhouse', company: 'fastly' },
    { provider: 'greenhouse', company: 'netlify' },
    { provider: 'greenhouse', company: 'vercel' },
    { provider: 'greenhouse', company: 'render' },
    { provider: 'greenhouse', company: 'fly' },
    { provider: 'greenhouse', company: 'planetscale' },
    { provider: 'greenhouse', company: 'supabase' },
    { provider: 'greenhouse', company: 'neon' },
    { provider: 'greenhouse', company: 'retool' },
    { provider: 'greenhouse', company: 'postman' },
    { provider: 'greenhouse', company: 'miro' },
    { provider: 'greenhouse', company: 'canva' },
    { provider: 'greenhouse', company: 'grammarly' },
    { provider: 'greenhouse', company: 'coursera' },
    { provider: 'greenhouse', company: 'udemy' },
    { provider: 'greenhouse', company: 'calm' },
    { provider: 'greenhouse', company: 'headspace' },
    { provider: 'greenhouse', company: 'peloton' },
    { provider: 'greenhouse', company: 'strava' },
    { provider: 'greenhouse', company: 'allbirds' },
    { provider: 'greenhouse', company: 'warbyparker' },
    { provider: 'greenhouse', company: 'glossier' },
    { provider: 'greenhouse', company: 'sweetgreen' },
    
    // Lever
    { provider: 'lever', company: 'metabase' },
    
    // SmartRecruiters (20 companies)
    { provider: 'smartrecruiters', company: 'devoteam' },
    { provider: 'smartrecruiters', company: 'vestiaire-collective' },
    { provider: 'smartrecruiters', company: 'aircall' },
    { provider: 'smartrecruiters', company: 'contentsquare' },
    { provider: 'smartrecruiters', company: 'dataiku' },
    { provider: 'smartrecruiters', company: 'doctolib' },
    { provider: 'smartrecruiters', company: 'deezer' },
    { provider: 'smartrecruiters', company: 'blablacar' },
    { provider: 'smartrecruiters', company: 'leboncoin' },
    { provider: 'smartrecruiters', company: 'meero' },
    { provider: 'smartrecruiters', company: 'alan' },
    { provider: 'smartrecruiters', company: 'qonto' },
    { provider: 'smartrecruiters', company: 'shift-technology' },
    { provider: 'smartrecruiters', company: 'swile' },
    { provider: 'smartrecruiters', company: 'spendesk' },
    { provider: 'smartrecruiters', company: 'ledger' },
    { provider: 'smartrecruiters', company: 'ivalua' },
    { provider: 'smartrecruiters', company: 'mirakl' },
    { provider: 'smartrecruiters', company: 'algolia' },
    { provider: 'smartrecruiters', company: 'criteo' },
    
    // Workday
    { provider: 'workday', company: 'nvidia', workdayDomain: 'wd5', workdaySiteId: 'NVIDIAExternalCareerSite' },
    
    // Ashby (8 companies)
    { provider: 'ashby', company: 'notion' },
    { provider: 'ashby', company: 'linear' },
    { provider: 'ashby', company: 'zapier' },
    { provider: 'ashby', company: 'replit' },
    { provider: 'ashby', company: 'ramp' },
    { provider: 'ashby', company: 'deel' },
    { provider: 'ashby', company: 'vercel' },
    { provider: 'ashby', company: 'temporal' },
];

async function triggerWorkerSystem() {
    console.log('🚀 TRIGGERING WORKER SYSTEM!\n');
    console.log('='.repeat(70));
    console.log(`📋 Creating ${ATS_SOURCES.length} tasks for workers to process...`);
    console.log('='.repeat(70));
    
    const executionId = `manual_${Date.now()}`;
    const batch = db.batch();
    let taskCount = 0;
    
    try {
        // Create a task for each ATS source
        for (const source of ATS_SOURCES) {
            const taskId = `${source.provider}_${source.company}_${Date.now()}_${taskCount}`;
            const taskRef = db.collection('jobFetchTasks').doc(taskId);
            
            batch.set(taskRef, {
                taskId,
                provider: source.provider,
                company: source.company,
                workdayDomain: source.workdayDomain || null,
                workdaySiteId: source.workdaySiteId || null,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                executionId,
                retryCount: 0,
                maxRetries: 3,
            });
            
            taskCount++;
            console.log(`   ✅ Created task ${taskCount}/${ATS_SOURCES.length}: ${source.provider}/${source.company}`);
        }
        
        console.log('\n💾 Committing tasks to Firestore...');
        await batch.commit();
        
        console.log('\n' + '='.repeat(70));
        console.log('🎉 SUCCESS! Created all tasks!');
        console.log('='.repeat(70));
        console.log(`\n📊 Summary:`);
        console.log(`   Tasks created: ${taskCount}`);
        console.log(`   Execution ID: ${executionId}`);
        console.log(`\n🔥 Workers will now process these tasks automatically!`);
        console.log(`   - Up to 10 workers in parallel`);
        console.log(`   - Each worker fetches + writes + enriches jobs`);
        console.log(`   - Should complete in 10-15 minutes`);
        
        console.log(`\n📺 Monitor progress:`);
        console.log(`   1. Firebase Console → Firestore → jobFetchTasks`);
        console.log(`   2. Firebase Console → Functions → Logs → fetchJobsWorker`);
        console.log(`   3. Watch for jobs appearing in 'jobs' collection`);
        
        console.log(`\n✅ All done! Workers are working... 🚀\n`);
        
        // Store execution metrics
        await db.collection('schedulerMetrics').doc(executionId).set({
            executionId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            tasksCreated: taskCount,
            sources: ATS_SOURCES.map(s => `${s.provider}:${s.company}`),
            status: 'completed',
            trigger: 'manual',
        });
        
    } catch (error) {
        console.error('\n❌ ERROR creating tasks:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run it!
triggerWorkerSystem();

