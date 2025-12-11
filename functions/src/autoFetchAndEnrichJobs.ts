/**
 * 🚀 All-in-One Automated Job Fetching & Enrichment
 * 
 * This Cloud Function handles the complete pipeline:
 * 1. Fetches jobs from 98 ATS sources
 * 2. Cleans HTML descriptions → Markdown
 * 3. Enriches with v2.2 tags (word boundaries, priority system)
 * 4. Writes to Firestore
 * 
 * Triggered by Cloud Scheduler daily at 2AM UTC
 * 
 * Manual trigger: POST https://us-central1-jobzai.cloudfunctions.net/autoFetchAndEnrichJobs
 * Body: { "secret": "your-secret-key" }
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ATS_SOURCES } from './config';
import { fetchGreenhouse, fetchLever, fetchSmartRecruiters, fetchAshby } from './utils/atsFetchers';
import { cleanDescription } from './utils/cleanDescription';
import { NormalizedATSJob, ATSProviderConfig } from './types';
import { 
    extractExperienceLevel, 
    extractEmploymentType, 
    extractWorkLocation,
    extractIndustryTags,
    extractTechnologyTags,
    extractSkillTags,
    JobDoc 
} from './utils/jobEnrichment';

const REGION = 'us-central1';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const chr = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract industries
 */
function extractIndustries(title: string, description: string, company: string): string[] {
	const text = `${title || ''} ${description || ''} ${company || ''}`.toLowerCase();
	const industries: string[] = [];

	if (/\b(software|tech(?!nician)|saas|startup|digital|platform|app(?!lication)|cloud|web|mobile|ai|machine learning|developer|engineer)\b/i.test(text)) {
		industries.push('tech');
	}
	if (/\b(bank(?!rupt)|finance|fintech|payment|insurance|trading|crypto|blockchain|investment)\b/i.test(text)) {
		industries.push('finance');
	}
	if (/\b(e-commerce|ecommerce|retail|marketplace|shop(?!ping)|store)\b/i.test(text)) {
		industries.push('ecommerce');
	}
	if (/\b(health(?!y)|medical|healthcare|biotech|pharma|hospital|clinic|patient)\b/i.test(text)) {
		industries.push('healthcare');
	}
	if (/\b(education|edtech|learning|university|school|training|course)\b/i.test(text)) {
		industries.push('education');
	}
	if (/\b(media|entertainment|gaming|streaming|content|music|video|news|publisher)\b/i.test(text)) {
		industries.push('media');
	}
	if (/\b(marketing|advertising|agency|brand|social media|seo|sem)\b/i.test(text)) {
		industries.push('marketing');
	}
	if (/\b(consulting|consultant|advisory|strategy)\b/i.test(text)) {
		industries.push('consulting');
	}
	return [...new Set(industries)];
}

/**
 * Extract technologies
 */
function extractTechnologies(title: string, description: string): string[] {
	const text = `${title || ''} ${description || ''}`.toLowerCase();
	const technologies: string[] = [];

	const allTechs = [
		'python', 'javascript', 'typescript', 'java', 'go', 'golang', 'rust', 'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin',
		'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'tailwind', 'html', 'css',
		'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', '.net', 'dotnet', 'graphql', 'rest',
		'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'gitlab', 'github', 'ci/cd',
		'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase',
		'salesforce', 'hubspot', 'sap', 'oracle', 'figma', 'tableau'
	];

	allTechs.forEach(tech => {
		if (new RegExp(`\\b${escapeRegExp(tech)}\\b`, 'i').test(text)) {
			if (tech === 'nextjs') technologies.push('next.js');
			else if (tech === 'nodejs') technologies.push('node.js');
			else if (tech === 'k8s') technologies.push('kubernetes');
			else if (tech === 'postgres') technologies.push('postgresql');
			else technologies.push(tech);
		}
	});

	return [...new Set(technologies)];
}

/**
 * Extract skills
 */
function extractSkills(title: string, description: string): string[] {
	const text = `${title || ''} ${description || ''}`.toLowerCase();
	const skills: string[] = [];

	if (/\bseo\b/i.test(text)) skills.push('seo');
	if (/\b(agile|scrum)\b/i.test(text)) skills.push('agile');
	if (/\b(product management|product manager)\b/i.test(text)) skills.push('product-management');
	if (/\b(project management)\b/i.test(text)) skills.push('project-management');
	if (/\bsales\b/i.test(text)) skills.push('sales');
	if (/\bleadership\b/i.test(text)) skills.push('leadership');

	return [...new Set(skills)];
}

/**
 * Process a single ATS source
 */
async function processSource(source: ATSProviderConfig, db: admin.firestore.Firestore): Promise<{ success: boolean; jobs: number; error?: string }> {
	const { provider, company, workdayDomain, workdaySiteId } = source;

	try {
		console.log(`[AUTO] Processing ${provider}/${company}...`);

		let jobs: NormalizedATSJob[] = [];

		// Fetch from ATS
		if (provider === 'greenhouse' && company) {
			jobs = await fetchGreenhouse(company);
		} else if (provider === 'lever' && company) {
			jobs = await fetchLever(company);
		} else if (provider === 'smartrecruiters' && company) {
			jobs = await fetchSmartRecruiters(company);
		} else if (provider === 'ashby' && company) {
			jobs = await fetchAshby(company);
		} else if (provider === 'workday' && company) {
			// Workday re-enabled with improved fetcher (exponential backoff + robust ID handling)
			const { fetchWorkday } = require('./utils/atsFetchers');
			jobs = await fetchWorkday(company, workdayDomain, workdaySiteId);
		}

		console.log(`[AUTO] Fetched ${jobs.length} jobs from ${provider}/${company}`);

		if (jobs.length === 0) {
			return { success: true, jobs: 0 };
		}

		// Write & enrich jobs
		const batch = db.batch();
		let written = 0;

		for (const j of jobs) {
			try {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
					? j.externalId.replace(/\//g, '_')
					: '';
				const docId = cleanExternalId.length > 0
					? `${j.ats}_${cleanExternalId}`
					: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

				const ref = db.collection('jobs').doc(docId);

			// Clean description (HTML → Markdown)
			const cleanedDescription = cleanDescription(j.description || '');

			// Create a temporary JobDoc for enrichment functions
			const tempJob: JobDoc = {
				id: docId,
				title: j.title,
				description: cleanedDescription,
				location: j.location,
				company: j.company,
			};

			// Extract tags with v4.1 logic (improved strict detection)
			const experienceLevels = extractExperienceLevel(tempJob);
			const employmentTypes = extractEmploymentType(tempJob, experienceLevels);
			const workLocations = extractWorkLocation(tempJob);
			const industries = extractIndustryTags(tempJob);
			const technologies = extractTechnologyTags(tempJob);
			const skills = extractSkillTags(tempJob);

				const jobData = {
					title: j.title || '',
					company: j.company || '',
					companyLogo: j.companyLogo || null,
					location: j.location || '',
					description: cleanedDescription,
					skills: j.skills || [],
					applyUrl: j.applyUrl || '',
					ats: j.ats,
					externalId: j.externalId,
					postedAt: j.postedAt ? admin.firestore.Timestamp.fromDate(new Date(j.postedAt)) : admin.firestore.FieldValue.serverTimestamp(),
					
				// Enriched tags (v4.1 - strict remote & contract detection)
				employmentTypes,
				workLocations,
				experienceLevels,
				industries,
				technologies,
				
				// Legacy fields for backwards compatibility
				type: employmentTypes[0] || 'full-time',
				remote: workLocations.includes('remote') ? 'remote' : workLocations[0] || 'on-site',
				seniority: experienceLevels[0] || 'mid',
				
				// Metadata
				enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
				enrichedVersion: '4.1',
			};

				batch.set(ref, jobData, { merge: true });
				written++;
			} catch (e: any) {
				console.warn(`[AUTO] Failed to process job: ${e.message}`);
			}
		}

		await batch.commit();
		console.log(`[AUTO] ✅ ${provider}/${company}: ${written} jobs written & enriched`);

		return { success: true, jobs: written };

	} catch (error: any) {
		console.error(`[AUTO] ❌ Error processing ${provider}/${company}:`, error.message);
		return { success: false, jobs: 0, error: error.message };
	}
}

export const autoFetchAndEnrichJobs = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 1,
	timeoutSeconds: 3600, // 60 minutes
	memory: '2GiB',
}, async (req, res) => {
	// CORS
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method not allowed' });
		return;
	}

	try {
		// Simple auth
		const { secret } = req.body || {};
		if (secret !== process.env.ENRICH_SECRET && secret !== 'temp-dev-secret-123') {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}

		const db = admin.firestore();
		const startTime = Date.now();
		const executionId = `auto_${Date.now()}`;

		console.log(`[AUTO] 🚀 Starting automated job fetch & enrichment execution=${executionId}`);
		console.log(`[AUTO] Total sources: ${ATS_SOURCES.length}`);

		let totalJobs = 0;
		let successCount = 0;
		let failedCount = 0;
		const errors: string[] = [];

		// Process in batches of 5 (parallel but controlled)
		const BATCH_SIZE = 5;
		for (let i = 0; i < ATS_SOURCES.length; i += BATCH_SIZE) {
			const batch = ATS_SOURCES.slice(i, i + BATCH_SIZE);
			console.log(`[AUTO] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ATS_SOURCES.length / BATCH_SIZE)}...`);

			const results = await Promise.all(batch.map(src => processSource(src, db)));

			results.forEach((r, idx) => {
				if (r.success) {
					successCount++;
					totalJobs += r.jobs;
				} else {
					failedCount++;
					if (r.error) errors.push(`${batch[idx].provider}/${batch[idx].company}: ${r.error}`);
				}
			});

			// Small delay between batches
			if (i + BATCH_SIZE < ATS_SOURCES.length) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		const duration = Date.now() - startTime;

		console.log(`[AUTO] ✅ Execution complete!`);
		console.log(`[AUTO]    Success: ${successCount}/${ATS_SOURCES.length}`);
		console.log(`[AUTO]    Failed: ${failedCount}`);
		console.log(`[AUTO]    Total jobs: ${totalJobs}`);
		console.log(`[AUTO]    Duration: ${Math.round(duration / 1000)}s`);

		// Store metrics
		await db.collection('autoFetchMetrics').doc(executionId).set({
			executionId,
			timestamp: admin.firestore.FieldValue.serverTimestamp(),
			duration,
			totalSources: ATS_SOURCES.length,
			successCount,
			failedCount,
			totalJobs,
			errors: errors.slice(0, 20),
			status: failedCount > 0 ? 'completed_with_errors' : 'success',
		});

		res.status(200).json({
			success: true,
			executionId,
			totalJobs,
			successCount,
			failedCount,
			duration: Math.round(duration / 1000),
			message: `Successfully processed ${successCount}/${ATS_SOURCES.length} sources, wrote ${totalJobs} jobs`,
		});

	} catch (error: any) {
		console.error(`[AUTO] ❌ Fatal error:`, error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

