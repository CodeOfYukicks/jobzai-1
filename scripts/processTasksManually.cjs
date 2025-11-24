/**
 * 🚀 Process jobFetchTasks manually
 * Since the onDocumentCreated trigger isn't firing, we'll process tasks ourselves
 * 
 * Run: node scripts/processTasksManually.cjs
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

// Import ATS fetchers
async function fetchGreenhouse(company) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
        title: j.title || '',
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: j.location?.name || '',
        description: j.content || '',
        skills: [],
        applyUrl: j.absolute_url || '',
        ats: 'greenhouse',
        externalId: j.id?.toString() || '',
        postedAt: j.updated_at || new Date().toISOString(),
        companyLogo: null,
    }));
}

async function fetchLever(company) {
    const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data) ? data : []).map(j => ({
        title: j.text || '',
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: j.categories?.location || j.location || '',
        description: j.description || j.descriptionPlain || '',
        skills: [],
        applyUrl: j.hostedUrl || j.applyUrl || '',
        ats: 'lever',
        externalId: j.id || '',
        postedAt: j.createdAt || new Date().toISOString(),
        companyLogo: null,
    }));
}

async function fetchSmartRecruiters(company) {
    const url = `https://api.smartrecruiters.com/v1/companies/${company}/postings`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.content || []).map(j => ({
        title: j.name || '',
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: j.location?.city || '',
        description: j.jobAd?.sections?.jobDescription?.text || '',
        skills: [],
        applyUrl: j.ref || '',
        ats: 'smartrecruiters',
        externalId: j.id || '',
        postedAt: j.releasedDate || new Date().toISOString(),
        companyLogo: null,
    }));
}

async function fetchAshby(company) {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
        title: j.title || '',
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: j.locationName || j.location || '',
        description: j.descriptionHtml || j.description || '',
        skills: [],
        applyUrl: j.jobUrl || '',
        ats: 'ashby',
        externalId: j.id || '',
        postedAt: j.publishedDate || new Date().toISOString(),
        companyLogo: null,
    }));
}

function hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

async function processTask(task) {
    const { provider, company, taskId } = task;
    
    try {
        console.log(`\n🔄 Processing: ${provider}/${company}`);
        
        let jobs = [];
        
        if (provider === 'greenhouse') {
            jobs = await fetchGreenhouse(company);
        } else if (provider === 'lever') {
            jobs = await fetchLever(company);
        } else if (provider === 'smartrecruiters') {
            jobs = await fetchSmartRecruiters(company);
        } else if (provider === 'ashby') {
            jobs = await fetchAshby(company);
        } else if (provider === 'workday') {
            console.log(`   ⏩ Skipping Workday (has externalId issues)`);
            return { success: true, skipped: true, jobs: 0 };
        }
        
        console.log(`   📥 Fetched ${jobs.length} jobs`);
        
        if (jobs.length === 0) {
            return { success: true, jobs: 0 };
        }
        
        // Write to Firestore
        const batch = db.batch();
        let written = 0;
        
        for (const j of jobs) {
            try {
                const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
                    ? j.externalId.replace(/\//g, '_')
                    : '';
                const docId = cleanExternalId.length > 0
                    ? `${j.ats}_${cleanExternalId}`
                    : `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
                
                const ref = db.collection('jobs').doc(docId);
                
                const jobData = {
                    title: j.title || '',
                    company: j.company || '',
                    companyLogo: j.companyLogo || null,
                    location: j.location || '',
                    description: j.description || '',
                    skills: j.skills || [],
                    applyUrl: j.applyUrl || '',
                    ats: j.ats,
                    externalId: j.externalId,
                    postedAt: admin.firestore.Timestamp.fromDate(new Date(j.postedAt)),
                };
                
                batch.set(ref, jobData, { merge: true });
                written++;
            } catch (e) {
                console.warn(`   ⚠️  Skipped job: ${e.message}`);
            }
        }
        
        await batch.commit();
        console.log(`   ✅ Written ${written} jobs to Firestore`);
        
        // Mark task as completed
        await db.collection('jobFetchTasks').doc(taskId).update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            jobsFetched: jobs.length,
            jobsWritten: written,
        });
        
        return { success: true, jobs: written };
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        
        await db.collection('jobFetchTasks').doc(taskId).update({
            status: 'failed',
            error: error.message,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return { success: false, error: error.message, jobs: 0 };
    }
}

async function main() {
    console.log('🚀 PROCESSING ALL PENDING TASKS MANUALLY\n');
    console.log('='.repeat(70));
    
    // Get all pending tasks
    const tasksSnapshot = await db.collection('jobFetchTasks')
        .where('status', '==', 'pending')
        .get();
    
    console.log(`\n📋 Found ${tasksSnapshot.size} pending tasks to process\n`);
    
    if (tasksSnapshot.empty) {
        console.log('✅ No pending tasks found!');
        return;
    }
    
    let totalJobs = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    // Process tasks with concurrency limit (5 at a time to avoid rate limits)
    const tasks = tasksSnapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tasks.length / BATCH_SIZE)}...`);
        
        const results = await Promise.all(batch.map(task => processTask(task)));
        
        results.forEach(r => {
            if (r.skipped) skippedCount++;
            else if (r.success) successCount++;
            else failedCount++;
            totalJobs += r.jobs;
        });
        
        // Small delay between batches
        if (i + BATCH_SIZE < tasks.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 PROCESSING COMPLETE!\n');
    console.log(`📊 Results:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total jobs written: ${totalJobs}`);
    console.log('\n✅ Jobs are now in Firestore!');
    console.log('💡 Next step: Run enrichment with: node scripts/reEnrichAllJobs.cjs\n');
}

main().then(() => process.exit(0)).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

