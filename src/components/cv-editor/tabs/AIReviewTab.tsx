import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown,
  User, FileText, Briefcase, GraduationCap, Code, Award,
  FolderOpen, Globe, X, Check, ChevronRight, MessageSquare,
  LayoutGrid, ArrowDownWideNarrow, Info, Target, Lightbulb
} from 'lucide-react';
import { CVData } from '../../../types/cvEditor';
import {
  CVSuggestion, CVReviewResult, CVSectionType, SuggestionTag,
  SuggestionPriority, TAG_CONFIG, SECTION_CONFIG, PRIORITY_CONFIG,
  HighlightTarget
} from '../../../types/cvReview';
import { analyzeCVWithAI } from '../../../services/cvReviewAI';
import { toast } from '@/contexts/ToastContext';

interface AIReviewTabProps {
  cvData: CVData;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  onApplySuggestion: (suggestion: CVSuggestion) => void;
  // Persisted state from parent to survive tab switches
  reviewState?: {
    result: CVReviewResult | null;
    ignoredIds: Set<string>;
    hasAnalyzed: boolean;
  };
  onReviewStateChange?: (state: { result: CVReviewResult | null; ignoredIds: Set<string>; hasAnalyzed: boolean }) => void;
  // Analysis loading state and trigger from parent
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  // Highlight section in preview when clicking a suggestion
  onHighlightSection?: (target: HighlightTarget | null) => void;
}

// Section icons mapping
const SectionIcon = ({ section }: { section: CVSectionType }) => {
  const icons: Record<CVSectionType, React.ReactNode> = {
    contact: <User className="w-4 h-4" />,
    about: <FileText className="w-4 h-4" />,
    experiences: <Briefcase className="w-4 h-4" />,
    education: <GraduationCap className="w-4 h-4" />,
    skills: <Code className="w-4 h-4" />,
    certifications: <Award className="w-4 h-4" />,
    projects: <FolderOpen className="w-4 h-4" />,
    languages: <Globe className="w-4 h-4" />
  };
  return icons[section] || <FileText className="w-4 h-4" />;
};

// Tag badge component
const TagBadge = ({ tag }: { tag: SuggestionTag }) => {
  const config = TAG_CONFIG[tag];
  if (!config) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${config.bgColor} ${config.color}`}>
      <span className={`w-1 h-1 rounded-full mr-1.5 ${config.color.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
};

// Priority indicator component
const PriorityIndicator = ({ priority }: { priority: SuggestionPriority }) => {
  if (priority === 'high') {
    return (
      <div className="flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      </div>
    );
  }
  return null;
};

// Suggestion Card component
const SuggestionCard = ({
  suggestion,
  isSelected,
  isFocused,
  onToggle,
  onApply,
  onFocus
}: {
  suggestion: CVSuggestion;
  isSelected: boolean;
  isFocused: boolean;
  onToggle: () => void;
  onApply: () => void;
  onFocus: () => void;
}) => {
  const sectionConfig = SECTION_CONFIG[suggestion.section];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onFocus}
      className={`
        group relative bg-white dark:bg-[#2b2a2c]/50 rounded-xl border transition-all duration-200 cursor-pointer
        ${isFocused
          ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30 shadow-lg'
          : isSelected 
            ? 'border-[#7c75ff] dark:border-[#a5a0ff] shadow-md shadow-[#635BFF]/10 dark:shadow-[#5249e6]/20' 
            : 'border-gray-200 dark:border-[#3d3c3e]/50 hover:border-gray-300 dark:hover:border-[#4a494b] hover:shadow-sm'
        }
      `}
    >
      {/* Focus indicator */}
      {isFocused && (
        <div className="absolute -left-1 top-3 bottom-3 w-1 bg-blue-500 rounded-full" />
      )}
      
      {/* Selection checkbox */}
      <div 
        className="absolute left-3 top-3.5 cursor-pointer z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <div className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${isSelected
            ? 'bg-[#635BFF] border-[#635BFF] text-white'
            : 'border-gray-300 dark:border-[#4a494b] hover:border-[#7c75ff] dark:hover:border-[#a5a0ff]'
          }
        `}>
          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
        </div>
      </div>

      <div className="pl-10 pr-4 py-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`text-sm font-semibold ${sectionConfig?.color || 'text-gray-700 dark:text-gray-200'}`}>
                {typeof suggestion.title === 'string' ? suggestion.title : String(suggestion.title)}
              </h4>
              <PriorityIndicator priority={suggestion.priority} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
          {typeof suggestion.description === 'string' ? suggestion.description : String(suggestion.description)}
        </p>

        {/* Show suggested value when focused */}
        {isFocused && suggestion.action.suggestedValue && suggestion.isApplicable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-2.5 bg-[#635BFF]/5 dark:bg-[#5249e6]/20 rounded-lg border border-[#635BFF]/20 dark:border-[#5249e6]/50"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Check className="w-3 h-3 text-[#5249e6] dark:text-[#a5a0ff]" />
              <span className="text-xs font-semibold text-[#635BFF] dark:text-[#a5a0ff]">Ready to apply:</span>
            </div>
            <p className="text-xs text-[#635BFF] dark:text-[#a5a0ff]/90 leading-relaxed">
              {typeof suggestion.action.suggestedValue === 'string' 
                ? suggestion.action.suggestedValue 
                : JSON.stringify(suggestion.action.suggestedValue)}
            </p>
          </motion.div>
        )}
        
        {/* Show manual action required for non-applicable suggestions */}
        {isFocused && !suggestion.isApplicable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Manual action required</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              Click on the highlighted section in the preview to edit this information directly.
            </p>
          </motion.div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {suggestion.tags.map(tag => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>

        {/* Quick apply button */}
        {suggestion.isApplicable && suggestion.action.suggestedValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className={`mt-3 w-full py-1.5 px-3 text-xs font-medium text-[#5249e6] dark:text-[#a5a0ff] 
                     bg-[#635BFF]/5 dark:bg-[#5249e6]/20 rounded-lg border border-[#635BFF]/20 dark:border-[#5249e6]/50
                     hover:bg-[#635BFF]/10 dark:hover:bg-[#5249e6]/30 transition-colors
                     ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            Apply this suggestion
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Section Group component
const SectionGroup = ({
  section,
  suggestions,
  selectedIds,
  focusedId,
  onToggle,
  onSelectSection,
  onApply,
  onFocus
}: {
  section: CVSectionType;
  suggestions: CVSuggestion[];
  selectedIds: Set<string>;
  focusedId: string | null;
  onToggle: (id: string) => void;
  onSelectSection: () => void;
  onApply: (suggestion: CVSuggestion) => void;
  onFocus: (suggestion: CVSuggestion) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = SECTION_CONFIG[section];
  const selectedInSection = suggestions.filter(s => selectedIds.has(s.id)).length;
  
  return (
    <div className="mb-4">
      {/* Section Header */}
      <div 
        className="flex items-center justify-between py-2 px-1 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`${config?.color || 'text-gray-500'}`}>
            <SectionIcon section={section} />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {config?.label || section}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({suggestions.length})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedInSection > 0 && (
            <span className="text-xs text-[#5249e6] dark:text-[#a5a0ff] font-medium">
              {selectedInSection} selected
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection();
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#5249e6] dark:hover:text-[#a5a0ff] 
                     opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {selectedInSection === suggestions.length ? 'Deselect All' : 'Select All'}
          </button>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pl-1"
          >
            {suggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isSelected={selectedIds.has(suggestion.id)}
                isFocused={focusedId === suggestion.id}
                onToggle={() => onToggle(suggestion.id)}
                onApply={() => onApply(suggestion)}
                onFocus={() => onFocus(suggestion)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Priority Group component
const PriorityGroup = ({
  priority,
  suggestions,
  selectedIds,
  focusedId,
  onToggle,
  onApply,
  onFocus
}: {
  priority: SuggestionPriority;
  suggestions: CVSuggestion[];
  selectedIds: Set<string>;
  focusedId: string | null;
  onToggle: (id: string) => void;
  onApply: (suggestion: CVSuggestion) => void;
  onFocus: (suggestion: CVSuggestion) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = PRIORITY_CONFIG[priority];
  
  return (
    <div className="mb-4">
      {/* Priority Header */}
      <div 
        className="flex items-center justify-between py-2 px-1 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({suggestions.length})
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pl-1"
          >
            {suggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isSelected={selectedIds.has(suggestion.id)}
                isFocused={focusedId === suggestion.id}
                onToggle={() => onToggle(suggestion.id)}
                onApply={() => onApply(suggestion)}
                onFocus={() => onFocus(suggestion)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Score Improvement Badge
const ScoreImprovementBadge = ({ improvement }: { improvement: number }) => {
  if (improvement === 0) return null;
  
  const isPositive = improvement > 0;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isPositive 
          ? 'bg-[#635BFF]/5 dark:bg-[#5249e6]/20 text-[#635BFF] dark:text-[#a5a0ff]' 
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      }`}
    >
      <span>{isPositive ? '+' : ''}{improvement}</span>
      <span className="text-[10px] opacity-70">points</span>
      {isPositive && <Sparkles className="w-3 h-3" />}
    </motion.div>
  );
};

// ATS Score Ring component
const ATSScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#635BFF]';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#635BFF';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-100 dark:text-gray-700"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
};

// Main AIReviewTab component
export default function AIReviewTab({
  cvData,
  jobContext,
  onApplySuggestion,
  reviewState,
  onReviewStateChange,
  isAnalyzing,
  onReanalyze,
  onHighlightSection
}: AIReviewTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CVReviewResult | null>(reviewState?.result || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(reviewState?.ignoredIds || new Set());
  const [groupBy, setGroupBy] = useState<'section' | 'priority'>('section');
  const [hasAnalyzed, setHasAnalyzed] = useState(reviewState?.hasAnalyzed || false);
  const [focusedSuggestionId, setFocusedSuggestionId] = useState<string | null>(null);

  // Sync state changes back to parent for persistence
  useEffect(() => {
    if (onReviewStateChange && (result || hasAnalyzed)) {
      onReviewStateChange({ result, ignoredIds, hasAnalyzed });
    }
  }, [result, ignoredIds, hasAnalyzed]);

  // Sync result from parent reviewState when it changes
  useEffect(() => {
    if (reviewState?.result) {
      setResult(reviewState.result);
      setHasAnalyzed(reviewState.hasAnalyzed);
      setIgnoredIds(reviewState.ignoredIds);
    }
  }, [reviewState]);

  // Filter out ignored suggestions
  const activeSuggestions = useMemo(() => {
    if (!result) return [];
    return result.suggestions.filter(s => !ignoredIds.has(s.id));
  }, [result, ignoredIds]);

  // Group suggestions by section
  const suggestionsBySection = useMemo(() => {
    const groups: Record<CVSectionType, CVSuggestion[]> = {
      contact: [],
      about: [],
      experiences: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: []
    };
    
    activeSuggestions.forEach(suggestion => {
      if (groups[suggestion.section]) {
        groups[suggestion.section].push(suggestion);
      }
    });
    
    return groups;
  }, [activeSuggestions]);

  // Group suggestions by priority
  const suggestionsByPriority = useMemo(() => {
    const groups: Record<SuggestionPriority, CVSuggestion[]> = {
      high: [],
      medium: [],
      low: []
    };
    
    activeSuggestions.forEach(suggestion => {
      groups[suggestion.priority].push(suggestion);
    });
    
    return groups;
  }, [activeSuggestions]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all in section
  const selectAllInSection = useCallback((section: CVSectionType) => {
    const sectionSuggestions = suggestionsBySection[section];
    const allSelected = sectionSuggestions.every(s => selectedIds.has(s.id));
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      sectionSuggestions.forEach(s => {
        if (allSelected) {
          newSet.delete(s.id);
        } else {
          newSet.add(s.id);
        }
      });
      return newSet;
    });
  }, [suggestionsBySection, selectedIds]);

  // Select all
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(activeSuggestions.map(s => s.id)));
  }, [activeSuggestions]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Apply single suggestion
  const applySuggestion = useCallback((suggestion: CVSuggestion) => {
    console.log('🟢 AIReviewTab.applySuggestion called');
    console.log('   Suggestion:', suggestion.title);
    console.log('   Has onApplySuggestion:', !!onApplySuggestion);
    
    if (!onApplySuggestion) {
      console.error('❌ onApplySuggestion is not defined!');
      toast.error('Cannot apply - callback not configured');
      return;
    }
    
    onApplySuggestion(suggestion);
    setIgnoredIds(prev => new Set([...prev, suggestion.id]));
    setFocusedSuggestionId(null);
    onHighlightSection?.(null);
  }, [onApplySuggestion, onHighlightSection]);

  // Apply selected suggestions
  const applySelected = useCallback(() => {
    const selectedSuggestions = activeSuggestions.filter(s => selectedIds.has(s.id) && s.isApplicable && s.action.suggestedValue);
    
    if (selectedSuggestions.length === 0) {
      toast.error('No applicable suggestions selected. Only suggestions with "Ready to apply" can be auto-applied.');
      return;
    }
    
    selectedSuggestions.forEach(suggestion => {
      onApplySuggestion(suggestion);
    });
    
    setIgnoredIds(prev => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
    setFocusedSuggestionId(null);
    onHighlightSection?.(null);
    toast.success(`Applied ${selectedSuggestions.length} suggestion${selectedSuggestions.length > 1 ? 's' : ''}!`);
  }, [activeSuggestions, selectedIds, onApplySuggestion, onHighlightSection]);

  // Ignore selected suggestions
  const ignoreSelected = useCallback(() => {
    setIgnoredIds(prev => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // Focus a suggestion to highlight it in preview
  const focusSuggestion = useCallback((suggestion: CVSuggestion) => {
    // Toggle focus - if already focused, unfocus
    if (focusedSuggestionId === suggestion.id) {
      setFocusedSuggestionId(null);
      onHighlightSection?.(null);
    } else {
      setFocusedSuggestionId(suggestion.id);
      onHighlightSection?.({
        section: suggestion.section,
        itemId: suggestion.action.targetItemId,
        field: suggestion.action.targetField,
        suggestedValue: suggestion.action.suggestedValue,
        currentValue: suggestion.action.currentValue
      });
    }
  }, [focusedSuggestionId, onHighlightSection]);

  // Calculate remaining suggestions count
  const remainingCount = activeSuggestions.length - Array.from(selectedIds).length;

  // Check if CV is empty or almost empty - MUST be before any early returns
  const isCVEmptyOrMinimal = useMemo(() => {
    const hasName = !!(cvData.personalInfo?.firstName || cvData.personalInfo?.lastName);
    const hasSummary = !!cvData.summary && cvData.summary.trim().length > 0;
    const hasExperiences = cvData.experiences && cvData.experiences.length > 0;
    const hasEducation = cvData.education && cvData.education.length > 0;
    const hasSkills = cvData.skills && cvData.skills.length > 0;
    
    // Count how many sections have content
    const filledSections = [
      hasName,
      hasSummary,
      hasExperiences,
      hasEducation,
      hasSkills
    ].filter(Boolean).length;
    
    // Consider CV empty/minimal if:
    // - No name AND no summary AND no experiences AND no education AND no skills
    // OR
    // - Less than 2 sections filled
    return filledSections === 0 || filledSections < 2;
  }, [cvData]);

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#635BFF]/10 dark:border-[#5249e6]/30" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[#635BFF] animate-spin" />
        </div>
        <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-white">
          Analyzing your CV...
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Our AI is reviewing your resume for ATS optimization and improvement opportunities.
        </p>
      </div>
    );
  }

  // Error state
  if (error && !result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
          Analysis Failed
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
          {error}
        </p>
        <button
          onClick={onReanalyze}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#635BFF] rounded-lg hover:bg-[#5249e6] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty CV message if CV is empty/minimal and no result yet
  if (!result && isCVEmptyOrMinimal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your CV is Empty or Almost Empty
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Before we can analyze your CV, you need to add some content. Start by filling in the essential sections below.
            </p>
          </div>
          
          <div className="bg-white dark:bg-[#2b2a2c] rounded-lg border border-gray-200 dark:border-[#3d3c3e] p-4 mb-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Get started by adding:</p>
            <ul className="space-y-2">
              {!cvData.personalInfo?.firstName && !cvData.personalInfo?.lastName && (
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-900 dark:text-white">Personal Information</strong> - Your name and contact details</span>
                </li>
              )}
              {!cvData.summary && (
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-900 dark:text-white">Professional Summary</strong> - A brief overview of your experience</span>
                </li>
              )}
              {(!cvData.experiences || cvData.experiences.length === 0) && (
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-900 dark:text-white">Work Experience</strong> - Your previous roles and achievements</span>
                </li>
              )}
              {(!cvData.education || cvData.education.length === 0) && (
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-900 dark:text-white">Education</strong> - Your academic background</span>
                </li>
              )}
              {(!cvData.skills || cvData.skills.length === 0) && (
                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Code className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-900 dark:text-white">Skills</strong> - Your technical and soft skills</span>
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Quick Tip
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Click on any section in the preview to start editing, or use the <strong>Editor</strong> tab to add content. Once you've added some information, come back here to get AI-powered suggestions for improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header Controls */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#3d3c3e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Group by</span>
            <div className="flex items-center bg-gray-100 dark:bg-[#2b2a2c] rounded-lg p-0.5">
              <button
                onClick={() => setGroupBy('section')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupBy === 'section'
                    ? 'bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Section
              </button>
              <button
                onClick={() => setGroupBy('priority')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  groupBy === 'priority'
                    ? 'bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Priority
              </button>
            </div>
          </div>
          
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 
                     hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 
                     rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-4">
          {/* Show warning if CV is minimal even with results */}
          {isCVEmptyOrMinimal && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Your CV Needs More Content
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    Your CV is quite minimal. For the best AI analysis and suggestions, consider adding more details to your work experience, education, and skills sections. Click on any section in the preview to start editing.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Missing for Job Section - Only show if job context was provided */}
          {result.missing_for_job && (
            <div className="mb-6 space-y-4">
              {/* Match Summary */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-bold text-orange-900 dark:text-orange-200">
                      Job Match Analysis
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    result.missing_for_job.estimated_match_percentage >= 80 
                      ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/40 text-[#635BFF] dark:text-[#a5a0ff]'
                      : result.missing_for_job.estimated_match_percentage >= 60
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                    {result.missing_for_job.estimated_match_percentage}% Match
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {result.missing_for_job.match_summary}
                </p>
              </div>

              {/* Critical Missing */}
              {result.missing_for_job.critical_missing && result.missing_for_job.critical_missing.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-bold text-red-900 dark:text-red-200">
                      Critical Gaps (Deal-breakers)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.missing_for_job.critical_missing.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/60 dark:bg-[#2b2a2c]/40 rounded-lg">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                          {item.item}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                          {item.why_critical}
                        </p>
                        <div className="flex items-start gap-2 p-2 bg-red-100/50 dark:bg-red-900/30 rounded-md">
                          <Lightbulb className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-800 dark:text-red-200">
                            <strong>How to fix:</strong> {item.how_to_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Missing */}
              {result.missing_for_job.important_missing && result.missing_for_job.important_missing.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Important Gaps
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.missing_for_job.important_missing.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white/60 dark:bg-[#2b2a2c]/40 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {item.item}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          {item.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nice to Have Missing */}
              {result.missing_for_job.nice_to_have_missing && result.missing_for_job.nice_to_have_missing.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-xl border border-gray-200 dark:border-[#3d3c3e]/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Nice to have:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_for_job.nice_to_have_missing.map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-white dark:bg-[#3d3c3e] rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#4a494b]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions List */}
          {groupBy === 'section' ? (
            // Group by Section
            Object.entries(suggestionsBySection).map(([section, suggestions]) => {
              if (suggestions.length === 0) return null;
              return (
                <SectionGroup
                  key={section}
                  section={section as CVSectionType}
                  suggestions={suggestions}
                  selectedIds={selectedIds}
                  focusedId={focusedSuggestionId}
                  onToggle={toggleSelection}
                  onSelectSection={() => selectAllInSection(section as CVSectionType)}
                  onApply={applySuggestion}
                  onFocus={focusSuggestion}
                />
              );
            })
          ) : (
            // Group by Priority
            Object.entries(suggestionsByPriority).map(([priority, suggestions]) => {
              if (suggestions.length === 0) return null;
              return (
                <PriorityGroup
                  key={priority}
                  priority={priority as SuggestionPriority}
                  suggestions={suggestions}
                  selectedIds={selectedIds}
                  focusedId={focusedSuggestionId}
                  onToggle={toggleSelection}
                  onApply={applySuggestion}
                  onFocus={focusSuggestion}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      {remainingCount > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm font-medium">
                Scroll for <span className="font-bold">{remainingCount}</span> more suggestions
              </span>
            </div>
            <button
              onClick={() => {
                const container = document.querySelector('.overflow-y-auto');
                if (container) {
                  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
              }}
              className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
            >
              See Next
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-[#242325] border-t border-gray-200 dark:border-[#3d3c3e]">
        {/* Selection Count Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={ignoreSelected}
            disabled={selectedIds.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium 
                     text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] 
                     border border-gray-300 dark:border-[#4a494b] rounded-xl
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Ignore {selectedIds.size > 0 ? selectedIds.size : ''} Selected
          </button>
          <button
            onClick={applySelected}
            disabled={selectedIds.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium 
                     text-white bg-[#635BFF] rounded-xl
                     hover:bg-[#5249e6] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Apply {selectedIds.size > 0 ? selectedIds.size : ''} Selected
          </button>
        </div>
      </div>
    </div>
  );
}

