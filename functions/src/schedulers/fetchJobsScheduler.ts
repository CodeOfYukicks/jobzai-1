import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFunctions } from 'firebase-admin/functions';
import { ATS_SOURCES } from '../config';
import * as admin from 'firebase-admin';

/**
 * Lightweight CRON scheduler that creates Cloud Tasks for each ATS source
 * 
 * Runs daily at 2 AM UTC to fetch jobs from all configured ATS sources.
 * Creates one task per source in the fetchJobsQueue, allowing parallel processing
 * with controlled concurrency and automatic retries.
 * 
 * Benefits:
 * - No timeout risk (each source has its own 540s timeout)
 * - Automatic retry on failure
 * - Parallel processing (up to 10 sources at once)
 * - Better observability (can track each source individually)
 */
export const scheduleFetchJobs = onSchedule(
    {
        schedule: 'every day 02:00',
        timeZone: 'UTC',
        region: 'us-central1',
        timeoutSeconds: 60,
        memory: '256MiB',
    },
    async (event) => {
        const executionId = `exec_${Date.now()}`;
        const db = admin.firestore();

        console.log(`[SCHEDULER] Starting execution ${executionId}`);
        console.log(`[SCHEDULER] Sources to process: ${ATS_SOURCES.length}`);

        try {
            const queue = getFunctions().taskQueue('fetchJobsQueue');
            let tasksCreated = 0;

            // Create aggregated metrics document
            await db.collection('aggregatedFetchMetrics').doc(executionId).set({
                executionId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                totalSources: ATS_SOURCES.length,
                sourcesCompleted: 0,
                sourcesFailed: 0,
                totalJobsFetched: 0,
                totalJobsWritten: 0,
                totalEnrichmentTasks: 0,
                status: 'in_progress',
            });

            // Create one task per ATS source
            for (const source of ATS_SOURCES) {
                await queue.enqueue({
                    executionId,
                    source,
                    timestamp: Date.now(),
                });

                tasksCreated++;
                console.log(`[SCHEDULER] Created task ${tasksCreated}/${ATS_SOURCES.length}: ${source.provider}/${source.company}`);
            }

            console.log(`[SCHEDULER] ✅ Successfully created ${tasksCreated} tasks`);
            console.log(`[SCHEDULER] Tasks will be processed by fetchJobsWorker`);
            console.log(`[SCHEDULER] Monitor progress in aggregatedFetchMetrics/${executionId}`);

        } catch (error: any) {
            console.error(`[SCHEDULER] ❌ Failed to create tasks:`, error);

            // Log failure
            await db.collection('aggregatedFetchMetrics').doc(executionId).set({
                executionId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                totalSources: ATS_SOURCES.length,
                sourcesCompleted: 0,
                sourcesFailed: ATS_SOURCES.length,
                status: 'failed',
                error: error.message,
            });

            throw error;
        }
    }
);
