import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { motion } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import {
  MapPin,
  Briefcase,
  FileText,
  Target,
  Settings,
  GraduationCap,
  TrendingUp,
  Building2,
  Wrench
} from 'lucide-react';
import LocationMobilitySection from '../components/profile-sections/LocationMobilitySection';
import ExperienceExpertiseSection from '../components/profile-sections/ExperienceExpertiseSection';
import DocumentsLinksSection from '../components/profile-sections/DocumentsLinksSection';
import ProfessionalObjectivesSection from '../components/profile-sections/ProfessionalObjectivesSection';
import EducationLanguagesSection from '../components/profile-sections/EducationLanguagesSection';
import ProfessionalHistorySection from '../components/profile-sections/ProfessionalHistorySection';
import CareerDriversSection from '../components/profile-sections/CareerDriversSection';
import RolePreferencesSection from '../components/profile-sections/RolePreferencesSection';
import WorkAuthorizationSection from '../components/profile-sections/WorkAuthorizationSection';
import ProfileHeader from '../components/profile/ProfileHeader';
import AboutSection from '../components/profile/AboutSection';
import ProfileSectionCard from '../components/profile/ProfileSectionCard';
import CommandPalette, { useCommandPalette } from '../components/profile/ui/CommandPalette';
import { ProfileProvider } from '../contexts/ProfileContext';
import debounce from 'lodash/debounce';
import { extractFullProfileFromText } from '../lib/cvExperienceExtractor';
import { pdfToImages } from '../lib/pdfToImages';
import { extractCVTextAndTags } from '../lib/cvTextExtraction';

const ProfessionalProfilePage = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // CV Import state
  const [cvText, setCvText] = useState<string>('');
  const [isImportingCV, setIsImportingCV] = useState(false);
  const [hasAutoImported, setHasAutoImported] = useState(false);
  
  // Command palette hook
  const commandPalette = useCommandPalette();

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

  // Navigate to section
  const navigateToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Flash effect to highlight the section
      element.classList.add('ring-2', 'ring-indigo-500', 'dark:ring-[#3d3c3e]', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-indigo-500', 'dark:ring-[#3d3c3e]', 'ring-offset-2');
      }, 2000);
    }
  }, []);

  // Calculate years of experience from professional history
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

  // Calculate completion percentage
  const calculateCompletionPercentage = (data: typeof formData) => {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'gender',
      'currentSituation',
      'searchUrgency',
      'educationLevel',
      'languages',
      'professionalHistory',
      'careerPriorities',
      'primaryMotivator',
      'roleType',
      'preferredEnvironment',
      'city',
      'country',
      'willingToRelocate',
      'workPreference',
      'travelPreference',
      'yearsOfExperience',
      'skills',
      'tools',
      'cvUrl',
      'linkedinUrl',
      'targetPosition',
      'targetSectors',
      'salaryExpectations',
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
        if (value === true || value === false) completedFields++;
      } else if (value !== '' && value !== null && value !== undefined) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // Calculate yearsOfExperience from professionalHistory
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

  // Update completion percentage when data changes
  useEffect(() => {
    const percentage = calculateCompletionPercentage(formData);
    setCompletionPercentage(percentage);
  }, [formData]);

  // Update formData from Firestore
  const updateFormDataFromFirestore = useCallback((firestoreData: any) => {
    // Store cvText for import functionality
    if (firestoreData.cvText) {
      setCvText(firestoreData.cvText);
    }
    
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

      let calculatedYears = prevData.yearsOfExperience || '';
      if (firestoreData.professionalHistory && firestoreData.professionalHistory.length > 0) {
        calculatedYears = calculateYearsOfExperience(firestoreData.professionalHistory).toString();
      } else if (firestoreData.yearsOfExperience) {
        calculatedYears = firestoreData.yearsOfExperience.toString();
      }

      const salaryData = firestoreData.salaryExpectations || firestoreData.salaryRange || prevData.salaryExpectations || {
        min: '',
        max: '',
        currency: 'EUR'
      };

      const { salaryRange, ...cleanFirestoreData } = firestoreData;

      return {
        ...prevData,
        ...cleanFirestoreData,
        salaryExpectations: salaryData,
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        yearsOfExperience: calculatedYears,
        currentSituation: firestoreData.currentSituation || prevData.currentSituation || '',
        searchUrgency: firestoreData.searchUrgency || prevData.searchUrgency || '',
        searchReason: firestoreData.searchReason || prevData.searchReason || '',
        searchIntensity: firestoreData.searchIntensity || prevData.searchIntensity || '',
        educationLevel: firestoreData.educationLevel || prevData.educationLevel || '',
        educationField: firestoreData.educationField || prevData.educationField || '',
        educationInstitution: firestoreData.educationInstitution || prevData.educationInstitution || '',
        graduationYear: firestoreData.graduationYear || prevData.graduationYear || '',
        educationMajor: firestoreData.educationMajor || prevData.educationMajor || '',
        languages: firestoreData.languages || prevData.languages || [],
        professionalHistory: firestoreData.professionalHistory || prevData.professionalHistory || [],
        careerPriorities: firestoreData.careerPriorities || prevData.careerPriorities || [],
        primaryMotivator: firestoreData.primaryMotivator || prevData.primaryMotivator || '',
        dealBreakers: firestoreData.dealBreakers || prevData.dealBreakers || [],
        niceToHaves: firestoreData.niceToHaves || prevData.niceToHaves || [],
        roleType: firestoreData.roleType || prevData.roleType || '',
        preferredEnvironment: firestoreData.preferredEnvironment || prevData.preferredEnvironment || [],
        productType: firestoreData.productType || prevData.productType || [],
        functionalDomain: firestoreData.functionalDomain || prevData.functionalDomain || [],
        salaryFlexibility: firestoreData.salaryFlexibility || prevData.salaryFlexibility || '',
        compensationPriorities: firestoreData.compensationPriorities || prevData.compensationPriorities || [],
        willingToTrade: firestoreData.willingToTrade || prevData.willingToTrade || [],
        softSkills: firestoreData.softSkills || prevData.softSkills || [],
        managementExperience: firestoreData.managementExperience || prevData.managementExperience || {
          hasExperience: false,
          teamSize: '',
          teamType: ''
        },
        mentoringExperience: firestoreData.mentoringExperience || prevData.mentoringExperience || false,
        recruitingExperience: firestoreData.recruitingExperience || prevData.recruitingExperience || false,
        preferredCities: firestoreData.preferredCities || prevData.preferredCities || [],
        preferredCountries: firestoreData.preferredCountries || prevData.preferredCountries || [],
        geographicFlexibility: firestoreData.geographicFlexibility || prevData.geographicFlexibility || '',
        city: firestoreData.city || prevData.city || '',
        country: firestoreData.country || prevData.country || '',
        willingToRelocate: firestoreData.willingToRelocate !== undefined ? firestoreData.willingToRelocate : prevData.willingToRelocate,
        workPreference: firestoreData.workPreference || prevData.workPreference || '',
        travelPreference: firestoreData.travelPreference || prevData.travelPreference || '',
        cvUrl: firestoreData.cvUrl || prevData.cvUrl || '',
        cvName: firestoreData.cvName || prevData.cvName || '',
        linkedinUrl: firestoreData.linkedinUrl || prevData.linkedinUrl || '',
        portfolioUrl: firestoreData.portfolioUrl || prevData.portfolioUrl || '',
        githubUrl: firestoreData.githubUrl || prevData.githubUrl || '',
      };
    });
  }, [currentUser, userData]);

  // Load initial data and listen for real-time changes
  useEffect(() => {
    if (authLoading || !currentUser?.uid) return;

    const loadInitialData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          updateFormDataFromFirestore(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        notify.error('Failed to load profile data');
      }
    };

    loadInitialData();

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

  // Debounced save to Firebase
  const saveToFirebase = useCallback(
    debounce(async (data: any) => {
      if (!currentUser?.uid) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          ...data,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving changes:', error);
        notify.error('Failed to save changes');
      }
    }, 1000),
    [currentUser]
  );

  const updateFormData = async (sectionData: any) => {
    const cleanedData = { ...sectionData };
    if (cleanedData.salaryRange && !cleanedData.salaryExpectations) {
      cleanedData.salaryExpectations = cleanedData.salaryRange;
      delete cleanedData.salaryRange;
    }

    setFormData(prev => ({
      ...prev,
      ...cleanedData
    }));

    saveToFirebase(cleanedData);
  };

  // Handle CV Import - Extract full profile from CV text
  const handleImportFromCV = useCallback(async () => {
    if (!currentUser?.uid || isImportingCV) return;
    
    try {
      // Get fresh cvText from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        notify.error('User data not found');
        return;
      }
      
      const firestoreUserData = userDoc.data();
      let storedCvText = firestoreUserData.cvText;
      const storedCvUrl = firestoreUserData.cvUrl;
      
      // Check if CV exists
      if (!storedCvUrl) {
        notify.error('No CV found. Please upload your CV first in the Documents section.');
        return;
      }
      
      setIsImportingCV(true);
      
      // If CV text is missing or too short, re-extract from the CV file
      if (!storedCvText || storedCvText.length < 100) {
        notify.info('Re-analyzing your CV...');
        
        try {
          // Fetch the CV file from storage
          const response = await fetch(storedCvUrl);
          if (!response.ok) {
            throw new Error('Failed to download CV file');
          }
          
          const blob = await response.blob();
          const file = new File([blob], 'cv.pdf', { type: 'application/pdf' });
          
          // Convert to images and extract text
          const images = await pdfToImages(file, 2, 1.5);
          const { text, technologies, skills, experiences } = await extractCVTextAndTags(images);
          
          if (!text || text.length < 50) {
            notify.error('Could not extract text from CV. Please try uploading a different format.');
            setIsImportingCV(false);
            return;
          }
          
          // Save the extracted cvText to Firebase for future use
          await updateDoc(doc(db, 'users', currentUser.uid), {
            cvText: text,
            cvTechnologies: technologies || [],
            cvSkills: skills || [],
            ...(experiences && experiences.length > 0 ? { professionalHistory: experiences } : {})
          });
          
          storedCvText = text;
          notify.success('CV re-analyzed successfully!');
        } catch (extractError) {
          console.error('CV re-extraction failed:', extractError);
          notify.error('Failed to analyze CV. Please try re-uploading your CV in the Documents section.');
          setIsImportingCV(false);
          return;
        }
      }
      
      notify.info('Extracting profile data from your CV...');
      
      // Extract full profile data
      const extractedProfile = await extractFullProfileFromText(storedCvText);
      
      // Prepare update object
      const updateData: Record<string, any> = {};
      
      // Personal info
      if (extractedProfile.personalInfo.firstName) {
        updateData.firstName = extractedProfile.personalInfo.firstName;
      }
      if (extractedProfile.personalInfo.lastName) {
        updateData.lastName = extractedProfile.personalInfo.lastName;
      }
      if (extractedProfile.personalInfo.email) {
        updateData.email = extractedProfile.personalInfo.email;
      }
      if (extractedProfile.personalInfo.phone) {
        updateData.phone = extractedProfile.personalInfo.phone;
      }
      if (extractedProfile.personalInfo.city) {
        updateData.city = extractedProfile.personalInfo.city;
      }
      if (extractedProfile.personalInfo.country) {
        updateData.country = extractedProfile.personalInfo.country;
      }
      if (extractedProfile.personalInfo.headline) {
        updateData.targetPosition = extractedProfile.personalInfo.headline;
        updateData.headline = extractedProfile.personalInfo.headline;
      }
      
      // Experiences
      if (extractedProfile.experiences && extractedProfile.experiences.length > 0) {
        // Convert experiences to the format expected by professionalHistory
        const formattedExperiences = extractedProfile.experiences.map(exp => ({
          title: exp.title,
          company: exp.company,
          companyLogo: '',
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current,
          industry: exp.industry || '',
          contractType: exp.contractType || 'full-time',
          location: exp.location || '',
          responsibilities: exp.responsibilities.length > 0 ? exp.responsibilities : [''],
          achievements: []
        }));
        updateData.professionalHistory = formattedExperiences;
      }
      
      // Educations (new format)
      if (extractedProfile.educations && extractedProfile.educations.length > 0) {
        updateData.educations = extractedProfile.educations;
        
        // Also set legacy fields for backwards compatibility
        const firstEdu = extractedProfile.educations[0];
        if (firstEdu) {
          updateData.educationLevel = firstEdu.degree;
          updateData.educationField = firstEdu.field;
          updateData.educationInstitution = firstEdu.institution;
          if (firstEdu.endDate) {
            updateData.graduationYear = firstEdu.endDate.split('-')[0];
          }
        }
      }
      
      // Skills (soft skills, methodologies)
      if (extractedProfile.skills && extractedProfile.skills.length > 0) {
        updateData.skills = extractedProfile.skills;
      }
      
      // Tools & Technologies
      if (extractedProfile.tools && extractedProfile.tools.length > 0) {
        updateData.tools = extractedProfile.tools;
      }
      
      // Languages
      if (extractedProfile.languages && extractedProfile.languages.length > 0) {
        updateData.languages = extractedProfile.languages;
      }
      
      // Professional Summary
      if (extractedProfile.summary) {
        updateData.professionalSummary = extractedProfile.summary;
      }
      
      // Profile tags (15-20 AI-generated tags summarizing the user for job matching)
      if (extractedProfile.profileTags && extractedProfile.profileTags.length > 0) {
        updateData.profileTags = extractedProfile.profileTags;
      }
      
      // Save to Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...updateData,
        lastUpdated: new Date().toISOString()
      });
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        ...updateData
      }));
      
      // Build success message
      const counts = [];
      if (extractedProfile.experiences?.length) counts.push(`${extractedProfile.experiences.length} experiences`);
      if (extractedProfile.educations?.length) counts.push(`${extractedProfile.educations.length} educations`);
      if (extractedProfile.skills?.length) counts.push(`${extractedProfile.skills.length} skills`);
      if (extractedProfile.tools?.length) counts.push(`${extractedProfile.tools.length} tools`);
      if (extractedProfile.languages?.length) counts.push(`${extractedProfile.languages.length} languages`);
      if (extractedProfile.profileTags?.length) counts.push(`${extractedProfile.profileTags.length} profile tags`);
      if (extractedProfile.summary) counts.push('summary');
      
      notify.success(`Profile imported! Found ${counts.join(', ')}`);
      
    } catch (error) {
      console.error('CV import failed:', error);
      notify.error('Failed to import profile from CV');
    } finally {
      setIsImportingCV(false);
    }
  }, [currentUser, isImportingCV]);

  // Auto-import CV data when profile is empty but CV exists
  useEffect(() => {
    const autoImportFromCV = async () => {
      // Skip if already imported, currently importing, no user, or still loading
      if (hasAutoImported || isImportingCV || !currentUser?.uid || authLoading) return;
      
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) return;
        
        const firestoreUserData = userDoc.data();
        
        // Check if profile is empty (no professional history)
        const profileIsEmpty = !firestoreUserData.professionalHistory || 
                               firestoreUserData.professionalHistory.length === 0;
        
        // Check if CV exists
        const cvExists = firestoreUserData.cvUrl && firestoreUserData.cvUrl.length > 0;
        
        // Only auto-import if profile is empty and CV exists
        if (profileIsEmpty && cvExists) {
          console.log('🔄 Auto-importing CV data: Profile is empty but CV exists');
          setHasAutoImported(true);
          // Small delay to ensure UI is ready
          setTimeout(() => {
            handleImportFromCV();
          }, 500);
        } else {
          // Mark as done even if we don't import (to prevent repeated checks)
          setHasAutoImported(true);
        }
      } catch (error) {
        console.error('Auto-import check failed:', error);
        setHasAutoImported(true);
      }
    };
    
    autoImportFromCV();
  }, [currentUser, authLoading, hasAutoImported, isImportingCV, handleImportFromCV]);

  return (
    <ProfileProvider>
      <AuthLayout>
        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.close}
          onNavigateToSection={navigateToSection}
        />

        <div className="min-h-0 flex-1 overflow-y-auto relative">
          {/* Keyboard shortcut hint */}
          <div className="fixed bottom-4 right-4 z-40">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              onClick={commandPalette.open}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2b2a2c] text-gray-600 dark:text-gray-400 text-sm rounded-xl shadow-lg border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
            >
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#3d3c3e] rounded text-xs font-mono">⌘K</kbd>
              <span>Quick actions</span>
            </motion.button>
          </div>

          {/* Main Content - Premium Layout */}
          <div className="relative w-full max-w-[1400px] mx-auto space-y-5 pt-6 px-4 sm:px-8 lg:px-12 xl:px-16 pb-24">
            {/* Profile Header - Pass completion percentage and CV import */}
            <ProfileHeader 
              onUpdate={updateFormData} 
              completionPercentage={completionPercentage}
              onImportCV={handleImportFromCV}
              isImportingCV={isImportingCV}
            />

            {/* About Section */}
            <div id="section-personal">
              <AboutSection onUpdate={updateFormData} />
            </div>

            {/* Experience Section */}
            <div id="section-experience">
              <ProfileSectionCard
                title="Experience"
                icon={<Briefcase className="w-5 h-5" />}
                isCollapsible={true}
              >
                <ProfessionalHistorySection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Education & Languages */}
            <div id="section-education">
              <ProfileSectionCard
                title="Education & Languages"
                icon={<GraduationCap className="w-5 h-5" />}
                completion={formData.educationLevel ? 100 : 0}
                isCollapsible={true}
              >
                <EducationLanguagesSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Skills & Expertise */}
            <div id="section-skills">
              <ProfileSectionCard
                title="Skills & Expertise"
                icon={<Wrench className="w-5 h-5" />}
                isCollapsible={true}
              >
                <ExperienceExpertiseSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Career Objectives */}
            <div id="section-objectives">
              <ProfileSectionCard
                title="Career Objectives"
                icon={<Target className="w-5 h-5" />}
                completion={formData.targetPosition ? 100 : 0}
                isCollapsible={true}
              >
                <ProfessionalObjectivesSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Location & Mobility */}
            <div id="section-location">
              <ProfileSectionCard
                title="Location & Mobility"
                icon={<MapPin className="w-5 h-5" />}
                completion={formData.city && formData.country ? 100 : 0}
                isCollapsible={true}
              >
                <LocationMobilitySection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Career Drivers */}
            <div id="section-career-drivers">
              <ProfileSectionCard
                title="Career Drivers"
                icon={<TrendingUp className="w-5 h-5" />}
                completion={formData.careerPriorities?.length > 0 ? 100 : 0}
                isCollapsible={true}
              >
                <CareerDriversSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Role Preferences */}
            <div id="section-role-preferences">
              <ProfileSectionCard
                title="Role Preferences"
                icon={<Building2 className="w-5 h-5" />}
                completion={formData.roleType ? 100 : 0}
                isCollapsible={true}
              >
                <RolePreferencesSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Documents & Links */}
            <div id="section-documents">
              <ProfileSectionCard
                title="Documents & Links"
                icon={<FileText className="w-5 h-5" />}
                completion={formData.cvUrl || formData.linkedinUrl ? 100 : 0}
                isCollapsible={true}
              >
                <DocumentsLinksSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>

            {/* Work Authorization & Auto-Apply Info */}
            <div id="section-work-auth">
              <ProfileSectionCard
                title="Work Authorization & Contact"
                icon={<Settings className="w-5 h-5" />}
                isCollapsible={true}
                defaultCollapsed={true}
              >
                <WorkAuthorizationSection onUpdate={updateFormData} />
              </ProfileSectionCard>
            </div>
          </div>
        </div>
      </AuthLayout>
    </ProfileProvider>
  );
};

export default ProfessionalProfilePage;
