import { ATSProviderConfig } from './types';
import { generateAllATSSources, COMPANY_COUNTS as _COMPANY_COUNTS } from './data/companyLists';
import { 
	TEAMTAILOR_COMPANIES, 
	BREEZYHR_COMPANIES, 
	RECRUITEE_COMPANIES, 
	PERSONIO_COMPANIES,
	WORKABLE_COMPANIES 
} from './utils/additionalATSFetchers';

// Re-export COMPANY_COUNTS for use by other modules
export const COMPANY_COUNTS = _COMPANY_COUNTS;

/**
 * 🚀 ATS Sources Configuration (v2.0)
 * 
 * Massively expanded company lists (2000+ companies)
 * See functions/src/data/companyLists.ts for the full list
 * 
 * Company counts:
 * - Greenhouse: 800+
 * - Lever: 300+
 * - SmartRecruiters: 400+
 * - Ashby: 200+
 * - Workday: 200+
 * - GAFAM: 4 (Google, Meta, Amazon, Apple via dedicated fetchers)
 * - Additional ATS: Teamtailor, BreezyHR, Recruitee, Personio, Workable
 * - Aggregators: RemoteOK, WeWorkRemotely, HN Who's Hiring, WellFound, BuiltIn, etc.
 */
export const ATS_SOURCES: ATSProviderConfig[] = generateAllATSSources();

// Additional ATS sources (new platforms)
export const ADDITIONAL_ATS_SOURCES = {
	teamtailor: TEAMTAILOR_COMPANIES,
	breezyhr: BREEZYHR_COMPANIES,
	recruitee: RECRUITEE_COMPANIES,
	personio: PERSONIO_COMPANIES,
	workable: WORKABLE_COMPANIES,
};

// Count all sources including additional ATS
const additionalCount = 
	TEAMTAILOR_COMPANIES.length + 
	BREEZYHR_COMPANIES.length + 
	RECRUITEE_COMPANIES.length + 
	PERSONIO_COMPANIES.length +
	WORKABLE_COMPANIES.length;

export const TOTAL_SOURCE_COUNT = {
	..._COMPANY_COUNTS,
	teamtailor: TEAMTAILOR_COMPANIES.length,
	breezyhr: BREEZYHR_COMPANIES.length,
	recruitee: RECRUITEE_COMPANIES.length,
	personio: PERSONIO_COMPANIES.length,
	workable: WORKABLE_COMPANIES.length,
	gafam: 4, // Google, Meta, Amazon, Apple
	total: _COMPANY_COUNTS.total + additionalCount + 4,
};

// Log the loaded sources count
console.log(`[Config] Loaded ${TOTAL_SOURCE_COUNT.total} total sources:`, TOTAL_SOURCE_COUNT);

// Queue configuration for Cloud Tasks
export const QUEUE_CONFIG = {
	fetchJobs: {
		maxConcurrentDispatches: 15,  // Increased from 10 for better throughput
		maxRetries: 3,
		minBackoffSeconds: 60,
	},
	enrichSkills: {
		maxConcurrentDispatches: 50,  // Process up to 50 enrichments in parallel
		maxDispatchesPerSecond: 10,   // Rate limit for OpenAI API
		maxRetries: 2,
		minBackoffSeconds: 30,
	},
};

// Batch sizes for Firestore writes
export const BATCH_SIZES = {
	jobs: 500,              // Write jobs in batches of 500
	enrichmentTasks: 100,   // Create enrichment tasks in batches of 100
};

// GAFAM configuration (handled by dedicated fetchers)
export const GAFAM_CONFIG = {
	google: true,
	meta: true,
	amazon: true,
	apple: true,
};

// Aggregators configuration (all enabled by default)
export const AGGREGATORS_CONFIG = {
	remoteOK: true,
	weWorkRemotely: true,
	hnWhosHiring: true,
	wellFound: true,
	builtIn: true,
	landingJobs: true,
	startupJobs: true,
};

