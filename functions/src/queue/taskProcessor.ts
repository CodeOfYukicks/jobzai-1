/**
 * 🔧 Task Processor
 * 
 * Processes individual fetch tasks from the queue
 * Triggered by Firestore document creation in fetchTasks collection
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Per-task metrics and error tracking
 * - Batch writing to Firestore
 * - Enrichment with v2.2 tags
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { FetchTask, QUEUE_CONSTANTS } from './types';
import { fetchGreenhouse, fetchLever, fetchSmartRecruiters, fetchAshby, fetchWorkday } from '../utils/atsFetchers';
import { cleanDescription } from '../utils/cleanDescription';
import { NormalizedATSJob } from '../types';
import { 
    extractExperienceLevel, 
    extractEmploymentType, 
    extractWorkLocation,
    extractIndustryTags,
    extractTechnologyTags,
    JobDoc 
} from '../utils/jobEnrichment';

const REGION = 'us-central1';

// ============================================
// Utility Functions
// ============================================

// ============================================
// Hash function for document IDs
// ============================================

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

// ============================================
// Task Processing Logic
// ============================================

async function processTask(
	taskData: FetchTask,
	taskRef: admin.firestore.DocumentReference,
	db: admin.firestore.Firestore
): Promise<{ success: boolean; jobsFetched: number; jobsWritten: number; error?: string }> {
	const { provider, company, workdayDomain, workdaySiteId } = taskData;
	const startTime = Date.now();
	
	console.log(`[TaskProcessor] Processing ${provider}/${company}`);
	
	try {
		// Mark as processing
		await taskRef.update({
			status: 'processing',
			startedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
		
		// Fetch jobs from ATS
		let jobs: NormalizedATSJob[] = [];
		
		switch (provider) {
			case 'greenhouse':
				jobs = await fetchGreenhouse(company);
				break;
			case 'lever':
				jobs = await fetchLever(company);
				break;
			case 'smartrecruiters':
				jobs = await fetchSmartRecruiters(company);
				break;
			case 'ashby':
				jobs = await fetchAshby(company);
				break;
			case 'workday':
				jobs = await fetchWorkday(company, workdayDomain || 'wd5', workdaySiteId);
				break;
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
		
		console.log(`[TaskProcessor] Fetched ${jobs.length} jobs from ${provider}/${company}`);
		
		if (jobs.length === 0) {
			await taskRef.update({
				status: 'completed',
				completedAt: admin.firestore.FieldValue.serverTimestamp(),
				duration: Date.now() - startTime,
				jobsFetched: 0,
				jobsWritten: 0,
			});
			return { success: true, jobsFetched: 0, jobsWritten: 0 };
		}
		
		// Write jobs in batches (Firestore limit is 500)
		let written = 0;
		const BATCH_SIZE = 400;
		
		for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
			const chunk = jobs.slice(i, i + BATCH_SIZE);
			const batch = db.batch();
			
			for (const j of chunk) {
				// Generate document ID
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
					? j.externalId.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 200)
					: '';
				const docId = cleanExternalId
					? `${j.ats}_${cleanExternalId}`
					: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
				
				const ref = db.collection('jobs').doc(docId);
				
			// Clean description
			const cleanedDesc = cleanDescription(j.description || '');
			
			// Create a temporary JobDoc for enrichment functions
			const tempJob: JobDoc = {
				id: docId,
				title: j.title,
				description: cleanedDesc,
				location: j.location,
				company: j.company,
			};
			
			// Extract tags with v4.1 logic
			const experienceLevels = extractExperienceLevel(tempJob);
			const employmentTypes = extractEmploymentType(tempJob, experienceLevels);
			const workLocations = extractWorkLocation(tempJob);
			const industries = extractIndustryTags(tempJob);
			const technologies = extractTechnologyTags(tempJob);
				
				// Build job document
				const jobData = {
					title: j.title || '',
					company: j.company || '',
					companyLogo: j.companyLogo || null,
					location: j.location || '',
					description: cleanedDesc,
					skills: j.skills || [],
					applyUrl: j.applyUrl || '',
					ats: j.ats,
					externalId: j.externalId,
					postedAt: j.postedAt 
						? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) 
						: admin.firestore.FieldValue.serverTimestamp(),
					
				// Enriched tags (v4.1 - strict remote & contract detection)
				employmentTypes,
				workLocations,
				experienceLevels,
				industries,
				technologies,
				
				// Legacy fields for backwards compatibility
				type: employmentTypes[0] || 'full-time',
				remote: workLocations.includes('remote') ? 'remote' : 'on-site',
				seniority: experienceLevels[0] || 'mid',
				
				// Metadata
				enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
				enrichedVersion: '4.1',
				fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
			};
				
				batch.set(ref, jobData, { merge: true });
				written++;
			}
			
			await batch.commit();
		}
		
		// Mark task as completed
		const duration = Date.now() - startTime;
		await taskRef.update({
			status: 'completed',
			completedAt: admin.firestore.FieldValue.serverTimestamp(),
			duration,
			jobsFetched: jobs.length,
			jobsWritten: written,
		});
		
		// Update execution stats
		await updateExecutionStats(db, taskData.executionId, {
			completedTasks: admin.firestore.FieldValue.increment(1) as any,
			totalJobsFetched: admin.firestore.FieldValue.increment(jobs.length) as any,
			totalJobsWritten: admin.firestore.FieldValue.increment(written) as any,
		});
		
		console.log(`[TaskProcessor] ✅ Completed ${provider}/${company}: ${written} jobs in ${duration}ms`);
		return { success: true, jobsFetched: jobs.length, jobsWritten: written };
		
	} catch (error: any) {
		console.error(`[TaskProcessor] ❌ Error processing ${provider}/${company}:`, error.message);
		
		// Check if we should retry
		const shouldRetry = taskData.retryCount < taskData.maxRetries;
		
		if (shouldRetry) {
			// Schedule retry with exponential backoff
			const retryDelay = Math.pow(2, taskData.retryCount) * QUEUE_CONSTANTS.RETRY_DELAY_BASE_MS;
			
			await taskRef.update({
				status: 'retrying',
				retryCount: admin.firestore.FieldValue.increment(1),
				error: error.message,
				retryAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + retryDelay)),
			});
			
			console.log(`[TaskProcessor] Will retry ${provider}/${company} in ${retryDelay}ms (attempt ${taskData.retryCount + 1}/${taskData.maxRetries})`);
		} else {
			// Max retries reached, mark as failed
			await taskRef.update({
				status: 'failed',
				completedAt: admin.firestore.FieldValue.serverTimestamp(),
				duration: Date.now() - startTime,
				error: error.message,
			});
			
			// Update execution stats
			await updateExecutionStats(db, taskData.executionId, {
				failedTasks: admin.firestore.FieldValue.increment(1) as any,
			});
			
			// Add error to execution errors
			const execRef = db.collection(QUEUE_CONSTANTS.EXECUTIONS_COLLECTION).doc(taskData.executionId);
			await execRef.update({
				errors: admin.firestore.FieldValue.arrayUnion({
					provider,
					company,
					error: error.message,
				}),
			});
		}
		
		return { success: false, jobsFetched: 0, jobsWritten: 0, error: error.message };
	}
}

async function updateExecutionStats(
	db: admin.firestore.Firestore,
	executionId: string,
	updates: Record<string, any>
): Promise<void> {
	try {
		const execRef = db.collection(QUEUE_CONSTANTS.EXECUTIONS_COLLECTION).doc(executionId);
		await execRef.update(updates);
	} catch (e) {
		console.warn(`[TaskProcessor] Failed to update execution stats:`, e);
	}
}

// ============================================
// Firestore Trigger - Process new tasks
// ============================================

export const processFetchTask = onDocumentCreated(
	{
		document: `${QUEUE_CONSTANTS.TASKS_COLLECTION}/{taskId}`,
		region: REGION,
		timeoutSeconds: 540,
		memory: '1GiB',
		maxInstances: 20, // Allow up to 20 parallel workers
	},
	async (event) => {
		const db = admin.firestore();
		const taskData = event.data?.data() as FetchTask;
		
		if (!taskData) {
			console.error('[TaskProcessor] No task data found');
			return;
		}
		
		const taskRef = db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION).doc(event.params.taskId);
		
		await processTask(taskData, taskRef, db);
	}
);

// ============================================
// Manual task processing endpoint (for testing/retry)
// ============================================

export const processTaskManual = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 5,
		timeoutSeconds: 540,
		memory: '1GiB',
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
			const { taskId, provider, company, workdayDomain, workdaySiteId } = req.body || {};
			
			if (!provider || !company) {
				res.status(400).json({ error: 'provider and company are required' });
				return;
			}
			
			const db = admin.firestore();
			const executionId = `manual_${Date.now()}`;
			const actualTaskId = taskId || `manual_${provider}_${company}_${Date.now()}`;
			
			const taskRef = db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION).doc(actualTaskId);
			
			const taskData: FetchTask = {
				taskId: actualTaskId,
				provider,
				company,
				workdayDomain,
				workdaySiteId,
				status: 'pending',
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				executionId,
				batchId: 'manual',
				retryCount: 0,
				maxRetries: QUEUE_CONSTANTS.MAX_RETRIES,
			};
			
			await taskRef.set(taskData);
			
			const result = await processTask(taskData, taskRef, db);
			
			res.status(200).json({
				success: result.success,
				taskId: actualTaskId,
				...result,
			});
			
		} catch (error: any) {
			console.error('[ProcessTaskManual] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);

// ============================================
// Retry failed tasks
// ============================================

export const retryFailedTasks = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 300,
		memory: '512MiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		
		try {
			const db = admin.firestore();
			
			// Find failed tasks that haven't exceeded max retries
			const failedTasks = await db.collection(QUEUE_CONSTANTS.TASKS_COLLECTION)
				.where('status', '==', 'failed')
				.limit(100)
				.get();
			
			let retried = 0;
			
			for (const doc of failedTasks.docs) {
				const task = doc.data() as FetchTask;
				
				if (task.retryCount < task.maxRetries) {
					await doc.ref.update({
						status: 'pending',
						error: null,
					});
					retried++;
				}
			}
			
			res.status(200).json({
				success: true,
				retriedTasks: retried,
				totalFailed: failedTasks.size,
			});
			
		} catch (error: any) {
			console.error('[RetryFailedTasks] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);





