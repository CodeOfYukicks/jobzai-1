/**
 * 🚀 Complete Job Pipeline - HTTP Function
 * 
 * Does EVERYTHING in one clean function:
 * 1. Fetches jobs from all 98 ATS sources
 * 2. Cleans HTML descriptions → Markdown
 * 3. Enriches with v2.2 tags (word boundaries, priority system)
 * 4. Writes to Firestore
 * 
 * Called by Cloud Scheduler daily
 * Can also be triggered manually via HTTP POST
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ATS_SOURCES } from './config';
import { fetchGreenhouse, fetchLever, fetchSmartRecruiters, fetchAshby } from './utils/atsFetchers';
import { cleanDescription } from './utils/cleanDescription';
import { NormalizedATSJob } from './types';

const REGION = 'us-central1';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extraction functions (v2.2 logic)
function extractExperienceLevel(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();

	if (/\b(lead|principal|staff engineer|architect|director|vp|head of|chief|cto|founding)\b/i.test(text)) return ['lead'];
	if (/\b(senior|sr\.|sr\s)\b/i.test(titleLower) || (/\b(senior|sr\.)\b/i.test(text) && /\b5\+\s*years?\b/i.test(text))) return ['senior'];
	if (/\b(mid|intermediate|confirmé|2-5 years)\b/i.test(text)) return ['mid'];
	if (/\b(entry|junior|jr\.|graduate|0-2 years)\b/i.test(text)) return ['entry'];
	if (/\b(intern|internship|stage)\b/i.test(titleLower) || (/\b(intern|internship)\b/i.test(text) && /\b(student|university)\b/i.test(text))) return ['internship'];
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

	// Remove internship if conflicts with seniority
	if (types.includes('internship') && (experienceLevel.includes('senior') || experienceLevel.includes('lead') || /\b(senior|lead|director)\b/i.test(titleLower))) {
		types = types.filter(t => t !== 'internship');
	}

	if (types.length === 0) types.push('full-time');
	return [...new Set(types)];
}

function extractWorkLocation(title: string, description: string, location: string): string[] {
	const text = `${title} ${description} ${location}`.toLowerCase();
	const locations: string[] = [];

	if (/\b(remote|work from home|wfh)\b/i.test(text)) locations.push('remote');
	if (/\bhybrid\b/i.test(text)) locations.push('hybrid');
	if (/\b(on.?site|office)\b/i.test(text) || location) locations.push('on-site');
	if (locations.length === 0) locations.push('on-site');
	
	return locations;
}

function extractIndustries(title: string, description: string, company: string): string[] {
	const text = `${title} ${description} ${company}`.toLowerCase();
	const industries: string[] = [];

	if (/\b(software|tech(?!nician)|saas|startup|developer)\b/i.test(text)) industries.push('tech');
	if (/\b(bank|finance|fintech|trading)\b/i.test(text)) industries.push('finance');
	if (/\b(health|medical|biotech)\b/i.test(text)) industries.push('healthcare');
	if (/\b(education|edtech)\b/i.test(text)) industries.push('education');
	
	return industries;
}

function extractTechnologies(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const technologies: string[] = [];
	
	const techs = ['python', 'javascript', 'typescript', 'react', 'vue', 'node.js', 'aws', 'azure', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'salesforce'];
	techs.forEach(tech => {
		if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) technologies.push(tech);
	});
	
	return technologies;
}

async function processCompany(provider: string, company: string, db: admin.firestore.Firestore): Promise<{ success: boolean; jobs: number }> {
	try {
		let jobs: NormalizedATSJob[] = [];

		if (provider === 'greenhouse') jobs = await fetchGreenhouse(company);
		else if (provider === 'lever') jobs = await fetchLever(company);
		else if (provider === 'smartrecruiters') jobs = await fetchSmartRecruiters(company);
		else if (provider === 'ashby') jobs = await fetchAshby(company);
		else if (provider === 'workday') return { success: true, jobs: 0 }; // Skip Workday

		if (jobs.length === 0) return { success: true, jobs: 0 };

		const batch = db.batch();
		let written = 0;

		for (const j of jobs) {
			const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
			const docId = cleanExternalId ? `${j.ats}_${cleanExternalId}` : `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

			const cleanedDesc = cleanDescription(j.description || '');
			const experienceLevels = extractExperienceLevel(j.title, cleanedDesc);
			const employmentTypes = extractEmploymentType(j.title, cleanedDesc, experienceLevels);
			const workLocations = extractWorkLocation(j.title, cleanedDesc, j.location);
			const industries = extractIndustries(j.title, cleanedDesc, j.company);
			const technologies = extractTechnologies(j.title, cleanedDesc);

			batch.set(db.collection('jobs').doc(docId), {
				title: j.title || '',
				company: j.company || '',
				companyLogo: j.companyLogo || null,
				location: j.location || '',
				description: cleanedDesc,
				skills: j.skills || [],
				applyUrl: j.applyUrl || '',
				ats: j.ats,
				externalId: j.externalId,
				postedAt: j.postedAt ? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) : admin.firestore.FieldValue.serverTimestamp(),
				employmentTypes,
				workLocations,
				experienceLevels,
				industries,
				technologies,
				type: employmentTypes[0] || 'full-time',
				remote: workLocations.includes('remote') ? 'remote' : 'on-site',
				seniority: experienceLevels[0] || 'mid',
				enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
				enrichedVersion: '2.2',
			}, { merge: true });
			written++;
		}

		await batch.commit();
		console.log(`✅ ${provider}/${company}: ${written} jobs`);
		return { success: true, jobs: written };
	} catch (error: any) {
		console.error(`❌ ${provider}/${company}: ${error.message}`);
		return { success: false, jobs: 0 };
	}
}

export const completeJobPipeline = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 1,
	timeoutSeconds: 3600,
	memory: '4GiB',
	invoker: 'public',
}, async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	try {
		const db = admin.firestore();
		const startTime = Date.now();

		console.log(`🚀 Starting complete job pipeline for ${ATS_SOURCES.length} sources`);

		let totalJobs = 0;
		let successCount = 0;

		// Process in batches of 5
		for (let i = 0; i < ATS_SOURCES.length; i += 5) {
			const batch = ATS_SOURCES.slice(i, i + 5);
			const results = await Promise.all(batch.map(s => processCompany(s.provider, s.company || '', db)));
			
			results.forEach(r => {
				if (r.success) {
					successCount++;
					totalJobs += r.jobs;
				}
			});

			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		const duration = Math.round((Date.now() - startTime) / 1000);

		console.log(`✅ Complete! ${successCount}/${ATS_SOURCES.length} sources, ${totalJobs} jobs, ${duration}s`);

		res.status(200).json({
			success: true,
			totalJobs,
			successCount,
			duration,
		});
	} catch (error: any) {
		console.error('❌ Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

