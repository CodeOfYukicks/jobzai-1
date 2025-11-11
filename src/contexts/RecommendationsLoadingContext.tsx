import { createContext, useContext, useState, ReactNode } from 'react';

interface RecommendationsLoadingState {
  isGenerating: boolean;
  progress: number;
  message: string;
  completedCount: number;
  totalCount: number;
  isMinimized: boolean;
  showStartModal: boolean;
  completedRecommendations: string[]; // List of completed recommendation names
}

interface RecommendationsLoadingContextType {
  loadingState: RecommendationsLoadingState;
  setLoadingState: (state: Partial<RecommendationsLoadingState>) => void;
  startLoading: (totalCount: number, message?: string) => void;
  updateProgress: (completedCount: number, progress: number) => void;
  addCompletedRecommendation: (recommendationName: string) => void;
  stopLoading: () => void;
  toggleMinimized: () => void;
  setMinimized: (minimized: boolean) => void;
  closeStartModal: () => void;
}

const initialState: RecommendationsLoadingState = {
  isGenerating: false,
  progress: 0,
  message: 'Generating your AI recommendations',
  completedCount: 0,
  totalCount: 0,
  isMinimized: false,
  showStartModal: false,
  completedRecommendations: [],
};

const RecommendationsLoadingContext = createContext<RecommendationsLoadingContextType | undefined>(undefined);

export const RecommendationsLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loadingState, setLoadingStateState] = useState<RecommendationsLoadingState>(initialState);

  const setLoadingState = (state: Partial<RecommendationsLoadingState>) => {
    setLoadingStateState(prev => ({ ...prev, ...state }));
  };

  const startLoading = (totalCount: number, message: string = 'Generating your AI recommendations') => {
    setLoadingStateState({
      isGenerating: true,
      progress: 0,
      message,
      completedCount: 0,
      totalCount,
      isMinimized: true,
      showStartModal: true,
      completedRecommendations: [],
    });
  };

  const updateProgress = (completedCount: number, progress: number) => {
    setLoadingStateState(prev => ({
      ...prev,
      completedCount,
      progress,
    }));
  };

  const addCompletedRecommendation = (recommendationName: string) => {
    setLoadingStateState(prev => ({
      ...prev,
      completedRecommendations: [...prev.completedRecommendations, recommendationName],
    }));
  };

  const stopLoading = () => {
    setLoadingStateState(initialState);
  };

  const closeStartModal = () => {
    setLoadingStateState(prev => ({
      ...prev,
      showStartModal: false,
    }));
  };

  const toggleMinimized = () => {
    setLoadingStateState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  };

  const setMinimized = (minimized: boolean) => {
    setLoadingStateState(prev => ({
      ...prev,
      isMinimized: minimized,
    }));
  };

  return (
    <RecommendationsLoadingContext.Provider
      value={{
        loadingState,
        setLoadingState,
        startLoading,
        updateProgress,
        addCompletedRecommendation,
        stopLoading,
        toggleMinimized,
        setMinimized,
        closeStartModal,
      }}
    >
      {children}
    </RecommendationsLoadingContext.Provider>
  );
};

export const useRecommendationsLoading = () => {
  const context = useContext(RecommendationsLoadingContext);
  if (context === undefined) {
    throw new Error('useRecommendationsLoading must be used within a RecommendationsLoadingProvider');
  }
  return context;
};

