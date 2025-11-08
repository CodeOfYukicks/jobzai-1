import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Type definition for recommendation types
export type RecommendationType = 'target-companies' | 'application-timing' | 'salary-insights' | 'job-strategy' | 'career-path' | 'skills-gap' | 'market-insights';

export interface RecommendationState {
  targetCompanies: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  applicationTiming: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  salaryInsights: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  jobStrategy: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  careerPath: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  skillsGap: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
  marketInsights: {
    isLoading: boolean;
    error: string | null;
    data: any | null;
    lastUpdated: Date | null;
  };
}

interface RecommendationsContextType {
  recommendations: RecommendationState;
  setRecommendationLoading: (type: RecommendationType, isLoading: boolean) => void;
  setRecommendationError: (type: RecommendationType, error: string | null) => void;
  setRecommendationData: (type: RecommendationType, data: any) => void;
  clearRecommendations: () => void;
}

const initialState: RecommendationState = {
  targetCompanies: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  applicationTiming: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  salaryInsights: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  jobStrategy: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  careerPath: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  skillsGap: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
  marketInsights: {
    isLoading: false,
    error: null,
    data: null,
    lastUpdated: null,
  },
};

// Helper to convert type to state key
export const getStateKey = (type: RecommendationType): keyof RecommendationState => {
  switch (type) {
    case 'target-companies':
      return 'targetCompanies';
    case 'application-timing':
      return 'applicationTiming';
    case 'salary-insights':
      return 'salaryInsights';
    case 'job-strategy':
      return 'jobStrategy';
    case 'career-path':
      return 'careerPath';
    case 'skills-gap':
      return 'skillsGap';
    case 'market-insights':
      return 'marketInsights';
    default:
      return 'targetCompanies';
  }
};

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export const RecommendationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Get storage key based on current user ID
  const getStorageKey = (userId: string | null) => {
    return userId ? `jobzai_recommendations_${userId}` : 'jobzai_recommendations';
  };

  const [recommendations, setRecommendations] = useState<RecommendationState>(() => {
    // Only load from localStorage if we have a user
    if (!currentUser) {
      return initialState;
    }
    
    const storageKey = getStorageKey(currentUser.uid);
    const savedRecommendations = localStorage.getItem(storageKey);
    
    if (savedRecommendations) {
      try {
        const parsed = JSON.parse(savedRecommendations);
        // Convert string dates back to Date objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key]?.lastUpdated) {
            parsed[key].lastUpdated = new Date(parsed[key].lastUpdated);
          }
        });
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved recommendations:', e);
        return initialState;
      }
    }
    return initialState;
  });

  // Clear recommendations when user changes
  useEffect(() => {
    if (currentUser) {
      // Load recommendations for current user
      const storageKey = getStorageKey(currentUser.uid);
      const savedRecommendations = localStorage.getItem(storageKey);
      
      if (savedRecommendations) {
        try {
          const parsed = JSON.parse(savedRecommendations);
          Object.keys(parsed).forEach(key => {
            if (parsed[key]?.lastUpdated) {
              parsed[key].lastUpdated = new Date(parsed[key].lastUpdated);
            }
          });
          setRecommendations(parsed);
        } catch (e) {
          console.error('Failed to parse saved recommendations:', e);
          setRecommendations(initialState);
        }
      } else {
        setRecommendations(initialState);
      }
    } else {
      // Clear recommendations when user logs out
      setRecommendations(initialState);
    }
  }, [currentUser?.uid]);

  // Save to localStorage whenever recommendations change (only if user is logged in)
  useEffect(() => {
    if (currentUser) {
      const storageKey = getStorageKey(currentUser.uid);
      localStorage.setItem(storageKey, JSON.stringify(recommendations));
    }
  }, [recommendations, currentUser?.uid]);

  const setRecommendationLoading = (type: RecommendationType, isLoading: boolean) => {
    const key = getStateKey(type);
    setRecommendations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading,
      }
    }));
  };

  const setRecommendationError = (type: RecommendationType, error: string | null) => {
    const key = getStateKey(type);
    setRecommendations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false,
      }
    }));
  };

  const setRecommendationData = (type: RecommendationType, data: any) => {
    const key = getStateKey(type);
    setRecommendations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data,
        error: null,
        isLoading: false,
        lastUpdated: new Date(),
      }
    }));
  };

  const clearRecommendations = () => {
    setRecommendations(initialState);
    if (currentUser) {
      const storageKey = getStorageKey(currentUser.uid);
      localStorage.removeItem(storageKey);
    }
    // Also clear old format for backward compatibility
    localStorage.removeItem('jobzai_recommendations');
  };

  return (
    <RecommendationsContext.Provider
      value={{
        recommendations,
        setRecommendationLoading,
        setRecommendationError,
        setRecommendationData,
        clearRecommendations,
      }}
    >
      {children}
    </RecommendationsContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
}; 