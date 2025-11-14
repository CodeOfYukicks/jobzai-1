import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { fetchFromATS } from './utils/atsFetchers';
import { ATSProviderConfig, JobDocument, NormalizedATSJob } from './types';
import { extractSkillsWithLLM } from './utils/embeddings';
import { ATS_SOURCES } from './config';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function normalizeJob(n: NormalizedATSJob): JobDocument {
	const postedAt = n.postedAt ? admin.firestore.Timestamp.fromDate(new Date(n.postedAt)) : admin.firestore.FieldValue.serverTimestamp();
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

const REGION = process.env.FUNCTION_REGION || 'us-central1';

// Provide sources via env var ATS_SOURCES_JSON (array of {provider, company?, url?})
const SOURCES: ATSProviderConfig[] = ATS_SOURCES;

export const fetchJobsFromATS = onSchedule(
	{
		region: REGION,
		schedule: 'every 24 hours',
		timeZone: 'UTC',
		retryCount: 3,
		maxInstances: 1,
	},
	async () => {
		const db = admin.firestore();
		console.log(`[CRON] fetchJobsFromATS start sources=${SOURCES.length}`);
		const jobs = await fetchFromATS(SOURCES);
		console.log(`[CRON] fetchJobsFromATS fetched total=${jobs.length}`);
		if (!jobs.length) return;

		const batch = db.bulkWriter();
		let success = 0;
		let failed = 0;
		for (const j of jobs) {
			const baseId = j.externalId && j.externalId.length > 0 ? `${j.ats}_${j.externalId}` : `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
			const docId = baseId;
			const ref = db.collection('jobs').doc(docId);
			const normalized = normalizeJob(j);

			// Attempt to enrich skills if missing
			if (!normalized.skills?.length && normalized.description) {
				try {
					const skills = await extractSkillsWithLLM(`${normalized.title}\n${normalized.description}`);
					normalized.skills = skills;
				} catch {
					// ignore skill enrichment errors
				}
			}

			try {
				batch.set(ref, normalized, { merge: true });
				success++;
			} catch (e) {
				failed++;
				console.error(`[CRON] write error id=${docId}`, e);
			}
		}
		await batch.close();
		console.log(`[CRON] fetchJobsFromATS done success=${success} failed=${failed}`);
	}
);


