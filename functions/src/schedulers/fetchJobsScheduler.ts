/**
 * 🚀 Modern Queue-Based ATS Job Fetching Scheduler
 *
 * This scheduler runs every 24 hours and creates Cloud Tasks for each ATS source.
 * Each task is processed independently with its own timeout and retry logic.
 *
 * **Architecture:**
 * - Scheduler → Creates tasks for each ATS source → fetchJobsWorker processes each task
 * - Each worker has 540s timeout (no global timeout risk)
 * - Automatic retry per source (fault tolerant)
 * - Per-source metrics and observability
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ATS_SOURCES } from '../config';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

export const scheduleFetchJobs = onSchedule(
	{
		region: REGION,
		schedule: 'every 24 hours',
		timeZone: 'UTC',
		retryCount: 0, // Don't retry the scheduler itself
		maxInstances: 1,
		timeoutSeconds: 60, // Scheduler is fast (just creates tasks)
		memory: '256MiB',
	},
	async (event) => {
		const db = admin.firestore();
		const executionId = `schedule_${Date.now()}`;

		console.log(`[SCHEDULER] Starting job fetch scheduling execution=${executionId}`);
		console.log(`[SCHEDULER] Total sources to process: ${ATS_SOURCES.length}`);

		try {
			// Create a batch of tasks, one for each ATS source
			const batch = db.batch();
			let taskCount = 0;

			for (const source of ATS_SOURCES) {
				const taskId = `${source.provider}_${source.company}_${Date.now()}`;
				const taskRef = db.collection('jobFetchTasks').doc(taskId);

				batch.set(taskRef, {
					taskId,
					provider: source.provider,
					company: source.company,
					workdayDomain: source.workdayDomain || null,
					workdaySiteId: source.workdaySiteId || null,
					status: 'pending',
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					executionId,
					retryCount: 0,
					maxRetries: 3,
				});

				taskCount++;
			}

			await batch.commit();

			console.log(`[SCHEDULER] Created ${taskCount} job fetch tasks`);
			console.log(`[SCHEDULER] Tasks will be processed by fetchJobsWorker`);

			// Store scheduler execution metrics
			await db.collection('schedulerMetrics').doc(executionId).set({
				executionId,
				timestamp: admin.firestore.FieldValue.serverTimestamp(),
				tasksCreated: taskCount,
				sources: ATS_SOURCES.map(s => `${s.provider}:${s.company}`),
				status: 'completed',
			});

		} catch (error: any) {
			console.error(`[SCHEDULER] Error creating tasks:`, error);
			throw error;
		}
	}
);
