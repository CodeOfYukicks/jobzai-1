/**
 * Enrich Skills Worker - Enriches job descriptions with AI-extracted skills
 * Processes jobs that don't have skills populated yet
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { extractSkillsWithLLM } from '../utils/embeddings';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

export const enrichSkillsWorker = onDocumentCreated(
	{
		document: 'skillEnrichmentTasks/{taskId}',
		region: REGION,
		timeoutSeconds: 60,
		memory: '512MiB',
		maxInstances: 50,
	},
	async (event) => {
		const db = admin.firestore();
		const taskData = event.data?.data();

		if (!taskData) {
			console.error('[ENRICH] No task data found');
			return;
		}

		const taskId = event.params.taskId;
		const { jobId, title, description } = taskData;

		if (!jobId || !title || !description) {
			console.error('[ENRICH] Missing required fields');
			return;
		}

		console.log(`[ENRICH] Processing task ${taskId} for job ${jobId}`);

		const taskRef = db.collection('skillEnrichmentTasks').doc(taskId);
		const jobRef = db.collection('jobs').doc(jobId);

		try {
			await taskRef.update({
				status: 'processing',
				startedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			const skills = await extractSkillsWithLLM(`${title}\n${description}`);

			console.log(`[ENRICH] Extracted ${skills.length} skills for job ${jobId}`);

			await jobRef.update({
				skills,
				enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await taskRef.update({
				status: 'completed',
				completedAt: admin.firestore.FieldValue.serverTimestamp(),
				skillsExtracted: skills.length,
			});

		} catch (error: any) {
			console.error(`[ENRICH] Error processing task ${taskId}:`, error);

			await taskRef.update({
				status: 'failed',
				completedAt: admin.firestore.FieldValue.serverTimestamp(),
				error: error.message,
			});
		}
	}
);
