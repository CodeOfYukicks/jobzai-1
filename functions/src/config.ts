import { ATSProviderConfig } from './types';

// Hardcoded ATS sources for ingestion
// NOTE: All providers use the `company` slug. Workday expects the tenant slug.
export const ATS_SOURCES: ATSProviderConfig[] = [
	// Greenhouse
	{ provider: 'greenhouse', company: 'stripe' },
	{ provider: 'greenhouse', company: 'datadoghq' },
	{ provider: 'greenhouse', company: 'airbnb' },
	{ provider: 'greenhouse', company: 'monday' },
	{ provider: 'greenhouse', company: 'rippling' },

	// Lever
	{ provider: 'lever', company: 'brex' },
	{ provider: 'lever', company: 'notion' },
	{ provider: 'lever', company: 'zapier' },

	// SmartRecruiters
	{ provider: 'smartrecruiters', company: 'devoteam' },
	{ provider: 'smartrecruiters', company: 'vestiaire-collective' },
	{ provider: 'smartrecruiters', company: 'aircall' },

	// Workday (tenant slugs)
	{ provider: 'workday', company: 'intuit' },
	{ provider: 'workday', company: 'microsoft' },
	{ provider: 'workday', company: 'google' },
];


