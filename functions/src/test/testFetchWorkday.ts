/**
 * HTTP version of fetchJobsWorker for testing
 * Call this endpoint to manually trigger a fetch for a single ATS source
 * 
 * Example:
 * POST /testFetchWorkday
 * Body: { "company": "nvidia", "workdayDomain": "wd5", "workdaySiteId": "NVIDIAExternalCareerSite" }
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { fetchWorkday } from '../utils/atsFetchers';
import { BatchWriter } from '../utils/batchWriter';
import { JobDocument, NormalizedATSJob } from '../types';

function hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function normalizeJob(n: NormalizedATSJob): JobDocument {
    const postedAt = n.postedAt
        ? admin.firestore.Timestamp.fromDate(new Date(n.postedAt))
        : admin.firestore.FieldValue.serverTimestamp();

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
        enrichmentStatus: (!n.skills || n.skills.length === 0) && n.description ? 'pending' : null,
        enrichedAt: null,
    };
}

export const testFetchWorkday = onRequest(
    {
        region: 'us-central1',
        memory: '2GiB',
        timeoutSeconds: 540,
        cors: true,
    },
    async (req, res) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        try {
            const { company, workdayDomain, workdaySiteId } = req.body;

            if (!company || !workdayDomain || !workdaySiteId) {
                res.status(400).json({
                    error: 'Missing required fields: company, workdayDomain, workdaySiteId',
                });
                return;
            }

            console.log(`[TEST] Fetching Workday jobs for ${company}...`);
            const startTime = Date.now();

            // Fetch jobs
            const jobs = await fetchWorkday(company, workdayDomain, workdaySiteId);

            console.log(`[TEST] Fetched ${jobs.length} jobs from Workday/${company}`);

            if (jobs.length === 0) {
                res.status(200).json({
                    success: true,
                    message: 'No jobs found',
                    jobsFetched: 0,
                    jobsWritten: 0,
                });
                return;
            }

            // Write to Firestore
            const db = admin.firestore();
            const batchWriter = new BatchWriter(db);

            console.log(`[TEST] Writing ${jobs.length} jobs to Firestore...`);

            const { written, failed } = await batchWriter.writeBatch(
                jobs,
                (job, batch, db) => {
                    const baseId = job.externalId && job.externalId.length > 0
                        ? `${job.ats}_${job.externalId}`
                        : `${job.ats}_${hashString([job.title, job.company, job.applyUrl].join('|'))}`;

                    const ref = db.collection('jobs').doc(baseId);
                    const normalized = normalizeJob(job);

                    batch.set(ref, normalized, { merge: true });
                },
                {
                    batchSize: 500,
                    logProgress: true,
                }
            );

            const duration = Date.now() - startTime;

            console.log(`[TEST] ✅ Completed in ${duration}ms`);
            console.log(`[TEST]   - Jobs fetched: ${jobs.length}`);
            console.log(`[TEST]   - Jobs written: ${written}`);
            console.log(`[TEST]   - Jobs failed: ${failed}`);

            res.status(200).json({
                success: true,
                jobsFetched: jobs.length,
                jobsWritten: written,
                jobsFailed: failed,
                duration,
                sampleJobs: jobs.slice(0, 3).map(j => ({
                    title: j.title,
                    company: j.company,
                    location: j.location,
                })),
            });

        } catch (error: any) {
            console.error(`[TEST] ❌ Error:`, error);
            res.status(500).json({
                error: error.message,
                stack: error.stack,
            });
        }
    }
);
