import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Share2, Save, Eye, EyeOff,
  FileText, Sparkles, Settings, ChevronDown, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import EditorPanel from '../components/cv-editor/EditorPanel';
import PreviewContainer from '../components/cv-editor/PreviewContainer';
import AICompanionPanel from '../components/cv-editor/AICompanionPanel';
import CompanyHeader from '../components/cv-editor/CompanyHeader';
import { CVData, CVTemplate, CVEditorState, CVLayoutSettings } from '../types/cvEditor';
import { useCVEditor } from '../hooks/useCVEditor';
import { exportToPDF, generateId } from '../lib/cvEditorUtils';
import { parseCVData } from '../lib/cvSectionAI';
import { loadOrInitializeCVData } from '../lib/initializeCVData';
import AuthLayout from '../components/AuthLayout';

// Initial empty CV data structure
const initialCVData: CVData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    github: '',
    title: ''
  },
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  languages: [],
  sections: [
    { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
    { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
    { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
    { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
    { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
    { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
    { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
    { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
  ]
};

const TEMPLATES: { value: CVTemplate; label: string; description: string }[] = [
  { value: 'modern-professional', label: 'Modern Professional', description: 'Clean and ATS-optimized' },
  { value: 'executive-classic', label: 'Executive Classic', description: 'Traditional and elegant' },
  { value: 'tech-minimalist', label: 'Tech Minimalist', description: 'Google/Linear inspired' },
  { value: 'creative-balance', label: 'Creative Balance', description: 'Modern with personality' }
];

export default function PremiumCVEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  // Editor state
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [template, setTemplate] = useState<CVTemplate>('modern-professional');
  const [zoom, setZoom] = useState(100);
  const [showPreview, setShowPreview] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [jobContext, setJobContext] = useState<{
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  } | undefined>();
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // Layout settings state
  const [layoutSettings, setLayoutSettings] = useState<CVLayoutSettings>({
    fontSize: 10,
    dateFormat: 'jan-24',
    lineHeight: 1.3,
    fontFamily: 'Inter'
  });
  
  // Use custom hook for editor logic
  const {
    loadCVData,
    saveCVData,
    updateSection,
    reorderSections,
    toggleSection
  } = useCVEditor(cvData, setCvData, setIsDirty);

  // Load data on mount
  useEffect(() => {
    if (id) {
      // Load from ATS analysis if ID provided
      loadATSData(id);
    } else {
      // Load user profile data for standalone mode
      loadUserProfile();
    }
  }, [id, currentUser]);

  // Load ATS analysis data
  const loadATSData = async (analysisId: string) => {
    if (!currentUser) {
      console.error('No user authenticated');
      toast.error('Please sign in to access the CV editor');
      return;
    }
    
    try {
      // Use the new unified loading function
      console.log('Loading CV data for analysis:', analysisId);
      const { cvData: loadedCvData, jobContext: loadedJobContext } = await loadOrInitializeCVData(
        currentUser.uid,
        analysisId
      );
      
      setCvData(loadedCvData);
      setJobContext(loadedJobContext);
      
      if (loadedJobContext) {
        toast.success('CV and job context loaded successfully');
      } else {
        toast.info('CV loaded. Add job context for AI features.');
      }
      
      return; // Exit early since we've handled everything
      
      // Keep old code as fallback (but it won't be reached)
      const cvRewriteDoc = await getDoc(doc(db, 'users', currentUser.uid, 'cvRewrites', analysisId));
      
      if (cvRewriteDoc.exists()) {
        console.log('CV rewrite found:', cvRewriteDoc.data());
        const cvRewriteData = cvRewriteDoc.data();
        
        // Parse the CV data from the rewrite
        if (cvRewriteData.structured_data) {
          const structuredData = cvRewriteData.structured_data;
          
          // Convert to our CVData format
          const newCvData: CVData = {
            personalInfo: {
              firstName: structuredData.personalInfo?.firstName || '',
              lastName: structuredData.personalInfo?.lastName || '',
              email: structuredData.personalInfo?.email || '',
              phone: structuredData.personalInfo?.phone || '',
              location: structuredData.personalInfo?.location || '',
              linkedin: structuredData.personalInfo?.linkedin || '',
              portfolio: structuredData.personalInfo?.portfolio || '',
              github: structuredData.personalInfo?.github || '',
              title: structuredData.personalInfo?.title || ''
            },
            summary: structuredData.summary || '',
            experiences: (structuredData.experiences || []).map((exp: any) => ({
              id: exp.id || generateId(),
              title: exp.title || '',
              company: exp.company || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              current: exp.endDate === 'Present',
              description: exp.description || '',
              bullets: exp.bullets || []
            })),
            education: (structuredData.educations || []).map((edu: any) => ({
              id: edu.id || generateId(),
              degree: edu.degree || '',
              field: edu.field || '',
              institution: edu.institution || '',
              location: edu.location || '',
              startDate: edu.startDate || '',
              endDate: edu.endDate || edu.year || '',
              gpa: edu.gpa || '',
              honors: edu.honors || [],
              coursework: edu.coursework || []
            })),
            skills: (structuredData.skills || []).map((skill: string | any) => ({
              id: generateId(),
              name: typeof skill === 'string' ? skill : skill.name,
              category: typeof skill === 'object' ? skill.category : 'technical'
            })),
            certifications: (structuredData.certifications || []).map((cert: any) => ({
              id: cert.id || generateId(),
              name: cert.name || '',
              issuer: cert.issuer || '',
              date: cert.date || cert.year || '',
              expiryDate: cert.expiryDate || '',
              credentialId: cert.credentialId || '',
              url: cert.url || ''
            })),
            projects: (structuredData.projects || []).map((project: any) => ({
              id: project.id || generateId(),
              name: project.name || '',
              description: project.description || '',
              technologies: project.technologies || [],
              url: project.url || '',
              startDate: project.startDate || '',
              endDate: project.endDate || '',
              highlights: project.highlights || []
            })),
            languages: (structuredData.languages || []).map((lang: any) => ({
              id: lang.id || generateId(),
              name: lang.name || '',
              proficiency: lang.level || lang.proficiency || 'intermediate'
            })),
            sections: cvData.sections // Keep existing section configuration
          };
          
          setCvData(newCvData);
          toast.success('CV data loaded successfully');
        } else if (cvRewriteData.rewrittenCV) {
          // If we only have markdown, parse it
          const parsedData = await parseCVData(cvRewriteData.rewrittenCV);
          
          // Convert parsed data to our format
          setCvData(prev => ({
            ...prev,
            ...parsedData
          }));
          
          toast.success('CV data parsed and loaded');
        }
      } else {
        console.log('No CV rewrite found, loading from analysis...');
        // Try to load from the analysis itself
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', analysisId));
        
        if (analysisDoc.exists()) {
          console.log('Analysis found:', analysisDoc.data());
          const analysisData = analysisDoc.data();
          
          // Set job context from analysis
          setJobContext({
            jobTitle: analysisData.jobTitle || '',
            company: analysisData.company || '',
            jobDescription: analysisData.jobDescription || '',
            keywords: analysisData.skillsMatch?.missing?.map((s: any) => s.name) || [],
            strengths: analysisData.keyFindings?.filter((f: string) => 
              f.toLowerCase().includes('strong') || f.toLowerCase().includes('good')
            ) || [],
            gaps: analysisData.keyFindings?.filter((f: string) => 
              f.toLowerCase().includes('missing') || f.toLowerCase().includes('gap')
            ) || []
          });
          
          // Pre-populate with basic info from analysis
          setCvData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              // You might have some basic info in the analysis
            }
          }));
        }
        
        toast.info('No CV rewrite found. Starting with a blank template.');
      }
    } catch (error: any) {
      console.error('Error loading ATS data:', error);
      
      // Handle permission errors specifically
      if (error?.code === 'permission-denied') {
        toast.error('Permission denied. Loading default profile data instead.');
        // Fallback to loading user profile
        await loadUserProfile();
      } else {
        toast.error('Failed to load ATS data. Starting with default template.');
        // Load user profile as fallback
        await loadUserProfile();
      }
    }
  };

  // Load user profile data
  const loadUserProfile = async () => {
    if (!currentUser) {
      console.log('No user authenticated, using default data');
      return;
    }
    
    try {
      console.log('Loading user profile for:', currentUser.uid);
      
      // Try to load from Firestore first
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let profileData = userData || {};
      
      if (userDoc.exists()) {
        profileData = { ...profileData, ...userDoc.data() };
        console.log('User profile loaded from Firestore:', profileData);
      }
      
      // Convert user profile to CV data format
      setCvData(prev => ({
        ...prev,
        personalInfo: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || currentUser.email || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          linkedin: profileData.linkedin || '',
          portfolio: profileData.portfolio || '',
          github: profileData.github || '',
          title: profileData.currentPosition || profileData.jobTitle || profileData.title || ''
        },
        summary: profileData.summary || profileData.bio || prev.summary || '',
        skills: profileData.skills ? 
          (typeof profileData.skills[0] === 'string' ? 
            profileData.skills.map((skill: string) => ({
              id: generateId(),
              name: skill,
              category: 'technical'
            })) : 
            profileData.skills) : 
          prev.skills,
        experiences: profileData.experiences?.map((exp: any) => ({
          id: exp.id || generateId(),
          title: exp.title || exp.position || '',
          company: exp.company || exp.employer || '',
          location: exp.location || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || (exp.current ? 'Present' : ''),
          current: exp.current || exp.endDate === 'Present',
          description: exp.description || '',
          bullets: exp.achievements || exp.bullets || exp.responsibilities || []
        })) || prev.experiences,
        education: profileData.education?.map((edu: any) => ({
          id: edu.id || generateId(),
          degree: edu.degree || '',
          field: edu.field || edu.major || '',
          institution: edu.institution || edu.school || '',
          location: edu.location || '',
          startDate: edu.startDate || '',
          endDate: edu.endDate || edu.graduationYear || '',
          gpa: edu.gpa || '',
          honors: edu.honors || [],
          coursework: edu.coursework || []
        })) || prev.education
      }));
      
      toast.success('Profile data loaded successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.info('Starting with a blank CV template');
    }
  };

  // Handle template change
  const handleTemplateChange = (newTemplate: CVTemplate) => {
    setTemplate(newTemplate);
    toast.success(`Switched to ${TEMPLATES.find(t => t.value === newTemplate)?.label} template`);
  };

  // Handle zoom changes
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  // Handle layout settings changes
  const handleLayoutSettingsChange = useCallback((updates: Partial<CVLayoutSettings>) => {
    setLayoutSettings(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCVData();
      setIsDirty(false);
      toast.success('CV saved successfully');
    } catch (error) {
      console.error('Error saving CV:', error);
      toast.error('Failed to save CV');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(cvData, template);
      toast.success('CV exported successfully');
    } catch (error) {
      console.error('Error exporting CV:', error);
      toast.error('Failed to export CV');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle share
  const handleShare = () => {
    // TODO: Implement share functionality
    toast.info('Share functionality coming soon!');
  };

  // Auto-save
  useEffect(() => {
    if (!isDirty) return;
    
    const timer = setTimeout(() => {
      handleSave();
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [cvData, isDirty]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <AuthLayout>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Premium Top Bar */}
        <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-6 py-3.5">
            <div className="flex items-center justify-between">
              {/* Left: Company Context */}
              <CompanyHeader
                companyName={jobContext?.company}
                jobTitle={jobContext?.jobTitle}
              />

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Auto-save indicator */}
                {isSaving && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-2">
                    Saving...
                  </span>
                )}
                {!isSaving && isDirty && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-3 py-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved
                  </span>
                )}

                {/* AI Assistant */}
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showAIPanel 
                      ? 'bg-[#EB7134]/10 dark:bg-[#EB7134]/30 text-[#EB7134] dark:text-[#EB7134] shadow-sm' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">AI Assistant</span>
                </button>

                {/* Toggle preview on mobile */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={showPreview ? 'Hide preview' : 'Show preview'}
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {/* Save button - Google style */}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/50 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Save className="w-4 h-4 relative z-10" />
                  <span className="hidden md:inline relative z-10">
                    {isSaving ? 'Saving...' : 'Save'}
                  </span>
                </button>

                {/* Export button - Premium gradient */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="group relative flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-[#EB7134] via-[#EB7134] to-[#5D4D6B] hover:from-[#EB7134] hover:via-[#EB7134] hover:to-[#5D4D6B] text-white rounded-full shadow-lg shadow-[#EB7134]/25 hover:shadow-xl hover:shadow-[#EB7134]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="hidden md:inline relative z-10">
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex overflow-hidden">
          {/* Left: Editor Panel */}
          <div className="h-full w-full lg:w-2/5 xl:w-[480px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <EditorPanel
              cvData={cvData}
              onUpdate={updateSection}
              onReorder={reorderSections}
              onToggleSection={toggleSection}
              layoutSettings={layoutSettings}
              onLayoutSettingsChange={handleLayoutSettingsChange}
              template={template}
              onTemplateChange={setTemplate}
              jobContext={jobContext}
            />
          </div>

          {/* Right: Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex-1 bg-gray-100 dark:bg-gray-950 hidden lg:block"
              >
                <PreviewContainer
                  cvData={cvData}
                  template={template}
                  zoom={zoom}
                  layoutSettings={layoutSettings}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Preview Overlay */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-40 bg-gray-100 dark:bg-gray-950"
              >
                <PreviewContainer
                  cvData={cvData}
                  template={template}
                  zoom={zoom}
                  layoutSettings={layoutSettings}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                />
                
                {/* Close button for mobile preview */}
                <button
                  onClick={() => setShowPreview(false)}
                  className="fixed top-20 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg"
                >
                  <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

        {/* AI Companion Panel */}
        <AICompanionPanel
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          cvData={cvData}
          jobContext={jobContext}
        />
      </div>
    </AuthLayout>
  );
}
