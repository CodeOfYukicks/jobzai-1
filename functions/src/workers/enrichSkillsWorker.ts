import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import * as admin from 'firebase-admin';
import { QUEUE_CONFIG } from '../config';
import { MetricsLogger } from '../utils/metricsLogger';
import { extractSkillsWithLLM } from '../utils/embeddings';

/**
 * Task Queue Worker that enriches a single job with skills using LLM
 * 
 * Each task processes one job:
 * 1. Fetch job from Firestore
 * 2. Skip if already enriched
 * 3. Extract skills using LLM
 * 4. Update job with skills and enrichment status
 * 5. Log metrics
 * 
 * Benefits:
 * - Asynchronous enrichment doesn't block job fetching
 * - Up to 50 enrichments processed in parallel
 * - Rate limited to 10/second (OpenAI API limit)
 * - Graceful failure handling (marks as failed, doesn't retry infinitely)
 */
export const enrichSkillsWorker = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: QUEUE_CONFIG.enrichSkills.maxRetries,
            minBackoffSeconds: QUEUE_CONFIG.enrichSkills.minBackoffSeconds,
        },
        rateLimits: {
            maxConcurrentDispatches: QUEUE_CONFIG.enrichSkills.maxConcurrentDispatches,
            maxDispatchesPerSecond: QUEUE_CONFIG.enrichSkills.maxDispatchesPerSecond,
        },
        region: 'us-central1',
        memory: '512MiB',
        timeoutSeconds: 60,
    },
    async (request) => {
        const { jobId } = request.data as {
            jobId: string;
        };

        const db = admin.firestore();
        const metricsLogger = new MetricsLogger(db);
        const startTime = Date.now();

        console.log(`[ENRICH] Processing job: ${jobId}`);

        try {
            const jobRef = db.collection('jobs').doc(jobId);
            const jobDoc = await jobRef.get();

            if (!jobDoc.exists) {
                console.log(`[ENRICH] Job not found: ${jobId}`);
                return;
            }

            const jobData = jobDoc.data()!;

            // Skip if already enriched
            if (jobData.enrichmentStatus === 'completed') {
                console.log(`[ENRICH] Job already enriched: ${jobId}`);
                return;
            }

            // Skip if no description
            if (!jobData.description || jobData.description.trim().length === 0) {
                console.log(`[ENRICH] No description to process: ${jobId}`);
                await jobRef.update({
                    enrichmentStatus: 'failed',
                    enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return;
            }

            console.log(`[ENRICH] Extracting skills for: ${jobData.title} @ ${jobData.company}`);

            // Extract skills using LLM
            const skills = await extractSkillsWithLLM(
                `${jobData.title}\n${jobData.description}`
            );

            console.log(`[ENRICH] Extracted ${skills.length} skills for ${jobId}`);

            // Update job with skills
            await jobRef.update({
                skills,
                enrichmentStatus: 'completed',
                enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const duration = Date.now() - startTime;

            console.log(`[ENRICH] ✅ Completed ${jobId} in ${duration}ms`);

            // Log metrics
            await metricsLogger.logEnrichmentMetrics({
                jobId,
                timestamp: admin.firestore.Timestamp.now(),
                status: 'success',
                skillsExtracted: skills.length,
                duration,
            });

        } catch (error: any) {
            const duration = Date.now() - startTime;

            console.error(`[ENRICH] ❌ Failed to enrich ${jobId}:`, error.message);

            // Mark as failed but don't throw (avoid infinite retries)
            try {
                await db.collection('jobs').doc(jobId).update({
                    enrichmentStatus: 'failed',
                    enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Log failure metrics
                await metricsLogger.logEnrichmentMetrics({
                    jobId,
                    timestamp: admin.firestore.Timestamp.now(),
                    status: 'failed',
                    skillsExtracted: 0,
                    duration,
                    error: error.message,
                });
            } catch (updateError: any) {
                console.error(`[ENRICH] Failed to update job status:`, updateError.message);
            }

            // Don't re-throw - we've marked it as failed, no need to retry
            // The job will remain in the database with enrichmentStatus: 'failed'
        }
    }
);
