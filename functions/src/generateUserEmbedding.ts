import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generateEmbedding } from './utils/embeddings';

const REGION = 'us-central1';

/**
 * V5.0 - Enhanced profile text builder for semantic matching
 * Creates a rich text representation of the user's professional profile
 */
interface ExtendedUserProfile {
	// Personal
	firstName?: string;
	lastName?: string;
	headline?: string;
	
	// Professional
	targetPosition?: string;
	yearsOfExperience?: string | number;
	skills?: string[];
	tools?: string[];
	softSkills?: string[];
	certifications?: Array<{ name: string; issuer?: string }>;
	
	// History
	professionalHistory?: Array<{
		title: string;
		company: string;
		industry?: string;
		responsibilities?: string[];
	}>;
	
	// Location
	city?: string;
	country?: string;
	workPreference?: string;
	
	// Objectives
	targetSectors?: string[];
	careerPriorities?: string[];
	primaryMotivator?: string;
	preferredEnvironment?: string[];
	
	// Languages
	languages?: Array<{ language: string; level: string }>;
	
	// Existing fields
	embedding?: number[];
	profileEmbeddingUpdatedAt?: any;
}

function buildProfileTextV5(u: ExtendedUserProfile): string {
	const parts: string[] = [];
	
	// Professional headline/target
	if (u.headline) {
		parts.push(`Professional: ${u.headline}`);
	}
	if (u.targetPosition) {
		parts.push(`Target Role: ${u.targetPosition}`);
	}
	
	// Experience summary
	if (u.yearsOfExperience) {
		parts.push(`Experience: ${u.yearsOfExperience} years`);
	}
	
	// Professional history - most important for semantic matching
	if (u.professionalHistory?.length) {
		const historyText = u.professionalHistory.slice(0, 5).map(exp => {
			const expParts = [`${exp.title} at ${exp.company}`];
			if (exp.industry) expParts.push(`(${exp.industry})`);
			if (exp.responsibilities?.length) {
				expParts.push(`- ${exp.responsibilities.slice(0, 3).join('; ')}`);
			}
			return expParts.join(' ');
		}).join('\n');
		parts.push(`Experience:\n${historyText}`);
	}
	
	// Technical skills and tools
	const allTechnicalSkills = [
		...(u.skills || []),
		...(u.tools || [])
	];
	if (allTechnicalSkills.length) {
		parts.push(`Technical Skills: ${allTechnicalSkills.slice(0, 20).join(', ')}`);
	}
	
	// Soft skills
	if (u.softSkills?.length) {
		parts.push(`Soft Skills: ${u.softSkills.slice(0, 10).join(', ')}`);
	}
	
	// Certifications
	if (u.certifications?.length) {
		const certNames = u.certifications.map(c => c.name).slice(0, 5);
		parts.push(`Certifications: ${certNames.join(', ')}`);
	}
	
	// Target sectors/industries
	if (u.targetSectors?.length) {
		parts.push(`Target Industries: ${u.targetSectors.join(', ')}`);
	}
	
	// Career priorities and preferences
	if (u.careerPriorities?.length) {
		parts.push(`Career Priorities: ${u.careerPriorities.join(', ')}`);
	}
	if (u.primaryMotivator) {
		parts.push(`Primary Motivator: ${u.primaryMotivator}`);
	}
	if (u.preferredEnvironment?.length) {
		parts.push(`Preferred Environment: ${u.preferredEnvironment.join(', ')}`);
	}
	
	// Location preferences
	if (u.city || u.country) {
		parts.push(`Location: ${[u.city, u.country].filter(Boolean).join(', ')}`);
	}
	if (u.workPreference) {
		parts.push(`Work Mode: ${u.workPreference}`);
	}
	
	// Languages
	if (u.languages?.length) {
		const langs = u.languages.map(l => `${l.language} (${l.level})`).join(', ');
		parts.push(`Languages: ${langs}`);
	}
	
	return parts.join('\n\n');
}

/**
 * Fields to watch for embedding regeneration
 */
const EMBEDDING_TRIGGER_FIELDS = [
	'targetPosition',
	'skills',
	'tools',
	'softSkills',
	'professionalHistory',
	'yearsOfExperience',
	'targetSectors',
	'careerPriorities',
	'primaryMotivator',
	'preferredEnvironment',
	'certifications',
	'headline'
];

export const generateUserEmbedding = onDocumentWritten(
	{
		region: REGION,
		document: 'users/{userId}',
	},
	async (event) => {
		const before = event.data?.before?.data() as ExtendedUserProfile | undefined;
		const after = event.data?.after?.data() as ExtendedUserProfile | undefined;
		if (!after) return;
		const ref = event.data?.after?.ref;
		if (!ref) return;

		// Check if relevant fields changed
		const changed = !before || EMBEDDING_TRIGGER_FIELDS.some((k) => 
			JSON.stringify(before[k as keyof ExtendedUserProfile]) !== 
			JSON.stringify(after[k as keyof ExtendedUserProfile])
		);

		// Skip if no change and embedding exists
		if (!changed && after.embedding && after.embedding.length > 0) {
			return;
		}

		// Only generate if profile has enough data
		const hasMinimumData = 
			(after.skills?.length || 0) > 0 ||
			(after.tools?.length || 0) > 0 ||
			(after.professionalHistory?.length || 0) > 0 ||
			after.targetPosition;
		
		if (!hasMinimumData) {
			console.log('Skipping embedding for user', ref.id, '- insufficient profile data');
			return;
		}

		try {
			const text = buildProfileTextV5(after);
			console.log('Generating embedding for user', ref.id, 'text length:', text.length);
			
			const vec = await generateEmbedding(text);
			
			await ref.set({ 
				embedding: vec,
				profileEmbeddingUpdatedAt: new Date().toISOString()
			}, { merge: true });
			
			console.log('✅ User embedding generated for', ref.id);
		} catch (e) {
			console.error('❌ Failed generating user embedding', ref.id, e);
		}
	}
);


