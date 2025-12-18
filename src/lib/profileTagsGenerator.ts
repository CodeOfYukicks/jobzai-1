import { CVFullProfileExtractionResult, ExtractedExperience, ExtractedEducation, ExtractedLanguage } from './cvExperienceExtractor';

/**
 * Profile data structure for tag generation
 * Can come from CV extraction or existing form data
 */
export interface ProfileDataForTags {
  // From CV extraction
  experiences?: ExtractedExperience[];
  educations?: ExtractedEducation[];
  skills?: string[];
  tools?: string[];
  languages?: ExtractedLanguage[];
  summary?: string;
  
  // From existing profile data
  yearsOfExperience?: string | number;
  educationLevel?: string;
  workPreference?: string;
  roleType?: string;
  preferredEnvironment?: string[];
  managementExperience?: {
    hasExperience: boolean;
    teamSize: string;
    teamType: string;
  };
  targetPosition?: string;
  city?: string;
  country?: string;
}

/**
 * Generate 15-20 profile tags from CV extraction and existing profile data
 * Tags are lowercase, hyphenated, and deduplicated
 */
export function generateProfileTags(
  extractedProfile: CVFullProfileExtractionResult | null,
  existingData?: ProfileDataForTags
): string[] {
  const tags: string[] = [];
  
  // Merge data sources
  const experiences = extractedProfile?.experiences || [];
  const educations = extractedProfile?.educations || [];
  const skills = extractedProfile?.skills || [];
  const tools = extractedProfile?.tools || [];
  const languages = extractedProfile?.languages || [];
  
  // 1. SENIORITY TAGS (1-2 tags)
  const seniorityTags = generateSeniorityTags(experiences, existingData?.yearsOfExperience);
  tags.push(...seniorityTags);
  
  // 2. TOP TECHNOLOGIES (5-6 tags)
  const techTags = generateTechnologyTags(tools);
  tags.push(...techTags);
  
  // 3. INDUSTRY TAGS (2-3 tags)
  const industryTags = generateIndustryTags(experiences);
  tags.push(...industryTags);
  
  // 4. ROLE TYPE TAGS (1-2 tags)
  const roleTags = generateRoleTypeTags(experiences, existingData?.targetPosition);
  tags.push(...roleTags);
  
  // 5. DOMAIN TAGS (2-3 tags)
  const domainTags = generateDomainTags(tools, skills);
  tags.push(...domainTags);
  
  // 6. EDUCATION TAGS (1 tag)
  const educationTags = generateEducationTags(educations, existingData?.educationLevel);
  tags.push(...educationTags);
  
  // 7. LANGUAGE TAGS (1-2 tags)
  const languageTags = generateLanguageTags(languages);
  tags.push(...languageTags);
  
  // 8. WORK STYLE TAGS (1-2 tags)
  const workStyleTags = generateWorkStyleTags(existingData);
  tags.push(...workStyleTags);
  
  // Deduplicate and normalize
  const uniqueTags = [...new Set(tags.map(normalizeTag).filter(t => t.length > 0))];
  
  // Ensure we have 15-20 tags, prioritize first ones if too many
  return uniqueTags.slice(0, 20);
}

/**
 * Normalize tag to lowercase, hyphenated format
 */
function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calculate years of experience from professional history
 */
function calculateYearsFromExperiences(experiences: ExtractedExperience[]): number {
  if (!experiences || experiences.length === 0) return 0;
  
  let totalMonths = 0;
  const now = new Date();
  
  experiences.forEach(exp => {
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
}

/**
 * Generate seniority tags based on years of experience
 * 0-2: junior | 2-5: mid-level | 5-8: senior | 8-12: lead | 12+: principal/executive
 */
function generateSeniorityTags(
  experiences: ExtractedExperience[],
  existingYears?: string | number
): string[] {
  const tags: string[] = [];
  
  // Calculate years from experiences or use existing
  let years = calculateYearsFromExperiences(experiences);
  if (years === 0 && existingYears) {
    years = typeof existingYears === 'string' ? parseInt(existingYears) || 0 : existingYears;
  }
  
  // Check for management titles in recent experience
  const hasLeadershipTitle = experiences.some(exp => {
    const title = exp.title.toLowerCase();
    return title.includes('lead') || 
           title.includes('head') || 
           title.includes('director') ||
           title.includes('vp') ||
           title.includes('chief') ||
           title.includes('manager') ||
           title.includes('principal');
  });
  
  // Determine seniority level
  if (years >= 12 || hasLeadershipTitle && years >= 8) {
    tags.push('principal');
    if (hasLeadershipTitle) tags.push('executive');
  } else if (years >= 8) {
    tags.push('lead');
    tags.push('staff');
  } else if (years >= 5) {
    tags.push('senior');
  } else if (years >= 2) {
    tags.push('mid-level');
  } else {
    tags.push('junior');
    if (years < 1) tags.push('entry-level');
  }
  
  // Add years indicator
  if (years >= 10) {
    tags.push(`${years}+-years-experience`);
  }
  
  return tags.slice(0, 2);
}

/**
 * Generate technology tags from tools array
 * Prioritizes most important/recognizable technologies
 */
function generateTechnologyTags(tools: string[]): string[] {
  if (!tools || tools.length === 0) return [];
  
  // Priority order for common technologies
  const priorityTech: Record<string, number> = {
    // Languages
    'python': 100, 'javascript': 100, 'typescript': 95, 'java': 90, 'go': 85,
    'rust': 85, 'c++': 80, 'c#': 80, 'ruby': 75, 'php': 70, 'swift': 75, 'kotlin': 75,
    // Frontend
    'react': 100, 'vue': 90, 'angular': 85, 'next.js': 85, 'nextjs': 85,
    // Backend
    'node.js': 95, 'nodejs': 95, 'django': 85, 'flask': 75, 'spring': 80, 'rails': 75,
    '.net': 80, 'express': 70, 'fastapi': 75,
    // Cloud & DevOps
    'aws': 100, 'azure': 90, 'gcp': 85, 'docker': 90, 'kubernetes': 90, 'k8s': 90,
    'terraform': 80, 'jenkins': 70, 'gitlab': 70, 'github actions': 70,
    // Databases
    'postgresql': 85, 'mysql': 80, 'mongodb': 85, 'redis': 75, 'elasticsearch': 75,
    // Data & ML
    'tensorflow': 85, 'pytorch': 85, 'pandas': 70, 'spark': 80, 'sql': 90,
    // Design & Other
    'figma': 80, 'sketch': 70, 'jira': 60, 'salesforce': 80, 'sap': 75,
  };
  
  // Normalize and score tools
  const scoredTools = tools.map(tool => {
    const normalized = tool.toLowerCase().trim();
    const score = priorityTech[normalized] || 50;
    return { tool: normalized, score };
  });
  
  // Sort by priority and take top 6
  scoredTools.sort((a, b) => b.score - a.score);
  
  return scoredTools
    .slice(0, 6)
    .map(t => normalizeTag(t.tool));
}

/**
 * Generate industry tags from professional history
 */
function generateIndustryTags(experiences: ExtractedExperience[]): string[] {
  if (!experiences || experiences.length === 0) return [];
  
  // Industry mapping to normalized tags
  const industryMap: Record<string, string> = {
    'technology': 'tech',
    'technology / it': 'tech',
    'it': 'tech',
    'software': 'tech',
    'finance': 'finance',
    'finance / banking': 'finance',
    'banking': 'finance',
    'fintech': 'fintech',
    'healthcare': 'healthcare',
    'health': 'healthcare',
    'consulting': 'consulting',
    'management consulting': 'consulting',
    'e-commerce': 'e-commerce',
    'retail': 'retail',
    'retail / e-commerce': 'e-commerce',
    'media': 'media',
    'media / entertainment': 'media',
    'entertainment': 'media',
    'education': 'education',
    'edtech': 'edtech',
    'manufacturing': 'manufacturing',
    'energy': 'energy',
    'transportation': 'transportation',
    'logistics': 'logistics',
    'real estate': 'real-estate',
    'insurance': 'insurance',
    'telecommunications': 'telecom',
    'telecom': 'telecom',
    'gaming': 'gaming',
    'startup': 'startup',
    'saas': 'saas',
    'b2b': 'b2b',
    'b2c': 'b2c',
  };
  
  // Count industries from experiences
  const industryCounts: Record<string, number> = {};
  
  experiences.forEach(exp => {
    if (!exp.industry) return;
    const normalized = exp.industry.toLowerCase().trim();
    const mapped = industryMap[normalized] || normalizeTag(normalized);
    industryCounts[mapped] = (industryCounts[mapped] || 0) + 1;
  });
  
  // Sort by frequency and take top 3
  const sortedIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([industry]) => industry);
  
  return sortedIndustries.slice(0, 3);
}

/**
 * Generate role type tags from job titles
 */
function generateRoleTypeTags(
  experiences: ExtractedExperience[],
  targetPosition?: string
): string[] {
  const tags: string[] = [];
  
  // Get the most recent title or target position
  const latestTitle = experiences.length > 0 
    ? experiences[0].title.toLowerCase() 
    : '';
  const targetTitle = targetPosition?.toLowerCase() || '';
  
  const titleToAnalyze = latestTitle || targetTitle;
  if (!titleToAnalyze) return [];
  
  // Role type detection patterns
  const rolePatterns: [RegExp, string][] = [
    // Engineering roles
    [/\b(software|backend|frontend|full[- ]?stack|web|mobile|ios|android)\s*(engineer|developer|dev)\b/i, 'engineer'],
    [/\bengineer\b/i, 'engineer'],
    [/\bdeveloper\b/i, 'developer'],
    [/\barchitect\b/i, 'architect'],
    [/\bdevops\b/i, 'devops'],
    [/\bsre\b|site reliability/i, 'sre'],
    [/\bplatform\b/i, 'platform'],
    
    // Data roles
    [/\bdata\s*(scientist|analyst|engineer)\b/i, 'data'],
    [/\bmachine learning|ml engineer\b/i, 'machine-learning'],
    [/\bdata\b/i, 'data'],
    [/\banalytics?\b/i, 'analytics'],
    [/\bbi\b|business intelligence/i, 'bi'],
    
    // Product & Design
    [/\bproduct\s*(manager|owner|lead)\b/i, 'product'],
    [/\bpm\b/i, 'product'],
    [/\bux|ui|design/i, 'design'],
    [/\bdesigner\b/i, 'designer'],
    
    // Management
    [/\bengineering\s*manager\b/i, 'engineering-manager'],
    [/\btech\s*lead\b/i, 'tech-lead'],
    [/\bteam\s*lead\b/i, 'team-lead'],
    [/\bmanager\b/i, 'manager'],
    [/\bdirector\b/i, 'director'],
    [/\bhead of\b/i, 'head'],
    [/\bvp\b|vice president/i, 'vp'],
    [/\bcto\b|chief technology/i, 'cto'],
    [/\bceo\b|chief executive/i, 'ceo'],
    
    // Other roles
    [/\bconsultant\b/i, 'consultant'],
    [/\bsales\b/i, 'sales'],
    [/\bmarketing\b/i, 'marketing'],
    [/\bhr\b|human resources/i, 'hr'],
    [/\brecruiter\b/i, 'recruiter'],
    [/\boperations\b/i, 'operations'],
    [/\bproject\s*manager\b/i, 'project-manager'],
    [/\bscrum\s*master\b/i, 'scrum-master'],
    [/\bagile\s*coach\b/i, 'agile-coach'],
    [/\bqa\b|quality assurance|test/i, 'qa'],
    [/\bsecurity\b/i, 'security'],
    [/\bsysadmin|system administrator/i, 'sysadmin'],
  ];
  
  // Find matching roles
  for (const [pattern, role] of rolePatterns) {
    if (pattern.test(titleToAnalyze)) {
      if (!tags.includes(role)) {
        tags.push(role);
      }
      if (tags.length >= 2) break;
    }
  }
  
  return tags.slice(0, 2);
}

/**
 * Generate domain tags based on tools and skills
 * Frontend, Backend, Full-stack, DevOps, Mobile, ML, etc.
 */
function generateDomainTags(tools: string[], skills: string[]): string[] {
  const tags: string[] = [];
  const allItems = [...tools, ...skills].map(s => s.toLowerCase());
  
  // Domain detection patterns
  const frontendPatterns = ['react', 'vue', 'angular', 'svelte', 'css', 'sass', 'tailwind', 'html', 'next.js', 'nextjs', 'gatsby', 'frontend', 'front-end'];
  const backendPatterns = ['node', 'django', 'flask', 'spring', 'rails', 'express', '.net', 'laravel', 'fastapi', 'backend', 'back-end', 'api'];
  const devopsPatterns = ['docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'aws', 'azure', 'gcp', 'devops', 'cloud', 'infrastructure'];
  const mobilePatterns = ['ios', 'android', 'swift', 'kotlin', 'react native', 'flutter', 'mobile'];
  const dataPatterns = ['pandas', 'numpy', 'spark', 'hadoop', 'sql', 'tableau', 'power bi', 'data analysis', 'data engineering', 'etl'];
  const mlPatterns = ['tensorflow', 'pytorch', 'scikit', 'machine learning', 'deep learning', 'nlp', 'ai', 'ml'];
  const securityPatterns = ['security', 'cybersecurity', 'penetration', 'encryption', 'owasp', 'soc', 'siem'];
  
  // Count matches
  const frontendCount = allItems.filter(i => frontendPatterns.some(p => i.includes(p))).length;
  const backendCount = allItems.filter(i => backendPatterns.some(p => i.includes(p))).length;
  const devopsCount = allItems.filter(i => devopsPatterns.some(p => i.includes(p))).length;
  const mobileCount = allItems.filter(i => mobilePatterns.some(p => i.includes(p))).length;
  const dataCount = allItems.filter(i => dataPatterns.some(p => i.includes(p))).length;
  const mlCount = allItems.filter(i => mlPatterns.some(p => i.includes(p))).length;
  const securityCount = allItems.filter(i => securityPatterns.some(p => i.includes(p))).length;
  
  // Determine domains
  if (frontendCount >= 2 && backendCount >= 2) {
    tags.push('full-stack');
  } else {
    if (frontendCount >= 2) tags.push('frontend');
    if (backendCount >= 2) tags.push('backend');
  }
  
  if (devopsCount >= 2) tags.push('devops');
  if (mobileCount >= 2) tags.push('mobile');
  if (dataCount >= 2) tags.push('data');
  if (mlCount >= 2) tags.push('machine-learning');
  if (securityCount >= 2) tags.push('security');
  
  return tags.slice(0, 3);
}

/**
 * Generate education tags from education level
 */
function generateEducationTags(
  educations: ExtractedEducation[],
  existingLevel?: string
): string[] {
  // Get highest education level
  let level = existingLevel?.toLowerCase() || '';
  
  if (educations && educations.length > 0) {
    const degreePriority: Record<string, number> = {
      'phd': 100,
      'doctorate': 100,
      'master': 80,
      'mba': 80,
      'bachelor': 60,
      'associate': 40,
      'bootcamp': 30,
      'high-school': 20,
      'other': 10,
    };
    
    // Find highest degree
    let highestScore = 0;
    educations.forEach(edu => {
      const degree = edu.degree.toLowerCase();
      const score = degreePriority[degree] || 0;
      if (score > highestScore) {
        highestScore = score;
        level = degree;
      }
    });
  }
  
  // Map to tag
  const levelMap: Record<string, string> = {
    'phd': 'phd',
    'doctorate': 'phd',
    'master': 'masters-degree',
    'mba': 'mba',
    'bachelor': 'bachelors-degree',
    'associate': 'associate-degree',
    'bootcamp': 'bootcamp',
    'high-school': 'high-school',
  };
  
  const tag = levelMap[level] || '';
  return tag ? [tag] : [];
}

/**
 * Generate language tags from spoken languages
 */
function generateLanguageTags(languages: ExtractedLanguage[]): string[] {
  if (!languages || languages.length === 0) return [];
  
  const tags: string[] = [];
  
  // Prioritize native and fluent languages
  const sorted = [...languages].sort((a, b) => {
    const levelPriority: Record<string, number> = {
      'native': 100,
      'fluent': 80,
      'professional': 70,
      'intermediate': 50,
      'beginner': 20,
    };
    return (levelPriority[b.level] || 0) - (levelPriority[a.level] || 0);
  });
  
  // Take top 2 languages (native/fluent only)
  sorted.forEach(lang => {
    if (tags.length >= 2) return;
    if (lang.level === 'native' || lang.level === 'fluent') {
      const langName = lang.language.toLowerCase();
      const levelSuffix = lang.level === 'native' ? 'native' : 'fluent';
      tags.push(`${langName}-${levelSuffix}`);
    }
  });
  
  return tags;
}

/**
 * Generate work style tags from preferences
 */
function generateWorkStyleTags(data?: ProfileDataForTags): string[] {
  const tags: string[] = [];
  
  if (!data) return tags;
  
  // Work preference (remote, hybrid, onsite)
  if (data.workPreference) {
    const pref = data.workPreference.toLowerCase();
    if (pref.includes('remote')) tags.push('remote');
    else if (pref.includes('hybrid')) tags.push('hybrid');
    else if (pref.includes('onsite') || pref.includes('office')) tags.push('onsite');
  }
  
  // Management/Leadership experience
  if (data.managementExperience?.hasExperience) {
    tags.push('leadership');
    const teamSize = parseInt(data.managementExperience.teamSize || '0');
    if (teamSize >= 10) tags.push('people-management');
  }
  
  // Preferred environment
  if (data.preferredEnvironment && data.preferredEnvironment.length > 0) {
    const envs = data.preferredEnvironment.map(e => e.toLowerCase());
    if (envs.some(e => e.includes('startup'))) tags.push('startup');
    if (envs.some(e => e.includes('scale-up') || e.includes('scaleup'))) tags.push('scale-up');
    if (envs.some(e => e.includes('corporate') || e.includes('enterprise'))) tags.push('enterprise');
  }
  
  return tags.slice(0, 2);
}












