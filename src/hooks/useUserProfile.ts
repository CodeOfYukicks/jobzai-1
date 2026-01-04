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

  // CV Data
  cvUrl?: string;            // URL of the uploaded CV file
  cvName?: string;           // Name of the uploaded CV file
  cvText?: string;           // Full extracted CV text for comprehensive analysis
  cvTechnologies?: string[]; // Extracted technologies from CV for precise matching
  cvSkills?: string[];       // Extracted skills from CV for detailed profiling

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

      // Fetch from both sources and merge them
      const profileDocRef = doc(db, 'users', currentUser.uid, 'profile', 'data');
      const userDocRef = doc(db, 'users', currentUser.uid);

      const [profileDoc, userDoc] = await Promise.all([
        getDoc(profileDocRef),
        getDoc(userDocRef)
      ]);

      // Debug: log what we got from Firestore
      console.log('👤 [useUserProfile] Raw data from Firestore:');
      console.log('👤 [useUserProfile] - userDoc exists:', userDoc.exists());
      console.log('👤 [useUserProfile] - profileDoc exists:', profileDoc.exists());
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('👤 [useUserProfile] - userDoc data keys:', Object.keys(data || {}));
        console.log('👤 [useUserProfile] - userDoc.skills:', data?.skills);
        console.log('👤 [useUserProfile] - userDoc.professionalSummary:', data?.professionalSummary?.substring(0, 100) + '...');
        console.log('👤 [useUserProfile] - userDoc.workExperience:', data?.workExperience?.length || 0, 'items');
      }


      // Merge data: user document first (base), then profile subcollection (override)
      // This ensures CV data from user doc is always included
      let mergedData: UserProfile = {};

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Extract CV-related fields from user document
        // Map alternative field names from Firestore to our standard interface
        mergedData = {
          ...mergedData,
          cvText: userData.cvText,
          cvTechnologies: userData.cvTechnologies,
          cvSkills: userData.cvSkills,
          cvUrl: userData.cvUrl,
          cvName: userData.cvName,
          // Basic info
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          // Location - try multiple possible field names
          location: userData.location || userData.city || (userData.city && userData.country ? `${userData.city}, ${userData.country}` : undefined),
          // Professional info - map alternative field names
          currentJobTitle: userData.currentJobTitle || userData.currentPosition || userData.headline || userData.targetPosition,
          currentCompany: userData.currentCompany || userData.company,
          yearsOfExperience: userData.yearsOfExperience ? Number(userData.yearsOfExperience) : undefined,
          industry: userData.industry,
          professionalSummary: userData.professionalSummary,
          skills: userData.skills,
          // Education - Firestore uses 'educations' (plural)
          education: userData.education || userData.educations?.map((edu: any) => ({
            degree: edu.degree,
            institution: edu.institution || edu.school,
            year: edu.endDate || edu.year,
            field: edu.field,
          })),
          // Work Experience - Firestore uses 'professionalHistory'
          workExperience: userData.workExperience || userData.professionalHistory?.map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: exp.responsibilities?.join('. ') || exp.description,
            current: exp.current,
          })),
          // Languages - map proficiency field name
          languages: userData.languages?.map((lang: any) => ({
            language: lang.language,
            proficiency: lang.proficiency || lang.level,
          })),
          certifications: userData.certifications,
          linkedinUrl: userData.linkedinUrl,
          githubUrl: userData.githubUrl,
          portfolioUrl: userData.portfolioUrl,
          websiteUrl: userData.websiteUrl,
        };
      }


      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        // Profile subcollection data takes priority (except for CV fields which should come from user doc)
        mergedData = {
          ...mergedData,
          ...profileData,
          // But ensure CV data from user doc is preserved if not in profile
          cvText: profileData.cvText || mergedData.cvText,
          cvTechnologies: profileData.cvTechnologies || mergedData.cvTechnologies,
          cvSkills: profileData.cvSkills || mergedData.cvSkills,
        };
      }

      // Enrich with auth user data if not present
      if (!mergedData.email && currentUser.email) {
        mergedData.email = currentUser.email;
      }
      if (!mergedData.firstName && currentUser.displayName) {
        mergedData.firstName = currentUser.displayName.split(' ')[0];
        mergedData.lastName = currentUser.displayName.split(' ').slice(1).join(' ') || undefined;
      }

      if (Object.keys(mergedData).length > 0) {
        setProfile(mergedData);
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


