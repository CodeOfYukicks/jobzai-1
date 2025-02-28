import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definition for recommendation types
export type RecommendationType = 'target-companies' | 'application-timing' | 'salary-insights' | 'job-strategy';

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
    default:
      return 'targetCompanies';
  }
};

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export const RecommendationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<RecommendationState>(() => {
    // Try to load from localStorage on initial render
    const savedRecommendations = localStorage.getItem('jobzai_recommendations');
    if (savedRecommendations) {
      try {
        const parsed = JSON.parse(savedRecommendations);
        // Convert string dates back to Date objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key].lastUpdated) {
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

  // Save to localStorage whenever recommendations change
  useEffect(() => {
    localStorage.setItem('jobzai_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

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