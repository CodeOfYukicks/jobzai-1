/**
 * CV Rewrite Worker Service
 * Handles background CV generation tasks
 * This worker runs independently and continues even if user navigates away
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateCVRewrite } from '../lib/cvRewriteService';
import { AdaptationLevel } from '../types/premiumATS';
import {
  BackgroundTask,
  updateTaskProgress,
  completeTask,
  failTask,
  getTask,
} from './backgroundTaskService';

interface CVRewriteTaskInput {
  cvText: string;
  jobDescription: string;
  atsAnalysis: {
    matchScore: number;
    strengths: any[];
    gaps: any[];
    keywords: any;
    cvFixes?: any;
    jobSummary?: any;
    positioning?: string;
  };
  jobTitle: string;
  company: string;
  adaptationLevel: AdaptationLevel;
}

// Keep track of running workers to prevent duplicates
const runningWorkers = new Map<string, boolean>();

/**
 * Start a CV rewrite worker for a specific task
 * This function runs asynchronously and updates progress in Firestore
 */
export async function startCVRewriteWorker(
  userId: string,
  taskId: string,
  analysisId: string,
  inputData: CVRewriteTaskInput
): Promise<void> {
  // Check if already running
  if (runningWorkers.get(taskId)) {
    console.log(`⚠️ Worker already running for task: ${taskId}`);
    return;
  }
  
  runningWorkers.set(taskId, true);
  console.log(`🚀 Starting CV rewrite worker for task: ${taskId}`);
  
  try {
    // Step 1: Analyzing
    await updateTaskProgress(userId, taskId, 10, 0, 'Analyzing your CV...');
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Extracting data
    await updateTaskProgress(userId, taskId, 30, 1, 'Extracting CV data...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Generating with AI
    await updateTaskProgress(userId, taskId, 50, 2, 'AI is rewriting your CV...');
    
    // Actual CV generation
    const result = await generateCVRewrite({
      cvText: inputData.cvText,
      jobDescription: inputData.jobDescription,
      atsAnalysis: inputData.atsAnalysis,
      jobTitle: inputData.jobTitle,
      company: inputData.company,
      adaptationLevel: inputData.adaptationLevel,
    });
    
    // Step 4: Saving results
    await updateTaskProgress(userId, taskId, 75, 3, 'Saving your optimized CV...');
    
    // Save to analysis document
    await updateDoc(doc(db, 'users', userId, 'analyses', analysisId), {
      cv_rewrite: result,
      cv_rewrite_generated_at: new Date().toISOString()
    });
    
    // Step 5: Complete
    await updateTaskProgress(userId, taskId, 100, 4, 'Complete!');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mark task as completed
    await completeTask(userId, taskId, { success: true });
    
    console.log(`✅ CV rewrite completed for task: ${taskId}`);
    
  } catch (error: any) {
    console.error(`❌ CV rewrite failed for task: ${taskId}`, error);
    
    let errorMessage = 'Failed to generate CV';
    if (error.message?.includes('API key')) {
      errorMessage = 'OpenAI API key is missing or invalid';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    await failTask(userId, taskId, errorMessage);
  } finally {
    runningWorkers.delete(taskId);
  }
}

/**
 * Resume any pending CV rewrite tasks for a user
 * Called when app loads to continue interrupted tasks
 */
export async function resumePendingTasks(userId: string): Promise<void> {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  const tasksRef = collection(db, 'users', userId, 'backgroundTasks');
  const q = query(
    tasksRef,
    where('type', '==', 'cv_rewrite'),
    where('status', 'in', ['pending', 'in_progress'])
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log('📋 No pending CV rewrite tasks to resume');
    return;
  }
  
  console.log(`📋 Found ${snapshot.docs.length} pending CV rewrite tasks to resume`);
  
  for (const taskDoc of snapshot.docs) {
    const task = taskDoc.data() as BackgroundTask;
    
    // Skip if already running
    if (runningWorkers.has(task.id)) {
      continue;
    }
    
    // Check if task has required input data
    if (!task.inputData || !task.analysisId) {
      console.warn(`⚠️ Task ${task.id} missing input data, marking as failed`);
      await failTask(userId, task.id, 'Task data missing');
      continue;
    }
    
    // Resume the task
    console.log(`🔄 Resuming task: ${task.id}`);
    startCVRewriteWorker(
      userId,
      task.id,
      task.analysisId,
      task.inputData as CVRewriteTaskInput
    );
  }
}

/**
 * Check if there's a running worker for a task
 */
export function isWorkerRunning(taskId: string): boolean {
  return runningWorkers.has(taskId);
}

