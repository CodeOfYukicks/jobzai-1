import { db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { fetchCVText } from '../services/claude';

export interface CompleteUserData {
  // Données de base
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  industry?: string;
  yearsOfExperience?: string | number;
  skills?: string[];
  education?: string[];
  cvUrl?: string;
  cvName?: string;
  credits?: number;
  plan?: string;
  isPremium?: boolean;
  
  // Données de profil avancées
  contractType?: string;
  willingToRelocate?: boolean;
  workPreference?: string;
  travelPreference?: string;
  currentPosition?: string;
  tools?: string[];
  certifications?: Array<{ name: string; issuer: string; year: string }>;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  targetPosition?: string;
  targetSectors?: string[];
  salaryExpectations?: {
    min: string;
    max: string;
    currency: string;
  };
  // Legacy field - kept for backward compatibility
  salaryRange?: {
    min: string;
    max: string;
    currency: string;
  };
  availabilityDate?: string;
  workLifeBalance?: number;
  companyCulture?: string;
  // Legacy field - removed in Phase 1, kept for backward compatibility
  preferredCompanySize?: string;
  sectorsToAvoid?: string[];
  desiredCulture?: string[];
  jobPreferences?: string;
  
  // Job Search Context (Phase 1)
  currentSituation?: string;
  searchUrgency?: string;
  searchReason?: string;
  searchIntensity?: string;
  
  // Education & Languages (Phase 1)
  educationLevel?: string;
  educationField?: string;
  educationInstitution?: string;
  graduationYear?: string;
  educationMajor?: string;
  languages?: Array<{ language: string; level: string }>;
  
  // Professional History (Phase 2)
  professionalHistory?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    industry: string;
    contractType: string;
    location: string;
    responsibilities: string[];
    achievements: string[];
  }>;
  
  // Career Drivers (Phase 2)
  careerPriorities?: string[];
  primaryMotivator?: string;
  dealBreakers?: string[];
  niceToHaves?: string[];
  
  // Role Preferences (Phase 2)
  roleType?: string;
  preferredEnvironment?: string[];
  productType?: string[];
  functionalDomain?: string[];
  
  // Salary Flexibility (Phase 3)
  salaryFlexibility?: string;
  compensationPriorities?: string[];
  willingToTrade?: string[];
  
  // Soft Skills & Leadership (Phase 3)
  softSkills?: string[];
  managementExperience?: {
    hasExperience: boolean;
    teamSize: string;
    teamType: string;
  };
  mentoringExperience?: boolean;
  recruitingExperience?: boolean;
  
  // Detailed Location (Phase 3)
  preferredCities?: string[];
  preferredCountries?: string[];
  geographicFlexibility?: string;
  
  // Location & Mobility (Phase 1 cleanup)
  city?: string;
  country?: string;
  
  // Auto-Apply Fields (for automatic job applications)
  fullAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  workAuthorization?: 'citizen' | 'permanent_resident' | 'visa_sponsor_required' | 'visa_no_sponsor' | 'other';
  workAuthorizationDetails?: string;
  noticePeriod?: number; // days
  noticePeriodUnit?: 'days' | 'weeks' | 'months';
  
  // EEO Fields (optional - for US applications)
  veteranStatus?: 'veteran' | 'not_veteran' | 'prefer_not_say';
  disabilityStatus?: 'yes' | 'no' | 'prefer_not_say';
  genderIdentity?: string;
  ethnicity?: string;
  
  // References
  references?: Array<{
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
    relationship: string;
  }>;
  
  // Données enrichies
  cvContent?: string | null;
  campaigns?: any[];
  applications?: any[];
  
  // Métriques calculées
  totalApplications?: number;
  responseRate?: number;
  averageMatchScore?: number;
  totalCampaigns?: number;
}

/**
 * Récupère toutes les données utilisateur depuis Firestore
 * Inclut: données de base, profil avancé, CV, campagnes, applications
 */
export async function fetchCompleteUserData(userId: string): Promise<CompleteUserData> {
  try {
    // 1. Données de base (users collection)
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userData = userDoc.data() as any;
    
    // 2. Extraction du CV (si disponible)
    let cvContent: string | null = null;
    if (userData.cvUrl) {
      try {
        cvContent = await fetchCVText(userData.cvUrl);
      } catch (error) {
        console.error('Error fetching CV content:', error);
        // Continue sans le contenu du CV si l'extraction échoue
      }
    }
    
    // 3. Historique des campagnes (si disponible)
    let campaigns: any[] = [];
    try {
      const campaignsRef = collection(db, 'users', userId, 'campaigns');
      const campaignsSnapshot = await getDocs(campaignsRef);
      campaigns = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      // Continue sans les campagnes si l'accès échoue
    }
    
    // 4. Statistiques d'application (si disponible)
    let applications: any[] = [];
    try {
      const applicationsRef = collection(db, 'users', userId, 'jobApplications');
      const applicationsSnapshot = await getDocs(applicationsRef);
      applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Continue sans les applications si l'accès échoue
    }
    
    // 5. Calcul de métriques dérivées
    const totalApplications = applications.length;
    const responseRate = calculateResponseRate(applications);
    const averageMatchScore = calculateAverageMatch(applications);
    const totalCampaigns = campaigns.length;
    
    // Fusionner toutes les données
    return {
      ...userData,
      cvContent,
      campaigns,
      applications,
      totalApplications,
      responseRate,
      averageMatchScore,
      totalCampaigns,
    };
  } catch (error) {
    console.error('Error fetching complete user data:', error);
    throw error;
  }
}

/**
 * Calcule le taux de réponse basé sur les applications
 */
function calculateResponseRate(applications: any[]): number {
  if (applications.length === 0) return 0;
  
  const responded = applications.filter(app => 
    app.status === 'responded' || 
    app.status === 'interview' || 
    app.status === 'accepted' ||
    app.responseDate
  ).length;
  
  return Math.round((responded / applications.length) * 100);
}

/**
 * Calcule le score de match moyen basé sur les applications
 */
function calculateAverageMatch(applications: any[]): number {
  if (applications.length === 0) return 0;
  
  const matches = applications
    .map(app => app.matchScore || app.match || 0)
    .filter(score => typeof score === 'number' && score > 0);
  
  if (matches.length === 0) return 0;
  
  const sum = matches.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / matches.length);
}

