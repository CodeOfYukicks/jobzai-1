/**
 * User Matching Profile Builder V6.0
 * 
 * Creates an enriched user profile optimized for job matching.
 * Extracts and normalizes data from:
 * - Professional history (including client companies for consultants)
 * - Skills and tools (weighted by importance)
 * - Certifications (with boost values)
 * - Career preferences and objectives
 */

// =============================================================================
// TYPES
// =============================================================================

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
export type TechnicalDomain = 'frontend' | 'backend' | 'fullstack' | 'data' | 'devops' | 'mobile' | 'design' | 'product' | 'other';
export type CompanySize = 'startup' | 'scaleup' | 'enterprise' | 'any';
export type WorkStyle = 'remote' | 'hybrid' | 'onsite' | 'any';

export interface WeightedSkill {
    skill: string;
    normalizedSkill: string;
    weight: number; // 1-3 (1=secondary, 2=important, 3=core)
    category: 'core' | 'important' | 'secondary';
}

export interface CertificationBoost {
    certification: string;
    normalizedName: string;
    boost: number; // Points to add when matched
    keywords: string[]; // Keywords to look for in job description
}

export interface UserMatchingProfile {
    // Core matching data
    inferredSeniority: SeniorityLevel;
    totalYearsExperience: number;
    currentTitle: string;
    
    // Normalized skills with weights
    weightedSkills: WeightedSkill[];
    coreSkills: string[]; // Top skills (weight=3)
    importantSkills: string[]; // Important skills (weight=2)
    secondarySkills: string[]; // Secondary skills (weight=1)
    
    // All technologies (flattened)
    allTechnologies: string[];
    
    // Companies and industries
    relevantCompanies: string[]; // Employers + clients
    relevantIndustries: string[];
    
    // Technical domain
    primaryDomain: TechnicalDomain;
    secondaryDomains: TechnicalDomain[];
    
    // Preferences
    companySize: CompanySize;
    workStyle: WorkStyle;
    
    // Certifications with boosts
    certificationBoosts: CertificationBoost[];
    
    // Semantic keywords from summary + responsibilities
    semanticKeywords: string[];
    
    // Education
    highestEducation: string;
    educationField: string;
    
    // Languages (fluent/native only)
    fluentLanguages: string[];
    
    // Profile completeness (0-100)
    profileCompleteness: number;
}

// Input type - raw user data from Firestore
export interface RawUserProfile {
    firstName?: string;
    lastName?: string;
    headline?: string;
    
    // Skills & tools
    skills?: string[];
    tools?: string[];
    softSkills?: string[];
    certifications?: Array<{ name: string; issuer?: string; year?: string }>;
    
    // Professional history
    professionalHistory?: Array<{
        title: string;
        company: string;
        client?: string;
        startDate: string;
        endDate: string;
        current: boolean;
        industry?: string;
        contractType?: string;
        location?: string;
        responsibilities?: string[];
        achievements?: string[];
    }>;
    
    // Education
    educationLevel?: string;
    educationField?: string;
    educationInstitution?: string;
    educations?: Array<{
        degree: string;
        field: string;
        institution: string;
    }>;
    
    // Languages
    languages?: Array<{ language: string; level: string }>;
    
    // Location & preferences
    city?: string;
    country?: string;
    workPreference?: string;
    willingToRelocate?: boolean;
    preferredEnvironment?: string[];
    productType?: string[];
    functionalDomain?: string[];
    
    // Career objectives
    targetPosition?: string;
    targetSectors?: string[];
    yearsOfExperience?: string | number;
    
    // Career drivers
    careerPriorities?: string[];
    primaryMotivator?: string;
    
    // Summary
    professionalSummary?: string;
    
    // Profile tags from CV import
    profileTags?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Core technologies that carry more weight
const CORE_TECHNOLOGIES: Record<string, string[]> = {
    frontend: ['react', 'vue', 'angular', 'typescript', 'javascript', 'nextjs', 'svelte'],
    backend: ['node', 'python', 'java', 'go', 'rust', 'c#', 'ruby', 'php', 'scala', 'kotlin'],
    data: ['sql', 'python', 'spark', 'tensorflow', 'pytorch', 'pandas', 'snowflake', 'databricks'],
    devops: ['docker', 'kubernetes', 'terraform', 'aws', 'azure', 'gcp', 'jenkins', 'github actions'],
    mobile: ['swift', 'kotlin', 'react native', 'flutter', 'ios', 'android'],
    design: ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator'],
};

// Certifications with their boost values and keywords
const CERTIFICATION_BOOSTS: Record<string, { boost: number; keywords: string[] }> = {
    // Cloud certifications
    'aws certified': { boost: 10, keywords: ['aws', 'amazon web services', 'cloud'] },
    'aws solutions architect': { boost: 12, keywords: ['aws', 'architect', 'cloud architecture'] },
    'aws developer': { boost: 10, keywords: ['aws', 'cloud developer'] },
    'azure certified': { boost: 10, keywords: ['azure', 'microsoft cloud'] },
    'google cloud': { boost: 10, keywords: ['gcp', 'google cloud'] },
    
    // Salesforce certifications
    'salesforce administrator': { boost: 12, keywords: ['salesforce', 'sfdc', 'crm'] },
    'salesforce developer': { boost: 12, keywords: ['salesforce', 'apex', 'lightning'] },
    'salesforce architect': { boost: 15, keywords: ['salesforce', 'architect'] },
    
    // Project Management
    'pmp': { boost: 10, keywords: ['project management', 'pmp', 'pmi'] },
    'scrum master': { boost: 8, keywords: ['scrum', 'agile', 'scrum master'] },
    'prince2': { boost: 8, keywords: ['prince2', 'project management'] },
    
    // Data & AI
    'data science': { boost: 10, keywords: ['data science', 'machine learning', 'ml'] },
    'tensorflow': { boost: 8, keywords: ['tensorflow', 'deep learning', 'neural network'] },
    
    // Security
    'cissp': { boost: 12, keywords: ['security', 'cybersecurity', 'information security'] },
    'ceh': { boost: 10, keywords: ['security', 'ethical hacker', 'penetration'] },
    
    // Development
    'kubernetes': { boost: 10, keywords: ['kubernetes', 'k8s', 'container'] },
    'docker': { boost: 8, keywords: ['docker', 'container', 'containerization'] },
};

// Domain detection keywords
const DOMAIN_KEYWORDS: Record<TechnicalDomain, string[]> = {
    frontend: ['frontend', 'front-end', 'ui', 'ux', 'react', 'vue', 'angular', 'css', 'html', 'javascript', 'web developer'],
    backend: ['backend', 'back-end', 'api', 'server', 'node', 'python', 'java', 'database', 'microservices'],
    fullstack: ['fullstack', 'full-stack', 'full stack'],
    data: ['data', 'analytics', 'machine learning', 'ml', 'ai', 'data science', 'data engineer', 'bi', 'etl'],
    devops: ['devops', 'sre', 'infrastructure', 'cloud', 'ci/cd', 'deployment', 'kubernetes', 'docker'],
    mobile: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
    design: ['design', 'ux', 'ui', 'figma', 'sketch', 'creative', 'visual'],
    product: ['product', 'product manager', 'product owner', 'pm'],
    other: [],
};

// Company size indicators
const COMPANY_SIZE_KEYWORDS: Record<CompanySize, string[]> = {
    startup: ['startup', 'early stage', 'seed', 'series a', 'small team', 'founding'],
    scaleup: ['scale-up', 'scaleup', 'series b', 'series c', 'growth stage', 'hypergrowth'],
    enterprise: ['enterprise', 'fortune 500', 'large company', 'multinational', 'corporate', 'big company'],
    any: [],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/[-_\.]/g, ' ').replace(/\s+/g, ' ');
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'a', 'an', 'in', 'on', 'at', 'by', 'of', 'is', 'it', 'as', 'or', 'be', 'if', 'so', 'no', 'not', 'but', 'all', 'also', 'any', 'do', 'does']);
    
    return text
        .toLowerCase()
        .split(/[\s,;.!?()[\]{}|/\\]+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate total years of experience from professional history
 */
function calculateTotalYearsExperience(history: RawUserProfile['professionalHistory']): number {
    if (!history || history.length === 0) return 0;
    
    let totalMonths = 0;
    const now = new Date();
    
    for (const exp of history) {
        if (!exp.startDate) continue;
        
        const startParts = exp.startDate.split('-');
        if (startParts.length < 2) continue;
        
        const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
        let end: Date;
        
        if (exp.current || !exp.endDate) {
            end = now;
        } else {
            const endParts = exp.endDate.split('-');
            if (endParts.length < 2) continue;
            end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, 1);
        }
        
        if (end >= start) {
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            totalMonths += Math.max(0, months);
        }
    }
    
    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

/**
 * Infer seniority level from years of experience and job titles
 */
function inferSeniority(years: number, titles: string[]): SeniorityLevel {
    // Check titles for explicit seniority
    const allTitles = titles.join(' ').toLowerCase();
    
    if (/\b(cto|ceo|cfo|coo|vp|vice president|director|head of|chief)\b/.test(allTitles)) {
        return 'executive';
    }
    if (/\b(lead|principal|staff|architect|manager)\b/.test(allTitles)) {
        return 'lead';
    }
    if (/\b(senior|sr\.?|snr)\b/.test(allTitles)) {
        return 'senior';
    }
    if (/\b(junior|jr\.?|entry|intern|trainee)\b/.test(allTitles)) {
        return 'junior';
    }
    
    // Infer from years
    if (years >= 12) return 'executive';
    if (years >= 8) return 'lead';
    if (years >= 5) return 'senior';
    if (years >= 2) return 'mid';
    return 'junior';
}

/**
 * Detect primary technical domain from skills and titles
 */
function detectDomain(skills: string[], titles: string[]): { primary: TechnicalDomain; secondary: TechnicalDomain[] } {
    const allText = [...skills, ...titles].join(' ').toLowerCase();
    const domainScores: Record<TechnicalDomain, number> = {
        frontend: 0,
        backend: 0,
        fullstack: 0,
        data: 0,
        devops: 0,
        mobile: 0,
        design: 0,
        product: 0,
        other: 0,
    };
    
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        for (const keyword of keywords) {
            if (allText.includes(keyword)) {
                domainScores[domain as TechnicalDomain] += keyword.length > 5 ? 2 : 1;
            }
        }
    }
    
    // Sort by score
    const sorted = Object.entries(domainScores)
        .filter(([domain]) => domain !== 'other')
        .sort(([, a], [, b]) => b - a);
    
    const primary = sorted[0]?.[1] > 0 ? sorted[0][0] as TechnicalDomain : 'other';
    const secondary = sorted
        .slice(1, 3)
        .filter(([, score]) => score > 0)
        .map(([domain]) => domain as TechnicalDomain);
    
    return { primary, secondary };
}

/**
 * Build weighted skills list
 */
function buildWeightedSkills(user: RawUserProfile): WeightedSkill[] {
    const allSkills: WeightedSkill[] = [];
    const seenSkills = new Set<string>();
    
    // Process tools (technical skills) - these are core
    const tools = user.tools || [];
    for (const skill of tools) {
        const normalized = normalizeString(skill);
        if (seenSkills.has(normalized)) continue;
        seenSkills.add(normalized);
        
        // Check if it's a core technology
        const isCore = Object.values(CORE_TECHNOLOGIES).some(techs => 
            techs.some(t => normalized.includes(t) || t.includes(normalized))
        );
        
        allSkills.push({
            skill,
            normalizedSkill: normalized,
            weight: isCore ? 3 : 2,
            category: isCore ? 'core' : 'important',
        });
    }
    
    // Process skills (soft skills, methodologies)
    const skills = user.skills || [];
    for (const skill of skills) {
        const normalized = normalizeString(skill);
        if (seenSkills.has(normalized)) continue;
        seenSkills.add(normalized);
        
        allSkills.push({
            skill,
            normalizedSkill: normalized,
            weight: 1,
            category: 'secondary',
        });
    }
    
    // Process soft skills
    const softSkills = user.softSkills || [];
    for (const skill of softSkills) {
        const normalized = normalizeString(skill);
        if (seenSkills.has(normalized)) continue;
        seenSkills.add(normalized);
        
        allSkills.push({
            skill,
            normalizedSkill: normalized,
            weight: 1,
            category: 'secondary',
        });
    }
    
    // Extract skills from profile tags
    const profileTags = user.profileTags || [];
    for (const tag of profileTags) {
        const normalized = normalizeString(tag);
        // Skip non-skill tags
        if (normalized.includes('senior') || normalized.includes('junior') || 
            normalized.includes('lead') || normalized.includes('native') ||
            normalized.includes('fluent') || normalized.includes('degree')) {
            continue;
        }
        
        if (seenSkills.has(normalized)) continue;
        seenSkills.add(normalized);
        
        // Profile tags that are tech-related get higher weight
        const isCoreTech = Object.values(CORE_TECHNOLOGIES).some(techs => 
            techs.some(t => normalized.includes(t) || t.includes(normalized))
        );
        
        allSkills.push({
            skill: tag,
            normalizedSkill: normalized,
            weight: isCoreTech ? 2 : 1,
            category: isCoreTech ? 'important' : 'secondary',
        });
    }
    
    return allSkills.sort((a, b) => b.weight - a.weight);
}

/**
 * Build certification boosts
 */
function buildCertificationBoosts(certifications: RawUserProfile['certifications']): CertificationBoost[] {
    if (!certifications || certifications.length === 0) return [];
    
    const boosts: CertificationBoost[] = [];
    
    for (const cert of certifications) {
        const certName = normalizeString(cert.name);
        
        // Find matching boost config
        for (const [key, config] of Object.entries(CERTIFICATION_BOOSTS)) {
            if (certName.includes(key) || key.split(' ').every(word => certName.includes(word))) {
                boosts.push({
                    certification: cert.name,
                    normalizedName: certName,
                    boost: config.boost,
                    keywords: config.keywords,
                });
                break;
            }
        }
        
        // If no match, add with default boost
        if (!boosts.some(b => b.normalizedName === certName)) {
            boosts.push({
                certification: cert.name,
                normalizedName: certName,
                boost: 5, // Default boost
                keywords: certName.split(' ').filter(w => w.length > 3),
            });
        }
    }
    
    return boosts;
}

/**
 * Extract relevant companies (employers + clients)
 */
function extractRelevantCompanies(history: RawUserProfile['professionalHistory']): string[] {
    if (!history) return [];
    
    const companies = new Set<string>();
    
    for (const exp of history) {
        if (exp.company) {
            companies.add(normalizeString(exp.company));
        }
        if (exp.client) {
            companies.add(normalizeString(exp.client));
        }
    }
    
    return Array.from(companies);
}

/**
 * Extract relevant industries
 */
function extractRelevantIndustries(history: RawUserProfile['professionalHistory'], targetSectors: string[]): string[] {
    const industries = new Set<string>();
    
    // From professional history
    if (history) {
        for (const exp of history) {
            if (exp.industry) {
                industries.add(normalizeString(exp.industry));
            }
        }
    }
    
    // From target sectors
    for (const sector of targetSectors || []) {
        industries.add(normalizeString(sector));
    }
    
    return Array.from(industries);
}

/**
 * Extract semantic keywords from summary and responsibilities
 */
function extractSemanticKeywords(user: RawUserProfile): string[] {
    const keywords = new Set<string>();
    
    // From professional summary
    if (user.professionalSummary) {
        extractKeywords(user.professionalSummary).forEach(k => keywords.add(k));
    }
    
    // From headline
    if (user.headline) {
        extractKeywords(user.headline).forEach(k => keywords.add(k));
    }
    
    // From target position
    if (user.targetPosition) {
        extractKeywords(user.targetPosition).forEach(k => keywords.add(k));
    }
    
    // From responsibilities
    if (user.professionalHistory) {
        for (const exp of user.professionalHistory) {
            if (exp.responsibilities) {
                for (const resp of exp.responsibilities) {
                    extractKeywords(resp).forEach(k => keywords.add(k));
                }
            }
            if (exp.achievements) {
                for (const ach of exp.achievements) {
                    extractKeywords(ach).forEach(k => keywords.add(k));
                }
            }
        }
    }
    
    return Array.from(keywords).slice(0, 100); // Limit to 100 keywords
}

/**
 * Detect preferred company size
 */
function detectCompanySize(user: RawUserProfile): CompanySize {
    const prefs = user.preferredEnvironment || [];
    const allText = prefs.join(' ').toLowerCase();
    
    for (const [size, keywords] of Object.entries(COMPANY_SIZE_KEYWORDS)) {
        if (size === 'any') continue;
        for (const keyword of keywords) {
            if (allText.includes(keyword)) {
                return size as CompanySize;
            }
        }
    }
    
    return 'any';
}

/**
 * Detect work style preference
 */
function detectWorkStyle(user: RawUserProfile): WorkStyle {
    const pref = (user.workPreference || '').toLowerCase();
    
    if (pref.includes('remote')) return 'remote';
    if (pref.includes('hybrid')) return 'hybrid';
    if (pref.includes('onsite') || pref.includes('office')) return 'onsite';
    
    return 'any';
}

/**
 * Extract fluent languages
 */
function extractFluentLanguages(languages: RawUserProfile['languages']): string[] {
    if (!languages) return ['english']; // Default
    
    const fluent: string[] = [];
    
    for (const lang of languages) {
        const level = (lang.level || '').toLowerCase();
        if (level.includes('native') || level.includes('fluent') || 
            level.includes('professional') || level.includes('bilingual') ||
            level.includes('c1') || level.includes('c2') || level.includes('b2')) {
            fluent.push(normalizeString(lang.language));
        }
    }
    
    return fluent.length > 0 ? fluent : ['english'];
}

/**
 * Calculate profile completeness score
 */
function calculateProfileCompleteness(user: RawUserProfile): number {
    const fields = [
        { field: 'firstName', weight: 5 },
        { field: 'lastName', weight: 5 },
        { field: 'headline', weight: 5 },
        { field: 'professionalSummary', weight: 10 },
        { field: 'tools', weight: 15, isArray: true },
        { field: 'skills', weight: 10, isArray: true },
        { field: 'professionalHistory', weight: 20, isArray: true },
        { field: 'certifications', weight: 5, isArray: true },
        { field: 'languages', weight: 5, isArray: true },
        { field: 'educationLevel', weight: 5 },
        { field: 'city', weight: 3 },
        { field: 'country', weight: 2 },
        { field: 'workPreference', weight: 5 },
        { field: 'targetPosition', weight: 5 },
    ];
    
    let score = 0;
    let maxScore = 0;
    
    for (const { field, weight, isArray } of fields) {
        maxScore += weight;
        const value = user[field as keyof RawUserProfile];
        
        if (isArray) {
            if (Array.isArray(value) && value.length > 0) {
                score += weight;
            }
        } else if (value) {
            score += weight;
        }
    }
    
    return Math.round((score / maxScore) * 100);
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Build an enriched user matching profile from raw user data
 */
export function buildUserMatchingProfile(user: RawUserProfile): UserMatchingProfile {
    // Calculate years of experience
    const totalYearsExperience = calculateTotalYearsExperience(user.professionalHistory);
    
    // Get all titles for analysis
    const titles = [
        user.headline,
        user.targetPosition,
        ...(user.professionalHistory?.map(h => h.title) || []),
    ].filter(Boolean) as string[];
    
    // Build weighted skills
    const weightedSkills = buildWeightedSkills(user);
    const coreSkills = weightedSkills.filter(s => s.category === 'core').map(s => s.skill);
    const importantSkills = weightedSkills.filter(s => s.category === 'important').map(s => s.skill);
    const secondarySkills = weightedSkills.filter(s => s.category === 'secondary').map(s => s.skill);
    
    // All technologies (for matching)
    const allTechnologies = [...new Set([
        ...(user.tools || []).map(normalizeString),
        ...coreSkills.map(normalizeString),
        ...importantSkills.map(normalizeString),
    ])];
    
    // Detect domain
    const { primary: primaryDomain, secondary: secondaryDomains } = detectDomain(
        allTechnologies,
        titles
    );
    
    return {
        inferredSeniority: inferSeniority(totalYearsExperience, titles),
        totalYearsExperience,
        currentTitle: user.professionalHistory?.find(h => h.current)?.title || user.targetPosition || '',
        
        weightedSkills,
        coreSkills,
        importantSkills,
        secondarySkills,
        allTechnologies,
        
        relevantCompanies: extractRelevantCompanies(user.professionalHistory),
        relevantIndustries: extractRelevantIndustries(user.professionalHistory, user.targetSectors || []),
        
        primaryDomain,
        secondaryDomains,
        
        companySize: detectCompanySize(user),
        workStyle: detectWorkStyle(user),
        
        certificationBoosts: buildCertificationBoosts(user.certifications),
        
        semanticKeywords: extractSemanticKeywords(user),
        
        highestEducation: user.educationLevel || user.educations?.[0]?.degree || '',
        educationField: user.educationField || user.educations?.[0]?.field || '',
        
        fluentLanguages: extractFluentLanguages(user.languages),
        
        profileCompleteness: calculateProfileCompleteness(user),
    };
}

/**
 * Get a human-readable summary of the matching profile
 */
export function getMatchingProfileSummary(profile: UserMatchingProfile): string {
    const parts: string[] = [];
    
    parts.push(`${profile.inferredSeniority} level with ${profile.totalYearsExperience} years experience`);
    
    if (profile.currentTitle) {
        parts.push(`Current: ${profile.currentTitle}`);
    }
    
    parts.push(`Domain: ${profile.primaryDomain}`);
    
    if (profile.coreSkills.length > 0) {
        parts.push(`Core skills: ${profile.coreSkills.slice(0, 5).join(', ')}`);
    }
    
    if (profile.certificationBoosts.length > 0) {
        parts.push(`Certifications: ${profile.certificationBoosts.map(c => c.certification).join(', ')}`);
    }
    
    parts.push(`Profile completeness: ${profile.profileCompleteness}%`);
    
    return parts.join('\n');
}
