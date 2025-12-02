/**
 * 🌐 Job Aggregators Module Exports
 * 
 * External job aggregator APIs for expanded coverage
 */

export {
	fetchRemoteOK,
	fetchWeWorkRemotely,
	fetchAdzuna,
	fetchGitHubJobs,
	fetchAuthenticJobs,
	fetchAllAggregators,
} from './jobAggregators';

export type { AggregatorConfig } from './jobAggregators';

// Cloud Functions
export {
	fetchFromAggregators,     // Scheduled fetch (every 12 hours)
	fetchAggregatorsManual,   // Manual fetch endpoint
} from './aggregatorFetcher';

