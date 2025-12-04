/**
 * 🌐 Aggregator Fetcher Cloud Function
 * 
 * Fetches jobs from all job aggregators and stores them in Firestore
 * Runs on a schedule separate from ATS providers
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { fetchRemoteOK, fetchWeWorkRemotely, fetchAdzuna } from './jobAggregators';
import { cleanDescription } from '../utils/cleanDescription';
import { NormalizedATSJob } from '../types';

const REGION = 'us-central1';

// ============================================
// Tag Extraction (v2.2)
// ============================================

function extractExperienceLevel(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const titleLower = title.toLowerCase();

	if (/\b(lead|principal|staff|architect|director|vp|head of|chief|cto)\b/i.test(text)) return ['lead'];
	if (/\b(senior|sr\.)\b/i.test(titleLower)) return ['senior'];
	if (/\b(mid|intermediate)\b/i.test(text)) return ['mid'];
	if (/\b(entry|junior|jr\.)\b/i.test(text)) return ['entry'];
	if (/\b(intern|internship)\b/i.test(titleLower)) return ['internship'];
	return ['mid'];
}

function extractEmploymentType(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	let types: string[] = [];

	if (/\b(full.?time|permanent)\b/i.test(text)) types.push('full-time');
	if (/\b(part.?time)\b/i.test(text)) types.push('part-time');
	if (/\b(contract|freelance)\b/i.test(text)) types.push('contract');
	if (/\b(intern|internship)\b/i.test(text)) types.push('internship');

	if (types.length === 0) types.push('full-time');
	return types;
}

function extractTechnologies(title: string, description: string): string[] {
	const text = `${title} ${description}`.toLowerCase();
	const technologies: string[] = [];
	
	const techs = ['python', 'javascript', 'typescript', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'java'];
	techs.forEach(tech => {
		if (new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
			technologies.push(tech);
		}
	});
	
	return technologies;
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
// Process and store jobs
// ============================================

async function processAggregatorJobs(
	db: admin.firestore.Firestore,
	jobs: NormalizedATSJob[],
	source: string
): Promise<{ written: number; errors: number }> {
	let written = 0;
	let errors = 0;
	
	const BATCH_SIZE = 400;
	
	for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
		const chunk = jobs.slice(i, i + BATCH_SIZE);
		const batch = db.batch();
		
		for (const j of chunk) {
			try {
				const cleanExternalId = (j.externalId && typeof j.externalId === 'string')
					? j.externalId.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 200)
					: '';
				const docId = cleanExternalId
					? `${j.ats}_${cleanExternalId}`
					: `${j.ats}_${hashString([j.title, j.company, j.applyUrl].join('|'))}`;
				
				const ref = db.collection('jobs').doc(docId);
				const cleanedDesc = cleanDescription(j.description || '');
				const experienceLevels = extractExperienceLevel(j.title, cleanedDesc);
				const employmentTypes = extractEmploymentType(j.title, cleanedDesc);
				const technologies = extractTechnologies(j.title, cleanedDesc);
				
				batch.set(ref, {
					title: j.title || '',
					company: j.company || '',
					companyLogo: j.companyLogo || null,
					location: j.location || 'Remote',
					description: cleanedDesc,
					skills: j.skills || [],
					applyUrl: j.applyUrl || '',
					ats: j.ats,
					externalId: j.externalId,
					postedAt: j.postedAt
						? admin.firestore.Timestamp.fromDate(new Date(j.postedAt))
						: admin.firestore.FieldValue.serverTimestamp(),
					
					// Tags
					employmentTypes,
					workLocations: ['remote'],
					experienceLevels,
					technologies,
					
					// Legacy
					type: employmentTypes[0] || 'full-time',
					remote: 'remote',
					seniority: experienceLevels[0] || 'mid',
					
					// Metadata
					enrichedAt: admin.firestore.FieldValue.serverTimestamp(),
					enrichedVersion: '2.2',
					source,
				}, { merge: true });
				
				written++;
			} catch (e: any) {
				errors++;
			}
		}
		
		await batch.commit();
	}
	
	return { written, errors };
}

// ============================================
// Scheduled Aggregator Fetch
// ============================================

export const fetchFromAggregators = onSchedule(
	{
		region: REGION,
		schedule: 'every 12 hours',
		timeZone: 'UTC',
		retryCount: 1,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '1GiB',
	},
	async () => {
		const db = admin.firestore();
		const startTime = Date.now();
		const executionId = `aggregator_${Date.now()}`;
		
		console.log(`[Aggregators] Starting scheduled fetch: ${executionId}`);
		
		const results: Record<string, { fetched: number; written: number; errors: number }> = {};
		let totalWritten = 0;
		
		try {
			// 1. RemoteOK
			console.log('[Aggregators] Fetching RemoteOK...');
			const remoteOKJobs = await fetchRemoteOK();
			const remoteOKResult = await processAggregatorJobs(db, remoteOKJobs, 'remoteok');
			results.remoteOK = { fetched: remoteOKJobs.length, ...remoteOKResult };
			totalWritten += remoteOKResult.written;
			
			// 2. WeWorkRemotely
			console.log('[Aggregators] Fetching WeWorkRemotely...');
			const wwrJobs = await fetchWeWorkRemotely();
			const wwrResult = await processAggregatorJobs(db, wwrJobs, 'weworkremotely');
			results.weWorkRemotely = { fetched: wwrJobs.length, ...wwrResult };
			totalWritten += wwrResult.written;
			
			// 3. Adzuna (if API key is configured)
			try {
				const settingsDoc = await db.collection('settings').doc('adzuna').get();
				if (settingsDoc.exists) {
					const { appId, apiKey } = settingsDoc.data() || {};
					if (appId && apiKey) {
						console.log('[Aggregators] Fetching Adzuna...');
						const queries = ['software engineer', 'developer', 'product manager'];
						let adzunaTotal = 0;
						
						for (const query of queries) {
							const adzunaJobs = await fetchAdzuna({ appId, apiKey }, query);
							const adzunaResult = await processAggregatorJobs(db, adzunaJobs, 'adzuna');
							adzunaTotal += adzunaResult.written;
						}
						
						results.adzuna = { fetched: adzunaTotal, written: adzunaTotal, errors: 0 };
						totalWritten += adzunaTotal;
					}
				}
			} catch (e: any) {
				console.warn('[Aggregators] Adzuna not configured:', e.message);
			}
			
			const duration = Math.round((Date.now() - startTime) / 1000);
			
			// Store metrics
			await db.collection('aggregatorMetrics').doc(executionId).set({
				executionId,
				timestamp: admin.firestore.FieldValue.serverTimestamp(),
				duration,
				results,
				totalWritten,
			});
			
			console.log(`[Aggregators] ✅ Complete! ${totalWritten} jobs written in ${duration}s`);
			
		} catch (error: any) {
			console.error('[Aggregators] Error:', error);
			throw error;
		}
	}
);

/**
 * Manual aggregator fetch endpoint
 */
export const fetchAggregatorsManual = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '1GiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.set('Access-Control-Allow-Headers', 'Content-Type');

		if (req.method === 'OPTIONS') {
			res.status(204).send('');
			return;
		}

		try {
			const db = admin.firestore();
			const startTime = Date.now();
			
			const { sources } = req.body || {};
			const targetSources = sources || ['remoteok', 'weworkremotely'];
			
			const results: Record<string, any> = {};
			let totalWritten = 0;
			
			if (targetSources.includes('remoteok')) {
				const jobs = await fetchRemoteOK();
				const result = await processAggregatorJobs(db, jobs, 'remoteok');
				results.remoteOK = { fetched: jobs.length, ...result };
				totalWritten += result.written;
			}
			
			if (targetSources.includes('weworkremotely')) {
				const jobs = await fetchWeWorkRemotely();
				const result = await processAggregatorJobs(db, jobs, 'weworkremotely');
				results.weWorkRemotely = { fetched: jobs.length, ...result };
				totalWritten += result.written;
			}
			
			const duration = Math.round((Date.now() - startTime) / 1000);
			
			res.status(200).json({
				success: true,
				duration,
				results,
				totalWritten,
			});
			
		} catch (error: any) {
			console.error('[AggregatorsManual] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);



