/**
 * ⚠️ DEPRECATED - Use processDynamicBatch instead
 * 
 * This file is kept for backwards compatibility only.
 * The dynamic batch processor automatically handles all companies.
 * 
 * Migration: Use processDynamicBatch
 * 
 * Batch 3: Greenhouse Companies 41-68 + Lever + Ashby (Legacy)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { fetchGreenhouse, fetchLever, fetchAshby } from '../utils/atsFetchers';
import { cleanDescription } from '../utils/cleanDescription';
import { enrichJob } from '../utils/jobEnrichment';

const GREENHOUSE_COMPANIES = [
	'cockroachlabs', 'mongodb', 'elastic', 'cloudflare', 'fastly', 'netlify', 'vercel',
	'render', 'fly', 'planetscale', 'supabase', 'neon', 'retool', 'postman', 'miro',
	'canva', 'grammarly', 'coursera', 'udemy', 'calm', 'headspace', 'peloton', 'strava',
	'allbirds', 'warbyparker', 'glossier', 'sweetgreen'
];

const LEVER_COMPANIES = ['metabase'];

const ASHBY_COMPANIES = ['notion', 'linear', 'zapier', 'replit', 'ramp', 'deel', 'vercel', 'temporal'];

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

async function processCompany(ats: string, company: string, fetchFn: any, db: admin.firestore.Firestore): Promise<number> {
	try {
		const jobs = await fetchFn(company);
		if (jobs.length === 0) return 0;

		const batch = db.batch();
		for (const j of jobs) {
			const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
			const docId = cleanExternalId ? `${ats}_${cleanExternalId}` : `${ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

			batch.set(db.collection('jobs').doc(docId), {
				title: j.title || '',
				company: j.company || '',
				companyLogo: j.companyLogo || null,
				location: j.location || '',
				description: cleanDescription(j.description || ''),
				skills: j.skills || [],
				applyUrl: j.applyUrl || '',
				ats,
				externalId: j.externalId,
				postedAt: j.postedAt ? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) : admin.firestore.FieldValue.serverTimestamp(),
			}, { merge: true });
		}

		await batch.commit();

		// Enrich
		for (const j of jobs) {
			try {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
				const docId = cleanExternalId ? `${ats}_${cleanExternalId}` : `${ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
				await enrichJob(docId);
			} catch (e) { /* silent */ }
		}

		console.log(`[BATCH3] ${company}: ${jobs.length} jobs`);
		return jobs.length;
	} catch (e: any) {
		console.error(`[BATCH3] Error ${company}:`, e.message);
		return 0;
	}
}

export const fetchJobsBatch3 = onRequest({
	region: 'us-central1',
	cors: true,
	maxInstances: 5,
	timeoutSeconds: 540,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	const db = admin.firestore();
	let totalJobs = 0;

	console.log(`[BATCH3] Processing ${GREENHOUSE_COMPANIES.length} Greenhouse + ${LEVER_COMPANIES.length} Lever + ${ASHBY_COMPANIES.length} Ashby`);

	for (const company of GREENHOUSE_COMPANIES) {
		totalJobs += await processCompany('greenhouse', company, fetchGreenhouse, db);
	}

	for (const company of LEVER_COMPANIES) {
		totalJobs += await processCompany('lever', company, fetchLever, db);
	}

	for (const company of ASHBY_COMPANIES) {
		totalJobs += await processCompany('ashby', company, fetchAshby, db);
	}

	console.log(`[BATCH3] ✅ Complete: ${totalJobs} jobs`);
	res.status(200).json({ success: true, jobs: totalJobs });
});

