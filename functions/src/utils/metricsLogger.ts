import * as admin from 'firebase-admin';

/**
 * Centralized metrics logging for ATS job fetching and enrichment
 */

export interface FetchMetrics {
    executionId: string;
    provider: string;
    company: string;
    timestamp: admin.firestore.Timestamp;
    status: 'success' | 'failed' | 'partial';
    jobsFetched: number;
    jobsWritten: number;
    jobsFailed: number;
    enrichmentTasksCreated: number;
    duration: number;
    error?: string;
}

export interface EnrichmentMetrics {
    jobId: string;
    timestamp: admin.firestore.Timestamp;
    status: 'success' | 'failed';
    skillsExtracted: number;
    duration?: number;
    error?: string;
}

export interface AggregatedMetrics {
    executionId: string;
    timestamp: admin.firestore.Timestamp;
    totalSources: number;
    sourcesCompleted: number;
    sourcesFailed: number;
    totalJobsFetched: number;
    totalJobsWritten: number;
    totalEnrichmentTasks: number;
    duration: number;
    status: 'in_progress' | 'completed' | 'failed';
}

export class MetricsLogger {
    private db: admin.firestore.Firestore;

    constructor(db: admin.firestore.Firestore) {
        this.db = db;
    }

    /**
     * Log metrics for a single ATS source fetch
     */
    async logFetchMetrics(metrics: FetchMetrics): Promise<void> {
        try {
            const docId = `${metrics.executionId}_${metrics.provider}_${metrics.company}`;
            await this.db.collection('jobFetchMetrics').doc(docId).set({
                ...metrics,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[MetricsLogger] Logged fetch metrics for ${metrics.provider}/${metrics.company}`);
        } catch (error: any) {
            console.error(`[MetricsLogger] Failed to log fetch metrics:`, error.message);
        }
    }

    /**
     * Log metrics for skill enrichment
     */
    async logEnrichmentMetrics(metrics: EnrichmentMetrics): Promise<void> {
        try {
            await this.db.collection('enrichmentMetrics').add({
                ...metrics,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error: any) {
            console.error(`[MetricsLogger] Failed to log enrichment metrics:`, error.message);
        }
    }

    /**
     * Create or update aggregated metrics for an execution
     */
    async updateAggregatedMetrics(
        executionId: string,
        update: Partial<AggregatedMetrics>
    ): Promise<void> {
        try {
            const docRef = this.db.collection('aggregatedFetchMetrics').doc(executionId);
            await docRef.set({
                executionId,
                ...update,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        } catch (error: any) {
            console.error(`[MetricsLogger] Failed to update aggregated metrics:`, error.message);
        }
    }

    /**
     * Get metrics for a specific execution
     */
    async getExecutionMetrics(executionId: string): Promise<FetchMetrics[]> {
        try {
            const snapshot = await this.db.collection('jobFetchMetrics')
                .where('executionId', '==', executionId)
                .get();

            return snapshot.docs.map(doc => doc.data() as FetchMetrics);
        } catch (error: any) {
            console.error(`[MetricsLogger] Failed to get execution metrics:`, error.message);
            return [];
        }
    }

    /**
     * Get recent fetch metrics
     */
    async getRecentMetrics(limit: number = 50): Promise<FetchMetrics[]> {
        try {
            const snapshot = await this.db.collection('jobFetchMetrics')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => doc.data() as FetchMetrics);
        } catch (error: any) {
            console.error(`[MetricsLogger] Failed to get recent metrics:`, error.message);
            return [];
        }
    }
}
