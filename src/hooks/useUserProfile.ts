import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  // Basic Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;

  // Professional Information
  currentJobTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  industry?: string;

  // Summary
  professionalSummary?: string;

  // Skills
  skills?: string[];

  // Education
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
    field?: string;
  }>;

  // Work Experience
  workExperience?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current?: boolean;
  }>;

  // Languages
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;

  // Certifications
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;

  // Social Links
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch from the profile subcollection first
      const profileDocRef = doc(db, 'users', currentUser.uid, 'profile', 'data');
      let profileDoc = await getDoc(profileDocRef);

      // If not found in subcollection, try the main user document
      if (!profileDoc.exists()) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        profileDoc = await getDoc(userDocRef);
      }

      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;

        // Enrich with auth user data if not present
        if (!data.email && currentUser.email) {
          data.email = currentUser.email;
        }

        setProfile(data);
      } else {
        // Create a minimal profile from auth data
        setProfile({
          email: currentUser.email || undefined,
          firstName: currentUser.displayName?.split(' ')[0] || undefined,
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || undefined,
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));

      // Fallback to minimal profile from auth
      if (currentUser) {
        setProfile({
          email: currentUser.email || undefined,
          firstName: currentUser.displayName?.split(' ')[0] || undefined,
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser?.uid]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
};


