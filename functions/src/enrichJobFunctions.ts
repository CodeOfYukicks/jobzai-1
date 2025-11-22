import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { enrichJob, enrichAllJobs } from './utils/jobEnrichment';

/**
 * Manual trigger to enrich all jobs with filter tags
 * Call this once to add missing fields to existing jobs
 * 
 * Usage: POST https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichJobsManual
 * Body: { "secret": "YOUR_SECRET_KEY", "batchSize": 100 }
 */
export const enrichJobsManual = onRequest({
    region: 'us-central1',
    cors: true,
    maxInstances: 1,
    timeoutSeconds: 540, // 9 minutes
    memory: '512MiB',
}, async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Simple auth check (replace with better auth in production)
        const { secret, batchSize } = req.body;

        if (secret !== process.env.ENRICH_SECRET && secret !== 'temp-dev-secret-123') {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log('🚀 Starting job enrichment process...');

        const size = batchSize || 100;
        await enrichAllJobs(size);

        res.status(200).json({
            success: true,
            message: 'Job enrichment completed',
        });

    } catch (error: any) {
        console.error('Error enriching jobs:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * Enrich a single job by ID
 * 
 * Usage: POST https://us-central1-jobzai-39f7e.cloudfunctions.net/enrichSingleJob
 * Body: { "jobId": "abc123" }
 */
export const enrichSingleJob = onRequest({
    region: 'us-central1',
    cors: true,
}, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { jobId } = req.body;

        if (!jobId) {
            res.status(400).json({ error: 'jobId is required' });
            return;
        }

        await enrichJob(jobId);

        res.status(200).json({
            success: true,
            message: `Job ${jobId} enriched successfully`,
        });

    } catch (error: any) {
        console.error('Error enriching job:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
