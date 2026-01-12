/**
 * 💳 Monthly Credit Refresh Scheduler
 *
 * This scheduler runs every day at midnight and refreshes credits for users
 * whose last credit refresh was >= 30 days ago.
 *
 * Works for both monthly and bi-monthly billing:
 * - Monthly billing: Stripe sends invoice.payment_succeeded → credits added
 * - Bi-monthly billing: This scheduler adds credits at month 2 (no payment)
 *
 * **Logic:**
 * 1. Find all users with active paid subscriptions
 * 2. Check if lastCreditRefresh is >= 30 days ago
 * 3. Add credits based on their plan
 * 4. Update lastCreditRefresh timestamp
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const REGION = process.env.FUNCTION_REGION || 'us-central1';

// Plan credits mapping
const PLAN_CREDITS: Record<string, number> = {
    'standard': 250, // Premium plan
    'premium': 500,  // Pro plan
};

export const refreshMonthlyCredits = onSchedule(
    {
        region: REGION,
        schedule: 'every day 00:00', // Run at midnight every day
        timeZone: 'Europe/Paris',
        retryCount: 2,
        maxInstances: 1,
        timeoutSeconds: 300,
        memory: '512MiB',
    },
    async () => {
        const db = admin.firestore();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log(`[CREDIT REFRESH] Starting credit refresh check at ${now.toISOString()}`);
        console.log(`[CREDIT REFRESH] Looking for users with lastCreditRefresh before ${thirtyDaysAgo.toISOString()}`);

        try {
            // Find all users with active subscriptions who need credit refresh
            const usersSnapshot = await db.collection('users')
                .where('paymentStatus', '==', 'active')
                .where('plan', 'in', ['standard', 'premium'])
                .get();

            console.log(`[CREDIT REFRESH] Found ${usersSnapshot.size} users with active subscriptions`);

            let refreshedCount = 0;
            let skippedCount = 0;

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;
                const plan = userData.plan;
                const lastCreditRefresh = userData.lastCreditRefresh?.toDate?.() || userData.planSelectedAt?.toDate?.();

                // Skip if no valid date
                if (!lastCreditRefresh) {
                    console.log(`[CREDIT REFRESH] User ${userId}: No lastCreditRefresh date, skipping`);
                    skippedCount++;
                    continue;
                }

                // Check if 30 days have passed
                const daysSinceRefresh = (now.getTime() - lastCreditRefresh.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSinceRefresh < 30) {
                    console.log(`[CREDIT REFRESH] User ${userId}: Only ${Math.floor(daysSinceRefresh)} days since last refresh, skipping`);
                    skippedCount++;
                    continue;
                }

                // Get credits for this plan
                const creditsToAdd = PLAN_CREDITS[plan];
                if (!creditsToAdd) {
                    console.log(`[CREDIT REFRESH] User ${userId}: Unknown plan "${plan}", skipping`);
                    skippedCount++;
                    continue;
                }

                // Refresh credits
                const currentCredits = userData.credits || 0;
                const newBalance = currentCredits + creditsToAdd;

                await db.collection('users').doc(userId).update({
                    credits: newBalance,
                    lastCreditRefresh: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Record in credit history
                await db.collection('users').doc(userId).collection('creditHistory').add({
                    balance: newBalance,
                    change: creditsToAdd,
                    reason: 'monthly_refresh',
                    planId: plan,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });

                console.log(`[CREDIT REFRESH] User ${userId}: Added ${creditsToAdd} credits (plan: ${plan}), new balance: ${newBalance}`);
                refreshedCount++;
            }

            console.log(`[CREDIT REFRESH] Completed: ${refreshedCount} refreshed, ${skippedCount} skipped`);

            // Store metrics
            await db.collection('creditRefreshMetrics').add({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                usersChecked: usersSnapshot.size,
                usersRefreshed: refreshedCount,
                usersSkipped: skippedCount,
            });

        } catch (error: any) {
            console.error(`[CREDIT REFRESH] Error:`, error);
            throw error;
        }
    }
);
