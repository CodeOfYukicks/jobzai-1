/**
 * Test script to verify job search functionality using LOCAL EMULATORS
 * 
 * IMPORTANT: Start emulators first!
 * Run: firebase emulators:start
 * 
 * Then in another terminal:
 * Run: npx ts-node scripts/testJobSearchLocal.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin for EMULATORS
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'jobzai-39f7e', // Your project ID
  });
}

// Point to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

async function testJobSearch() {
  const db = admin.firestore();
  
  console.log('🔍 Testing Job Search Functionality (LOCAL EMULATORS)\n');
  console.log('⚠️  Make sure emulators are running: firebase emulators:start');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check total number of jobs
    console.log('\n1️⃣  Checking total jobs in database...');
    const allJobsSnap = await db.collection('jobs').orderBy('postedAt', 'desc').limit(500).get();
    console.log(`   ✓ Total jobs fetched: ${allJobsSnap.size}`);
    
    if (allJobsSnap.size === 0) {
      console.log('\n   ⚠️  WARNING: No jobs found in emulator!');
      console.log('   → You need to import data or fetch jobs first');
      console.log('   → Run the fetchJobsFromATS function or add test data');
      process.exit(0);
    }
    
    // 2. List all unique companies
    console.log('\n2️⃣  Listing all unique companies...');
    const companies = new Set<string>();
    allJobsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.company) {
        companies.add(data.company);
      }
    });
    
    const sortedCompanies = Array.from(companies).sort();
    console.log(`   ✓ Unique companies found: ${sortedCompanies.length}`);
    
    if (sortedCompanies.length > 0) {
      console.log('\n   Companies (all):');
      sortedCompanies.forEach(c => console.log(`     - ${c}`));
    }
    
    // 3. Check if Stripe jobs exist
    console.log('\n3️⃣  Searching for Stripe jobs...');
    const stripeJobs = allJobsSnap.docs.filter(doc => {
      const data = doc.data();
      const company = (data.company || '').toLowerCase();
      return company.includes('stripe');
    });
    
    if (stripeJobs.length > 0) {
      console.log(`   ✓ Found ${stripeJobs.length} Stripe job(s):`);
      stripeJobs.forEach(doc => {
        const data = doc.data();
        console.log(`\n     ID: ${doc.id}`);
        console.log(`     Title: ${data.title}`);
        console.log(`     Company: ${data.company}`);
        console.log(`     Location: ${data.location}`);
        console.log(`     ATS: ${data.ats}`);
        console.log(`     Posted: ${data.postedAt?.toDate ? data.postedAt.toDate().toISOString() : 'N/A'}`);
      });
    } else {
      console.log('   ✗ No Stripe jobs found in database');
      console.log('   → Searching for similar company names...');
      
      const similarCompanies = sortedCompanies.filter(c => 
        c.toLowerCase().includes('str') || 
        c.toLowerCase().includes('pay')
      );
      
      if (similarCompanies.length > 0) {
        console.log('   → Similar companies found:');
        similarCompanies.forEach(c => console.log(`     - ${c}`));
      }
    }
    
    // 4. Test search logic (simulating backend filter)
    console.log('\n4️⃣  Testing search logic...');
    const testKeywords = ['stripe', 'engineer', 'software', 'react'];
    
    for (const keyword of testKeywords) {
      const keywordLower = keyword.toLowerCase();
      const matches = allJobsSnap.docs.filter(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const description = (data.description || data.summary || '').toLowerCase();
        const company = (data.company || '').toLowerCase();
        const skills = Array.isArray(data.skills) 
          ? data.skills.join(' ').toLowerCase() 
          : '';
        
        return title.includes(keywordLower) ||
               description.includes(keywordLower) ||
               company.includes(keywordLower) ||
               skills.includes(keywordLower);
      });
      
      console.log(`   "${keyword}": ${matches.length} matches`);
      
      // Show first match for each keyword
      if (matches.length > 0) {
        const firstMatch = matches[0].data();
        console.log(`     → Example: ${firstMatch.title} at ${firstMatch.company}`);
      }
    }
    
    // 5. Check data structure
    console.log('\n5️⃣  Checking data structure (first job)...');
    if (allJobsSnap.docs.length > 0) {
      const firstJob = allJobsSnap.docs[0].data();
      console.log('   Fields present:');
      Object.keys(firstJob).forEach(key => {
        const value = firstJob[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const preview = type === 'string' && value.length > 50 
          ? `"${value.substring(0, 50)}..."` 
          : type === 'array' 
            ? `[${value.length} items]`
            : JSON.stringify(value).substring(0, 50);
        console.log(`     - ${key}: ${type} = ${preview}`);
      });
    }
    
    // 6. Check for jobs with missing company field
    console.log('\n6️⃣  Checking for jobs with missing company field...');
    const jobsWithoutCompany = allJobsSnap.docs.filter(doc => {
      const data = doc.data();
      return !data.company || data.company.trim() === '';
    });
    console.log(`   Jobs without company: ${jobsWithoutCompany.length}`);
    
    if (jobsWithoutCompany.length > 0) {
      console.log('   → Examples:');
      jobsWithoutCompany.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`     - ${doc.id}: ${data.title || 'No title'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete!\n');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total jobs: ${allJobsSnap.size}`);
    console.log(`   Unique companies: ${sortedCompanies.length}`);
    console.log(`   Stripe jobs: ${stripeJobs.length}`);
    console.log(`   Jobs missing company: ${jobsWithoutCompany.length}`);
    
    if (stripeJobs.length > 0) {
      console.log('\n✅ RESULT: Stripe jobs found! The search should work.');
      console.log('   → If search still doesn\'t work, check backend logs');
    } else {
      console.log('\n⚠️  RESULT: No Stripe jobs found in database.');
      console.log('   → You need to add Stripe jobs or check company names');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error during test:', error.message);
    console.error('\n💡 TROUBLESHOOTING:');
    console.error('   1. Are emulators running? Run: firebase emulators:start');
    console.error('   2. Is Firestore emulator on port 8080?');
    console.error('   3. Do you have any jobs in the emulator?');
  }
}

// Run the test
testJobSearch()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

