import { useState, useCallback } from 'react';
import { CVData, CVSection, CVEditorSavedState } from '../types/cvEditor';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useCVEditor(
  cvData: CVData,
  setCvData: React.Dispatch<React.SetStateAction<CVData>>,
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>
) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Load CV data from Firestore
  const loadCVData = useCallback(async (cvId?: string) => {
    if (!currentUser) return null;
    
    setIsLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'cvs', cvId || 'default');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CVData;
        setCvData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error loading CV data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setCvData]);

  // Save CV data to Firestore
  const saveCVData = useCallback(async (cvId?: string, editorState?: CVEditorSavedState, isResume?: boolean) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    setIsLoading(true);
    try {
      if (cvId) {
        if (isResume) {
          // Save to cvs collection for resume builder
          const resumeRef = doc(db, 'users', currentUser.uid, 'cvs', cvId);
          // Get existing resume data to preserve name
          const existingDoc = await getDoc(resumeRef);
          const existingData = existingDoc.exists() ? existingDoc.data() : {};
          
          await setDoc(resumeRef, {
            ...existingData, // Preserve existing fields like name
            cvData,
            updatedAt: new Date().toISOString(),
            userId: currentUser.uid,
            template: editorState?.template || existingData.template,
            layoutSettings: editorState?.layoutSettings || existingData.layoutSettings,
            editorState: editorState ? {
              ...editorState,
              lastModified: new Date().toISOString()
            } : existingData.editorState
          }, { merge: true });
          console.log('CV data and editor state saved to resume:', cvId);
        } else {
        // When analysisId is provided, save to the analyses collection
        const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', cvId);
        const updateData: any = {
          'cv_rewrite.structured_data': cvData,
          'cv_rewrite.updatedAt': new Date().toISOString()
        };
        
        // Save editor state if provided
        if (editorState) {
          updateData['cv_rewrite.editor_state'] = {
            ...editorState,
            lastModified: new Date().toISOString()
          };
        }
        
        await updateDoc(analysisRef, updateData);
        console.log('CV data and editor state saved to analysis:', cvId);
        }
      } else {
        // Standalone mode - save to cvs collection
        const docRef = doc(db, 'users', currentUser.uid, 'cvs', 'default');
        await setDoc(docRef, {
          ...cvData,
          updatedAt: new Date().toISOString(),
          userId: currentUser.uid,
          editorState: editorState ? {
            ...editorState,
            lastModified: new Date().toISOString()
          } : undefined
        });
        console.log('CV data saved to standalone collection');
      }
      return true;
    } catch (error) {
      console.error('Error saving CV data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, cvData]);

  // Update a specific section
  const updateSection = useCallback((sectionId: string, updates: Partial<any>) => {
    setCvData(prev => {
      const newData = { ...prev };
      
      switch (sectionId) {
        case 'personal':
          newData.personalInfo = { ...newData.personalInfo, ...updates };
          break;
        case 'summary':
          newData.summary = updates.summary || newData.summary;
          break;
        case 'experience':
          if (updates.experiences) {
            newData.experiences = updates.experiences;
          }
          break;
        case 'education':
          if (updates.education) {
            newData.education = updates.education;
          }
          break;
        case 'skills':
          if (updates.skills) {
            newData.skills = updates.skills;
          }
          break;
        case 'certifications':
          if (updates.certifications) {
            newData.certifications = updates.certifications;
          }
          break;
        case 'projects':
          if (updates.projects) {
            newData.projects = updates.projects;
          }
          break;
        case 'languages':
          if (updates.languages) {
            newData.languages = updates.languages;
          }
          break;
        default:
          // Handle custom sections
          if (newData.customSections && newData.customSections[sectionId]) {
            newData.customSections[sectionId] = {
              ...newData.customSections[sectionId],
              ...updates
            };
          }
      }
      
      // Auto-enable/disable sections for certifications and projects
      // Find the section in the sections array
      const sectionIndex = newData.sections.findIndex(s => s.type === sectionId);
      
      if (sectionIndex !== -1) {
        const section = newData.sections[sectionIndex];
        
        // Handle certifications section
        if (sectionId === 'certifications' && updates.certifications !== undefined) {
          // Check the final array after update
          const hasItems = Array.isArray(newData.certifications) && newData.certifications.length > 0;
          // Enable section if it has items and was disabled, disable if empty
          if (hasItems && !section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: true };
          } else if (!hasItems && section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: false };
          }
        }
        
        // Handle projects section
        if (sectionId === 'projects' && updates.projects !== undefined) {
          // Check the final array after update
          const hasItems = Array.isArray(newData.projects) && newData.projects.length > 0;
          // Enable section if it has items and was disabled, disable if empty
          if (hasItems && !section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: true };
          } else if (!hasItems && section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: false };
          }
        }
      }
      
      return newData;
    });
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Add a new item to a section
  const addSectionItem = useCallback((sectionId: string, item: any) => {
    setCvData(prev => {
      const newData = { ...prev };
      
      switch (sectionId) {
        case 'experience':
          newData.experiences = [...newData.experiences, item];
          break;
        case 'education':
          newData.education = [...newData.education, item];
          break;
        case 'skills':
          newData.skills = [...newData.skills, item];
          break;
        case 'certifications':
          newData.certifications = [...newData.certifications, item];
          break;
        case 'projects':
          newData.projects = [...newData.projects, item];
          break;
        case 'languages':
          newData.languages = [...newData.languages, item];
          break;
      }
      
      // Auto-enable sections for certifications and projects
      const sectionIndex = newData.sections.findIndex(s => s.type === sectionId);
      if (sectionIndex !== -1) {
        const section = newData.sections[sectionIndex];
        if ((sectionId === 'certifications' || sectionId === 'projects') && !section.enabled) {
          newData.sections[sectionIndex] = { ...section, enabled: true };
        }
      }
      
      return newData;
    });
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Remove an item from a section
  const removeSectionItem = useCallback((sectionId: string, itemId: string) => {
    setCvData(prev => {
      const newData = { ...prev };
      
      switch (sectionId) {
        case 'experience':
          newData.experiences = newData.experiences.filter(e => e.id !== itemId);
          break;
        case 'education':
          newData.education = newData.education.filter(e => e.id !== itemId);
          break;
        case 'skills':
          newData.skills = newData.skills.filter(s => s.id !== itemId);
          break;
        case 'certifications':
          newData.certifications = newData.certifications.filter(c => c.id !== itemId);
          break;
        case 'projects':
          newData.projects = newData.projects.filter(p => p.id !== itemId);
          break;
        case 'languages':
          newData.languages = newData.languages.filter(l => l.id !== itemId);
          break;
      }
      
      // Auto-disable sections for certifications and projects if they become empty
      const sectionIndex = newData.sections.findIndex(s => s.type === sectionId);
      if (sectionIndex !== -1) {
        const section = newData.sections[sectionIndex];
        if (sectionId === 'certifications') {
          const hasItems = newData.certifications.length > 0;
          if (!hasItems && section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: false };
          }
        } else if (sectionId === 'projects') {
          const hasItems = newData.projects.length > 0;
          if (!hasItems && section.enabled) {
            newData.sections[sectionIndex] = { ...section, enabled: false };
          }
        }
      }
      
      return newData;
    });
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Update an item in a section
  const updateSectionItem = useCallback((sectionId: string, itemId: string, updates: any) => {
    setCvData(prev => {
      const newData = { ...prev };
      
      switch (sectionId) {
        case 'experience':
          newData.experiences = newData.experiences.map(e => 
            e.id === itemId ? { ...e, ...updates } : e
          );
          break;
        case 'education':
          newData.education = newData.education.map(e => 
            e.id === itemId ? { ...e, ...updates } : e
          );
          break;
        case 'skills':
          newData.skills = newData.skills.map(s => 
            s.id === itemId ? { ...s, ...updates } : s
          );
          break;
        case 'certifications':
          newData.certifications = newData.certifications.map(c => 
            c.id === itemId ? { ...c, ...updates } : c
          );
          break;
        case 'projects':
          newData.projects = newData.projects.map(p => 
            p.id === itemId ? { ...p, ...updates } : p
          );
          break;
        case 'languages':
          newData.languages = newData.languages.map(l => 
            l.id === itemId ? { ...l, ...updates } : l
          );
          break;
      }
      
      return newData;
    });
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Reorder sections
  const reorderSections = useCallback((sections: CVSection[]) => {
    setCvData(prev => ({
      ...prev,
      sections: sections.map((s, index) => ({ ...s, order: index }))
    }));
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Toggle section visibility
  const toggleSection = useCallback((sectionId: string) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    }));
    setIsDirty(true);
  }, [setCvData, setIsDirty]);

  // Validate CV data
  const validateCV = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!cvData.personalInfo.firstName || !cvData.personalInfo.lastName) {
      errors.push('Name is required');
    }
    if (!cvData.personalInfo.email) {
      errors.push('Email is required');
    }
    if (!cvData.personalInfo.phone) {
      warnings.push('Phone number is recommended');
    }

    // Content checks
    if (!cvData.summary || cvData.summary.length < 50) {
      warnings.push('Professional summary should be at least 50 characters');
    }
    if (cvData.experiences.length === 0) {
      warnings.push('Add at least one work experience');
    }
    if (cvData.education.length === 0) {
      warnings.push('Add at least one education entry');
    }
    if (cvData.skills.length < 3) {
      warnings.push('Add at least 3 skills');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [cvData]);

  return {
    cvData,
    isLoading,
    loadCVData,
    saveCVData,
    updateSection,
    addSectionItem,
    removeSectionItem,
    updateSectionItem,
    reorderSections,
    toggleSection,
    validateCV
  };
}
