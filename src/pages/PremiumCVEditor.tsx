import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Save, Eye, EyeOff, X, ZoomIn, ZoomOut, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import EditorPanel from '../components/cv-editor/EditorPanel';
import PreviewContainer from '../components/cv-editor/PreviewContainer';
import AICompanionPanel from '../components/cv-editor/AICompanionPanel';
import CompanyHeader from '../components/cv-editor/CompanyHeader';
import { CVData, CVTemplate, CVEditorState, CVLayoutSettings, SectionClickTarget } from '../types/cvEditor';
import { HighlightTarget, CVSuggestion, CVReviewResult } from '../types/cvReview';
import { PreviousAnalysisContext } from '../types/cvReviewHistory';
import { useCVEditor } from '../hooks/useCVEditor';
import { exportToPDFEnhanced, generateId, A4_WIDTH_PX, A4_HEIGHT_PX } from '../lib/cvEditorUtils';
import { parseCVData } from '../lib/cvSectionAI';
import { loadOrInitializeCVData } from '../lib/initializeCVData';
import { analyzeCVWithAI } from '../services/cvReviewAI';
import { compareCVData, detectAppliedSuggestions } from '../lib/cvComparison';
import AuthLayout from '../components/AuthLayout';
import ModernProfessional from '../components/cv-editor/templates/ModernProfessional';
import ExecutiveClassic from '../components/cv-editor/templates/ExecutiveClassic';
import TechMinimalist from '../components/cv-editor/templates/TechMinimalist';
import CreativeBalance from '../components/cv-editor/templates/CreativeBalance';

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
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  
  // Check if this is a resume-builder route
  const isResumeBuilder = location.pathname.startsWith('/resume-builder/');
  
  // Editor state
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [template, setTemplate] = useState<CVTemplate>('modern-professional');
  const [zoom, setZoom] = useState(100);
  const [showPreview, setShowPreview] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resumeName, setResumeName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [jobContext, setJobContext] = useState<{
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  } | undefined>();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Click-to-edit from preview
  const [activeSectionTarget, setActiveSectionTarget] = useState<SectionClickTarget | null>(null);
  
  // Highlight section from AI review
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget | null>(null);
  
  // AI Review state - managed at page level for auto-loading
  const [reviewState, setReviewState] = useState<{
    result: CVReviewResult | null;
    ignoredIds: Set<string>;
    hasAnalyzed: boolean;
  }>({ result: null, ignoredIds: new Set(), hasAnalyzed: false });
  
  // Track if analysis is currently running
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Store CV snapshot from last analysis for comparison
  const [lastAnalyzedCVSnapshot, setLastAnalyzedCVSnapshot] = useState<CVData | null>(null);
  
  // Layout settings state
  const [layoutSettings, setLayoutSettings] = useState<CVLayoutSettings>({
    fontSize: 10,
    dateFormat: 'jan-24',
    lineHeight: 1.3,
    fontFamily: 'Inter',
    accentColor: 'emerald',
    experienceSpacing: 6
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
      if (isResumeBuilder) {
        // Load from resume builder (cvs collection)
        loadResumeData(id);
      } else {
        // Load from ATS analysis if ID provided
        loadATSData(id);
      }
    } else {
      // Load user profile data for standalone mode
      loadUserProfile();
    }
  }, [id, currentUser, isResumeBuilder]);

  // Run AI analysis function - can be called automatically or manually
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('🚀 Starting AI review analysis...');
      
      // Build previous analysis context if we have history
      let previousAnalysis: PreviousAnalysisContext | undefined;
      
      if (reviewState.result && lastAnalyzedCVSnapshot) {
        // Detect which suggestions were applied by comparing CV states
        const changes = compareCVData(cvData, lastAnalyzedCVSnapshot);
        const appliedSuggestionIds = detectAppliedSuggestions(
          changes,
          reviewState.result.suggestions
        );
        
        previousAnalysis = {
          score: reviewState.result.summary.overallScore,
          suggestions: reviewState.result.suggestions,
          appliedSuggestionIds,
          previousCVSnapshot: lastAnalyzedCVSnapshot,
          timestamp: reviewState.result.analyzedAt
        };
        
        console.log(`   📊 Previous analysis context:`, {
          previousScore: previousAnalysis.score,
          appliedSuggestionsCount: appliedSuggestionIds.length,
          hasChanges: changes.hasChanges
        });
      }
      
      const analysisResult = await analyzeCVWithAI({
        cvData,
        jobContext,
        previousAnalysis
      });
      
      // Store current CV snapshot for next comparison
      setLastAnalyzedCVSnapshot(JSON.parse(JSON.stringify(cvData)));
      
      setReviewState({
        result: analysisResult,
        ignoredIds: new Set(),
        hasAnalyzed: true
      });
      
      // Show success message with score improvement if applicable
      if (previousAnalysis) {
        const scoreImprovement = analysisResult.summary.overallScore - previousAnalysis.score;
        if (scoreImprovement > 0) {
          toast.success(`Analysis complete! Your score improved by +${scoreImprovement} points! 🎉`);
        } else if (scoreImprovement < 0) {
          toast.info('Analysis complete. Let\'s work on improving your CV.');
        } else {
          toast.success('Analysis complete!');
        }
      } else {
        toast.success('AI review analysis completed!');
      }
      
      console.log('✅ AI review analysis completed');
    } catch (error: any) {
      console.error('❌ AI review analysis error:', error);
      toast.error('Failed to analyze CV. Please try again.');
      // Mark as analyzed even on error to prevent re-triggering
      setReviewState(prev => ({
        ...prev,
        hasAnalyzed: true
      }));
    } finally {
      setIsAnalyzing(false);
    }
  }, [cvData, jobContext, reviewState.result, lastAnalyzedCVSnapshot]);

  // Auto-trigger AI review analysis once CV data is loaded
  useEffect(() => {
    // Only run if:
    // 1. We have CV data (not empty)
    // 2. We haven't analyzed yet
    // 3. We're not currently analyzing
    // 4. We have at least some content to analyze
    const hasContent = 
      cvData.personalInfo.firstName || 
      cvData.personalInfo.lastName || 
      cvData.summary || 
      cvData.experiences.length > 0 ||
      cvData.education.length > 0;

    if (hasContent && !reviewState.hasAnalyzed && !isAnalyzing) {
      runAnalysis();
    }
  }, [cvData.personalInfo.firstName, cvData.personalInfo.lastName, cvData.summary, cvData.experiences.length, cvData.education.length, reviewState.hasAnalyzed, isAnalyzing, runAnalysis]);

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
      const { cvData: loadedCvData, jobContext: loadedJobContext, editorState } = await loadOrInitializeCVData(
        currentUser.uid,
        analysisId
      );
      
      setCvData(loadedCvData);
      setJobContext(loadedJobContext);
      
      // Restore editor state if it exists
      if (editorState) {
        console.log('Restoring editor state:', editorState);
        if (editorState.template) {
          setTemplate(editorState.template);
        }
        if (editorState.layoutSettings) {
          setLayoutSettings(editorState.layoutSettings);
        }
        if (editorState.zoom) {
          setZoom(editorState.zoom);
        }
        toast.success('CV, preferences, and job context loaded successfully');
      } else if (loadedJobContext) {
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

  // Load resume data from resume builder (cvs collection)
  const loadResumeData = async (resumeId: string) => {
    if (!currentUser) {
      console.error('No user authenticated');
      toast.error('Please sign in to access the CV editor');
      return;
    }
    
    try {
      console.log('Loading resume data for:', resumeId);
      const resumeDoc = await getDoc(doc(db, 'users', currentUser.uid, 'cvs', resumeId));
      
      if (resumeDoc.exists()) {
        const data = resumeDoc.data();
        console.log('Resume data loaded:', data);
        
        // Load resume name
        if (data.name) {
          setResumeName(data.name);
          setEditedName(data.name);
        }
        
        // Load resume name
        if (data.name) {
          setResumeName(data.name);
          setEditedName(data.name);
        }
        
        // Load CV data
        if (data.cvData) {
          setCvData(data.cvData);
        } else {
          // If cvData doesn't exist, use the data directly (for backward compatibility)
          setCvData(data as any);
        }
        
        // Load template and layout settings if they exist
        if (data.template) {
          setTemplate(data.template as CVTemplate);
        }
        if (data.layoutSettings) {
          setLayoutSettings(data.layoutSettings);
        }
        
        toast.success('Resume loaded successfully');
      } else {
        toast.error('Resume not found');
        navigate('/resume-builder');
      }
    } catch (error: any) {
      console.error('Error loading resume data:', error);
      toast.error('Failed to load resume');
      navigate('/resume-builder');
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

  // Handle fullscreen toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle layout settings changes
  const handleLayoutSettingsChange = useCallback((updates: Partial<CVLayoutSettings>) => {
    setLayoutSettings(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  // Handle click on CV preview section to open editor
  const handlePreviewSectionClick = useCallback((target: SectionClickTarget) => {
    setActiveSectionTarget(target);
  }, []);

  // Clear active section target after EditorPanel has processed it
  const clearActiveSectionTarget = useCallback(() => {
    setActiveSectionTarget(null);
  }, []);

  // Handle re-analyze request from user
  const handleReanalyze = useCallback(() => {
    // Reset hasAnalyzed flag to allow re-analysis
    setReviewState(prev => ({
      ...prev,
      hasAnalyzed: false
    }));
    // Trigger analysis
    runAnalysis();
  }, [runAnalysis]);

  // Handle applying AI suggestions to the CV
  const handleApplySuggestion = useCallback((suggestion: CVSuggestion) => {
    const { action } = suggestion;
    
    console.log('🔵 handleApplySuggestion called');
    console.log('   Suggestion:', suggestion.title);
    console.log('   Action:', JSON.stringify(action, null, 2));
    console.log('   SuggestedValue:', action.suggestedValue);
    
    if (!action.suggestedValue) {
      console.error('❌ No suggested value to apply');
      toast.error('No suggested value to apply');
      return;
    }

    // Cast to string for flexible comparison since API can return different values
    const targetSection = action.targetSection as string;
    const targetField = action.targetField;
    
    try {
      // ==========================================
      // PERSONAL INFO / CONTACT SECTION
      // ==========================================
      // Handle both "contact" and "personalInfo" as target sections
      const isPersonalInfo = targetSection === 'contact' || 
                            targetSection === 'personalInfo' || 
                            targetSection === 'personal';
      
      if (isPersonalInfo && targetField) {
        console.log('✅ Applying to personal info:', targetField);
        setCvData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            [targetField]: action.suggestedValue
          }
        }));
        setIsDirty(true);
        setHighlightTarget(null);
        toast.success(`${targetField.charAt(0).toUpperCase() + targetField.slice(1)} updated!`);
        return;
      }

      // ==========================================
      // SUMMARY / ABOUT SECTION
      // ==========================================
      if (targetSection === 'about' || targetSection === 'summary' || targetField === 'summary') {
        console.log('✅ Applying to summary section');
        setCvData(prev => ({
          ...prev,
          summary: action.suggestedValue!
        }));
        setIsDirty(true);
        setHighlightTarget(null);
        toast.success('Summary updated!');
        return;
      }

      // ==========================================
      // SKILLS SECTION
      // ==========================================
      if (targetSection === 'skills') {
        if (action.type === 'add' || !action.targetItemId) {
          console.log('✅ Adding skills from suggestion');
          const skillNames = action.suggestedValue!.split(',').map(s => s.trim()).filter(s => s);
          const newSkills = skillNames.map((skill, index) => ({
            id: `skill-ai-${Date.now()}-${index}`,
            name: skill,
            level: 'intermediate' as const,
            category: 'technical' as const
          }));
          
          setCvData(prev => ({
            ...prev,
            skills: [...prev.skills, ...newSkills]
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success(`Added ${newSkills.length} skill${newSkills.length > 1 ? 's' : ''}!`);
          return;
        }
      }

      // ==========================================
      // EXPERIENCES SECTION
      // ==========================================
      if (targetSection === 'experiences' || targetSection === 'experience') {
        if (action.targetItemId) {
          console.log('✅ Updating experience item:', action.targetItemId);
          
          // If we have a specific field, update that field
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              experiences: prev.experiences.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: action.suggestedValue }
                  : item
              )
            }));
          } else {
            // No specific field - check if it's about bullets (most common case)
            // If suggestedValue looks like a bullet point, add it to bullets
            const suggestedValue = action.suggestedValue!;
            setCvData(prev => ({
              ...prev,
              experiences: prev.experiences.map(item => {
                if (item.id === action.targetItemId) {
                  // Add to bullets array
                  const newBullets = [...(item.bullets || []), suggestedValue];
                  return { ...item, bullets: newBullets };
                }
                return item;
              })
            }));
          }
          
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Experience updated!');
          return;
        }
      }

      // ==========================================
      // EDUCATION SECTION
      // ==========================================
      if (targetSection === 'education') {
        if (action.targetItemId) {
          console.log('✅ Updating education item:', action.targetItemId);
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              education: prev.education.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: action.suggestedValue }
                  : item
              )
            }));
          } else {
            // Update description by default
            setCvData(prev => ({
              ...prev,
              education: prev.education.map(item =>
                item.id === action.targetItemId
                  ? { ...item, description: action.suggestedValue }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Education updated!');
          return;
        }
      }

      // ==========================================
      // CERTIFICATIONS SECTION
      // ==========================================
      if (targetSection === 'certifications') {
        // Update existing certification
        if (action.targetItemId) {
          console.log('✅ Updating certification item:', action.targetItemId);
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              certifications: prev.certifications.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: action.suggestedValue }
                  : item
              )
            }));
          } else {
            // Update name by default
            setCvData(prev => ({
              ...prev,
              certifications: prev.certifications.map(item =>
                item.id === action.targetItemId
                  ? { ...item, name: action.suggestedValue! }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Certification updated!');
          return;
        }
        // Add new certification
        if (action.type === 'add' || !action.targetItemId) {
          console.log('✅ Adding new certification');
          const newCert = {
            id: `cert-ai-${Date.now()}`,
            name: action.suggestedValue!,
            issuer: '',
            date: ''
          };
          setCvData(prev => ({
            ...prev,
            certifications: [...prev.certifications, newCert]
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Certification added!');
          return;
        }
      }

      // ==========================================
      // PROJECTS SECTION
      // ==========================================
      if (targetSection === 'projects') {
        if (action.targetItemId) {
          console.log('✅ Updating project item:', action.targetItemId);
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              projects: prev.projects.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: action.suggestedValue }
                  : item
              )
            }));
          } else {
            // Add to highlights by default for projects
            setCvData(prev => ({
              ...prev,
              projects: prev.projects.map(item => {
                if (item.id === action.targetItemId) {
                  const newHighlights = [...(item.highlights || []), action.suggestedValue!];
                  return { ...item, highlights: newHighlights };
                }
                return item;
              })
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Project updated!');
          return;
        }
      }

      // ==========================================
      // LANGUAGES SECTION
      // ==========================================
      if (targetSection === 'languages') {
        if (action.targetItemId) {
          console.log('✅ Updating language item:', action.targetItemId);
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              languages: prev.languages.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: action.suggestedValue }
                  : item
              )
            }));
          } else {
            // Update name by default for languages (proficiency has strict types)
            setCvData(prev => ({
              ...prev,
              languages: prev.languages.map(item =>
                item.id === action.targetItemId
                  ? { ...item, name: action.suggestedValue! }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success('Language updated!');
          return;
        }
      }

      // ==========================================
      // FALLBACK: If we have a targetField, try generic update
      // ==========================================
      if (targetField) {
        console.log('✅ Applying generic field update:', targetField, 'to section:', targetSection);
        
        // Try to update personal info if field matches
        const personalFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio', 'title'];
        if (personalFields.includes(targetField)) {
          setCvData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              [targetField]: action.suggestedValue
            }
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          toast.success(`${targetField.charAt(0).toUpperCase() + targetField.slice(1)} updated!`);
          return;
        }
      }

      // If we get here, we couldn't apply the suggestion
      console.error('❌ Could not determine how to apply suggestion');
      console.error('   targetSection:', targetSection);
      console.error('   targetField:', targetField);
      console.error('   targetItemId:', action.targetItemId);
      toast.error('Unable to apply this suggestion automatically. Please edit manually.');
      
    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  }, [setCvData, setIsDirty]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare editor state to save
      const editorStateToSave = {
        template,
        layoutSettings,
        zoom
      };
      
      await saveCVData(id, editorStateToSave, isResumeBuilder);
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
      await exportToPDFEnhanced(cvData, template, layoutSettings, {
        quality: 'high',
        compression: true
      });
      toast.success('CV exported successfully! High-quality PDF generated.');
    } catch (error) {
      console.error('Error exporting CV:', error);
      toast.error('Failed to export CV. Please try again.');
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
    
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Prepare editor state to save
        const editorStateToSave = {
          template,
          layoutSettings,
          zoom
        };
        
        await saveCVData(id, editorStateToSave, isResumeBuilder);
        setIsDirty(false);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [cvData, template, layoutSettings, zoom, isDirty, id, saveCVData]);

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
              {/* Left: Resume Name (for Resume Builder) or Company Context (for ATS Analysis) */}
              {isResumeBuilder && resumeName ? (
                <div className="flex items-center min-w-0 flex-1">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={async () => {
                        if (editedName.trim() && editedName !== resumeName && id) {
                          try {
                            const resumeRef = doc(db, 'users', currentUser!.uid, 'cvs', id);
                            await updateDoc(resumeRef, {
                              name: editedName.trim(),
                              updatedAt: serverTimestamp()
                            });
                            setResumeName(editedName.trim());
                            toast.success('Resume renamed');
                          } catch (error) {
                            console.error('Error renaming resume:', error);
                            toast.error('Failed to rename resume');
                            setEditedName(resumeName);
                          }
                        } else {
                          setEditedName(resumeName);
                        }
                        setIsEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        } else if (e.key === 'Escape') {
                          setEditedName(resumeName);
                          setIsEditingName(false);
                        }
                      }}
                      className="text-lg font-semibold text-gray-900 dark:text-white 
                        bg-transparent border-b-2 border-blue-500 dark:border-blue-400
                        focus:outline-none px-1 min-w-0 flex-1"
                      autoFocus
                    />
                  ) : (
                    <h1 
                      className="text-lg font-semibold text-gray-900 dark:text-white truncate
                        cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors
                        px-2 py-1 rounded"
                      onClick={() => {
                        setEditedName(resumeName);
                        setIsEditingName(true);
                      }}
                      title="Click to rename"
                    >
                      {resumeName}
                    </h1>
                  )}
                </div>
              ) : (
                <CompanyHeader
                  companyName={jobContext?.company}
                  jobTitle={jobContext?.jobTitle}
                />
              )}

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

                {/* Save button - Premium Google Material Design 3 style */}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="group relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:shadow-sm active:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200/80 font-medium text-sm"
                >
                  <Save className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="hidden md:inline">
                    {isSaving ? 'Saving...' : 'Save'}
                  </span>
                </button>

                {/* Export button - Premium Google Material Design 3 style */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="group relative flex items-center gap-2 px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#1557b0] text-white rounded-lg shadow-sm hover:shadow-md active:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1a73e8] font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex overflow-hidden relative">
          {/* Left: Editor Panel */}
          <div
            className={`h-full relative border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-visible flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isLeftPanelCollapsed 
                ? 'w-16' 
                : 'w-full lg:w-[480px]'
            }`}
          >
            <div className="h-full w-full overflow-hidden">
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
                activeSectionTarget={activeSectionTarget}
                onActiveSectionProcessed={clearActiveSectionTarget}
                onHighlightSection={setHighlightTarget}
                onApplySuggestion={handleApplySuggestion}
                reviewState={reviewState}
                onReviewStateChange={setReviewState}
                isAnalyzing={isAnalyzing}
                onReanalyze={handleReanalyze}
                isCollapsed={isLeftPanelCollapsed}
                onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              />
            </div>
          </div>

          {/* Right: Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex-1 bg-gray-100 dark:bg-gray-950 hidden lg:block"
                transition={{ duration: 0.2 }}
              >
                <PreviewContainer
                  cvData={cvData}
                  template={template}
                  zoom={zoom}
                  layoutSettings={layoutSettings}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                  onToggleFullscreen={handleToggleFullscreen}
                  onSectionClick={handlePreviewSectionClick}
                  highlightTarget={highlightTarget}
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
                  onToggleFullscreen={handleToggleFullscreen}
                  onSectionClick={handlePreviewSectionClick}
                  highlightTarget={highlightTarget}
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

        {/* Fullscreen Preview Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex items-center justify-center"
              onClick={handleToggleFullscreen}
            >
              <button
                onClick={handleToggleFullscreen}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Zoom Controls in Fullscreen */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  disabled={zoom <= 50}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <div className="flex rounded-2xl border border-white/30 overflow-hidden">
                  {[50, 70, 100, 120, 150].map((level) => (
                    <button
                      key={level}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const steps = Math.abs(level - zoom) / 10;
                        if (level > zoom) {
                          for (let i = 0; i < steps; i++) {
                            setTimeout(() => handleZoomIn(), i * 50);
                          }
                        } else if (level < zoom) {
                          for (let i = 0; i < steps; i++) {
                            setTimeout(() => handleZoomOut(), i * 50);
                          }
                        }
                      }}
                      className={`px-3 py-1 text-xs font-semibold ${
                        zoom === level ? 'bg-white text-gray-900' : 'text-white/80'
                      }`}
                    >
                      {level}%
                    </button>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  disabled={zoom >= 150}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
                  className="px-3 py-1 text-xs font-semibold text-white/80 hover:text-white transition-all"
                >
                  Reset
                </button>
              </div>

              <div className="overflow-auto max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center" style={{ minWidth: 'fit-content' }}>
                  <motion.div
                    animate={{ scale: zoom / 100 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{
                      transformOrigin: 'top center',
                    }}
                    className="m-8"
                  >
                  <div
                    id="cv-fullscreen-preview"
                    className="bg-white shadow-xl"
                    style={{
                      width: `${A4_WIDTH_PX}px`,
                      minHeight: `${A4_HEIGHT_PX}px`,
                      padding: '40px',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                      borderRadius: '2px'
                    }}
                  >
                    {/* Render template based on current selection */}
                    {(() => {
                      const layoutSettingsWithDefaults = layoutSettings || {
                        fontSize: 10,
                        dateFormat: 'jan-24',
                        lineHeight: 1.3,
                        fontFamily: 'Inter'
                      };

                      switch (template) {
                        case 'executive-classic':
                          return <ExecutiveClassic cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                        case 'tech-minimalist':
                          return <TechMinimalist cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                        case 'creative-balance':
                          return <CreativeBalance cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                        case 'modern-professional':
                        default:
                          return <ModernProfessional cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                      }
                    })()}
                  </div>
                </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
