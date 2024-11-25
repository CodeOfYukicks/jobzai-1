import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { 
  User, 
  MapPin, 
  Briefcase, 
  FileText, 
  Target, 
  Settings,
  Check,
  X
} from 'lucide-react';
import PersonalInformationSection from '../components/profile-sections/PersonalInformationSection';
import LocationMobilitySection from '../components/profile-sections/LocationMobilitySection';
import ExperienceExpertiseSection from '../components/profile-sections/ExperienceExpertiseSection';
import DocumentsLinksSection from '../components/profile-sections/DocumentsLinksSection';
import ProfessionalObjectivesSection from '../components/profile-sections/ProfessionalObjectivesSection';
import PreferencesPrioritiesSection from '../components/profile-sections/PreferencesPrioritiesSection';
import { ProfileProvider } from '../contexts/ProfileContext';
import debounce from 'lodash/debounce';

// Définition des sections
const sections = [
  { id: 'personal', name: 'Personal Information', icon: User },
  { id: 'location', name: 'Location & Mobility', icon: MapPin },
  { id: 'experience', name: 'Experience & Expertise', icon: Briefcase },
  { id: 'documents', name: 'Documents & Links', icon: FileText },
  { id: 'objectives', name: 'Professional Objectives', icon: Target },
  { id: 'preferences', name: 'Preferences & Priorities', icon: Settings },
];

const ProfessionalProfilePage = () => {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    location: '',
    contractType: '',
    
    // Location & Mobility
    willingToRelocate: false,
    workPreference: '',
    travelPreference: '',
    
    // Experience & Expertise
    yearsOfExperience: '',
    currentPosition: '',
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
    preferredCompanySize: '',
    sectorsToAvoid: [] as string[],
    desiredCulture: [] as string[]
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculer le pourcentage de complétion
  const calculateCompletionPercentage = (data: typeof formData) => {
    const requiredFields = [
      // Personal Information
      'firstName',
      'lastName',
      'email',
      'gender',
      'location',
      'contractType',
      
      // Location & Mobility
      'willingToRelocate',
      'workPreference',
      'travelPreference',
      
      // Experience & Expertise
      'yearsOfExperience',
      'currentPosition',
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
      'companyCulture',
      'preferredCompanySize'
    ];

    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = data[field as keyof typeof data];
      if (Array.isArray(value)) {
        if (value.length > 0) completedFields++;
      } else if (typeof value === 'object' && value !== null) {
        if (Object.values(value).some(v => v !== '')) completedFields++;
      } else if (value) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // Mettre à jour le pourcentage quand les données changent
  useEffect(() => {
    const percentage = calculateCompletionPercentage(formData);
    setCompletionPercentage(percentage);
  }, [formData]);

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(prevData => ({
            ...prevData,
            ...userData
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadInitialData();
  }, [currentUser]);

  // Créer une version debounced de la sauvegarde Firebase
  const saveToFirebase = useCallback(
    debounce(async (data: any) => {
      if (!currentUser?.uid) return;
      
      setIsSaving(true);
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
      } finally {
        setIsSaving(false);
      }
    }, 1000), // Attendre 1 seconde d'inactivité avant de sauvegarder
    [currentUser]
  );

  const updateFormData = async (sectionData: any) => {
    setFormData(prev => ({
      ...prev,
      ...sectionData
    }));

    // Appeler la version debounced de la sauvegarde
    saveToFirebase(sectionData);
  };

  // Ajouter la gestion du scroll pour mettre à jour la section active
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      }));

      const currentSection = sectionElements.find(section => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight / 2;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ajouter cette fonction si elle est encore nécessaire quelque part
  const handleSaveChanges = async () => {
    if (!currentUser?.uid) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...formData,
        lastUpdated: new Date().toISOString()
      });
      toast.success('All changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save all changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileProvider>
      <AuthLayout>
        {/* Header modifié pour mobile */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Professional Profile
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Complete your profile to get personalized opportunities
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">Profile</div>
                  <div className="w-20 sm:w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-purple-600 whitespace-nowrap">
                    {completionPercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile flottant */}
        <div className="fixed bottom-4 right-4 z-50 sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-purple-600 text-white p-4 rounded-full shadow-lg"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Menu mobile modal */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden">
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sections</h3>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="grid grid-cols-2 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(section.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg transition-colors text-sm
                      ${activeSection === section.id 
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="font-medium">{section.name}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Navigation latérale - cachée sur mobile */}
            <div className="hidden sm:block sm:col-span-3">
              <nav className="space-y-1 sticky top-24">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(section.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        setActiveSection(section.id);
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${activeSection === section.id 
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.name}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Contenu principal - pleine largeur sur mobile */}
            <div className="col-span-1 sm:col-span-9 space-y-6">
              <PersonalInformationSection onUpdate={updateFormData} />
              <LocationMobilitySection onUpdate={updateFormData} />
              <ExperienceExpertiseSection onUpdate={updateFormData} />
              <DocumentsLinksSection onUpdate={updateFormData} />
              <ProfessionalObjectivesSection onUpdate={updateFormData} />
              <PreferencesPrioritiesSection onUpdate={updateFormData} />
              
              {/* Bouton de sauvegarde - adapté pour mobile */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </ProfileProvider>
  );
};

export default ProfessionalProfilePage; 