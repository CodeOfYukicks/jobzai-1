/**
 * Track Job Interaction Cloud Function
 * 
 * Records user interactions with jobs for feedback loop:
 * - view: User opened job details
 * - click: User clicked on a job card
 * - save: User saved job for later
 * - apply: User clicked apply
 * - dismiss: User marked as "not interested"
 * - hide: User explicitly hid the job
 * 
 * Collection: userJobInteractions
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const REGION = 'us-central1';

// Interaction types
type InteractionType = 'view' | 'click' | 'save' | 'unsave' | 'apply' | 'dismiss' | 'hide';

interface TrackInteractionRequest {
    userId: string;
    jobId: string;
    action: InteractionType;
    timeSpentMs?: number; // For views - how long user viewed the job
    metadata?: {
        source?: 'for_you' | 'explore' | 'search';
        matchScore?: number;
        position?: number; // Position in the list when clicked
    };
}

interface JobInteraction {
    id?: string;
    userId: string;
    jobId: string;
    action: InteractionType;
    timestamp: admin.firestore.FieldValue;
    timeSpentMs?: number;
    metadata?: {
        source?: string;
        matchScore?: number;
        position?: number;
    };
}

// Helper to get or create user's saved jobs list
async function updateSavedJobs(db: admin.firestore.Firestore, userId: string, jobId: string, action: 'add' | 'remove'): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    
    if (action === 'add') {
        await userRef.update({
            savedJobs: admin.firestore.FieldValue.arrayUnion(jobId),
            lastSavedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
        await userRef.update({
            savedJobs: admin.firestore.FieldValue.arrayRemove(jobId)
        });
    }
}

// Helper to get or create user's dismissed jobs list
async function updateDismissedJobs(db: admin.firestore.Firestore, userId: string, jobId: string, action: 'add' | 'remove'): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    
    if (action === 'add') {
        await userRef.update({
            dismissedJobs: admin.firestore.FieldValue.arrayUnion(jobId),
            lastDismissedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
        await userRef.update({
            dismissedJobs: admin.firestore.FieldValue.arrayRemove(jobId)
        });
    }
}

export const trackJobInteraction = onRequest({
    region: REGION,
    cors: true,
    maxInstances: 20,
    invoker: 'public',
}, async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }

    try {
        const db = admin.firestore();
        const body = req.body as TrackInteractionRequest;

        // Validate required fields
        if (!body.userId || !body.jobId || !body.action) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, jobId, action'
            });
            return;
        }

        // Validate action type
        const validActions: InteractionType[] = ['view', 'click', 'save', 'unsave', 'apply', 'dismiss', 'hide'];
        if (!validActions.includes(body.action)) {
            res.status(400).json({
                success: false,
                message: `Invalid action. Must be one of: ${validActions.join(', ')}`
            });
            return;
        }

        // Create interaction document
        const interaction: JobInteraction = {
            userId: body.userId,
            jobId: body.jobId,
            action: body.action,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (body.timeSpentMs) {
            interaction.timeSpentMs = body.timeSpentMs;
        }

        if (body.metadata) {
            interaction.metadata = body.metadata;
        }

        // Write to Firestore
        const docRef = await db.collection('userJobInteractions').add(interaction);

        // Handle special actions that update user document
        if (body.action === 'save') {
            await updateSavedJobs(db, body.userId, body.jobId, 'add');
        } else if (body.action === 'unsave') {
            await updateSavedJobs(db, body.userId, body.jobId, 'remove');
        } else if (body.action === 'dismiss' || body.action === 'hide') {
            await updateDismissedJobs(db, body.userId, body.jobId, 'add');
        }

        // If it's an apply action, also track in applications collection
        if (body.action === 'apply') {
            await db.collection('users').doc(body.userId).update({
                appliedJobs: admin.firestore.FieldValue.arrayUnion(body.jobId),
                lastAppliedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(200).json({
            success: true,
            interactionId: docRef.id,
            message: `Tracked ${body.action} interaction`
        });

    } catch (error: any) {
        console.error('Error tracking interaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track interaction',
            error: error.message
        });
    }
});

/**
 * Get user's saved jobs
 */
export const getSavedJobs = onRequest({
    region: REGION,
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const db = admin.firestore();
        const userId = req.query.userId as string;

        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' });
            return;
        }

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const userData = userDoc.data();
        const savedJobIds = userData?.savedJobs || [];

        if (savedJobIds.length === 0) {
            res.status(200).json({ success: true, jobs: [], count: 0 });
            return;
        }

        // Fetch job details
        const jobsPromises = savedJobIds.slice(0, 50).map((jobId: string) =>
            db.collection('jobs').doc(jobId).get()
        );
        const jobDocs = await Promise.all(jobsPromises);

        const jobs = jobDocs
            .filter(doc => doc.exists)
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        res.status(200).json({
            success: true,
            jobs,
            count: jobs.length,
            totalSaved: savedJobIds.length
        });

    } catch (error: any) {
        console.error('Error getting saved jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get saved jobs',
            error: error.message
        });
    }
});

/**
 * Get user's interaction history for analytics
 */
export const getUserInteractionStats = onRequest({
    region: REGION,
    cors: true,
    maxInstances: 5,
    invoker: 'public',
}, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const db = admin.firestore();
        const userId = req.query.userId as string;

        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' });
            return;
        }

        // Get last 30 days of interactions
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const interactionsQuery = db.collection('userJobInteractions')
            .where('userId', '==', userId)
            .where('timestamp', '>=', thirtyDaysAgo)
            .orderBy('timestamp', 'desc')
            .limit(500);

        const snapshot = await interactionsQuery.get();

        // Aggregate stats
        const stats = {
            totalInteractions: snapshot.size,
            views: 0,
            clicks: 0,
            saves: 0,
            applies: 0,
            dismisses: 0,
            avgTimeSpentMs: 0,
            topViewedJobs: [] as string[],
            recentActivity: [] as any[],
        };

        let totalTimeSpent = 0;
        let timeSpentCount = 0;
        const jobViewCounts: Record<string, number> = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            switch (data.action) {
                case 'view': stats.views++; break;
                case 'click': stats.clicks++; break;
                case 'save': stats.saves++; break;
                case 'apply': stats.applies++; break;
                case 'dismiss':
                case 'hide': stats.dismisses++; break;
            }

            if (data.timeSpentMs) {
                totalTimeSpent += data.timeSpentMs;
                timeSpentCount++;
            }

            if (data.action === 'view') {
                jobViewCounts[data.jobId] = (jobViewCounts[data.jobId] || 0) + 1;
            }
        });

        stats.avgTimeSpentMs = timeSpentCount > 0 ? Math.round(totalTimeSpent / timeSpentCount) : 0;
        stats.topViewedJobs = Object.entries(jobViewCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([jobId]) => jobId);

        // Get recent activity (last 10)
        stats.recentActivity = snapshot.docs.slice(0, 10).map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null
        }));

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error: any) {
        console.error('Error getting interaction stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get interaction stats',
            error: error.message
        });
    }
});






