/**
 * 🎯 Queue System Types
 * 
 * Defines the data structures for the distributed job fetching queue
 */

import { ATSProvider } from '../types';

export interface FetchTask {
	taskId: string;
	provider: ATSProvider;
	company: string;
	workdayDomain?: string;
	workdaySiteId?: string;
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
	createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
	startedAt?: FirebaseFirestore.Timestamp | null;
	completedAt?: FirebaseFirestore.Timestamp | null;
	executionId: string;
	batchId: string;
	retryCount: number;
	maxRetries: number;
	error?: string | null;
	jobsFetched?: number;
	jobsWritten?: number;
	duration?: number;
}

export interface BatchExecution {
	executionId: string;
	batchId: string;
	status: 'running' | 'completed' | 'failed' | 'partial';
	createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
	completedAt?: FirebaseFirestore.Timestamp | null;
	totalTasks: number;
	completedTasks: number;
	failedTasks: number;
	totalJobsFetched: number;
	totalJobsWritten: number;
	duration?: number;
	errors: Array<{ provider: string; company: string; error: string }>;
}

export interface QueueMetrics {
	date: string; // YYYY-MM-DD
	totalExecutions: number;
	totalJobsFetched: number;
	totalJobsWritten: number;
	successRate: number;
	averageDuration: number;
	providerStats: Record<string, {
		executions: number;
		jobsFetched: number;
		successRate: number;
	}>;
}

export const QUEUE_CONSTANTS = {
	// Task processing
	MAX_RETRIES: 3,
	RETRY_DELAY_BASE_MS: 30000, // 30 seconds
	TASK_TIMEOUT_MS: 540000, // 9 minutes (Cloud Functions max)
	
	// Batch processing
	TASKS_PER_BATCH: 50, // Companies per batch
	CONCURRENT_WORKERS: 10, // Max parallel workers
	BATCH_DELAY_MS: 2000, // Delay between batches
	
	// Collections
	TASKS_COLLECTION: 'fetchTasks',
	EXECUTIONS_COLLECTION: 'fetchExecutions',
	METRICS_COLLECTION: 'fetchMetrics',
	
	// Cleanup
	COMPLETED_TASK_TTL_DAYS: 7,
	FAILED_TASK_TTL_DAYS: 30,
};

