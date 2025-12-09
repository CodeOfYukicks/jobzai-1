/**
 * Hook for monitoring background tasks and showing notifications
 * Uses the smart notify system for elegant feedback
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BackgroundTask,
  subscribeToRecentTasks,
  subscribeToCompletedTasks,
  markNotificationShown,
} from '../services/backgroundTaskService';
import { notify } from '../lib/notify';

interface UseBackgroundTasksReturn {
  activeTasks: BackgroundTask[];
  recentTasks: BackgroundTask[];
  hasActiveTasks: boolean;
  getTaskForAnalysis: (analysisId: string) => BackgroundTask | undefined;
}

export function useBackgroundTasks(): UseBackgroundTasksReturn {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const processedNotifications = useRef<Set<string>>(new Set());

  // Subscribe to all recent tasks
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToRecentTasks(currentUser.uid, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Subscribe to completed tasks and show notifications
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('🔔 [BackgroundTasks] Subscribing to completed tasks for user:', currentUser.uid);

    const unsubscribe = subscribeToCompletedTasks(currentUser.uid, async (completedTasks) => {
      console.log('🔔 [BackgroundTasks] Received completed tasks:', completedTasks.length, completedTasks.map(t => ({ id: t.id, status: t.status, type: t.type })));
      
      for (const task of completedTasks) {
        // Skip if we already processed this notification in this session
        if (processedNotifications.current.has(task.id)) {
          console.log('🔔 [BackgroundTasks] Skipping already processed task:', task.id);
          continue;
        }
        
        // Mark as processed in this session
        processedNotifications.current.add(task.id);
        console.log('🔔 [BackgroundTasks] Processing task:', task.id, task.type, task.status);
        
        // Show notification based on task type and status
        if (task.type === 'cv_rewrite' || task.type === 'ats_analysis' || task.type === 'cover_letter') {
          if (task.status === 'completed') {
            console.log('🔔 [BackgroundTasks] Creating notification for completed task:', task.id);
            // Create persistent notification + subtle feedback
            try {
              await notify.taskComplete({
                taskType: task.type,
                taskId: task.id,
                analysisId: task.analysisId,
                jobTitle: task.jobTitle,
                company: task.company,
                showToast: true, // Shows subtle micro-feedback
              });
              console.log('🔔 [BackgroundTasks] Notification created successfully for:', task.id);
            } catch (notifyError) {
              console.error('🔔 [BackgroundTasks] Failed to create notification:', notifyError);
            }
          } else if (task.status === 'failed') {
            // Errors still use visible toast
            notify.error(
              `${task.type === 'cv_rewrite' ? 'CV generation' : task.type === 'ats_analysis' ? 'ATS analysis' : 'Cover letter generation'} failed`
            );
          }
        }
        
        // Mark notification as shown in Firestore
        try {
          await markNotificationShown(currentUser.uid, task.id);
          console.log('🔔 [BackgroundTasks] Marked notification as shown:', task.id);
        } catch (error) {
          console.error('Failed to mark notification as shown:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, navigate]);

  // Get active tasks (pending or in_progress)
  const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  
  // Get task for a specific analysis
  const getTaskForAnalysis = useCallback((analysisId: string) => {
    return tasks.find(t => 
      t.analysisId === analysisId && 
      (t.status === 'pending' || t.status === 'in_progress')
    );
  }, [tasks]);

  return {
    activeTasks,
    recentTasks: tasks,
    hasActiveTasks: activeTasks.length > 0,
    getTaskForAnalysis,
  };
}

/**
 * Small floating indicator component for active background tasks
 * Can be added to the app layout
 */
export function BackgroundTaskIndicator() {
  const { activeTasks, hasActiveTasks } = useBackgroundTasks();
  const navigate = useNavigate();
  
  if (!hasActiveTasks) return null;
  
  const latestTask = activeTasks[0];
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm animate-slide-up cursor-pointer hover:shadow-3xl transition-shadow"
      onClick={() => latestTask.analysisId && navigate(`/ats-analysis/${latestTask.analysisId}`)}
    >
      <div className="flex items-center gap-3">
        {/* Spinning loader */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full border-3 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {Math.round(latestTask.progress || 0)}%
            </span>
          </div>
        </div>
        
        {/* Task info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {latestTask.type === 'cv_rewrite' ? 'Génération du CV...' : 'Tâche en cours...'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {latestTask.stepLabel || 
              (latestTask.jobTitle && latestTask.company 
                ? `${latestTask.jobTitle} - ${latestTask.company}` 
                : 'En cours de traitement')}
          </p>
        </div>
        
        {/* Badge count if multiple tasks */}
        {activeTasks.length > 1 && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              +{activeTasks.length - 1}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${latestTask.progress || 0}%` }}
        />
      </div>
    </div>
  );
}


