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
				description =
					sections.jobDescription ||
					sections.companyDescription ||
					sections.qualifications ||
					"";
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
/*                          WORKDAY                          */
/* --------------------------------------------------------- */

export async function fetchWorkday(companySlug: string): Promise<NormalizedATSJob[]> {
	const url = `https://${companySlug}.wd5.myworkdayjobs.com/wday/cxs/${companySlug}/${companySlug}/jobs`;

	const json = await fetchJson<any>(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			appliedFacets: {},
			limit: 100,
			offset: 0,
			searchText: "",
		}),
	});

	const list = (json?.jobPostings || []).map((j: any) =>
		normalizeATSJob(
			{
				title: j.title,
				description:
					j.jobPostingInfo?.jobDescription || j.postingDescription || "",
				companyName: titleCaseCompany(j.company, companySlug),
				companyLogo: j.companyLogo || clearbitFromUrl(j.externalUrl || (j.externalPath ? `https://${companySlug}.wd5.myworkdayjobs.com${j.externalPath}` : "")),
				location: j.location || (j.locations ? j.locations.join(", ") : "") || "",
				applyUrl: j.externalUrl || (j.externalPath ? `https://${companySlug}.wd5.myworkdayjobs.com${j.externalPath}` : ""),
				postedAt: j.postedOn || j.postingDate,
				externalId: j.id || j.jobPostingId || j.externalPath,
			},
			"workday"
		)
	);

	console.log(`[ATS][Workday] company=${companySlug} jobs=${list.length}`);
	return list;
}

/* --------------------------------------------------------- */
/*                   AGGREGATOR (fetchFromATS)               */
/* --------------------------------------------------------- */

export async function fetchFromATS(configs: ATSProviderConfig[]): Promise<NormalizedATSJob[]> {
	const results: NormalizedATSJob[] = [];

	for (const src of configs) {
		try {
			let jobs: NormalizedATSJob[] = [];

			if (src.provider === "greenhouse" && src.company)
				jobs = await fetchGreenhouse(src.company);

			if (src.provider === "lever" && src.company)
				jobs = await fetchLever(src.company);

			if (src.provider === "smartrecruiters" && src.company)
				jobs = await fetchSmartRecruiters(src.company);

			if (src.provider === "workday" && src.company)
				jobs = await fetchWorkday(src.company);

			results.push(...jobs);
		} catch (e) {
			console.error(`🔥 ATS fetch error → ${src.provider} (${src.company})`, e);
		}
	}

	console.log(`[ATS] Aggregated results count=${results.length}`);
	return results;
}
