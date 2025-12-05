/**
 * useBeforeAfterComparison Hook
 * Manages state for the Before/After CV comparison feature
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CVComparisonResult,
  ComparisonSectionType,
  ComparisonViewMode,
  ComparisonModalState,
  OriginalCVData,
  UseBeforeAfterComparisonReturn,
} from '../types/cvComparison';
import { CVData } from '../types/cvEditor';
import {
  parseOriginalCVMarkdown,
  computeFullCVComparison,
  convertStructuredDataToOriginalCVData,
} from '../lib/cvComparisonEngine';

/** Original structured data from cv_rewrite.original_structured_data */
interface OriginalStructuredData {
  personalInfo?: any;
  summary?: string;
  experiences?: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    location?: string;
    bullets: string[];
  }>;
  educations?: Array<{
    id: string;
    degree: string;
    institution: string;
    startDate?: string;
    endDate?: string;
    year?: string;
  }>;
  skills?: string[];
  languages?: Array<{ name: string; level: string }>;
  certifications?: Array<{ name: string; issuer?: string; date?: string }>;
}

interface UseBeforeAfterComparisonProps {
  /** Initial CV markdown from cv_rewrite.initial_cv (legacy, fallback) */
  initialCVMarkdown?: string;
  /** Original CV structured data (PREFERRED - accurate experience parsing) */
  originalStructuredData?: OriginalStructuredData;
  /** Current CV data (AI-rewritten) */
  currentCVData: CVData | null;
  /** Callback when user wants to revert a section */
  onRevertSection?: (section: ComparisonSectionType, originalData: any) => void;
  /** Callback when user wants to revert all changes */
  onRevertAll?: (originalCVData: OriginalCVData) => void;
}

const initialModalState: ComparisonModalState = {
  isOpen: false,
  selectedSection: null,
  viewMode: 'diff',
  expandedExperienceIds: new Set(),
  expandedEducationIds: new Set(),
};

export function useBeforeAfterComparison({
  initialCVMarkdown,
  originalStructuredData,
  currentCVData,
  onRevertSection,
  onRevertAll,
}: UseBeforeAfterComparisonProps): UseBeforeAfterComparisonReturn {
  // State
  const [modalState, setModalState] = useState<ComparisonModalState>(initialModalState);
  const [isLoading, setIsLoading] = useState(false);

  // Detect if structured data looks corrupted (all content in one experience)
  const isDataCorrupted = useCallback((data: OriginalStructuredData | undefined): boolean => {
    if (!data?.experiences) return false;
    
    // If only 1 experience with way too many bullets, data is likely corrupted
    if (data.experiences.length === 1 && data.experiences[0]?.bullets?.length > 15) {
      console.warn('⚠️ DATA CORRUPTION DETECTED: Single experience with', data.experiences[0].bullets.length, 'bullets');
      console.warn('   First 3 bullets:', data.experiences[0].bullets.slice(0, 3));
      return true;
    }
    
    // If any experience has more than 20 bullets, that's suspicious
    const suspiciousExp = data.experiences.find(exp => (exp.bullets?.length || 0) > 20);
    if (suspiciousExp) {
      console.warn('⚠️ DATA CORRUPTION DETECTED: Experience has', suspiciousExp.bullets?.length, 'bullets');
      console.warn('   Experience:', suspiciousExp.title, 'at', suspiciousExp.company);
      return true;
    }
    
    return false;
  }, []);

  // Get original CV data - PRIORITIZE structured data over markdown parsing
  const originalCV = useMemo((): OriginalCVData | null => {
    console.log('🔄 useBeforeAfterComparison: Computing originalCV...');
    console.log('   Has originalStructuredData:', !!originalStructuredData);
    console.log('   Has initialCVMarkdown:', !!initialCVMarkdown, initialCVMarkdown?.length || 0, 'chars');
    
    // Debug: Log raw structured data to identify issues
    if (originalStructuredData) {
      console.log('   📋 Raw originalStructuredData:', {
        experiencesCount: originalStructuredData.experiences?.length || 0,
        experiences: originalStructuredData.experiences?.map((exp, idx) => ({
          idx,
          id: exp.id,
          title: exp.title?.substring(0, 30),
          company: exp.company?.substring(0, 30),
          bulletsCount: exp.bullets?.length || 0,
        })),
      });
    }
    
    // Check for data corruption BEFORE using structured data
    const dataIsCorrupted = isDataCorrupted(originalStructuredData);
    
    // PRIORITY 1: Use originalStructuredData if available AND not corrupted
    if (originalStructuredData && !dataIsCorrupted) {
      try {
        const converted = convertStructuredDataToOriginalCVData(originalStructuredData);
        console.log('✅ Using original_structured_data for comparison:', {
          experiences: converted.experiences?.length || 0,
          education: converted.education?.length || 0,
          summary: converted.summary?.length || 0,
          skills: converted.skills?.length || 0,
        });
        // Debug: Log experience details with bullet counts
        converted.experiences?.forEach((exp, idx) => {
          console.log(`   Original exp[${idx}]: ID=${exp.id}, "${exp.title}" at "${exp.company}" - ${exp.bullets?.length || 0} bullets`);
          if (exp.bullets && exp.bullets.length > 0) {
            console.log(`      First bullet: "${exp.bullets[0]?.substring(0, 50)}..."`);
          }
        });
        return converted;
      } catch (error) {
        console.error('Error converting original structured data:', error);
      }
    }
    
    // PRIORITY 2: Fallback to parsing markdown (legacy data OR corrupted structured data)
    if (initialCVMarkdown && initialCVMarkdown.trim().length > 0) {
      try {
        if (dataIsCorrupted) {
          console.log('🔧 Re-parsing from markdown due to corrupted structured data...');
        } else {
          console.log('⚠️ Falling back to markdown parsing for comparison');
        }
        const parsed = parseOriginalCVMarkdown(initialCVMarkdown);
        console.log('   Parsed from markdown:', {
          experiences: parsed.experiences?.length || 0,
          education: parsed.education?.length || 0,
        });
        // Debug: Log each parsed experience
        parsed.experiences?.forEach((exp, idx) => {
          console.log(`   Parsed exp[${idx}]: "${exp.title}" at "${exp.company}" - ${exp.bullets?.length || 0} bullets`);
        });
        return parsed;
      } catch (error) {
        console.error('Error parsing original CV markdown:', error);
      }
    }
    
    console.log('❌ No original CV data available for comparison');
    return null;
  }, [originalStructuredData, initialCVMarkdown, isDataCorrupted]);

  // Compute comparison when both original and current data are available
  const comparison = useMemo((): CVComparisonResult | null => {
    if (!originalCV || !currentCVData) {
      console.log('⚠️ Cannot compute comparison:', {
        hasOriginalCV: !!originalCV,
        hasCurrentCVData: !!currentCVData,
      });
      return null;
    }

    console.log('📊 Computing CV comparison...');
    console.log('   Original CV:', {
      experiences: originalCV.experiences?.length || 0,
      education: originalCV.education?.length || 0,
      summary: originalCV.summary?.length || 0,
    });
    console.log('   Current CV:', {
      experiences: currentCVData.experiences?.length || 0,
      education: currentCVData.education?.length || 0,
      summary: currentCVData.summary?.length || 0,
    });
    
    // DEBUG: Detailed comparison of experience bullets BEFORE vs AFTER
    console.log('🔍 DEBUG: Experience bullet comparison (BEFORE vs AFTER):');
    originalCV.experiences?.forEach((origExp, idx) => {
      const currExp = currentCVData.experiences?.find(e => e.company === origExp.company) || currentCVData.experiences?.[idx];
      console.log(`   [${idx}] "${origExp.title}" at "${origExp.company}":`);
      console.log(`      ORIGINAL bullets (${origExp.bullets?.length || 0}):`, origExp.bullets?.slice(0, 2).map(b => b?.substring(0, 60) + '...'));
      console.log(`      CURRENT bullets (${currExp?.bullets?.length || 0}):`, currExp?.bullets?.slice(0, 2).map(b => b?.substring(0, 60) + '...'));
      
      // Check if bullets are identical (which would indicate the bug)
      if (origExp.bullets && currExp?.bullets && 
          origExp.bullets.length > 0 && currExp.bullets.length > 0 &&
          origExp.bullets[0] === currExp.bullets[0]) {
        console.warn(`      ⚠️ WARNING: First bullet is IDENTICAL - possible data issue!`);
      }
    });

    try {
      const result = computeFullCVComparison(originalCV, currentCVData);
      console.log('✅ Comparison result:', {
        hasAnyChanges: result.hasAnyChanges,
        experiencesHasChanges: result.experiences?.hasChanges,
        summaryHasChanges: result.summary?.hasChanges,
        totalStats: result.totalStats,
      });
      
      // DEBUG: Log the actual comparison items for experiences
      console.log('🔍 DEBUG: Experience comparison items:');
      result.experiences?.items?.forEach((item, idx) => {
        console.log(`   [${idx}] Status: ${item.status}, ID: ${item.id}`);
        console.log(`      original.bullets: ${item.original?.bullets?.length || 0}`, item.original?.bullets?.slice(0, 1).map(b => b?.substring(0, 50) + '...'));
        console.log(`      modified.bullets: ${item.modified?.bullets?.length || 0}`, item.modified?.bullets?.slice(0, 1).map(b => b?.substring(0, 50) + '...'));
      });
      
      return result;
    } catch (error) {
      console.error('Error computing CV comparison:', error);
      return null;
    }
  }, [originalCV, currentCVData]);

  // Modal actions
  const openModal = useCallback((section?: ComparisonSectionType) => {
    setModalState(prev => ({
      ...prev,
      isOpen: true,
      selectedSection: section || prev.selectedSection,
      // Auto-expand first experience when opening experiences section
      expandedExperienceIds: section === 'experiences' && comparison?.experiences?.items[0]
        ? new Set([comparison.experiences.items[0].id])
        : prev.expandedExperienceIds,
    }));
  }, [comparison]);

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setViewMode = useCallback((mode: ComparisonViewMode) => {
    setModalState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const selectSection = useCallback((section: ComparisonSectionType) => {
    setModalState(prev => ({
      ...prev,
      selectedSection: section,
      // Auto-expand first item when selecting experiences or education
      expandedExperienceIds: section === 'experiences' && comparison?.experiences?.items[0]
        ? new Set([comparison.experiences.items[0].id])
        : prev.expandedExperienceIds,
      expandedEducationIds: section === 'education' && comparison?.education?.items[0]
        ? new Set([comparison.education.items[0].id])
        : prev.expandedEducationIds,
    }));
  }, [comparison]);

  const toggleExperienceExpanded = useCallback((id: string) => {
    setModalState(prev => {
      const newSet = new Set(prev.expandedExperienceIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        ...prev,
        expandedExperienceIds: newSet,
      };
    });
  }, []);

  const toggleEducationExpanded = useCallback((id: string) => {
    setModalState(prev => {
      const newSet = new Set(prev.expandedEducationIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return {
        ...prev,
        expandedEducationIds: newSet,
      };
    });
  }, []);

  // Revert actions
  const revertSection = useCallback((section: ComparisonSectionType) => {
    if (!originalCV || !onRevertSection) return;

    switch (section) {
      case 'summary':
        onRevertSection(section, originalCV.summary);
        break;
      case 'experiences':
        onRevertSection(section, originalCV.experiences);
        break;
      case 'education':
        onRevertSection(section, originalCV.education);
        break;
      case 'skills':
        onRevertSection(section, originalCV.skills);
        break;
      default:
        break;
    }
  }, [originalCV, onRevertSection]);

  const revertAll = useCallback(() => {
    if (!originalCV || !onRevertAll) return;
    onRevertAll(originalCV);
  }, [originalCV, onRevertAll]);

  return {
    // Data
    originalCV,
    comparison,
    isLoading,

    // Modal state
    modalState,

    // Actions
    openModal,
    closeModal,
    setViewMode,
    selectSection,
    toggleExperienceExpanded,
    toggleEducationExpanded,

    // Revert actions
    revertSection,
    revertAll,
  };
}

/**
 * Helper hook to check if comparison is available
 */
export function useHasComparison(
  initialCVMarkdown?: string,
  currentCVData?: CVData | null,
  originalStructuredData?: OriginalStructuredData
): boolean {
  return useMemo(() => {
    // Check if we have original data (either structured or markdown)
    const hasOriginalData = originalStructuredData || (initialCVMarkdown && initialCVMarkdown.trim().length > 0);
    
    if (!hasOriginalData || !currentCVData) return false;
    
    // Check if current CV has meaningful data
    const hasExperiences = currentCVData.experiences && currentCVData.experiences.length > 0;
    const hasSummary = currentCVData.summary && currentCVData.summary.trim().length > 0;
    const hasEducation = currentCVData.education && currentCVData.education.length > 0;
    
    return hasExperiences || hasSummary || hasEducation;
  }, [initialCVMarkdown, currentCVData, originalStructuredData]);
}

export default useBeforeAfterComparison;

