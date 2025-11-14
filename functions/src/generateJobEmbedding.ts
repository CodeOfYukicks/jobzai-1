import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { generateEmbedding, extractSkillsWithLLM } from './utils/embeddings';
import { JobDocument } from './types';

const REGION = 'us-central1';

export const generateJobEmbedding = onDocumentCreated(
	{
		region: REGION,
		document: 'jobs/{jobId}',
	},
	async (event) => {
		const snap = event.data;
		if (!snap) return;
		const ref = snap.ref;
		const job = snap.data() as JobDocument;
		const text = `${job.title || ''}\n${job.company || ''}\n${job.location || ''}\n${job.description || ''}`;
		try {
			// Generate embedding if missing
			if (!job.embedding || !Array.isArray(job.embedding) || job.embedding.length === 0) {
				const vec = await generateEmbedding(text);
				await ref.set({ embedding: vec }, { merge: true });
			}
			// Enrich skills if absent or empty using LLM extractor
			if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) {
				const skills = await extractSkillsWithLLM(text);
				if (skills?.length) {
					await ref.set({ skills }, { merge: true });
				}
			}
		} catch (e) {
			console.error('Failed generating job embedding', ref.id, e);
		}
	}
);


