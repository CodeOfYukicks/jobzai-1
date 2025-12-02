import { ATSProviderConfig } from './types';
import { generateAllATSSources, COMPANY_COUNTS as _COMPANY_COUNTS } from './data/companyLists';

// Re-export COMPANY_COUNTS for use by other modules
export const COMPANY_COUNTS = _COMPANY_COUNTS;

/**
 * 🚀 ATS Sources Configuration
 * 
 * Now loading from massive company lists (500+ companies)
 * See functions/src/data/companyLists.ts for the full list
 * 
 * Company counts:
 * - Greenhouse: 400+
 * - Lever: 100+
 * - SmartRecruiters: 150+
 * - Ashby: 150+
 * - Workday: 50+
 */
export const ATS_SOURCES: ATSProviderConfig[] = generateAllATSSources();

// Log the loaded sources count
console.log(`[Config] Loaded ${ATS_SOURCES.length} ATS sources:`, _COMPANY_COUNTS);

// Queue configuration for Cloud Tasks
export const QUEUE_CONFIG = {
	fetchJobs: {
		maxConcurrentDispatches: 10,  // Process up to 10 sources in parallel
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

