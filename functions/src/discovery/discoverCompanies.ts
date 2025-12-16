/**
 * 🔍 Company Discovery System
 * 
 * Automatically discovers new companies using ATS providers:
 * - Greenhouse: Scrapes sitemap at boards.greenhouse.io
 * - Ashby: Discovers via known patterns
 * - Lever: Discovers via known patterns
 * 
 * Discovered companies are stored in Firestore for review and activation
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';

const REGION = 'us-central1';

// ============================================
// Discovery Functions
// ============================================

/**
 * Discover Greenhouse companies from their public API
 * Note: Greenhouse doesn't have a public sitemap, but we can check known company slugs
 */
async function discoverGreenhouseCompanies(): Promise<string[]> {
	const discovered: string[] = [];
	
	// Known tech company prefixes and patterns
	const potentialSlugs = [
		// YC Companies (verified active on Greenhouse)
		'airbnb', 'stripe', 'coinbase', 'instacart', 'doordash', 'reddit',
		'dropbox', 'twitch', 'gitlab', 'gusto', 'brex', 'segment',
		'flexport', 'rappi', 'faire', 'webflow', 'loom', 'gong',
		'lattice', 'deel', 'ramp', 'mercury', 'notion',
		
		// Additional tech companies
		'robinhood', 'chime', 'plaid', 'affirm', 'klarna', 'revolut',
		'monzo', 'n26', 'wise', 'bolt', 'wolt', 'getir',
		'deliveroo', 'glovo', 'rappi', 'ifood', 'swiggy', 'zomato',
		
		// AI companies
		'anthropic', 'openai', 'cohere', 'stability', 'runway', 'jasper',
		'scale', 'weights-and-biases', 'huggingface', 'replicate',
		
		// Developer tools
		'vercel', 'netlify', 'render', 'railway', 'fly', 'supabase',
		'planetscale', 'neon', 'prisma', 'hasura', 'postman', 'datadog',
		
		// European companies
		'spotify', 'adyen', 'messagebird', 'mollie', 'personio',
		'contentful', 'celonis', 'mambu', 'solarisbank',
	];
	
	// Check each slug to see if it has an active Greenhouse board
	for (const slug of potentialSlugs) {
		try {
			const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
			const response = await fetch(url, { method: 'HEAD' });
			
			if (response.ok) {
				discovered.push(slug);
			}
			
			// Small delay to avoid rate limiting
			await new Promise(resolve => setTimeout(resolve, 100));
		} catch (e) {
			// Company doesn't have a Greenhouse board
		}
	}
	
	console.log(`[Discovery][Greenhouse] Found ${discovered.length} companies`);
	return discovered;
}

/**
 * Discover Ashby companies via known patterns
 */
async function discoverAshbyCompanies(): Promise<string[]> {
	const discovered: string[] = [];
	
	// Known Ashby companies (YC and tech startups)
	const potentialSlugs = [
		'notion', 'linear', 'zapier', 'replit', 'ramp', 'deel', 'vercel',
		'temporal', 'mistral', 'huggingface', 'mercury', 'perplexity',
		'modal', 'cursor', 'railway', 'render', 'fly', 'supabase',
		'planetscale', 'neon', 'prisma', 'hasura', 'grafbase',
		'warp', 'fig', 'raycast', 'arc', 'superhuman', 'linear',
		'pitch', 'coda', 'airtable', 'fibery', 'height', 'shortcut',
		'brex', 'ramp', 'mercury', 'airwallex', 'jeeves', 'tribal',
		'wiz', 'orca', 'snyk', 'lacework', 'aqua', 'sysdig',
		'gong', 'chorus', 'clari', 'outreach', 'salesloft', 'apollo',
		'intercom', 'front', 'missive', 'crisp', 'drift', 'qualified',
	];
	
	// Check each slug
	for (const slug of potentialSlugs) {
		try {
			const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
			const response = await fetch(url, { method: 'HEAD' });
			
			if (response.ok) {
				discovered.push(slug);
			}
			
			await new Promise(resolve => setTimeout(resolve, 100));
		} catch (e) {
			// Company doesn't have an Ashby board
		}
	}
	
	console.log(`[Discovery][Ashby] Found ${discovered.length} companies`);
	return discovered;
}

/**
 * Discover Lever companies via known patterns
 */
async function discoverLeverCompanies(): Promise<string[]> {
	const discovered: string[] = [];
	
	const potentialSlugs = [
		'metabase', 'anduril', 'snyk', 'figma', 'notion', 'linear',
		'loom', 'descript', 'pitch', 'coda', 'airtable', 'monday',
		'clickup', 'asana', 'todoist', 'things', 'omnifocus',
		'plaid', 'stripe', 'square', 'robinhood', 'coinbase', 'kraken',
		'gemini', 'crypto', 'blockchain', 'consensys',
		'shopify', 'bigcommerce', 'magento', 'woocommerce',
		'vercel', 'netlify', 'render', 'railway', 'fly', 'heroku',
		'openai', 'anthropic', 'cohere', 'scale', 'huggingface',
		'tempus', 'flatiron', 'veracyte', 'guardant', 'color', 'invitae',
	];
	
	for (const slug of potentialSlugs) {
		try {
			const url = `https://api.lever.co/v0/postings/${slug}`;
			const response = await fetch(url, { method: 'HEAD' });
			
			if (response.ok) {
				discovered.push(slug);
			}
			
			await new Promise(resolve => setTimeout(resolve, 100));
		} catch (e) {
			// Company doesn't have a Lever board
		}
	}
	
	console.log(`[Discovery][Lever] Found ${discovered.length} companies`);
	return discovered;
}

/**
 * Store discovered companies in Firestore
 */
async function storeDiscoveredCompanies(
	db: admin.firestore.Firestore,
	provider: string,
	companies: string[]
): Promise<{ new: number; existing: number }> {
	let newCount = 0;
	let existingCount = 0;
	
	const batch = db.batch();
	
	for (const company of companies) {
		const docId = `${provider}_${company}`;
		const ref = db.collection('discoveredCompanies').doc(docId);
		
		const existing = await ref.get();
		
		if (existing.exists) {
			existingCount++;
			// Update last seen
			batch.update(ref, {
				lastSeen: admin.firestore.FieldValue.serverTimestamp(),
			});
		} else {
			newCount++;
			batch.set(ref, {
				provider,
				company,
				status: 'pending', // pending, active, inactive, rejected
				discoveredAt: admin.firestore.FieldValue.serverTimestamp(),
				lastSeen: admin.firestore.FieldValue.serverTimestamp(),
				addedToConfig: false,
			});
		}
	}
	
	await batch.commit();
	
	return { new: newCount, existing: existingCount };
}

// ============================================
// Cloud Functions
// ============================================

/**
 * Scheduled discovery - runs weekly
 */
export const scheduledDiscovery = onSchedule(
	{
		region: REGION,
		schedule: 'every monday 00:00',
		timeZone: 'UTC',
		retryCount: 1,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '512MiB',
	},
	async () => {
		const db = admin.firestore();
		const startTime = Date.now();
		
		console.log('[Discovery] Starting scheduled discovery...');
		
		try {
			// Discover from each provider
			const [greenhouse, ashby, lever] = await Promise.all([
				discoverGreenhouseCompanies(),
				discoverAshbyCompanies(),
				discoverLeverCompanies(),
			]);
			
			// Store results
			const [ghResult, ashbyResult, leverResult] = await Promise.all([
				storeDiscoveredCompanies(db, 'greenhouse', greenhouse),
				storeDiscoveredCompanies(db, 'ashby', ashby),
				storeDiscoveredCompanies(db, 'lever', lever),
			]);
			
			const duration = Math.round((Date.now() - startTime) / 1000);
			
			// Store discovery metrics
			await db.collection('discoveryMetrics').doc(`discovery_${Date.now()}`).set({
				timestamp: admin.firestore.FieldValue.serverTimestamp(),
				duration,
				greenhouse: { found: greenhouse.length, ...ghResult },
				ashby: { found: ashby.length, ...ashbyResult },
				lever: { found: lever.length, ...leverResult },
				total: {
					found: greenhouse.length + ashby.length + lever.length,
					new: ghResult.new + ashbyResult.new + leverResult.new,
				},
			});
			
			console.log(`[Discovery] ✅ Complete! Duration: ${duration}s`);
			console.log(`[Discovery] Found: GH=${greenhouse.length}, Ashby=${ashby.length}, Lever=${lever.length}`);
			console.log(`[Discovery] New: GH=${ghResult.new}, Ashby=${ashbyResult.new}, Lever=${leverResult.new}`);
			
		} catch (error: any) {
			console.error('[Discovery] Error:', error);
			throw error;
		}
	}
);

/**
 * Manual discovery endpoint
 */
export const manualDiscovery = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 540,
		memory: '512MiB',
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
			
			const { providers } = req.body || {};
			const targetProviders = providers || ['greenhouse', 'ashby', 'lever'];
			
			console.log(`[Discovery] Manual discovery for: ${targetProviders.join(', ')}`);
			
			const results: Record<string, any> = {};
			
			if (targetProviders.includes('greenhouse')) {
				const companies = await discoverGreenhouseCompanies();
				results.greenhouse = {
					found: companies.length,
					...await storeDiscoveredCompanies(db, 'greenhouse', companies),
				};
			}
			
			if (targetProviders.includes('ashby')) {
				const companies = await discoverAshbyCompanies();
				results.ashby = {
					found: companies.length,
					...await storeDiscoveredCompanies(db, 'ashby', companies),
				};
			}
			
			if (targetProviders.includes('lever')) {
				const companies = await discoverLeverCompanies();
				results.lever = {
					found: companies.length,
					...await storeDiscoveredCompanies(db, 'lever', companies),
				};
			}
			
			const duration = Math.round((Date.now() - startTime) / 1000);
			
			res.status(200).json({
				success: true,
				duration,
				results,
			});
			
		} catch (error: any) {
			console.error('[Discovery] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);

/**
 * Get discovered companies
 */
export const getDiscoveredCompanies = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 5,
		timeoutSeconds: 30,
		memory: '256MiB',
		invoker: 'public',
	},
	async (req, res) => {
		res.set('Access-Control-Allow-Origin', '*');
		
		try {
			const db = admin.firestore();
			const { provider, status, limit: queryLimit } = req.query;
			
			let query: admin.firestore.Query = db.collection('discoveredCompanies');
			
			if (provider) {
				query = query.where('provider', '==', provider);
			}
			
			if (status) {
				query = query.where('status', '==', status);
			}
			
			query = query.orderBy('discoveredAt', 'desc').limit(Number(queryLimit) || 100);
			
			const snapshot = await query.get();
			const companies = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}));
			
			// Get counts by status
			const counts = {
				pending: 0,
				active: 0,
				inactive: 0,
				rejected: 0,
			};
			
			for (const status of Object.keys(counts)) {
				const countQuery = await db.collection('discoveredCompanies')
					.where('status', '==', status)
					.count()
					.get();
				counts[status as keyof typeof counts] = countQuery.data().count;
			}
			
			res.status(200).json({
				success: true,
				companies,
				counts,
				total: snapshot.size,
			});
			
		} catch (error: any) {
			console.error('[GetDiscoveredCompanies] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);

/**
 * Activate a discovered company (add to config)
 */
export const activateDiscoveredCompany = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 5,
		timeoutSeconds: 30,
		memory: '256MiB',
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
			const { provider, company, status } = req.body || {};
			
			if (!provider || !company) {
				res.status(400).json({ error: 'provider and company are required' });
				return;
			}
			
			const db = admin.firestore();
			const docId = `${provider}_${company}`;
			const ref = db.collection('discoveredCompanies').doc(docId);
			
			await ref.update({
				status: status || 'active',
				addedToConfig: status === 'active',
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			
			res.status(200).json({
				success: true,
				message: `Company ${company} status updated to ${status || 'active'}`,
			});
			
		} catch (error: any) {
			console.error('[ActivateCompany] Error:', error);
			res.status(500).json({ success: false, error: error.message });
		}
	}
);










