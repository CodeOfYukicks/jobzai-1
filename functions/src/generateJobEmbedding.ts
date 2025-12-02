import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generateEmbedding, extractSkillsWithLLM } from './utils/embeddings';
import { JobDocument } from './types';

const REGION = 'us-central1';

/**
 * V5.0 - Enhanced job text builder for semantic matching
 */
interface ExtendedJobDocument extends JobDocument {
	technologies?: string[];
	industries?: string[];
	experienceLevels?: string[];
	workLocations?: string[];
	employmentTypes?: string[];
	roleFunction?: string;
	salaryRange?: string;
	seniority?: string;
	embedding?: number[];
	jobEmbeddingUpdatedAt?: string;
}

function buildJobTextV5(job: ExtendedJobDocument): string {
	const parts: string[] = [];
	
	// Title and company - most important
	parts.push(`Job Title: ${job.title || 'Unknown'}`);
	parts.push(`Company: ${job.company || 'Unknown'}`);
	
	// Role function if available
	if (job.roleFunction && job.roleFunction !== 'other') {
		parts.push(`Function: ${job.roleFunction}`);
	}
	
	// Seniority/Level
	if (job.seniority) {
		parts.push(`Level: ${job.seniority}`);
	}
	if (job.experienceLevels?.length) {
		parts.push(`Experience Required: ${job.experienceLevels.join(', ')}`);
	}
	
	// Location and work mode
	if (job.location) {
		parts.push(`Location: ${job.location}`);
	}
	if (job.workLocations?.length) {
		parts.push(`Work Mode: ${job.workLocations.join(', ')}`);
	}
	
	// Employment type
	if (job.employmentTypes?.length) {
		parts.push(`Type: ${job.employmentTypes.join(', ')}`);
	}
	
	// Technologies and skills
	if (job.technologies?.length) {
		parts.push(`Technologies: ${job.technologies.slice(0, 20).join(', ')}`);
	}
	if (job.skills?.length) {
		parts.push(`Skills Required: ${job.skills.slice(0, 15).join(', ')}`);
	}
	
	// Industries
	if (job.industries?.length) {
		parts.push(`Industries: ${job.industries.join(', ')}`);
	}
	
	// Salary if available
	if (job.salaryRange) {
		parts.push(`Salary: ${job.salaryRange}`);
	}
	
	// Description - truncated for embedding
	if (job.description) {
		const cleanDesc = job.description
			.replace(/<[^>]+>/g, ' ')  // Remove HTML tags
			.replace(/\s+/g, ' ')       // Normalize whitespace
			.trim()
			.slice(0, 3000);            // Limit length
		parts.push(`Description:\n${cleanDesc}`);
	}
	
	return parts.join('\n\n');
}

/**
 * Generate embedding when job is created
 */
export const generateJobEmbedding = onDocumentCreated(
	{
		region: REGION,
		document: 'jobs/{jobId}',
	},
	async (event) => {
		const snap = event.data;
		if (!snap) return;
		const ref = snap.ref;
		const job = snap.data() as ExtendedJobDocument;
		
		try {
			const updates: Record<string, any> = {};
			
			// Generate embedding if missing
			if (!job.embedding || !Array.isArray(job.embedding) || job.embedding.length === 0) {
				const text = buildJobTextV5(job);
				console.log('Generating embedding for new job', ref.id, 'text length:', text.length);
				
				const vec = await generateEmbedding(text);
				updates.embedding = vec;
				updates.jobEmbeddingUpdatedAt = new Date().toISOString();
			}
			
			// Enrich skills if absent or empty using LLM extractor
			if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) {
				const descText = `${job.title || ''}\n${job.description || ''}`;
				const skills = await extractSkillsWithLLM(descText);
				if (skills?.length) {
					updates.skills = skills;
				}
			}
			
			if (Object.keys(updates).length > 0) {
				await ref.set(updates, { merge: true });
				console.log('✅ Job enriched with embedding/skills:', ref.id);
			}
		} catch (e) {
			console.error('❌ Failed generating job embedding', ref.id, e);
		}
	}
);

/**
 * Re-generate embedding when job is enriched with new data
 * (e.g., when technologies or roleFunction are updated)
 */
export const updateJobEmbeddingOnEnrichment = onDocumentWritten(
	{
		region: REGION,
		document: 'jobs/{jobId}',
	},
	async (event) => {
		const before = event.data?.before?.data() as ExtendedJobDocument | undefined;
		const after = event.data?.after?.data() as ExtendedJobDocument | undefined;
		
		if (!after) return; // Document deleted
		if (!before) return; // Handled by onDocumentCreated
		
		const ref = event.data?.after?.ref;
		if (!ref) return;
		
		// Fields that should trigger embedding regeneration
		const enrichmentFields = ['technologies', 'industries', 'roleFunction', 'experienceLevels', 'skills'];
		const wasEnriched = enrichmentFields.some(field => {
			const beforeVal = before[field as keyof ExtendedJobDocument];
			const afterVal = after[field as keyof ExtendedJobDocument];
			// Check if field was added or significantly changed
			if (!beforeVal && afterVal) return true;
			if (Array.isArray(beforeVal) && Array.isArray(afterVal)) {
				return afterVal.length > beforeVal.length;
			}
			return false;
		});
		
		if (!wasEnriched) return;
		
		try {
			const text = buildJobTextV5(after);
			console.log('Re-generating embedding for enriched job', ref.id);
			
			const vec = await generateEmbedding(text);
			await ref.set({
				embedding: vec,
				jobEmbeddingUpdatedAt: new Date().toISOString()
			}, { merge: true });
			
			console.log('✅ Job embedding updated after enrichment:', ref.id);
		} catch (e) {
			console.error('❌ Failed updating job embedding', ref.id, e);
		}
	}
);


