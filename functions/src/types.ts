export type ATSProvider = 
	| 'greenhouse' 
	| 'lever' 
	| 'smartrecruiters' 
	| 'workday' 
	| 'ashby'
	| 'recruitee'
	| 'personio'
	| 'breezyhr'
	| 'teamtailor'
	| 'workable'
	| 'remoteok'
	| 'adzuna'
	// GAFAM Direct
	| 'google'
	| 'meta'
	| 'amazon'
	| 'apple';

export interface UserProfile {
	name: string;
	email: string;
	currentRole: string;
	skills: string[];
	yearsExperience: number;
	location: string;
	preferences: {
		remote: boolean;
		seniority: string[];
		domains: string[];
	};
	embedding?: number[];
}

export interface JobDocument {
	title: string;
	company: string;
	companyLogo?: string | null;
	location: string;
	description: string;
	skills: string[];
	applyUrl: string;
	ats: string;
	externalId: string;
	postedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
	embedding?: number[];
	// Enrichment tracking
	enrichmentStatus?: 'pending' | 'completed' | 'failed' | null;
	enrichedAt?: FirebaseFirestore.Timestamp | null;
}

export interface MatchDocument {
	userId: string;
	jobId: string;
	score: number;
	viewed: boolean;
}

export interface NormalizedATSJob {
	title: string;
	company: string;
	companyLogo?: string | null;
	location: string;
	description: string;
	applyUrl: string;
	postedAt: any;
	skills: string[];
	externalId: string;
	ats: string;
}

export interface ATSProviderConfig {
	provider: ATSProvider;
	// Sources use company slug across all providers
	company?: string;
	url?: string; // optional legacy support
	// Workday specific config
	workdayDomain?: string; // e.g. 'wd5', 'wd1' (default: 'wd5')
	workdaySiteId?: string; // e.g. 'External_Career_Site', 'puma_external' (default: same as company)
}


