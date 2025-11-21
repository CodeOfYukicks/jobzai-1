import { NormalizedATSJob, ATSProviderConfig } from "../types";
import { normalizeATSJob } from "./normalize";

/* --------------------------------------------------------- */
/*                           FETCH                           */
/* --------------------------------------------------------- */

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

function clearbitFromUrl(url?: string | null): string | null {
	if (!url) return null;
	try {
		const host = new URL(url).host;
		if (!host) return null;
		return `https://logo.clearbit.com/${host}`;
	} catch {
		return null;
	}
}
/* --------------------------------------------------------- */
/*                        GREENHOUSE                         */
/* --------------------------------------------------------- */

export async function fetchGreenhouse(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(companySlug)}/jobs?content=true`;

	const json = await fetchJson<{ jobs: any[] }>(url);

	const list = (json.jobs || []).map((j: any) =>
		normalizeATSJob(
			{
				title: j.title,
				description: j.content || j.description || "",
				companyName: titleCaseCompany(j.company?.name, companySlug),
				companyLogo:
					j.company?.logo_url ||
					clearbitFromUrl(j.absolute_url) ||
					`https://logo.clearbit.com/${companySlug}.com`,
				location: j.location?.name || j.offices?.[0]?.name || "",
				applyUrl: j.absolute_url || j.hosted_url || "",
				postedAt: j.updated_at,
				externalId: j.id,
			},
			"greenhouse"
		)
	);

	console.log(`[ATS][Greenhouse] company=${companySlug} jobs=${list.length}`);
	return list;
}

/* --------------------------------------------------------- */
/*                           LEVER                           */
/* --------------------------------------------------------- */

export async function fetchLever(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}?mode=json`;

	const jobs = await fetchJson<any[]>(url);

	const list = jobs.map((j: any) =>
		normalizeATSJob(
			{
				title: j.text,
				description: j.descriptionPlain,
				companyName: titleCaseCompany(companySlug),
				companyLogo: clearbitFromUrl(j.hostedUrl),
				location: j.categories?.location || "",
				applyUrl: j.hostedUrl,
				postedAt: j.createdAt,
				externalId: j.id,
			},
			"lever"
		)
	);

	console.log(`[ATS][Lever] company=${companySlug} jobs=${list.length}`);
	return list;
}

/* --------------------------------------------------------- */
/*                    SMARTRECRUITERS                        */
/* --------------------------------------------------------- */

export async function fetchSmartRecruiters(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companySlug)}/postings`;
	const json = await fetchJson<{ content: any[] }>(url);
	const postings = json.content || [];
	const list: NormalizedATSJob[] = [];
	for (const p of postings) {
		const id = p.id || p.uuid;
		try {
			const detailUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companySlug)}/postings/${id}`;
			const d = await fetchJson<any>(detailUrl);
			// sections can be an object or an array depending on tenant
			let description = "";
			const sections = d.jobAd?.sections;
			if (Array.isArray(sections)) {
				description = sections.map((s: any) => (typeof s.text === "string" ? s.text : "")).join("\n");
			} else if (sections && typeof sections === "object") {
				// Handle case where sections is an object with keys like jobDescription, qualifications, etc.
				// Each value is an object { title: string, text: string }
				const parts = [];
				if (sections.companyDescription?.text) parts.push(sections.companyDescription.text);
				if (sections.jobDescription?.text) parts.push(sections.jobDescription.text);
				if (sections.qualifications?.text) parts.push(sections.qualifications.text);
				if (sections.additionalInformation?.text) parts.push(sections.additionalInformation.text);

				description = parts.join("\n\n");
			}
			const applyUrl =
				d.applyUrl ||
				p.applyUrl ||
				p.postingUrl ||
				d.externalUrl ||
				(d.ref && typeof d.ref === "string" ? d.ref.replace("api.smartrecruiters.com/v1/companies", "jobs.smartrecruiters.com") : "") ||
				"";
			const logo =
				d.company?.logo?.url ||
				d.company?.logo?.src ||
				clearbitFromUrl(applyUrl) ||
				`https://logo.clearbit.com/${companySlug}.com`;
			list.push(
				normalizeATSJob(
					{
						title: d.name || p.name,
						description,
						companyName: titleCaseCompany(d.company?.identifier || d.company?.name, companySlug),
						companyLogo: logo,
						location: d.location?.city || p.location?.city || "",
						applyUrl,
						postedAt: d.releasedDate || p.releasedDate,
						externalId: String(id),
					},
					"smartrecruiters"
				)
			);
		} catch (e) {
			console.warn(`[ATS][SmartRecruiters] detail fetch failed id=${id}`, e);
			list.push(
				normalizeATSJob(
					{
						title: p.name,
						description: "",
						companyName: titleCaseCompany(p.company?.identifier || p.company?.name, companySlug),
						companyLogo: p.company?.logo?.url || `https://logo.clearbit.com/${companySlug}.com`,
						location: p.location?.city || "",
						applyUrl: p.applyUrl || p.postingUrl || "",
						postedAt: p.releasedDate,
						externalId: String(id),
					},
					"smartrecruiters"
				)
			);
		}
	}
	console.log(`[ATS][SmartRecruiters] company=${companySlug} jobs=${list.length}`);
	return list;
}

/* --------------------------------------------------------- */
/*                          ASHBY                            */
/* --------------------------------------------------------- */

export async function fetchAshby(companySlug: string): Promise<NormalizedATSJob[]> {
	// Ashby API: https://api.ashbyhq.com/posting-api-reference
	// Ashby API: https://api.ashbyhq.com/posting-api-reference
	// const url = `https://api.ashbyhq.com/posting-api-reference/job_board/${companySlug}`;

	// Note: Ashby's public API structure might vary, but typically it's a POST to get listings or a simple GET if they have a public JSON feed.
	// Actually, most Ashby boards are at https://jobs.ashbyhq.com/{company}/api/content
	// Let's try the common public endpoint used by many react-ashby integrations.
	const publicUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}?includeCompensation=true`;

	const json = await fetchJson<any>(publicUrl, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});

	const jobs = json.jobs || [];

	const list = jobs.map((j: any) =>
		normalizeATSJob(
			{
				title: j.title,
				description: j.descriptionHtml || j.description || "",
				companyName: titleCaseCompany(companySlug),
				companyLogo: `https://logo.clearbit.com/${companySlug}.com`, // Ashby doesn't always provide logo in this endpoint
				location: j.location || (j.address ? [j.address.city, j.address.country].filter(Boolean).join(', ') : "") || "",
				applyUrl: j.applyUrl || j.jobUrl,
				postedAt: j.publishedAt,
				externalId: j.id,
			},
			"ashby"
		)
	);

	console.log(`[ATS][Ashby] company=${companySlug} jobs=${list.length}`);
	return list;
}

/* --------------------------------------------------------- */
/*                          WORKDAY                          */
/* --------------------------------------------------------- */

export async function fetchWorkday(companySlug: string, domain: string = 'wd5', siteId?: string): Promise<NormalizedATSJob[]> {
	const site = siteId || companySlug;
	const url = `https://${companySlug}.${domain}.myworkdayjobs.com/wday/cxs/${companySlug}/${site}/jobs`;
	const allJobs: NormalizedATSJob[] = [];
	const limit = 20;

	console.log(`[ATS][Workday] Starting fetch for ${companySlug} (site=${site}, domain=${domain})`);

	try {
		// 1. Fetch first page to get total count
		const firstPage = await fetchJson<any>(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ appliedFacets: {}, limit, offset: 0, searchText: "" }),
		});

		const total = firstPage.total || 0;
		const postings = firstPage.jobPostings || [];

		// Process first page
		const firstJobs = await Promise.all(postings.map((j: any) => normalizeWorkdayJob(j, companySlug, domain, site)));
		allJobs.push(...firstJobs);

		if (total <= limit) {
			console.log(`[ATS][Workday] company=${companySlug} jobs=${allJobs.length}`);
			return allJobs;
		}

		// 2. Calculate remaining offsets
		const offsets: number[] = [];
		for (let offset = limit; offset < total; offset += limit) {
			if (offset > 2000) break; // Safety limit
			offsets.push(offset);
		}

		// 3. Fetch remaining pages in parallel chunks (concurrency 5)
		const chunkedOffsets = [];
		const chunkSize = 5;
		for (let i = 0; i < offsets.length; i += chunkSize) {
			chunkedOffsets.push(offsets.slice(i, i + chunkSize));
		}

		for (const chunk of chunkedOffsets) {
			const promises = chunk.map(async (offset) => {
				try {
					const json = await fetchJson<any>(url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ appliedFacets: {}, limit, offset, searchText: "" }),
					});
					const jobs = await Promise.all((json.jobPostings || []).map((j: any) => normalizeWorkdayJob(j, companySlug, domain, site)));
					return jobs;
				} catch (e) {
					console.error(`[ATS][Workday] Error fetching page offset=${offset} for ${companySlug}`, e);
					return [];
				}
			});

			const results = await Promise.all(promises);
			results.forEach(jobs => allJobs.push(...jobs));
		}

	} catch (e) {
		console.error(`[ATS][Workday] Error fetching initial page for ${companySlug}`, e);
	}

	console.log(`[ATS][Workday] company=${companySlug} jobs=${allJobs.length}`);
	return allJobs;
}

// Helper to fetch raw HTML description for a Workday job when JSON description is missing
async function fetchWorkdayJobHtml(url: string): Promise<string> {
	try {
		const resp = await fetch(url);
		if (!resp.ok) {
			console.warn(`[ATS][Workday] Failed to fetch HTML description from ${url}: ${resp.status}`);
			return '';
		}
		const html = await resp.text();
		// Strip HTML tags, collapse whitespace
		const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		return text;
	} catch (e) {
		console.warn(`[ATS][Workday] Error fetching HTML description from ${url}:`, e);
		return '';
	}
}

// Updated to async to allow HTML fallback for description
async function normalizeWorkdayJob(j: any, companySlug: string, domain: string, siteId?: string): Promise<NormalizedATSJob> {
	// Construct proper Workday URL: https://COMPANY.DOMAIN.myworkdayjobs.com/en-US/SITEID/job/LOCATION/TITLE_JOBID
	const baseUrl = `https://${companySlug}.${domain}.myworkdayjobs.com`;
	let applyUrl = j.externalUrl;

	if (!applyUrl && j.externalPath) {
		// externalPath format: /job/LOCATION/TITLE_JOBID
		// We need: /en-US/SITEID/job/LOCATION/TITLE_JOBID
		const locale = 'en-US';
		const site = siteId || 'External';
		applyUrl = `${baseUrl}/${locale}/${site}${j.externalPath}`;
	}

	// Description: prefer jobPostingInfo, fallback to bulletFields, then postingDescription, then HTML fetch
	let description = j.jobPostingInfo?.jobDescription
		|| (Array.isArray(j.bulletFields) ? j.bulletFields.join('\n') : '')
		|| j.postingDescription
		|| '';
	if (!description && applyUrl) {
		description = await fetchWorkdayJobHtml(applyUrl);
	}
	if (!description) {
		console.warn(`[ATS][Workday] No description found for job ${j.id || j.externalPath}`);
	}

	// Location: use locationsText if present, otherwise fallback to locations array or empty
	const location = j.locationsText || (Array.isArray(j.locations) ? j.locations.join(', ') : '');

	return normalizeATSJob(
		{
			title: j.title,
			description,
			companyName: titleCaseCompany(j.company, companySlug),
			companyLogo: j.companyLogo || clearbitFromUrl(applyUrl || baseUrl),
			location,
			applyUrl: applyUrl || baseUrl,
			postedAt: j.postedOn || j.postingDate,
			externalId: j.id || j.jobPostingId || j.externalPath,
		},
		"workday"
	);
}

/* --------------------------------------------------------- */
/*                   AGGREGATOR (fetchFromATS)               */
/* --------------------------------------------------------- */

export async function fetchFromATS(configs: ATSProviderConfig[]): Promise<NormalizedATSJob[]> {
	const results: NormalizedATSJob[] = [];

	const promises = configs.map(async (src) => {
		try {
			let jobs: NormalizedATSJob[] = [];

			if (src.provider === "greenhouse" && src.company)
				jobs = await fetchGreenhouse(src.company);

			if (src.provider === "lever" && src.company)
				jobs = await fetchLever(src.company);

			if (src.provider === "smartrecruiters" && src.company)
				jobs = await fetchSmartRecruiters(src.company);

			if (src.provider === "workday" && src.company)
				jobs = await fetchWorkday(src.company, src.workdayDomain, src.workdaySiteId);

			if (src.provider === "ashby" && src.company)
				jobs = await fetchAshby(src.company);

			return jobs;
		} catch (e) {
			console.error(`🔥 ATS fetch error → ${src.provider} (${src.company})`, e);
			return [];
		}
	});

	const allJobs = await Promise.all(promises);
	allJobs.forEach(jobs => results.push(...jobs));

	console.log(`[ATS] Aggregated results count=${results.length}`);
	return results;
}
