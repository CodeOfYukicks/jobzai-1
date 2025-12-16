/**
 * 📋 Additional ATS Fetchers
 * 
 * Fetchers for additional ATS platforms commonly used by European companies
 * 
 * Supported:
 * - Teamtailor (popular in Nordics & UK)
 * - BreezyHR (SMB focused)
 * - Recruitee (European startups)
 * - Personio (German HR platform)
 * - Jobvite (Enterprise)
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

function titleCase(str: string): string {
	return str
		.toLowerCase()
		.split(/[-_\s]+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// ============================================
// TEAMTAILOR
// {company}.teamtailor.com/jobs
// Popular in Nordics, UK, Germany
// ============================================

interface TeamtailorJob {
	id: string;
	type: string;
	links?: { 'careersite-job-url'?: string };
	attributes?: {
		title?: string;
		body?: string;
		pitch?: string;
		'remote-status'?: string;
		'created-at'?: string;
		'updated-at'?: string;
	};
	relationships?: {
		locations?: { data?: Array<{ id: string }> };
		department?: { data?: { id: string } };
	};
}

interface TeamtailorResponse {
	data?: TeamtailorJob[];
	included?: Array<{
		id: string;
		type: string;
		attributes?: { name?: string; city?: string; country?: string };
	}>;
}

export async function fetchTeamtailor(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Teamtailor public API endpoint
		const url = `https://${companySlug}.teamtailor.com/api/v1/jobs`;
		
		const response = await fetchJson<TeamtailorResponse>(url);
		
		if (response.data) {
			// Build location lookup from included data
			const locationMap = new Map<string, string>();
			if (response.included) {
				for (const inc of response.included) {
					if (inc.type === 'locations' && inc.attributes) {
						const parts = [inc.attributes.city, inc.attributes.country].filter(Boolean);
						locationMap.set(inc.id, parts.join(', ') || 'Unknown');
					}
				}
			}
			
			for (const job of response.data) {
				const attrs = job.attributes || {};
				
				// Get location from relationships
				const locationIds = job.relationships?.locations?.data?.map(l => l.id) || [];
				const locations = locationIds.map(id => locationMap.get(id)).filter(Boolean);
				const location = locations.join(' | ') || attrs['remote-status'] || 'Remote';
				
				const description = [attrs.pitch, attrs.body].filter(Boolean).join('\n\n');
				
				allJobs.push(normalizeATSJob({
					title: attrs.title || 'Untitled Position',
					description,
					companyName: titleCase(companySlug),
					companyLogo: clearbitLogo(`${companySlug}.com`),
					location,
					applyUrl: job.links?.['careersite-job-url'] || `https://${companySlug}.teamtailor.com/jobs/${job.id}`,
					postedAt: attrs['updated-at'] || attrs['created-at'] || new Date().toISOString(),
					externalId: `teamtailor_${companySlug}_${job.id}`,
				}, 'teamtailor'));
			}
		}
		
		console.log(`[ATS][Teamtailor] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][Teamtailor] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// BREEZYHR
// {company}.breezy.hr/json
// SMB focused ATS
// ============================================

interface BreezyJob {
	id: string;
	name?: string;
	description?: string;
	location?: {
		city?: string;
		state?: string;
		country?: string;
		is_remote?: boolean;
	};
	type?: { name?: string };
	department?: { name?: string };
	experience?: { name?: string };
	published_date?: string;
	url?: string;
}

export async function fetchBreezyHR(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// BreezyHR public JSON endpoint
		const url = `https://${companySlug}.breezy.hr/json`;
		
		const jobs = await fetchJson<BreezyJob[]>(url);
		
		if (Array.isArray(jobs)) {
			for (const job of jobs) {
				const loc = job.location;
				const locationParts = [];
				if (loc?.city) locationParts.push(loc.city);
				if (loc?.state) locationParts.push(loc.state);
				if (loc?.country) locationParts.push(loc.country);
				if (loc?.is_remote) locationParts.push('Remote');
				const location = locationParts.join(', ') || 'Unknown';
				
				allJobs.push(normalizeATSJob({
					title: job.name || 'Untitled Position',
					description: job.description || '',
					companyName: titleCase(companySlug),
					companyLogo: clearbitLogo(`${companySlug}.com`),
					location,
					applyUrl: job.url || `https://${companySlug}.breezy.hr/p/${job.id}`,
					postedAt: job.published_date || new Date().toISOString(),
					externalId: `breezyhr_${companySlug}_${job.id}`,
				}, 'breezyhr'));
			}
		}
		
		console.log(`[ATS][BreezyHR] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][BreezyHR] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// RECRUITEE
// {company}.recruitee.com/api/offers
// Popular with European startups
// ============================================

interface RecruiteeOffer {
	id: number;
	slug?: string;
	title?: string;
	description?: string;
	requirements?: string;
	location?: string;
	city?: string;
	country?: string;
	remote?: boolean;
	department?: string;
	careers_url?: string;
	created_at?: string;
	published_at?: string;
}

interface RecruiteeResponse {
	offers?: RecruiteeOffer[];
}

export async function fetchRecruitee(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Recruitee public API endpoint
		const url = `https://${companySlug}.recruitee.com/api/offers`;
		
		const response = await fetchJson<RecruiteeResponse>(url);
		
		if (response.offers) {
			for (const offer of response.offers) {
				const locationParts = [];
				if (offer.city) locationParts.push(offer.city);
				if (offer.country) locationParts.push(offer.country);
				if (offer.remote) locationParts.push('Remote');
				const location = offer.location || locationParts.join(', ') || 'Unknown';
				
				const description = [offer.description, offer.requirements].filter(Boolean).join('\n\n');
				
				allJobs.push(normalizeATSJob({
					title: offer.title || 'Untitled Position',
					description,
					companyName: titleCase(companySlug),
					companyLogo: clearbitLogo(`${companySlug}.com`),
					location,
					applyUrl: offer.careers_url || `https://${companySlug}.recruitee.com/o/${offer.slug || offer.id}`,
					postedAt: offer.published_at || offer.created_at || new Date().toISOString(),
					externalId: `recruitee_${companySlug}_${offer.id}`,
				}, 'recruitee'));
			}
		}
		
		console.log(`[ATS][Recruitee] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][Recruitee] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// PERSONIO
// {company}.jobs.personio.de/
// Popular German HR platform
// ============================================

interface PersonioJob {
	id: number;
	name?: string;
	description?: string;
	office?: string;
	department?: string;
	recruitingCategory?: string;
	employmentType?: string;
	schedule?: string;
	createdAt?: string;
}

interface PersonioResponse {
	data?: PersonioJob[];
}

export async function fetchPersonio(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Personio public jobs widget API
		// Try different URL patterns
		const urls = [
			`https://${companySlug}.jobs.personio.de/search.json`,
			`https://${companySlug}.jobs.personio.com/search.json`,
			`https://jobs.personio.de/widget/${companySlug}/positions`,
		];
		
		let jobs: PersonioJob[] = [];
		
		for (const url of urls) {
			try {
				const response = await fetchJson<PersonioResponse | PersonioJob[]>(url);
				
				if (Array.isArray(response)) {
					jobs = response;
					break;
				} else if (response.data) {
					jobs = response.data;
					break;
				}
			} catch {
				// Try next URL
			}
		}
		
		for (const job of jobs) {
			allJobs.push(normalizeATSJob({
				title: job.name || 'Untitled Position',
				description: job.description || '',
				companyName: titleCase(companySlug),
				companyLogo: clearbitLogo(`${companySlug}.com`),
				location: job.office || 'Germany',
				applyUrl: `https://${companySlug}.jobs.personio.de/job/${job.id}`,
				postedAt: job.createdAt || new Date().toISOString(),
				externalId: `personio_${companySlug}_${job.id}`,
			}, 'personio'));
		}
		
		console.log(`[ATS][Personio] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][Personio] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// JOBVITE
// {company}.jobvite.com/careers/search
// Enterprise ATS
// ============================================

interface JobviteJob {
	id: string;
	title?: string;
	description?: string;
	location?: string;
	department?: string;
	category?: string;
	type?: string;
	applyUrl?: string;
	datePosted?: string;
}

export async function fetchJobvite(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Jobvite API endpoint
		const url = `https://jobs.jobvite.com/${companySlug}/jobs`;
		
		const response = await fetch(url, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0',
			},
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		// Jobvite might return HTML, try to extract job data
		const text = await response.text();
		
		// Try parsing as JSON first
		try {
			const json = JSON.parse(text);
			if (json.jobs || json.data) {
				const jobs = json.jobs || json.data || [];
				for (const job of jobs) {
					allJobs.push(normalizeATSJob({
						title: job.title || 'Untitled Position',
						description: job.description || '',
						companyName: titleCase(companySlug),
						companyLogo: clearbitLogo(`${companySlug}.com`),
						location: job.location || 'Unknown',
						applyUrl: job.applyUrl || `https://jobs.jobvite.com/${companySlug}/${job.id}`,
						postedAt: job.datePosted || new Date().toISOString(),
						externalId: `jobvite_${companySlug}_${job.id}`,
					}, 'workable'));
				}
			}
		} catch {
			// HTML response - would need scraping
			console.warn(`[ATS][Jobvite] ${companySlug} returned HTML, skipping`);
		}
		
		console.log(`[ATS][Jobvite] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][Jobvite] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// WORKABLE
// {company}.workable.com/api/v3/accounts/{id}/jobs
// Common ATS for tech companies
// ============================================

interface WorkableJob {
	id: string;
	shortcode?: string;
	title?: string;
	description?: string;
	requirements?: string;
	benefits?: string;
	location?: {
		city?: string;
		country?: string;
		region?: string;
		workplace_type?: string;
	};
	department?: string;
	employment_type?: string;
	created_at?: string;
	url?: string;
}

export async function fetchWorkable(companySlug: string): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Workable public jobs board API
		const url = `https://apply.workable.com/api/v1/widget/accounts/${companySlug}`;
		
		const response = await fetchJson<{ jobs?: WorkableJob[] }>(url);
		
		if (response.jobs) {
			for (const job of response.jobs) {
				const loc = job.location;
				const locationParts = [];
				if (loc?.city) locationParts.push(loc.city);
				if (loc?.region) locationParts.push(loc.region);
				if (loc?.country) locationParts.push(loc.country);
				if (loc?.workplace_type === 'remote') locationParts.push('Remote');
				const location = locationParts.join(', ') || 'Unknown';
				
				const description = [job.description, job.requirements, job.benefits]
					.filter(Boolean)
					.join('\n\n');
				
				allJobs.push(normalizeATSJob({
					title: job.title || 'Untitled Position',
					description,
					companyName: titleCase(companySlug),
					companyLogo: clearbitLogo(`${companySlug}.com`),
					location,
					applyUrl: job.url || `https://apply.workable.com/${companySlug}/j/${job.shortcode || job.id}`,
					postedAt: job.created_at || new Date().toISOString(),
					externalId: `workable_${companySlug}_${job.id}`,
				}, 'workable'));
			}
		}
		
		console.log(`[ATS][Workable] company=${companySlug} jobs=${allJobs.length}`);
		
	} catch (e: any) {
		console.warn(`[ATS][Workable] Error for ${companySlug}:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// Company lists for new ATS providers
// ============================================

export const TEAMTAILOR_COMPANIES: string[] = [
	// These companies are verified to use Teamtailor
	// Nordics - verified
	'kry', 'mentimeter', 'tink', 'anyfin', 'hedvig', 'pleo',
	'epidemic-sound', 'storytel', 'fishbrain', 'einride',
	// UK - verified
	'tide', 'cleo', 'plum', 'lendable', 'iwoca',
	// Other verified Teamtailor users
	'qred', 'factorial', 'gofundme', 'spendesk', 'leocare',
];

export const BREEZYHR_COMPANIES: string[] = [
	'remote', 'doist', 'toggl', 'omnisend', 'printful', 'bolt-eu',
	'pipedrive', 'veriff', 'glia', 'katana', 'pactum', 'starship',
	'ready-player-me', 'comodule', 'ridango', 'cleveron', 'guardtime',
];

export const RECRUITEE_COMPANIES: string[] = [
	'messagebird', 'mollie', 'adyen', 'takeaway', 'picnic', 'bunq',
	'backbase', 'miro', 'bitpanda', 'runtastic', 'shpock', 'willhaben',
	'karriere-at', 'kununu', 'xing', 'new-work', 'honeypot', 'talent-io',
];

export const PERSONIO_COMPANIES: string[] = [
	'personio', 'celonis', 'flixmobility', 'scalable-capital', 'trade-republic',
	'wefox', 'sennder', 'forto', 'omio', 'taxfix', 'bunch', 'comtravo',
	'raisin', 'smava', 'kreditech', 'auxmoney', 'finanzcheck', 'check24',
];

export const WORKABLE_COMPANIES: string[] = [
	'skyscanner', 'transferwise', 'typeform', 'cabify', 'glovo', 'factorial',
	'travelperk', 'paack', 'wallapop', 'jobandtalent', 'preply', 'grammarly',
	'miro', 'loom', 'notion', 'figma', 'canva', 'airtable',
];

// ============================================
// AGGREGATED FETCH FOR NEW ATS
// ============================================

export interface AdditionalATSConfig {
	teamtailor?: string[];
	breezyhr?: string[];
	recruitee?: string[];
	personio?: string[];
	workable?: string[];
}

export async function fetchAllAdditionalATS(
	config: AdditionalATSConfig = {}
): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	const results: Record<string, number> = {};
	
	// Use provided lists or defaults
	const teamtailorCompanies = config.teamtailor || TEAMTAILOR_COMPANIES;
	const breezyhrCompanies = config.breezyhr || BREEZYHR_COMPANIES;
	const recruiteeCompanies = config.recruitee || RECRUITEE_COMPANIES;
	const personioCompanies = config.personio || PERSONIO_COMPANIES;
	const workableCompanies = config.workable || WORKABLE_COMPANIES;
	
	// Fetch from Teamtailor
	console.log(`[AdditionalATS] Fetching from ${teamtailorCompanies.length} Teamtailor companies...`);
	for (const company of teamtailorCompanies) {
		const jobs = await fetchTeamtailor(company);
		allJobs.push(...jobs);
		await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
	}
	results.teamtailor = allJobs.length;
	
	// Fetch from BreezyHR
	const breezyStart = allJobs.length;
	console.log(`[AdditionalATS] Fetching from ${breezyhrCompanies.length} BreezyHR companies...`);
	for (const company of breezyhrCompanies) {
		const jobs = await fetchBreezyHR(company);
		allJobs.push(...jobs);
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	results.breezyhr = allJobs.length - breezyStart;
	
	// Fetch from Recruitee
	const recruiteeStart = allJobs.length;
	console.log(`[AdditionalATS] Fetching from ${recruiteeCompanies.length} Recruitee companies...`);
	for (const company of recruiteeCompanies) {
		const jobs = await fetchRecruitee(company);
		allJobs.push(...jobs);
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	results.recruitee = allJobs.length - recruiteeStart;
	
	// Fetch from Personio
	const personioStart = allJobs.length;
	console.log(`[AdditionalATS] Fetching from ${personioCompanies.length} Personio companies...`);
	for (const company of personioCompanies) {
		const jobs = await fetchPersonio(company);
		allJobs.push(...jobs);
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	results.personio = allJobs.length - personioStart;
	
	// Fetch from Workable
	const workableStart = allJobs.length;
	console.log(`[AdditionalATS] Fetching from ${workableCompanies.length} Workable companies...`);
	for (const company of workableCompanies) {
		const jobs = await fetchWorkable(company);
		allJobs.push(...jobs);
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	results.workable = allJobs.length - workableStart;
	
	console.log(`[AdditionalATS] Total jobs fetched: ${allJobs.length}`, results);
	return allJobs;
}
