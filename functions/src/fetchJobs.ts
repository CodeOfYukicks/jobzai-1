/**
 * ⚠️ DEPRECATED - Legacy ATS Job Fetcher
 * 
 * This function is deprecated and will be removed in a future version.
 * 
 * **Please use the new queue-based architecture instead:**
 * - scheduleFetchJobs (CRON scheduler)
 * - fetchJobsWorker (task queue worker)
 * - enrichSkillsWorker (enrichment worker)
 * 
 * **Why?**
 * - Old: Single 540s timeout for ALL sources = timeout risk with 100k+ jobs
 * - New: Each source has its own 540s timeout = no global timeout
 * - Old: Blocking LLM enrichment = very slow
 * - New: Async enrichment in background = fast fetch, async enrich
 * - Old: No retry mechanism = entire batch fails if one source fails
 * - New: Automatic retry per source = fault tolerant
 * - Old: Poor observability = hard to debug
 * - New: Per-source metrics = easy monitoring
 * 
 * **Migration:**
 * The new system is deployed alongside this one. To switch:
 * 1. Disable this CRON (comment out or delete the export)
 * 2. The new scheduler will take over automatically
 * 
 * **Kept for:**
 * - Backward compatibility
 * - Emergency fallback
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
// import { fetchFromATS } from './utils/atsFetchers';
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
	// Validate postedAt date - some ATS (like Workday) may return invalid dates
	let postedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
	if (n.postedAt) {
		try {
			const date = new Date(n.postedAt);
			// Check if date is valid
			if (!isNaN(date.getTime())) {
				postedAt = admin.firestore.Timestamp.fromDate(date);
			} else {
				console.warn(`[NORMALIZE] Invalid postedAt date: ${n.postedAt}, using server timestamp`);
				postedAt = admin.firestore.FieldValue.serverTimestamp();
			}
		} catch (e) {
			console.warn(`[NORMALIZE] Error parsing postedAt: ${n.postedAt}`, e);
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

const REGION = process.env.FUNCTION_REGION || 'us-central1';

// Provide sources via env var ATS_SOURCES_JSON (array of {provider, company?, url?})
const SOURCES: ATSProviderConfig[] = ATS_SOURCES;

// Store execution metrics in Firestore for monitoring
async function storeMetrics(
	db: admin.firestore.Firestore,
	executionId: string,
	metrics: {
		startTime: Date;
		duration: number;
		fetchDuration?: number;
		writeDuration?: number;
		totalFetched: number;
		totalWritten: number;
		totalFailed: number;
		totalEnriched?: number;
		providerMetrics: Record<string, { fetched: number; written: number; errors: number }>;
		errors: Array<{ provider: string; company: string; error: string }>;
		status: string;
	}
) {
	try {
		const metricsDoc = {
			executionId,
			timestamp: admin.firestore.FieldValue.serverTimestamp(),
			startTime: admin.firestore.Timestamp.fromDate(metrics.startTime),
			duration: metrics.duration,
			fetchDuration: metrics.fetchDuration || null,
			writeDuration: metrics.writeDuration || null,
			totalFetched: metrics.totalFetched,
			totalWritten: metrics.totalWritten,
			totalFailed: metrics.totalFailed,
			totalEnriched: metrics.totalEnriched || 0,
			providerMetrics: metrics.providerMetrics,
			errorCount: metrics.errors.length,
			errors: metrics.errors,
			status: metrics.status,
		};

		await db.collection('jobFetchMetrics').doc(executionId).set(metricsDoc);
		console.log(`[CRON] Metrics stored: execution=${executionId}`);
	} catch (e: any) {
		// Don't fail the main job if metrics storage fails
		console.warn(`[CRON] Failed to store metrics:`, e.message);
	}
}

export const fetchJobsFromATS = onSchedule(
	{
		region: REGION,
		schedule: 'every 24 hours',
		timeZone: 'UTC',
		retryCount: 3,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '1GiB',
	},
	async () => {
		const db = admin.firestore();
		const startTime = Date.now();
		const executionId = `fetch_${Date.now()}`;

		console.log(`[CRON] fetchJobsFromATS start execution=${executionId} sources=${SOURCES.length} timestamp=${new Date().toISOString()}`);

		// Track metrics
		const providerMetrics: Record<string, { fetched: number; written: number; errors: number }> = {};
		const errors: Array<{ provider: string; company: string; error: string }> = [];
		let totalFetched = 0;
		let totalWritten = 0;
		let totalFailed = 0;
		let totalEnriched = 0;

		// Helper to process a single source
		const processSource = async (src: ATSProviderConfig) => {
			const providerKey = `${src.provider}_${src.company || 'unknown'}`;
			providerMetrics[providerKey] = { fetched: 0, written: 0, errors: 0 };

			try {
				let jobs: NormalizedATSJob[] = [];

				// Fetch based on provider
				if (src.provider === "greenhouse" && src.company) {
					const { fetchGreenhouse } = require('./utils/atsFetchers');
					jobs = await fetchGreenhouse(src.company);
				} else if (src.provider === "lever" && src.company) {
					const { fetchLever } = require('./utils/atsFetchers');
					jobs = await fetchLever(src.company);
				} else if (src.provider === "smartrecruiters" && src.company) {
					const { fetchSmartRecruiters } = require('./utils/atsFetchers');
					jobs = await fetchSmartRecruiters(src.company);
				} else if (src.provider === "workday" && src.company) {
					const { fetchWorkday } = require('./utils/atsFetchers');
					jobs = await fetchWorkday(src.company, src.workdayDomain, src.workdaySiteId);
				} else if (src.provider === "ashby" && src.company) {
					const { fetchAshby } = require('./utils/atsFetchers');
					jobs = await fetchAshby(src.company);
				}

				providerMetrics[providerKey].fetched = jobs.length;
				totalFetched += jobs.length;

				if (jobs.length === 0) return;

				// Write batch
				const batch = db.bulkWriter();

				for (const j of jobs) {
					// Sanitize externalId: remove slashes that break Firestore document paths
					// Also ensure it's actually a string before calling replace()
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
						? j.externalId.replace(/\//g, '_')
						: '';
					const baseId = cleanExternalId.length > 0
						? `${j.ats}_${cleanExternalId}`
						: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					const docId = baseId;
					const ref = db.collection('jobs').doc(docId);
					const normalized = normalizeJob(j);

					// Attempt to enrich skills if missing
					if (!normalized.skills?.length && normalized.description) {
						try {
							const skills = await extractSkillsWithLLM(`${normalized.title}\n${normalized.description}`);
							normalized.skills = skills;
							totalEnriched++;
						} catch (e: any) {
							// console.warn(`[CRON] Skill enrichment failed for ${docId}:`, e.message);
						}
					}

					try {
						batch.set(ref, normalized, { merge: true });
						providerMetrics[providerKey].written++;
						totalWritten++;
					} catch (e: any) {
						providerMetrics[providerKey].errors++;
						totalFailed++;
						errors.push({ provider: src.provider, company: src.company || 'unknown', error: e.message });
					}
				}

				await batch.close();
				console.log(`[CRON] Finished ${providerKey}: ${jobs.length} jobs`);

			} catch (e: any) {
				console.error(`[CRON] Failed source ${providerKey}:`, e);
				errors.push({ provider: src.provider, company: src.company || 'unknown', error: e.message });
			}
		};

		try {
			// Process sources in parallel chunks to control concurrency
			const chunkSize = 3; // Process 3 providers at a time
			for (let i = 0; i < SOURCES.length; i += chunkSize) {
				const chunk = SOURCES.slice(i, i + chunkSize);
				await Promise.all(chunk.map(src => processSource(src)));
			}

			const totalDuration = Date.now() - startTime;

			console.log(`[CRON] fetchJobsFromATS completed:`);
			console.log(`   ✅ Success: ${totalWritten} jobs written`);
			console.log(`   ❌ Failed: ${totalFailed} jobs`);
			console.log(`   ⏱️  Total duration: ${totalDuration}ms`);

			// Store metrics
			await storeMetrics(db, executionId, {
				startTime: new Date(startTime),
				duration: totalDuration,
				totalFetched,
				totalWritten,
				totalFailed,
				totalEnriched,
				providerMetrics,
				errors: errors.slice(0, 50),
				status: totalFailed > 0 ? 'completed_with_errors' : 'completed_success'
			});

		} catch (error: any) {
			console.error(`[CRON] ❌ fetchJobsFromATS fatal error:`, error);
			// Try to store metrics even on fatal error
			await storeMetrics(db, executionId, {
				startTime: new Date(startTime),
				duration: Date.now() - startTime,
				totalFetched,
				totalWritten,
				totalFailed,
				providerMetrics,
				errors: [{ provider: 'system', company: 'all', error: error.message || String(error) }],
				status: 'failed'
			});
			throw error;
		}
	}
);
