import { JobApplication, AutomationSettings, AutomationUpdate, StatusChange } from '../types/job';

/**
 * Calculate days since last status change or update
 */
function getDaysSinceLastUpdate(app: JobApplication): number {
  const now = new Date();
  
  // Check statusHistory for the last status change date
  if (app.statusHistory && app.statusHistory.length > 0) {
    const lastStatusChange = app.statusHistory[app.statusHistory.length - 1];
    try {
      const lastStatusDate = new Date(lastStatusChange.date);
      if (!isNaN(lastStatusDate.getTime())) {
        const daysDiff = Math.floor((now.getTime() - lastStatusDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff;
      }
    } catch (error) {
      // Invalid date in statusHistory, fall through to fallback
    }
  }
  
  // Fallback to updatedAt or createdAt
  return getDaysSinceLastActivity(app);
}

/**
 * Get days since last activity (updatedAt)
 */
function getDaysSinceLastActivity(app: JobApplication): number {
  const now = new Date();
  if (!app.updatedAt) {
    // Fallback to createdAt if updatedAt doesn't exist
    const createdDate = new Date(app.createdAt || app.appliedDate);
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  }
  
  try {
    const updatedDate = new Date(app.updatedAt);
    if (isNaN(updatedDate.getTime())) {
      // Invalid date, fallback to createdAt
      const createdDate = new Date(app.createdAt || app.appliedDate);
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff;
    }
    const daysDiff = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  } catch (error) {
    // Error parsing date, fallback to createdAt
    const createdDate = new Date(app.createdAt || app.appliedDate);
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  }
}

/**
 * Check if application should be auto-rejected based on days in same column
 */
function checkAutoRejectDays(
  app: JobApplication,
  settings: AutomationSettings['autoRejectDays']
): AutomationUpdate | null {
  if (!settings.enabled || !settings.applyTo.includes(app.status)) {
    return null;
  }

  const daysSinceUpdate = getDaysSinceLastUpdate(app);
  
  if (daysSinceUpdate >= settings.days) {
    return {
      applicationId: app.id,
      newStatus: 'rejected',
      reason: `Auto-rejected: ${daysSinceUpdate} days in ${app.status} status`,
    };
  }

  return null;
}

/**
 * Check if rejected application should be auto-archived
 */
function checkAutoArchiveRejected(
  app: JobApplication,
  settings: AutomationSettings['autoArchiveRejected']
): AutomationUpdate | null {
  if (!settings.enabled || app.status !== 'rejected') {
    return null;
  }

  const daysSinceUpdate = getDaysSinceLastUpdate(app);
  
  if (daysSinceUpdate >= settings.days) {
    return {
      applicationId: app.id,
      newStatus: 'archived',
      reason: `Auto-archived: ${daysSinceUpdate} days in rejected status`,
    };
  }

  return null;
}

/**
 * Check if application should be auto-moved to interview when interview is added
 * This is handled separately in the UI when interviews are added
 */
function checkAutoMoveToInterview(
  app: JobApplication,
  settings: AutomationSettings['autoMoveToInterview']
): AutomationUpdate | null {
  if (!settings.enabled || app.status === 'interview' || app.status === 'offer' || app.status === 'rejected') {
    return null;
  }

  // Check if there are any scheduled interviews
  const hasScheduledInterviews = app.interviews?.some(
    (interview) => interview.status === 'scheduled'
  );

  if (hasScheduledInterviews) {
    return {
      applicationId: app.id,
      newStatus: 'interview',
      reason: 'Auto-moved: Interview scheduled',
    };
  }

  return null;
}

/**
 * Check if application should be moved to pending_decision after N completed interviews
 */
function checkAutoMoveToPendingDecision(
  app: JobApplication,
  settings: AutomationSettings['autoMoveToPendingDecision']
): AutomationUpdate | null {
  if (!settings.enabled || app.status !== 'interview') {
    return null;
  }

  const completedInterviews = app.interviews?.filter(
    (interview) => interview.status === 'completed'
  ) || [];

  if (completedInterviews.length >= settings.interviewCount) {
    return {
      applicationId: app.id,
      newStatus: 'pending_decision',
      reason: `Auto-moved: ${completedInterviews.length} completed interviews`,
    };
  }

  return null;
}

/**
 * Check if application should be auto-rejected due to no response
 */
function checkAutoRejectNoResponse(
  app: JobApplication,
  settings: AutomationSettings['autoRejectNoResponse']
): AutomationUpdate | null {
  if (!settings.enabled || !settings.applyTo.includes(app.status)) {
    return null;
  }

  const daysSinceActivity = getDaysSinceLastActivity(app);
  
  if (daysSinceActivity >= settings.days) {
    return {
      applicationId: app.id,
      newStatus: 'rejected',
      reason: `Auto-rejected: No activity for ${daysSinceActivity} days`,
    };
  }

  return null;
}

/**
 * Check if application is inactive (for badge display)
 */
export function isApplicationInactive(
  app: JobApplication,
  settings: AutomationSettings['inactiveReminder']
): boolean {
  if (!settings.enabled) {
    return false;
  }

  const daysSinceActivity = getDaysSinceLastActivity(app);
  return daysSinceActivity >= settings.days;
}

/**
 * Get number of inactive days for an application
 */
export function getInactiveDays(app: JobApplication): number {
  return getDaysSinceLastActivity(app);
}

/**
 * Main function to check and return all automation updates
 */
export function checkAndApplyAutomations(
  applications: JobApplication[],
  settings: AutomationSettings
): AutomationUpdate[] {
  const updates: AutomationUpdate[] = [];

  for (const app of applications) {
    // Rule 1: Auto-reject after X days in same column
    const autoRejectUpdate = checkAutoRejectDays(app, settings.autoRejectDays);
    if (autoRejectUpdate) {
      updates.push(autoRejectUpdate);
      continue; // Don't check other rules if already rejected
    }

    // Rule 2: Auto-archive rejected applications
    const autoArchiveUpdate = checkAutoArchiveRejected(app, settings.autoArchiveRejected);
    if (autoArchiveUpdate) {
      updates.push(autoArchiveUpdate);
      continue;
    }

    // Rule 3: Auto-move to interview (only if not already processed)
    if (app.status !== 'interview' && app.status !== 'offer' && app.status !== 'rejected') {
      const autoInterviewUpdate = checkAutoMoveToInterview(app, settings.autoMoveToInterview);
      if (autoInterviewUpdate) {
        updates.push(autoInterviewUpdate);
        continue;
      }
    }

    // Rule 4: Auto-move to pending_decision after N interviews
    const autoPendingUpdate = checkAutoMoveToPendingDecision(app, settings.autoMoveToPendingDecision);
    if (autoPendingUpdate) {
      updates.push(autoPendingUpdate);
      continue;
    }

    // Rule 5: Auto-reject if no response
    const autoRejectNoResponseUpdate = checkAutoRejectNoResponse(app, settings.autoRejectNoResponse);
    if (autoRejectNoResponseUpdate) {
      updates.push(autoRejectNoResponseUpdate);
      continue;
    }
  }

  return updates;
}

/**
 * Get preview of how many applications would be affected by each rule
 */
export function getAutomationPreview(
  applications: JobApplication[],
  settings: AutomationSettings
): {
  autoRejectDays: number;
  autoArchiveRejected: number;
  autoMoveToInterview: number;
  inactiveReminder: number;
  autoMoveToPendingDecision: number;
  autoRejectNoResponse: number;
} {
  return {
    autoRejectDays: settings.autoRejectDays.enabled
      ? applications.filter((app) => {
          if (!settings.autoRejectDays.applyTo.includes(app.status)) return false;
          const days = getDaysSinceLastUpdate(app);
          return days >= settings.autoRejectDays.days;
        }).length
      : 0,
    
    autoArchiveRejected: settings.autoArchiveRejected.enabled
      ? applications.filter((app) => {
          if (app.status !== 'rejected') return false;
          const days = getDaysSinceLastUpdate(app);
          return days >= settings.autoArchiveRejected.days;
        }).length
      : 0,
    
    autoMoveToInterview: settings.autoMoveToInterview.enabled
      ? applications.filter((app) => {
          if (app.status === 'interview' || app.status === 'offer' || app.status === 'rejected') return false;
          return app.interviews?.some((i) => i.status === 'scheduled') || false;
        }).length
      : 0,
    
    inactiveReminder: settings.inactiveReminder.enabled
      ? applications.filter((app) => isApplicationInactive(app, settings.inactiveReminder)).length
      : 0,
    
    autoMoveToPendingDecision: settings.autoMoveToPendingDecision.enabled
      ? applications.filter((app) => {
          if (app.status !== 'interview') return false;
          const completed = app.interviews?.filter((i) => i.status === 'completed').length || 0;
          return completed >= settings.autoMoveToPendingDecision.interviewCount;
        }).length
      : 0,
    
    autoRejectNoResponse: settings.autoRejectNoResponse.enabled
      ? applications.filter((app) => {
          if (!settings.autoRejectNoResponse.applyTo.includes(app.status)) return false;
          const days = getDaysSinceLastActivity(app);
          return days >= settings.autoRejectNoResponse.days;
        }).length
      : 0,
  };
}

