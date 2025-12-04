/**
 * 🆕 New ATS Providers
 * 
 * Additional ATS providers to expand job coverage:
 * - Recruitee: European startups
 * - Personio: German/European companies
 * - BreezyHR: SMBs and startups
 * - Teamtailor: Nordic/European companies
 */

import { NormalizedATSJob } from '../types';
import { normalizeATSJob } from '../utils/normalize';

// ============================================
// Helper Functions
// ============================================

async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init);
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`HTTP ${res.status} for ${url} → ${text.slice(0, 200)}`);
	}
	return res.json() as Promise<T>;
}

function titleCaseCompany(name?: string, fallback?: string) {
	const n = (name || fallback || "").trim();
	if (!n) return "";
	return n
		.toLowerCase()
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

function clearbitLogo(company: string): string {
	return `https://logo.clearbit.com/${company}.com`;
}

// ============================================
// RECRUITEE
// https://api.recruitee.com/c/{company}/careers
// ============================================

export async function fetchRecruitee(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://${companySlug}.recruitee.com/api/offers`;
	
	try {
		const json = await fetchJson<{ offers: any[] }>(url);
		const offers = json.offers || [];
		
		const list = offers.map((j: any) =>
			normalizeATSJob(
				{
					title: j.title,
					description: j.description || j.description_plain || "",
					companyName: titleCaseCompany(j.company?.name, companySlug),
					companyLogo: j.company?.logo_url || clearbitLogo(companySlug),
					location: j.location || j.city || "",
					applyUrl: j.careers_url || j.url || `https://${companySlug}.recruitee.com/o/${j.slug}`,
					postedAt: j.published_at || j.created_at,
					externalId: String(j.id),
				},
				"recruitee"
			)
		);
		
		console.log(`[ATS][Recruitee] company=${companySlug} jobs=${list.length}`);
		return list;
	} catch (e: any) {
		console.error(`[ATS][Recruitee] Error fetching ${companySlug}:`, e.message);
		return [];
	}
}

// ============================================
// PERSONIO
// https://api.personio.de/v1/recruiting/applications
// Public job listings at: https://{company}.jobs.personio.de/
// ============================================

export async function fetchPersonio(companySlug: string): Promise<NormalizedATSJob[]> {
	// Personio uses XML/RSS feeds for public job listings
	const url = `https://${companySlug}.jobs.personio.de/xml`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		const xml = await response.text();
		
		// Parse XML manually (simplified - in production use a proper XML parser)
		const jobs: NormalizedATSJob[] = [];
		const positionRegex = /<position>([\s\S]*?)<\/position>/gi;
		let match;
		
		while ((match = positionRegex.exec(xml)) !== null) {
			const positionXml = match[1];
			
			const getId = (tag: string) => {
				const m = positionXml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
				return m ? m[1].trim() : '';
			};
			
			const title = getId('name') || getId('title');
			const description = getId('jobDescription') || getId('description') || '';
			const location = getId('office') || getId('location') || '';
			const id = getId('id') || getId('recruitingChannelId');
			
			if (title && id) {
				jobs.push(
					normalizeATSJob(
						{
							title,
							description,
							companyName: titleCaseCompany(companySlug),
							companyLogo: clearbitLogo(companySlug),
							location,
							applyUrl: `https://${companySlug}.jobs.personio.de/job/${id}`,
							postedAt: getId('createdAt') || new Date().toISOString(),
							externalId: id,
						},
						"personio"
					)
				);
			}
		}
		
		console.log(`[ATS][Personio] company=${companySlug} jobs=${jobs.length}`);
		return jobs;
	} catch (e: any) {
		console.error(`[ATS][Personio] Error fetching ${companySlug}:`, e.message);
		return [];
	}
}

// ============================================
// BREEZYHR
// https://api.breezy.hr/v3/company/{company_id}/positions
// Public listings at: https://{company}.breezy.hr/
// ============================================

export async function fetchBreezyHR(companySlug: string): Promise<NormalizedATSJob[]> {
	// BreezyHR public API endpoint
	const url = `https://${companySlug}.breezy.hr/json`;
	
	try {
		const json = await fetchJson<any[]>(url);
		const positions = Array.isArray(json) ? json : [];
		
		const list = positions.map((j: any) =>
			normalizeATSJob(
				{
					title: j.name || j.title,
					description: j.description || "",
					companyName: titleCaseCompany(j.company?.name, companySlug),
					companyLogo: j.company?.logo || clearbitLogo(companySlug),
					location: j.location?.name || j.location?.city || "",
					applyUrl: j.url || `https://${companySlug}.breezy.hr/p/${j.friendly_id || j.id}`,
					postedAt: j.published_date || j.creation_date,
					externalId: j.id || j.friendly_id,
				},
				"breezyhr"
			)
		);
		
		console.log(`[ATS][BreezyHR] company=${companySlug} jobs=${list.length}`);
		return list;
	} catch (e: any) {
		console.error(`[ATS][BreezyHR] Error fetching ${companySlug}:`, e.message);
		return [];
	}
}

// ============================================
// TEAMTAILOR
// https://career.{company}.com/connect/api/v1/jobs
// ============================================

export async function fetchTeamtailor(companySlug: string): Promise<NormalizedATSJob[]> {
	// Teamtailor uses different URL patterns
	const urls = [
		`https://career.${companySlug}.com/jobs`,
		`https://${companySlug}.teamtailor.com/jobs`,
	];
	
	for (const baseUrl of urls) {
		try {
			const url = `${baseUrl}?format=json`;
			const json = await fetchJson<{ jobs?: any[]; data?: any[] }>(url);
			const jobs = json.jobs || json.data || [];
			
			if (jobs.length === 0) continue;
			
			const list = jobs.map((j: any) =>
				normalizeATSJob(
					{
						title: j.title,
						description: j.body || j.description || "",
						companyName: titleCaseCompany(companySlug),
						companyLogo: clearbitLogo(companySlug),
						location: j.location?.name || j.locations?.map((l: any) => l.name).join(', ') || "",
						applyUrl: j.links?.careersite_job_url || j.url || `${baseUrl}/${j.id}`,
						postedAt: j.created_at || j.published_at,
						externalId: String(j.id),
					},
					"teamtailor"
				)
			);
			
			console.log(`[ATS][Teamtailor] company=${companySlug} jobs=${list.length}`);
			return list;
		} catch (e) {
			// Try next URL pattern
		}
	}
	
	console.log(`[ATS][Teamtailor] company=${companySlug} jobs=0 (not found)`);
	return [];
}

// ============================================
// WORKABLE
// https://apply.workable.com/{company}/
// ============================================

export async function fetchWorkable(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://apply.workable.com/api/v1/widget/accounts/${companySlug}`;
	
	try {
		const json = await fetchJson<{ jobs: any[] }>(url);
		const jobs = json.jobs || [];
		
		const list = jobs.map((j: any) =>
			normalizeATSJob(
				{
					title: j.title,
					description: j.description || "",
					companyName: titleCaseCompany(j.account?.name, companySlug),
					companyLogo: j.account?.logo || clearbitLogo(companySlug),
					location: j.location?.country_code ? `${j.location?.city || ''}, ${j.location?.country_code}` : j.location?.city || "",
					applyUrl: j.shortlink || `https://apply.workable.com/${companySlug}/j/${j.shortcode}/`,
					postedAt: j.published_on || j.created_at,
					externalId: j.shortcode || j.id,
				},
				"workable"
			)
		);
		
		console.log(`[ATS][Workable] company=${companySlug} jobs=${list.length}`);
		return list;
	} catch (e: any) {
		console.error(`[ATS][Workable] Error fetching ${companySlug}:`, e.message);
		return [];
	}
}

// ============================================
// Company Lists for New Providers
// ============================================

export const RECRUITEE_COMPANIES = [
	'aircall', 'algolia', 'backmarket', 'blablacar', 'doctolib',
	'datadog', 'ledger', 'lydia', 'malt', 'mangopay',
	'meilisearch', 'mirakl', 'payfit', 'pennylane', 'qonto',
	'spendesk', 'swile', 'yousign', 'zenly',
];

export const PERSONIO_COMPANIES = [
	'personio', 'flixbus', 'celonis', 'contentful', 'mambu',
	'scalable', 'solarisbank', 'trade-republic', 'wefox', 'zenjob',
];

export const BREEZYHR_COMPANIES = [
	'buffer', 'doist', 'toggl', 'hubstaff', 'time-doctor',
	'remote', 'oyster', 'deel', 'papaya',
];

export const TEAMTAILOR_COMPANIES = [
	'spotify', 'klarna', 'northvolt', 'king', 'mojang',
	'izettle', 'tink', 'karma', 'kry', 'hedvig',
];

export const WORKABLE_COMPANIES = [
	'epam', 'miro', 'canva', 'mongodb', 'elastic',
	'datadog', 'cloudflare', 'fastly', 'netlify',
];



