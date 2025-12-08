/**
 * 🚀 Task Creator
 * 
 * Creates fetch tasks for all ATS sources in batches
 * Each task represents one company to fetch from one ATS provider
 * 
 * Called by Cloud Scheduler every 6 hours
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { ATS_SOURCES } from '../config';
import { FetchTask, BatchExecution, QUEUE_CONSTANTS } from './types';

const REGION = 'us-central1';

/**
 * Generate a unique batch ID
 */
function generateBatchId(): string {
	const now = new Date();
	const date = now.toISOString().split('T')[0].replace(/-/g, '');
	const time = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
	return `batch_${date}_${time}`;
}

/**
 * Create tasks for all ATS sources
 */
async function createAllTasks(db: admin.firestore.Firestore): Promise<{
	executionId: string;
	batchId: string;
	tasksCreated: number;
}> {
	const executionId = `exec_${Date.now()}`;
	const batchId = generateBatchId();
	
	console.log(`[TaskCreator] Starting task creation: executionId=${executionId}, batchId=${batchId}`);
	console.log(`[TaskCreator] Total sources to process: ${ATS_SOURCES.length}`);
	
	// Create batch execution record
	const executionRef = db.collection(QUEUE_CONSTANTS.EXECUTIONS_COLLECTION).doc(executionId);
	const executionData: BatchExecution = {
		executionId,
		batchId,
		status: 'running',
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		totalTasks: ATS_SOURCES.length,
		completedTasks: 0,
		failedTasks: 0,
		totalJobsFetched: 0,
		totalJobsWritten: 0,
		errors: [],
	};
	await executionRef.set(executionData);
	
	// Create tasks in chunks (Firestore batch limit is 500)
	const CHUNK_SIZE = 400;
	let tasksCreated = 0;
	
	for (let i = 0; i < ATS_SOURCES.length; i += CHUNK_SIZE) {
		const chunk = ATS_SOURCES.slice(i, i + CHUNK_SIZE);
		const batch = db.batch();
		
		for (const source of chunk) {
			const taskId = `${source.provider}_${source.company}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const taskRef = db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION).doc(taskId);
			
			const taskData: FetchTask = {
				taskId,
				provider: source.provider,
				company: source.company || '',
				workdayDomain: source.workdayDomain || undefined,
				workdaySiteId: source.workdaySiteId || undefined,
				status: 'pending',
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				executionId,
				batchId,
				retryCount: 0,
				maxRetries: QUEUE_CONSTANTS.MAX_RETRIES,
			};
			
			batch.set(taskRef, taskData);
			tasksCreated++;
		}
		
		await batch.commit();
		console.log(`[TaskCreator] Created ${tasksCreated}/${ATS_SOURCES.length} tasks`);
	}
	
	console.log(`[TaskCreator] ✅ Created ${tasksCreated} tasks for batch ${batchId}`);
	
	return { executionId, batchId, tasksCreated };
}

/**
 * Scheduled task creator - runs every 6 hours
 */
export const createFetchTasks = onSchedule(
	{
		region: REGION,
		schedule: 'every 6 hours',
		timeZone: 'UTC',
		retryCount: 0,
		maxInstances: 1,
		timeoutSeconds: 120,
		memory: '512MiB',
	},
	async () => {
		const db = admin.firestore();
		
		try {
			// Check if there's already a running execution
			const runningExecs = await db.collection(QUEUE_CONSTANTS.EXECUTIONS_COLLECTION)
				.where('status', '==', 'running')
				.limit(1)
				.get();
			
			if (!runningExecs.empty) {
				console.log('[TaskCreator] Skipping - another execution is still running');
				return;
			}
			
			const result = await createAllTasks(db);
			console.log(`[TaskCreator] Scheduled execution created: ${result.tasksCreated} tasks`);
			
		} catch (error: any) {
			console.error('[TaskCreator] Error creating tasks:', error);
			throw error;
		}
	}
);

/**
 * Manual task creator - HTTP endpoint for testing
 */
export const createFetchTasksManual = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 120,
		memory: '512MiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.set('Access-Control-Allow-Headers', 'Content-Type');

		if (req.method === 'OPTIONS') {
			res.status(204).send('');
			return;
		}

		try {
			const db = admin.firestore();
			
			// Optional: limit to specific providers for testing
			const { providers, companies } = req.body || {};
			
			const result = await createAllTasks(db);
			
			res.status(200).json({
				success: true,
				...result,
				message: `Created ${result.tasksCreated} fetch tasks`,
			});
			
		} catch (error: any) {
			console.error('[TaskCreator] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);

/**
 * Get current queue status
 */
export const getQueueStatus = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 5,
		timeoutSeconds: 30,
		memory: '256MiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		
		try {
			const db = admin.firestore();
			
			// Get latest execution
			const latestExec = await db.collection(QUEUE_CONSTANTS.EXECUTIONS_COLLECTION)
				.orderBy('createdAt', 'desc')
				.limit(1)
				.get();
			
			// Count tasks by status
			const pending = await db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION)
				.where('status', '==', 'pending')
				.count()
				.get();
			
			const processing = await db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION)
				.where('status', '==', 'processing')
				.count()
				.get();
			
			const completed = await db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION)
				.where('status', '==', 'completed')
				.count()
				.get();
			
			const failed = await db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION)
				.where('status', '==', 'failed')
				.count()
				.get();
			
			res.status(200).json({
				success: true,
				latestExecution: latestExec.empty ? null : latestExec.docs[0].data(),
				taskCounts: {
					pending: pending.data().count,
					processing: processing.data().count,
					completed: completed.data().count,
					failed: failed.data().count,
				},
				totalSources: ATS_SOURCES.length,
			});
			
		} catch (error: any) {
			console.error('[QueueStatus] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);




