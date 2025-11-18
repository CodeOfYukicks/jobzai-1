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
	},
	async () => {
		const db = admin.firestore();
		const startTime = Date.now();
		const executionId = `fetch_${Date.now()}`;
		
		console.log(`[CRON] fetchJobsFromATS start execution=${executionId} sources=${SOURCES.length} timestamp=${new Date().toISOString()}`);
		
		// Track metrics per provider
		const providerMetrics: Record<string, { fetched: number; written: number; errors: number }> = {};
		const errors: Array<{ provider: string; company: string; error: string }> = [];
		
		try {
			// Fetch jobs from all ATS sources
			const fetchStartTime = Date.now();
			const jobs = await fetchFromATS(SOURCES);
			const fetchDuration = Date.now() - fetchStartTime;
			
			console.log(`[CRON] fetchJobsFromATS fetched total=${jobs.length} duration=${fetchDuration}ms`);
			
			// Initialize provider metrics
			SOURCES.forEach(src => {
				const key = `${src.provider}_${src.company || 'unknown'}`;
				providerMetrics[key] = { fetched: 0, written: 0, errors: 0 };
			});
			
			// Count jobs per provider
			jobs.forEach(job => {
				const key = `${job.ats}_${job.company || 'unknown'}`;
				if (providerMetrics[key]) {
					providerMetrics[key].fetched++;
				} else {
					// Handle case where job doesn't match a configured source
					const fallbackKey = `${job.ats}_unknown`;
					if (!providerMetrics[fallbackKey]) {
						providerMetrics[fallbackKey] = { fetched: 0, written: 0, errors: 0 };
					}
					providerMetrics[fallbackKey].fetched++;
				}
			});
			
			// Log metrics per provider
			console.log(`[CRON] Jobs fetched by provider:`);
			Object.entries(providerMetrics).forEach(([key, metrics]) => {
				if (metrics.fetched > 0) {
					console.log(`   ${key}: ${metrics.fetched} jobs`);
				}
			});
			
			if (!jobs.length) {
				console.warn(`[CRON] ⚠️  No jobs fetched from any ATS source`);
				// Store metrics even if no jobs
				await storeMetrics(db, executionId, {
					startTime: new Date(startTime),
					duration: Date.now() - startTime,
					totalFetched: 0,
					totalWritten: 0,
					totalFailed: 0,
					providerMetrics,
					errors,
					status: 'completed_empty'
				});
				return;
			}

			// Write jobs to Firestore
			const writeStartTime = Date.now();
			const batch = db.bulkWriter();
			let success = 0;
			let failed = 0;
			let enriched = 0;
			
			for (const j of jobs) {
				const baseId = j.externalId && j.externalId.length > 0 ? `${j.ats}_${j.externalId}` : `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
				const docId = baseId;
				const ref = db.collection('jobs').doc(docId);
				const normalized = normalizeJob(j);
				const providerKey = `${j.ats}_${j.company || 'unknown'}`;

				// Attempt to enrich skills if missing
				if (!normalized.skills?.length && normalized.description) {
					try {
						const skills = await extractSkillsWithLLM(`${normalized.title}\n${normalized.description}`);
						normalized.skills = skills;
						enriched++;
					} catch (e: any) {
						console.warn(`[CRON] Skill enrichment failed for ${docId}:`, e.message);
						// Don't fail the job write if enrichment fails
					}
				}

				try {
					batch.set(ref, normalized, { merge: true });
					success++;
					if (providerMetrics[providerKey]) {
						providerMetrics[providerKey].written++;
					}
				} catch (e: any) {
					failed++;
					const errorMsg = e.message || String(e);
					console.error(`[CRON] write error id=${docId}`, errorMsg);
					
					if (providerMetrics[providerKey]) {
						providerMetrics[providerKey].errors++;
					}
					
					errors.push({
						provider: j.ats,
						company: j.company || 'unknown',
						error: errorMsg
					});
				}
			}
			
			await batch.close();
			const writeDuration = Date.now() - writeStartTime;
			const totalDuration = Date.now() - startTime;
			
			console.log(`[CRON] fetchJobsFromATS completed:`);
			console.log(`   ✅ Success: ${success} jobs written`);
			console.log(`   ❌ Failed: ${failed} jobs`);
			console.log(`   🎨 Enriched: ${enriched} jobs with skills`);
			console.log(`   ⏱️  Total duration: ${totalDuration}ms (fetch: ${fetchDuration}ms, write: ${writeDuration}ms)`);
			
			// Log provider-level success rates
			console.log(`[CRON] Provider-level metrics:`);
			Object.entries(providerMetrics).forEach(([key, metrics]) => {
				if (metrics.fetched > 0) {
					const successRate = metrics.fetched > 0 
						? ((metrics.written / metrics.fetched) * 100).toFixed(1)
						: '0.0';
					console.log(`   ${key}: ${metrics.written}/${metrics.fetched} written (${successRate}% success)`);
					if (metrics.errors > 0) {
						console.log(`      ⚠️  ${metrics.errors} errors`);
					}
				}
			});
			
			// Store metrics in Firestore for monitoring dashboard
			await storeMetrics(db, executionId, {
				startTime: new Date(startTime),
				duration: totalDuration,
				fetchDuration,
				writeDuration,
				totalFetched: jobs.length,
				totalWritten: success,
				totalFailed: failed,
				totalEnriched: enriched,
				providerMetrics,
				errors: errors.slice(0, 50), // Limit to 50 errors to avoid document size limits
				status: failed > 0 ? 'completed_with_errors' : 'completed_success'
			});
			
		} catch (error: any) {
			const totalDuration = Date.now() - startTime;
			console.error(`[CRON] ❌ fetchJobsFromATS fatal error:`, error);
			console.error(`   Error message: ${error.message || String(error)}`);
			console.error(`   Duration before failure: ${totalDuration}ms`);
			
			// Store error metrics
			await storeMetrics(db, executionId, {
				startTime: new Date(startTime),
				duration: totalDuration,
				totalFetched: 0,
				totalWritten: 0,
				totalFailed: 0,
				providerMetrics,
				errors: [{ provider: 'system', company: 'all', error: error.message || String(error) }],
				status: 'failed'
			});
			
			// Re-throw to trigger retry mechanism
			throw error;
		}
	}
);


