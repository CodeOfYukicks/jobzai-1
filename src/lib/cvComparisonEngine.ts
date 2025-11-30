/**
 * CV Comparison Engine
 * Core logic for computing word-level diffs between original and AI-rewritten CVs
 */

import {
  DiffSegment,
  DiffType,
  WordDiffResult,
  CVComparisonResult,
  SummaryComparison,
  ExperiencesComparison,
  ExperienceComparisonItem,
  BulletComparison,
  EducationComparison,
  EducationComparisonItem,
  SkillsComparison,
  SkillComparisonItem,
  OriginalCVData,
  ComparisonSectionType,
} from '../types/cvComparison';
import { CVData } from '../types/cvEditor';

// ============================================================================
// HOBBY DETECTION
// ============================================================================

/**
 * Patterns that indicate a bullet is about hobbies/interests, not professional work
 */
const HOBBY_PATTERNS = [
  // Sports & Games
  /^(Chess|Tennis|Football|Soccer|Basketball|Golf|Running|Yoga|Swimming|Cycling|Hiking|Skiing|Surfing|Climbing|Martial Arts|Boxing|Fitness|CrossFit|Marathon|Triathlon)\s*[:|-]/i,
  // Arts & Entertainment  
  /^(Cinema|Film|Movies|Photography|Painting|Drawing|Music|Guitar|Piano|Drums|Singing|Dancing|Theater|Theatre|Acting|Writing|Poetry|Art|Design|Sculpture)\s*[:|-]/i,
  // Competitive gaming/ratings
  /\b(ELO|rating|ranked|competitive player|tournament)\b/i,
  // Personal projects that are clearly hobbies
  /^(Hobby|Interest|Passion|Side project|Personal project|Amateur|Enthusiast)\s*[:|-]/i,
  // Filmmaker/writer hobbies
  /\b(screenplay|filmmaker|screenwriter|amateur filmmaker)\b/i,
  // Gaming
  /^(Gaming|Video games|Esports|Twitch|Streaming)\s*[:|-]/i,
  // Travel/Lifestyle
  /^(Travel|Cooking|Reading|Gardening|DIY|Volunteering|Charity)\s*[:|-]/i,
];

/**
 * Check if a bullet point looks like a hobby/interest rather than professional work
 */
function isHobbyBullet(bullet: string): boolean {
  if (!bullet || typeof bullet !== 'string') return false;
  
  const trimmed = bullet.trim();
  
  // Check against hobby patterns
  for (const pattern of HOBBY_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.log(`   🎯 Detected hobby bullet: "${trimmed.substring(0, 50)}..."`);
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// STRUCTURED DATA CONVERTER
// ============================================================================

/**
 * Convert original_structured_data from cv_rewrite to OriginalCVData format
 * This is more accurate than parsing raw markdown
 * 
 * IMPORTANT: Handles multiple field name variations for backwards compatibility
 */
export function convertStructuredDataToOriginalCVData(structuredData: any): OriginalCVData {
  if (!structuredData) {
    console.warn('⚠️ convertStructuredDataToOriginalCVData: No structured data provided');
    return {};
  }

  console.log('🔄 Converting original_structured_data to OriginalCVData...');
  console.log('   Raw data keys:', Object.keys(structuredData));
  
  // Debug: Log experience structure
  if (structuredData.experiences?.length > 0) {
    console.log('   First experience keys:', Object.keys(structuredData.experiences[0]));
    console.log('   First experience:', JSON.stringify(structuredData.experiences[0], null, 2).substring(0, 500));
  }

  const result: OriginalCVData = {
    personalInfo: structuredData.personalInfo ? {
      firstName: structuredData.personalInfo.firstName || structuredData.personalInfo.name?.split(' ')[0],
      lastName: structuredData.personalInfo.lastName || structuredData.personalInfo.name?.split(' ').slice(1).join(' '),
      email: structuredData.personalInfo.email,
      phone: structuredData.personalInfo.phone,
      location: structuredData.personalInfo.location,
      linkedin: structuredData.personalInfo.linkedin,
      title: structuredData.personalInfo.title || structuredData.personalInfo.jobTitle,
    } : {},
    
    summary: structuredData.summary || '',
    
    experiences: (structuredData.experiences || []).map((exp: any, idx: number) => {
      // Handle multiple possible field names for bullets
      const bullets = exp.bullets || exp.responsibilities || exp.description || exp.achievements || [];
      const allBullets = Array.isArray(bullets) ? bullets.filter((b: any) => b && typeof b === 'string' && b.trim()) : [];
      
      // Filter out hobby-like bullets that shouldn't be in professional experiences
      const normalizedBullets = allBullets.filter((bullet: string) => !isHobbyBullet(bullet));
      const filteredCount = allBullets.length - normalizedBullets.length;
      
      if (filteredCount > 0) {
        console.log(`   Experience[${idx}] "${exp.title}": Filtered ${filteredCount} hobby-like bullets`);
      }
      
      console.log(`   Experience[${idx}] "${exp.title}" bullets:`, {
        hasBullets: !!exp.bullets,
        hasResponsibilities: !!exp.responsibilities,
        totalBullets: allBullets.length,
        afterFiltering: normalizedBullets.length
      });
      
      return {
        id: exp.id || `orig-exp-${idx}`,
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        bullets: normalizedBullets,
      };
    }),
    
    education: (structuredData.educations || structuredData.education || []).map((edu: any, idx: number) => ({
      id: edu.id || `orig-edu-${idx}`,
      degree: edu.degree || '',
      institution: edu.institution || '',
      field: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || edu.year || '',
      gpa: edu.gpa || '',
    })),
    
    skills: structuredData.skills || [],
    
    certifications: (structuredData.certifications || []).map((cert: any) => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || cert.year || '',
    })),
    
    languages: (structuredData.languages || []).map((lang: any) => ({
      name: typeof lang === 'string' ? lang : (lang.name || ''),
      level: typeof lang === 'object' ? (lang.level || '') : '',
    })),
  };
  
  console.log('✅ Conversion complete:', {
    experiences: result.experiences?.length || 0,
    experiencesWithBullets: result.experiences?.filter(e => e.bullets && e.bullets.length > 0).length || 0,
    education: result.education?.length || 0,
    skills: result.skills?.length || 0,
  });
  
  return result;
}

// ============================================================================
// WORD-LEVEL DIFF ALGORITHM
// ============================================================================

/**
 * Compute word-level diff between two strings using a modified LCS algorithm
 */
export function computeWordLevelDiff(original: string, modified: string): WordDiffResult {
  if (!original && !modified) {
    return {
      segments: [],
      hasChanges: false,
      addedCount: 0,
      removedCount: 0,
      unchangedCount: 0,
    };
  }

  if (!original) {
    const words = modified.split(/(\s+)/);
    return {
      segments: words.map(w => ({ type: 'added' as DiffType, value: w })),
      hasChanges: true,
      addedCount: words.filter(w => w.trim()).length,
      removedCount: 0,
      unchangedCount: 0,
    };
  }

  if (!modified) {
    const words = original.split(/(\s+)/);
    return {
      segments: words.map(w => ({ type: 'removed' as DiffType, value: w })),
      hasChanges: true,
      addedCount: 0,
      removedCount: words.filter(w => w.trim()).length,
      unchangedCount: 0,
    };
  }

  if (original === modified) {
    return {
      segments: [{ type: 'unchanged', value: original }],
      hasChanges: false,
      addedCount: 0,
      removedCount: 0,
      unchangedCount: original.split(/\s+/).filter(w => w.trim()).length,
    };
  }

  // Split into words while preserving whitespace
  const originalWords = original.split(/(\s+)/);
  const modifiedWords = modified.split(/(\s+)/);

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  while (i < originalWords.length || j < modifiedWords.length) {
    if (i >= originalWords.length) {
      // Rest of modified words are additions
      segments.push({ type: 'added', value: modifiedWords[j] });
      if (modifiedWords[j].trim()) addedCount++;
      j++;
    } else if (j >= modifiedWords.length) {
      // Rest of original words are removals
      segments.push({ type: 'removed', value: originalWords[i] });
      if (originalWords[i].trim()) removedCount++;
      i++;
    } else if (originalWords[i] === modifiedWords[j]) {
      // Words match
      segments.push({ type: 'unchanged', value: originalWords[i] });
      if (originalWords[i].trim()) unchangedCount++;
      i++;
      j++;
    } else {
      // Look ahead to find matching words
      let foundMatch = false;

      // Check if current modified word appears later in original (removal case)
      for (let k = i + 1; k < Math.min(i + 8, originalWords.length); k++) {
        if (originalWords[k] === modifiedWords[j]) {
          // Mark words between as removed
          for (let l = i; l < k; l++) {
            segments.push({ type: 'removed', value: originalWords[l] });
            if (originalWords[l].trim()) removedCount++;
          }
          i = k;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Check if current original word appears later in modified (addition case)
        for (let k = j + 1; k < Math.min(j + 8, modifiedWords.length); k++) {
          if (modifiedWords[k] === originalWords[i]) {
            // Mark words between as added
            for (let l = j; l < k; l++) {
              segments.push({ type: 'added', value: modifiedWords[l] });
              if (modifiedWords[l].trim()) addedCount++;
            }
            j = k;
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        // No match found, mark as removed then added (replacement)
        segments.push({ type: 'removed', value: originalWords[i] });
        segments.push({ type: 'added', value: modifiedWords[j] });
        if (originalWords[i].trim()) removedCount++;
        if (modifiedWords[j].trim()) addedCount++;
        i++;
        j++;
      }
    }
  }

  // Merge consecutive segments of the same type for cleaner output
  const mergedSegments = mergeConsecutiveSegments(segments);

  return {
    segments: mergedSegments,
    hasChanges: addedCount > 0 || removedCount > 0,
    addedCount,
    removedCount,
    unchangedCount,
  };
}

/**
 * Merge consecutive segments of the same type
 */
function mergeConsecutiveSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];

  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.value += segments[i].value;
    } else {
      merged.push(current);
      current = { ...segments[i] };
    }
  }
  merged.push(current);

  return merged;
}

// ============================================================================
// MARKDOWN PARSING - SMART CV SECTION DETECTION
// ============================================================================

/**
 * Section header patterns - detect various CV section formats
 */
const SECTION_PATTERNS = {
  summary: [
    /^#+\s*(Professional\s*)?Summary/i,
    /^#+\s*About(\s+Me)?/i,
    /^#+\s*Profile/i,
    /^#+\s*Objective/i,
    /^#+\s*Overview/i,
    /^(Professional\s*)?Summary\s*:?$/i,
    /^About(\s+Me)?\s*:?$/i,
    /^Profile\s*:?$/i,
    /^SUMMARY$/i,
    /^PROFILE$/i,
    /^ABOUT$/i,
  ],
  experience: [
    /^#+\s*(Work\s*)?Experience/i,
    /^#+\s*Employment(\s+History)?/i,
    /^#+\s*Professional\s+Experience/i,
    /^#+\s*Career\s+History/i,
    /^(Work\s*)?Experience\s*:?$/i,
    /^Employment(\s+History)?\s*:?$/i,
    /^Professional\s+Experience\s*:?$/i,
    /^WORK EXPERIENCE$/i,
    /^EXPERIENCE$/i,
    /^EMPLOYMENT$/i,
    /^PROFESSIONAL EXPERIENCE$/i,
  ],
  education: [
    /^#+\s*Education/i,
    /^#+\s*Academic/i,
    /^#+\s*Qualifications/i,
    /^Education\s*:?$/i,
    /^Academic(\s+Background)?\s*:?$/i,
    /^EDUCATION$/i,
  ],
  skills: [
    /^#+\s*(Technical\s*)?Skills/i,
    /^#+\s*Core\s*Competencies/i,
    /^#+\s*Expertise/i,
    /^#+\s*Technologies/i,
    /^(Technical\s*)?Skills\s*:?$/i,
    /^Core\s*Competencies\s*:?$/i,
    /^SKILLS$/i,
    /^TECHNICAL SKILLS$/i,
  ],
  certifications: [
    /^#+\s*Certifications?/i,
    /^#+\s*Licenses?\s*(&|and)?\s*Certifications?/i,
    /^Certifications?\s*:?$/i,
    /^CERTIFICATIONS?$/i,
  ],
  languages: [
    /^#+\s*Languages?/i,
    /^Languages?\s*:?$/i,
    /^LANGUAGES?$/i,
  ],
};

/**
 * Detect section type from a line
 */
function detectSectionType(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(trimmed))) {
      return section;
    }
  }
  return null;
}

/**
 * Check if a line looks like an experience/job entry header
 * (Title at Company, Company - Title, etc.)
 * Enhanced to detect more formats including French patterns
 */
function isExperienceHeader(line: string): { title: string; company: string; location?: string } | null {
  const trimmed = line.trim();
  
  // Skip if too short or looks like a bullet
  if (trimmed.length < 5 || /^[•\-*]\s/.test(trimmed)) return null;
  
  // Pattern 1: ### Title - Company or ### Title at Company
  const mdPattern = /^#+\s*(.+?)(?:\s*[-–@]\s*|\s+at\s+|\s+chez\s+)(.+?)(?:\s*[-–•]\s*(.+))?$/i;
  const mdMatch = trimmed.match(mdPattern);
  if (mdMatch) {
    return {
      title: mdMatch[1].trim(),
      company: mdMatch[2].trim(),
      location: mdMatch[3]?.trim(),
    };
  }

  // Pattern 2: Title | Company or Title • Company
  const pipePattern = /^(.+?)\s*[|•]\s*(.+?)(?:\s*[|•]\s*(.+))?$/;
  const pipeMatch = trimmed.match(pipePattern);
  if (pipeMatch && !trimmed.startsWith('#')) {
    const part1 = pipeMatch[1].trim();
    const part2 = pipeMatch[2].trim();
    // Heuristic: if part1 is a known job title pattern
    if (isLikelyJobTitle(part1)) {
      return { title: part1, company: part2, location: pipeMatch[3]?.trim() };
    }
  }

  // Pattern 3: **Title** at Company or **Title** - Company
  const boldPattern = /^\*\*(.+?)\*\*\s*(?:at|chez|[-–@,])\s*(.+?)$/i;
  const boldMatch = trimmed.match(boldPattern);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), company: boldMatch[2].trim() };
  }
  
  // Pattern 4: Title, Company (comma separated)
  const commaPattern = /^([A-Z][^,]+?),\s*([A-Z][^,]+?)(?:,\s*(.+))?$/;
  const commaMatch = trimmed.match(commaPattern);
  if (commaMatch && isLikelyJobTitle(commaMatch[1])) {
    return { 
      title: commaMatch[1].trim(), 
      company: commaMatch[2].trim(),
      location: commaMatch[3]?.trim()
    };
  }
  
  // Pattern 5: Just a bold title followed by company on next line (detect title only)
  // This will be handled in the main parsing logic
  const boldOnlyPattern = /^\*\*(.+?)\*\*\s*$/;
  const boldOnlyMatch = trimmed.match(boldOnlyPattern);
  if (boldOnlyMatch && isLikelyJobTitle(boldOnlyMatch[1])) {
    return { title: boldOnlyMatch[1].trim(), company: '' };
  }
  
  // Pattern 6: Title followed by date range (like "Senior Developer 2020-2023")
  const titleDatePattern = /^([A-Z][^0-9]+?)\s+(\d{4}\s*[-–]\s*(?:\d{4}|Present|Aujourd'hui|Current))/i;
  const titleDateMatch = trimmed.match(titleDatePattern);
  if (titleDateMatch && isLikelyJobTitle(titleDateMatch[1])) {
    return { title: titleDateMatch[1].trim(), company: '' };
  }

  return null;
}

/**
 * Check if text looks like a job title
 */
function isLikelyJobTitle(text: string): boolean {
  const jobTitleKeywords = [
    // English titles
    'manager', 'developer', 'engineer', 'analyst', 'consultant', 'director',
    'lead', 'senior', 'junior', 'associate', 'specialist', 'coordinator',
    'architect', 'designer', 'head', 'chief', 'vp', 'president', 'officer',
    'administrator', 'assistant', 'intern', 'trainee', 'executive', 'owner',
    'founder', 'ceo', 'cto', 'cfo', 'coo', 'cio', 'product', 'project',
    'customer success', 'business', 'data', 'software', 'full stack', 'frontend',
    'backend', 'devops', 'qa', 'test', 'marketing', 'sales', 'hr', 'finance',
    'success', 'support', 'technician', 'supervisor', 'strategist', 'scientist',
    'researcher', 'partner', 'principal', 'fellow', 'scrum master', 'agile',
    // French titles
    'responsable', 'directeur', 'directrice', 'chef', 'ingénieur', 'développeur',
    'développeuse', 'analyste', 'conseiller', 'conseillère', 'gestionnaire',
    'chargé', 'chargée', 'stagiaire', 'alternant', 'alternante', 'technicien',
    'technicienne', 'coordinateur', 'coordinatrice', 'assistant', 'assistante'
  ];
  const lower = text.toLowerCase();
  return jobTitleKeywords.some(kw => lower.includes(kw));
}

/**
 * Check if a line looks like it starts a new experience entry
 * More aggressive detection than isExperienceHeader
 */
function looksLikeNewExperience(line: string, prevLine: string): boolean {
  const trimmed = line.trim();
  
  // Empty line followed by title-like content
  if (!prevLine.trim() && trimmed.length > 5) {
    // Check if it looks like a job title on its own line
    if (isLikelyJobTitle(trimmed) && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      return true;
    }
  }
  
  // Line starts with markdown header and contains job title
  if (/^#+\s+/.test(trimmed) && isLikelyJobTitle(trimmed)) {
    return true;
  }
  
  // Bold text that looks like a title
  if (/^\*\*[^*]+\*\*/.test(trimmed) && isLikelyJobTitle(trimmed)) {
    return true;
  }
  
  return false;
}

/**
 * Parse date range from a line (returns startDate, endDate)
 */
function parseDateRange(line: string): { startDate: string; endDate: string } | null {
  const trimmed = line.trim();
  
  // Pattern: Jan 2020 - Dec 2023 or 2020 - Present
  const dateRangePattern = /(?:^|\s)((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\.?\s*\d{4}|\d{4})\s*[-–to]+\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\.?\s*\d{4}|\d{4}|Present|Current|Today|Now|Ongoing)(?:\s|$)/i;
  
  const match = trimmed.match(dateRangePattern);
  if (match) {
    return {
      startDate: match[1].trim(),
      endDate: match[2].trim(),
    };
  }
  return null;
}

/**
 * Check if a line is a bullet point
 */
function isBulletPoint(line: string): string | null {
  const trimmed = line.trim();
  // Bullet patterns: •, -, *, >, or numbered (1., 2.)
  const bulletMatch = trimmed.match(/^[•\-*>▸▹◦‣]\s*(.+)$/);
  if (bulletMatch) return bulletMatch[1].trim();
  
  const numberedMatch = trimmed.match(/^\d+[.)]\s*(.+)$/);
  if (numberedMatch) return numberedMatch[1].trim();
  
  return null;
}

/**
 * Check if a line looks like the start of an experience entry
 * (contains date patterns, company names after titles, etc.)
 */
function looksLikeExperienceStart(line: string): boolean {
  const trimmed = line.trim();
  
  // Date patterns that indicate experience
  if (/\d{4}\s*[-–]\s*(Present|Current|\d{4})/i.test(trimmed)) return true;
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(trimmed)) return true;
  
  // Common job title patterns followed by company
  if (/^(Senior|Junior|Lead|Principal|Staff|Associate|Head|Chief|VP|Director|Manager|Engineer|Developer|Analyst|Consultant|Designer|Architect|Specialist|Coordinator)/i.test(trimmed)) {
    // Check if it has a company indicator
    if (/\s+(at|@|-|–|•|\|)\s+/i.test(trimmed)) return true;
  }
  
  return false;
}

/**
 * Extract summary - get text before experiences section
 * Summary should be short (max 3-4 sentences or ~500 chars)
 * SMART: Stops when it detects experience-like content
 */
function extractSummaryFromText(lines: string[], experienceLineIndex: number): string {
  if (experienceLineIndex <= 0) return '';
  
  // Only look at lines before the experience section header
  const beforeExpLines = lines.slice(0, experienceLineIndex);
  
  // Find summary section header or use the first paragraph
  let summaryStart = -1;
  let summaryEnd = beforeExpLines.length;
  
  // First, try to find explicit summary section
  for (let i = 0; i < beforeExpLines.length; i++) {
    const sectionType = detectSectionType(beforeExpLines[i]);
    if (sectionType === 'summary') {
      summaryStart = i + 1;
    } else if (sectionType && sectionType !== 'summary' && summaryStart >= 0) {
      summaryEnd = i;
      break;
    }
  }
  
  // If we found a summary section, extract it
  if (summaryStart >= 0) {
    const summaryLines: string[] = [];
    for (let i = summaryStart; i < summaryEnd; i++) {
      const line = beforeExpLines[i].trim();
      if (!line) continue;
      if (line.startsWith('#')) continue;
      // Stop if we hit bullet points or experience-like content
      if (isBulletPoint(line)) break;
      if (looksLikeExperienceStart(line)) break;
      summaryLines.push(line);
    }
    return summaryLines.join(' ').trim();
  }
  
  // No explicit summary section - look for the first substantial paragraph
  // that doesn't look like experience content
  const summaryParagraph: string[] = [];
  
  for (let i = 0; i < beforeExpLines.length; i++) {
    const line = beforeExpLines[i].trim();
    
    // Skip empty lines at the start
    if (!line && summaryParagraph.length === 0) continue;
    
    // Skip headers
    if (line.startsWith('#')) continue;
    
    // Skip section headers
    if (detectSectionType(line)) continue;
    
    // Stop at bullet points - these are likely experience details
    if (isBulletPoint(line)) break;
    
    // Stop if this looks like an experience entry
    if (looksLikeExperienceStart(line)) break;
    
    // Stop at date patterns (these indicate experience section started)
    if (/^\d{4}\s*[-–]/.test(line)) break;
    
    // Empty line after collecting some text = end of paragraph
    if (!line && summaryParagraph.length > 0) break;
    
    summaryParagraph.push(line);
    
    // Don't collect too much - summary should be concise
    if (summaryParagraph.join(' ').length > 800) break;
  }
  
  const summary = summaryParagraph.join(' ').trim();
  
  // Validate: summary should be reasonable length
  // Too short = probably not a summary
  // Too long = probably captured too much
  if (summary.length > 50 && summary.length < 1200) {
    return summary;
  }
  
  // If too long, just take the first sentence(s)
  if (summary.length >= 1200) {
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || [];
    const shortSummary = sentences.slice(0, 3).join(' ').trim();
    if (shortSummary.length > 50) {
      return shortSummary;
    }
  }
  
  return '';
}

/**
 * Parse initial_cv markdown/text to structured OriginalCVData format
 * Uses smart detection to identify sections regardless of formatting
 */
export function parseOriginalCVMarkdown(markdown: string): OriginalCVData {
  if (!markdown || markdown.trim().length === 0) {
    return {};
  }

  console.log('📄 Parsing original CV markdown for comparison...');
  console.log(`   Text length: ${markdown.length} chars`);

  const result: OriginalCVData = {
    personalInfo: {},
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
  };

  const lines = markdown.split('\n');
  let currentSection = '';
  let currentExperience: any = null;
  let bulletBuffer: string[] = [];
  let expIdCounter = 0;
  let eduIdCounter = 0;

  // First pass: Find where experience section starts
  let experienceStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const sectionType = detectSectionType(lines[i]);
    if (sectionType === 'experience') {
      experienceStartIndex = i;
      break;
    }
    // Also check if this line looks like an experience entry (even without section header)
    if (experienceStartIndex === -1 && i > 5 && looksLikeExperienceStart(lines[i])) {
      experienceStartIndex = i;
      break;
    }
  }

  // Extract summary (text before experience, not the whole CV)
  if (experienceStartIndex > 0) {
    result.summary = extractSummaryFromText(lines, experienceStartIndex);
    console.log(`   Experience section detected at line ${experienceStartIndex}`);
    console.log(`   Summary extracted (${result.summary?.length || 0} chars): "${result.summary?.substring(0, 100)}..."`);
  } else {
    console.log('   ⚠️ No experience section detected');
  }

  const flushExperience = () => {
    if (currentExperience) {
      if (bulletBuffer.length > 0) {
        currentExperience.bullets = bulletBuffer.filter(b => b.trim());
      }
      if (currentExperience.title || currentExperience.company) {
        result.experiences!.push(currentExperience);
      }
      currentExperience = null;
      bulletBuffer = [];
    }
  };

  // Second pass: Parse line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Detect section change
    const sectionType = detectSectionType(trimmedLine);
    if (sectionType) {
      flushExperience();
      currentSection = sectionType;
      continue;
    }

    // Skip empty lines
    if (!trimmedLine) continue;

    // Process based on current section
    switch (currentSection) {
      case 'experience': {
        // Check for new experience entry (full header with title and company)
        const expHeader = isExperienceHeader(trimmedLine);
        if (expHeader) {
          flushExperience();
          currentExperience = {
            id: `orig-exp-${expIdCounter++}`,
            title: expHeader.title,
            company: expHeader.company,
            location: expHeader.location || '',
            startDate: '',
            endDate: '',
            bullets: [],
          };
          continue;
        }
        
        // NEW: Check if current line looks like start of new experience
        // This catches cases where experiences are separated by blank lines + title
        const prevLine = i > 0 ? lines[i - 1] : '';
        if (currentExperience && looksLikeNewExperience(trimmedLine, prevLine)) {
          // This looks like a new experience, flush the current one
          flushExperience();
          currentExperience = {
            id: `orig-exp-${expIdCounter++}`,
            title: trimmedLine.replace(/^#+\s*|\*\*/g, '').trim(),
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            bullets: [],
          };
          continue;
        }

        // Check for standalone job title (bold or ### header) - only if no current experience
        const titleMatch = trimmedLine.match(/^(?:#+\s*|\*\*)?([^*#]+?)(?:\*\*)?$/);
        if (titleMatch && !currentExperience && isLikelyJobTitle(titleMatch[1])) {
          flushExperience();
          currentExperience = {
            id: `orig-exp-${expIdCounter++}`,
            title: titleMatch[1].trim(),
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            bullets: [],
          };
          continue;
        }

        // Check for date range
        const dateRange = parseDateRange(trimmedLine);
        if (dateRange && currentExperience) {
          currentExperience.startDate = dateRange.startDate;
          currentExperience.endDate = dateRange.endDate;
          continue;
        }

        // Check for company name on its own line (after title)
        if (currentExperience && !currentExperience.company && !isBulletPoint(trimmedLine)) {
          // This might be company name
          if (!isLikelyJobTitle(trimmedLine) && !parseDateRange(trimmedLine)) {
            currentExperience.company = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
            continue;
          }
        }

        // Check for bullet points
        const bullet = isBulletPoint(trimmedLine);
        if (bullet && currentExperience) {
          // Safety check: if we already have many bullets and this looks like a new section
          // it might be corrupted data bleeding into bullets
          if (bulletBuffer.length > 12 && isLikelyJobTitle(bullet)) {
            console.warn(`⚠️ Parsing: Detected job title in bullet #${bulletBuffer.length}: "${bullet.substring(0, 50)}"`);
            // Start new experience with this title
            flushExperience();
            currentExperience = {
              id: `orig-exp-${expIdCounter++}`,
              title: bullet,
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              bullets: [],
            };
            continue;
          }
          bulletBuffer.push(bullet);
          continue;
        }

        // Regular text in experience - might be a bullet without marker
        if (currentExperience && trimmedLine.length > 20) {
          // Check if it's a continuation of bullet points
          if (bulletBuffer.length > 0 || trimmedLine.match(/^(Led|Managed|Developed|Created|Built|Improved|Increased|Reduced|Implemented|Designed|Collaborated|Achieved|Delivered|Spearheaded|Orchestrated|Facilitated)/i)) {
            bulletBuffer.push(trimmedLine);
          }
        }
        break;
      }

      case 'education': {
        // Check for education entry
        const eduMatch = trimmedLine.match(/^(?:#+\s*)?(.+?)(?:\s*[-–@,]\s*|\s+at\s+|\s+from\s+)(.+?)$/i);
        if (eduMatch) {
          result.education!.push({
            id: `orig-edu-${eduIdCounter++}`,
            degree: eduMatch[1].trim(),
            institution: eduMatch[2].trim().replace(/\s*[-–]\s*\d{4}.*$/, ''),
            field: '',
            startDate: '',
            endDate: '',
          });
          continue;
        }

        // Simple degree/institution on one line
        if (!trimmedLine.startsWith('#') && trimmedLine.length > 5) {
          const yearMatch = trimmedLine.match(/\d{4}/);
          result.education!.push({
            id: `orig-edu-${eduIdCounter++}`,
            degree: trimmedLine.replace(/\s*\d{4}.*$/, '').trim(),
            institution: '',
            field: '',
            startDate: '',
            endDate: yearMatch ? yearMatch[0] : '',
          });
        }
        break;
      }

      case 'skills': {
        if (!trimmedLine.startsWith('#')) {
          // Parse skills (comma, bullet, or line separated)
          const skillLine = isBulletPoint(trimmedLine) || trimmedLine;
          const skills = skillLine.split(/[,;|]/).map(s => s.trim()).filter(s => s && s.length > 1);
          result.skills!.push(...skills);
        }
        break;
      }

      case 'languages': {
        if (!trimmedLine.startsWith('#')) {
          const langMatch = trimmedLine.match(/^[•\-*]?\s*([A-Za-zÀ-ÿ]+)\s*[-–:()]*\s*(.*)$/);
          if (langMatch) {
            result.languages!.push({
              name: langMatch[1].trim(),
              level: langMatch[2]?.trim() || '',
            });
          }
        }
        break;
      }

      case 'certifications': {
        if (!trimmedLine.startsWith('#')) {
          const certLine = isBulletPoint(trimmedLine) || trimmedLine;
          result.certifications!.push({
            name: certLine,
            issuer: '',
            date: '',
          });
        }
        break;
      }
    }
  }

  // Flush final experience
  flushExperience();

  // Deduplicate skills
  result.skills = [...new Set(result.skills)].filter(s => s.length > 1);

  // If no summary was found and we have experiences, don't use any default
  // The summary should only be actual summary text from the CV
  if (!result.summary) {
    result.summary = '';
  }

  // POST-PROCESSING: Validate and fix corrupted experiences
  // If any experience has way too many bullets, try to split it
  const MAX_REASONABLE_BULLETS = 15;
  const fixedExperiences: typeof result.experiences = [];
  
  for (const exp of result.experiences || []) {
    if (!exp.bullets || exp.bullets.length <= MAX_REASONABLE_BULLETS) {
      fixedExperiences.push(exp);
      continue;
    }
    
    console.warn(`⚠️ Experience "${exp.title}" has ${exp.bullets.length} bullets - attempting to split...`);
    
    // Try to split the experience by finding job titles in bullets
    let currentExp = { ...exp, bullets: [] as string[] };
    let splitCount = 0;
    
    for (const bullet of exp.bullets) {
      // Check if this bullet looks like a new job title
      if (isLikelyJobTitle(bullet) && currentExp.bullets.length > 3) {
        // Save current experience and start a new one
        fixedExperiences.push(currentExp);
        splitCount++;
        currentExp = {
          id: `orig-exp-${expIdCounter++}`,
          title: bullet,
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          bullets: [],
        };
      } else {
        currentExp.bullets.push(bullet);
      }
    }
    
    // Push the last experience
    fixedExperiences.push(currentExp);
    
    if (splitCount > 0) {
      console.log(`   ✓ Split into ${splitCount + 1} experiences`);
    }
  }
  
  result.experiences = fixedExperiences;

  console.log('✅ Original CV parsing complete:');
  console.log(`   Summary: ${result.summary?.length || 0} chars`);
  console.log(`   Experiences: ${result.experiences?.length || 0}`);
  result.experiences?.forEach((exp, idx) => {
    console.log(`      [${idx}] "${exp.title}" at "${exp.company}" - ${exp.bullets?.length || 0} bullets`);
  });
  console.log(`   Education: ${result.education?.length || 0}`);
  console.log(`   Skills: ${result.skills?.length || 0}`);

  return result;
}

// ============================================================================
// EXPERIENCE MATCHING
// ============================================================================

/**
 * Match experiences between original and modified CVs by company/title similarity
 * Uses multiple strategies with position-based fallback for reliable matching
 */
function matchExperiencesByCompany(
  original: OriginalCVData['experiences'],
  modified: CVData['experiences']
): Map<string, string> {
  const matches = new Map<string, string>();
  
  if (!original || !modified) {
    console.log('⚠️ matchExperiencesByCompany: Missing original or modified experiences');
    return matches;
  }

  console.log(`🔍 Matching ${original.length} original experiences with ${modified.length} modified experiences`);

  const usedModifiedIds = new Set<string>();

  // First pass: exact company match (normalized)
  original.forEach(origExp => {
    const match = modified.find(modExp => 
      !usedModifiedIds.has(modExp.id) &&
      normalizeString(modExp.company) === normalizeString(origExp.company)
    );
    if (match) {
      console.log(`   ✓ Exact company match: "${origExp.company}" -> "${match.company}"`);
      matches.set(origExp.id, match.id);
      usedModifiedIds.add(match.id);
    }
  });

  // Second pass: fuzzy company match (partial match)
  original.forEach(origExp => {
    if (matches.has(origExp.id)) return;

    const match = modified.find(modExp =>
      !usedModifiedIds.has(modExp.id) &&
      fuzzyMatch(modExp.company, origExp.company)
    );
    if (match) {
      console.log(`   ✓ Fuzzy company match: "${origExp.company}" -> "${match.company}"`);
      matches.set(origExp.id, match.id);
      usedModifiedIds.add(match.id);
    }
  });

  // Third pass: title match as fallback
  original.forEach(origExp => {
    if (matches.has(origExp.id)) return;

    const match = modified.find(modExp =>
      !usedModifiedIds.has(modExp.id) &&
      fuzzyMatch(modExp.title, origExp.title)
    );
    if (match) {
      console.log(`   ✓ Title match: "${origExp.title}" -> "${match.title}"`);
      matches.set(origExp.id, match.id);
      usedModifiedIds.add(match.id);
    }
  });

  // Fourth pass: combined company + title similarity score
  original.forEach(origExp => {
    if (matches.has(origExp.id)) return;

    let bestMatch: typeof modified[0] | null = null;
    let bestScore = 0;

    modified.forEach(modExp => {
      if (usedModifiedIds.has(modExp.id)) return;
      
      const companyScore = computeStringSimilarity(origExp.company, modExp.company);
      const titleScore = computeStringSimilarity(origExp.title, modExp.title);
      const combinedScore = (companyScore * 0.6) + (titleScore * 0.4);
      
      if (combinedScore > bestScore && combinedScore >= 0.3) {
        bestScore = combinedScore;
        bestMatch = modExp;
      }
    });

    if (bestMatch) {
      console.log(`   ✓ Similarity match (score: ${bestScore.toFixed(2)}): "${origExp.company}" -> "${bestMatch.company}"`);
      matches.set(origExp.id, bestMatch.id);
      usedModifiedIds.add(bestMatch.id);
    }
  });

  // Fifth pass: FALLBACK by position/index
  // If same number of experiences and some are unmatched, match by position
  if (original.length === modified.length) {
    original.forEach((origExp, index) => {
      if (matches.has(origExp.id)) return;
      
      const modExp = modified[index];
      if (modExp && !usedModifiedIds.has(modExp.id)) {
        console.log(`   ✓ Position fallback [${index}]: "${origExp.company}" -> "${modExp.company}"`);
        matches.set(origExp.id, modExp.id);
        usedModifiedIds.add(modExp.id);
      }
    });
  }

  // Sixth pass: match remaining by order of appearance
  // For any still unmatched, pair them in order
  const unmatchedOriginal = original.filter(o => !matches.has(o.id));
  const unmatchedModified = modified.filter(m => !usedModifiedIds.has(m.id));
  
  unmatchedOriginal.forEach((origExp, idx) => {
    if (idx < unmatchedModified.length) {
      const modExp = unmatchedModified[idx];
      console.log(`   ✓ Order fallback: "${origExp.company}" -> "${modExp.company}"`);
      matches.set(origExp.id, modExp.id);
      usedModifiedIds.add(modExp.id);
    }
  });

  console.log(`   📊 Final matches: ${matches.size}/${original.length} original experiences matched`);
  
  return matches;
}

/**
 * Normalize string for comparison - handles accents and special characters
 */
function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    // Normalize unicode (NFD) and remove diacritics/accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove all non-alphanumeric characters
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Simple fuzzy matching - checks if strings contain each other
 */
function fuzzyMatch(a: string, b: string): boolean {
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (!normA || !normB) return false;
  return normA.includes(normB) || normB.includes(normA);
}

/**
 * Compute similarity score between two strings (0-1) using word overlap
 */
function computeStringSimilarity(a: string, b: string): number {
  const wordsA = normalizeString(a).match(/[a-z0-9]+/g) || [];
  const wordsB = normalizeString(b).match(/[a-z0-9]+/g) || [];
  
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  
  let intersection = 0;
  setA.forEach(word => {
    if (setB.has(word)) intersection++;
  });
  
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ============================================================================
// SECTION COMPARISONS
// ============================================================================

/**
 * Compare summary sections
 */
function compareSummary(original: string | undefined, modified: string | undefined): SummaryComparison {
  const diff = computeWordLevelDiff(original || '', modified || '');
  
  return {
    sectionType: 'summary',
    hasChanges: diff.hasChanges,
    changeStats: {
      added: diff.addedCount,
      removed: diff.removedCount,
      modified: diff.hasChanges ? 1 : 0,
      unchanged: diff.unchangedCount,
    },
    original: original || '',
    modified: modified || '',
    diff,
  };
}

/**
 * Compare individual bullets using smart matching
 */
function compareBullets(
  originalBullets: string[],
  modifiedBullets: string[]
): { bulletComparisons: BulletComparison[]; stats: { added: number; removed: number; modified: number; unchanged: number } } {
  const bulletComparisons: BulletComparison[] = [];
  const usedModifiedIndices = new Set<number>();
  let bulletIdCounter = 0;

  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  // Match original bullets to modified
  originalBullets.forEach((origBullet, origIdx) => {
    // Look for exact match first
    let matchIdx = modifiedBullets.findIndex((modBullet, idx) =>
      !usedModifiedIndices.has(idx) && modBullet === origBullet
    );

    if (matchIdx !== -1) {
      // Exact match - unchanged
      bulletComparisons.push({
        id: `bullet-${bulletIdCounter++}`,
        status: 'unchanged',
        original: origBullet,
        modified: modifiedBullets[matchIdx],
      });
      usedModifiedIndices.add(matchIdx);
      unchanged++;
      return;
    }

    // Look for fuzzy match (similar content)
    matchIdx = modifiedBullets.findIndex((modBullet, idx) => {
      if (usedModifiedIndices.has(idx)) return false;
      const similarity = computeSimilarity(origBullet, modBullet);
      return similarity > 0.4; // 40% similar
    });

    if (matchIdx !== -1) {
      // Modified bullet
      const diff = computeWordLevelDiff(origBullet, modifiedBullets[matchIdx]);
      bulletComparisons.push({
        id: `bullet-${bulletIdCounter++}`,
        status: 'modified',
        original: origBullet,
        modified: modifiedBullets[matchIdx],
        diff,
      });
      usedModifiedIndices.add(matchIdx);
      modified++;
    } else {
      // Removed bullet
      bulletComparisons.push({
        id: `bullet-${bulletIdCounter++}`,
        status: 'removed',
        original: origBullet,
      });
      removed++;
    }
  });

  // Add remaining modified bullets as new
  modifiedBullets.forEach((modBullet, idx) => {
    if (!usedModifiedIndices.has(idx)) {
      bulletComparisons.push({
        id: `bullet-${bulletIdCounter++}`,
        status: 'added',
        modified: modBullet,
      });
      added++;
    }
  });

  return {
    bulletComparisons,
    stats: { added, removed, modified, unchanged },
  };
}

/**
 * Compute similarity score between two strings (0-1)
 */
function computeSimilarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let intersection = 0;
  setA.forEach(word => {
    if (setB.has(word)) intersection++;
  });

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Compare experiences sections
 */
function compareExperiences(
  original: OriginalCVData['experiences'],
  modified: CVData['experiences']
): ExperiencesComparison {
  const items: ExperienceComparisonItem[] = [];
  const matches = matchExperiencesByCompany(original, modified);
  const usedModifiedIds = new Set<string>();

  let totalAdded = 0;
  let totalRemoved = 0;
  let totalModified = 0;
  let totalUnchanged = 0;

  // Process original experiences
  original?.forEach(origExp => {
    const matchedModId = matches.get(origExp.id);

    if (matchedModId) {
      const modExp = modified?.find(e => e.id === matchedModId);
      if (modExp) {
        usedModifiedIds.add(modExp.id);

        const { bulletComparisons, stats } = compareBullets(
          origExp.bullets || [],
          modExp.bullets || []
        );

        const hasChanges = 
          origExp.title !== modExp.title ||
          origExp.company !== modExp.company ||
          stats.added > 0 ||
          stats.removed > 0 ||
          stats.modified > 0;

        items.push({
          id: origExp.id,
          status: hasChanges ? 'modified' : 'unchanged',
          original: {
            title: origExp.title,
            company: origExp.company,
            location: origExp.location,
            startDate: origExp.startDate,
            endDate: origExp.endDate,
            bullets: origExp.bullets || [],
          },
          modified: {
            title: modExp.title,
            company: modExp.company,
            location: modExp.location,
            startDate: modExp.startDate,
            endDate: modExp.endDate,
            bullets: modExp.bullets || [],
          },
          titleDiff: origExp.title !== modExp.title 
            ? computeWordLevelDiff(origExp.title, modExp.title) 
            : undefined,
          companyDiff: origExp.company !== modExp.company 
            ? computeWordLevelDiff(origExp.company, modExp.company) 
            : undefined,
          bulletComparisons,
          changeStats: {
            bulletsAdded: stats.added,
            bulletsRemoved: stats.removed,
            bulletsModified: stats.modified,
            bulletsUnchanged: stats.unchanged,
          },
        });

        if (hasChanges) {
          totalModified++;
        } else {
          totalUnchanged++;
        }
      }
    } else {
      // Removed experience
      items.push({
        id: origExp.id,
        status: 'removed',
        original: {
          title: origExp.title,
          company: origExp.company,
          location: origExp.location,
          startDate: origExp.startDate,
          endDate: origExp.endDate,
          bullets: origExp.bullets || [],
        },
        bulletComparisons: (origExp.bullets || []).map((b, i) => ({
          id: `removed-bullet-${i}`,
          status: 'removed' as const,
          original: b,
        })),
        changeStats: {
          bulletsAdded: 0,
          bulletsRemoved: origExp.bullets?.length || 0,
          bulletsModified: 0,
          bulletsUnchanged: 0,
        },
      });
      totalRemoved++;
    }
  });

  // Add new experiences (not in original)
  modified?.forEach(modExp => {
    if (!usedModifiedIds.has(modExp.id)) {
      items.push({
        id: modExp.id,
        status: 'added',
        modified: {
          title: modExp.title,
          company: modExp.company,
          location: modExp.location,
          startDate: modExp.startDate,
          endDate: modExp.endDate,
          bullets: modExp.bullets || [],
        },
        bulletComparisons: (modExp.bullets || []).map((b, i) => ({
          id: `added-bullet-${i}`,
          status: 'added' as const,
          modified: b,
        })),
        changeStats: {
          bulletsAdded: modExp.bullets?.length || 0,
          bulletsRemoved: 0,
          bulletsModified: 0,
          bulletsUnchanged: 0,
        },
      });
      totalAdded++;
    }
  });

  return {
    sectionType: 'experiences',
    hasChanges: totalAdded > 0 || totalRemoved > 0 || totalModified > 0,
    changeStats: {
      added: totalAdded,
      removed: totalRemoved,
      modified: totalModified,
      unchanged: totalUnchanged,
    },
    items,
  };
}

/**
 * Helper function to process a matched education pair
 */
function processEducationMatch(
  origEdu: NonNullable<OriginalCVData['education']>[0],
  match: NonNullable<CVData['education']>[0],
  items: EducationComparisonItem[],
  counters: { totalModified: () => void; totalUnchanged: () => void }
) {
  const hasChanges =
    origEdu.degree !== match.degree ||
    origEdu.institution !== match.institution ||
    origEdu.field !== match.field;

  items.push({
    id: origEdu.id,
    status: hasChanges ? 'modified' : 'unchanged',
    original: {
      degree: origEdu.degree,
      institution: origEdu.institution,
      field: origEdu.field,
      startDate: origEdu.startDate,
      endDate: origEdu.endDate,
      gpa: origEdu.gpa,
    },
    modified: {
      degree: match.degree,
      institution: match.institution,
      field: match.field,
      startDate: match.startDate,
      endDate: match.endDate,
      gpa: match.gpa,
    },
    degreeDiff: origEdu.degree !== match.degree
      ? computeWordLevelDiff(origEdu.degree, match.degree)
      : undefined,
    institutionDiff: origEdu.institution !== match.institution
      ? computeWordLevelDiff(origEdu.institution, match.institution)
      : undefined,
    fieldDiff: origEdu.field !== match.field
      ? computeWordLevelDiff(origEdu.field || '', match.field || '')
      : undefined,
  });

  if (hasChanges) {
    counters.totalModified();
  } else {
    counters.totalUnchanged();
  }
}

/**
 * Compare education sections with improved matching including position fallback
 */
function compareEducation(
  original: OriginalCVData['education'],
  modified: CVData['education']
): EducationComparison {
  const items: EducationComparisonItem[] = [];
  const usedModifiedIds = new Set<string>();
  const matchedOriginalIds = new Set<string>();

  let totalAdded = 0;
  let totalRemoved = 0;
  let totalModified = 0;
  let totalUnchanged = 0;

  console.log(`🎓 Matching ${original?.length || 0} original education with ${modified?.length || 0} modified education`);

  // First pass: Match by institution or degree name
  original?.forEach(origEdu => {
    const match = modified?.find(modEdu =>
      !usedModifiedIds.has(modEdu.id) &&
      (fuzzyMatch(modEdu.institution, origEdu.institution) ||
       fuzzyMatch(modEdu.degree, origEdu.degree))
    );

    if (match) {
      console.log(`   ✓ Education match: "${origEdu.institution}" -> "${match.institution}"`);
      usedModifiedIds.add(match.id);
      matchedOriginalIds.add(origEdu.id);
      processEducationMatch(origEdu, match, items, { totalModified: () => totalModified++, totalUnchanged: () => totalUnchanged++ });
    }
  });

  // Second pass: Position-based fallback for unmatched education
  if (original && modified && original.length === modified.length) {
    original.forEach((origEdu, index) => {
      if (matchedOriginalIds.has(origEdu.id)) return;
      
      const modEdu = modified[index];
      if (modEdu && !usedModifiedIds.has(modEdu.id)) {
        console.log(`   ✓ Education position fallback [${index}]: "${origEdu.institution}" -> "${modEdu.institution}"`);
        usedModifiedIds.add(modEdu.id);
        matchedOriginalIds.add(origEdu.id);
        processEducationMatch(origEdu, modEdu, items, { totalModified: () => totalModified++, totalUnchanged: () => totalUnchanged++ });
      }
    });
  }

  // Third pass: Order-based fallback for remaining unmatched
  const unmatchedOriginal = original?.filter(o => !matchedOriginalIds.has(o.id)) || [];
  const unmatchedModified = modified?.filter(m => !usedModifiedIds.has(m.id)) || [];
  
  unmatchedOriginal.forEach((origEdu, idx) => {
    if (idx < unmatchedModified.length) {
      const modEdu = unmatchedModified[idx];
      console.log(`   ✓ Education order fallback: "${origEdu.institution}" -> "${modEdu.institution}"`);
      usedModifiedIds.add(modEdu.id);
      matchedOriginalIds.add(origEdu.id);
      processEducationMatch(origEdu, modEdu, items, { totalModified: () => totalModified++, totalUnchanged: () => totalUnchanged++ });
    }
  });

  // Add remaining unmatched original as removed
  original?.forEach(origEdu => {
    if (matchedOriginalIds.has(origEdu.id)) return;
    
    items.push({
      id: origEdu.id,
      status: 'removed',
      original: {
        degree: origEdu.degree,
        institution: origEdu.institution,
        field: origEdu.field,
        startDate: origEdu.startDate,
        endDate: origEdu.endDate,
        gpa: origEdu.gpa,
      },
    });
    totalRemoved++;
  });

  // Add new education entries
  modified?.forEach(modEdu => {
    if (!usedModifiedIds.has(modEdu.id)) {
      items.push({
        id: modEdu.id,
        status: 'added',
        modified: {
          degree: modEdu.degree,
          institution: modEdu.institution,
          field: modEdu.field,
          startDate: modEdu.startDate,
          endDate: modEdu.endDate,
          gpa: modEdu.gpa,
        },
      });
      totalAdded++;
    }
  });

  return {
    sectionType: 'education',
    hasChanges: totalAdded > 0 || totalRemoved > 0 || totalModified > 0,
    changeStats: {
      added: totalAdded,
      removed: totalRemoved,
      modified: totalModified,
      unchanged: totalUnchanged,
    },
    items,
  };
}

/**
 * Compare skills sections
 */
function compareSkills(
  original: OriginalCVData['skills'],
  modified: CVData['skills']
): SkillsComparison {
  const originalSet = new Set((original || []).map(s => s.toLowerCase().trim()));
  const modifiedSet = new Set((modified || []).map(s => 
    (typeof s === 'string' ? s : s.name).toLowerCase().trim()
  ));

  const items: SkillComparisonItem[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  // Check original skills
  originalSet.forEach(skill => {
    if (modifiedSet.has(skill)) {
      items.push({ name: skill, status: 'unchanged' });
      unchanged++;
    } else {
      items.push({ name: skill, status: 'removed' });
      removed++;
    }
  });

  // Check for new skills
  modifiedSet.forEach(skill => {
    if (!originalSet.has(skill)) {
      items.push({ name: skill, status: 'added' });
      added++;
    }
  });

  // Sort: added first, then unchanged, then removed
  items.sort((a, b) => {
    const order = { added: 0, unchanged: 1, removed: 2 };
    return order[a.status] - order[b.status];
  });

  return {
    sectionType: 'skills',
    hasChanges: added > 0 || removed > 0,
    changeStats: {
      added,
      removed,
      modified: 0,
      unchanged,
    },
    items,
  };
}

// ============================================================================
// MAIN COMPARISON FUNCTION
// ============================================================================

/**
 * Compare full CV data and return complete comparison result
 */
export function computeFullCVComparison(
  original: OriginalCVData,
  modified: CVData
): CVComparisonResult {
  const summaryComparison = compareSummary(original.summary, modified.summary);
  const experiencesComparison = compareExperiences(original.experiences, modified.experiences);
  const educationComparison = compareEducation(original.education, modified.education);
  const skillsComparison = compareSkills(original.skills, modified.skills);

  const sectionsChanged = [
    summaryComparison.hasChanges,
    experiencesComparison.hasChanges,
    educationComparison.hasChanges,
    skillsComparison.hasChanges,
  ].filter(Boolean).length;

  const totalAdded =
    summaryComparison.changeStats.added +
    experiencesComparison.changeStats.added +
    educationComparison.changeStats.added +
    skillsComparison.changeStats.added;

  const totalRemoved =
    summaryComparison.changeStats.removed +
    experiencesComparison.changeStats.removed +
    educationComparison.changeStats.removed +
    skillsComparison.changeStats.removed;

  const totalModified =
    summaryComparison.changeStats.modified +
    experiencesComparison.changeStats.modified +
    educationComparison.changeStats.modified +
    skillsComparison.changeStats.modified;

  return {
    hasAnyChanges: sectionsChanged > 0,
    timestamp: new Date().toISOString(),
    summary: summaryComparison,
    experiences: experiencesComparison,
    education: educationComparison,
    skills: skillsComparison,
    totalStats: {
      sectionsChanged,
      totalAdded,
      totalRemoved,
      totalModified,
    },
  };
}

/**
 * Get comparison for a specific section
 */
export function getSectionComparison(
  comparison: CVComparisonResult,
  section: ComparisonSectionType
): SummaryComparison | ExperiencesComparison | EducationComparison | SkillsComparison | undefined {
  switch (section) {
    case 'summary':
      return comparison.summary;
    case 'experiences':
      return comparison.experiences;
    case 'education':
      return comparison.education;
    case 'skills':
      return comparison.skills;
    default:
      return undefined;
  }
}

