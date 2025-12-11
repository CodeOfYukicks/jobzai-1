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
import { 
    extractExperienceLevel, 
    extractEmploymentType, 
    extractWorkLocation,
    extractIndustryTags,
    extractTechnologyTags,
    JobDoc 
} from './utils/jobEnrichment';

const REGION = 'us-central1';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

async function processCompany(provider: string, company: string, db: admin.firestore.Firestore, workdayDomain?: string, workdaySiteId?: string): Promise<{ success: boolean; jobs: number }> {
	try {
		let jobs: NormalizedATSJob[] = [];

		if (provider === 'greenhouse') jobs = await fetchGreenhouse(company);
		else if (provider === 'lever') jobs = await fetchLever(company);
		else if (provider === 'smartrecruiters') jobs = await fetchSmartRecruiters(company);
		else if (provider === 'ashby') jobs = await fetchAshby(company);
		else if (provider === 'workday') {
			// Workday re-enabled with improved fetcher
			const { fetchWorkday } = require('./utils/atsFetchers');
			jobs = await fetchWorkday(company, workdayDomain || 'wd5', workdaySiteId);
		}

		if (jobs.length === 0) return { success: true, jobs: 0 };

		const batch = db.batch();
		let written = 0;

		for (const j of jobs) {
			const cleanExternalId = (j.externalId && typeof j.externalId === 'string') ? j.externalId.replace(/\//g, '_') : '';
			const docId = cleanExternalId ? `${j.ats}_${cleanExternalId}` : `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

		const cleanedDesc = cleanDescription(j.description || '');
		
		// Create a temporary JobDoc for enrichment functions
		const tempJob: JobDoc = {
			id: docId,
			title: j.title,
			description: cleanedDesc,
			location: j.location,
			company: j.company,
		};
		
		const experienceLevels = extractExperienceLevel(tempJob);
		const employmentTypes = extractEmploymentType(tempJob, experienceLevels);
		const workLocations = extractWorkLocation(tempJob);
		const industries = extractIndustryTags(tempJob);
		const technologies = extractTechnologyTags(tempJob);

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
			enrichedVersion: '4.1',
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
			const results = await Promise.all(batch.map(s => 
				processCompany(s.provider, s.company || '', db, s.workdayDomain, s.workdaySiteId)
			));
			
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

