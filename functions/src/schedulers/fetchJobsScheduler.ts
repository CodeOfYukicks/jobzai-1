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
 * 
 * **V6.0 Sources:**
 * - Standard ATS: Greenhouse, Lever, SmartRecruiters, Ashby, Workday
 * - GAFAM: Google, Meta, Amazon, Apple, Microsoft
 * - Enterprise Tech: Salesforce, SAP, Oracle
 * - Enterprise Consulting: Accenture, Deloitte, Capgemini
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ATS_SOURCES } from '../config';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

// GAFAM + Enterprise Sources (direct fetchers, not ATS)
const GAFAM_SOURCES = [
	{ provider: 'google', company: 'Google' },
	{ provider: 'meta', company: 'Meta' },
	{ provider: 'amazon', company: 'Amazon' },
	{ provider: 'apple', company: 'Apple' },
	{ provider: 'microsoft', company: 'Microsoft' },
];

const ENTERPRISE_TECH_SOURCES = [
	{ provider: 'salesforce', company: 'Salesforce' },
	{ provider: 'sap', company: 'SAP' },
	{ provider: 'oracle', company: 'Oracle' },
];

const ENTERPRISE_CONSULTING_SOURCES = [
	{ provider: 'accenture', company: 'Accenture' },
	{ provider: 'deloitte', company: 'Deloitte' },
	{ provider: 'capgemini', company: 'Capgemini' },
];

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

		// Combine all sources
		const ALL_SOURCES = [
			...ATS_SOURCES,
			...GAFAM_SOURCES,
			...ENTERPRISE_TECH_SOURCES,
			...ENTERPRISE_CONSULTING_SOURCES,
		];
		
		console.log(`[SCHEDULER] Starting job fetch scheduling execution=${executionId}`);
		console.log(`[SCHEDULER] Total sources to process: ${ALL_SOURCES.length} (ATS: ${ATS_SOURCES.length}, GAFAM: ${GAFAM_SOURCES.length}, Enterprise Tech: ${ENTERPRISE_TECH_SOURCES.length}, Enterprise Consulting: ${ENTERPRISE_CONSULTING_SOURCES.length})`);

		try {
			// Create a batch of tasks, one for each source
			const batch = db.batch();
			let taskCount = 0;

			for (const source of ALL_SOURCES) {
				const taskId = `${source.provider}_${source.company}_${Date.now()}`;
				const taskRef = db.collection('jobFetchTasks').doc(taskId);

				batch.set(taskRef, {
					taskId,
					provider: source.provider,
					company: source.company,
					workdayDomain: (source as any).workdayDomain || null,
					workdaySiteId: (source as any).workdaySiteId || null,
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
				sources: ALL_SOURCES.map(s => `${s.provider}:${s.company}`),
				gafamCount: GAFAM_SOURCES.length,
				enterpriseTechCount: ENTERPRISE_TECH_SOURCES.length,
				enterpriseConsultingCount: ENTERPRISE_CONSULTING_SOURCES.length,
				atsCount: ATS_SOURCES.length,
				status: 'completed',
			});

		} catch (error: any) {
			console.error(`[SCHEDULER] Error creating tasks:`, error);
			throw error;
		}
	}
);
