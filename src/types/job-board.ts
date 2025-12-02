export interface FilterState {
    employmentType: string[];
    workLocation: string[];
    experienceLevel: string[];
    datePosted: 'any' | 'past24h' | 'pastWeek' | 'pastMonth';
    industries: string[];
    technologies: string[];
    skills: string[];
}

// V4.0 Match Details - Updated scoring breakdown
export interface MatchDetails {
    // V4.0 scores
    roleFunctionScore: number;
    skillsScore: number;
    locationScore: number;
    experienceScore: number;
    industryScore: number;
    titleScore: number;
    historyBonus: number;
    environmentBonus: number;
    // Penalties
    dataQualityPenalty: number;
    dealBreakerPenalty: number;
    sectorAvoidPenalty: number;
}

// Role function types for job classification
export type RoleFunction = 'engineering' | 'sales' | 'marketing' | 'operations' | 'hr' | 'finance' | 'design' | 'data' | 'product' | 'consulting' | 'support' | 'legal' | 'other';

export interface Job {
    id: string;
    title: string;
    company: string;
    logoUrl?: string;
    location: string;
    type?: string;
    postedAt?: any;
    published?: string; // Formatted date
    description?: string;
    summary?: string;
    applyUrl?: string;
    salaryRange?: string;
    remote?: string;
    seniority?: string;
    skills?: string[];
    industries?: string[];
    technologies?: string[];
    tags?: string[];
    
    // V4.0 enrichment fields
    roleFunction?: RoleFunction;
    languageRequirements?: string[];
    enrichmentQuality?: number;
    
    // Match scoring (For You mode)
    matchScore?: number;
    matchDetails?: MatchDetails;
    matchReasons?: string[];
    excludeReasons?: string[];
}
