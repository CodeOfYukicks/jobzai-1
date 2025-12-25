import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    PLAN_LIMITS,
    CREDIT_COSTS,
    getPlanLimits,
    getCurrentMonthKey,
    type PlanId,
    type PlanLimits
} from '../lib/planLimits';
import { recordCreditHistory } from '../lib/creditHistory';

// Usage data structure
export interface UsageData {
    resumeAnalyses: number;
    mockInterviews: number;
    liveSessions: number;
    campaignsCreated: number;
    campaignContactsSent: number;
    aiMessages: number;
    lastUpdated: Date;
}

// Return type for the hook
export interface PlanLimitsHook {
    // User data
    userPlan: PlanId;
    userCredits: number;
    planLimits: PlanLimits;
    usage: UsageData;
    isLoading: boolean;

    // Quota checking
    getRemainingQuota: (feature: keyof UsageData) => number;
    canUseForFree: (feature: keyof UsageData) => boolean;
    getUsageStats: (feature: keyof UsageData) => { used: number; limit: number; remaining: number; percentage: number };

    // Feature usage
    checkAndUseFeature: (feature: string, count?: number) => Promise<{ success: boolean; usedCredits: boolean; creditCost?: number; error?: string }>;

    // Utility
    refetch: () => Promise<void>;
}

// Map feature keys to usage keys
const featureToUsageKey: Record<string, keyof UsageData> = {
    resumeAnalysis: 'resumeAnalyses',
    resumeAnalyses: 'resumeAnalyses',
    mockInterview: 'mockInterviews',
    mockInterviews: 'mockInterviews',
    liveSession: 'liveSessions',
    liveSessions: 'liveSessions',
    campaign: 'campaignsCreated',
    campaignsCreated: 'campaignsCreated',
    campaignContact: 'campaignContactsSent',
    campaignContactsSent: 'campaignContactsSent',
    aiMessage: 'aiMessages',
    aiMessages: 'aiMessages',
};

// Map feature keys to limit keys
const featureToLimitKey: Record<string, keyof PlanLimits> = {
    resumeAnalysis: 'resumeAnalyses',
    resumeAnalyses: 'resumeAnalyses',
    mockInterview: 'mockInterviews',
    mockInterviews: 'mockInterviews',
    liveSession: 'liveSessions',
    liveSessions: 'liveSessions',
    campaign: 'campaigns',
    campaigns: 'campaigns',
    campaignsCreated: 'campaigns',
    campaignContact: 'campaignContacts',
    campaignContacts: 'campaignContacts',
    campaignContactsSent: 'campaignContacts',
    aiMessage: 'aiMessages',
    aiMessages: 'aiMessages',
};

const defaultUsage: UsageData = {
    resumeAnalyses: 0,
    mockInterviews: 0,
    liveSessions: 0,
    campaignsCreated: 0,
    campaignContactsSent: 0,
    aiMessages: 0,
    lastUpdated: new Date(),
};

export function usePlanLimits(): PlanLimitsHook {
    const { currentUser } = useAuth();
    const [userPlan, setUserPlan] = useState<PlanId>('free');
    const [userCredits, setUserCredits] = useState(0);
    const [usage, setUsage] = useState<UsageData>(defaultUsage);
    const [isLoading, setIsLoading] = useState(true);

    const planLimits = getPlanLimits(userPlan);

    // Fetch user data and usage
    const fetchData = useCallback(async () => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        try {
            // Get user data
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setUserPlan((userData.plan || 'free') as PlanId);
                setUserCredits(userData.credits || 0);
            }

            // Get current month usage
            const monthKey = getCurrentMonthKey();
            const usageRef = doc(db, 'users', currentUser.uid, 'usage', monthKey);
            const usageSnap = await getDoc(usageRef);

            if (usageSnap.exists()) {
                const usageData = usageSnap.data() as UsageData;
                setUsage({
                    ...defaultUsage,
                    ...usageData,
                    lastUpdated: usageData.lastUpdated instanceof Date
                        ? usageData.lastUpdated
                        : new Date(),
                });
            } else {
                // Create usage document if it doesn't exist
                await setDoc(usageRef, {
                    ...defaultUsage,
                    lastUpdated: new Date(),
                });
                setUsage(defaultUsage);
            }
        } catch (error) {
            console.error('Error fetching plan limits data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // Subscribe to user changes
    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Subscribe to user document for real-time credits updates
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
                const userData = snap.data();
                setUserPlan((userData.plan || 'free') as PlanId);
                setUserCredits(userData.credits || 0);
            }
        });

        // Subscribe to usage document
        const monthKey = getCurrentMonthKey();
        const usageRef = doc(db, 'users', currentUser.uid, 'usage', monthKey);
        const unsubscribeUsage = onSnapshot(usageRef, (snap) => {
            if (snap.exists()) {
                const usageData = snap.data() as UsageData;
                setUsage({
                    ...defaultUsage,
                    ...usageData,
                });
            }
            setIsLoading(false);
        });

        // Initial fetch to create usage doc if needed
        fetchData();

        return () => {
            unsubscribeUser();
            unsubscribeUsage();
        };
    }, [currentUser, fetchData]);

    // Get remaining quota for a feature
    const getRemainingQuota = useCallback((feature: keyof UsageData): number => {
        const limitKey = featureToLimitKey[feature] || feature;
        const limit = (planLimits as any)[limitKey] || 0;
        const used = usage[feature] || 0;
        return Math.max(0, limit - used);
    }, [planLimits, usage]);

    // Check if user can use feature for free (within quota)
    const canUseForFree = useCallback((feature: keyof UsageData): boolean => {
        return getRemainingQuota(feature) > 0;
    }, [getRemainingQuota]);

    // Get usage stats for a feature
    const getUsageStats = useCallback((feature: keyof UsageData) => {
        const limitKey = featureToLimitKey[feature] || feature;
        const limit = (planLimits as any)[limitKey] || 0;
        const used = usage[feature] || 0;
        const remaining = Math.max(0, limit - used);
        const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

        return { used, limit, remaining, percentage };
    }, [planLimits, usage]);

    // Check and use a feature (increment usage or deduct credits)
    const checkAndUseFeature = useCallback(async (
        feature: string,
        count: number = 1
    ): Promise<{ success: boolean; usedCredits: boolean; creditCost?: number; error?: string }> => {
        if (!currentUser) {
            return { success: false, usedCredits: false, error: 'Not authenticated' };
        }

        const usageKey = featureToUsageKey[feature];
        const limitKey = featureToLimitKey[feature];

        if (!usageKey || !limitKey) {
            return { success: false, usedCredits: false, error: 'Unknown feature' };
        }

        const limit = (planLimits as any)[limitKey] || 0;
        const currentUsage = (usage as any)[usageKey] || 0;
        const remaining = Math.max(0, limit - currentUsage);

        try {
            const monthKey = getCurrentMonthKey();
            const usageRef = doc(db, 'users', currentUser.uid, 'usage', monthKey);
            const userRef = doc(db, 'users', currentUser.uid);

            if (remaining >= count) {
                // User has quota - use it for free
                await updateDoc(usageRef, {
                    [usageKey]: currentUsage + count,
                    lastUpdated: new Date(),
                });

                return { success: true, usedCredits: false };
            } else {
                // User exceeded quota - need to use credits
                const creditCost = CREDIT_COSTS[feature] * count;

                if (userCredits < creditCost) {
                    return {
                        success: false,
                        usedCredits: false,
                        error: `Not enough credits. Need ${creditCost}, have ${userCredits}`
                    };
                }

                // Deduct credits and increment usage
                const newBalance = userCredits - creditCost;
                await updateDoc(userRef, {
                    credits: newBalance,
                });

                await updateDoc(usageRef, {
                    [usageKey]: currentUsage + count,
                    lastUpdated: new Date(),
                });

                // Record in credit history for billing visibility
                await recordCreditHistory(
                    currentUser.uid,
                    newBalance,
                    -creditCost,  // negative = spent
                    feature,      // reason: mockInterview, resumeAnalysis, campaign, etc.
                    undefined     // no reference ID needed
                );

                return { success: true, usedCredits: true, creditCost };
            }
        } catch (error: any) {
            console.error('Error using feature:', error);
            return { success: false, usedCredits: false, error: error.message };
        }
    }, [currentUser, planLimits, usage, userCredits]);

    return {
        userPlan,
        userCredits,
        planLimits,
        usage,
        isLoading,
        getRemainingQuota,
        canUseForFree,
        getUsageStats,
        checkAndUseFeature,
        refetch: fetchData,
    };
}

export default usePlanLimits;
