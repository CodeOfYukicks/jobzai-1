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
		
		const list: ReturnType<typeof normalizeATSJob>[] = [];
		
		for (const j of jobs) {
			try {
				const companyDomain = extractDomain(j.url || j.apply_url || '');
				
				// Safe date parsing
				let postedAt: string;
				try {
					if (j.date && typeof j.date === 'number') {
						const date = new Date(j.date * 1000);
						postedAt = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
					} else if (j.date && typeof j.date === 'string') {
						const date = new Date(j.date);
						postedAt = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
					} else {
						postedAt = new Date().toISOString();
					}
				} catch {
					postedAt = new Date().toISOString();
				}
				
				list.push(normalizeATSJob(
					{
						title: j.position,
						description: j.description || '',
						companyName: j.company || 'Unknown Company',
						companyLogo: j.company_logo || (companyDomain ? clearbitLogo(companyDomain) : null),
						location: j.location || 'Remote',
						applyUrl: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.id}`,
						postedAt,
						externalId: `remoteok_${j.id}`,
					},
					"remoteok"
				));
			} catch (e) {
				// Skip this job if there's an error
				continue;
			}
		}
		
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
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// WeWorkRemotely now uses a different API structure
		// Try the main listings endpoint
		const url = 'https://weworkremotely.com/remote-jobs.rss';
		
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
				'Accept': 'application/rss+xml, application/xml, text/xml',
			},
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		const xml = await response.text();
		
		// Parse RSS items
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		let match;
		
		while ((match = itemRegex.exec(xml)) !== null) {
			const item = match[1];
			
			const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
				item.match(/<title>(.*?)<\/title>/)?.[1] || '';
			const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
			const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
				item.match(/<description>(.*?)<\/description>/)?.[1] || '';
			const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
			const guid = item.match(/<guid>(.*?)<\/guid>/)?.[1] || link;
			
			// Parse title: usually "Company: Job Title"
			const titleParts = title.split(':');
			const company = titleParts[0]?.trim() || 'Unknown Company';
			const jobTitle = titleParts.slice(1).join(':').trim() || title;
			
			if (title && link) {
				allJobs.push(normalizeATSJob(
					{
						title: jobTitle,
						description: description.replace(/<[^>]*>/g, ''),
						companyName: company,
						companyLogo: clearbitLogo(`${company.toLowerCase().replace(/\s+/g, '')}.com`),
						location: 'Remote',
						applyUrl: link,
						postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
						externalId: `wwr_${Buffer.from(guid).toString('base64').slice(0, 20)}`,
					},
					"remoteok"
				));
			}
		}
		
	} catch (e: any) {
		console.warn(`[Aggregator][WeWorkRemotely] Error:`, e.message);
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
// HACKER NEWS WHO'S HIRING
// Monthly thread with tech job postings
// ============================================

export async function fetchHNWhosHiring(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Get the latest "Who's Hiring" thread from HN
		// These are posted on the 1st of each month by whoishiring
		const searchUrl = 'https://hn.algolia.com/api/v1/search_by_date?query=who%20is%20hiring&tags=ask_hn&hitsPerPage=1';
		
		const searchResponse = await fetchJson<{
			hits: Array<{ objectID: string; title: string; created_at: string }>;
		}>(searchUrl);
		
		if (!searchResponse.hits || searchResponse.hits.length === 0) {
			console.log('[Aggregator][HN] No Who\'s Hiring thread found');
			return [];
		}
		
		const threadId = searchResponse.hits[0].objectID;
		
		// Get comments from the thread (job postings)
		const commentsUrl = `https://hn.algolia.com/api/v1/items/${threadId}`;
		const thread = await fetchJson<{
			children?: Array<{
				id: number;
				text?: string;
				author?: string;
				created_at?: string;
			}>;
		}>(commentsUrl);
		
		if (thread.children) {
			for (const comment of thread.children) {
				if (!comment.text) continue;
				
				// Parse job posting from comment
				// Typical format: "Company | Role | Location | Remote/Onsite | URL"
				const text = comment.text;
				
				// Extract company name (usually first line or before first |)
				const lines = text.split('\n').filter(l => l.trim());
				const firstLine = lines[0] || '';
				const parts = firstLine.split('|').map(p => p.trim());
				
				const company = parts[0]?.replace(/<[^>]*>/g, '').trim() || 'Unknown';
				const title = parts[1]?.replace(/<[^>]*>/g, '').trim() || 'Software Engineer';
				const location = parts[2]?.replace(/<[^>]*>/g, '').trim() || 'Remote';
				
				// Extract URL if present
				const urlMatch = text.match(/https?:\/\/[^\s<"]+/);
				const applyUrl = urlMatch ? urlMatch[0] : `https://news.ycombinator.com/item?id=${comment.id}`;
				
				// Clean description (remove HTML tags)
				const description = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
				
				if (company !== 'Unknown' && description.length > 50) {
					allJobs.push(normalizeATSJob({
						title,
						description,
						companyName: company,
						companyLogo: clearbitLogo(`${company.toLowerCase().replace(/\s+/g, '')}.com`),
						location,
						applyUrl,
						postedAt: comment.created_at || new Date().toISOString(),
						externalId: `hn_${comment.id}`,
					}, 'remoteok'));
				}
			}
		}
		
		console.log(`[Aggregator][HN] Fetched ${allJobs.length} jobs from Who's Hiring`);
		
	} catch (e: any) {
		console.error(`[Aggregator][HN] Error:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// WELLFOUND (ex-AngelList Talent)
// https://wellfound.com/
// Startup-focused job board
// ============================================

export async function fetchWellFound(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// WellFound has a GraphQL API, try the public jobs endpoint
		// Note: This may require adjustments based on their actual API
		const url = 'https://wellfound.com/api/jobs';
		
		// Fallback: Try their public sitemap or RSS
		const categories = ['software-engineer', 'frontend-developer', 'backend-developer', 'full-stack-developer', 'data-scientist', 'product-manager'];
		
		for (const category of categories) {
			try {
				const categoryUrl = `https://wellfound.com/role/${category}`;
				
				// Fetch the page and try to extract job data
				const response = await fetch(categoryUrl, {
					headers: {
						'User-Agent': 'Mozilla/5.0',
						'Accept': 'text/html',
					},
				});
				
				if (!response.ok) continue;
				
				const html = await response.text();
				
				// Try to find embedded JSON data
				const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
				
				if (jsonMatch) {
					try {
						const data = JSON.parse(jsonMatch[1]);
						const jobs = data.props?.pageProps?.jobs || data.props?.pageProps?.startupJobs || [];
						
						for (const job of jobs) {
							allJobs.push(normalizeATSJob({
								title: job.title || job.name || 'Unknown Position',
								description: job.description || job.snippet || '',
								companyName: job.startup?.name || job.company?.name || 'Startup',
								companyLogo: job.startup?.logoUrl || job.company?.logo || null,
								location: job.location || job.remote ? 'Remote' : 'Unknown',
								applyUrl: job.url || `https://wellfound.com/jobs/${job.id}`,
								postedAt: job.createdAt || job.postedAt || new Date().toISOString(),
								externalId: `wellfound_${job.id}`,
							}, 'remoteok'));
						}
					} catch {
						// JSON parsing failed
					}
				}
				
				await new Promise(resolve => setTimeout(resolve, 500));
			} catch {
				// Category fetch failed
			}
		}
		
		console.log(`[Aggregator][WellFound] Fetched ${allJobs.length} jobs`);
		
	} catch (e: any) {
		console.error(`[Aggregator][WellFound] Error:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// BUILTIN
// https://builtin.com/
// Tech jobs in major US cities
// ============================================

export async function fetchBuiltIn(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	// BuiltIn has city-specific sites
	const cities = [
		'',           // builtin.com (all)
		'chicago',    // builtin.chicago
		'nyc',        // builtin.nyc
		'boston',     // builtin.boston
		'la',         // builtin.la
		'seattle',    // builtin.seattle
		'austin',     // builtin.austin
		'colorado',   // builtin.colorado
	];
	
	try {
		for (const city of cities) {
			const baseUrl = city ? `https://builtin.com/${city}` : 'https://builtin.com';
			const jobsUrl = `${baseUrl}/jobs/remote`;
			
			try {
				const response = await fetch(jobsUrl, {
					headers: {
						'User-Agent': 'Mozilla/5.0',
						'Accept': 'text/html',
					},
				});
				
				if (!response.ok) continue;
				
				const html = await response.text();
				
				// Try to extract job data from the page
				// BuiltIn embeds job data in script tags
				const scriptMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/g);
				
				if (scriptMatch) {
					for (const script of scriptMatch) {
						try {
							const jsonStr = script.replace(/<\/?script[^>]*>/g, '');
							const data = JSON.parse(jsonStr);
							
							if (data['@type'] === 'JobPosting') {
								allJobs.push(normalizeATSJob({
									title: data.title || 'Unknown Position',
									description: data.description || '',
									companyName: data.hiringOrganization?.name || 'Unknown Company',
									companyLogo: data.hiringOrganization?.logo || null,
									location: data.jobLocation?.address?.addressLocality || city || 'USA',
									applyUrl: data.url || jobsUrl,
									postedAt: data.datePosted || new Date().toISOString(),
									externalId: `builtin_${data.identifier?.value || Date.now()}`,
								}, 'remoteok'));
							}
						} catch {
							// JSON parsing failed
						}
					}
				}
				
				await new Promise(resolve => setTimeout(resolve, 300));
			} catch {
				// City fetch failed
			}
		}
		
		console.log(`[Aggregator][BuiltIn] Fetched ${allJobs.length} jobs`);
		
	} catch (e: any) {
		console.error(`[Aggregator][BuiltIn] Error:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// LANDING.JOBS
// https://landing.jobs/
// European tech job board
// ============================================

interface LandingJobsResponse {
	offers?: Array<{
		id: number;
		title?: string;
		description?: string;
		company?: { name?: string; logo_url?: string };
		city?: string;
		country?: string;
		remote?: boolean;
		url?: string;
		created_at?: string;
	}>;
}

export async function fetchLandingJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Landing.jobs API
		const url = 'https://landing.jobs/api/v1/offers?limit=100';
		
		const response = await fetchJson<LandingJobsResponse>(url);
		
		if (response.offers) {
			for (const offer of response.offers) {
				const location = [offer.city, offer.country].filter(Boolean).join(', ') || 
					(offer.remote ? 'Remote' : 'Europe');
				
				allJobs.push(normalizeATSJob({
					title: offer.title || 'Unknown Position',
					description: offer.description || '',
					companyName: offer.company?.name || 'Unknown Company',
					companyLogo: offer.company?.logo_url || null,
					location,
					applyUrl: offer.url || `https://landing.jobs/offer/${offer.id}`,
					postedAt: offer.created_at || new Date().toISOString(),
					externalId: `landing_${offer.id}`,
				}, 'remoteok'));
			}
		}
		
		console.log(`[Aggregator][LandingJobs] Fetched ${allJobs.length} jobs`);
		
	} catch (e: any) {
		console.error(`[Aggregator][LandingJobs] Error:`, e.message);
	}
	
	return allJobs;
}

// ============================================
// STARTUP.JOBS
// https://startup.jobs/
// Startup-focused job board
// ============================================

export async function fetchStartupJobs(): Promise<NormalizedATSJob[]> {
	const allJobs: NormalizedATSJob[] = [];
	
	try {
		// Try to get the RSS feed
		const rssUrl = 'https://startup.jobs/feed.xml';
		
		const response = await fetch(rssUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
				'Accept': 'application/rss+xml, application/xml, text/xml',
			},
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		
		const xml = await response.text();
		
		// Parse RSS items
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		let match;
		
		while ((match = itemRegex.exec(xml)) !== null) {
			const item = match[1];
			
			const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
				item.match(/<title>(.*?)<\/title>/)?.[1] || 'Unknown Position';
			const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
			const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
				item.match(/<description>(.*?)<\/description>/)?.[1] || '';
			const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
			const guid = item.match(/<guid>(.*?)<\/guid>/)?.[1] || link;
			
			// Try to extract company from title (usually "Role at Company")
			const titleParts = title.split(' at ');
			const role = titleParts[0] || title;
			const company = titleParts[1] || 'Startup';
			
			if (title && link) {
				allJobs.push(normalizeATSJob({
					title: role,
					description: description.replace(/<[^>]*>/g, ''),
					companyName: company,
					companyLogo: clearbitLogo(`${company.toLowerCase().replace(/\s+/g, '')}.com`),
					location: 'Remote',
					applyUrl: link,
					postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
					externalId: `startupjobs_${Buffer.from(guid).toString('base64').slice(0, 20)}`,
				}, 'remoteok'));
			}
		}
		
		console.log(`[Aggregator][StartupJobs] Fetched ${allJobs.length} jobs`);
		
	} catch (e: any) {
		console.error(`[Aggregator][StartupJobs] Error:`, e.message);
	}
	
	return allJobs;
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
	hnWhosHiring?: boolean;
	wellFound?: boolean;
	builtIn?: boolean;
	landingJobs?: boolean;
	startupJobs?: boolean;
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
	
	// HN Who's Hiring (default enabled)
	if (config.hnWhosHiring !== false) {
		const jobs = await fetchHNWhosHiring();
		allJobs.push(...jobs);
		results.hnWhosHiring = jobs.length;
	}
	
	// WellFound (default enabled)
	if (config.wellFound !== false) {
		const jobs = await fetchWellFound();
		allJobs.push(...jobs);
		results.wellFound = jobs.length;
	}
	
	// BuiltIn (default enabled)
	if (config.builtIn !== false) {
		const jobs = await fetchBuiltIn();
		allJobs.push(...jobs);
		results.builtIn = jobs.length;
	}
	
	// Landing.jobs (default enabled)
	if (config.landingJobs !== false) {
		const jobs = await fetchLandingJobs();
		allJobs.push(...jobs);
		results.landingJobs = jobs.length;
	}
	
	// Startup.jobs (default enabled)
	if (config.startupJobs !== false) {
		const jobs = await fetchStartupJobs();
		allJobs.push(...jobs);
		results.startupJobs = jobs.length;
	}
	
	// Adzuna (requires config)
	if (config.adzuna) {
		const queries = ['software engineer', 'developer', 'product manager', 'designer', 'salesforce'];
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









