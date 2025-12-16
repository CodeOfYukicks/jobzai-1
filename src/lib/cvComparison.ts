import { CVData } from '../types/cvEditor';
import { CVSuggestion } from '../types/cvReview';

/**
 * Deep comparison of two CV states to detect changes
 */
export interface CVChanges {
  hasChanges: boolean;
  changedFields: string[];
  addedItems: string[];
  removedItems: string[];
  modifiedItems: string[];
}

/**
 * Compare two CV data objects and detect changes
 */
export function compareCVData(current: CVData, previous: CVData): CVChanges {
  const changes: CVChanges = {
    hasChanges: false,
    changedFields: [],
    addedItems: [],
    removedItems: [],
    modifiedItems: []
  };

  // Compare personal info
  const personalInfoFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'linkedin', 'portfolio', 'github', 'title'];
  personalInfoFields.forEach(field => {
    if (current.personalInfo[field as keyof typeof current.personalInfo] !== 
        previous.personalInfo[field as keyof typeof previous.personalInfo]) {
      changes.changedFields.push(`personalInfo.${field}`);
      changes.hasChanges = true;
    }
  });

  // Compare summary
  if (current.summary !== previous.summary) {
    changes.changedFields.push('summary');
    changes.hasChanges = true;
  }

  // Compare experiences
  const currentExpIds = new Set(current.experiences.map(e => e.id));
  const previousExpIds = new Set(previous.experiences.map(e => e.id));
  
  previous.experiences.forEach(prevExp => {
    if (!currentExpIds.has(prevExp.id)) {
      changes.removedItems.push(`experience:${prevExp.id}`);
      changes.hasChanges = true;
    }
  });

  current.experiences.forEach(currExp => {
    if (!previousExpIds.has(currExp.id)) {
      changes.addedItems.push(`experience:${currExp.id}`);
      changes.hasChanges = true;
    } else {
      // Check if modified
      const prevExp = previous.experiences.find(e => e.id === currExp.id);
      if (prevExp && JSON.stringify(currExp) !== JSON.stringify(prevExp)) {
        changes.modifiedItems.push(`experience:${currExp.id}`);
        changes.hasChanges = true;
      }
    }
  });

  // Compare education
  const currentEduIds = new Set(current.education.map(e => e.id));
  const previousEduIds = new Set(previous.education.map(e => e.id));
  
  previous.education.forEach(prevEdu => {
    if (!currentEduIds.has(prevEdu.id)) {
      changes.removedItems.push(`education:${prevEdu.id}`);
      changes.hasChanges = true;
    }
  });

  current.education.forEach(currEdu => {
    if (!previousEduIds.has(currEdu.id)) {
      changes.addedItems.push(`education:${currEdu.id}`);
      changes.hasChanges = true;
    } else {
      const prevEdu = previous.education.find(e => e.id === currEdu.id);
      if (prevEdu && JSON.stringify(currEdu) !== JSON.stringify(prevEdu)) {
        changes.modifiedItems.push(`education:${currEdu.id}`);
        changes.hasChanges = true;
      }
    }
  });

  // Compare skills
  const currentSkillNames = new Set(current.skills.map(s => s.name.toLowerCase()));
  const previousSkillNames = new Set(previous.skills.map(s => s.name.toLowerCase()));
  
  if (currentSkillNames.size !== previousSkillNames.size ||
      ![...currentSkillNames].every(s => previousSkillNames.has(s))) {
    changes.changedFields.push('skills');
    changes.hasChanges = true;
  }

  // Compare certifications
  if (current.certifications.length !== previous.certifications.length) {
    changes.changedFields.push('certifications');
    changes.hasChanges = true;
  }

  // Compare projects
  if (current.projects.length !== previous.projects.length) {
    changes.changedFields.push('projects');
    changes.hasChanges = true;
  }

  // Compare languages
  if (current.languages.length !== previous.languages.length) {
    changes.changedFields.push('languages');
    changes.hasChanges = true;
  }

  return changes;
}

/**
 * Detect which suggestions were likely applied based on CV changes
 */
export function detectAppliedSuggestions(
  changes: CVChanges,
  previousSuggestions: CVSuggestion[]
): string[] {
  const appliedIds: string[] = [];

  previousSuggestions.forEach(suggestion => {
    const { action } = suggestion;
    
    // Check if the target field was changed
    if (action.targetField) {
      const targetPath = action.targetSection === 'contact' || action.targetSection === 'personalInfo'
        ? `personalInfo.${action.targetField}`
        : action.targetField;
      
      if (changes.changedFields.includes(targetPath)) {
        appliedIds.push(suggestion.id);
      }
    }

    // Check if related to added items
    if (action.type === 'add' && action.targetSection) {
      const addedInSection = changes.addedItems.some(item => 
        item.startsWith(`${action.targetSection}:`)
      );
      if (addedInSection) {
        appliedIds.push(suggestion.id);
      }
    }

    // Check specific field changes
    if (action.targetField === 'phone' && changes.changedFields.includes('personalInfo.phone')) {
      appliedIds.push(suggestion.id);
    }
    if (action.targetField === 'linkedin' && changes.changedFields.includes('personalInfo.linkedin')) {
      appliedIds.push(suggestion.id);
    }
    if (action.targetField === 'location' && changes.changedFields.includes('personalInfo.location')) {
      appliedIds.push(suggestion.id);
    }
    if (action.targetField === 'summary' && changes.changedFields.includes('summary')) {
      appliedIds.push(suggestion.id);
    }
  });

  return appliedIds;
}

/**
 * Generate a human-readable summary of improvements
 */
export function generateImprovementSummary(
  changes: CVChanges,
  appliedSuggestionIds: string[],
  previousSuggestions: CVSuggestion[]
): string {
  const improvements: string[] = [];

  // Get applied suggestions details
  const appliedSuggestions = previousSuggestions.filter(s => 
    appliedSuggestionIds.includes(s.id)
  );

  // Count high priority fixes
  const highPriorityFixes = appliedSuggestions.filter(s => s.priority === 'high').length;
  if (highPriorityFixes > 0) {
    improvements.push(`Fixed ${highPriorityFixes} high-priority issue${highPriorityFixes > 1 ? 's' : ''}`);
  }

  // Specific improvements
  if (changes.changedFields.includes('personalInfo.phone')) {
    improvements.push('Added phone number');
  }
  if (changes.changedFields.includes('personalInfo.linkedin')) {
    improvements.push('Added LinkedIn profile');
  }
  if (changes.changedFields.includes('summary')) {
    improvements.push('Updated professional summary');
  }
  if (changes.addedItems.some(item => item.startsWith('experience:'))) {
    improvements.push('Added work experience');
  }
  if (changes.modifiedItems.some(item => item.startsWith('experience:'))) {
    improvements.push('Enhanced experience details');
  }
  if (changes.changedFields.includes('skills')) {
    improvements.push('Updated skills section');
  }

  if (improvements.length === 0) {
    return 'Made minor updates to CV';
  }

  if (improvements.length === 1) {
    return improvements[0];
  }

  if (improvements.length === 2) {
    return improvements.join(' and ');
  }

  return improvements.slice(0, -1).join(', ') + ', and ' + improvements[improvements.length - 1];
}

/**
 * Calculate improvement score based on changes
 */
export function calculateImprovementScore(
  changes: CVChanges,
  appliedSuggestionIds: string[],
  previousSuggestions: CVSuggestion[]
): number {
  let improvementPoints = 0;

  // Get applied suggestions
  const appliedSuggestions = previousSuggestions.filter(s => 
    appliedSuggestionIds.includes(s.id)
  );

  // Add points based on priority of fixed suggestions
  appliedSuggestions.forEach(suggestion => {
    if (suggestion.priority === 'high') {
      improvementPoints += 10;
    } else if (suggestion.priority === 'medium') {
      improvementPoints += 5;
    } else {
      improvementPoints += 2;
    }
  });

  // Bonus points for specific critical improvements
  if (changes.changedFields.includes('personalInfo.phone')) {
    improvementPoints += 5;
  }
  if (changes.changedFields.includes('summary') && !changes.changedFields.includes('summary').includes('previous')) {
    improvementPoints += 8;
  }
  if (changes.addedItems.some(item => item.startsWith('experience:'))) {
    improvementPoints += 15;
  }

  return Math.min(improvementPoints, 30); // Cap at 30 points improvement
}















