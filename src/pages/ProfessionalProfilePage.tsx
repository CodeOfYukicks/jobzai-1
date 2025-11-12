import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { 
  User, 
  MapPin, 
  Briefcase, 
  FileText, 
  Target, 
  Settings,
  Search,
  GraduationCap,
  TrendingUp,
  Building2
} from 'lucide-react';
import LocationMobilitySection from '../components/profile-sections/LocationMobilitySection';
import ExperienceExpertiseSection from '../components/profile-sections/ExperienceExpertiseSection';
import DocumentsLinksSection from '../components/profile-sections/DocumentsLinksSection';
import ProfessionalObjectivesSection from '../components/profile-sections/ProfessionalObjectivesSection';
import EducationLanguagesSection from '../components/profile-sections/EducationLanguagesSection';
import ProfessionalHistorySection from '../components/profile-sections/ProfessionalHistorySection';
import CareerDriversSection from '../components/profile-sections/CareerDriversSection';
import RolePreferencesSection from '../components/profile-sections/RolePreferencesSection';
import ProfileWizard from '../components/profile-wizard/ProfileWizard';
import ProfileHeader from '../components/profile/ProfileHeader';
import AboutSection from '../components/profile/AboutSection';
import ProfileSectionCard from '../components/profile/ProfileSectionCard';
import ProfileLandingPage from '../components/profile/ProfileLandingPage';
import ProfileCompletionBanner from '../components/profile/ProfileCompletionBanner';
import { ProfileProvider } from '../contexts/ProfileContext';
import debounce from 'lodash/debounce';

// Définition des sections
const sections = [
  { id: 'personal', name: 'Personal Information', icon: User },
  { id: 'job-search-context', name: 'Job Search Context', icon: Search },
  { id: 'education-languages', name: 'Education & Languages', icon: GraduationCap },
  { id: 'professional-history', name: 'Professional History', icon: Briefcase },
  { id: 'career-drivers', name: 'Career Drivers', icon: TrendingUp },
  { id: 'role-preferences', name: 'Role Preferences', icon: Building2 },
  { id: 'location', name: 'Location & Mobility', icon: MapPin },
  { id: 'experience', name: 'Experience & Expertise', icon: Briefcase },
  { id: 'documents', name: 'Documents & Links', icon: FileText },
  { id: 'objectives', name: 'Professional Objectives', icon: Target },
  { id: 'preferences', name: 'Preferences & Priorities', icon: Settings },
];

const ProfessionalProfilePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [useWizard, setUseWizard] = useState(false); // Toggle pour basculer entre wizard et vue complète
  const [showLanding, setShowLanding] = useState(false); // Afficher la landing page
  const [hasChosenMode, setHasChosenMode] = useState(false); // Si l'utilisateur a déjà choisi un mode
  const isInitialMount = useRef(true); // Track si c'est le premier rendu
  const [shouldAnimate, setShouldAnimate] = useState(false); // Contrôle si on doit animer
  const prevUseWizard = useRef(useWizard); // Track la valeur précédente de useWizard
  const prevShowLanding = useRef(showLanding); // Track la valeur précédente de showLanding
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    
    // Job Search Context (Phase 1)
    currentSituation: '',
    searchUrgency: '',
    searchReason: '',
    searchIntensity: '',
    
    // Education & Languages (Phase 1)
    educationLevel: '',
    educationField: '',
    educationInstitution: '',
    graduationYear: '',
    educationMajor: '',
    languages: [] as Array<{ language: string; level: string }>,
    
    // Professional History (Phase 2)
    professionalHistory: [] as Array<{
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
    }>,
    
    // Career Drivers (Phase 2)
    careerPriorities: [] as string[],
    primaryMotivator: '',
    dealBreakers: [] as string[],
    niceToHaves: [] as string[],
    
    // Role Preferences (Phase 2)
    roleType: '',
    preferredEnvironment: [] as string[],
    productType: [] as string[],
    functionalDomain: [] as string[],
    
    // Salary Flexibility (Phase 3)
    salaryFlexibility: '',
    compensationPriorities: [] as string[],
    willingToTrade: [] as string[],
    
    // Soft Skills & Leadership (Phase 3)
    softSkills: [] as string[],
    managementExperience: {
      hasExperience: false,
      teamSize: '',
      teamType: ''
    },
    mentoringExperience: false,
    recruitingExperience: false,
    
    // Detailed Location (Phase 3)
    preferredCities: [] as string[],
    preferredCountries: [] as string[],
    geographicFlexibility: '',
    
    // Location & Mobility
    city: '',
    country: '',
    willingToRelocate: false,
    workPreference: '',
    travelPreference: '',
    
    // Experience & Expertise
    yearsOfExperience: '',
    skills: [] as string[],
    tools: [] as string[],
    certifications: [] as Array<{ name: string; issuer: string; year: string }>,
    
    // Documents & Links
    cvUrl: '',
    cvName: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    
    // Professional Objectives
    targetPosition: '',
    targetSectors: [] as string[],
    salaryExpectations: {
      min: '',
      max: '',
      currency: 'EUR'
    },
    availabilityDate: '',
    
    // Preferences & Priorities
    workLifeBalance: 0,
    companyCulture: '',
    sectorsToAvoid: [] as string[],
    desiredCulture: [] as string[]
  });

  // Calculer yearsOfExperience depuis professionalHistory
  const calculateYearsOfExperience = (history: Array<{
    startDate: string;
    endDate: string;
    current: boolean;
  }>): number => {
    if (!history || history.length === 0) return 0;
    
    let totalMonths = 0;
    const now = new Date();
    
    history.forEach(exp => {
      if (!exp.startDate) return;
      
      // Parse date in YYYY-MM format
      const startParts = exp.startDate.split('-');
      if (startParts.length !== 2) return;
      
      const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
      let end: Date;
      
      if (exp.current || !exp.endDate) {
        end = now;
      } else {
        const endParts = exp.endDate.split('-');
        if (endParts.length !== 2) return;
        end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, 1);
      }
      
      if (end >= start) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.round(totalMonths / 12);
  };

  // Calculer le pourcentage de complétion
  const calculateCompletionPercentage = (data: typeof formData) => {
    const requiredFields = [
      // Personal Information
      'firstName',
      'lastName',
      'email',
      'gender',
      
      // Job Search Context (Phase 1)
      'currentSituation',
      'searchUrgency',
      
      // Education & Languages (Phase 1)
      'educationLevel',
      'languages',
      
      // Professional History (Phase 2)
      'professionalHistory',
      
      // Career Drivers (Phase 2)
      'careerPriorities',
      'primaryMotivator',
      
      // Role Preferences (Phase 2)
      'roleType',
      'preferredEnvironment',
      
      // Location & Mobility
      'city',
      'country',
      'willingToRelocate',
      'workPreference',
      'travelPreference',
      
      // Experience & Expertise
      'yearsOfExperience',
      'skills',
      'tools',
      
      // Documents & Links
      'cvUrl',
      'linkedinUrl',
      
      // Professional Objectives
      'targetPosition',
      'targetSectors',
      'salaryExpectations',
      
      // Preferences & Priorities
      'workLifeBalance',
      'companyCulture'
    ];

    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = data[field as keyof typeof data];
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === 'object' && value !== null) {
        if (Object.values(value).some(v => v !== '' && v !== null && v !== undefined)) completedFields++;
      } else if (field === 'willingToRelocate') {
        // willingToRelocate is a boolean, so it's complete if it's explicitly set
        if (value === true || value === false) completedFields++;
      } else if (value !== '' && value !== null && value !== undefined) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // Calculer yearsOfExperience depuis professionalHistory
  useEffect(() => {
    if (formData.professionalHistory && formData.professionalHistory.length > 0) {
      const calculatedYears = calculateYearsOfExperience(formData.professionalHistory);
      const currentYears = parseInt(formData.yearsOfExperience || '0');
      if (calculatedYears !== currentYears && calculatedYears > 0) {
        setFormData(prev => ({
          ...prev,
          yearsOfExperience: calculatedYears.toString()
        }));
      }
    }
  }, [formData.professionalHistory]);

  // Mettre à jour le pourcentage de complétion quand les données changent
  useEffect(() => {
    const percentage = calculateCompletionPercentage(formData);
    setCompletionPercentage(percentage);
  }, [formData]);

  // Gérer l'affichage de la landing page
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà choisi un mode (localStorage)
    const savedChoice = localStorage.getItem('profileModeChosen');
    if (savedChoice === 'true') {
      setHasChosenMode(true);
      setShowLanding(false);
      return;
    }

    // Afficher la landing si l'utilisateur n'a pas encore choisi un mode
    // et si le profil est incomplet (< 80%)
    if (!hasChosenMode && completionPercentage < 80 && !authLoading) {
      setShowLanding(true);
    } else {
      setShowLanding(false);
    }
  }, [hasChosenMode, completionPercentage, authLoading]);

  // Fonction pour mettre à jour formData depuis Firestore
  const updateFormDataFromFirestore = useCallback((firestoreData: any) => {
    // Extraire firstName et lastName depuis displayName ou name si nécessaire
    let extractedFirstName = '';
    let extractedLastName = '';
    const fullName = currentUser?.displayName || firestoreData.name || userData?.name || '';
    if (fullName && (!userData?.firstName || !userData?.lastName) && (!firestoreData.firstName || !firestoreData.lastName)) {
      const nameParts = fullName.split(' ').filter(part => part.trim() !== '');
      extractedFirstName = nameParts[0] || '';
      extractedLastName = nameParts.slice(1).join(' ') || '';
    }
    
    setFormData(prevData => {
      const newFirstName = userData?.firstName || firestoreData.firstName || extractedFirstName || prevData.firstName || '';
      const newLastName = userData?.lastName || firestoreData.lastName || extractedLastName || prevData.lastName || '';
      const newEmail = currentUser?.email || userData?.email || firestoreData.email || prevData.email || '';
      
      // Calculer yearsOfExperience depuis professionalHistory si disponible
      let calculatedYears = prevData.yearsOfExperience || '';
      if (firestoreData.professionalHistory && firestoreData.professionalHistory.length > 0) {
        calculatedYears = calculateYearsOfExperience(firestoreData.professionalHistory).toString();
      } else if (firestoreData.yearsOfExperience) {
        calculatedYears = firestoreData.yearsOfExperience.toString();
      }
      
      // Support both salaryRange (old) and salaryExpectations (new) for backward compatibility
      const salaryData = firestoreData.salaryExpectations || firestoreData.salaryRange || prevData.salaryExpectations || {
        min: '',
        max: '',
        currency: 'EUR'
      };
      
      // Remove salaryRange from firestoreData to avoid conflicts
      const { salaryRange, ...cleanFirestoreData } = firestoreData;
      
      return {
        ...prevData,
        // Autres données depuis Firestore
        ...cleanFirestoreData,
        // Override salaryExpectations with migrated data
        salaryExpectations: salaryData,
        // Utiliser userData du contexte AuthContext pour firstName, lastName, email (priorité)
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        // Calculer yearsOfExperience depuis professionalHistory
        yearsOfExperience: calculatedYears,
        // Job Search Context (Phase 1)
        currentSituation: firestoreData.currentSituation || prevData.currentSituation || '',
        searchUrgency: firestoreData.searchUrgency || prevData.searchUrgency || '',
        searchReason: firestoreData.searchReason || prevData.searchReason || '',
        searchIntensity: firestoreData.searchIntensity || prevData.searchIntensity || '',
        // Education & Languages (Phase 1)
        educationLevel: firestoreData.educationLevel || prevData.educationLevel || '',
        educationField: firestoreData.educationField || prevData.educationField || '',
        educationInstitution: firestoreData.educationInstitution || prevData.educationInstitution || '',
        graduationYear: firestoreData.graduationYear || prevData.graduationYear || '',
        educationMajor: firestoreData.educationMajor || prevData.educationMajor || '',
        languages: firestoreData.languages || prevData.languages || [],
        // Professional History (Phase 2)
        professionalHistory: firestoreData.professionalHistory || prevData.professionalHistory || [],
        // Career Drivers (Phase 2)
        careerPriorities: firestoreData.careerPriorities || prevData.careerPriorities || [],
        primaryMotivator: firestoreData.primaryMotivator || prevData.primaryMotivator || '',
        dealBreakers: firestoreData.dealBreakers || prevData.dealBreakers || [],
        niceToHaves: firestoreData.niceToHaves || prevData.niceToHaves || [],
        // Role Preferences (Phase 2)
        roleType: firestoreData.roleType || prevData.roleType || '',
        preferredEnvironment: firestoreData.preferredEnvironment || prevData.preferredEnvironment || [],
        productType: firestoreData.productType || prevData.productType || [],
        functionalDomain: firestoreData.functionalDomain || prevData.functionalDomain || [],
        // Salary Flexibility (Phase 3)
        salaryFlexibility: firestoreData.salaryFlexibility || prevData.salaryFlexibility || '',
        compensationPriorities: firestoreData.compensationPriorities || prevData.compensationPriorities || [],
        willingToTrade: firestoreData.willingToTrade || prevData.willingToTrade || [],
        // Soft Skills & Leadership (Phase 3)
        softSkills: firestoreData.softSkills || prevData.softSkills || [],
        managementExperience: firestoreData.managementExperience || prevData.managementExperience || {
          hasExperience: false,
          teamSize: '',
          teamType: ''
        },
        mentoringExperience: firestoreData.mentoringExperience || prevData.mentoringExperience || false,
        recruitingExperience: firestoreData.recruitingExperience || prevData.recruitingExperience || false,
        // Detailed Location (Phase 3)
        preferredCities: firestoreData.preferredCities || prevData.preferredCities || [],
        preferredCountries: firestoreData.preferredCountries || prevData.preferredCountries || [],
        geographicFlexibility: firestoreData.geographicFlexibility || prevData.geographicFlexibility || '',
        // Location & Mobility
        city: firestoreData.city || prevData.city || '',
        country: firestoreData.country || prevData.country || '',
        willingToRelocate: firestoreData.willingToRelocate !== undefined ? firestoreData.willingToRelocate : prevData.willingToRelocate,
        workPreference: firestoreData.workPreference || prevData.workPreference || '',
        travelPreference: firestoreData.travelPreference || prevData.travelPreference || '',
        // Documents & Links
        cvUrl: firestoreData.cvUrl || prevData.cvUrl || '',
        cvName: firestoreData.cvName || prevData.cvName || '',
        linkedinUrl: firestoreData.linkedinUrl || prevData.linkedinUrl || '',
        portfolioUrl: firestoreData.portfolioUrl || prevData.portfolioUrl || '',
        githubUrl: firestoreData.githubUrl || prevData.githubUrl || '',
      };
    });
  }, [currentUser, userData]);

  // Charger les données initiales et écouter les changements en temps réel
  useEffect(() => {
    // Attendre que l'authentification soit chargée
    if (authLoading || !currentUser?.uid) return;
    
    // Charger les données initiales
    const loadInitialData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          updateFormDataFromFirestore(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadInitialData();

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          updateFormDataFromFirestore(docSnapshot.data());
        }
      },
      (error) => {
        console.error('Error listening to user data changes:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userData, authLoading, updateFormDataFromFirestore]);

  // Créer une version debounced de la sauvegarde Firebase
  const saveToFirebase = useCallback(
    debounce(async (data: any) => {
      if (!currentUser?.uid) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          ...data,
          lastUpdated: new Date().toISOString()
        });
        // Toast uniquement pour les erreurs, pas pour les succès
      } catch (error) {
        console.error('Error saving changes:', error);
        toast.error('Failed to save changes');
      }
    }, 1000), // Attendre 1 seconde d'inactivité avant de sauvegarder
    [currentUser]
  );

  const updateFormData = async (sectionData: any) => {
    // Migrer salaryRange vers salaryExpectations si nécessaire
    const cleanedData = { ...sectionData };
    if (cleanedData.salaryRange && !cleanedData.salaryExpectations) {
      cleanedData.salaryExpectations = cleanedData.salaryRange;
      delete cleanedData.salaryRange;
    }
    
    setFormData(prev => ({
      ...prev,
      ...cleanedData
    }));

    // Appeler la version debounced de la sauvegarde
    saveToFirebase(cleanedData);
  };



  // Activer les animations après le premier rendu
  useEffect(() => {
    if (isInitialMount.current) {
      // Au premier rendu, désactiver l'animation
      isInitialMount.current = false;
      setShouldAnimate(false);
      // Activer les animations après un court délai pour les transitions futures
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []); // Seulement au montage du composant

  // Activer l'animation pour les changements internes (wizard <-> vue complète)
  useEffect(() => {
    // Vérifier si les valeurs ont réellement changé (pas juste au premier rendu)
    const wizardChanged = prevUseWizard.current !== useWizard;
    const landingChanged = prevShowLanding.current !== showLanding;
    
    if ((wizardChanged || landingChanged) && !isInitialMount.current) {
      // Activer l'animation seulement si les valeurs ont changé ET ce n'est pas le premier rendu
      setShouldAnimate(true);
    }
    
    // Mettre à jour les refs
    prevUseWizard.current = useWizard;
    prevShowLanding.current = showLanding;
  }, [useWizard, showLanding]);

  // Handlers pour les choix de la landing page
  const handleChooseStepMode = () => {
    setHasChosenMode(true);
    setShowLanding(false);
    setUseWizard(true);
    localStorage.setItem('profileModeChosen', 'true');
  };

  const handleChooseFullProfile = () => {
    setHasChosenMode(true);
    setShowLanding(false);
    setUseWizard(false);
    localStorage.setItem('profileModeChosen', 'true');
  };

  return (
    <ProfileProvider>
      <AuthLayout>
        <AnimatePresence mode="wait">
          {showLanding ? (
            <motion.div
              key="landing"
              initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: 20 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldAnimate ? { opacity: 0, scale: 0.95, y: -20 } : false}
              transition={shouldAnimate ? { duration: 0.35, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
            >
              <ProfileLandingPage
                completionPercentage={completionPercentage}
                onChooseStepMode={handleChooseStepMode}
                onChooseFullProfile={handleChooseFullProfile}
              />
            </motion.div>
          ) : useWizard ? (
            <motion.div
              key="wizard"
              initial={shouldAnimate ? { opacity: 0, x: 100, scale: 0.95 } : false}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={shouldAnimate ? { opacity: 0, x: -100, scale: 0.95 } : false}
              transition={shouldAnimate ? { 
                duration: 0.5, 
                ease: [0.34, 1.56, 0.64, 1],
                opacity: { duration: 0.3 }
              } : { duration: 0 }}
              style={{ position: 'relative' }}
            >
              <ProfileWizard
                onComplete={() => {
                  // Quand l'utilisateur clique sur "Finish", basculer vers la vue complète
                  setUseWizard(false);
                }}
                onUpdate={(data) => {
                  // Sauvegarder les données du wizard
                  updateFormData(data);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={shouldAnimate ? { opacity: 0, x: -100, scale: 0.95 } : false}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={shouldAnimate ? { opacity: 0, x: 100, scale: 0.95 } : false}
              transition={shouldAnimate ? { 
                duration: 0.5, 
                ease: [0.34, 1.56, 0.64, 1],
                opacity: { duration: 0.3 }
              } : { duration: 0 }}
              className="min-h-screen bg-gray-50 dark:bg-gray-900"
              style={{ margin: '-1.5rem', padding: '1.5rem' }}
            >
              {/* Main Content - LinkedIn Style */}
              <div className="max-w-5xl mx-auto space-y-6 pt-6">
              {/* Profile Header */}
              <ProfileHeader onUpdate={updateFormData} />

              {/* Completion Banner */}
              <ProfileCompletionBanner
                completionPercentage={completionPercentage}
                onStartStepMode={() => setUseWizard(true)}
              />

              {/* About Section */}
              <AboutSection onUpdate={updateFormData} />

              {/* Experience Section */}
              <ProfileSectionCard
                title="Experience"
                icon={<Briefcase className="w-6 h-6" />}
                completion={formData.professionalHistory?.length > 0 ? 100 : 0}
                isCollapsible={true}
              >
                <ProfessionalHistorySection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Education & Languages */}
              <ProfileSectionCard
                title="Education & Languages"
                icon={<GraduationCap className="w-6 h-6" />}
                completion={formData.educationLevel ? 100 : 0}
                isCollapsible={true}
              >
                <EducationLanguagesSection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Skills & Expertise */}
              <ProfileSectionCard
                title="Skills & Expertise"
                icon={<Briefcase className="w-6 h-6" />}
                completion={formData.skills?.length > 0 ? 100 : 0}
                isCollapsible={true}
              >
                <ExperienceExpertiseSection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Career Objectives */}
              <ProfileSectionCard
                title="Career Objectives"
                icon={<Target className="w-6 h-6" />}
                completion={formData.targetPosition ? 100 : 0}
                isCollapsible={true}
              >
                <ProfessionalObjectivesSection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Location & Mobility */}
              <ProfileSectionCard
                title="Location & Mobility"
                icon={<MapPin className="w-6 h-6" />}
                completion={formData.city && formData.country ? 100 : 0}
                isCollapsible={true}
              >
                <LocationMobilitySection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Career Drivers */}
              <ProfileSectionCard
                title="Career Drivers"
                icon={<TrendingUp className="w-6 h-6" />}
                completion={formData.careerPriorities?.length > 0 ? 100 : 0}
                isCollapsible={true}
              >
                <CareerDriversSection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Role Preferences */}
              <ProfileSectionCard
                title="Role Preferences"
                icon={<Building2 className="w-6 h-6" />}
                completion={formData.roleType ? 100 : 0}
                isCollapsible={true}
              >
                <RolePreferencesSection onUpdate={updateFormData} />
              </ProfileSectionCard>

              {/* Documents & Links */}
              <ProfileSectionCard
                title="Documents & Links"
                icon={<FileText className="w-6 h-6" />}
                completion={formData.cvUrl || formData.linkedinUrl ? 100 : 0}
                isCollapsible={true}
              >
                <DocumentsLinksSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </AuthLayout>
    </ProfileProvider>
  );
};

export default ProfessionalProfilePage; 