/**
 * Test a sample of the expanded ATS sources
 * Run: node scripts/testExpandedSources.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'jobzai'
});

const db = admin.firestore();

// Sample companies to test from each ATS
const TEST_SOURCES = [
    // Greenhouse - test 5 new ones
    { provider: 'greenhouse', company: 'gitlab' },
    { provider: 'greenhouse', company: 'coinbase' },
    { provider: 'greenhouse', company: 'figma' },
    { provider: 'greenhouse', company: 'discord' },
    { provider: 'greenhouse', company: 'shopify' },
    
    // Lever - test 3 new ones
    { provider: 'lever', company: 'lattice' },
    { provider: 'lever', company: 'mixpanel' },
    { provider: 'lever', company: 'carta' },
    
    // SmartRecruiters - test 3 new ones
    { provider: 'smartrecruiters', company: 'doctolib' },
    { provider: 'smartrecruiters', company: 'alan' },
    { provider: 'smartrecruiters', company: 'qonto' },
    
    // Ashby - test 3 new ones
    { provider: 'ashby', company: 'vercel' },
    { provider: 'ashby', company: 'anthropic' },
    { provider: 'ashby', company: 'temporal' },
];

async function testSource(source) {
    try {
        console.log(`\n🔍 Testing ${source.provider}/${source.company}...`);
        
        let url = '';
        
        if (source.provider === 'greenhouse') {
            url = `https://boards-api.greenhouse.io/v1/boards/${source.company}/jobs?content=true`;
        } else if (source.provider === 'lever') {
            url = `https://api.lever.co/v0/postings/${source.company}?mode=json`;
        } else if (source.provider === 'smartrecruiters') {
            url = `https://api.smartrecruiters.com/v1/companies/${source.company}/postings`;
        } else if (source.provider === 'ashby') {
            url = `https://api.ashbyhq.com/posting-api/job-board/${source.company}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
            return { ...source, success: false, error: `HTTP ${response.status}`, jobs: 0 };
        }
        
        const data = await response.json();
        
        let jobCount = 0;
        if (source.provider === 'greenhouse') {
            jobCount = data.jobs?.length || 0;
        } else if (source.provider === 'lever') {
            jobCount = Array.isArray(data) ? data.length : 0;
        } else if (source.provider === 'smartrecruiters') {
            jobCount = data.content?.length || 0;
        } else if (source.provider === 'ashby') {
            jobCount = data.jobs?.length || 0;
        }
        
        if (jobCount > 0) {
            console.log(`   ✅ Success: ${jobCount} jobs found`);
            return { ...source, success: true, jobs: jobCount };
        } else {
            console.log(`   ⚠️  No jobs found (might be normal)`);
            return { ...source, success: true, jobs: 0 };
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { ...source, success: false, error: error.message, jobs: 0 };
    }
}

async function main() {
    console.log('🚀 Testing expanded ATS sources...\n');
    console.log(`Testing ${TEST_SOURCES.length} companies across ${new Set(TEST_SOURCES.map(s => s.provider)).size} ATS providers\n`);
    
    const results = [];
    
    for (const source of TEST_SOURCES) {
        const result = await testSource(source);
        results.push(result);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n\n📊 SUMMARY\n');
    console.log('='.repeat(70));
    
    const byProvider = {};
    results.forEach(r => {
        if (!byProvider[r.provider]) {
            byProvider[r.provider] = { total: 0, success: 0, failed: 0, jobs: 0 };
        }
        byProvider[r.provider].total++;
        if (r.success) {
            byProvider[r.provider].success++;
            byProvider[r.provider].jobs += r.jobs;
        } else {
            byProvider[r.provider].failed++;
        }
    });
    
    Object.entries(byProvider).forEach(([provider, stats]) => {
        console.log(`\n${provider.toUpperCase()}:`);
        console.log(`  Tested: ${stats.total}`);
        console.log(`  Success: ${stats.success} ✅`);
        console.log(`  Failed: ${stats.failed} ❌`);
        console.log(`  Total jobs found: ${stats.jobs}`);
    });
    
    const totalSuccess = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;
    const totalJobs = results.reduce((sum, r) => sum + r.jobs, 0);
    
    console.log('\n' + '='.repeat(70));
    console.log(`\nOVERALL:`);
    console.log(`  Success rate: ${totalSuccess}/${results.length} (${Math.round(totalSuccess/results.length*100)}%)`);
    console.log(`  Total jobs found: ${totalJobs}`);
    
    if (totalFailed > 0) {
        console.log(`\n\n⚠️  Failed sources:`);
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.provider}/${r.company}: ${r.error}`);
        });
    }
    
    console.log('\n✅ Test complete!\n');
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

