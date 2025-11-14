import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { UserProfile } from './types';
import { generateEmbedding } from './utils/embeddings';

const REGION = 'us-central1';

function buildProfileText(u: UserProfile): string {
	const parts: string[] = [];
	if (u.name) parts.push(u.name);
	if (u.currentRole) parts.push(`Role: ${u.currentRole}`);
	if (u.location) parts.push(`Location: ${u.location}`);
	if (typeof u.yearsExperience === 'number') parts.push(`Experience: ${u.yearsExperience} years`);
	if (u.skills?.length) parts.push(`Skills: ${u.skills.join(', ')}`);
	if (u.preferences) {
		const prefs: string[] = [];
		prefs.push(`Remote: ${u.preferences.remote ? 'yes' : 'no'}`);
		if (u.preferences.seniority?.length) prefs.push(`Seniority: ${u.preferences.seniority.join(', ')}`);
		if (u.preferences.domains?.length) prefs.push(`Domains: ${u.preferences.domains.join(', ')}`);
		parts.push(`Preferences: ${prefs.join(' | ')}`);
	}
	return parts.join('\n');
}

export const generateUserEmbedding = onDocumentWritten(
	{
		region: REGION,
		document: 'users/{userId}',
	},
	async (event) => {
		const before = event.data?.before?.data() as UserProfile | undefined;
		const after = event.data?.after?.data() as UserProfile | undefined;
		if (!after) return;
		const ref = event.data?.after?.ref;
		if (!ref) return;

		const fieldsToWatch: (keyof UserProfile)[] = ['currentRole', 'skills', 'yearsExperience', 'location', 'preferences'];
		const changed = !before || fieldsToWatch.some((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));

		if (!changed && after.embedding && after.embedding.length) {
			return;
		}

		try {
			const text = buildProfileText(after);
			const vec = await generateEmbedding(text);
			await ref.set({ embedding: vec }, { merge: true });
		} catch (e) {
			console.error('Failed generating user embedding', ref.id, e);
		}
	}
);


