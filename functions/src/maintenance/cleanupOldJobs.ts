/**
 * 🧹 Job Cleanup System
 * 
 * Automatically removes old jobs to keep the database lean and queries fast
 * 
 * Features:
 * - Configurable TTL (default: 90 days for jobs, 7 days for completed tasks)
 * - Batch deletion for efficiency
 * - Metrics tracking
 * - Can be run manually or on schedule
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';

const REGION = 'us-central1';

// TTL Configuration
const TTL_CONFIG = {
	jobs: 90,              // Days to keep jobs
	completedTasks: 7,     // Days to keep completed fetch tasks
	failedTasks: 30,       // Days to keep failed fetch tasks
	executions: 30,        // Days to keep execution records
	metrics: 90,           // Days to keep metrics
};

/**
 * Delete documents older than a certain date
 */
async function deleteOldDocuments(
	db: admin.firestore.Firestore,
	collection: string,
	dateField: string,
	daysOld: number,
	additionalFilters?: Array<{ field: string; op: FirebaseFirestore.WhereFilterOp; value: any }>
): Promise<{ deleted: number; errors: number }> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);
	const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
	
	let deleted = 0;
	let errors = 0;
	
	try {
		// Build query
		let query: admin.firestore.Query = db.collection(collection)
			.where(dateField, '<', cutoffTimestamp)
			.limit(500);
		
		// Add additional filters if provided
		if (additionalFilters) {
			for (const filter of additionalFilters) {
				query = query.where(filter.field, filter.op, filter.value);
			}
		}
		
		// Delete in batches
		let hasMore = true;
		while (hasMore) {
			const snapshot = await query.get();
			
			if (snapshot.empty) {
				hasMore = false;
				break;
			}
			
			const batch = db.batch();
			snapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
				deleted++;
			});
			
			try {
				await batch.commit();
			} catch (e) {
				console.error(`[Cleanup] Batch delete error for ${collection}:`, e);
				errors += snapshot.size;
			}
			
			// If we got less than the limit, we're done
			if (snapshot.size < 500) {
				hasMore = false;
			}
			
			// Small delay to avoid hammering Firestore
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
	} catch (e) {
		console.error(`[Cleanup] Error querying ${collection}:`, e);
	}
	
	return { deleted, errors };
}

/**
 * Run the full cleanup process
 */
async function runCleanup(db: admin.firestore.Firestore): Promise<{
	jobs: { deleted: number; errors: number };
	completedTasks: { deleted: number; errors: number };
	failedTasks: { deleted: number; errors: number };
	executions: { deleted: number; errors: number };
	duration: number;
}> {
	const startTime = Date.now();
	
	console.log('[Cleanup] Starting cleanup process...');
	console.log('[Cleanup] TTL Config:', TTL_CONFIG);
	
	// 1. Delete old jobs
	console.log(`[Cleanup] Deleting jobs older than ${TTL_CONFIG.jobs} days...`);
	const jobsResult = await deleteOldDocuments(
		db,
		'jobs',
		'postedAt',
		TTL_CONFIG.jobs
	);
	console.log(`[Cleanup] Jobs: deleted=${jobsResult.deleted}, errors=${jobsResult.errors}`);
	
	// 2. Delete completed fetch tasks
	console.log(`[Cleanup] Deleting completed tasks older than ${TTL_CONFIG.completedTasks} days...`);
	const completedTasksResult = await deleteOldDocuments(
		db,
		'fetchTasks',
		'completedAt',
		TTL_CONFIG.completedTasks,
		[{ field: 'status', op: '==', value: 'completed' }]
	);
	console.log(`[Cleanup] Completed tasks: deleted=${completedTasksResult.deleted}, errors=${completedTasksResult.errors}`);
	
	// 3. Delete old failed fetch tasks
	console.log(`[Cleanup] Deleting failed tasks older than ${TTL_CONFIG.failedTasks} days...`);
	const failedTasksResult = await deleteOldDocuments(
		db,
		'fetchTasks',
		'completedAt',
		TTL_CONFIG.failedTasks,
		[{ field: 'status', op: '==', value: 'failed' }]
	);
	console.log(`[Cleanup] Failed tasks: deleted=${failedTasksResult.deleted}, errors=${failedTasksResult.errors}`);
	
	// 4. Delete old execution records
	console.log(`[Cleanup] Deleting executions older than ${TTL_CONFIG.executions} days...`);
	const executionsResult = await deleteOldDocuments(
		db,
		'fetchExecutions',
		'createdAt',
		TTL_CONFIG.executions
	);
	console.log(`[Cleanup] Executions: deleted=${executionsResult.deleted}, errors=${executionsResult.errors}`);
	
	const duration = Math.round((Date.now() - startTime) / 1000);
	
	console.log(`[Cleanup] ✅ Complete! Duration: ${duration}s`);
	console.log(`[Cleanup] Total deleted: ${jobsResult.deleted + completedTasksResult.deleted + failedTasksResult.deleted + executionsResult.deleted}`);
	
	return {
		jobs: jobsResult,
		completedTasks: completedTasksResult,
		failedTasks: failedTasksResult,
		executions: executionsResult,
		duration,
	};
}

/**
 * Scheduled cleanup - runs daily at 3 AM UTC
 */
export const scheduledCleanup = onSchedule(
	{
		region: REGION,
		schedule: 'every day 03:00',
		timeZone: 'UTC',
		retryCount: 1,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '512MiB',
	},
	async () => {
		const db = admin.firestore();
		
		try {
			const result = await runCleanup(db);
			
			// Store cleanup metrics
			await db.collection('cleanupMetrics').doc(`cleanup_${Date.now()}`).set({
				timestamp: admin.firestore.FieldValue.serverTimestamp(),
				...result,
			});
			
		} catch (error: any) {
			console.error('[ScheduledCleanup] Error:', error);
			throw error;
		}
	}
);

/**
 * Manual cleanup endpoint
 */
export const manualCleanup = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 540,
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
			const result = await runCleanup(db);
			
			// Store cleanup metrics
			await db.collection('cleanupMetrics').doc(`manual_${Date.now()}`).set({
				timestamp: admin.firestore.FieldValue.serverTimestamp(),
				...result,
				triggeredBy: 'manual',
			});
			
			res.status(200).json({
				success: true,
				...result,
			});
			
		} catch (error: any) {
			console.error('[ManualCleanup] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);

/**
 * Get database stats
 */
export const getDatabaseStats = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 5,
		timeoutSeconds: 60,
		memory: '256MiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		
		try {
			const db = admin.firestore();
			
			// Count documents in each collection
			const [jobs, tasks, executions] = await Promise.all([
				db.collection('jobs').count().get(),
				db.collection('fetchTasks').count().get(),
				db.collection('fetchExecutions').count().get(),
			]);
			
			// Get jobs by ATS
			const atsProviders = ['greenhouse', 'lever', 'smartrecruiters', 'ashby', 'workday'];
			const jobsByAts: Record<string, number> = {};
			
			for (const ats of atsProviders) {
				const count = await db.collection('jobs')
					.where('ats', '==', ats)
					.count()
					.get();
				jobsByAts[ats] = count.data().count;
			}
			
			// Get recent job count (last 7 days)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const recentJobs = await db.collection('jobs')
				.where('postedAt', '>', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
				.count()
				.get();
			
			res.status(200).json({
				success: true,
				stats: {
					totalJobs: jobs.data().count,
					totalTasks: tasks.data().count,
					totalExecutions: executions.data().count,
					jobsByAts,
					recentJobs: recentJobs.data().count,
				},
				ttlConfig: TTL_CONFIG,
			});
			
		} catch (error: any) {
			console.error('[DatabaseStats] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);












