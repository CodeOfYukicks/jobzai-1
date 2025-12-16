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
import { fetchFromATS } from './utils/atsFetchers';
import { ATSProviderConfig, JobDocument, NormalizedATSJob } from './types';
import { extractSkillsWithLLM } from './utils/embeddings';
// cleanDescription is called in normalizeATSJob (normalize.ts) - no need to import here
import { enrichJob } from './utils/jobEnrichment';
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
		schedule: 'every 3 hours', // Process 150 sources per run, all 1062 in ~24h
		timeZone: 'UTC',
		retryCount: 3,
		maxInstances: 1,
		timeoutSeconds: 540, // 9 minutes - keep it short to avoid scheduler timeout
		memory: '2GiB',
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
					const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
						? j.externalId.replace(/\//g, '_')
						: '';
					const baseId = cleanExternalId.length > 0
						? `${j.ats}_${cleanExternalId}`
						: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
					const docId = baseId;
					const ref = db.collection('jobs').doc(docId);
					const normalized = normalizeJob(j);

					// NOTE: cleanDescription is already called in normalizeATSJob (normalize.ts)
					// Do NOT call it again here as it would double-escape Markdown characters

					// NO LLM enrichment here (too slow) - will be done separately

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

				// Enrich jobs with v2.2 tags (no LLM, just regex)
				console.log(`[CRON] Enriching ${jobs.length} jobs with v2.2 tags...`);
				let enriched = 0;
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
						// Silent fail on enrichment
					}
				}
				console.log(`[CRON] Enriched ${enriched}/${jobs.length} jobs`);

			} catch (e: any) {
				console.error(`[CRON] Failed source ${providerKey}:`, e);
				errors.push({ provider: src.provider, company: src.company || 'unknown', error: e.message });
			}
		};

		try {
		// 🚀 OPTIMIZED: Process more sources per run with better parallelism
		// Cloud Scheduler HTTP timeout is ~30s, but we have 540s function timeout
		const chunkSize = 20; // Process 20 providers at a time (increased from 15)
		const MAX_SOURCES_PER_RUN = 250; // Increased from 150 to process more sources per run
			
			// Select sources to process this run (rotate through all sources over multiple runs)
			// With 1062 sources and 150/run, need ~7 runs = runs every 3h to cover all in 24h
			const runIndex = Math.floor(Date.now() / (3 * 60 * 60 * 1000)) % Math.ceil(SOURCES.length / MAX_SOURCES_PER_RUN);
			const sourceOffset = runIndex * MAX_SOURCES_PER_RUN;
			const sourcesToProcess = SOURCES.slice(sourceOffset, sourceOffset + MAX_SOURCES_PER_RUN);
			
			console.log(`[CRON] Run #${runIndex}: Processing sources ${sourceOffset}-${sourceOffset + sourcesToProcess.length} (${sourcesToProcess.length}/${SOURCES.length})`);
			
			for (let i = 0; i < sourcesToProcess.length; i += chunkSize) {
				const chunk = sourcesToProcess.slice(i, i + chunkSize);
				await Promise.all(chunk.map(src => processSource(src)));
				
				// Log progress every 50 sources
				if ((i + chunkSize) % 50 === 0 || i + chunkSize >= sourcesToProcess.length) {
					console.log(`[CRON] Progress: ${Math.min(i + chunkSize, sourcesToProcess.length)}/${sourcesToProcess.length} sources, ${totalWritten} jobs`);
				}
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
