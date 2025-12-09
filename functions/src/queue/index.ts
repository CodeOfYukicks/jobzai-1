/**
 * 🚀 Queue System Exports
 * 
 * Distributed job fetching system with:
 * - Task creation (scheduled + manual)
 * - Task processing (Firestore trigger + manual)
 * - Queue status monitoring
 * - Failed task retry
 */

// Task Creator
export { 
	createFetchTasks,      // Scheduled task creator (every 6 hours)
	createFetchTasksManual, // Manual HTTP endpoint
	getQueueStatus,        // Queue status endpoint
} from './taskCreator';

// Task Processor
export {
	processFetchTask,      // Firestore trigger for new tasks
	processTaskManual,     // Manual task processing endpoint
	retryFailedTasks,      // Retry failed tasks endpoint
} from './taskProcessor';

// Types
export * from './types';





