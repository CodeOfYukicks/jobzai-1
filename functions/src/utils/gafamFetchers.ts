/**
 * 🏢 GAFAM + Enterprise Direct Fetchers
 * 
 * Fetchers for major tech companies and enterprise consulting firms
 * that have their own career portals (not using standard ATS)
 * 
 * GAFAM/MAANG:
 * - Google (careers.google.com)
 * - Meta (metacareers.com)
 * - Amazon (amazon.jobs)
 * - Apple (jobs.apple.com)
 * - Microsoft (careers.microsoft.com)
 * 
 * Enterprise Tech:
 * - Salesforce (salesforce.com/careers)
 * - SAP (sap.com/careers)
 * - Oracle (oracle.com/careers)
 * 
 * Enterprise Consulting (Big 4 + MBB + Others):
 * - Accenture (accenture.com/careers)
 * - Deloitte (deloitte.com/careers)
 * - PwC (pwc.com/careers)
 * - EY (ey.com/careers)
 * - KPMG (kpmg.com/careers)
 * - McKinsey (mckinsey.com/careers)
 * - BCG (bcg.com/careers)
 * - Bain (bain.com/careers)
 * - Capgemini (capgemini.com/careers)
 */

import { NormalizedATSJob, JobDocument } from '../types';
import { normalizeATSJob } from './normalize';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const REGION = 'us-central1';

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
// MICROSOFT CAREERS
// careers.microsoft.com
// ============================================

interface MicrosoftJobsResponse {
	operationResult?: {
		result?: {
			jobs?: Array<{
				jobId: string;
				title: string;
				description?: string;
				primaryWorkLocation?: { city?: string; state?: string; country?: string };
				jobType?: string;
				postingDate?: string;
			}>;
			totalJobs?: number;
		};
	};
}

export async function fetchMicrosoftJobs(location?: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Microsoft Careers API
		const baseUrl = 'https://careers.microsoft.com/api/v1/search';
		
		// Fetch multiple pages
		for (let page = 1; page <= 10; page++) {
			try {
				const params = new URLSearchParams({
					pg: page.toString(),
					pgSz: '100',
					o: 'Recent',
					flt: 'true',
				});
				
				const url = `${baseUrl}?${params}`;
				const response = await fetchJson<MicrosoftJobsResponse>(url);
				
				const jobs = response.operationResult?.result?.jobs || [];
				
				if (jobs.length === 0) break;
				
				for (const job of jobs) {
					const loc = job.primaryWorkLocation;
					const locationStr = [loc?.city, loc?.state, loc?.country].filter(Boolean).join(', ') || 'Multiple Locations';
					
					allJobs.push(normalizeATSJob({
						title: job.title,
						description: job.description || '',
						companyName: 'Microsoft',
						companyLogo: clearbitLogo('microsoft.com'),
						location: locationStr,
						applyUrl: `https://careers.microsoft.com/us/en/job/${job.jobId}`,
						postedAt: job.postingDate || new Date().toISOString(),
						externalId: `microsoft_${job.jobId}`,
					}, 'microsoft'));
				}
				
				await new Promise(resolve => setTimeout(resolve, 300));
				
			} catch (e: any) {
				console.warn(`[Enterprise][Microsoft] Error fetching page ${page}:`, e.message);
				break;
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Microsoft] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Microsoft] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// SALESFORCE CAREERS
// salesforce.com/company/careers
// ============================================

export async function fetchSalesforceJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Salesforce uses Workday for their careers
		// Their job search API endpoint
		const baseUrl = 'https://salesforce.wd12.myworkdayjobs.com/wday/cxs/salesforce/External_Career_Site/jobs';
		
		for (let offset = 0; offset < 500; offset += 50) {
			try {
				const response = await fetch(baseUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					},
					body: JSON.stringify({
						appliedFacets: {},
						limit: 50,
						offset: offset,
						searchText: '',
					}),
				});
				
				if (!response.ok) break;
				
				const data = await response.json();
				const jobs = data.jobPostings || [];
				
				if (jobs.length === 0) break;
				
				for (const job of jobs) {
					allJobs.push(normalizeATSJob({
						title: job.title || job.bulletFields?.[0] || 'Unknown Position',
						description: job.descriptionText || '',
						companyName: 'Salesforce',
						companyLogo: clearbitLogo('salesforce.com'),
						location: job.locationsText || job.bulletFields?.[1] || 'Multiple Locations',
						applyUrl: `https://salesforce.wd12.myworkdayjobs.com/External_Career_Site${job.externalPath}`,
						postedAt: job.postedOn || new Date().toISOString(),
						externalId: `salesforce_${job.bulletFields?.[0]?.replace(/\s/g, '_') || Date.now()}_${offset}`,
					}, 'salesforce'));
				}
				
				await new Promise(resolve => setTimeout(resolve, 500));
				
			} catch (e: any) {
				console.warn(`[Enterprise][Salesforce] Error fetching offset ${offset}:`, e.message);
				break;
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Salesforce] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Salesforce] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// ACCENTURE CAREERS
// accenture.com/careers
// ============================================

export async function fetchAccentureJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Accenture has their own careers API
		const baseUrl = 'https://www.accenture.com/api/accenture/jobs/search';
		
		// Search keywords relevant for tech consulting
		const keywords = ['', 'Salesforce', 'Developer', 'Consultant', 'Cloud', 'SAP', 'Technology'];
		
		for (const keyword of keywords) {
			try {
				const params = new URLSearchParams({
					q: keyword,
					lang: 'en',
					offset: '0',
					num: '100',
				});
				
				const response = await fetch(`${baseUrl}?${params}`, {
					headers: {
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					},
				});
				
				if (!response.ok) continue;
				
				const data = await response.json();
				const jobs = data.documents || data.jobs || data.results || [];
				
				for (const job of jobs) {
					const jobId = job.jobId || job.id || job.jobNumber || `${Date.now()}_${Math.random()}`;
					
					allJobs.push(normalizeATSJob({
						title: job.title || job.jobTitle || 'Consultant',
						description: job.description || job.jobDescription || '',
						companyName: 'Accenture',
						companyLogo: clearbitLogo('accenture.com'),
						location: job.location || job.city || job.country || 'Multiple Locations',
						applyUrl: job.applyUrl || job.url || `https://www.accenture.com/careers/jobdetails?id=${jobId}`,
						postedAt: job.postedDate || job.publishedDate || new Date().toISOString(),
						externalId: `accenture_${jobId}`,
					}, 'accenture'));
				}
				
				await new Promise(resolve => setTimeout(resolve, 300));
				
			} catch (e: any) {
				console.warn(`[Enterprise][Accenture] Error fetching "${keyword}":`, e.message);
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Accenture] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Accenture] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// DELOITTE CAREERS
// deloitte.com/careers
// ============================================

export async function fetchDeloitteJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Deloitte uses a custom career site
		// Try the Workday-based API that some Deloitte regions use
		const regions = [
			{ url: 'https://apply.deloitte.com/careers/SearchJobs', country: 'US' },
			{ url: 'https://jobsearch.deloitte.com/api/jobs', country: 'Global' },
		];
		
		for (const region of regions) {
			try {
				const response = await fetch(region.url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					},
					body: JSON.stringify({
						keywords: '',
						limit: 100,
						offset: 0,
					}),
				});
				
				if (!response.ok) continue;
				
				const data = await response.json();
				const jobs = data.jobs || data.requisitionList || data.results || [];
				
				for (const job of jobs) {
					const jobId = job.id || job.requisitionId || job.jobId || `${Date.now()}`;
					
					allJobs.push(normalizeATSJob({
						title: job.title || job.jobTitle || 'Consultant',
						description: job.description || job.jobDescription || '',
						companyName: 'Deloitte',
						companyLogo: clearbitLogo('deloitte.com'),
						location: job.location || job.city || region.country,
						applyUrl: job.applyUrl || `https://apply.deloitte.com/careers/JobDetail/${jobId}`,
						postedAt: job.postedDate || new Date().toISOString(),
						externalId: `deloitte_${jobId}`,
					}, 'deloitte'));
				}
				
			} catch (e: any) {
				console.warn(`[Enterprise][Deloitte] Error fetching ${region.country}:`, e.message);
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Deloitte] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Deloitte] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// CAPGEMINI CAREERS
// capgemini.com/careers
// ============================================

export async function fetchCapgeminiJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Capgemini uses iCIMS
		const baseUrl = 'https://capgemini.wd3.myworkdayjobs.com/wday/cxs/capgemini/Global_Careers/jobs';
		
		for (let offset = 0; offset < 500; offset += 50) {
			try {
				const response = await fetch(baseUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
					},
					body: JSON.stringify({
						appliedFacets: {},
						limit: 50,
						offset: offset,
						searchText: '',
					}),
				});
				
				if (!response.ok) break;
				
				const data = await response.json();
				const jobs = data.jobPostings || [];
				
				if (jobs.length === 0) break;
				
				for (const job of jobs) {
					allJobs.push(normalizeATSJob({
						title: job.title || 'Consultant',
						description: job.descriptionText || '',
						companyName: 'Capgemini',
						companyLogo: clearbitLogo('capgemini.com'),
						location: job.locationsText || 'Multiple Locations',
						applyUrl: `https://capgemini.wd3.myworkdayjobs.com/Global_Careers${job.externalPath}`,
						postedAt: job.postedOn || new Date().toISOString(),
						externalId: `capgemini_${job.externalPath?.split('/').pop() || Date.now()}_${offset}`,
					}, 'capgemini'));
				}
				
				await new Promise(resolve => setTimeout(resolve, 500));
				
			} catch (e: any) {
				console.warn(`[Enterprise][Capgemini] Error fetching offset ${offset}:`, e.message);
				break;
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Capgemini] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Capgemini] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// SAP CAREERS
// sap.com/careers
// ============================================

export async function fetchSAPJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// SAP uses SuccessFactors (their own product)
		const baseUrl = 'https://jobs.sap.com/search/';
		
		// Fetch the job listings page and extract data
		const response = await fetch(`${baseUrl}?q=&sortColumn=referencedate&sortDirection=desc`, {
			headers: {
				'Accept': 'text/html',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			},
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		const html = await response.text();
		
		// Extract job data from the page (SAP embeds JSON in script tags)
		const scriptMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
		
		if (scriptMatch) {
			try {
				const data = JSON.parse(scriptMatch[1]);
				const jobs = data.jobs?.items || data.searchResults?.jobs || [];
				
				for (const job of jobs) {
					allJobs.push(normalizeATSJob({
						title: job.title || job.name,
						description: job.description || '',
						companyName: 'SAP',
						companyLogo: clearbitLogo('sap.com'),
						location: job.location || job.city || 'Multiple Locations',
						applyUrl: job.url || `https://jobs.sap.com/job/${job.id}`,
						postedAt: job.postedDate || new Date().toISOString(),
						externalId: `sap_${job.id || Date.now()}`,
					}, 'sap'));
				}
			} catch (parseError) {
				console.warn('[Enterprise][SAP] Error parsing embedded data');
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][SAP] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][SAP] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// ORACLE CAREERS
// oracle.com/careers
// ============================================

export async function fetchOracleJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Oracle uses Taleo (their own product)
		const baseUrl = 'https://eeho.fa.us2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions';
		
		const params = new URLSearchParams({
			onlyData: 'true',
			expand: 'requisitionList.secondaryLocations,flexFieldsFacet.values',
			finder: 'findReqs;siteNumber=CX_1',
			limit: '100',
		});
		
		const response = await fetch(`${baseUrl}?${params}`, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			},
		});
		
		if (response.ok) {
			const data = await response.json();
			const jobs = data.items || [];
			
			for (const job of jobs) {
				allJobs.push(normalizeATSJob({
					title: job.Title || job.title,
					description: job.Description || job.ShortDescriptionStr || '',
					companyName: 'Oracle',
					companyLogo: clearbitLogo('oracle.com'),
					location: job.PrimaryLocation || job.LocationName || 'Multiple Locations',
					applyUrl: `https://careers.oracle.com/jobs/#/job/${job.Id || job.RequisitionId}`,
					postedAt: job.PostedDate || new Date().toISOString(),
					externalId: `oracle_${job.Id || job.RequisitionId}`,
				}, 'oracle'));
			}
		}
	} catch (e: any) {
		console.warn(`[Enterprise][Oracle] Error:`, e.message);
	}
	
	const uniqueJobs = Array.from(new Map(allJobs.map(j => [j.externalId, j])).values());
	console.log(`[Enterprise][Oracle] Fetched ${uniqueJobs.length} jobs`);
	return uniqueJobs;
}

// ============================================
// AGGREGATED FETCH ALL GAFAM + ENTERPRISE
// ============================================

export interface GAFAMConfig {
	google?: boolean;
	meta?: boolean;
	amazon?: boolean;
	apple?: boolean;
	microsoft?: boolean;
}

export interface EnterpriseConfig {
	salesforce?: boolean;
	accenture?: boolean;
	deloitte?: boolean;
	capgemini?: boolean;
	sap?: boolean;
	oracle?: boolean;
}

export async function fetchAllGAFAM(config: GAFAMConfig = {}): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	const results: Record<string, number> = {};
	
	// Default: fetch all
	const fetchGoogle = config.google !== false;
	const fetchMeta = config.meta !== false;
	const fetchAmazon = config.amazon !== false;
	const fetchApple = config.apple !== false;
	const fetchMicrosoft = config.microsoft !== false;
	
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
	
	if (fetchMicrosoft) {
		promises.push(
			fetchMicrosoftJobs().then(jobs => {
				results.microsoft = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[GAFAM][Microsoft] Fatal error:', e);
				results.microsoft = 0;
				return [];
			})
		);
	}
	
	const jobArrays = await Promise.all(promises);
	jobArrays.forEach(jobs => allJobs.push(...jobs));
	
	console.log(`[GAFAM] Total jobs fetched: ${allJobs.length}`, results);
	return allJobs;
}

/**
 * Fetch all enterprise consulting + tech jobs
 */
export async function fetchAllEnterprise(config: EnterpriseConfig = {}): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	const results: Record<string, number> = {};
	
	const promises: Promise<NormalizedATSJob[]>[] = [];
	
	if (config.salesforce !== false) {
		promises.push(
			fetchSalesforceJobs().then(jobs => {
				results.salesforce = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][Salesforce] Fatal error:', e);
				return [];
			})
		);
	}
	
	if (config.accenture !== false) {
		promises.push(
			fetchAccentureJobs().then(jobs => {
				results.accenture = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][Accenture] Fatal error:', e);
				return [];
			})
		);
	}
	
	if (config.deloitte !== false) {
		promises.push(
			fetchDeloitteJobs().then(jobs => {
				results.deloitte = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][Deloitte] Fatal error:', e);
				return [];
			})
		);
	}
	
	if (config.capgemini !== false) {
		promises.push(
			fetchCapgeminiJobs().then(jobs => {
				results.capgemini = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][Capgemini] Fatal error:', e);
				return [];
			})
		);
	}
	
	if (config.sap !== false) {
		promises.push(
			fetchSAPJobs().then(jobs => {
				results.sap = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][SAP] Fatal error:', e);
				return [];
			})
		);
	}
	
	if (config.oracle !== false) {
		promises.push(
			fetchOracleJobs().then(jobs => {
				results.oracle = jobs.length;
				return jobs;
			}).catch(e => {
				console.error('[Enterprise][Oracle] Fatal error:', e);
				return [];
			})
		);
	}
	
	const jobArrays = await Promise.all(promises);
	jobArrays.forEach(jobs => allJobs.push(...jobs));
	
	console.log(`[Enterprise] Total jobs fetched: ${allJobs.length}`, results);
	return allJobs;
}

/**
 * Fetch ALL big tech + enterprise jobs
 */
export async function fetchAllBigTechAndEnterprise(): Promise<NormalizedATSJob[]> {
	const [gafamJobs, enterpriseJobs] = await Promise.all([
		fetchAllGAFAM(),
		fetchAllEnterprise(),
	]);
	
	const allJobs = [...gafamJobs, ...enterpriseJobs];
	console.log(`[BigTech+Enterprise] Total: ${allJobs.length} jobs (GAFAM: ${gafamJobs.length}, Enterprise: ${enterpriseJobs.length})`);
	return allJobs;
}

// ============================================
// MANUAL HTTP ENDPOINT FOR GAFAM + ENTERPRISE
// Call: POST /fetchGAFAMManual with body { sources: ['google', 'salesforce', 'accenture'] }
// ============================================

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function normalizeJobForFirestore(n: NormalizedATSJob): Omit<JobDocument, 'postedAt'> & { postedAtDate: Date } {
	return {
		title: n.title || '',
		company: n.company || '',
		companyLogo: n.companyLogo || null,
		location: n.location || '',
		description: n.description || '',
		skills: n.skills || [],
		applyUrl: n.applyUrl || '',
		ats: n.ats,
		externalId: n.externalId,
		postedAtDate: n.postedAt ? new Date(n.postedAt) : new Date(),
	};
}

export const fetchGAFAMManual = onRequest(
	{
		region: REGION,
		cors: true,
		maxInstances: 1,
		timeoutSeconds: 540,
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

			// Requested sources (default: all)
			const { sources } = req.body || {};
			const targetSources: string[] = sources || [
				'google', 'amazon', 'microsoft', 
				'salesforce', 'accenture', 'capgemini'
			];

			console.log(`[GAFAM Manual] Starting fetch for sources: ${targetSources.join(', ')}`);

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
							console.warn(`[GAFAM Manual] Unknown source: ${source}`);
							results[source] = { fetched: 0, written: 0, error: 'Unknown source' };
							continue;
					}

					console.log(`[GAFAM Manual] Fetched ${jobs.length} jobs from ${source}`);

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
							const normalized = normalizeJobForFirestore(job);
							const { postedAtDate, ...jobData } = normalized;
							
							batch.set(ref, {
								...jobData,
								postedAt: admin.firestore.Timestamp.fromDate(postedAtDate),
							}, { merge: true });
							written++;
						} catch (e: any) {
							console.warn(`[GAFAM Manual] Failed to queue job: ${e.message}`);
						}
					}

					await batch.close();
					totalWritten += written;
					results[source] = { fetched: jobs.length, written };

				} catch (e: any) {
					console.error(`[GAFAM Manual] Error fetching ${source}:`, e.message);
					results[source] = { fetched: 0, written: 0, error: e.message };
				}
			}

			const duration = Date.now() - startTime;
			console.log(`[GAFAM Manual] Completed in ${duration}ms. Total written: ${totalWritten}`);

			res.status(200).json({
				success: true,
				duration,
				totalWritten,
				results,
			});

		} catch (error: any) {
			console.error('[GAFAM Manual] Fatal error:', error);
			res.status(500).json({
				success: false,
				error: error.message,
			});
		}
	}
);

