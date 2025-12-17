import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { generateEmbedding } from './utils/embeddings';

const REGION = 'us-central1';

/**
 * V6.0 - Enhanced profile text builder for semantic matching
 * Creates a rich text representation of the user's professional profile
 * 
 * V6.0 ADDITIONS:
 * - Professional summary from CV import
 * - Client companies for consulting roles
 * - Full responsibilities text
 * - Achievements
 * - Education field
 * - Profile tags
 */
interface ExtendedUserProfile {
	// Personal
	firstName?: string;
	lastName?: string;
	headline?: string;
	
	// V6.0: Professional summary from CV
	professionalSummary?: string;
	
	// Professional
	targetPosition?: string;
	yearsOfExperience?: string | number;
	skills?: string[];
	tools?: string[];
	softSkills?: string[];
	certifications?: Array<{ name: string; issuer?: string; year?: string }>;
	
	// History - V6.0: Added client and achievements
	professionalHistory?: Array<{
		title: string;
		company: string;
		client?: string; // V6.0: Client for consulting roles
		industry?: string;
		responsibilities?: string[];
		achievements?: string[]; // V6.0: Achievements
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
	productType?: string[]; // V6.0: B2B, B2C preferences
	functionalDomain?: string[]; // V6.0: Frontend, Backend, etc.
	
	// Languages
	languages?: Array<{ language: string; level: string }>;
	
	// Education - V6.0
	educationLevel?: string;
	educationField?: string;
	educations?: Array<{
		degree: string;
		field: string;
		institution: string;
	}>;
	
	// V6.0: Profile tags from CV import
	profileTags?: string[];
	
	// Existing fields
	embedding?: number[];
	profileEmbeddingUpdatedAt?: any;
}

/**
 * V6.0 - Build rich text representation for embedding generation
 * Includes professional summary, client companies, full responsibilities, and more
 */
function buildProfileTextV6(u: ExtendedUserProfile): string {
	const parts: string[] = [];
	
	// V6.0: Professional summary (most important for semantic matching)
	if (u.professionalSummary) {
		parts.push(`Summary: ${u.professionalSummary}`);
	}
	
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
	
	// Professional history - V6.0: Enhanced with clients and achievements
	if (u.professionalHistory?.length) {
		const historyText = u.professionalHistory.slice(0, 6).map(exp => {
			const expParts: string[] = [];
			
			// Title and company
			let positionLine = `${exp.title} at ${exp.company}`;
			// V6.0: Include client for consulting roles
			if (exp.client) {
				positionLine += ` (Client: ${exp.client})`;
			}
			expParts.push(positionLine);
			
			// Industry
			if (exp.industry) {
				expParts.push(`Industry: ${exp.industry}`);
			}
			
			// V6.0: Include more responsibilities for better semantic matching
			if (exp.responsibilities?.length) {
				const respText = exp.responsibilities.slice(0, 5).join('; ');
				expParts.push(`Responsibilities: ${respText}`);
			}
			
			// V6.0: Include achievements
			if (exp.achievements?.length) {
				const achievText = exp.achievements.slice(0, 3).join('; ');
				expParts.push(`Achievements: ${achievText}`);
			}
			
			return expParts.join('\n');
		}).join('\n\n');
		parts.push(`Work Experience:\n${historyText}`);
	}
	
	// Technical skills and tools
	const allTechnicalSkills = [
		...(u.tools || []), // Tools first (more technical)
		...(u.skills || [])
	];
	if (allTechnicalSkills.length) {
		parts.push(`Technical Skills: ${allTechnicalSkills.slice(0, 25).join(', ')}`);
	}
	
	// Soft skills
	if (u.softSkills?.length) {
		parts.push(`Soft Skills: ${u.softSkills.slice(0, 10).join(', ')}`);
	}
	
	// V6.0: Certifications with issuer for better context
	if (u.certifications?.length) {
		const certText = u.certifications.slice(0, 8).map(c => {
			let cert = c.name;
			if (c.issuer) cert += ` (${c.issuer})`;
			return cert;
		}).join(', ');
		parts.push(`Certifications: ${certText}`);
	}
	
	// V6.0: Education with field
	if (u.educations?.length) {
		const eduText = u.educations.slice(0, 3).map(e => 
			`${e.degree} in ${e.field} from ${e.institution}`
		).join('; ');
		parts.push(`Education: ${eduText}`);
	} else if (u.educationLevel || u.educationField) {
		const eduParts = [u.educationLevel, u.educationField].filter(Boolean);
		if (eduParts.length) {
			parts.push(`Education: ${eduParts.join(' in ')}`);
		}
	}
	
	// Target sectors/industries
	if (u.targetSectors?.length) {
		parts.push(`Target Industries: ${u.targetSectors.join(', ')}`);
	}
	
	// V6.0: Functional domain preferences
	if (u.functionalDomain?.length) {
		parts.push(`Domain Expertise: ${u.functionalDomain.join(', ')}`);
	}
	
	// V6.0: Product type preferences
	if (u.productType?.length) {
		parts.push(`Product Focus: ${u.productType.join(', ')}`);
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
	
	// V6.0: Profile tags (AI-generated summary)
	if (u.profileTags?.length) {
		parts.push(`Profile Keywords: ${u.profileTags.slice(0, 15).join(', ')}`);
	}
	
	return parts.join('\n\n');
}

/**
 * V6.0 - Fields to watch for embedding regeneration
 * Added: professionalSummary, educations, educationField, functionalDomain, productType, profileTags
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
	'headline',
	// V6.0 new fields
	'professionalSummary',
	'educations',
	'educationField',
	'functionalDomain',
	'productType',
	'profileTags',
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
			after.targetPosition ||
			after.professionalSummary; // V6.0: Summary is also sufficient
		
		if (!hasMinimumData) {
			console.log('Skipping embedding for user', ref.id, '- insufficient profile data');
			return;
		}

		try {
			// V6.0: Use enhanced profile text builder
			const text = buildProfileTextV6(after);
			console.log('🎯 V6.0 Generating embedding for user', ref.id, 'text length:', text.length);
			
			const vec = await generateEmbedding(text);
			
			await ref.set({ 
				embedding: vec,
				profileEmbeddingUpdatedAt: new Date().toISOString()
			}, { merge: true });
			
			console.log('✅ V6.0 User embedding generated for', ref.id);
		} catch (e) {
			console.error('❌ Failed generating user embedding', ref.id, e);
		}
	}
);


