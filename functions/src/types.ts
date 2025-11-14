export type ATSProvider = 'greenhouse' | 'lever' | 'smartrecruiters' | 'workday';

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
}


