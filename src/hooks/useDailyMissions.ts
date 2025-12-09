/**
 * useDailyMissions Hook
 * Premium daily missions system with real-time progress tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '../lib/notify';
import {
  Mission,
  MissionStats,
  DailyMissionsDocument,
  DAILY_MISSIONS_CONFIG,
  getTodayDateString,
  getYesterdayDateString,
} from '../types/missions';

interface UseDailyMissionsReturn {
  missions: Mission[];
  stats: MissionStats | null;
  loading: boolean;
  error: string | null;
  completedMissionId: string | null;
  clearCompletedMission: () => void;
  refreshMissions: () => Promise<void>;
}

const DEFAULT_STATS: MissionStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalMissionsCompleted: 0,
  totalDaysActive: 0,
  lastActiveDate: '',
  achievements: [],
};

export function useDailyMissions(): UseDailyMissionsReturn {
  const { currentUser } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedMissionId, setCompletedMissionId] = useState<string | null>(null);
  
  const prevMissionsRef = useRef<Map<string, number>>(new Map());
  const hasInitializedRef = useRef(false);

  const clearCompletedMission = useCallback(() => {
    setCompletedMissionId(null);
  }, []);

  // Generate today's missions from config (with optional filter)
  const generateTodayMissions = useCallback((hasScheduledInterviews: boolean = true): Mission[] => {
    const today = getTodayDateString();
    return DAILY_MISSIONS_CONFIG
      .filter(config => {
        // Only show interview mission if user has scheduled interviews
        if (config.type === 'prepare_interview' && !hasScheduledInterviews) {
          return false;
        }
        return true;
      })
      .map((config) => ({
        id: `${today}-${config.type}`,
        type: config.type,
        title: config.title,
        description: config.description,
        target: config.target,
        current: 0,
        status: 'active' as const,
        icon: config.icon,
        color: config.color,
        xpReward: config.xpReward,
      }));
  }, []);

  // Check if user has any scheduled interviews (upcoming) - MUST be defined before initializeTodayMissions
  const checkHasScheduledInterviews = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const applicationsRef = collection(db, 'users', userId, 'jobApplications');
      const snapshot = await getDocs(applicationsRef);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const interviews = data.interviews || [];
        
        // Check for any scheduled interview (today or future)
        const hasUpcoming = interviews.some((interview: any) => {
          if (interview.status !== 'scheduled') return false;
          
          // Parse interview date
          const interviewDate = new Date(interview.date);
          interviewDate.setHours(0, 0, 0, 0);
          
          return interviewDate >= today;
        });
        
        if (hasUpcoming) return true;
      }
      
      return false;
    } catch (err) {
      console.error('[Missions] Error checking scheduled interviews:', err);
      return false;
    }
  }, []);

  // Initialize or get today's missions document
  const initializeTodayMissions = useCallback(async (userId: string): Promise<Mission[]> => {
    const today = getTodayDateString();
    const missionsDocRef = doc(db, 'users', userId, 'dailyMissions', today);

    try {
      // Check if user has scheduled interviews
      const hasInterviews = await checkHasScheduledInterviews(userId);
      console.log('[Missions] Has scheduled interviews:', hasInterviews);

      const existingDoc = await getDoc(missionsDocRef);

      if (existingDoc.exists()) {
        const data = existingDoc.data();
        // Check if missions array exists and has items
        if (data.missions && Array.isArray(data.missions) && data.missions.length > 0) {
          let missions = data.missions as Mission[];
          let needsUpdate = false;
          
          // Refresh colors and other config from DAILY_MISSIONS_CONFIG (in case config changed)
          missions = missions.map(mission => {
            const config = DAILY_MISSIONS_CONFIG.find(c => c.type === mission.type);
            if (config && (mission.color !== config.color || mission.icon !== config.icon)) {
              needsUpdate = true;
              return {
                ...mission,
                color: config.color,
                icon: config.icon,
                xpReward: config.xpReward,
              };
            }
            return mission;
          });
          
          // If interview status changed, update the missions
          const hasInterviewMission = missions.some(m => m.type === 'prepare_interview');
          
          if (hasInterviews && !hasInterviewMission) {
            // Add interview mission
            const interviewConfig = DAILY_MISSIONS_CONFIG.find(c => c.type === 'prepare_interview');
            if (interviewConfig) {
              const interviewMission: Mission = {
                id: `${today}-prepare_interview`,
                type: 'prepare_interview',
                title: interviewConfig.title,
                description: interviewConfig.description,
                target: interviewConfig.target,
                current: 0,
                status: 'active',
                icon: interviewConfig.icon,
                color: interviewConfig.color,
                xpReward: interviewConfig.xpReward,
              };
              missions = [...missions, interviewMission];
              needsUpdate = true;
            }
          } else if (!hasInterviews && hasInterviewMission) {
            // Remove interview mission
            missions = missions.filter(m => m.type !== 'prepare_interview');
            needsUpdate = true;
          }
          
          // Update Firestore if any changes were made
          if (needsUpdate) {
            await updateDoc(missionsDocRef, { missions, updatedAt: Timestamp.now() });
          }
          
          console.log('[Missions] Loaded existing missions:', missions.length);
          return missions;
        }
      }

      // Create new missions for today
      const newMissions = generateTodayMissions(hasInterviews);
      console.log('[Missions] Creating new missions:', newMissions.length, hasInterviews ? '(with interview)' : '(no interview)');

      const newDoc = {
        date: today,
        missions: newMissions,
        allCompleted: false,
        completedCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(missionsDocRef, newDoc);
      console.log('[Missions] Document created successfully');

      return newMissions;
    } catch (err) {
      console.error('[Missions] Error initializing:', err);
      // Return default missions even on error so UI shows something
      return generateTodayMissions(false);
    }
  }, [generateTodayMissions, checkHasScheduledInterviews]);

  // Update streak logic
  const updateStreak = useCallback(async (userId: string): Promise<MissionStats> => {
    const statsDocRef = doc(db, 'users', userId, 'missionStats', 'stats');
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    try {
      const statsDoc = await getDoc(statsDocRef);
      let currentStats: MissionStats = statsDoc.exists()
        ? (statsDoc.data() as MissionStats)
        : { ...DEFAULT_STATS };

      // Check if we already updated today
      if (currentStats.lastActiveDate === today) {
        return currentStats;
      }

      // Check yesterday's completion
      const yesterdayMissionsRef = doc(db, 'users', userId, 'dailyMissions', yesterday);
      const yesterdayDoc = await getDoc(yesterdayMissionsRef);

      if (yesterdayDoc.exists()) {
        const yesterdayData = yesterdayDoc.data() as DailyMissionsDocument;
        if (yesterdayData.allCompleted && currentStats.lastActiveDate === yesterday) {
          currentStats.currentStreak += 1;
        } else if (currentStats.lastActiveDate !== yesterday) {
          currentStats.currentStreak = 1;
          currentStats.streakStartDate = today;
        }
      } else {
        currentStats.currentStreak = currentStats.currentStreak > 0 ? 1 : 0;
        currentStats.streakStartDate = today;
      }

      if (currentStats.currentStreak > currentStats.longestStreak) {
        currentStats.longestStreak = currentStats.currentStreak;
      }

      currentStats.lastActiveDate = today;
      currentStats.totalDaysActive += 1;

      await setDoc(statsDocRef, currentStats, { merge: true });
      return currentStats;
    } catch (err) {
      console.error('[Missions] Error updating streak:', err);
      return { ...DEFAULT_STATS };
    }
  }, []);

  // Count today's job applications
  // Counts jobs currently in "applied" column that were put there TODAY
  const countTodayApplications = useCallback((applications: any[]): number => {
    const today = getTodayDateString();
    
    // Helper to convert any date format to YYYY-MM-DD string
    const toDateString = (date: any): string | null => {
      if (!date) return null;
      try {
        if (typeof date === 'string') {
          // Handle ISO string or date string
          return date.split('T')[0];
        }
        if (date.toDate) {
          // Firestore Timestamp
          return date.toDate().toISOString().split('T')[0];
        }
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        if (date.seconds) {
          // Firestore timestamp as object
          return new Date(date.seconds * 1000).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('[Missions] Date parse error:', date, e);
      }
      return null;
    };

    // Only count jobs in "applied" column (status === 'applied')
    const appliedJobs = applications.filter(app => app.status === 'applied');
    
    // Count how many were put in applied column TODAY
    const todayAppliedCount = appliedJobs.filter(app => {
      const updatedAtStr = toDateString(app.updatedAt);
      const appliedDateStr = toDateString(app.appliedDate);
      const createdAtStr = toDateString(app.createdAt);
      
      // Check if this job was moved to applied today
      // Priority: updatedAt (when status changed) > appliedDate > createdAt
      const wasAppliedToday = updatedAtStr === today || appliedDateStr === today || createdAtStr === today;
      
      console.log(`[Missions] "${app.companyName}" in APPLIED - updatedAt: ${updatedAtStr}, appliedDate: ${appliedDateStr}, isToday: ${wasAppliedToday}`);
      
      return wasAppliedToday;
    }).length;

    console.log(`[Missions] Today (${today}) - Jobs in Applied column: ${appliedJobs.length}, Applied TODAY: ${todayAppliedCount}`);
    return todayAppliedCount;
  }, []);

  // Check interview prep completion - returns 1 if ANY scheduled interview has all 5 milestones done
  const checkInterviewPrepProgress = useCallback(async (userId: string): Promise<number> => {
    try {
      const applicationsRef = collection(db, 'users', userId, 'jobApplications');
      const snapshot = await getDocs(applicationsRef);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const interviews = data.interviews || [];
        
        for (const interview of interviews) {
          // Only check scheduled interviews (today or future)
          if (interview.status !== 'scheduled') continue;
          
          const interviewDate = new Date(interview.date);
          interviewDate.setHours(0, 0, 0, 0);
          if (interviewDate < today) continue;
          
          // Check all 5 milestones for this interview
          const milestones = checkInterviewMilestones(interview);
          const completedCount = milestones.filter(m => m.completed).length;
          
          console.log(`[Missions] Interview prep for "${data.companyName}" - ${completedCount}/5 milestones`);
          
          // If all 5 milestones are complete, mission is done!
          if (completedCount === 5) {
            console.log('[Missions] Interview prep COMPLETE!');
            return 1;
          }
        }
      }
      
      return 0;
    } catch (err) {
      console.error('[Missions] Error checking interview prep:', err);
      return 0;
    }
  }, []);

  // Helper to check the 5 interview preparation milestones
  const checkInterviewMilestones = (interview: any): { id: string; completed: boolean }[] => {
    const preparation = interview.preparation || {};
    const requiredSkills = preparation.requiredSkills || [];
    const skillRatings = interview.skillRatings || {};
    const skillsRated = Object.keys(skillRatings).length;
    const chatHistory = interview.chatHistory || [];
    const resourcesData = interview.resourcesData || {};
    
    // Calculate saved questions (questions marked as important/saved)
    const suggestedQuestions = preparation.suggestedQuestions || [];
    // For simplicity, we consider questions reviewed if there are suggested questions
    const hasReviewedQuestions = suggestedQuestions.length >= 2;
    
    const milestones = [
      {
        id: 'analysis',
        completed: !!preparation.requiredSkills?.length,
      },
      {
        id: 'skills',
        completed: requiredSkills.length > 0 
          ? skillsRated >= Math.min(Math.ceil(requiredSkills.length * 0.6), requiredSkills.length)
          : skillsRated >= 3,
      },
      {
        id: 'questions',
        completed: hasReviewedQuestions,
      },
      {
        id: 'resources',
        completed: (resourcesData.reviewedTips?.length || 0) >= 4 || (resourcesData.savedLinks?.length || 0) >= 2,
      },
      {
        id: 'practice',
        completed: chatHistory.filter((m: any) => m.role === 'user').length >= 3 
          && chatHistory.filter((m: any) => m.role === 'assistant').length >= 2,
      },
    ];
    
    return milestones;
  };

  // Update mission progress in Firestore
  const updateMissionProgress = useCallback(async (
    userId: string,
    missionId: string,
    newProgress: number,
    target: number
  ) => {
    const today = getTodayDateString();
    const missionsDocRef = doc(db, 'users', userId, 'dailyMissions', today);

    try {
      const docSnap = await getDoc(missionsDocRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      if (!data.missions || !Array.isArray(data.missions)) return;

      const updatedMissions = data.missions.map((mission: Mission) => {
        if (mission.id === missionId) {
          const isNowComplete = newProgress >= target && mission.status !== 'completed';
          return {
            ...mission,
            current: Math.min(newProgress, target),
            status: newProgress >= target ? 'completed' as const : 'active' as const,
            completedAt: isNowComplete ? Timestamp.now() : mission.completedAt,
          };
        }
        return mission;
      });

      const completedCount = updatedMissions.filter((m: Mission) => m.status === 'completed').length;
      const allCompleted = completedCount === updatedMissions.length;

      await updateDoc(missionsDocRef, {
        missions: updatedMissions,
        completedCount,
        allCompleted,
        updatedAt: Timestamp.now(),
      });

      // Update stats if all missions completed
      if (allCompleted && !data.allCompleted) {
        const statsDocRef = doc(db, 'users', userId, 'missionStats', 'stats');
        const statsSnap = await getDoc(statsDocRef);
        const currentStats = statsSnap.exists() 
          ? statsSnap.data() as MissionStats 
          : { ...DEFAULT_STATS };

        await setDoc(statsDocRef, {
          ...currentStats,
          totalMissionsCompleted: currentStats.totalMissionsCompleted + completedCount,
        }, { merge: true });
      }
    } catch (err) {
      console.error('[Missions] Error updating progress:', err);
    }
  }, []);

  // Main effect to set up listeners
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const userId = currentUser.uid;
    const today = getTodayDateString();
    let unsubscribeApplications: (() => void) | null = null;
    let unsubscribeMissions: (() => void) | null = null;
    let isMounted = true;

    const setupListeners = async () => {
      try {
        // Initialize today's missions and set state immediately
        const initialMissions = await initializeTodayMissions(userId);
        if (isMounted) {
          setMissions(initialMissions);
          // Initialize previous state for completion detection
          initialMissions.forEach(mission => {
            prevMissionsRef.current.set(mission.id, mission.current);
          });
        }
        
        // Update streak
        const updatedStats = await updateStreak(userId);
        if (isMounted) {
          setStats(updatedStats);
        }

        // Listen to missions document for real-time updates
        const missionsDocRef = doc(db, 'users', userId, 'dailyMissions', today);
        unsubscribeMissions = onSnapshot(missionsDocRef, (docSnap) => {
          if (!isMounted) return;
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.missions && Array.isArray(data.missions) && data.missions.length > 0) {
              const missionData = data.missions as Mission[];
              
              // Check for newly completed missions (after initial load)
              if (hasInitializedRef.current) {
                missionData.forEach(mission => {
                  const prevProgress = prevMissionsRef.current.get(mission.id) || 0;
                  if (mission.status === 'completed' && prevProgress < mission.target) {
                    setCompletedMissionId(mission.id);
                    // Create notification for completed mission
                    notify.achievement({
                      missionName: mission.title,
                      missionId: mission.id,
                      xpEarned: DAILY_MISSIONS_CONFIG.find(c => c.type === mission.type)?.xp || 25,
                      showToast: true,
                    });
                  }
                });
              }
              
              // Update previous state
              missionData.forEach(mission => {
                prevMissionsRef.current.set(mission.id, mission.current);
              });
              hasInitializedRef.current = true;
              
              setMissions(missionData);
            }
          }
        }, (err) => {
          console.error('[Missions] Snapshot error:', err);
        });

        // Listen to job applications for apply_jobs mission
        const applicationsRef = collection(db, 'users', userId, 'jobApplications');
        unsubscribeApplications = onSnapshot(applicationsRef, async (snapshot) => {
          if (!isMounted) return;
          
          const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const todayCount = countTodayApplications(applications);
          
          console.log('[Missions] Applications update - total:', applications.length, 'today:', todayCount);

          // Always update apply_jobs mission progress
          const applyMissionId = `${today}-apply_jobs`;
          const applyConfig = DAILY_MISSIONS_CONFIG.find(c => c.type === 'apply_jobs');
          if (applyConfig) {
            console.log('[Missions] Updating apply_jobs progress:', todayCount, '/', applyConfig.target);
            await updateMissionProgress(userId, applyMissionId, todayCount, applyConfig.target);
          }

          // Check interview prep
          const interviewProgress = await checkInterviewPrepProgress(userId);
          const interviewMissionId = `${today}-prepare_interview`;
          const interviewConfig = DAILY_MISSIONS_CONFIG.find(c => c.type === 'prepare_interview');
          if (interviewConfig) {
            await updateMissionProgress(userId, interviewMissionId, interviewProgress, interviewConfig.target);
          }
        }, (err) => {
          console.error('[Missions] Applications snapshot error:', err);
        });

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Missions] Error setting up:', err);
        if (isMounted) {
          // Even on error, show default missions
          setMissions(generateTodayMissions());
          setError('Failed to sync missions');
          setLoading(false);
        }
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (unsubscribeApplications) unsubscribeApplications();
      if (unsubscribeMissions) unsubscribeMissions();
    };
  }, [currentUser?.uid, initializeTodayMissions, updateStreak, countTodayApplications, updateMissionProgress, checkInterviewPrepProgress, generateTodayMissions]);

  // Refresh function
  const refreshMissions = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    hasInitializedRef.current = false;
    prevMissionsRef.current.clear();
    
    const missions = await initializeTodayMissions(currentUser.uid);
    setMissions(missions);
    
    const updatedStats = await updateStreak(currentUser.uid);
    setStats(updatedStats);
    
    setLoading(false);
  }, [currentUser?.uid, initializeTodayMissions, updateStreak]);

  return {
    missions,
    stats,
    loading,
    error,
    completedMissionId,
    clearCompletedMission,
    refreshMissions,
  };
}
