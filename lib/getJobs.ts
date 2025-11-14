import { getAdminDb } from './firebase';
import type { Job } from '../types/job';

export async function getAllJobs(): Promise<Job[]> {
	const db = getAdminDb();
	// Prefer updatedAt, fallback to postedAt
	const col = db.collection('jobs');
	let snap = await col.orderBy('updatedAt', 'desc').limit(200).get().catch(() => null as any);
	if (!snap || snap.empty) {
		snap = await col.orderBy('postedAt', 'desc').limit(200).get();
	}
	const jobs: Job[] = snap.docs.map((d) => {
		const data = d.data() as any;
		return {
			id: d.id,
			ats: data.ats,
			title: data.title || '',
			company: data.company,
			companyLogo: data.companyLogo || undefined,
			location: data.location || '',
			description: data.description || '',
			applyUrl: data.applyUrl || '',
			updatedAt: data.updatedAt?.toDate?.() || undefined,
			postedAt: data.postedAt?.toDate?.() || undefined,
			skills: Array.isArray(data.skills) ? data.skills : [],
			raw: data.raw || undefined,
		};
	});
	return jobs;
}

type UserProfile = {
	role: string;
	skills: string[];
	targetCompanies: string[];
	targetRoles: string[];
};

function containsAny(hay: string, needles: string[]): boolean {
	const lower = hay.toLowerCase();
	return needles.some((n) => lower.includes(n.toLowerCase()));
}

export async function getMatchingJobs(user: UserProfile): Promise<Job[]> {
	const all = await getAllJobs();
	const skills = user.skills || [];
	const roles = user.targetRoles || [];
	const companies = user.targetCompanies || [];
	const roleStr = user.role || '';

	const matches = all.filter((job) => {
		const text = `${job.title} ${job.description}`.toLowerCase();
		const urlCompany = job.applyUrl?.toLowerCase?.() || '';
		const titleMatch = containsAny(job.title, roles);
		const descSkillMatch = containsAny(text, skills) || containsAny(text, [roleStr]);
		const companyMatch = containsAny(urlCompany, companies) || (job.company ? containsAny(job.company, companies) : false);
		return titleMatch || descSkillMatch || companyMatch;
	});
	return matches;
}


