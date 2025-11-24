/**
 * Batch 4: SmartRecruiters (All 20 companies)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { fetchSmartRecruiters } from '../utils/atsFetchers';
import { cleanDescription } from '../utils/cleanDescription';
import { enrichJob } from '../utils/jobEnrichment';

const COMPANIES = [
	'devoteam', 'vestiaire-collective', 'aircall', 'contentsquare', 'dataiku', 'doctolib',
	'deezer', 'blablacar', 'leboncoin', 'meero', 'alan', 'qonto', 'shift-technology',
	'swile', 'spendesk', 'ledger', 'ivalua', 'mirakl', 'algolia', 'criteo'
];

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

export const fetchJobsBatch4 = onRequest({
	region: 'us-central1',
	cors: true,
	maxInstances: 5,
	timeoutSeconds: 540,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	const db = admin.firestore();
	let totalJobs = 0;

	console.log(`[BATCH4] Processing ${COMPANIES.length} SmartRecruiters companies`);

	for (const company of COMPANIES) {
		try {
			const jobs = await fetchSmartRecruiters(company);
			if (jobs.length === 0) continue;

			const batch = db.batch();
			for (const j of jobs) {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
				const docId = cleanExternalId ? `smartrecruiters_${cleanExternalId}` : `smartrecruiters_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

				batch.set(db.collection('jobs').doc(docId), {
					title: j.title || '',
					company: j.company || '',
					companyLogo: j.companyLogo || null,
					location: j.location || '',
					description: cleanDescription(j.description || ''),
					skills: j.skills || [],
					applyUrl: j.applyUrl || '',
					ats: 'smartrecruiters',
					externalId: j.externalId,
					postedAt: j.postedAt ? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) : admin.firestore.FieldValue.serverTimestamp(),
				}, { merge: true });
			}

			await batch.commit();

			// Enrich
			for (const j of jobs) {
				try {
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
					const docId = cleanExternalId ? `smartrecruiters_${cleanExternalId}` : `smartrecruiters_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					await enrichJob(docId);
				} catch (e) { /* silent */ }
			}

			console.log(`[BATCH4] ${company}: ${jobs.length} jobs`);
			totalJobs += jobs.length;
		} catch (e: any) {
			console.error(`[BATCH4] Error ${company}:`, e.message);
		}
	}

	console.log(`[BATCH4] ✅ Complete: ${totalJobs} jobs`);
	res.status(200).json({ success: true, jobs: totalJobs });
});

