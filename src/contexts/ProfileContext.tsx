import { createContext, useContext, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { notify } from '@/lib/notify';

interface ProfileContextType {
  personalInfo: any;
  locationMobility: any;
  experienceExpertise: any;
  documentsLinks: any;
  professionalObjectives: any;
  preferencesPriorities: any;
  updateSection: (sectionName: string, data: any) => void;
  saveAllChanges: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [sections, setSections] = useState({
    personalInfo: {},
    locationMobility: {},
    experienceExpertise: {},
    documentsLinks: {},
    professionalObjectives: {},
    preferencesPriorities: {}
  });

  const updateSection = (sectionName: string, data: any) => {
    setSections(prev => ({
      ...prev,
      [sectionName]: data
    }));
  };

  const saveAllChanges = async () => {
    if (!currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      ...sections.personalInfo,
      ...sections.locationMobility,
      ...sections.experienceExpertise,
      ...sections.documentsLinks,
      ...sections.professionalObjectives,
      ...sections.preferencesPriorities,
      lastUpdated: new Date().toISOString(),
      profileCompleted: true
    });
  };

  return (
    <ProfileContext.Provider 
      value={{ 
        ...sections,
        updateSection,
        saveAllChanges
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 