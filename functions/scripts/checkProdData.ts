/**
 * Script to check if jobs collection exists in production Firebase
 * Run with: npx ts-node scripts/checkProdData.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin (uses Application Default Credentials)
if (!admin.apps.length) {
	admin.initializeApp();
}

async function checkProdData() {
	const db = admin.firestore();
	
	console.log('🔍 Checking Production Firestore Jobs Collection\n');
	console.log('='.repeat(60));
	
	try {
		// 1. Check if collection exists and count documents
		console.log('\n1️⃣  Checking jobs collection...');
		const jobsRef = db.collection('jobs');
		const snapshot = await jobsRef.limit(1).get();
		
		if (snapshot.empty) {
			console.log('   ❌ Collection "jobs" is EMPTY or does not exist');
			console.log('   → No jobs found in production database');
			console.log('   → You need to trigger fetchJobsFromATS manually');
			return;
		}
		
		// Get total count (approximate)
		const countSnapshot = await jobsRef.count().get();
		const totalCount = countSnapshot.data().count;
		
		console.log(`   ✅ Collection "jobs" exists`);
		console.log(`   📊 Total jobs (approximate): ${totalCount}`);
		
		// 2. Get sample of recent jobs
		console.log('\n2️⃣  Fetching sample of recent jobs...');
		const recentJobs = await jobsRef
			.orderBy('postedAt', 'desc')
			.limit(10)
			.get();
		
		console.log(`   ✓ Fetched ${recentJobs.size} recent jobs\n`);
		
		if (recentJobs.size > 0) {
			console.log('   Sample jobs:');
			recentJobs.docs.forEach((doc, idx) => {
				const data = doc.data();
				console.log(`   ${idx + 1}. ${data.title || 'N/A'} @ ${data.company || 'N/A'}`);
				console.log(`      Location: ${data.location || 'N/A'}`);
				console.log(`      Posted: ${data.postedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
				console.log(`      ATS: ${data.ats || 'N/A'}`);
				console.log('');
			});
		}
		
		// 3. Check unique companies
		console.log('3️⃣  Analyzing companies...');
		const allJobs = await jobsRef.orderBy('postedAt', 'desc').limit(500).get();
		const companies = new Set<string>();
		const atsCounts: Record<string, number> = {};
		
		allJobs.docs.forEach(doc => {
			const data = doc.data();
			if (data.company) {
				companies.add(data.company);
			}
			const ats = data.ats || 'unknown';
			atsCounts[ats] = (atsCounts[ats] || 0) + 1;
		});
		
		console.log(`   ✓ Unique companies: ${companies.size}`);
		console.log(`   ✓ Jobs by ATS provider:`);
		Object.entries(atsCounts).forEach(([ats, count]) => {
			console.log(`      - ${ats}: ${count} jobs`);
		});
		
		// 4. Check if fetchJobsFromATS has run recently
		console.log('\n4️⃣  Checking job freshness...');
		const oldestJob = await jobsRef
			.orderBy('postedAt', 'asc')
			.limit(1)
			.get();
		
		const newestJob = await jobsRef
			.orderBy('postedAt', 'desc')
			.limit(1)
			.get();
		
		if (!oldestJob.empty && !newestJob.empty) {
			const oldestDate = oldestJob.docs[0].data().postedAt?.toDate?.();
			const newestDate = newestJob.docs[0].data().postedAt?.toDate?.();
			
			if (oldestDate && newestDate) {
				const daysDiff = Math.floor((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
				console.log(`   ✓ Oldest job: ${oldestDate.toLocaleDateString()}`);
				console.log(`   ✓ Newest job: ${newestDate.toLocaleDateString()}`);
				console.log(`   ✓ Date range: ${daysDiff} days`);
				
				if (daysDiff > 30) {
					console.log('   ⚠️  WARNING: Jobs are older than 30 days');
					console.log('   → fetchJobsFromATS may not be running correctly');
				}
			}
		}
		
		console.log('\n✅ Production database check complete!');
		console.log('   → Jobs are available in production');
		console.log('   → JobBoardPage should display jobs when connected to production');
		
	} catch (error: any) {
		console.error('\n❌ Error checking production data:', error);
		console.error('   → Make sure you have Firebase credentials configured');
		console.error('   → Run: firebase login');
		process.exit(1);
	}
}

checkProdData()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});



