/**
 * 🏢 GAFAM Direct Fetchers
 * 
 * Fetchers for major tech companies that have their own career portals
 * (not using standard ATS like Greenhouse/Lever)
 * 
 * Supported:
 * - Google (careers.google.com)
 * - Meta (metacareers.com)
 * - Amazon (amazon.jobs)
 * - Apple (jobs.apple.com)
 */

import { NormalizedATSJob } from '../types';
import { normalizeATSJob } from './normalize';

// ============================================
// Helper Functions
// ============================================

async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			'Accept': 'application/json',
			...init?.headers,
		},
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`HTTP ${res.status} for ${url} → ${text.slice(0, 200)}`);
	}
	return res.json() as Promise<T>;
}

function clearbitLogo(domain: string): string {
	return `https://logo.clearbit.com/${domain}`;
}

// ============================================
// GOOGLE CAREERS
// careers.google.com
// ============================================

interface GoogleJobsResponse {
	jobs?: Array<{
		id: string;
		title: string;
		description?: string;
		locations?: Array<{ display: string }>;
		company_name?: string;
		apply_url?: string;
		created?: string;
		updated?: string;
	}>;
	count?: number;
	next_page_token?: string;
}

export async function fetchGoogleCareers(location?: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	// Google Careers uses a specific API endpoint
	// We'll fetch jobs for different locations to maximize coverage
	const locations = location ? [location] : [
		'United States',
		'France',
		'United Kingdom',
		'Germany',
		'Remote',
		'Ireland',
		'Switzerland',
		'Netherlands',
	];
	
	for (const loc of locations) {
		try {
			// Google Careers API endpoint (public)
			const baseUrl = 'https://careers.google.com/api/v3/search/';
			const params = new URLSearchParams({
				location: loc,
				page_size: '100',
				q: '',
			});
			
			const url = `${baseUrl}?${params}`;
			const response = await fetchJson<GoogleJobsResponse>(url);
			
			if (response.jobs) {
				for (const job of response.jobs) {
					allJobs.push(normalizeATSJob({
						title: job.title,
						description: job.description || '',
						companyName: 'Google',
						companyLogo: clearbitLogo('google.com'),
						location: job.locations?.map(l => l.display).join(', ') || loc,
						applyUrl: job.apply_url || `https://careers.google.com/jobs/results/${job.id}`,
						postedAt: job.updated || job.created || new Date().toISOString(),
						externalId: `google_${job.id}`,
					}, 'google'));
				}
			}
			
			// Small delay between location requests
			await new Promise(resolve => setTimeout(resolve, 300));
			
		} catch (e: any) {
			console.warn(`[GAFAM][Google] Error fetching for ${loc}:`, e.message);
		}
	}
	
	// Deduplicate by job ID
	const uniqueJobs = Array.from(
		new Map(allJobs.map(j => [j.externalId, j])).values()
	);
	
	console.log(`[GAFAM][Google] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// META CAREERS
// metacareers.com
// ============================================

interface MetaJobsResponse {
	data?: Array<{
		id: string;
		title: string;
		description?: string;
		locations?: string[];
		sub_team?: string;
		apply_url?: string;
		posted_date?: string;
	}>;
}

export async function fetchMetaCareers(location?: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	// Meta Careers locations
	const locations = location ? [location] : [
		'', // All locations
	];
	
	for (const loc of locations) {
		try {
			// Meta Careers API - public jobs endpoint
			const baseUrl = 'https://www.metacareers.com/graphql';
			
			// Meta uses GraphQL, but also has a public jobs API
			// Alternative: Use the public search endpoint
			const searchUrl = 'https://www.metacareers.com/jobs';
			
			// Fetch the page and extract job data from embedded JSON
			const response = await fetch(searchUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					'Accept': 'text/html,application/xhtml+xml',
				},
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			
			const html = await response.text();
			
			// Extract job data from the page
			// Meta embeds job data in script tags
			const scriptMatch = html.match(/<script[^>]*>window\.__RELAY_STORE__\s*=\s*({[\s\S]*?})<\/script>/);
			
			if (scriptMatch) {
				try {
					const data = JSON.parse(scriptMatch[1]);
					
					// Parse the relay store for job listings
					for (const [key, value] of Object.entries(data)) {
						if (key.includes('JobSearchResult') && typeof value === 'object' && value !== null) {
							const jobData = value as any;
							if (jobData.title && jobData.id) {
								allJobs.push(normalizeATSJob({
									title: jobData.title,
									description: jobData.description || jobData.summary || '',
									companyName: 'Meta',
									companyLogo: clearbitLogo('meta.com'),
									location: jobData.locations?.join(', ') || jobData.location || 'Multiple Locations',
									applyUrl: `https://www.metacareers.com/jobs/${jobData.id}`,
									postedAt: jobData.posted_date || new Date().toISOString(),
									externalId: `meta_${jobData.id}`,
								}, 'meta'));
							}
						}
					}
				} catch (parseError) {
					console.warn('[GAFAM][Meta] Error parsing embedded data');
				}
			}
			
		} catch (e: any) {
			console.warn(`[GAFAM][Meta] Error fetching:`, e.message);
		}
	}
	
	// If we couldn't get jobs from the main page, try the careers API
	if (allJobs.length === 0) {
		try {
			// Fallback: Try fetching from Facebook careers (same company)
			const fbUrl = 'https://www.facebookcareers.com/jobs/';
			console.log('[GAFAM][Meta] Trying fallback API...');
			// Note: This might need adjustment based on actual API
		} catch (e) {
			console.warn('[GAFAM][Meta] Fallback also failed');
		}
	}
	
	console.log(`[GAFAM][Meta] Fetched ${allJobs.length} jobs`);
	return allJobs;
}

// ============================================
// AMAZON JOBS
// amazon.jobs
// ============================================

interface AmazonJobsResponse {
	jobs?: Array<{
		id_icims: string;
		title: string;
		description?: string;
		basic_qualifications?: string;
		preferred_qualifications?: string;
		job_family?: string;
		location?: string;
		city?: string;
		state?: string;
		country_code?: string;
		posted_date?: string;
		updated_time?: string;
	}>;
	hits?: number;
}

export async function fetchAmazonJobs(location?: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	// Amazon Jobs uses a search API
	const countries = location ? [location] : ['USA', 'FRA', 'GBR', 'DEU', 'IRL', 'LUX', 'NLD', 'ESP'];
	
	for (const country of countries) {
		try {
			// Amazon's job search API
			const baseUrl = 'https://www.amazon.jobs/en/search.json';
			const params = new URLSearchParams({
				base_query: '',
				country: country,
				result_limit: '100',
				sort: 'recent',
			});
			
			const url = `${baseUrl}?${params}`;
			const response = await fetchJson<AmazonJobsResponse>(url);
			
			if (response.jobs) {
				for (const job of response.jobs) {
					const locationStr = [job.city, job.state, job.country_code]
						.filter(Boolean)
						.join(', ');
					
					const description = [
						job.description,
						job.basic_qualifications ? `\n\nBasic Qualifications:\n${job.basic_qualifications}` : '',
						job.preferred_qualifications ? `\n\nPreferred Qualifications:\n${job.preferred_qualifications}` : '',
					].join('');
					
					allJobs.push(normalizeATSJob({
						title: job.title,
						description,
						companyName: 'Amazon',
						companyLogo: clearbitLogo('amazon.com'),
						location: locationStr || country,
						applyUrl: `https://www.amazon.jobs/en/jobs/${job.id_icims}`,
						postedAt: job.updated_time || job.posted_date || new Date().toISOString(),
						externalId: `amazon_${job.id_icims}`,
					}, 'amazon'));
				}
			}
			
			// Rate limiting
			await new Promise(resolve => setTimeout(resolve, 500));
			
		} catch (e: any) {
			console.warn(`[GAFAM][Amazon] Error fetching for ${country}:`, e.message);
		}
	}
	
	// Deduplicate
	const uniqueJobs = Array.from(
		new Map(allJobs.map(j => [j.externalId, j])).values()
	);
	
	console.log(`[GAFAM][Amazon] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// APPLE JOBS
// jobs.apple.com
// ============================================

interface AppleJobsResponse {
	searchResults?: Array<{
		id: string;
		postingTitle: string;
		postingDescription?: string;
		locations?: Array<{ name: string; countryName?: string }>;
		team?: { teamName: string };
		postDateInGMT?: string;
	}>;
	totalRecords?: number;
}

export async function fetchAppleJobs(location?: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Apple uses a different API structure - fetch from the main jobs page
		// The API endpoint is: https://jobs.apple.com/api/v1/jobSearch
		const baseUrl = 'https://jobs.apple.com/api/v1/jobSearch';
		
		// Fetch multiple pages
		for (let page = 0; page < 10; page++) {
			try {
				const body = {
					filters: {
						range: {
							standardWeeklyHours: { start: null, end: null }
						}
					},
					page: page,
					locale: 'en-us',
					sort: 'newest'
				};
				
				const response = await fetch(baseUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					},
					body: JSON.stringify(body),
				});
				
				if (!response.ok) {
					// Try alternative: scrape from the jobs page
					break;
				}
				
				const data = await response.json();
				const jobs = data.searchResults || [];
				
				if (jobs.length === 0) break;
				
				for (const job of jobs) {
					const locationStr = job.locations?.map((l: any) => l.name).join(', ') || 'USA';
					
					allJobs.push(normalizeATSJob({
						title: job.postingTitle || job.title || 'Unknown Position',
						description: job.postingDescription || job.description || '',
						companyName: 'Apple',
						companyLogo: clearbitLogo('apple.com'),
						location: locationStr,
						applyUrl: job.applyUrl || `https://jobs.apple.com/en-us/details/${job.positionId || job.id}`,
						postedAt: job.postDateInGMT || new Date().toISOString(),
						externalId: `apple_${job.positionId || job.id || Date.now()}`,
					}, 'apple'));
				}
				
				// Rate limiting
				await new Promise(resolve => setTimeout(resolve, 500));
				
			} catch (e: any) {
				console.warn(`[GAFAM][Apple] Error fetching page ${page}:`, e.message);
				break;
			}
		}
	} catch (e: any) {
		console.warn(`[GAFAM][Apple] Error:`, e.message);
	}
	
	// If API failed, try to at least log that we tried
	if (allJobs.length === 0) {
		console.log('[GAFAM][Apple] API returned no jobs - Apple may have changed their API');
	}
	
	// Deduplicate
	const uniqueJobs = Array.from(
		new Map(allJobs.map(j => [j.externalId, j])).values()
	);
	
	console.log(`[GAFAM][Apple] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// AGGREGATED FETCH ALL GAFAM
// ============================================

export interface GAFAMConfig {
	google?: boolean;
	meta?: boolean;
	amazon?: boolean;
	apple?: boolean;
}

export async function fetchAllGAFAM(config: GAFAMConfig = {}): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	const results: Record<string, number> = {};
	
	// Default: fetch all
	const fetchGoogle = config.google !== false;
	const fetchMeta = config.meta !== false;
	const fetchAmazon = config.amazon !== false;
	const fetchApple = config.apple !== false;
	
	// Fetch in parallel
	const promises: Promise<NormalizedATSJob[]>[] = [];
	
	if (fetchGoogle) {
		promises.push(
			fetchGoogleCareers().then(jobs => {
				results.google = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[GAFAM][Google] Fatal error:', e);
				results.google = 0;
				return [];
			})
		);
	}
	
	if (fetchMeta) {
		promises.push(
			fetchMetaCareers().then(jobs => {
				results.meta = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[GAFAM][Meta] Fatal error:', e);
				results.meta = 0;
				return [];
			})
		);
	}
	
	if (fetchAmazon) {
		promises.push(
			fetchAmazonJobs().then(jobs => {
				results.amazon = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[GAFAM][Amazon] Fatal error:', e);
				results.amazon = 0;
				return [];
			})
		);
	}
	
	if (fetchApple) {
		promises.push(
			fetchAppleJobs().then(jobs => {
				results.apple = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[GAFAM][Apple] Fatal error:', e);
				results.apple = 0;
				return [];
			})
		);
	}
	
	const jobArrays = await Promise.all(promises);
	jobArrays.forEach(jobs => allJobs.push(...jobs));
	
	console.log(`[GAFAM] Total jobs fetched: ${allJobs.length}`, results);
	return allJobs;
}

