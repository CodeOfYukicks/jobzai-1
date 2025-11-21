import { ATSProviderConfig } from './types';

// Hardcoded ATS sources for ingestion
// NOTE: All providers use the `company` slug. Workday expects the tenant slug.
export const ATS_SOURCES: ATSProviderConfig[] = [
	// Greenhouse
	{ provider: 'greenhouse', company: 'stripe' },
	{ provider: 'greenhouse', company: 'datadog' },
	{ provider: 'greenhouse', company: 'airbnb' },
	// { provider: 'greenhouse', company: 'monday' }, // API not public?
	// { provider: 'greenhouse', company: 'rippling' }, // API not public?

	// Lever
	{ provider: 'lever', company: 'metabase' },
	// { provider: 'lever', company: 'gong' }, // Gong uses Lever but might block bots?

	// SmartRecruiters
	{ provider: 'smartrecruiters', company: 'devoteam' },
	{ provider: 'smartrecruiters', company: 'vestiaire-collective' },
	{ provider: 'smartrecruiters', company: 'aircall' },

	// Workday
	// Nvidia: https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite
	{ provider: 'workday', company: 'nvidia', workdayDomain: 'wd5', workdaySiteId: 'NVIDIAExternalCareerSite' },

	// Ashby
	{ provider: 'ashby', company: 'notion' },
	{ provider: 'ashby', company: 'linear' },
	{ provider: 'ashby', company: 'zapier' },
	{ provider: 'ashby', company: 'replit' },
	{ provider: 'ashby', company: 'ramp' },
	{ provider: 'ashby', company: 'deel' },
];

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

