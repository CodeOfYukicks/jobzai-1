import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { getFunctions } from 'firebase-admin/functions';
import * as admin from 'firebase-admin';
import { ATSProviderConfig, NormalizedATSJob, JobDocument } from '../types';
import { QUEUE_CONFIG, BATCH_SIZES } from '../config';
import { BatchWriter } from '../utils/batchWriter';
import { MetricsLogger } from '../utils/metricsLogger';
import {
    fetchGreenhouse,
    fetchLever,
    fetchSmartRecruiters,
    fetchWorkday,
    fetchAshby,
} from '../utils/atsFetchers';

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
        // Mark as pending enrichment if no skills
        enrichmentStatus: (!n.skills || n.skills.length === 0) && n.description ? 'pending' : null,
        enrichedAt: null,
    };
}

/**
 * Task Queue Worker that processes a single ATS source
 * 
 * Each task processes one company from one ATS provider:
 * 1. Fetch jobs from the ATS API
 * 2. Write jobs to Firestore in batches of 500
 * 3. Create enrichment tasks for jobs without skills
 * 4. Log metrics
 * 
 * Benefits:
 * - Each source has its own 540s timeout
 * - Automatic retry on failure (3 attempts)
 * - Up to 10 sources processed in parallel
 * - Memory efficient (batched writes)
 */
export const fetchJobsWorker = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: QUEUE_CONFIG.fetchJobs.maxRetries,
            minBackoffSeconds: QUEUE_CONFIG.fetchJobs.minBackoffSeconds,
        },
        rateLimits: {
            maxConcurrentDispatches: QUEUE_CONFIG.fetchJobs.maxConcurrentDispatches,
        },
        region: 'us-central1',
        memory: '2GiB',
        timeoutSeconds: 540,
    },
    async (request) => {
        const { executionId, source } = request.data as {
            executionId: string;
            source: ATSProviderConfig;
        };

        const db = admin.firestore();
        const metricsLogger = new MetricsLogger(db);
        const batchWriter = new BatchWriter(db);
        const startTime = Date.now();

        const providerKey = `${source.provider}_${source.company || 'unknown'}`;
        console.log(`[WORKER] Starting: ${providerKey} (execution: ${executionId})`);

        try {
            // Fetch jobs from ATS
            let jobs: NormalizedATSJob[] = [];

            console.log(`[WORKER] Fetching from ${source.provider}...`);

            if (source.provider === 'greenhouse' && source.company) {
                jobs = await fetchGreenhouse(source.company);
            } else if (source.provider === 'lever' && source.company) {
                jobs = await fetchLever(source.company);
            } else if (source.provider === 'smartrecruiters' && source.company) {
                jobs = await fetchSmartRecruiters(source.company);
            } else if (source.provider === 'workday' && source.company) {
                jobs = await fetchWorkday(source.company, source.workdayDomain, source.workdaySiteId);
            } else if (source.provider === 'ashby' && source.company) {
                jobs = await fetchAshby(source.company);
            }

            console.log(`[WORKER] Fetched ${jobs.length} jobs from ${providerKey}`);

            if (jobs.length === 0) {
                console.log(`[WORKER] No jobs to process for ${providerKey}`);

                await metricsLogger.logFetchMetrics({
                    executionId,
                    provider: source.provider,
                    company: source.company || 'unknown',
                    timestamp: admin.firestore.Timestamp.now(),
                    status: 'success',
                    jobsFetched: 0,
                    jobsWritten: 0,
                    jobsFailed: 0,
                    enrichmentTasksCreated: 0,
                    duration: Date.now() - startTime,
                });

                // Update aggregated metrics
                await db.collection('aggregatedFetchMetrics').doc(executionId).update({
                    sourcesCompleted: admin.firestore.FieldValue.increment(1),
                });

                return;
            }

            // Write jobs to Firestore in batches
            console.log(`[WORKER] Writing ${jobs.length} jobs to Firestore...`);

            const { written, failed } = await batchWriter.writeBatch(
                jobs,
                (job, batch, db) => {
                    // Sanitize externalId: remove slashes that break Firestore document paths
                    // Also ensure it's actually a string before calling replace()
                    const cleanExternalId = (job.externalId && typeof job.externalId === 'string')
                        ? job.externalId.replace(/\//g, '_')
                        : '';
                    const baseId = cleanExternalId.length > 0
                        ? `${job.ats}_${cleanExternalId}`
                        : `${job.ats}_${hashString([job.title, job.company, job.applyUrl].join('|'))}`;

                    const ref = db.collection('jobs').doc(baseId);
                    const normalized = normalizeJob(job);

                    batch.set(ref, normalized, { merge: true });
                },
                {
                    batchSize: BATCH_SIZES.jobs,
                    logProgress: true,
                }
            );

            console.log(`[WORKER] Written ${written} jobs, ${failed} failed`);

            // Create enrichment tasks for jobs without skills
            const jobsNeedingEnrichment = jobs.filter(j =>
                (!j.skills || j.skills.length === 0) && j.description
            );

            console.log(`[WORKER] Creating enrichment tasks for ${jobsNeedingEnrichment.length} jobs...`);

            const enrichQueue = getFunctions().taskQueue('enrichSkillsQueue');
            let enrichmentTasksCreated = 0;

            // Create enrichment tasks in batches to avoid overwhelming the queue
            for (let i = 0; i < jobsNeedingEnrichment.length; i += BATCH_SIZES.enrichmentTasks) {
                const chunk = jobsNeedingEnrichment.slice(i, i + BATCH_SIZES.enrichmentTasks);

                for (const job of chunk) {
                    // Sanitize externalId: remove slashes that break Firestore document paths
                    // Also ensure it's actually a string before calling replace()
                    const cleanExternalId = (job.externalId && typeof job.externalId === 'string')
                        ? job.externalId.replace(/\//g, '_')
                        : '';
                    const jobId = cleanExternalId.length > 0
                        ? `${job.ats}_${cleanExternalId}`
                        : `${job.ats}_${hashString([job.title, job.company, job.applyUrl].join('|'))}`;

                    try {
                        await enrichQueue.enqueue({
                            jobId,
                            executionId,
                        });
                        enrichmentTasksCreated++;
                    } catch (error: any) {
                        console.error(`[WORKER] Failed to create enrichment task for ${jobId}:`, error.message);
                    }
                }

                console.log(`[WORKER] Created ${enrichmentTasksCreated}/${jobsNeedingEnrichment.length} enrichment tasks...`);
            }

            const duration = Date.now() - startTime;

            console.log(`[WORKER] ✅ Completed ${providerKey} in ${duration}ms`);
            console.log(`[WORKER]   - Jobs fetched: ${jobs.length}`);
            console.log(`[WORKER]   - Jobs written: ${written}`);
            console.log(`[WORKER]   - Jobs failed: ${failed}`);
            console.log(`[WORKER]   - Enrichment tasks: ${enrichmentTasksCreated}`);

            // Log metrics
            await metricsLogger.logFetchMetrics({
                executionId,
                provider: source.provider,
                company: source.company || 'unknown',
                timestamp: admin.firestore.Timestamp.now(),
                status: failed > 0 ? 'partial' : 'success',
                jobsFetched: jobs.length,
                jobsWritten: written,
                jobsFailed: failed,
                enrichmentTasksCreated,
                duration,
            });

            // Update aggregated metrics
            await db.collection('aggregatedFetchMetrics').doc(executionId).update({
                sourcesCompleted: admin.firestore.FieldValue.increment(1),
                totalJobsFetched: admin.firestore.FieldValue.increment(jobs.length),
                totalJobsWritten: admin.firestore.FieldValue.increment(written),
                totalEnrichmentTasks: admin.firestore.FieldValue.increment(enrichmentTasksCreated),
            });

        } catch (error: any) {
            const duration = Date.now() - startTime;

            console.error(`[WORKER] ❌ Failed ${providerKey}:`, error);

            // Log failure metrics
            await metricsLogger.logFetchMetrics({
                executionId,
                provider: source.provider,
                company: source.company || 'unknown',
                timestamp: admin.firestore.Timestamp.now(),
                status: 'failed',
                jobsFetched: 0,
                jobsWritten: 0,
                jobsFailed: 0,
                enrichmentTasksCreated: 0,
                duration,
                error: error.message,
            });

            // Update aggregated metrics
            await db.collection('aggregatedFetchMetrics').doc(executionId).update({
                sourcesFailed: admin.firestore.FieldValue.increment(1),
            });

            // Re-throw to trigger retry mechanism
            throw error;
        }
    }
);
