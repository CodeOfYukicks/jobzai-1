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

const REGION = 'us-central1';

// ============================================
// Tag Extraction Functions (v2.2)
// ============================================

function extractExperienceLevel(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();

	if (/\b(lead|principal|staff engineer|architect|director|vp|head of|chief|cto|founding)\b/i.test(text)) return ['lead'];
	if (/\b(senior|sr\.|sr\s)\b/i.test(titleLower) || (/\b(senior|sr\.)\b/i.test(text) && /\b5\+\s*years?\b/i.test(text))) return ['senior'];
	if (/\b(mid|intermediate|confirmé|2-5 years)\b/i.test(text)) return ['mid'];
	if (/\b(entry|junior|jr\.|graduate|0-2 years)\b/i.test(text)) return ['entry'];
	if (/\b(intern|internship|stage)\b/i.test(titleLower)) return ['internship'];
	return ['mid'];
}

function extractEmploymentType(title: string, description: string, experienceLevel: string[]): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();
	let types: string[] = [];

	if (/\b(full.?time|permanent|cdi)\b/i.test(text)) types.push('full-time');
	if (/\b(part.?time|parttime)\b/i.test(text)) types.push('part-time');
	if (/\b(contract|freelance|consultant)\b/i.test(text)) types.push('contract');
	if (/\b(intern|internship|stage)\b/i.test(text)) types.push('internship');

	if (types.includes('internship') && (experienceLevel.includes('senior') || experienceLevel.includes('lead') || /\b(senior|lead|director)\b/i.test(titleLower))) {
		types = types.filter(t => t !== 'internship');
	}

	if (types.length === 0) types.push('full-time');
	return [...new Set(types)];
}

function extractWorkLocation(title: string, description: string, location: string): string[] {
	const text = `${title} ${description} ${location}`.toLowerCase();
	const locations: string[] = [];

	if (/\b(remote|work from home|wfh|distributed|télétravail)\b/i.test(text)) locations.push('remote');
	if (/\bhybrid\b/i.test(text)) locations.push('hybrid');
	if (/\b(on.?site|office)\b/i.test(text) || (!locations.includes('remote') && location)) locations.push('on-site');
	if (locations.length === 0) locations.push('on-site');
	
	return locations;
}

function extractIndustries(title: string, description: string, company: string): string[] {
	const text = `${title} ${description} ${company}`.toLowerCase();
	const industries: string[] = [];

	if (/\b(software|tech(?!nician)|saas|startup|developer|engineer)\b/i.test(text)) industries.push('tech');
	if (/\b(bank|finance|fintech|trading|crypto)\b/i.test(text)) industries.push('finance');
	if (/\b(health|medical|biotech|pharma)\b/i.test(text)) industries.push('healthcare');
	if (/\b(education|edtech|learning)\b/i.test(text)) industries.push('education');
	if (/\b(ecommerce|e-commerce|retail)\b/i.test(text)) industries.push('ecommerce');
	if (/\b(media|entertainment|gaming)\b/i.test(text)) industries.push('media');
	
	return industries;
}

function extractTechnologies(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const technologies: string[] = [];
	
	const techs = [
		'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'c#',
		'react', 'vue', 'angular', 'node.js', 'django', 'flask', 'spring',
		'aws', 'azure', 'gcp', 'docker', 'kubernetes',
		'postgresql', 'mongodb', 'redis', 'elasticsearch',
		'graphql', 'rest', 'grpc',
	];
	
	techs.forEach(tech => {
		const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
			technologies.push(tech);
		}
	});
	
	return [...new Set(technologies)];
}

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
				
				// Extract tags
				const experienceLevels = extractExperienceLevel(j.title, cleanedDesc);
				const employmentTypes = extractEmploymentType(j.title, cleanedDesc, experienceLevels);
				const workLocations = extractWorkLocation(j.title, cleanedDesc, j.location);
				const industries = extractIndustries(j.title, cleanedDesc, j.company);
				const technologies = extractTechnologies(j.title, cleanedDesc);
				
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
					
					// Enriched tags (v2.2)
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
					enrichedVersion: '2.2',
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

