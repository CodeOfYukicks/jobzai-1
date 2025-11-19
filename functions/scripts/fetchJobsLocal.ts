/**
 * Script to manually trigger fetchJobsFromATS locally (for emulator or production)
 * 
 * For EMULATOR:
 * 1. Start emulators: firebase emulators:start
 * 2. Run: npm run fetch:local
 * 
 * For PRODUCTION:
 * 1. Make sure you're authenticated: firebase login
 * 2. Run: npm run fetch:local
 * 
 * To use with emulator, set USE_EMULATOR=true:
 * USE_EMULATOR=true npm run fetch:local
 */

import * as admin from 'firebase-admin';
import { fetchFromATS } from '../src/utils/atsFetchers';
import { ATS_SOURCES } from '../src/config';
import { ATSProviderConfig, NormalizedATSJob, JobDocument } from '../src/types';
import { extractSkillsWithLLM } from '../src/utils/embeddings';

const USE_EMULATOR = process.env.USE_EMULATOR === 'true';

// Initialize Firebase Admin
if (!admin.apps.length) {
	if (USE_EMULATOR) {
		admin.initializeApp({
			projectId: 'jobzai-39f7e',
		});
		process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
		console.log('🔧 Using Firestore Emulator (localhost:8080)');
	} else {
		admin.initializeApp();
		console.log('🌐 Using Production Firestore');
	}
}

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function normalizeJob(n: NormalizedATSJob): JobDocument {
	const postedAt = n.postedAt 
		? admin.firestore.Timestamp.fromDate(new Date(n.postedAt)) 
		: admin.firestore.FieldValue.serverTimestamp();
	return {
		title: n.title || '',
		company: n.company || '',
		companyLogo: n.companyLogo || null,
		location: n.location || '',
		description: n.description || '',
		skills: n.skills || [],
		applyUrl: n.applyUrl || '',
		ats: n.ats,
		externalId: n.externalId,
		postedAt,
	};
}

async function fetchJobsLocal() {
	const db = admin.firestore();
	
	console.log('🚀 Manually Triggering fetchJobsFromATS\n');
	console.log('='.repeat(60));
	
	if (USE_EMULATOR) {
		console.log('⚠️  Using EMULATOR - Make sure emulators are running!');
		console.log('   Run: firebase emulators:start\n');
	} else {
		console.log('⚠️  Using PRODUCTION - Jobs will be written to production database!\n');
	}
	
	try {
		// Test connection
		console.log('1️⃣  Testing database connection...');
		await db.collection('_test').doc('ping').set({ ping: true });
		await db.collection('_test').doc('ping').delete();
		console.log('   ✅ Connection successful');
		
		// Fetch jobs from ATS
		console.log('\n2️⃣  Fetching jobs from ATS sources...');
		console.log(`   Sources configured: ${ATS_SOURCES.length}`);
		ATS_SOURCES.forEach((src, idx) => {
			console.log(`   ${idx + 1}. ${src.provider} - ${src.company || 'N/A'}`);
		});
		
		const startTime = Date.now();
		const jobs = await fetchFromATS(ATS_SOURCES);
		const fetchTime = Date.now() - startTime;
		
		console.log(`\n   ✅ Fetched ${jobs.length} jobs in ${fetchTime}ms`);
		
		if (jobs.length === 0) {
			console.log('\n   ⚠️  No jobs fetched. This could mean:');
			console.log('   → ATS APIs are down or rate-limited');
			console.log('   → Company slugs are incorrect');
			console.log('   → Network connectivity issues');
			return;
		}
		
		// Show sample of fetched jobs
		console.log('\n   Sample of fetched jobs:');
		jobs.slice(0, 5).forEach((job, idx) => {
			console.log(`   ${idx + 1}. ${job.title} @ ${job.company}`);
			console.log(`      Location: ${job.location || 'N/A'}`);
			console.log(`      ATS: ${job.ats}`);
			console.log('');
		});
		
		// Write to Firestore
		console.log('3️⃣  Writing jobs to Firestore...');
		const batch = db.bulkWriter();
		let success = 0;
		let failed = 0;
		let enriched = 0;
		
		for (const j of jobs) {
			const baseId = j.externalId && j.externalId.length > 0 
				? `${j.ats}_${j.externalId}` 
				: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
			const docId = baseId;
			const ref = db.collection('jobs').doc(docId);
			const normalized = normalizeJob(j);
			
			// Attempt to enrich skills if missing
			if (!normalized.skills?.length && normalized.description) {
				try {
					const skills = await extractSkillsWithLLM(`${normalized.title}\n${normalized.description}`);
					normalized.skills = skills;
					enriched++;
				} catch (e) {
					// ignore skill enrichment errors
					console.warn(`   ⚠️  Failed to enrich skills for: ${normalized.title}`);
				}
			}
			
			try {
				batch.set(ref, normalized, { merge: true });
				success++;
			} catch (e) {
				failed++;
				console.error(`   ✗ Write error for job: ${docId}`, e);
			}
		}
		
		await batch.close();
		
		console.log(`\n   ✅ Successfully wrote ${success} jobs`);
		if (enriched > 0) {
			console.log(`   ✅ Enriched ${enriched} jobs with skills`);
		}
		if (failed > 0) {
			console.log(`   ⚠️  Failed to write ${failed} jobs`);
		}
		
		// Verify
		console.log('\n4️⃣  Verifying written data...');
		const verifySnapshot = await db.collection('jobs')
			.orderBy('postedAt', 'desc')
			.limit(10)
			.get();
		
		console.log(`   ✅ Total jobs in database: ${verifySnapshot.size} (showing recent 10)`);
		
		if (verifySnapshot.size > 0) {
			console.log('\n   Recent jobs:');
			verifySnapshot.docs.slice(0, 5).forEach((doc, idx) => {
				const data = doc.data();
				console.log(`   ${idx + 1}. ${data.title} @ ${data.company}`);
				console.log(`      Posted: ${data.postedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
				console.log(`      Skills: ${data.skills?.length || 0} skills`);
				console.log('');
			});
		}
		
		console.log('\n' + '='.repeat(60));
		console.log('✅ Fetch complete!');
		if (USE_EMULATOR) {
			console.log('   → Jobs are now available in emulator');
			console.log('   → Test JobBoardPage at http://localhost:5178');
		} else {
			console.log('   → Jobs are now available in production');
			console.log('   → They will appear on JobBoardPage');
		}
		
	} catch (error: any) {
		console.error('\n❌ Error fetching jobs:', error);
		if (USE_EMULATOR) {
			console.error('   → Make sure emulators are running: firebase emulators:start');
		} else {
			console.error('   → Make sure you\'re authenticated: firebase login');
		}
		process.exit(1);
	}
}

fetchJobsLocal()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});



