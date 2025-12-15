/**
 * MissionsContext
 * Global context for daily missions system
 * Provides achievement toast anywhere in the app
 */

import { createContext, useContext, ReactNode } from 'react';
import { useDailyMissions } from '../hooks/useDailyMissions';
import AchievementToast from '../components/hub/AchievementToast';
import { Mission, MissionStats } from '../types/missions';

interface MissionsContextType {
  missions: Mission[];
  stats: MissionStats | null;
  loading: boolean;
  error: string | null;
  refreshMissions: () => Promise<void>;
}

const MissionsContext = createContext<MissionsContextType>({
  missions: [],
  stats: null,
  loading: true,
  error: null,
  refreshMissions: async () => {},
});

export function MissionsProvider({ children }: { children: ReactNode }) {
  const {
    missions,
    stats,
    loading,
    error,
    completedMissionId,
    clearCompletedMission,
    refreshMissions,
  } = useDailyMissions();

  // Get the completed mission for the toast
  const completedMission = completedMissionId
    ? missions.find(m => m.id === completedMissionId) || null
    : null;

  return (
    <MissionsContext.Provider
      value={{
        missions,
        stats,
        loading,
        error,
        refreshMissions,
      }}
    >
      {children}
      
      {/* Global Achievement Toast - renders on any page */}
      <AchievementToast
        mission={completedMission}
        onComplete={clearCompletedMission}
      />
    </MissionsContext.Provider>
  );
}

export function useMissions() {
  return useContext(MissionsContext);
}







