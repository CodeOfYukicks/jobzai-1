/**
 * 🌐 Job Aggregators
 * 
 * Fetches jobs from job aggregator APIs:
 * - RemoteOK: Remote jobs only (~2K jobs)
 * - WeWorkRemotely: Remote jobs (~1K jobs)
 * - Adzuna: Global job aggregator (requires API key)
 * - HN Who's Hiring: Tech jobs from Hacker News
 * 
 * These sources provide high-quality curated jobs
 * with good remote/tech focus
 */

import { NormalizedATSJob } from '../types';
import { normalizeATSJob } from '../utils/normalize';

// ============================================
// Helper Functions
// ============================================

async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: {
			'User-Agent': 'JobzAI Job Aggregator',
			'Accept': 'application/json',
			...init?.headers,
		},
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`HTTP ${res.status} for ${url} → ${text.slice(0, 200)}`);
	}
	return res.json() as Promise<T>;
}

function clearbitLogo(domain: string): string {
	// Clean the domain
	const cleaned = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
	return `https://logo.clearbit.com/${cleaned}`;
}

function extractDomain(url: string): string {
	try {
		const parsed = new URL(url);
		return parsed.hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

// ============================================
// REMOTEOK
// https://remoteok.com/api
// Free API, no key required
// ============================================

export async function fetchRemoteOK(): Promise<NormalizedATSJob[]> {
	const url = 'https://remoteok.com/api';
	
	try {
		const json = await fetchJson<any[]>(url);
		
		// First element is metadata, skip it
		const jobs = json.slice(1).filter((j: any) => j.id && j.position);
		
		const list = jobs.map((j: any) => {
			const companyDomain = extractDomain(j.url || j.apply_url || '');
			
			return normalizeATSJob(
				{
					title: j.position,
					description: j.description || '',
					companyName: j.company || 'Unknown Company',
					companyLogo: j.company_logo || (companyDomain ? clearbitLogo(companyDomain) : null),
					location: j.location || 'Remote',
					applyUrl: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.id}`,
					postedAt: j.date ? new Date(j.date * 1000).toISOString() : new Date().toISOString(),
					externalId: `remoteok_${j.id}`,
				},
				"remoteok"
			);
		});
		
		console.log(`[Aggregator][RemoteOK] Fetched ${list.length} jobs`);
		return list;
	} catch (e: any) {
		console.error(`[Aggregator][RemoteOK] Error:`, e.message);
		return [];
	}
}

// ============================================
// WEWORKREMOTELY
// https://weworkremotely.com/api/listings.json
// Free API
// ============================================

export async function fetchWeWorkRemotely(): Promise<NormalizedATSJob[]> {
	const categories = [
		'programming',
		'design',
		'devops-sysadmin',
		'management-finance',
		'product',
		'customer-support',
		'sales-marketing',
	];
	
	const allJobs: NormalizedATSJob[] = [];
	
	for (const category of categories) {
		try {
			const url = `https://weworkremotely.com/categories/${category}/jobs.json`;
			const json = await fetchJson<{ jobs: any[] }>(url);
			const jobs = json.jobs || [];
			
			const list = jobs.map((j: any) => {
				const companyDomain = extractDomain(j.url || '');
				
				return normalizeATSJob(
					{
						title: j.title,
						description: j.description || '',
						companyName: j.company?.name || j.company_name || 'Unknown Company',
						companyLogo: j.company?.logo || (companyDomain ? clearbitLogo(companyDomain) : null),
						location: 'Remote',
						applyUrl: j.url || `https://weworkremotely.com${j.path}`,
						postedAt: j.published_at || j.created_at || new Date().toISOString(),
						externalId: `wwr_${j.id || j.slug}`,
					},
					"remoteok" // Use same ATS type for consistency
				);
			});
			
			allJobs.push(...list);
			
			// Small delay between categories
			await new Promise(resolve => setTimeout(resolve, 200));
		} catch (e: any) {
			console.warn(`[Aggregator][WeWorkRemotely] Error fetching ${category}:`, e.message);
		}
	}
	
	console.log(`[Aggregator][WeWorkRemotely] Fetched ${allJobs.length} jobs`);
	return allJobs;
}

// ============================================
// ADZUNA
// https://developer.adzuna.com/
// Requires API key (free tier: 250 requests/day)
// ============================================

interface AdzunaConfig {
	appId: string;
	apiKey: string;
	country?: string; // Default: 'us'
}

export async function fetchAdzuna(config: AdzunaConfig, query?: string): Promise<NormalizedATSJob[]> {
	const { appId, apiKey, country = 'us' } = config;
	const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;
	
	const params = new URLSearchParams({
		app_id: appId,
		app_key: apiKey,
		results_per_page: '50',
		what: query || 'software engineer',
		what_or: 'developer programmer engineer',
		sort_by: 'date',
	});
	
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Fetch multiple pages
		for (let page = 1; page <= 5; page++) { // Max 250 jobs (5 pages x 50)
			const url = `${baseUrl.replace('/1', `/${page}`)}?${params}`;
			const json = await fetchJson<{ results: any[] }>(url);
			const jobs = json.results || [];
			
			if (jobs.length === 0) break;
			
			const list = jobs.map((j: any) => {
				const companyDomain = extractDomain(j.redirect_url || '');
				
				return normalizeATSJob(
					{
						title: j.title,
						description: j.description || '',
						companyName: j.company?.display_name || 'Unknown Company',
						companyLogo: companyDomain ? clearbitLogo(companyDomain) : null,
						location: j.location?.display_name || j.location?.area?.[0] || '',
						applyUrl: j.redirect_url,
						postedAt: j.created || new Date().toISOString(),
						externalId: `adzuna_${j.id}`,
					},
					"adzuna"
				);
			});
			
			allJobs.push(...list);
			
			// Rate limit: 1 request per second
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		
		console.log(`[Aggregator][Adzuna] Fetched ${allJobs.length} jobs for query="${query || 'default'}"`);
		return allJobs;
	} catch (e: any) {
		console.error(`[Aggregator][Adzuna] Error:`, e.message);
		return [];
	}
}

// ============================================
// GITHUB JOBS (via workaround)
// GitHub Jobs API is deprecated, using alternative
// ============================================

export async function fetchGitHubJobs(): Promise<NormalizedATSJob[]> {
	// GitHub Jobs API is deprecated since 2021
	// Alternative: scrape jobs.github.com or use another aggregator
	console.log(`[Aggregator][GitHubJobs] API deprecated, skipping`);
	return [];
}

// ============================================
// AUTHENTIC JOBS
// https://authenticjobs.com/api/
// Focused on designers and developers
// ============================================

export async function fetchAuthenticJobs(apiKey?: string): Promise<NormalizedATSJob[]> {
	if (!apiKey) {
		console.log(`[Aggregator][AuthenticJobs] No API key provided, skipping`);
		return [];
	}
	
	const url = `https://authenticjobs.com/api/?api_key=${apiKey}&method=aj.jobs.search&format=json`;
	
	try {
		const json = await fetchJson<{ listings: { listing: any[] } }>(url);
		const jobs = json.listings?.listing || [];
		
		const list = jobs.map((j: any) => {
			const companyDomain = extractDomain(j.apply_url || j.url || '');
			
			return normalizeATSJob(
				{
					title: j.title,
					description: j.description || '',
					companyName: j.company?.name || 'Unknown Company',
					companyLogo: companyDomain ? clearbitLogo(companyDomain) : null,
					location: j.company?.location?.name || '',
					applyUrl: j.apply_url || j.url,
					postedAt: j.post_date || new Date().toISOString(),
					externalId: `authentic_${j.id}`,
				},
				"remoteok" // Generic aggregator type
			);
		});
		
		console.log(`[Aggregator][AuthenticJobs] Fetched ${list.length} jobs`);
		return list;
	} catch (e: any) {
		console.error(`[Aggregator][AuthenticJobs] Error:`, e.message);
		return [];
	}
}

// ============================================
// Aggregator Orchestrator
// Fetches from all available aggregators
// ============================================

export interface AggregatorConfig {
	remoteOK?: boolean;
	weWorkRemotely?: boolean;
	adzuna?: AdzunaConfig;
	authenticJobs?: string; // API key
}

export async function fetchAllAggregators(config: AggregatorConfig = {}): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	const results: Record<string, number> = {};
	
	// RemoteOK (default enabled)
	if (config.remoteOK !== false) {
		const jobs = await fetchRemoteOK();
		allJobs.push(...jobs);
		results.remoteOK = jobs.length;
	}
	
	// WeWorkRemotely (default enabled)
	if (config.weWorkRemotely !== false) {
		const jobs = await fetchWeWorkRemotely();
		allJobs.push(...jobs);
		results.weWorkRemotely = jobs.length;
	}
	
	// Adzuna (requires config)
	if (config.adzuna) {
		const queries = ['software engineer', 'developer', 'product manager', 'designer'];
		for (const query of queries) {
			const jobs = await fetchAdzuna(config.adzuna, query);
			allJobs.push(...jobs);
			results[`adzuna_${query.replace(/\s+/g, '_')}`] = jobs.length;
		}
	}
	
	// Authentic Jobs (requires API key)
	if (config.authenticJobs) {
		const jobs = await fetchAuthenticJobs(config.authenticJobs);
		allJobs.push(...jobs);
		results.authenticJobs = jobs.length;
	}
	
	console.log(`[Aggregators] Total jobs fetched: ${allJobs.length}`, results);
	return allJobs;
}

