import { createContext, useContext, useState, ReactNode } from 'react';

interface RecommendationsLoadingState {
  isGenerating: boolean;
  progress: number;
  message: string;
  completedCount: number;
  totalCount: number;
  isMinimized: boolean;
  showStartModal: boolean;
}

interface RecommendationsLoadingContextType {
  loadingState: RecommendationsLoadingState;
  setLoadingState: (state: Partial<RecommendationsLoadingState>) => void;
  startLoading: (totalCount: number, message?: string) => void;
  updateProgress: (completedCount: number, progress: number) => void;
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
      isMinimized: false,
      showStartModal: true,
    });
  };

  const updateProgress = (completedCount: number, progress: number) => {
    setLoadingStateState(prev => ({
      ...prev,
      completedCount,
      progress,
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

