export type ATSProvider = 'greenhouse' | 'smartrecruiters';

export interface Job {
	id: string; // ${ats}_${externalId}
	ats: ATSProvider;
	title: string;
	company?: string;
	companyLogo?: string;
	location: string;
	description: string;
	applyUrl: string;
	updatedAt?: Date;
	postedAt?: Date;
	skills?: string[];
	raw?: Record<string, unknown>;
}


