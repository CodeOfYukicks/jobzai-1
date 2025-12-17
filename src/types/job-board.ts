export interface FilterState {
    employmentType: string[];
    workLocation: string[];
    experienceLevel: string[];
    datePosted: 'any' | 'past24h' | 'pastWeek' | 'pastMonth';
    industries: string[];
    technologies: string[];
    skills: string[];
}

// V6.0 Match Details - Enhanced scoring breakdown with new dimensions
export interface MatchDetails {
    // Core scores
    roleFunctionScore: number;
    skillsScore: number;
    locationScore: number;
    experienceScore: number;
    industryScore: number;
    titleScore: number;
    historyBonus: number;
    environmentBonus: number;
    // V5.0 scores
    salaryScore: number;
    recencyBonus: number;
    careerPrioritiesScore: number;
    feedbackScore: number;
    semanticScore: number; // Embedding-based similarity (0-40)
    collaborativeScore: number; // Based on similar users (0-8)
    profileTagsScore?: number; // V5.1: Profile tags matching
    // V6.0 New scores
    companyNetworkScore?: number; // Match with past employers/clients
    cultureFitScore?: number; // Startup/Enterprise, Remote-first
    educationMatchScore?: number; // Education field matching
    certificationBoost?: number; // Certification bonus points
    // V6.0 Skill gaps (for UI display)
    skillGaps?: string[]; // Skills required by job but missing from user
    matchedCoreSkills?: string[]; // User's core skills that matched
    // Penalties
    dataQualityPenalty: number;
    dealBreakerPenalty: number;
    sectorAvoidPenalty: number;
    domainMismatchPenalty?: number; // V6.0: Tech vs Finance mismatch
}

// V6.0 Match Reason - Structured reason for UI display
export interface MatchReason {
    type: 'skill' | 'experience' | 'location' | 'culture' | 'salary' | 'network' | 'certification' | 'semantic' | 'collaborative';
    icon: string; // Lucide icon name
    text: string;
    strength: 'strong' | 'moderate' | 'weak';
    score?: number; // Optional score contribution
}

// V6.0 Enhanced Match Summary for UI
export interface MatchSummary {
    overallScore: number;
    topReasons: MatchReason[];
    skillGaps: string[];
    matchedSkills: string[];
    fitAnalysis: {
        roleMatch: 'excellent' | 'good' | 'partial' | 'poor';
        skillMatch: 'excellent' | 'good' | 'partial' | 'poor';
        locationMatch: 'excellent' | 'good' | 'partial' | 'poor';
        experienceMatch: 'excellent' | 'good' | 'partial' | 'poor';
    };
}

// Role function types for job classification - V5.0 Extended
export type RoleFunction = 'engineering' | 'sales' | 'marketing' | 'operations' | 'hr' | 'finance' | 'design' | 'data' | 'product' | 'consulting' | 'support' | 'legal' | 'project' | 'customer_success' | 'account_management' | 'business_analysis' | 'other';

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

/**
 * V6.0 Helper function to build MatchSummary from MatchDetails
 */
export function buildMatchSummary(matchScore: number, matchDetails?: MatchDetails, matchReasons?: string[]): MatchSummary | null {
    if (!matchDetails) return null;
    
    const topReasons: MatchReason[] = [];
    
    // Build structured reasons from scores
    if (matchDetails.companyNetworkScore && matchDetails.companyNetworkScore >= 8) {
        topReasons.push({
            type: 'network',
            icon: 'Building2',
            text: matchReasons?.find(r => r.includes('employer') || r.includes('client')) || 'Company in your network',
            strength: 'strong',
            score: matchDetails.companyNetworkScore,
        });
    }
    
    if (matchDetails.skillsScore >= 25) {
        topReasons.push({
            type: 'skill',
            icon: 'Wrench',
            text: matchReasons?.find(r => r.includes('Skills') || r.includes('skills')) || 'Strong skill match',
            strength: matchDetails.skillsScore >= 30 ? 'strong' : 'moderate',
            score: matchDetails.skillsScore,
        });
    }
    
    if (matchDetails.semanticScore >= 28) {
        topReasons.push({
            type: 'semantic',
            icon: 'Brain',
            text: matchReasons?.find(r => r.includes('profile match') || r.includes('alignment')) || 'Profile alignment',
            strength: matchDetails.semanticScore >= 35 ? 'strong' : 'moderate',
            score: matchDetails.semanticScore,
        });
    }
    
    if (matchDetails.locationScore >= 13) {
        topReasons.push({
            type: 'location',
            icon: 'MapPin',
            text: matchReasons?.find(r => r.includes('Remote') || r.includes('Location')) || 'Location match',
            strength: matchDetails.locationScore >= 15 ? 'strong' : 'moderate',
            score: matchDetails.locationScore,
        });
    }
    
    if (matchDetails.experienceScore >= 10) {
        topReasons.push({
            type: 'experience',
            icon: 'TrendingUp',
            text: matchReasons?.find(r => r.includes('level') || r.includes('exp')) || 'Experience level match',
            strength: matchDetails.experienceScore >= 13 ? 'strong' : 'moderate',
            score: matchDetails.experienceScore,
        });
    }
    
    if (matchDetails.certificationBoost && matchDetails.certificationBoost >= 8) {
        topReasons.push({
            type: 'certification',
            icon: 'Award',
            text: matchReasons?.find(r => r.includes('Certification')) || 'Certification bonus',
            strength: matchDetails.certificationBoost >= 12 ? 'strong' : 'moderate',
            score: matchDetails.certificationBoost,
        });
    }
    
    if (matchDetails.cultureFitScore && matchDetails.cultureFitScore >= 5) {
        topReasons.push({
            type: 'culture',
            icon: 'Users',
            text: matchReasons?.find(r => r.includes('environment') || r.includes('focus')) || 'Culture fit',
            strength: matchDetails.cultureFitScore >= 7 ? 'strong' : 'moderate',
            score: matchDetails.cultureFitScore,
        });
    }
    
    if (matchDetails.salaryScore >= 7) {
        topReasons.push({
            type: 'salary',
            icon: 'DollarSign',
            text: matchReasons?.find(r => r.includes('Salary') || r.includes('salary')) || 'Salary match',
            strength: matchDetails.salaryScore >= 10 ? 'strong' : 'moderate',
            score: matchDetails.salaryScore,
        });
    }
    
    // Determine fit levels
    const getFitLevel = (score: number, thresholds: { excellent: number; good: number; partial: number }): 'excellent' | 'good' | 'partial' | 'poor' => {
        if (score >= thresholds.excellent) return 'excellent';
        if (score >= thresholds.good) return 'good';
        if (score >= thresholds.partial) return 'partial';
        return 'poor';
    };
    
    return {
        overallScore: matchScore,
        topReasons: topReasons.slice(0, 4),
        skillGaps: matchDetails.skillGaps || [],
        matchedSkills: matchDetails.matchedCoreSkills || [],
        fitAnalysis: {
            roleMatch: getFitLevel(matchDetails.roleFunctionScore, { excellent: 20, good: 10, partial: 0 }),
            skillMatch: getFitLevel(matchDetails.skillsScore, { excellent: 28, good: 18, partial: 8 }),
            locationMatch: getFitLevel(matchDetails.locationScore, { excellent: 13, good: 8, partial: 3 }),
            experienceMatch: getFitLevel(matchDetails.experienceScore, { excellent: 12, good: 8, partial: 4 }),
        },
    };
}
