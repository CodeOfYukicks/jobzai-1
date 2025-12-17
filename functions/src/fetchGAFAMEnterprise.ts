/**
 * 🏢 GAFAM + Enterprise Job Fetcher
 * 
 * Manual HTTP endpoint to fetch jobs from:
 * - GAFAM: Google, Meta, Amazon, Apple, Microsoft
 * - Enterprise Tech: Salesforce, SAP, Oracle
 * - Enterprise Consulting: Accenture, Deloitte, Capgemini
 */

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { NormalizedATSJob } from './types';
import {
	fetchGoogleCareers,
	fetchMetaCareers,
	fetchAmazonJobs,
	fetchAppleJobs,
	fetchMicrosoftJobs,
	fetchSalesforceJobs,
	fetchSAPJobs,
	fetchOracleJobs,
	fetchAccentureJobs,
	fetchDeloitteJobs,
	fetchCapgeminiJobs,
} from './utils/gafamFetchers';

const REGION = 'us-central1';

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

/**
 * Manual HTTP endpoint to fetch GAFAM + Enterprise jobs
 * 
 * Usage:
 * POST https://us-central1-jobzai.cloudfunctions.net/fetchGAFAMEnterprise
 * Body: { "sources": ["google", "salesforce", "accenture"] }
 * 
 * Or call with no body to fetch from default sources
 */
export const fetchGAFAMEnterprise = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 540, // 9 minutes
		memory: '2GiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
		res.set('Access-Control-Allow-Headers', 'Content-Type');

		if (req.method === 'OPTIONS') {
			res.status(204).send('');
			return;
		}

		try {
			const db = admin.firestore();
			const startTime = Date.now();

			// Requested sources (default: key sources)
			const { sources } = req.body || {};
			const targetSources: string[] = sources || [
				'google', 'amazon', 'microsoft', 
				'salesforce', 'accenture', 'capgemini'
			];

			console.log(`[GAFAM+Enterprise] Starting fetch for sources: ${targetSources.join(', ')}`);

			const results: Record<string, { fetched: number; written: number; error?: string }> = {};
			let totalWritten = 0;

			// Fetch each source
			for (const source of targetSources) {
				try {
					let jobs: NormalizedATSJob[] = [];

					switch (source) {
						case 'google':
							jobs = await fetchGoogleCareers();
							break;
						case 'meta':
							jobs = await fetchMetaCareers();
							break;
						case 'amazon':
							jobs = await fetchAmazonJobs();
							break;
						case 'apple':
							jobs = await fetchAppleJobs();
							break;
						case 'microsoft':
							jobs = await fetchMicrosoftJobs();
							break;
						case 'salesforce':
							jobs = await fetchSalesforceJobs();
							break;
						case 'accenture':
							jobs = await fetchAccentureJobs();
							break;
						case 'deloitte':
							jobs = await fetchDeloitteJobs();
							break;
						case 'capgemini':
							jobs = await fetchCapgeminiJobs();
							break;
						case 'sap':
							jobs = await fetchSAPJobs();
							break;
						case 'oracle':
							jobs = await fetchOracleJobs();
							break;
						default:
							console.warn(`[GAFAM+Enterprise] Unknown source: ${source}`);
							results[source] = { fetched: 0, written: 0, error: 'Unknown source' };
							continue;
					}

					console.log(`[GAFAM+Enterprise] Fetched ${jobs.length} jobs from ${source}`);

					// Write to Firestore
					let written = 0;
					const batch = db.bulkWriter();

					for (const job of jobs) {
						try {
							const cleanExternalId = (job.externalId && typeof job.externalId === 'string')
								? job.externalId.replace(/[\/\\.#$\[\]]/g, '_')
								: '';
							const docId = cleanExternalId.length > 0
								? `${job.ats}_${cleanExternalId}`
								: `${job.ats}_${hashString([job.title, job.company, job.applyUrl].join('|'))}`;

							const ref = db.collection('jobs').doc(docId);
							
							// Normalize for Firestore
							const postedAt = job.postedAt 
								? admin.firestore.Timestamp.fromDate(new Date(job.postedAt))
								: admin.firestore.FieldValue.serverTimestamp();
							
							batch.set(ref, {
								title: job.title || '',
								company: job.company || '',
								companyLogo: job.companyLogo || null,
								location: job.location || '',
								description: job.description || '',
								skills: job.skills || [],
								applyUrl: job.applyUrl || '',
								ats: job.ats,
								externalId: job.externalId,
								postedAt,
							}, { merge: true });
							written++;
						} catch (e: any) {
							console.warn(`[GAFAM+Enterprise] Failed to queue job: ${e.message}`);
						}
					}

					await batch.close();
					totalWritten += written;
					results[source] = { fetched: jobs.length, written };
					console.log(`[GAFAM+Enterprise] Written ${written} jobs from ${source}`);

				} catch (e: any) {
					console.error(`[GAFAM+Enterprise] Error fetching ${source}:`, e.message);
					results[source] = { fetched: 0, written: 0, error: e.message };
				}
			}

			const duration = Date.now() - startTime;
			console.log(`[GAFAM+Enterprise] Completed in ${duration}ms. Total written: ${totalWritten}`);

			res.status(200).json({
				success: true,
				duration,
				totalWritten,
				results,
			});

		} catch (error: any) {
			console.error('[GAFAM+Enterprise] Fatal error:', error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	}
);
