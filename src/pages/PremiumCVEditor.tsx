import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Save, Eye, X, ZoomIn, ZoomOut, RefreshCw, FolderOpen, Languages, Loader2, GitCompare, MoreHorizontal, ChevronLeft, Sparkles, Palette, Settings, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import toast from 'react-hot-toast';
import { getDoc, doc, updateDoc, serverTimestamp, collection, query, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import EditorPanel, { TabType } from '../components/cv-editor/EditorPanel';
import PreviewContainer from '../components/cv-editor/PreviewContainer';
import AICompanionPanel from '../components/cv-editor/AICompanionPanel';
import CompanyHeader from '../components/cv-editor/CompanyHeader';
import TranslationModal from '../components/cv-editor/TranslationModal';
import BeforeAfterModal from '../components/cv-editor/BeforeAfterModal';
import { CVData, CVTemplate, CVEditorState, CVLayoutSettings, SectionClickTarget } from '../types/cvEditor';
import { HighlightTarget, CVSuggestion, CVReviewResult } from '../types/cvReview';
import { ComparisonSectionType } from '../types/cvComparison';
import { PreviousAnalysisContext } from '../types/cvReviewHistory';
import { useCVEditor } from '../hooks/useCVEditor';
import { useBeforeAfterComparison, useHasComparison } from '../hooks/useBeforeAfterComparison';
import { exportToPDFEnhanced, exportToPDFBlob, generateId, A4_WIDTH_PX, A4_HEIGHT_PX } from '../lib/cvEditorUtils';
import { parseCVData } from '../lib/cvSectionAI';
import { loadOrInitializeCVData } from '../lib/initializeCVData';
import { analyzeCVWithAI } from '../services/cvReviewAI';
import { compareCVData, detectAppliedSuggestions } from '../lib/cvComparison';
import AuthLayout from '../components/AuthLayout';
import SaveAsModal, { Folder } from '../components/cv-editor/SaveAsModal';
import ExportPDFModal from '../components/cv-editor/ExportPDFModal';
import MobileBottomSheet, { BottomSheetMenuItem, BottomSheetDivider } from '../components/cv-editor/MobileBottomSheet';
import ModernProfessional from '../components/cv-editor/templates/ModernProfessional';
import ExecutiveClassic from '../components/cv-editor/templates/ExecutiveClassic';
import TechMinimalist from '../components/cv-editor/templates/TechMinimalist';
import CreativeBalance from '../components/cv-editor/templates/CreativeBalance';
import HarvardClassic from '../components/cv-editor/templates/HarvardClassic';
import SwissPhoto from '../components/cv-editor/templates/SwissPhoto';
import CorporatePhoto from '../components/cv-editor/templates/CorporatePhoto';
import ElegantSimple from '../components/cv-editor/templates/ElegantSimple';
import { useAssistantPageData } from '../hooks/useAssistantPageData';
import { CompanyLogo } from '../components/common/CompanyLogo';

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
    title: '',
    photoUrl: ''
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
  { value: 'creative-balance', label: 'Creative Balance', description: 'Modern with personality' },
  { value: 'harvard-classic', label: 'Harvard', description: 'Academic & ATS-perfect' },
  { value: 'swiss-photo', label: 'Swiss', description: 'Clean bi-column with photo' },
  { value: 'corporate-photo', label: 'Corporate', description: 'Professional header with photo' },
  { value: 'elegant-simple', label: 'Elegant', description: 'Ultra-minimal single column' }
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
  // isSaving is now managed by useCVEditor
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

  // Save As modal state
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isSavingAs, setIsSavingAs] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Translation state
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Export PDF modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<TabType>('editor');

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

  // AbortController ref for cancelling ongoing analysis requests
  const analysisAbortControllerRef = useRef<AbortController | null>(null);

  // Store CV snapshot from last analysis for comparison
  const [lastAnalyzedCVSnapshot, setLastAnalyzedCVSnapshot] = useState<CVData | null>(null);

  // Before/After comparison state - stores original CV data for diff
  const [initialCVMarkdown, setInitialCVMarkdown] = useState<string | undefined>(undefined);
  const [originalStructuredData, setOriginalStructuredData] = useState<any>(undefined);

  // Layout settings state
  const [layoutSettings, setLayoutSettings] = useState<CVLayoutSettings>({
    fontSize: 10,
    dateFormat: 'jan-24',
    lineHeight: 1.3,
    fontFamily: 'Inter',
    accentColor: 'emerald',
    experienceSpacing: 6,
    showSkillLevel: true
  });

  // Use custom hook for editor logic
  const {
    loadCVData,
    saveCVData,
    debouncedSave,
    isSaving,
    updateSection,
    reorderSections,
    toggleSection
  } = useCVEditor(cvData, setCvData, setIsDirty);

  // Auto-save effect
  useEffect(() => {
    if (isDirty && id) {
      const editorStateToSave = {
        template,
        layoutSettings,
        zoom
      };
      debouncedSave(id, editorStateToSave, isResumeBuilder);
    }
  }, [cvData, template, layoutSettings, zoom, isDirty, id, isResumeBuilder, debouncedSave]);

  // Before/After comparison hook
  const hasComparison = useHasComparison(initialCVMarkdown, cvData, originalStructuredData);
  const {
    comparison,
    modalState: comparisonModalState,
    openModal: openComparisonModal,
    closeModal: closeComparisonModal,
    setViewMode: setComparisonViewMode,
    selectSection: selectComparisonSection,
    toggleExperienceExpanded,
    toggleEducationExpanded,
  } = useBeforeAfterComparison({
    initialCVMarkdown,
    originalStructuredData,
    currentCVData: cvData,
  });

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

  // Fetch folders for Save As modal (only for ATS analysis mode)
  useEffect(() => {
    const fetchFolders = async () => {
      if (!currentUser || isResumeBuilder) return;

      try {
        const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
        const q = query(foldersRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);

        const foldersList: Folder[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          foldersList.push({
            id: docSnap.id,
            name: data.name,
            icon: data.icon || '📁',
            color: data.color || '#8B5CF6',
            order: data.order || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });

        setFolders(foldersList);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    fetchFolders();
  }, [currentUser, isResumeBuilder]);

  // Run AI analysis function - can be called automatically or manually
  const runAnalysis = useCallback(async () => {
    // Cancel any previous ongoing analysis
    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current.abort();
    }

    // Create new AbortController for this analysis
    const abortController = new AbortController();
    analysisAbortControllerRef.current = abortController;

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
        previousAnalysis,
        signal: abortController.signal
      });

      // Check if request was aborted before updating state
      if (abortController.signal.aborted) {
        console.log('Analysis was cancelled, skipping state update');
        return;
      }

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
          notify.success(`Analysis complete! Your score improved by +${scoreImprovement} points! 🎉`);
        } else if (scoreImprovement < 0) {
          notify.info('Analysis complete. Let\'s work on improving your CV.');
        } else {
          notify.success('Analysis complete!');
        }
      }

      console.log('✅ AI review analysis completed');
    } catch (error: any) {
      // Ignore abort errors - these are expected when navigating away or starting new analysis
      if (error.name === 'AbortError' || error.name === 'CanceledError' || abortController.signal.aborted) {
        console.log('Analysis request was cancelled');
        return;
      }

      console.error('❌ AI review analysis error:', error);
      notify.error('Failed to analyze CV. Please try again.');
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

  // Cleanup: cancel any ongoing analysis when component unmounts
  useEffect(() => {
    return () => {
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Load ATS analysis data
  const loadATSData = async (analysisId: string) => {
    if (!currentUser) {
      console.error('No user authenticated');
      notify.error('Please sign in to access the CV editor');
      return;
    }

    try {
      // Use the new unified loading function
      console.log('Loading CV data for analysis:', analysisId);
      const {
        cvData: loadedCvData,
        jobContext: loadedJobContext,
        editorState,
        initialCVMarkdown: loadedInitialCV,
        originalStructuredData: loadedOriginalStructured
      } = await loadOrInitializeCVData(
        currentUser.uid,
        analysisId
      );

      setCvData(loadedCvData);
      setJobContext(loadedJobContext);

      // Store original CV data for before/after comparison
      // PRIORITY: Use structured data (more accurate) over raw markdown
      if (loadedOriginalStructured) {
        setOriginalStructuredData(loadedOriginalStructured);
        console.log('Original structured data loaded for comparison');
      }
      if (loadedInitialCV) {
        setInitialCVMarkdown(loadedInitialCV);
        console.log('Initial CV markdown loaded for comparison (fallback)');
      }

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
      }

      return; // Exit early since we've handled everything

    } catch (error) {
      console.error('Error loading ATS analysis data:', error);
      notify.error('Failed to load CV data');
      // Fallback to profile data if analysis load fails
      loadUserProfile();
    }
  };

  // Load Resume Builder data
  const loadResumeData = async (resumeId: string) => {
    if (!currentUser) {
      console.error('No user authenticated');
      notify.error('Please sign in to access the CV editor');
      return;
    }

    try {
      console.log('Loading Resume Builder data:', resumeId);
      const resumeDoc = await getDoc(doc(db, 'users', currentUser.uid, 'cvs', resumeId));

      if (resumeDoc.exists()) {
        const data = resumeDoc.data();
        console.log('Resume data found:', data);

        setResumeName(data.name || 'Untitled Resume');

        // Load CV data
        if (data.cvData) {
          setCvData(data.cvData);
        }

        // Load template preferences
        if (data.template) {
          setTemplate(data.template as CVTemplate);
        }

        // Load layout settings
        if (data.layoutSettings) {
          setLayoutSettings(data.layoutSettings);
        }

        // Load job context if available
        if (data.sourceJobContext) {
          setJobContext({
            jobTitle: data.sourceJobContext.jobTitle,
            company: data.sourceJobContext.company,
            // These fields might not be stored in sourceJobContext, default to empty
            keywords: [],
            strengths: [],
            gaps: []
          });
        }

        notify.success('Resume loaded successfully');
      } else {
        console.error('Resume document not found');
        notify.error('Resume not found');
        navigate('/resume-builder');
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
      notify.error('Failed to load resume');
    }
  };

  // Load user profile data (fallback/standalone mode)
  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      console.log('Loading user profile data...');
      // ... (implementation omitted for brevity, same as before)
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Handle layout settings change
  const handleLayoutSettingsChange = (newSettings: Partial<CVLayoutSettings>) => {
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };
      setIsDirty(true);
      return updated;
    });
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);
  const handleToggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Handle section click in preview
  const handlePreviewSectionClick = (target: SectionClickTarget) => {
    setActiveSectionTarget(target);
    // Ensure panel is open
    setIsLeftPanelCollapsed(false);
  };

  // Clear active target after processing
  const clearActiveSectionTarget = () => {
    setActiveSectionTarget(null);
  };

  // Handle re-analyze request
  const handleReanalyze = () => {
    runAnalysis();
  };

  // Helper function to clean suggested values from AI
  // Removes JSON wrappers and fixes formatting issues
  const cleanSuggestedValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;

    // If already a clean string
    if (typeof value === 'string') {
      let cleaned = value.trim();

      // Remove markdown code blocks if present
      // Matches ```json ... ``` or ``` ... ```
      const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      // Check if it's a JSON object string like { "content": "..." }
      if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
          const parsed = JSON.parse(cleaned);
          // Extract content field if present
          if (parsed.content && typeof parsed.content === 'string') {
            cleaned = parsed.content.trim();
          } else if (parsed.suggestedValue && typeof parsed.suggestedValue === 'string') {
            cleaned = parsed.suggestedValue.trim();
          } else if (parsed.value && typeof parsed.value === 'string') {
            cleaned = parsed.value.trim();
          }
        } catch {
          // Not valid JSON, continue with the string
        }
      }

      // Remove leading/trailing quotes that might have been added
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }

      // Remove any "content:" prefix that might slip through
      const contentPrefixMatch = cleaned.match(/^["']?content["']?\s*:\s*["']?(.+?)["']?$/i);
      if (contentPrefixMatch) {
        cleaned = contentPrefixMatch[1];
      }

      return cleaned.length > 0 ? cleaned : null;
    }

    // If it's an object with content field
    if (typeof value === 'object') {
      if (value.content && typeof value.content === 'string') {
        return value.content.trim();
      }
      if (value.suggestedValue && typeof value.suggestedValue === 'string') {
        return value.suggestedValue.trim();
      }
      if (value.value && typeof value.value === 'string') {
        return value.value.trim();
      }
      // Last resort: stringify non-null objects
      try {
        const str = JSON.stringify(value);
        // But don't return JSON objects as values
        if (str.startsWith('{') || str.startsWith('[')) {
          console.warn('Unexpected object value in suggestion, cannot clean:', value);
          return null;
        }
        return str;
      } catch {
        return null;
      }
    }

    // For other types (numbers, etc.)
    return String(value);
  };

  // Apply suggestion from AI Review
  const handleApplySuggestion = useCallback((suggestion: CVSuggestion) => {
    console.log('Applying suggestion:', suggestion);
    const { action, id } = suggestion;
    const { type, targetSection, targetField } = action;

    // Clean the suggested value before using it
    const suggestedValue = cleanSuggestedValue(action.suggestedValue);
    console.log('Cleaned suggestedValue:', suggestedValue);

    // Ignore functionality
    if (type === 'remove' && targetSection === 'suggestion') {
      setReviewState(prev => {
        const newIgnored = new Set(prev.ignoredIds);
        newIgnored.add(id);
        return { ...prev, ignoredIds: newIgnored };
      });
      notify.success('Suggestion dismissed');
      return;
    }

    try {
      // ==========================================
      // PERSONAL INFO SECTION
      // ==========================================
      if (targetSection === 'personal' || targetSection === 'contact') {
        if (targetField && suggestedValue) {
          setCvData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              [targetField]: suggestedValue
            }
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Personal info updated!');
          return;
        }
      }

      // ==========================================
      // SUMMARY SECTION
      // ==========================================
      if (targetSection === 'summary') {
        if (suggestedValue) {
          setCvData(prev => ({
            ...prev,
            summary: suggestedValue
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Summary updated!');
          return;
        }
      }

      // ==========================================
      // SKILLS SECTION
      // ==========================================
      if (targetSection === 'skills') {
        // Add new skill
        if (action.type === 'add') {
          console.log('✅ Adding new skill:', suggestedValue);
          const newSkill = {
            id: `skill-ai-${Date.now()}`,
            name: suggestedValue!,
            category: 'technical',
            level: 'intermediate' as const
          };
          setCvData(prev => ({
            ...prev,
            skills: [...prev.skills, newSkill]
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Skill added!');
          return;
        }
      }

      // ==========================================
      // EXPERIENCE SECTION
      // ==========================================
      if (targetSection === 'experience' || targetSection === 'experiences') {
        // Update specific item field
        if (action.targetItemId) {
          console.log('✅ Updating experience item:', action.targetItemId);
          if (targetField) {
            setCvData(prev => ({
              ...prev,
              experiences: prev.experiences.map(item =>
                item.id === action.targetItemId
                  ? { ...item, [targetField]: suggestedValue }
                  : item
              )
            }));
          } else {
            // Update description by default if no field specified
            setCvData(prev => ({
              ...prev,
              experiences: prev.experiences.map(item =>
                item.id === action.targetItemId
                  ? { ...item, description: suggestedValue }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Experience updated!');
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
                  ? { ...item, [targetField]: suggestedValue }
                  : item
              )
            }));
          } else {
            // Update description by default
            setCvData(prev => ({
              ...prev,
              education: prev.education.map(item =>
                item.id === action.targetItemId
                  ? { ...item, description: suggestedValue }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Education updated!');
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
                  ? { ...item, [targetField]: suggestedValue }
                  : item
              )
            }));
          } else {
            // Update name by default
            setCvData(prev => ({
              ...prev,
              certifications: prev.certifications.map(item =>
                item.id === action.targetItemId
                  ? { ...item, name: suggestedValue }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Certification updated!');
          return;
        }
        // Add new certification
        if (action.type === 'add' || !action.targetItemId) {
          console.log('✅ Adding new certification');
          const newCert = {
            id: `cert-ai-${Date.now()}`,
            name: suggestedValue,
            issuer: '',
            date: ''
          };
          setCvData(prev => {
            const newCertifications = [...prev.certifications, newCert];
            // Auto-enable certifications section if it was disabled
            const sectionIndex = prev.sections.findIndex(s => s.type === 'certifications');
            const updatedSections = [...prev.sections];
            if (sectionIndex !== -1 && !updatedSections[sectionIndex].enabled) {
              updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], enabled: true };
            }
            return {
              ...prev,
              certifications: newCertifications,
              sections: updatedSections
            };
          });
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Certification added!');
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
                  ? { ...item, [targetField]: suggestedValue }
                  : item
              )
            }));
          } else {
            // Add to highlights by default for projects
            setCvData(prev => ({
              ...prev,
              projects: prev.projects.map(item => {
                if (item.id === action.targetItemId) {
                  const newHighlights = [...(item.highlights || []), suggestedValue];
                  return { ...item, highlights: newHighlights };
                }
                return item;
              })
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Project updated!');
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
                  ? { ...item, [targetField]: suggestedValue }
                  : item
              )
            }));
          } else {
            // Update name by default for languages (proficiency has strict types)
            setCvData(prev => ({
              ...prev,
              languages: prev.languages.map(item =>
                item.id === action.targetItemId
                  ? { ...item, name: suggestedValue }
                  : item
              )
            }));
          }
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success('Language updated!');
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
              [targetField]: suggestedValue
            }
          }));
          setIsDirty(true);
          setHighlightTarget(null);
          notify.success(`${targetField.charAt(0).toUpperCase() + targetField.slice(1)} updated!`);
          return;
        }
      }

      // If we get here, we couldn't apply the suggestion
      console.error('❌ Could not determine how to apply suggestion');
      console.error('   targetSection:', targetSection);
      console.error('   targetField:', targetField);
      console.error('   targetItemId:', action.targetItemId);
      notify.error('Unable to apply this suggestion automatically. Please edit manually.');

    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
      notify.error('Failed to apply suggestion');
    }
  }, [setCvData, setIsDirty]);

  // Handle save
  const handleSave = async () => {
    try {
      // Prepare editor state to save
      const editorStateToSave = {
        template,
        layoutSettings,
        zoom
      };

      await saveCVData(id, editorStateToSave, isResumeBuilder);
      // setIsDirty(false) is handled by saveCVData
      notify.success('CV saved successfully');
    } catch (error) {
      console.error('Error saving CV:', error);
      notify.error('Failed to save CV');
    }
  };

  // Handle export - opens the export modal
  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  // Handle direct download export
  const handleExportDownload = async () => {
    const isMobile = window.innerWidth < 1024;

    // On mobile, require Preview mode (better UX than auto-switching)
    if (isMobile && !showPreview) {
      notify.error('Please switch to Preview mode before exporting.');
      return;
    }

    // On desktop, auto-show preview if hidden
    const previewWasHidden = !showPreview;
    if (previewWasHidden) {
      setShowPreview(true);
      // Wait for React to render the preview DOM element
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsExporting(true);
    try {
      await exportToPDFEnhanced(cvData, template, layoutSettings, {
        quality: 'high',
        compression: true
      });
      setIsExportModalOpen(false);
      notify.success('CV exported successfully! High-quality PDF generated.');
    } catch (error: any) {
      console.error('Error exporting CV:', error);
      notify.error(error.message || 'Failed to export CV. Please try again.');
    } finally {
      // Restore preview state on desktop
      if (previewWasHidden) {
        setShowPreview(false);
      }
      setIsExporting(false);
    }
  };

  // Handle export to library - generates PDF and uploads to documents collection
  const handleExportToLibrary = async (fileName: string, folderId: string | null) => {
    if (!currentUser) {
      notify.error('Please sign in to save to library');
      return;
    }

    const isMobile = window.innerWidth < 1024;

    // On mobile, require Preview mode (better UX than auto-switching)
    if (isMobile && !showPreview) {
      notify.error('Please switch to Preview mode before exporting.');
      return;
    }

    // On desktop, auto-show preview if hidden
    const previewWasHidden = !showPreview;
    if (previewWasHidden) {
      setShowPreview(true);
      // Wait for React to render the preview DOM element
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsExporting(true);
    try {
      // Generate PDF as blob
      const { blob } = await exportToPDFBlob(cvData, template, 'high');

      // Use custom filename (ensure it ends with .pdf)
      const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // Generate unique document ID
      const documentId = generateId();
      const storageFileName = `${documentId}_${finalFileName}`;
      const fileRef = ref(storage, `cvs/${currentUser.uid}/${storageFileName}`);

      // Upload to Firebase Storage
      await uploadBytes(fileRef, blob, { contentType: 'application/pdf' });
      const downloadUrl = await getDownloadURL(fileRef);

      // Create document entry in Firestore
      const docRef = doc(db, 'users', currentUser.uid, 'documents', documentId);
      await setDoc(docRef, {
        name: finalFileName,
        fileUrl: downloadUrl,
        fileSize: blob.size,
        folderId: folderId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsExportModalOpen(false);

      notify.success(
        <div className="flex flex-col gap-1">
          <span>PDF saved to library!</span>
          <button
            onClick={() => navigate('/resume-builder')}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline text-left"
          >
            View in Resume Builder →
          </button>
        </div>,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Error saving PDF to library:', error);
      notify.error(error.message || 'Failed to save PDF to library. Please try again.');
    } finally {
      // Restore preview state on desktop
      if (previewWasHidden) {
        setShowPreview(false);
      }
      setIsExporting(false);
    }
  };

  // Generate default filename for export
  const getDefaultExportFileName = () => {
    const firstName = cvData.personalInfo.firstName || 'CV';
    const lastName = cvData.personalInfo.lastName || '';
    return `${firstName}_${lastName}_CV_${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '_');
  };

  // Handle share
  const handleShare = () => {
    // TODO: Implement share functionality
    notify.info('Share functionality coming soon!');
  };

  // Handle Save As - save tailored CV to Resume Builder library
  const handleSaveAs = async (name: string, folderId: string | null) => {
    if (!currentUser) {
      notify.error('Please sign in to save');
      return;
    }

    setIsSavingAs(true);
    try {
      const newResumeId = generateId();
      const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', newResumeId);

      await setDoc(resumeRef, {
        name,
        cvData,
        template,
        layoutSettings,
        folderId: folderId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUser.uid,
        // Store source info for reference
        sourceAnalysisId: id,
        sourceJobContext: jobContext ? {
          jobTitle: jobContext.jobTitle,
          company: jobContext.company
        } : null
      });

      setIsSaveAsModalOpen(false);

      notify.success(
        <div className="flex flex-col gap-1">
          <span>CV saved to library!</span>
          <button
            onClick={() => navigate('/resume-builder')}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline text-left"
          >
            View in Resume Builder →
          </button>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Error saving CV to library:', error);
      notify.error('Failed to save CV to library');
    } finally {
      setIsSavingAs(false);
    }
  };

  // Handle translation
  const handleTranslate = async (targetLanguage: string, folderId: string | null) => {
    if (!currentUser) return;

    // Close modal immediately to start "background" process UI in toolbar
    setIsTranslationModalOpen(false);
    setIsTranslating(true);

    try {
      // Create prompt for translation - Ultra-idiomatic, native-quality
      const prompt = `You are a world-class professional translator and localization expert specializing in career documents. Your task is to translate this CV into ${targetLanguage}.

CRITICAL TRANSLATION PRINCIPLES:
1. IDIOMATIC EXCELLENCE: Never translate literally. Every phrase must sound like it was originally written by a native ${targetLanguage} speaker. Use natural expressions, collocations, and turns of phrase that are common in ${targetLanguage}.

2. CULTURAL ADAPTATION: Adapt professional terminology to match how recruiters and HR professionals in ${targetLanguage}-speaking countries expect to see it. Job titles, responsibilities, and achievements should follow local conventions.

3. INDUSTRY VOCABULARY: Use the precise technical and industry-specific terms that professionals in ${targetLanguage}-speaking markets actually use. Research common alternatives if direct translations sound awkward.

4. NATURAL FLOW: Restructure sentences if needed to match the natural syntax and rhythm of ${targetLanguage}. A CV should read smoothly and professionally, not like a translation.

5. CONTEXTUAL INTELLIGENCE: Understand the meaning and intent behind each bullet point. Translate the impact and achievement, not just the words.

WHAT TO PRESERVE:
- Company names (keep original)
- Technology names and tools (keep in English if commonly used that way in ${targetLanguage} tech industry)
- Proper nouns and brand names
- The exact JSON structure

CV DATA TO TRANSLATE:
${JSON.stringify(cvData)}

Respond ONLY with the translated JSON object. No explanations, no markdown.`;

      // Call API with retry logic
      let response;
      let retries = 5; // More retries for rate limits
      let delay = 2000; // Start with 2 seconds

      while (retries > 0) {
        try {
          response = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              type: 'cv-translation'
            }),
          });

          if (response.ok) {
            break; // Success, exit loop
          }

          if (response.status === 429) {
            retries--;
            if (retries > 0) {
              console.log(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
              toast.loading(`Rate limit reached. Retrying in ${Math.round(delay / 1000)}s...`, { id: 'translation-retry' });
              await new Promise(resolve => setTimeout(resolve, delay));
              delay = Math.min(delay * 2, 30000); // Max 30 seconds
              continue;
            }
          }

          // If not 429 and not ok, throw error immediately
          throw new Error('Translation failed');
        } catch (e) {
          // If network error, also retry
          retries--;
          if (retries > 0) {
            console.log(`Network error, retrying in ${delay}ms... (${retries} retries left)`, e);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 30000);
          } else {
            throw e;
          }
        }
      }

      toast.dismiss('translation-retry');

      if (!response || !response.ok) {
        if (response?.status === 429) {
          throw new Error('OpenAI rate limit reached. Your account may have hit its usage limit. Please wait a few minutes and try again, or check your OpenAI billing settings.');
        }
        throw new Error('Translation failed');
      }

      const data = await response.json();

      if (data.status === 'success' && data.content) {
        const translatedCVData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;

        // Create new resume document
        const newResumeId = generateId();
        const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', newResumeId);

        // Use the same naming convention as Save As but append language
        // This assumes resumeName is available in scope, otherwise default to 'Tailored Resume'
        const baseName = resumeName || 'Tailored Resume';
        const newName = `${baseName} (${targetLanguage})`;

        await setDoc(resumeRef, {
          name: newName,
          cvData: translatedCVData,
          template,
          layoutSettings,
          folderId: folderId, // Use selected folder or null
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: currentUser.uid,
          sourceResumeId: id,
          language: targetLanguage
        });

        notify.success('CV translated successfully!');

        // Navigate to new resume
        navigate(`/resume-builder/${newResumeId}/cv-editor`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      notify.error(error.message || 'Failed to translate CV. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Register editor context with AI Assistant
  const editorContextSummary = useMemo(() => {
    const enabledSections = cvData.sections?.filter(s => s.enabled) || [];
    const experienceCount = cvData.experiences?.length || 0;
    const educationCount = cvData.education?.length || 0;
    const skillsCount = cvData.skills?.length || 0;

    // CV content - FULL data for AI context (no truncation)
    const cvContentFull = {
      // Professional summary - FULL text
      summary: cvData.summary || null,
      // ALL work experiences with FULL descriptions and highlights
      experiences: cvData.experiences?.map(exp => ({
        title: exp.title,
        company: exp.company,
        duration: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`,
        location: exp.location,
        description: exp.description || null, // Full description
        highlights: exp.highlights || [], // All highlights
      })) || [],
      // ALL education entries
      education: cvData.education?.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        field: edu.field,
        graduationDate: edu.graduationDate,
        gpa: edu.gpa,
        description: edu.description || null,
      })) || [],
      // ALL skills
      skills: cvData.skills?.map(skill => ({
        name: skill.name,
        level: skill.level,
        category: skill.category,
      })) || [],
      // ALL certifications
      certifications: cvData.certifications?.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        description: cert.description || null,
      })) || [],
      // ALL projects with FULL descriptions
      projects: cvData.projects?.map(proj => ({
        name: proj.name,
        description: proj.description || null, // Full description
        technologies: proj.technologies || [], // All technologies
        url: proj.url || null,
        startDate: proj.startDate || null,
        endDate: proj.endDate || null,
      })) || [],
      // ALL languages
      languages: cvData.languages?.map(lang => ({
        name: lang.name,
        level: lang.level,
      })) || [],
    };

    // Complete job context for AI
    const completeJobContext = jobContext ? {
      company: jobContext.company,
      jobTitle: jobContext.jobTitle,
      // Job description (limited to 5000 chars for very long descriptions)
      jobDescription: jobContext.jobDescription
        ? jobContext.jobDescription.substring(0, 5000) + (jobContext.jobDescription.length > 5000 ? '...' : '')
        : null,
      // All keywords
      keywords: jobContext.keywords || [],
      keywordsCount: jobContext.keywords?.length || 0,
      // Strengths identified
      strengths: jobContext.strengths || [],
      strengthsCount: jobContext.strengths?.length || 0,
      // Gaps to address
      gaps: jobContext.gaps || [],
      gapsCount: jobContext.gaps?.length || 0,
    } : null;

    return {
      pagePath: isResumeBuilder ? `/resume-builder/${id}/cv-editor` : `/ats-analysis/${id}/cv-editor`,
      viewMode: 'cv-editor',
      analysisId: id,
      isResumeBuilder,
      resumeName: resumeName || 'Untitled Resume',
      template,
      hasUnsavedChanges: isDirty,
      isSaving,
      // CV content summary (metadata)
      cvSummary: {
        fullName: `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim() || null,
        title: cvData.personalInfo?.title || null,
        email: cvData.personalInfo?.email || null,
        phone: cvData.personalInfo?.phone || null,
        location: cvData.personalInfo?.location || null,
        hasSummary: !!cvData.summary && cvData.summary.length > 10,
        experienceCount,
        educationCount,
        skillsCount,
        certificationsCount: cvData.certifications?.length || 0,
        projectsCount: cvData.projects?.length || 0,
        languagesCount: cvData.languages?.length || 0,
      },
      // CV content - FULL data for AI assistant
      cvContent: cvContentFull,
      enabledSections: enabledSections.map(s => s.title),
      // Complete job context
      jobContext: completeJobContext,
      // Editing state
      activeSection: activeSectionTarget?.section || null,
      zoom,
      showPreview,
      isTranslating,
      isAnalyzing,
    };
  }, [cvData, template, resumeName, isDirty, isSaving, jobContext, activeSectionTarget, zoom, showPreview, isTranslating, isAnalyzing, id, isResumeBuilder]);

  useAssistantPageData('cvEditor', editorContextSummary, true);

  return (
    <AuthLayout>
      {/* Desktop: Fixed positioning to bypass AuthLayout scroll wrapper */}
      {/* Mobile: Normal flow with h-full */}
      {/* Desktop offset: top-12 (48px topbar), left-[64px] (collapsed sidebar) */}
      <div className="h-full lg:fixed lg:top-12 lg:left-[64px] lg:right-0 lg:bottom-0 lg:z-40 flex flex-col bg-gray-50 dark:bg-[#333234]">
        {/* Mobile Compact Header */}
        <header className="lg:hidden h-14 bg-white dark:bg-[#242325] border-b border-gray-200 dark:border-[#3d3c3e] flex-shrink-0 z-20 safe-area-top">
          <div className="flex items-center justify-between h-full px-4">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Title & Logo */}
            <div className="flex items-center gap-3 flex-1 min-w-0 px-2">
              {/* Logo */}
              {/* Logo */}
              {!isResumeBuilder && jobContext?.company && (
                <CompanyLogo
                  companyName={jobContext.company}
                  className="w-8 h-8 rounded-lg"
                  showInitials={true}
                />
              )}

              <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate text-left">
                {isResumeBuilder ? resumeName : (jobContext?.jobTitle || 'CV Editor')}
              </h1>
            </div>

            {/* More Menu - REMOVED (Moved to bottom nav) */}
          </div>
        </header>

        {/* Desktop Header - Hidden on mobile */}
        <header className="hidden lg:block h-12 bg-white dark:bg-[#242325] border-b border-gray-200 dark:border-[#3d3c3e] flex-shrink-0 z-20">
          <div className="h-full max-w-[1920px] mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-full">
              {/* Left: Title & Company */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-gray-200 dark:bg-[#3d3c3e] mx-2" />

                {isResumeBuilder ? (
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
                              notify.success('Resume renamed');
                            } catch (error) {
                              console.error('Error renaming resume:', error);
                              notify.error('Failed to rename resume');
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
              </div>

              {/* Right: Actions - Premium Grouped Toolbar */}
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className="flex items-center">
                  {isSaving && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1.5 flex items-center gap-1.5 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-lg">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </span>
                  )}
                  {!isSaving && isDirty && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-1.5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="hidden sm:inline">Unsaved</span>
                    </span>
                  )}
                </div>

                {/* Separator */}
                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-[#3d3c3e]" />

                {/* Group 1: Document Actions (Save / Save As) */}
                <div className="flex items-center gap-1">
                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 
                      bg-white dark:bg-[#2b2a2c] 
                      text-gray-700 dark:text-gray-200 
                      rounded-lg 
                      border border-gray-200/80 dark:border-[#3d3c3e]/80 
                      hover:border-gray-300 dark:hover:border-gray-600 
                      hover:bg-gray-50 dark:hover:bg-[#3d3c3e] 
                      hover:shadow-sm 
                      active:scale-[0.98] 
                      transition-all duration-200 
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200/80 disabled:active:scale-100
                      font-medium text-xs"
                    title="Save changes"
                  >
                    <Save className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="hidden md:inline">Save</span>
                  </button>

                  {/* Save As Button - Only visible in ATS analysis mode */}
                  {!isResumeBuilder && (
                    <button
                      onClick={() => setIsSaveAsModalOpen(true)}
                      className="group relative flex items-center gap-1.5 px-3 py-1.5 
                        bg-white dark:bg-[#2b2a2c] 
                        text-gray-700 dark:text-gray-200 
                        rounded-lg 
                        border border-gray-200/80 dark:border-[#3d3c3e]/80 
                        hover:border-gray-300 dark:hover:border-gray-600 
                        hover:bg-gray-50 dark:hover:bg-[#3d3c3e] 
                        hover:shadow-sm 
                        active:scale-[0.98] 
                        transition-all duration-200 
                        font-medium text-xs"
                      title="Save to Resume Builder library"
                    >
                      <FolderOpen className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                      <span className="hidden md:inline">Save As</span>
                    </button>
                  )}
                </div>

                {/* Group 2: AI/Transform Actions (Translate / Compare) */}
                <div className="flex items-center gap-1">
                  {/* Translate Button */}
                  <button
                    onClick={() => setIsTranslationModalOpen(true)}
                    disabled={isTranslating}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 
                      bg-white dark:bg-[#2b2a2c] 
                      text-gray-700 dark:text-gray-200 
                      rounded-lg 
                      border border-gray-200/80 dark:border-[#3d3c3e]/80 
                      hover:border-purple-300 dark:hover:border-purple-500 
                      hover:bg-purple-50 dark:hover:bg-purple-900/20 
                      hover:text-purple-700 dark:hover:text-purple-300 
                      hover:shadow-sm hover:shadow-purple-500/10
                      active:scale-[0.98] 
                      transition-all duration-200 
                      font-medium text-xs 
                      ${isTranslating ? 'cursor-wait opacity-80 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' : ''}`}
                    title="Translate CV to another language"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Languages className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span className="hidden md:inline">
                      {isTranslating ? 'Translating...' : 'Translate'}
                    </span>
                  </button>

                  {/* Compare Button - Only visible when comparison data available */}
                  {hasComparison && (
                    <button
                      onClick={() => openComparisonModal()}
                      className="group relative flex items-center gap-1.5 px-3 py-1.5 
                        bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 
                        text-emerald-700 dark:text-emerald-300 
                        rounded-lg 
                        border border-emerald-200/80 dark:border-emerald-700/50 
                        hover:border-emerald-300 dark:hover:border-emerald-500 
                        hover:shadow-sm hover:shadow-emerald-500/15
                        active:scale-[0.98] 
                        transition-all duration-200 
                        font-medium text-xs"
                      title="View AI changes - Before/After comparison"
                    >
                      <GitCompare className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <span className="hidden md:inline">Compare</span>
                      {comparison?.hasAnyChanges && (
                        <span className="relative flex h-2 w-2 ml-0.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Group 3: Primary Export Action */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="group relative flex items-center gap-1.5 px-4 py-1.5 
                    bg-[#b7e219] 
                    hover:bg-[#a5cb17] 
                    active:bg-[#9fc015]
                    text-gray-900 
                    rounded-xl 
                    shadow-sm 
                    hover:shadow-md 
                    active:scale-[0.98] 
                    transition-all duration-200 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#b7e219] disabled:hover:shadow-sm disabled:active:scale-100
                    font-semibold text-xs"
                  title="Export as PDF"
                >
                  <Download className="w-3.5 h-3.5 group-hover:animate-bounce" style={{ animationDuration: '0.6s', animationIterationCount: '1' }} />
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
            <div
              className={`h-full relative border-r border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] overflow-hidden flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isLeftPanelCollapsed
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
                  activeTab={editorTab}
                  onTabChange={setEditorTab}
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
                  className="h-full flex-1 bg-gray-100 dark:bg-[#333234] hidden lg:block"
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
                  className="lg:hidden fixed inset-0 z-40 bg-gray-100 dark:bg-[#333234] flex flex-col"
                >
                  {/* Mobile Preview Header */}
                  {/* Mobile Preview Header */}
                  <header className="flex-shrink-0 h-14 bg-white dark:bg-[#242325] border-b border-gray-200 dark:border-[#3d3c3e] flex items-center px-4 safe-area-top z-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => setShowPreview(false)}
                        className="-ml-2 p-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Logo */}
                      {!isResumeBuilder && jobContext?.company && (
                        <CompanyLogo
                          companyName={jobContext.company}
                          className="w-8 h-8 rounded-lg"
                          showInitials={true}
                        />
                      )}

                      <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate text-left">
                        {isResumeBuilder ? resumeName : (jobContext?.jobTitle || 'CV Preview')}
                      </h1>
                    </div>
                  </header>

                  {/* Preview Content */}
                  <div className="flex-1 min-h-0">
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
                  </div>

                  {/* Bottom Nav Spacer */}
                  <div className="h-[60px] flex-shrink-0" />

                  {/* Mobile Bottom Navigation Bar - Inside Preview Overlay */}
                  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242325] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
                    <div className="flex">
                      <button
                        onClick={() => setShowPreview(false)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-500 dark:text-gray-400`}
                      >
                        <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-medium">Editor</span>
                      </button>

                      <div className="w-px bg-gray-200 dark:bg-[#3d3c3e]" />
                      <button
                        onClick={() => setShowPreview(true)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-900 dark:text-white bg-gray-50 dark:bg-[#2b2a2c]`}
                      >
                        <Eye className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Preview</span>
                      </button>
                      <div className="w-px bg-gray-200 dark:bg-[#3d3c3e]" />
                      <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="w-20 flex flex-col items-center justify-center py-3 transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2b2a2c]"
                      >
                        <MoreHorizontal className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Menu</span>
                      </button>
                    </div>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>

        {/* Mobile Bottom Navigation Bar - Editor/Preview Toggle */}
        {/* Mobile Bottom Navigation Bar - Editor/Preview Toggle */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#242325] border-t border-gray-200 dark:border-[#3d3c3e] safe-area-bottom">
          <div className="flex">
            <button
              onClick={() => setShowPreview(false)}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${!showPreview
                ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-[#2b2a2c]'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs font-medium">Editor</span>
            </button>
            <div className="w-px bg-gray-200 dark:bg-[#3d3c3e]" />
            <button
              onClick={() => setShowPreview(true)}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${showPreview
                ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-[#2b2a2c]'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Preview</span>
            </button>
            <div className="w-px bg-gray-200 dark:bg-[#3d3c3e]" />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-20 flex flex-col items-center justify-center py-3 transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2b2a2c]"
            >
              <MoreHorizontal className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </div>
        </nav>

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
                      className={`px-3 py-1 text-xs font-semibold ${zoom === level ? 'bg-white text-gray-900' : 'text-white/80'
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
                        const layoutSettingsWithDefaults = {
                          fontSize: layoutSettings?.fontSize ?? 10,
                          dateFormat: layoutSettings?.dateFormat ?? 'jan-24',
                          lineHeight: layoutSettings?.lineHeight ?? 1.3,
                          fontFamily: layoutSettings?.fontFamily ?? 'Inter',
                          accentColor: layoutSettings?.accentColor,
                          experienceSpacing: layoutSettings?.experienceSpacing,
                          showSkillLevel: layoutSettings?.showSkillLevel ?? true
                        };

                        switch (template) {
                          case 'executive-classic':
                            return <ExecutiveClassic cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'tech-minimalist':
                            return <TechMinimalist cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'creative-balance':
                            return <CreativeBalance cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'harvard-classic':
                            return <HarvardClassic cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'swiss-photo':
                            return <SwissPhoto cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'corporate-photo':
                            return <CorporatePhoto cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
                          case 'elegant-simple':
                            return <ElegantSimple cvData={cvData} layoutSettings={layoutSettingsWithDefaults} />;
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

        {/* Save As Modal */}
        <SaveAsModal
          isOpen={isSaveAsModalOpen}
          onClose={() => setIsSaveAsModalOpen(false)}
          onSave={handleSaveAs}
          defaultName={jobContext ? `${jobContext.jobTitle} @ ${jobContext.company} - Tailored` : 'Tailored Resume'}
          folders={folders}
          isSaving={isSavingAs}
        />

        {/* Translation Modal */}
        <TranslationModal
          isOpen={isTranslationModalOpen}
          onClose={() => setIsTranslationModalOpen(false)}
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          folders={folders}
        />

        {/* Before/After Comparison Modal */}
        <BeforeAfterModal
          isOpen={comparisonModalState.isOpen}
          comparison={comparison}
          modalState={comparisonModalState}
          onClose={closeComparisonModal}
          onSelectSection={selectComparisonSection}
          onSetViewMode={setComparisonViewMode}
          onToggleExperienceExpanded={toggleExperienceExpanded}
          onToggleEducationExpanded={toggleEducationExpanded}
        />

        {/* Export PDF Modal */}
        <ExportPDFModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onDownload={handleExportDownload}
          onSaveToLibrary={handleExportToLibrary}
          defaultFileName={getDefaultExportFileName()}
          folders={folders}
          isExporting={isExporting}
        />

        {/* Mobile Bottom Sheet Menu */}
        <MobileBottomSheet
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          title="Options"
        >
          <BottomSheetMenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Content"
            description="Edit resume sections"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setEditorTab('editor');
              setShowPreview(false);
            }}
          />
          <BottomSheetMenuItem
            icon={<Sparkles className="w-5 h-5" />}
            label="AI Review"
            description="Get AI suggestions"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setEditorTab('ai-review');
              setShowPreview(false); // Switch to editor view
            }}
          />
          <BottomSheetMenuItem
            icon={<Palette className="w-5 h-5" />}
            label="Templates"
            description="Change CV template"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setEditorTab('templates');
              setShowPreview(false);
            }}
          />
          <BottomSheetMenuItem
            icon={<Settings className="w-5 h-5" />}
            label="Style"
            description="Font, colors, spacing"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setEditorTab('layout-style');
              setShowPreview(false);
            }}
          />
          <BottomSheetDivider />
          <BottomSheetMenuItem
            icon={<Save className="w-5 h-5" />}
            label="Save"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleSave();
            }}
            badge={isDirty ? 'Unsaved' : undefined}
          />
          <BottomSheetMenuItem
            icon={<FolderOpen className="w-5 h-5" />}
            label="Save to Library"
            description="Save as new resume"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSaveAsModalOpen(true);
            }}
          />
          <BottomSheetDivider />
          <BottomSheetMenuItem
            icon={<Languages className="w-5 h-5" />}
            label="Translate"
            description="Translate CV to another language"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsTranslationModalOpen(true);
            }}
          />
          <BottomSheetMenuItem
            icon={<Download className="w-5 h-5" />}
            label="Export PDF"
            variant="primary"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsExportModalOpen(true);
            }}
          />
        </MobileBottomSheet>


      </div >
    </AuthLayout >
  );
}
