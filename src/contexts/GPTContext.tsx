import { createContext, useContext, ReactNode } from 'react';
import { PersonalizedGPT } from '../lib/personalizedGPT';
import { useAuth } from './AuthContext';

interface GPTContextType {
  getPersonalizedGPT: () => PersonalizedGPT | null;
}

const GPTContext = createContext<GPTContextType | null>(null);

export function useGPT() {
  const context = useContext(GPTContext);
  if (!context) {
    throw new Error('useGPT must be used within a GPTProvider');
  }
  return context;
}

interface GPTProviderProps {
  children: ReactNode;
}

export function GPTProvider({ children }: GPTProviderProps) {
  const { currentUser } = useAuth();

  const getPersonalizedGPT = () => {
    if (!currentUser) return null;
    return new PersonalizedGPT(currentUser.uid);
  };

  return (
    <GPTContext.Provider value={{ getPersonalizedGPT }}>
      {children}
    </GPTContext.Provider>
  );
}