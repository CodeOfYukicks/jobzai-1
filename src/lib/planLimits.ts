/**
 * Plan Limits Configuration
 * Defines quotas for each plan and credit costs for features
 */

// Plan identifiers
export type PlanId = 'free' | 'standard' | 'premium';

// Feature identifiers
export type FeatureId =
    | 'resumeAnalysis'
    | 'mockInterview'
    | 'campaign'
    | 'aiAssistant'
    | 'premiumTemplates';

// Monthly limits per plan
export interface PlanLimits {
    resumeAnalyses: number;
    mockInterviews: number;
    campaigns: number;
    campaignContacts: number;
    aiMessages: number;
    premiumTemplates: boolean;
}

// Credit costs for each feature (when over quota)
export const CREDIT_COSTS: Record<string, number> = {
    aiMessage: 1,           // Per message
    resumeAnalysis: 25,     // Per analysis
    mockInterview: 50,      // Per session
    campaign: 200,          // Per campaign
    campaignPer100: 200,    // Per 100 emails (2 credits per contact)
};

// Plan limits configuration
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
    free: {
        resumeAnalyses: 1,
        mockInterviews: 0,
        campaigns: 0,
        campaignContacts: 0,
        aiMessages: 10,
        premiumTemplates: false,
    },
    standard: {
        resumeAnalyses: 10,
        mockInterviews: 2,
        campaigns: 2,
        campaignContacts: 200,
        aiMessages: 100,
        premiumTemplates: true,
    },
    premium: {
        resumeAnalyses: 20,
        mockInterviews: 5,
        campaigns: 5,
        campaignContacts: 500,
        aiMessages: 500,
        premiumTemplates: true,
    },
};

// Plan display names
export const PLAN_NAMES: Record<PlanId, string> = {
    free: 'Free Cubber',
    standard: 'Premium Cubber',
    premium: 'Pro Cubber',
};

// Get plan limits for a given plan ID
export const getPlanLimits = (planId: string): PlanLimits => {
    const normalizedPlanId = planId?.toLowerCase() as PlanId;
    return PLAN_LIMITS[normalizedPlanId] || PLAN_LIMITS.free;
};

// Get credit cost for a feature
export const getFeatureCreditCost = (feature: string): number => {
    return CREDIT_COSTS[feature] || 0;
};

// Check if a plan has access to premium templates
export const hasPremiumTemplates = (planId: string): boolean => {
    const limits = getPlanLimits(planId);
    return limits.premiumTemplates;
};

// Get the current month key (YYYY-MM format)
export const getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
