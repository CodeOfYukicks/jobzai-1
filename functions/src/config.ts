import { ATSProviderConfig } from './types';

// Hardcoded ATS sources for ingestion
// NOTE: All providers use the `company` slug. Workday expects the tenant slug.
export const ATS_SOURCES: ATSProviderConfig[] = [
	// ============================================
	// GREENHOUSE - Popular Tech Companies
	// ============================================
	{ provider: 'greenhouse', company: 'stripe' },
	{ provider: 'greenhouse', company: 'datadog' },
	{ provider: 'greenhouse', company: 'airbnb' },
	{ provider: 'greenhouse', company: 'gitlab' },
	{ provider: 'greenhouse', company: 'coinbase' },
	{ provider: 'greenhouse', company: 'robinhood' },
	{ provider: 'greenhouse', company: 'figma' },
	{ provider: 'greenhouse', company: 'discord' },
	{ provider: 'greenhouse', company: 'plaid' },
	{ provider: 'greenhouse', company: 'affirm' },
	{ provider: 'greenhouse', company: 'benchling' },
	{ provider: 'greenhouse', company: 'gusto' },
	{ provider: 'greenhouse', company: 'chime' },
	{ provider: 'greenhouse', company: 'brex' },
	{ provider: 'greenhouse', company: 'amplitude' },
	{ provider: 'greenhouse', company: 'airtable' },
	{ provider: 'greenhouse', company: 'segment' },
	{ provider: 'greenhouse', company: 'dropbox' },
	{ provider: 'greenhouse', company: 'doordash' },
	{ provider: 'greenhouse', company: 'instacart' },
	{ provider: 'greenhouse', company: 'grubhub' },
	{ provider: 'greenhouse', company: 'lyft' },
	{ provider: 'greenhouse', company: 'squarespace' },
	{ provider: 'greenhouse', company: 'etsy' },
	{ provider: 'greenhouse', company: 'pinterest' },
	{ provider: 'greenhouse', company: 'reddit' },
	{ provider: 'greenhouse', company: 'twitch' },
	{ provider: 'greenhouse', company: 'uber' },
	{ provider: 'greenhouse', company: 'asana' },
	{ provider: 'greenhouse', company: 'atlassian' },
	{ provider: 'greenhouse', company: 'autodesk' },
	{ provider: 'greenhouse', company: 'duolingo' },
	{ provider: 'greenhouse', company: 'flexport' },
	{ provider: 'greenhouse', company: 'gitlab' },
	{ provider: 'greenhouse', company: 'hashicorp' },
	{ provider: 'greenhouse', company: 'hudl' },
	{ provider: 'greenhouse', company: 'hubspot' },
	{ provider: 'greenhouse', company: 'intercom' },
	{ provider: 'greenhouse', company: 'databricks' },
	{ provider: 'greenhouse', company: 'snowflake' },
	{ provider: 'greenhouse', company: 'confluent' },
	{ provider: 'greenhouse', company: 'cockroachlabs' },
	{ provider: 'greenhouse', company: 'mongodb' },
	{ provider: 'greenhouse', company: 'elastic' },
	{ provider: 'greenhouse', company: 'cloudflare' },
	{ provider: 'greenhouse', company: 'fastly' },
	{ provider: 'greenhouse', company: 'netlify' },
	{ provider: 'greenhouse', company: 'vercel' },
	{ provider: 'greenhouse', company: 'render' },
	{ provider: 'greenhouse', company: 'fly' },
	{ provider: 'greenhouse', company: 'planetscale' },
	{ provider: 'greenhouse', company: 'supabase' },
	{ provider: 'greenhouse', company: 'neon' },
	{ provider: 'greenhouse', company: 'retool' },
	{ provider: 'greenhouse', company: 'postman' },
	{ provider: 'greenhouse', company: 'miro' },
	{ provider: 'greenhouse', company: 'canva' },
	{ provider: 'greenhouse', company: 'grammarly' },
	{ provider: 'greenhouse', company: 'coursera' },
	{ provider: 'greenhouse', company: 'udemy' },
	{ provider: 'greenhouse', company: 'calm' },
	{ provider: 'greenhouse', company: 'headspace' },
	{ provider: 'greenhouse', company: 'peloton' },
	{ provider: 'greenhouse', company: 'strava' },
	{ provider: 'greenhouse', company: 'allbirds' },
	{ provider: 'greenhouse', company: 'warbyparker' },
	{ provider: 'greenhouse', company: 'glossier' },
	{ provider: 'greenhouse', company: 'sweetgreen' },

	// ============================================
	// LEVER - Popular Tech Companies
	// ============================================
	{ provider: 'lever', company: 'metabase' },
	// Note: Many companies have migrated away from Lever
	// Only keeping verified working sources

	// ============================================
	// SMARTRECRUITERS - European Tech Companies
	// ============================================
	{ provider: 'smartrecruiters', company: 'devoteam' },
	{ provider: 'smartrecruiters', company: 'vestiaire-collective' },
	{ provider: 'smartrecruiters', company: 'aircall' },
	{ provider: 'smartrecruiters', company: 'contentsquare' },
	{ provider: 'smartrecruiters', company: 'dataiku' },
	{ provider: 'smartrecruiters', company: 'doctolib' },
	{ provider: 'smartrecruiters', company: 'deezer' },
	{ provider: 'smartrecruiters', company: 'blablacar' },
	{ provider: 'smartrecruiters', company: 'leboncoin' },
	{ provider: 'smartrecruiters', company: 'meero' },
	{ provider: 'smartrecruiters', company: 'alan' },
	{ provider: 'smartrecruiters', company: 'qonto' },
	{ provider: 'smartrecruiters', company: 'shift-technology' },
	{ provider: 'smartrecruiters', company: 'swile' },
	{ provider: 'smartrecruiters', company: 'spendesk' },
	{ provider: 'smartrecruiters', company: 'ledger' },
	{ provider: 'smartrecruiters', company: 'ivalua' },
	{ provider: 'smartrecruiters', company: 'mirakl' },
	{ provider: 'smartrecruiters', company: 'algolia' },
	{ provider: 'smartrecruiters', company: 'criteo' },

	// ============================================
	// WORKDAY - Enterprise Companies
	// ============================================
	{ provider: 'workday', company: 'nvidia', workdayDomain: 'wd5', workdaySiteId: 'NVIDIAExternalCareerSite' },
	// Note: Workday requires specific domain and siteId verification for each company
	// To add more, visit: https://[company].[domain].myworkdayjobs.com/[siteId]
	// and extract the correct domain (wd1-wd5) and siteId

	// ============================================
	// ASHBY - Startups & Scale-ups (Verified)
	// ============================================
	{ provider: 'ashby', company: 'notion' },
	{ provider: 'ashby', company: 'linear' },
	{ provider: 'ashby', company: 'zapier' },
	{ provider: 'ashby', company: 'replit' },
	{ provider: 'ashby', company: 'ramp' },
	{ provider: 'ashby', company: 'deel' },
	{ provider: 'ashby', company: 'vercel' },
	{ provider: 'ashby', company: 'temporal' },
	// Note: Some Ashby boards may be private or require specific slugs
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

