/**
 * 🚀 Dynamic Batch Processor
 * 
 * Replaces the hardcoded fetchJobsBatch1-4.ts files with a dynamic system
 * that automatically distributes companies across batches based on provider
 * 
 * Features:
 * - Dynamic batch generation from companyLists.ts
 * - Parallel processing with configurable concurrency
 * - Per-provider statistics
 * - Automatic enrichment with v2.2 tags
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ATS_SOURCES, COMPANY_COUNTS } from './config';
import { 
	fetchGreenhouse, 
	fetchLever, 
	fetchSmartRecruiters, 
	fetchAshby, 
	fetchWorkday 
} from './utils/atsFetchers';
import { cleanDescription } from './utils/cleanDescription';
import { NormalizedATSJob, ATSProviderConfig } from './types';

const REGION = 'us-central1';

// ============================================
// Tag Extraction Functions (v2.2)
// ============================================

function extractExperienceLevel(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();

	if (/\b(lead|principal|staff engineer|architect|director|vp|head of|chief|cto|founding)\b/i.test(text)) return ['lead'];
	if (/\b(senior|sr\.|sr\s)\b/i.test(titleLower)) return ['senior'];
	if (/\b(mid|intermediate|confirmé)\b/i.test(text)) return ['mid'];
	if (/\b(entry|junior|jr\.|graduate)\b/i.test(text)) return ['entry'];
	if (/\b(intern|internship|stage)\b/i.test(titleLower)) return ['internship'];
	return ['mid'];
}

function extractEmploymentType(title: string, description: string, experienceLevel: string[]): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();
	let types: string[] = [];

	if (/\b(full.?time|permanent|cdi)\b/i.test(text)) types.push('full-time');
	if (/\b(part.?time)\b/i.test(text)) types.push('part-time');
	if (/\b(contract|freelance)\b/i.test(text)) types.push('contract');
	if (/\b(intern|internship|stage)\b/i.test(text)) types.push('internship');

	if (types.includes('internship') && (experienceLevel.includes('senior') || experienceLevel.includes('lead'))) {
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

function extractTechnologies(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const technologies: string[] = [];
	
	const techs = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'react', 'vue', 'angular', 'node.js', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'postgresql', 'mongodb'];
	techs.forEach(tech => {
		if (new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
			technologies.push(tech);
		}
	});
	
	return [...new Set(technologies)];
}

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

// ============================================
// Process a single company
// ============================================

async function processCompany(
	source: ATSProviderConfig,
	db: admin.firestore.Firestore
): Promise<{ provider: string; company: string; success: boolean; jobs: number; error?: string }> {
	const { provider, company, workdayDomain, workdaySiteId } = source;
	
	try {
		let jobs: NormalizedATSJob[] = [];

		switch (provider) {
			case 'greenhouse':
				jobs = await fetchGreenhouse(company || '');
				break;
			case 'lever':
				jobs = await fetchLever(company || '');
				break;
			case 'smartrecruiters':
				jobs = await fetchSmartRecruiters(company || '');
				break;
			case 'ashby':
				jobs = await fetchAshby(company || '');
				break;
			case 'workday':
				jobs = await fetchWorkday(company || '', workdayDomain || 'wd5', workdaySiteId);
				break;
		}

		if (jobs.length === 0) {
			return { provider, company: company || '', success: true, jobs: 0 };
		}

		// Write jobs in batches
		const BATCH_SIZE = 400;
		let written = 0;
		
		for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
			const chunk = jobs.slice(i, i + BATCH_SIZE);
			const batch = db.batch();

			for (const j of chunk) {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
					? j.externalId.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 200)
					: '';
				const docId = cleanExternalId
					? `${j.ats}_${cleanExternalId}`
					: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;

				const cleanedDesc = cleanDescription(j.description || '');
				const experienceLevels = extractExperienceLevel(j.title, cleanedDesc);
				const employmentTypes = extractEmploymentType(j.title, cleanedDesc, experienceLevels);
				const workLocations = extractWorkLocation(j.title, cleanedDesc, j.location);
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
					postedAt: j.postedAt
						? admin.firestore.Timestamp.fromDate(new Date(j.postedAt))
						: admin.firestore.FieldValue.serverTimestamp(),
					employmentTypes,
					workLocations,
					experienceLevels,
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
		}

		return { provider, company: company || '', success: true, jobs: written };
	} catch (error: any) {
		return { provider, company: company || '', success: false, jobs: 0, error: error.message };
	}
}

// ============================================
// Dynamic Batch Processor
// ============================================

export const processDynamicBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 5,
	timeoutSeconds: 3600, // 60 minutes
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
		const executionId = `dynamic_${Date.now()}`;

		// Optional filters from request body
		const { providers, batchIndex, batchSize: customBatchSize } = req.body || {};
		
		// Filter sources if specific providers requested
		let sources = ATS_SOURCES;
		if (providers && Array.isArray(providers)) {
			sources = sources.filter(s => providers.includes(s.provider));
		}

		// Support batch slicing for parallel execution
		const batchSize = customBatchSize || sources.length;
		const startIdx = (batchIndex || 0) * batchSize;
		const endIdx = Math.min(startIdx + batchSize, sources.length);
		sources = sources.slice(startIdx, endIdx);

		console.log(`🚀 [DynamicBatch] Starting execution=${executionId}`);
		console.log(`📊 [DynamicBatch] Processing ${sources.length} sources (batch ${batchIndex || 0})`);
		console.log(`📊 [DynamicBatch] Company counts:`, COMPANY_COUNTS);

		const results = {
			executionId,
			totalSources: sources.length,
			successful: 0,
			failed: 0,
			totalJobs: 0,
			byProvider: {} as Record<string, { sources: number; jobs: number; errors: number }>,
			errors: [] as Array<{ provider: string; company: string; error: string }>,
		};

		// Initialize provider stats
		const providerList = ['greenhouse', 'lever', 'smartrecruiters', 'ashby', 'workday'];
		providerList.forEach(p => {
			results.byProvider[p] = { sources: 0, jobs: 0, errors: 0 };
		});

		// Process in parallel chunks (5 companies at a time)
		const CONCURRENCY = 5;
		for (let i = 0; i < sources.length; i += CONCURRENCY) {
			const chunk = sources.slice(i, i + CONCURRENCY);
			
			const chunkResults = await Promise.all(
				chunk.map(source => processCompany(source, db))
			);

			for (const result of chunkResults) {
				if (result.success) {
					results.successful++;
					results.totalJobs += result.jobs;
					results.byProvider[result.provider].sources++;
					results.byProvider[result.provider].jobs += result.jobs;
				} else {
					results.failed++;
					results.byProvider[result.provider].errors++;
					if (result.error) {
						results.errors.push({
							provider: result.provider,
							company: result.company,
							error: result.error,
						});
					}
				}
			}

			// Log progress every 50 companies
			if ((i + CONCURRENCY) % 50 === 0 || i + CONCURRENCY >= sources.length) {
				console.log(`[DynamicBatch] Progress: ${Math.min(i + CONCURRENCY, sources.length)}/${sources.length} sources, ${results.totalJobs} jobs`);
			}

			// Small delay between chunks
			if (i + CONCURRENCY < sources.length) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		const duration = Math.round((Date.now() - startTime) / 1000);

		console.log(`✅ [DynamicBatch] Complete!`);
		console.log(`   Sources: ${results.successful}/${results.totalSources} successful`);
		console.log(`   Jobs: ${results.totalJobs} total`);
		console.log(`   Duration: ${duration}s`);

		// Store metrics
		await db.collection('dynamicBatchMetrics').doc(executionId).set({
			...results,
			duration,
			timestamp: admin.firestore.FieldValue.serverTimestamp(),
		});

		res.status(200).json({
			success: true,
			...results,
			duration,
		});

	} catch (error: any) {
		console.error('❌ [DynamicBatch] Error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// ============================================
// Provider-specific batch endpoints
// ============================================

export const processGreenhouseBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 3,
	timeoutSeconds: 1800,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	// Forward to dynamic batch with provider filter
	req.body = { ...req.body, providers: ['greenhouse'] };
	const { processDynamicBatch: handler } = require('./dynamicBatchProcessor');
	// Note: This is a simplified implementation - in production you'd call the actual handler
	res.redirect(307, `https://${REGION}-jobzai.cloudfunctions.net/processDynamicBatch`);
});

export const processLeverBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 3,
	timeoutSeconds: 900,
	memory: '1GiB',
	invoker: 'public',
}, async (req, res) => {
	req.body = { ...req.body, providers: ['lever'] };
	res.redirect(307, `https://${REGION}-jobzai.cloudfunctions.net/processDynamicBatch`);
});

export const processSmartRecruitersBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 3,
	timeoutSeconds: 1800,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	req.body = { ...req.body, providers: ['smartrecruiters'] };
	res.redirect(307, `https://${REGION}-jobzai.cloudfunctions.net/processDynamicBatch`);
});

export const processAshbyBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 3,
	timeoutSeconds: 900,
	memory: '1GiB',
	invoker: 'public',
}, async (req, res) => {
	req.body = { ...req.body, providers: ['ashby'] };
	res.redirect(307, `https://${REGION}-jobzai.cloudfunctions.net/processDynamicBatch`);
});

export const processWorkdayBatch = onRequest({
	region: REGION,
	cors: true,
	maxInstances: 3,
	timeoutSeconds: 1800,
	memory: '2GiB',
	invoker: 'public',
}, async (req, res) => {
	req.body = { ...req.body, providers: ['workday'] };
	res.redirect(307, `https://${REGION}-jobzai.cloudfunctions.net/processDynamicBatch`);
});




