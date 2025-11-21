/**
 * Debug script to test Workday and Ashby fetchers
 */

import { fetchWorkday, fetchAshby } from '../src/utils/atsFetchers';

async function testWorkday() {
    console.log('\n🧪 Testing Workday fetcher...');
    console.log('='.repeat(60));

    try {
        const companySlug = 'nvidia';
        const domain = 'wd5';
        const siteId = 'NVIDIAExternalCareerSite';

        console.log(`📍 Company: ${companySlug}`);
        console.log(`📍 Domain: ${domain}`);
        console.log(`📍 Site ID: ${siteId}`);
        console.log(`📍 URL: https://${companySlug}.${domain}.myworkdayjobs.com/wday/cxs/${companySlug}/${siteId}/jobs`);

        const jobs = await fetchWorkday(companySlug, domain, siteId);

        console.log(`\n✅ SUCCESS: Fetched ${jobs.length} jobs from Workday`);

        if (jobs.length > 0) {
            console.log('\n📄 Sample job:');
            console.log(JSON.stringify(jobs[0], null, 2));
        }

        return { success: true, count: jobs.length, error: null };
    } catch (error: any) {
        console.error('\n❌ WORKDAY FETCH FAILED:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        return { success: false, count: 0, error: error.message };
    }
}

async function testAshby() {
    console.log('\n🧪 Testing Ashby fetcher...');
    console.log('='.repeat(60));

    const companies = ['notion', 'linear', 'zapier', 'replit', 'ramp', 'deel'];
    const results: Record<string, { success: boolean; count: number; error: string | null }> = {};

    for (const company of companies) {
        console.log(`\n📍 Testing company: ${company}`);
        console.log(`📍 URL: https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=true`);

        try {
            const jobs = await fetchAshby(company);

            console.log(`   ✅ SUCCESS: Fetched ${jobs.length} jobs`);

            if (jobs.length > 0) {
                console.log(`   📄 First job title: "${jobs[0].title}"`);
            }

            results[company] = { success: true, count: jobs.length, error: null };
        } catch (error: any) {
            console.error(`   ❌ FAILED: ${error.message}`);
            results[company] = { success: false, count: 0, error: error.message };
        }
    }

    console.log('\n📊 Ashby Summary:');
    console.log('='.repeat(60));
    Object.entries(results).forEach(([company, result]) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${company.padEnd(20)} → ${result.count} jobs ${result.error ? `(Error: ${result.error})` : ''}`);
    });

    return results;
}

async function main() {
    console.log('\n🚀 Starting Workday & Ashby Debug Session');
    console.log('='.repeat(60));

    // Test Workday
    const workdayResult = await testWorkday();

    // Test Ashby
    const ashbyResults = await testAshby();

    // Final summary
    console.log('\n\n📋 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nWorkday (Nvidia):`);
    console.log(`  ${workdayResult.success ? '✅' : '❌'} ${workdayResult.count} jobs ${workdayResult.error ? `- Error: ${workdayResult.error}` : ''}`);

    console.log(`\nAshby:`);
    const ashbySuccess = Object.values(ashbyResults).filter(r => r.success).length;
    const ashbyTotal = Object.keys(ashbyResults).length;
    const totalAshbyJobs = Object.values(ashbyResults).reduce((sum, r) => sum + r.count, 0);
    console.log(`  ${ashbySuccess}/${ashbyTotal} companies successful`);
    console.log(`  ${totalAshbyJobs} total jobs fetched`);

    // Failed Ashby companies
    const failedAshby = Object.entries(ashbyResults).filter(([_, r]) => !r.success);
    if (failedAshby.length > 0) {
        console.log(`\n  Failed companies:`);
        failedAshby.forEach(([company, result]) => {
            console.log(`    ❌ ${company}: ${result.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Debug session complete\n');
}

main().catch(console.error);
