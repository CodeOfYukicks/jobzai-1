/**
 * Batch 2: Greenhouse Companies 21-40
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { fetchGreenhouse } from '../utils/atsFetchers';
import { cleanDescription } from '../utils/cleanDescription';
import { enrichJob } from '../utils/jobEnrichment';

const COMPANIES = [
	'grubhub', 'lyft', 'squarespace', 'etsy', 'pinterest', 'reddit', 'twitch', 'uber',
	'asana', 'atlassian', 'autodesk', 'duolingo', 'flexport', 'hashicorp', 'hudl', 'hubspot',
	'intercom', 'databricks', 'snowflake', 'confluent'
];

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

export const fetchJobsBatch2 = onRequest({
	region: 'us-central1',
	cors: true,
	maxInstances: 5,
	timeoutSeconds: 540,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	const db = admin.firestore();
	let totalJobs = 0;

	console.log(`[BATCH2] Processing ${COMPANIES.length} companies`);

	for (const company of COMPANIES) {
		try {
			const jobs = await fetchGreenhouse(company);
			if (jobs.length === 0) continue;

			const batch = db.batch();
			for (const j of jobs) {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
				const docId = cleanExternalId ? `greenhouse_${cleanExternalId}` : `greenhouse_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

				batch.set(db.collection('jobs').doc(docId), {
					title: j.title || '',
					company: j.company || '',
					companyLogo: j.companyLogo || null,
					location: j.location || '',
					description: cleanDescription(j.description || ''),
					skills: j.skills || [],
					applyUrl: j.applyUrl || '',
					ats: 'greenhouse',
					externalId: j.externalId,
					postedAt: j.postedAt ? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) : admin.firestore.FieldValue.serverTimestamp(),
				}, { merge: true });
			}

			await batch.commit();
			console.log(`[BATCH2] ${company}: ${jobs.length} jobs`);

			// Enrich
			for (const j of jobs) {
				try {
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
					const docId = cleanExternalId ? `greenhouse_${cleanExternalId}` : `greenhouse_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					await enrichJob(docId);
				} catch (e) { /* silent */ }
			}

			totalJobs += jobs.length;
		} catch (e: any) {
			console.error(`[BATCH2] Error ${company}:`, e.message);
		}
	}

	console.log(`[BATCH2] ✅ Complete: ${totalJobs} jobs`);
	res.status(200).json({ success: true, jobs: totalJobs });
});

