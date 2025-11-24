/**
 * Fetch Jobs Worker - Processes job fetch tasks from Firestore
 * Each task represents one ATS source and is processed independently
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { NormalizedATSJob, JobDocument } from '../types';
import { enrichJob } from '../utils/jobEnrichment';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const chr = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

function normalizeJob(n: NormalizedATSJob): JobDocument {
	let postedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
	if (n.postedAt) {
		try {
			const date = new Date(n.postedAt);
			if (!isNaN(date.getTime())) {
				postedAt = admin.firestore.Timestamp.fromDate(date);
			} else {
				postedAt = admin.firestore.FieldValue.serverTimestamp();
			}
		} catch (e) {
			postedAt = admin.firestore.FieldValue.serverTimestamp();
		}
	} else {
		postedAt = admin.firestore.FieldValue.serverTimestamp();
	}

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

export const fetchJobsWorker = onDocumentCreated(
	{
		document: 'jobFetchTasks/{taskId}',
		region: REGION,
		timeoutSeconds: 540,
		memory: '1GiB',
		maxInstances: 10,
	},
	async (event) => {
		const db = admin.firestore();
		const taskData = event.data?.data();

		if (!taskData) {
			console.error('[WORKER] No task data found');
			return;
		}

		const taskId = event.params.taskId;
		const { provider, company, workdayDomain, workdaySiteId, retryCount, maxRetries } = taskData;

		console.log(`[WORKER] Processing task ${taskId}: ${provider}/${company}`);

		const taskRef = db.collection('jobFetchTasks').doc(taskId);
		const startTime = Date.now();

		try {
			await taskRef.update({
				status: 'processing',
				startedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			let jobs: NormalizedATSJob[] = [];

			if (provider === 'greenhouse' && company) {
				const { fetchGreenhouse } = require('../utils/atsFetchers');
				jobs = await fetchGreenhouse(company);
			} else if (provider === 'lever' && company) {
				const { fetchLever } = require('../utils/atsFetchers');
				jobs = await fetchLever(company);
			} else if (provider === 'smartrecruiters' && company) {
				const { fetchSmartRecruiters } = require('../utils/atsFetchers');
				jobs = await fetchSmartRecruiters(company);
			} else if (provider === 'workday' && company) {
				const { fetchWorkday } = require('../utils/atsFetchers');
				jobs = await fetchWorkday(company, workdayDomain, workdaySiteId);
			} else if (provider === 'ashby' && company) {
				const { fetchAshby } = require('../utils/atsFetchers');
				jobs = await fetchAshby(company);
			}

			console.log(`[WORKER] Fetched ${jobs.length} jobs from ${provider}/${company}`);

			if (jobs.length === 0) {
				await taskRef.update({
					status: 'completed',
					completedAt: admin.firestore.FieldValue.serverTimestamp(),
					duration: Date.now() - startTime,
					jobsFetched: 0,
					jobsWritten: 0,
				});
				return;
			}

			const batch = db.bulkWriter();
			let written = 0;
			let failed = 0;

			for (const j of jobs) {
				try {
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
						? j.externalId.replace(/\//g, '_')
						: '';
					const baseId = cleanExternalId.length > 0
						? `${j.ats}_${cleanExternalId}`
						: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					const docId = baseId;
					const ref = db.collection('jobs').doc(docId);
					const normalized = normalizeJob(j);

					batch.set(ref, normalized, { merge: true });
					written++;
				} catch (e: any) {
					failed++;
					console.error(`[WORKER] Failed to write job:`, e.message);
				}
			}

			await batch.close();

			console.log(`[WORKER] Completed ${taskId}: ${written} written, ${failed} failed`);

			// ✅ AUTO-ENRICH: Tag all newly written jobs with improved extraction logic
			console.log(`[WORKER] Starting auto-enrichment for ${written} jobs...`);
			let enriched = 0;
			let enrichFailed = 0;

			for (const j of jobs) {
				try {
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
						? j.externalId.replace(/\//g, '_')
						: '';
					const docId = cleanExternalId.length > 0
						? `${j.ats}_${cleanExternalId}`
						: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					
					await enrichJob(docId);
					enriched++;
				} catch (e: any) {
					enrichFailed++;
					console.warn(`[WORKER] Enrichment failed for job ${j.externalId || j.title}:`, e.message);
				}
			}

			console.log(`[WORKER] ✅ Auto-enrichment complete: ${enriched} enriched, ${enrichFailed} failed`);

			await taskRef.update({
				status: 'completed',
				completedAt: admin.firestore.FieldValue.serverTimestamp(),
				duration: Date.now() - startTime,
				jobsFetched: jobs.length,
				jobsWritten: written,
				jobsFailed: failed,
				jobsEnriched: enriched,
				enrichmentFailed: enrichFailed,
			});

		} catch (error: any) {
			console.error(`[WORKER] Error processing task ${taskId}:`, error);

			const currentRetry = retryCount || 0;
			const maxRetryCount = maxRetries || 3;

			if (currentRetry < maxRetryCount) {
				console.log(`[WORKER] Retrying task ${taskId} (attempt ${currentRetry + 1}/${maxRetryCount})`);
				await taskRef.update({
					status: 'pending',
					retryCount: currentRetry + 1,
					lastError: error.message,
					lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			} else {
				console.error(`[WORKER] Task ${taskId} failed after ${maxRetryCount} retries`);
				await taskRef.update({
					status: 'failed',
					completedAt: admin.firestore.FieldValue.serverTimestamp(),
					duration: Date.now() - startTime,
					error: error.message,
					retryCount: currentRetry,
				});
			}
		}
	}
);
