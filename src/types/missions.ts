/**
 * Daily Missions System Types
 * Premium achievement/challenge system for tracking daily job search goals
 */

export type MissionType = 'apply_jobs' | 'prepare_interview';

export type MissionStatus = 'active' | 'completed' | 'locked';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  current: number;
  status: MissionStatus;
  completedAt?: Date;
  icon: string; // Lucide icon name
  color: string; // Hex color for the mission
  xpReward?: number; // Visual XP points (non-functional, just for display)
}

export interface DailyMissionsDocument {
  date: string; // YYYY-MM-DD format
  missions: Mission[];
  allCompleted: boolean;
  completedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionStats {
  currentStreak: number;
  longestStreak: number;
  totalMissionsCompleted: number;
  totalDaysActive: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakStartDate?: string;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MissionConfig {
  type: MissionType;
  title: string;
  description: string;
  target: number;
  icon: string;
  color: string;
  xpReward: number;
  condition?: (userId: string) => Promise<boolean>; // Optional condition to show this mission
}

// Default mission configurations
export const DAILY_MISSIONS_CONFIG: MissionConfig[] = [
  {
    type: 'apply_jobs',
    title: 'Job Hunter',
    description: 'Apply to 3 job positions today',
    target: 3,
    icon: 'Briefcase',
    color: '#635BFF', // Purple (matching AuthLayout)
    xpReward: 50,
  },
  {
    type: 'prepare_interview',
    title: 'Interview Ready',
    description: 'Complete all 5 prep milestones for an upcoming interview',
    target: 1,
    icon: 'Target',
    color: '#5EBC88', // Green
    xpReward: 75,
  },
];

// Streak milestones for visual celebrations
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to get yesterday's date in YYYY-MM-DD format
export const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

