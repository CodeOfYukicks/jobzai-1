/**
 * Background Task Service
 * Manages long-running tasks (like CV generation) that should continue
 * even if the user leaves the page or refreshes
 * 
 * Tasks are stored in Firestore for persistence
 */

import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, Unsubscribe, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type TaskType = 'cv_rewrite' | 'ats_analysis' | 'cover_letter';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface BackgroundTask {
  id: string;
  userId: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  step: number;
  stepLabel?: string;
  
  // Task-specific data
  analysisId?: string;
  jobTitle?: string;
  company?: string;
  adaptationLevel?: string;
  
  // Input data for the task (stored to resume if needed)
  inputData?: any;
  
  // Result when completed
  result?: any;
  
  // Error info if failed
  error?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // For notification
  notificationShown?: boolean;
}

/**
 * Create a new background task
 */
export async function createBackgroundTask(
  userId: string,
  type: TaskType,
  data: Partial<BackgroundTask>
): Promise<string> {
  const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task: BackgroundTask = {
    id: taskId,
    userId,
    type,
    status: 'pending',
    progress: 0,
    step: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  
  await setDoc(doc(db, 'users', userId, 'backgroundTasks', taskId), task);
  
  console.log(`📋 Background task created: ${taskId}`);
  return taskId;
}

/**
 * Update task progress
 */
export async function updateTaskProgress(
  userId: string,
  taskId: string,
  progress: number,
  step: number,
  stepLabel?: string
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'backgroundTasks', taskId), {
    progress,
    step,
    stepLabel: stepLabel || null,
    status: 'in_progress',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Mark task as completed
 */
export async function completeTask(
  userId: string,
  taskId: string,
  result?: any
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'backgroundTasks', taskId), {
    status: 'completed',
    progress: 100,
    result: result || null,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notificationShown: false,
  });
  
  console.log(`✅ Background task completed: ${taskId}`);
}

/**
 * Mark task as failed
 */
export async function failTask(
  userId: string,
  taskId: string,
  error: string
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'backgroundTasks', taskId), {
    status: 'failed',
    error,
    updatedAt: new Date().toISOString(),
    notificationShown: false,
  });
  
  console.error(`❌ Background task failed: ${taskId}`, error);
}

/**
 * Mark notification as shown
 */
export async function markNotificationShown(
  userId: string,
  taskId: string
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'backgroundTasks', taskId), {
    notificationShown: true,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Get a specific task
 */
export async function getTask(
  userId: string,
  taskId: string
): Promise<BackgroundTask | null> {
  const docSnap = await getDoc(doc(db, 'users', userId, 'backgroundTasks', taskId));
  if (docSnap.exists()) {
    return docSnap.data() as BackgroundTask;
  }
  return null;
}

/**
 * Subscribe to active tasks for a user
 * Returns unsubscribe function
 */
export function subscribeToActiveTasks(
  userId: string,
  callback: (tasks: BackgroundTask[]) => void
): Unsubscribe {
  const tasksRef = collection(db, 'users', userId, 'backgroundTasks');
  const q = query(
    tasksRef,
    where('status', 'in', ['pending', 'in_progress'])
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks: BackgroundTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as BackgroundTask);
    });
    callback(tasks);
  });
}

/**
 * Subscribe to completed tasks that need notification
 * Returns unsubscribe function
 */
export function subscribeToCompletedTasks(
  userId: string,
  callback: (tasks: BackgroundTask[]) => void
): Unsubscribe {
  const tasksRef = collection(db, 'users', userId, 'backgroundTasks');
  const q = query(
    tasksRef,
    where('status', 'in', ['completed', 'failed']),
    where('notificationShown', '==', false)
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks: BackgroundTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as BackgroundTask);
    });
    callback(tasks);
  });
}

/**
 * Subscribe to all recent tasks (for UI display)
 */
export function subscribeToRecentTasks(
  userId: string,
  callback: (tasks: BackgroundTask[]) => void
): Unsubscribe {
  const tasksRef = collection(db, 'users', userId, 'backgroundTasks');
  
  return onSnapshot(tasksRef, (snapshot) => {
    const tasks: BackgroundTask[] = [];
    snapshot.forEach((doc) => {
      const task = doc.data() as BackgroundTask;
      // Only include tasks from the last 24 hours
      const createdAt = new Date(task.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        tasks.push(task);
      }
    });
    // Sort by creation date, newest first
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(tasks);
  });
}

/**
 * Check if there's an active CV rewrite task for a specific analysis
 */
export async function getActiveTaskForAnalysis(
  userId: string,
  analysisId: string,
  type: TaskType = 'cv_rewrite'
): Promise<BackgroundTask | null> {
  const tasksRef = collection(db, 'users', userId, 'backgroundTasks');
  const q = query(
    tasksRef,
    where('analysisId', '==', analysisId),
    where('type', '==', type),
    where('status', 'in', ['pending', 'in_progress'])
  );
  
  const snapshot = await (await import('firebase/firestore')).getDocs(q);
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as BackgroundTask;
  }
  
  return null;
}

