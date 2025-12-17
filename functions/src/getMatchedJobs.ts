/**
 * Job Matching API v6.0 - Enhanced Matching with Weighted Skills & Company Network
 * 
 * V6.0 ADDITIONS:
 * - Weighted Skills System: Core skills x3, Important x2, Secondary x1, Certification boosts
 * - Company Network Score: Match with past employers and consulting clients
 * - Precise Seniority: Calculate exact years from professional history
 * - Culture Fit Score: Startup/Enterprise, Remote-first, B2B/B2C preferences
 * - Education Match: Field of study matching
 * - Skill Gaps Analysis: Identify missing skills for job
 * 
 * V5.1 ADDITIONS:
 * - Profile Tags Score: AI-generated tags from CV import (seniority, tech, industry, role, domain, work style)
 * - Max +25 points from profile tags matching
 * 
 * V5.0 ADDITIONS:
 * - Semantic matching via embeddings (40% weight in hybrid scoring)
 * - Collaborative filtering (popular jobs among similar users)
 * - Feedback loop (saved/dismissed jobs influence scoring)
 * 
 * Scoring system (max 209 points rule-based - V6.0):
 * - Role Function: +25 (match) / -20 (mismatch)
 * - Weighted Skills: +35 (core x3, important x2, secondary x1, cert boost)
 * - Profile Tags: +25 (V5.1 - seniority +6, tech +6, industry +4, role +4, domain +3, work style +2)
 * - Location: +15 (match)
 * - Precise Seniority: +15 (exact years match)
 * - Industry: +10 (match)
 * - Title Match: +10 (match)
 * - Company Network: +10 (NEW - past employer/client match)
 * - Culture Fit: +8 (NEW - environment preferences)
 * - Education Match: +5 (NEW - field of study)
 * - History Bonus: +10 (past experience)
 * - Collaborative: +8 (popular with similar users)
 * - Other bonuses: salary, recency, career priorities, feedback
 * - Data Quality Penalty: -15 (if enrichmentQuality < 50)
 * - Deal Breakers/Sectors: -30/-20
 * - Language: HARD FILTER (excluded)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { cosineSimilarity } from './utils/cosine';
import { buildUserMatchingProfile, UserMatchingProfile } from './utils/buildUserMatchingProfile';

const REGION = 'us-central1';

// V5.0 Semantic matching weight
const SEMANTIC_WEIGHT = 0.4; // 40% semantic, 60% rule-based

// =============================================================================
// TYPES
// =============================================================================

type RoleFunction = 'engineering' | 'sales' | 'marketing' | 'operations' | 'hr' | 'finance' | 'design' | 'data' | 'product' | 'consulting' | 'support' | 'legal' | 'project' | 'customer_success' | 'account_management' | 'business_analysis' | 'other';

interface UserProfileData {
    // Personal info
    firstName?: string;
    lastName?: string;

    // Core skills & expertise
    skills?: string[];
    tools?: string[];
    softSkills?: string[];
    certifications?: Array<{ name: string; issuer: string; year: string }>;

    // Professional history
    professionalHistory?: Array<{
        title: string;
        company: string;
        client?: string; // V6.0: Client company for consulting roles
        startDate: string;
        endDate: string;
        current: boolean;
        industry?: string;
        contractType?: string;
        location?: string;
        responsibilities?: string[];
        achievements?: string[];
    }>;

    // V6.0: Professional summary from CV import
    professionalSummary?: string;
    
    // V6.0: Education details
    educations?: Array<{
        degree: string;
        field: string;
        institution: string;
    }>;

    // Education & Languages
    educationLevel?: string;
    educationField?: string;
    languages?: Array<{ language: string; level: string }>;

    // Location preferences
    city?: string;
    country?: string;
    preferredCities?: string[];
    preferredCountries?: string[];
    workPreference?: string;
    willingToRelocate?: boolean;
    geographicFlexibility?: string;

    // Experience
    yearsOfExperience?: string | number;

    // Career objectives
    targetPosition?: string;
    targetSectors?: string[];

    // Role preferences
    roleType?: string;
    preferredEnvironment?: string[];
    functionalDomain?: string[];
    productType?: string[];

    // Career drivers
    careerPriorities?: string[];
    primaryMotivator?: string;
    dealBreakers?: string[];
    niceToHaves?: string[];

    // Negative preferences
    sectorsToAvoid?: string[];

    // Salary
    salaryExpectations?: {
        min: string;
        max: string;
        currency: string;
    };

    // Job Search Context (V5.0 - New fields for improved matching)
    searchUrgency?: string; // 'actively_searching' | 'open_to_opportunities' | 'not_looking'
    searchIntensity?: string; // 'high' | 'medium' | 'low'
    currentSituation?: string; // 'employed' | 'unemployed' | 'student' | 'freelance'

    // V5.0 Feedback Loop - User's job preferences from interactions
    savedJobs?: string[];
    dismissedJobs?: string[];
    appliedJobs?: string[];

    // V5.0 Semantic Matching - User profile embedding
    embedding?: number[];

    // V5.1 Profile Tags - AI-generated summary tags from CV import
    profileTags?: string[];
}

interface EnrichedJob {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    logoUrl?: string;
    location: string;
    description?: string;
    summary?: string;
    applyUrl?: string;
    postedAt?: any;

    // V4.0 enriched fields
    roleFunction?: RoleFunction;
    languageRequirements?: string[];
    enrichmentQuality?: number;

    // Standard enriched tags
    technologies?: string[];
    industries?: string[];
    skills?: string[];
    experienceLevels?: string[];
    workLocations?: string[];
    employmentTypes?: string[];
    salaryRange?: string;
    seniority?: string;
    
    // V5.0 Semantic Matching - Job embedding
    embedding?: number[];
    remote?: string;
}

interface MatchBreakdown {
    roleFunctionScore: number;
    skillsScore: number;
    locationScore: number;
    experienceScore: number;
    industryScore: number;
    titleScore: number;
    historyBonus: number;
    environmentBonus: number;
    // V5.0 new scores
    salaryScore: number;
    recencyBonus: number;
    careerPrioritiesScore: number;
    feedbackScore: number;
    semanticScore: number;
    collaborativeScore: number;
    // V5.1 Profile Tags
    profileTagsScore: number;
    // V6.0 New scores
    companyNetworkScore: number;
    cultureFitScore: number;
    educationMatchScore: number;
    certificationBoost: number;
    // V6.0 Skill gaps (for UI)
    skillGaps?: string[];
    matchedCoreSkills?: string[];
    // Penalties
    dataQualityPenalty: number;
    dealBreakerPenalty: number;
    sectorAvoidPenalty: number;
    domainMismatchPenalty: number; // V6.0: Tech vs Finance mismatch
}

// Collaborative data structure
interface CollaborativeData {
    popularJobIds: Set<string>;
    popularCompanies: Set<string>;
}

interface MatchedJob extends EnrichedJob {
    matchScore: number;
    matchDetails: MatchBreakdown;
    matchReasons: string[];
    excludeReasons?: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/[-_]/g, ' ');
}

function extractKeywords(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[\s,;.!?()[\]{}|/\\]+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'were', 'been', 'being'].includes(word));
}

function fuzzyMatch(str1: string, str2: string): boolean {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    return s1.includes(s2) || s2.includes(s1);
}

function calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    const commonWords = words1.filter(w => words2.some(w2 => fuzzyMatch(w, w2)));

    return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Infer user's role function from professional history
 * V5.0 - Extended role types for better precision
 */
function inferUserRoleFunction(user: UserProfileData): RoleFunction {
    const inferFromTitle = (title: string): RoleFunction | null => {
        const t = title.toLowerCase();
        
        // Project Management - MUST come before 'product' to avoid PM confusion
        if (/project manager|program manager|pmo\b|project lead|project coordinator/i.test(t)) return 'project';
        
        // Customer Success - MUST come before generic 'support'
        if (/customer success|csm\b|client success|success manager/i.test(t)) return 'customer_success';
        
        // Account Management - distinct from sales
        if (/account manager|key account|client manager|relationship manager/i.test(t) && !/account executive/i.test(t)) return 'account_management';
        
        // Business Analysis - MUST come before data to avoid 'analyst' confusion
        if (/business analyst|ba\b|functional analyst|requirements analyst|process analyst/i.test(t)) return 'business_analysis';
        
        // Engineering/Development
        if (/engineer|developer|devops|sre|software|backend|frontend|fullstack|programmer|architect/i.test(t)) return 'engineering';
        
        // Consulting
        if (/consultant|advisory|implementation specialist/i.test(t)) return 'consulting';
        
        // Sales
        if (/sales|account executive|bdr\b|sdr\b|business development|commercial/i.test(t)) return 'sales';
        
        // Data (scientist, engineer, analyst in data context)
        if (/data scientist|data engineer|data analyst|ml engineer|machine learning|ai engineer|analytics engineer/i.test(t)) return 'data';
        
        // Product Management
        if (/product manager|product owner|product lead|head of product/i.test(t)) return 'product';
        
        // Design
        if (/designer|ux|ui|creative director|art director|visual design/i.test(t)) return 'design';
        
        // Marketing
        if (/marketing|growth|content|seo|brand|digital marketing|demand gen/i.test(t)) return 'marketing';
        
        // Operations
        if (/operations|ops manager|supply chain|logistics|procurement|facilities/i.test(t)) return 'operations';
        
        // HR
        if (/hr\b|human resources|recruiter|talent|people ops|people partner/i.test(t)) return 'hr';
        
        // Finance
        if (/finance|accountant|controller|cfo|financial analyst|treasury/i.test(t)) return 'finance';
        
        // Support (generic)
        if (/support|helpdesk|technical support|customer support/i.test(t)) return 'support';
        
        // Legal
        if (/legal|lawyer|counsel|attorney|paralegal|compliance/i.test(t)) return 'legal';
        
        return null;
    };

    // Check target position first
    if (user.targetPosition) {
        const role = inferFromTitle(user.targetPosition);
        if (role) return role;
    }

    // Check most recent job in professional history
    if (user.professionalHistory && user.professionalHistory.length > 0) {
        const currentJob = user.professionalHistory.find(h => h.current) || user.professionalHistory[0];
        const role = inferFromTitle(currentJob.title);
        if (role) return role;
    }

    // Check skills/tools for tech signals
    const allSkills = [...(user.skills || []), ...(user.tools || [])].join(' ').toLowerCase();
    if (/salesforce|apex|lightning|sfdc|crm implementation|netsuite|sap/i.test(allSkills)) return 'consulting';
    if (/python|javascript|react|node|java|aws|azure|docker|kubernetes|terraform/i.test(allSkills)) return 'engineering';
    if (/tableau|powerbi|sql|analytics|looker|snowflake|dbt/i.test(allSkills)) return 'data';
    if (/figma|sketch|adobe|invision|principle/i.test(allSkills)) return 'design';
    if (/hubspot|marketo|salesforce marketing|mailchimp/i.test(allSkills)) return 'marketing';
    if (/gainsight|totango|churnzero/i.test(allSkills)) return 'customer_success';
    if (/jira|asana|monday|ms project|smartsheet/i.test(allSkills)) return 'project';

    return 'other';
}

/**
 * Get user's spoken languages
 */
function getUserLanguages(user: UserProfileData): string[] {
    const langs: string[] = [];

    if (user.languages) {
        for (const lang of user.languages) {
            const langName = normalizeString(lang.language);
            const level = normalizeString(lang.level || '');

            // Only count fluent/native/professional level
            if (level.includes('native') || level.includes('fluent') || level.includes('professional') ||
                level.includes('c1') || level.includes('c2') || level.includes('b2') || level.includes('bilingual')) {
                langs.push(langName);
            }
        }
    }

    // Default: assume French and English if in France
    if (langs.length === 0) {
        if (user.country?.toLowerCase().includes('france') || user.city?.toLowerCase().includes('paris')) {
            langs.push('french', 'english');
        } else {
            langs.push('english'); // Default
        }
    }

    return langs;
}

// =============================================================================
// HARD FILTERS (return true if job should be EXCLUDED)
// =============================================================================

/**
 * HARD FILTER: Language Requirements
 * If job requires specific language and user doesn't speak it, EXCLUDE
 */
function shouldExcludeByLanguage(user: UserProfileData, job: EnrichedJob): { exclude: boolean; reason: string } {
    const jobLangs = job.languageRequirements || [];

    if (jobLangs.length === 0) {
        return { exclude: false, reason: '' };
    }

    const userLangs = getUserLanguages(user);

    // Check if user speaks at least one required language
    const hasRequiredLang = jobLangs.some(reqLang =>
        userLangs.some(userLang => fuzzyMatch(userLang, reqLang))
    );

    if (!hasRequiredLang) {
        return {
            exclude: true,
            reason: `Requires ${jobLangs.join(' or ')} language(s)`
        };
    }

    return { exclude: false, reason: '' };
}

// =============================================================================
// SCORING FUNCTIONS V4.0
// =============================================================================

/**
 * Role Function Match (max +25 / penalty -20)
 * CRITICAL: Prevents sales jobs from matching with engineers
 */
function calculateRoleFunctionScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const userRole = inferUserRoleFunction(user);
    const jobRole = job.roleFunction || 'other';

    // Perfect match
    if (userRole === jobRole) {
        reasons.push(`Role match: ${jobRole}`);
        return { score: 25, reasons };
    }

    // Adjacent/related roles (reduced score but not penalty)
    const adjacentRoles: Record<RoleFunction, RoleFunction[]> = {
        'engineering': ['data', 'product', 'consulting'],
        'consulting': ['engineering', 'product', 'data', 'operations', 'business_analysis', 'project'],
        'data': ['engineering', 'product', 'consulting', 'business_analysis'],
        'product': ['engineering', 'data', 'design', 'project'],
        'design': ['product', 'marketing'],
        'marketing': ['sales', 'design', 'product'],
        'sales': ['marketing', 'account_management', 'customer_success'],
        'support': ['customer_success', 'operations'],
        'operations': ['support', 'finance', 'consulting', 'project'],
        'finance': ['operations', 'business_analysis'],
        'hr': ['operations'],
        'legal': ['operations', 'finance'],
        'project': ['operations', 'product', 'consulting', 'business_analysis'],
        'customer_success': ['account_management', 'sales', 'support'],
        'account_management': ['sales', 'customer_success'],
        'business_analysis': ['consulting', 'data', 'project', 'product'],
        'other': []
    };

    if (adjacentRoles[userRole]?.includes(jobRole)) {
        reasons.push(`Related role: ${jobRole} (you're in ${userRole})`);
        return { score: 10, reasons };
    }

    // If job has no role function data, give small penalty
    if (jobRole === 'other') {
        return { score: 0, reasons: ['Role function unknown'] };
    }

    // PENALTY: Complete mismatch (e.g., engineer vs sales)
    reasons.push(`Role mismatch: ${jobRole} vs your ${userRole}`);
    return { score: -20, reasons };
}

/**
 * V6.0 Weighted Skills & Technologies Match (max +35 / penalty -10 for no data)
 * 
 * Scoring:
 * - Core skill match: 3 points each (max 18 from 6 core skills)
 * - Important skill match: 2 points each (max 10 from 5 important skills)
 * - Secondary skill match: 1 point each (max 7 from 7 secondary skills)
 * - Certification boost: Added separately
 * 
 * Also returns skill gaps for UI
 */
function calculateWeightedSkillsScore(
    user: UserProfileData, 
    job: EnrichedJob,
    matchingProfile?: UserMatchingProfile
): { score: number; reasons: string[]; skillGaps: string[]; matchedCoreSkills: string[]; certBoost: number } {
    const reasons: string[] = [];
    const skillGaps: string[] = [];
    const matchedCoreSkills: string[] = [];
    let certBoost = 0;

    // Job requirements
    const jobTerms = [
        ...(job.technologies || []),
        ...(job.skills || [])
    ].map(normalizeString);

    // PENALTY: Job has NO tech data
    if (jobTerms.length === 0) {
        reasons.push('Job has no technical requirements listed');
        return { score: -10, reasons, skillGaps: [], matchedCoreSkills: [], certBoost: 0 };
    }

    // If no matching profile, fallback to simple matching
    if (!matchingProfile || matchingProfile.weightedSkills.length === 0) {
        // Collect all user skills (fallback)
        const userSkills = [
            ...(user.skills || []),
            ...(user.tools || []),
            ...(user.softSkills || []),
        ].map(normalizeString);

        if (userSkills.length === 0) {
            return { score: 5, reasons: ['No skills data to match'], skillGaps: jobTerms.slice(0, 5), matchedCoreSkills: [], certBoost: 0 };
        }

        let matchCount = 0;
        const matchedSkills: string[] = [];

        for (const userSkill of userSkills) {
            for (const jobTerm of jobTerms) {
                if (fuzzyMatch(userSkill, jobTerm)) {
                    matchCount++;
                    if (!matchedSkills.includes(jobTerm)) {
                        matchedSkills.push(jobTerm);
                    }
                    break;
                }
            }
        }

        const matchPercentage = Math.min(matchCount / Math.max(jobTerms.length, 1), 1);
        const score = Math.round(matchPercentage * 30);

        if (matchedSkills.length > 0) {
            reasons.push(`Skills: ${matchedSkills.slice(0, 4).join(', ')}${matchedSkills.length > 4 ? '...' : ''}`);
        }

        // Skill gaps
        for (const jobTerm of jobTerms) {
            if (!matchedSkills.some(m => fuzzyMatch(m, jobTerm))) {
                skillGaps.push(jobTerm);
            }
        }

        return { score, reasons, skillGaps: skillGaps.slice(0, 5), matchedCoreSkills: matchedSkills, certBoost: 0 };
    }

    // V6.0 Weighted scoring
    let totalScore = 0;
    const matchedByWeight: { core: string[]; important: string[]; secondary: string[] } = {
        core: [],
        important: [],
        secondary: [],
    };

    // Check each job requirement against weighted skills
    const unmatchedJobTerms: string[] = [];
    
    for (const jobTerm of jobTerms) {
        let matched = false;
        
        // Check against user's weighted skills
        for (const weightedSkill of matchingProfile.weightedSkills) {
            if (fuzzyMatch(weightedSkill.normalizedSkill, jobTerm)) {
                matched = true;
                
                // Score based on weight
                if (weightedSkill.category === 'core') {
                    totalScore += 3;
                    matchedByWeight.core.push(weightedSkill.skill);
                    matchedCoreSkills.push(weightedSkill.skill);
                } else if (weightedSkill.category === 'important') {
                    totalScore += 2;
                    matchedByWeight.important.push(weightedSkill.skill);
                } else {
                    totalScore += 1;
                    matchedByWeight.secondary.push(weightedSkill.skill);
                }
                break;
            }
        }
        
        if (!matched) {
            unmatchedJobTerms.push(jobTerm);
        }
    }

    // Calculate certification boost
    if (matchingProfile.certificationBoosts.length > 0) {
        const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
        
        for (const cert of matchingProfile.certificationBoosts) {
            const certMatches = cert.keywords.some(keyword => jobText.includes(keyword));
            if (certMatches) {
                certBoost += cert.boost;
                reasons.push(`Certification: ${cert.certification}`);
            }
        }
        // Cap certification boost at 15
        certBoost = Math.min(certBoost, 15);
    }

    // Cap skill score at 35
    const cappedSkillScore = Math.min(totalScore, 35);

    // Build reasons
    if (matchedByWeight.core.length > 0) {
        const uniqueCore = [...new Set(matchedByWeight.core)].slice(0, 3);
        reasons.push(`Core skills: ${uniqueCore.join(', ')}`);
    }
    if (matchedByWeight.important.length > 0 && matchedByWeight.core.length < 2) {
        const uniqueImportant = [...new Set(matchedByWeight.important)].slice(0, 2);
        reasons.push(`Skills: ${uniqueImportant.join(', ')}`);
    }
    
    if (reasons.length === 0 && jobTerms.length > 0) {
        reasons.push('Limited skill match');
    }

    // Skill gaps for UI
    skillGaps.push(...unmatchedJobTerms.slice(0, 5));

    return { 
        score: cappedSkillScore, 
        reasons, 
        skillGaps, 
        matchedCoreSkills: [...new Set(matchedCoreSkills)],
        certBoost 
    };
}

/**
 * V6.0 Company Network Score (max +10)
 * Matches job company against user's past employers and consulting clients
 */
function calculateCompanyNetworkScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!user.professionalHistory || user.professionalHistory.length === 0) {
        return { score: 0, reasons: [] };
    }
    
    const jobCompany = normalizeString(job.company || '');
    
    // Collect all user companies (employers + clients)
    const userCompanies: string[] = [];
    const userClients: string[] = [];
    
    for (const exp of user.professionalHistory) {
        if (exp.company) {
            userCompanies.push(normalizeString(exp.company));
        }
        if (exp.client) {
            userClients.push(normalizeString(exp.client));
        }
    }
    
    // Direct employer match
    if (userCompanies.some(c => fuzzyMatch(c, jobCompany))) {
        reasons.push(`Previous employer: ${job.company}`);
        return { score: 10, reasons };
    }
    
    // Client match (for consultants)
    if (userClients.some(c => fuzzyMatch(c, jobCompany))) {
        reasons.push(`Past client: ${job.company}`);
        return { score: 8, reasons };
    }
    
    // Check if job is at a competitor/similar company (same industry)
    const userIndustries = user.professionalHistory
        .map(h => h.industry)
        .filter(Boolean)
        .map(i => normalizeString(i!));
    
    const jobIndustries = (job.industries || []).map(normalizeString);
    
    const industryOverlap = userIndustries.some(ui => 
        jobIndustries.some(ji => fuzzyMatch(ui, ji))
    );
    
    if (industryOverlap && userCompanies.length > 0) {
        return { score: 3, reasons: ['Industry experience'] };
    }
    
    return { score: 0, reasons: [] };
}

/**
 * V6.0 Culture Fit Score (max +8)
 * Matches user environment preferences with job signals
 */
function calculateCultureFitScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    const userPrefs = user.preferredEnvironment || [];
    const userProductTypes = user.productType || [];
    
    if (userPrefs.length === 0 && userProductTypes.length === 0) {
        return { score: 2, reasons: [] }; // Neutral if no preferences
    }
    
    const jobText = `${job.company} ${job.description || ''} ${job.title}`.toLowerCase();
    
    // Company size/stage matching
    const companySignals = {
        startup: /startup|early stage|seed|series a|small team|founding|fast-paced environment/i.test(jobText),
        scaleup: /scale-up|scaleup|series b|series c|growth stage|hypergrowth|rapidly growing/i.test(jobText),
        enterprise: /enterprise|fortune 500|multinational|corporate|large company|global company|established/i.test(jobText),
    };
    
    for (const pref of userPrefs) {
        const prefLower = pref.toLowerCase();
        
        if ((prefLower.includes('startup') && companySignals.startup) ||
            (prefLower.includes('scale') && companySignals.scaleup) ||
            ((prefLower.includes('big') || prefLower.includes('corp') || prefLower.includes('enterprise')) && companySignals.enterprise)) {
            score += 4;
            reasons.push(`${pref} environment`);
            break;
        }
    }
    
    // Product type matching (B2B, B2C, etc.)
    const productSignals = {
        b2b: /\bb2b\b|business to business|enterprise customers|saas|business customers/i.test(jobText),
        b2c: /\bb2c\b|consumer|retail|end users|customer-facing|direct to consumer/i.test(jobText),
        internal: /internal tools|back office|internal platform|employee experience/i.test(jobText),
    };
    
    for (const productType of userProductTypes) {
        const typeLower = productType.toLowerCase();
        
        if ((typeLower.includes('b2b') && productSignals.b2b) ||
            (typeLower.includes('b2c') && productSignals.b2c) ||
            (typeLower.includes('internal') && productSignals.internal)) {
            score += 4;
            if (reasons.length < 2) {
                reasons.push(`${productType} focus`);
            }
            break;
        }
    }
    
    return { score: Math.min(score, 8), reasons: reasons.slice(0, 1) };
}

/**
 * V6.0 Education Match Score (max +5)
 * Matches user's education field with job requirements
 */
function calculateEducationMatchScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    // Get user's education field
    const userEducationField = user.educationField || user.educations?.[0]?.field || '';
    const userEducationLevel = user.educationLevel || user.educations?.[0]?.degree || '';
    
    if (!userEducationField && !userEducationLevel) {
        return { score: 1, reasons: [] }; // Minimal neutral score
    }
    
    const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
    const normalizedField = normalizeString(userEducationField);
    
    // Education field matching
    const fieldKeywords: Record<string, string[]> = {
        'computer science': ['computer science', 'software', 'engineering', 'cs degree', 'technical degree'],
        'business': ['business', 'mba', 'commerce', 'management', 'economics'],
        'data science': ['data science', 'statistics', 'mathematics', 'analytics'],
        'design': ['design', 'ux', 'ui', 'creative', 'arts'],
        'finance': ['finance', 'accounting', 'economics', 'cfa'],
        'marketing': ['marketing', 'communications', 'advertising'],
        'engineering': ['engineering', 'mechanical', 'electrical', 'civil'],
    };
    
    // Check if job mentions education requirements
    const requiresDegree = /degree|bachelor|master|phd|diploma|graduate/i.test(jobText);
    
    if (requiresDegree) {
        // Check field match
        for (const [field, keywords] of Object.entries(fieldKeywords)) {
            if (normalizedField.includes(field) || keywords.some(k => normalizedField.includes(k))) {
                // Check if job also mentions this field
                if (keywords.some(k => jobText.includes(k))) {
                    reasons.push(`Education: ${userEducationField}`);
                    return { score: 5, reasons };
                }
            }
        }
        
        // Has degree but field doesn't match specifically
        if (userEducationLevel) {
            return { score: 2, reasons: [] };
        }
    }
    
    return { score: 1, reasons: [] };
}

/**
 * V6.0 Precise Seniority Score (max +15)
 * Calculates exact years from professional history and matches against job requirements
 */
function calculatePreciseSeniorityScore(user: UserProfileData, job: EnrichedJob, matchingProfile?: UserMatchingProfile): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const jobLevels = job.experienceLevels || [];
    const jobSeniority = (job.seniority || '').toLowerCase();

    // Use matchingProfile if available for precise years
    let userYears: number;
    let userLevel: string;
    
    if (matchingProfile) {
        userYears = matchingProfile.totalYearsExperience;
        userLevel = matchingProfile.inferredSeniority;
    } else {
        // Fallback: Calculate from user data
        userYears = typeof user.yearsOfExperience === 'string'
            ? parseInt(user.yearsOfExperience) || 0
            : user.yearsOfExperience || 0;

        // Infer from history if needed
        if (user.professionalHistory && user.professionalHistory.length > 0 && userYears === 0) {
            let totalMonths = 0;
            const now = new Date();
            
            for (const exp of user.professionalHistory) {
                if (!exp.startDate) continue;
                const startParts = exp.startDate.split('-');
                if (startParts.length < 2) continue;
                
                const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, 1);
                const end = exp.current || !exp.endDate 
                    ? now 
                    : new Date(parseInt(exp.endDate.split('-')[0]), parseInt(exp.endDate.split('-')[1] || '1') - 1, 1);
                
                if (end >= start) {
                    totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                }
            }
            userYears = Math.round(totalMonths / 12 * 10) / 10;
        }
        
        // Infer level from years
        if (userYears >= 12) userLevel = 'executive';
        else if (userYears >= 8) userLevel = 'lead';
        else if (userYears >= 5) userLevel = 'senior';
        else if (userYears >= 2) userLevel = 'mid';
        else userLevel = 'junior';
    }
    
    // Extract years requirement from job description
    const description = job.description || '';
    const yearsMatch = description.match(/(\d+)\+?\s*(?:years?|ans?|yrs?)\s*(?:of\s+)?(?:experience|expérience)?/i);
    const jobYearsRequired = yearsMatch ? parseInt(yearsMatch[1]) : null;
    
    // Match against job levels
    const levelMap: Record<string, string[]> = {
        'junior': ['internship', 'entry', 'junior', 'graduate', 'entry-level'],
        'mid': ['mid', 'intermediate', 'mid-level'],
        'senior': ['senior', 'experienced', 'sr'],
        'lead': ['lead', 'principal', 'staff', 'architect'],
        'executive': ['director', 'head', 'vp', 'executive', 'chief'],
    };
    
    // Check level match
    const userLevelKeywords = levelMap[userLevel] || [];
    const levelMatches = jobLevels.some(jl => 
        userLevelKeywords.some(ul => jl.toLowerCase().includes(ul))
    ) || userLevelKeywords.some(ul => jobSeniority.includes(ul));
    
    if (levelMatches) {
        reasons.push(`${userLevel} level (${userYears}y exp)`);
        return { score: 15, reasons };
    }
    
    // Check years requirement match
    if (jobYearsRequired !== null) {
        const diff = Math.abs(userYears - jobYearsRequired);
        
        if (diff <= 1) {
            reasons.push(`${userYears}y exp (need ${jobYearsRequired}y)`);
            return { score: 15, reasons };
        }
        if (diff <= 2) {
            reasons.push(`${userYears}y exp (close to ${jobYearsRequired}y)`);
            return { score: 10, reasons };
        }
        if (diff <= 4) {
            return { score: 5, reasons: [`Experience gap: ${jobYearsRequired}y required`] };
        }
        // Large gap
        return { score: 2, reasons: [] };
    }
    
    // No specific level info in job - check adjacent levels
    if (jobLevels.length > 0) {
        const levels = ['junior', 'mid', 'senior', 'lead', 'executive'];
        const userLevelIndex = levels.indexOf(userLevel);
        
        // Check if any job level is adjacent
        for (const jobLevel of jobLevels) {
            const jobLevelNorm = jobLevel.toLowerCase();
            for (let i = 0; i < levels.length; i++) {
                if (levelMap[levels[i]].some(l => jobLevelNorm.includes(l))) {
                    const diff = Math.abs(userLevelIndex - i);
                    if (diff <= 1) {
                        reasons.push('Experience level match');
                        return { score: 10, reasons };
                    }
                }
            }
        }
    }
    
    // Default neutral
    return { score: 5, reasons: ['No level specified'] };
}

/**
 * Location Match (max +15)
 */
function calculateLocationScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const jobLocation = normalizeString(job.location || '');
    const workLocs = job.workLocations || [];

    // Check remote preference
    const userWantsRemote = user.workPreference === 'remote';
    const userWantsHybrid = user.workPreference === 'hybrid';
    const jobIsRemote = workLocs.includes('remote') || jobLocation.includes('remote');
    const jobIsHybrid = workLocs.includes('hybrid');

    if (userWantsRemote && jobIsRemote) {
        reasons.push('Remote position');
        return { score: 15, reasons };
    }

    if (userWantsHybrid && (jobIsHybrid || jobIsRemote)) {
        reasons.push('Flexible work');
        return { score: 13, reasons };
    }

    // Collect preferred locations
    const preferredLocations = [
        user.city,
        user.country,
        ...(user.preferredCities || []),
        ...(user.preferredCountries || [])
    ].filter(Boolean).map(l => normalizeString(l!));

    for (const prefLoc of preferredLocations) {
        if (jobLocation.includes(prefLoc) || prefLoc.includes(jobLocation.split(',')[0])) {
            reasons.push(`Location: ${job.location}`);
            return { score: 15, reasons };
        }
    }

    if (user.willingToRelocate) {
        reasons.push('Open to relocation');
        return { score: 8, reasons };
    }

    if (jobIsRemote) {
        reasons.push('Remote available');
        return { score: 8, reasons };
    }

    return { score: 3, reasons: ['Location mismatch'] };
}

/**
 * Experience Level Match (max +10)
 */
function calculateExperienceScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const jobLevels = job.experienceLevels || [];

    if (jobLevels.length === 0) return { score: 5, reasons: ['No level specified'] };

    const userYears = typeof user.yearsOfExperience === 'string'
        ? parseInt(user.yearsOfExperience) || 0
        : user.yearsOfExperience || 0;

    // Infer from history if needed
    let inferredYears = userYears;
    if (user.professionalHistory && user.professionalHistory.length > 0 && userYears === 0) {
        const firstJob = user.professionalHistory[user.professionalHistory.length - 1];
        if (firstJob.startDate) {
            const startYear = parseInt(firstJob.startDate.split('-')[0]);
            inferredYears = new Date().getFullYear() - startYear;
        }
    }

    let userLevel: string;
    if (inferredYears <= 1) userLevel = 'internship';
    else if (inferredYears <= 2) userLevel = 'entry';
    else if (inferredYears <= 5) userLevel = 'mid';
    else if (inferredYears <= 10) userLevel = 'senior';
    else userLevel = 'lead';

    const jobLevel = jobLevels[0];

    if (jobLevel === userLevel) {
        reasons.push(`Level: ${userLevel}`);
        return { score: 10, reasons };
    }

    const levels = ['internship', 'entry', 'mid', 'senior', 'lead'];
    const diff = Math.abs(levels.indexOf(userLevel) - levels.indexOf(jobLevel));

    if (diff === 1) {
        reasons.push(`Close level: ${userLevel} vs ${jobLevel}`);
        return { score: 7, reasons };
    }

    return { score: 3, reasons: [`Level gap: ${jobLevel}`] };
}

/**
 * Industry Match (max +10)
 */
function calculateIndustryScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const jobIndustries = (job.industries || []).map(normalizeString);

    if (jobIndustries.length === 0) return { score: 5, reasons: ['No industry specified'] };

    const userIndustries = [
        ...(user.targetSectors || []),
        ...(user.professionalHistory?.map(h => h.industry).filter(Boolean) || [])
    ].map(i => normalizeString(i!));

    if (userIndustries.length === 0) return { score: 5, reasons: [] };

    for (const userInd of userIndustries) {
        for (const jobInd of jobIndustries) {
            if (fuzzyMatch(userInd, jobInd)) {
                reasons.push(`Industry: ${jobInd}`);
                return { score: 10, reasons };
            }
        }
    }

    return { score: 3, reasons: [] };
}

/**
 * Title Match (max +10)
 */
function calculateTitleScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    const jobTitle = normalizeString(job.title);

    const userTitles = [
        user.targetPosition,
        ...(user.professionalHistory?.map(h => h.title) || [])
    ].filter(Boolean).map(t => normalizeString(t!));

    if (userTitles.length === 0) return { score: 5, reasons: [] };

    let bestMatch = 0;
    for (const userTitle of userTitles) {
        const sim = calculateStringSimilarity(userTitle, jobTitle);
        if (sim > bestMatch) bestMatch = sim;
    }

    if (bestMatch >= 0.7) {
        reasons.push('Title match');
        return { score: 10, reasons };
    }
    if (bestMatch >= 0.4) {
        return { score: 6, reasons: ['Partial title match'] };
    }

    return { score: 2, reasons: [] };
}

/**
 * Professional History Bonus (max +10)
 */
function calculateHistoryBonus(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let bonus = 0;

    if (!user.professionalHistory || user.professionalHistory.length === 0) {
        return { score: 0, reasons: [] };
    }

    const jobText = `${job.title} ${job.description || ''} ${job.company}`.toLowerCase();

    for (const exp of user.professionalHistory) {
        // Company match
        if (exp.company && fuzzyMatch(exp.company, job.company)) {
            bonus += 5;
            reasons.push(`Worked at ${exp.company}`);
        }

        // Responsibilities match
        if (exp.responsibilities) {
            for (const resp of exp.responsibilities) {
                const keywords = extractKeywords(resp);
                const matching = keywords.filter(kw => jobText.includes(kw));
                if (matching.length >= 3) {
                    bonus += 5;
                    reasons.push('Responsibilities match');
                    break;
                }
            }
        }
    }

    return { score: Math.min(bonus, 10), reasons };
}

/**
 * Environment Bonus (max +5)
 */
function calculateEnvironmentBonus(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    if (!user.preferredEnvironment || user.preferredEnvironment.length === 0) {
        return { score: 2, reasons: [] };
    }

    const jobText = `${job.company} ${job.description || ''}`.toLowerCase();

    const isStartup = /startup|early stage|seed|series a/i.test(jobText);
    const isScaleup = /scale-up|scaleup|series b|series c|growth/i.test(jobText);
    const isBigCorp = /enterprise|fortune 500|multinational/i.test(jobText);

    for (const pref of user.preferredEnvironment) {
        const prefLower = pref.toLowerCase();
        if ((prefLower.includes('startup') && isStartup) ||
            (prefLower.includes('scale') && isScaleup) ||
            (prefLower.includes('big') && isBigCorp) ||
            (prefLower.includes('corp') && isBigCorp)) {
            return { score: 5, reasons: [`${pref} environment`] };
        }
    }

    return { score: 2, reasons: [] };
}

/**
 * Salary Match Score (max +10) - V5.0 NEW
 * Compares user salary expectations with job salary range
 */
function calculateSalaryScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    // If user hasn't set expectations, neutral
    if (!user.salaryExpectations || (!user.salaryExpectations.min && !user.salaryExpectations.max)) {
        return { score: 3, reasons: [] };
    }
    
    // If job has no salary info, slight penalty (transparency matters)
    if (!job.salaryRange) {
        return { score: 0, reasons: ['No salary info'] };
    }
    
    // Parse job salary range (e.g., "$120k - $150k", "€80,000 - €100,000", "100000-150000")
    const salaryText = job.salaryRange.toLowerCase().replace(/[,$€£k]/g, (match) => {
        if (match === 'k') return '000';
        return '';
    });
    
    const salaryNumbers = salaryText.match(/\d+/g);
    if (!salaryNumbers || salaryNumbers.length === 0) {
        return { score: 2, reasons: [] };
    }
    
    const jobMinSalary = parseInt(salaryNumbers[0]);
    const jobMaxSalary = salaryNumbers.length > 1 ? parseInt(salaryNumbers[1]) : jobMinSalary;
    
    // Parse user expectations
    const userMin = parseInt(user.salaryExpectations.min?.replace(/\D/g, '') || '0');
    const userMax = parseInt(user.salaryExpectations.max?.replace(/\D/g, '') || '999999999');
    
    // Check overlap
    if (jobMaxSalary >= userMin && jobMinSalary <= userMax) {
        // Good overlap
        if (jobMinSalary >= userMin) {
            reasons.push(`Salary: ${job.salaryRange}`);
            return { score: 10, reasons };
        } else {
            reasons.push('Salary in range');
            return { score: 7, reasons };
        }
    }
    
    // Job pays less than user minimum
    if (jobMaxSalary < userMin) {
        return { score: 0, reasons: ['Below salary expectations'] };
    }
    
    return { score: 3, reasons: [] };
}

/**
 * Recency Bonus for Urgent Searchers (max +5) - V5.0 NEW
 * Boosts recently posted jobs for users actively searching
 */
function calculateRecencyBonus(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check if user is urgently searching
    const isUrgent = user.searchUrgency === 'actively_searching' || user.searchIntensity === 'high';
    
    if (!isUrgent) {
        return { score: 0, reasons: [] };
    }
    
    // Check job posting date
    if (!job.postedAt) {
        return { score: 0, reasons: [] };
    }
    
    const postedDate = job.postedAt.toDate ? job.postedAt.toDate() : new Date(job.postedAt);
    const daysSincePosted = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePosted <= 1) {
        reasons.push('Posted today');
        return { score: 5, reasons };
    }
    if (daysSincePosted <= 3) {
        reasons.push('Posted recently');
        return { score: 3, reasons };
    }
    if (daysSincePosted <= 7) {
        return { score: 1, reasons: [] };
    }
    
    return { score: 0, reasons: [] };
}

/**
 * Career Priorities Match (max +8) - V5.0 NEW
 * Matches user's stated career priorities with job signals
 */
function calculateCareerPrioritiesScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    if (!user.careerPriorities || user.careerPriorities.length === 0) {
        return { score: 2, reasons: [] };
    }
    
    const jobText = `${job.title} ${job.description || ''} ${job.company}`.toLowerCase();
    
    const priorityKeywords: Record<string, string[]> = {
        'work-life balance': ['flexible', 'remote', 'work-life', 'unlimited pto', 'flexible hours', 'hybrid'],
        'career growth': ['growth', 'career path', 'development', 'learning', 'promotion', 'leadership'],
        'compensation': ['competitive salary', 'equity', 'stock', 'bonus', 'compensation'],
        'impact': ['impact', 'mission', 'meaningful', 'change the world', 'make a difference'],
        'innovation': ['innovative', 'cutting-edge', 'startup', 'disrupt', 'technology'],
        'stability': ['established', 'fortune 500', 'stable', 'enterprise', 'global company'],
        'team culture': ['culture', 'team', 'collaborative', 'inclusive', 'diversity'],
        'learning': ['learning', 'training', 'development', 'mentorship', 'grow'],
        'autonomy': ['autonomous', 'ownership', 'independent', 'self-directed'],
        'remote work': ['remote', 'work from home', 'distributed', 'anywhere'],
    };
    
    for (const priority of user.careerPriorities) {
        const priorityLower = priority.toLowerCase();
        
        // Find matching keywords for this priority
        for (const [key, keywords] of Object.entries(priorityKeywords)) {
            if (priorityLower.includes(key) || key.includes(priorityLower)) {
                const matched = keywords.some(kw => jobText.includes(kw));
                if (matched) {
                    score += 2;
                    if (!reasons.includes(`Matches: ${priority}`)) {
                        reasons.push(`Matches: ${priority}`);
                    }
                    break;
                }
            }
        }
    }
    
    // Also check primary motivator
    if (user.primaryMotivator) {
        const motivator = user.primaryMotivator.toLowerCase();
        for (const [key, keywords] of Object.entries(priorityKeywords)) {
            if (motivator.includes(key) || key.includes(motivator)) {
                const matched = keywords.some(kw => jobText.includes(kw));
                if (matched) {
                    score += 3;
                    reasons.push(`Aligns with: ${user.primaryMotivator}`);
                    break;
                }
            }
        }
    }
    
    return { score: Math.min(score, 8), reasons: reasons.slice(0, 2) };
}

/**
 * Feedback Boost/Penalty (V5.0 - Feedback Loop)
 * - Boost jobs similar to saved jobs
 * - Already applied jobs get a small boost (proven interest)
 */
function calculateFeedbackScore(
    user: UserProfileData, 
    job: EnrichedJob, 
    savedJobsData: EnrichedJob[]
): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // If user has applied to this company before, small boost
    if (user.appliedJobs?.some(appliedId => {
        // Check if appliedId contains similar company (we don't have full data, so just check ID prefix patterns)
        return false; // TODO: Implement proper applied company matching
    })) {
        score += 2;
        reasons.push('Applied to similar jobs');
    }

    // If no saved jobs, neutral
    if (!savedJobsData || savedJobsData.length === 0) {
        return { score: 0, reasons: [] };
    }

    // Check similarity to saved jobs
    let similarityBonus = 0;
    const jobTitle = normalizeString(job.title);
    const jobTechs = (job.technologies || []).map(normalizeString);
    const jobIndustries = (job.industries || []).map(normalizeString);

    for (const savedJob of savedJobsData.slice(0, 10)) { // Check against last 10 saved
        let matchPoints = 0;

        // Title similarity
        const savedTitle = normalizeString(savedJob.title || '');
        if (calculateStringSimilarity(jobTitle, savedTitle) > 0.6) {
            matchPoints += 3;
        }

        // Same company
        if (fuzzyMatch(job.company, savedJob.company || '')) {
            matchPoints += 3;
            if (!reasons.includes('From companies you like')) {
                reasons.push('From companies you like');
            }
        }

        // Overlapping technologies
        const savedTechs = (savedJob.technologies || []).map(normalizeString);
        const techOverlap = jobTechs.filter(t => savedTechs.some(st => fuzzyMatch(t, st))).length;
        if (techOverlap >= 2) {
            matchPoints += 2;
        }

        // Same industry
        const savedIndustries = (savedJob.industries || []).map(normalizeString);
        const industryMatch = jobIndustries.some(ind => 
            savedIndustries.some(sInd => fuzzyMatch(ind, sInd))
        );
        if (industryMatch) {
            matchPoints += 2;
        }

        similarityBonus = Math.max(similarityBonus, matchPoints);
    }

    if (similarityBonus >= 5) {
        score += 8;
        if (reasons.length === 0) reasons.push('Similar to jobs you saved');
    } else if (similarityBonus >= 3) {
        score += 5;
        if (reasons.length === 0) reasons.push('Related to your interests');
    } else if (similarityBonus >= 2) {
        score += 2;
    }

    return { score: Math.min(score, 10), reasons: reasons.slice(0, 1) };
}

/**
 * Collaborative Score (V5.0 - Based on similar users' behavior)
 * Boosts jobs that users with similar profiles have saved/applied to
 * Max score: 8 points
 */
function calculateCollaborativeScore(
    job: EnrichedJob,
    collaborativeData: { popularJobIds: Set<string>; popularCompanies: Set<string> }
): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // If no collaborative data, return neutral
    if (!collaborativeData.popularJobIds.size && !collaborativeData.popularCompanies.size) {
        return { score: 0, reasons: [] };
    }

    // Check if this exact job is popular among similar users
    if (collaborativeData.popularJobIds.has(job.id)) {
        score += 5;
        reasons.push('Popular with similar professionals');
    }

    // Check if this company is popular among similar users
    const companyLower = (job.company || '').toLowerCase();
    if (collaborativeData.popularCompanies.has(companyLower)) {
        score += 3;
        if (reasons.length === 0) {
            reasons.push('Company popular with your peers');
        }
    }

    return { score: Math.min(score, 8), reasons: reasons.slice(0, 1) };
}

/**
 * Semantic Similarity Score (V5.0 - Embedding-based matching)
 * Uses cosine similarity between user and job embeddings
 * Max score: 40 points (significant weight in hybrid scoring)
 */
function calculateSemanticScore(
    userEmbedding: number[] | undefined,
    jobEmbedding: number[] | undefined
): { score: number; reasons: string[] } {
    // If either embedding is missing, return neutral score
    if (!userEmbedding || !jobEmbedding || 
        userEmbedding.length === 0 || jobEmbedding.length === 0) {
        return { score: 0, reasons: [] };
    }

    // Calculate cosine similarity (-1 to 1, but typically 0 to 1 for embeddings)
    const similarity = cosineSimilarity(userEmbedding, jobEmbedding);
    
    // Convert similarity to score (0-40 range)
    // Typical similarity scores for related content: 0.5-0.9
    // We use a threshold-based scoring:
    const reasons: string[] = [];
    let score = 0;

    if (similarity >= 0.85) {
        score = 40;
        reasons.push('Excellent profile match');
    } else if (similarity >= 0.75) {
        score = 35;
        reasons.push('Strong profile match');
    } else if (similarity >= 0.65) {
        score = 28;
        reasons.push('Good profile alignment');
    } else if (similarity >= 0.55) {
        score = 20;
        reasons.push('Moderate profile match');
    } else if (similarity >= 0.45) {
        score = 12;
    } else if (similarity >= 0.35) {
        score = 5;
    }
    // Below 0.35 similarity = 0 points (not a good match)

    return { score, reasons };
}

/**
 * Profile Tags Score (V5.1 - AI-generated profile summary tags)
 * Matches user's profile tags against job characteristics
 * Max score: 25 points
 * 
 * Tag categories:
 * - Seniority (junior, mid-level, senior, lead, principal): +6 max
 * - Technologies (react, python, aws, etc.): +6 max
 * - Industries (tech, finance, consulting, etc.): +4 max
 * - Role Type (engineer, product-manager, etc.): +4 max
 * - Domain (frontend, backend, full-stack, etc.): +3 max
 * - Work Style (remote, startup, leadership, etc.): +2 max
 */
function calculateProfileTagsScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    // If no profile tags, return neutral score
    if (!user.profileTags || user.profileTags.length === 0) {
        return { score: 0, reasons: [] };
    }

    const tags = user.profileTags.map(t => t.toLowerCase().trim());
    
    // Define tag categories with patterns
    const seniorityTags = ['junior', 'entry-level', 'mid-level', 'senior', 'lead', 'staff', 'principal', 'executive', 'director'];
    const domainTags = ['frontend', 'backend', 'full-stack', 'fullstack', 'mobile', 'devops', 'cloud', 'data', 'machine-learning', 'ml', 'ai', 'security'];
    const roleTypeTags = ['engineer', 'developer', 'product-manager', 'data-scientist', 'designer', 'architect', 'consultant', 'manager', 'analyst', 'devops-engineer'];
    const workStyleTags = ['remote', 'startup', 'enterprise', 'leadership', 'international', 'freelance'];
    
    // Categorize user's tags
    const userSeniority = tags.filter(t => seniorityTags.some(st => t.includes(st)));
    const userTechTags = tags.filter(t => 
        !seniorityTags.some(st => t.includes(st)) && 
        !domainTags.some(dt => t === dt) && 
        !roleTypeTags.some(rt => t === rt) &&
        !workStyleTags.some(wt => t === wt) &&
        !t.includes('-native') && !t.includes('-fluent') && !t.includes('-degree') && !t.includes('-phd')
    );
    const userIndustryTags = tags.filter(t => 
        ['tech', 'finance', 'consulting', 'healthcare', 'e-commerce', 'ecommerce', 'fintech', 'saas', 'retail', 'media', 'education', 'manufacturing', 'energy', 'real-estate', 'banking'].some(ind => t.includes(ind))
    );
    const userRoleTags = tags.filter(t => roleTypeTags.some(rt => t.includes(rt)));
    const userDomainTags = tags.filter(t => domainTags.some(dt => t.includes(dt)));
    const userWorkStyleTags = tags.filter(t => workStyleTags.some(wt => t.includes(wt)));
    const userLanguageTags = tags.filter(t => t.includes('-native') || t.includes('-fluent'));

    // Job data for matching
    const jobTechs = (job.technologies || []).map(t => t.toLowerCase());
    const jobIndustries = (job.industries || []).map(i => i.toLowerCase());
    const jobLevels = (job.experienceLevels || []).map(l => l.toLowerCase());
    const jobSeniority = (job.seniority || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    const jobDesc = (job.description || '').toLowerCase();
    const jobWorkLocs = (job.workLocations || []).map(w => w.toLowerCase());
    const jobRoleFunction = (job.roleFunction || '').toLowerCase();

    // 1. SENIORITY MATCHING (max +6)
    if (userSeniority.length > 0) {
        let seniorityMatch = false;
        
        for (const tag of userSeniority) {
            // Match against job seniority field
            if (jobSeniority && (jobSeniority.includes(tag) || tag.includes(jobSeniority))) {
                seniorityMatch = true;
                break;
            }
            // Match against experience levels
            if (jobLevels.some(l => l.includes(tag) || tag.includes(l))) {
                seniorityMatch = true;
                break;
            }
            // Match against job title
            if (jobTitle.includes(tag.replace('-', ' '))) {
                seniorityMatch = true;
                break;
            }
        }
        
        if (seniorityMatch) {
            score += 6;
            const level = userSeniority[0].replace('-', ' ');
            reasons.push(`Matches your ${level} level`);
        }
    }

    // 2. TECHNOLOGY MATCHING (max +6)
    if (userTechTags.length > 0 && jobTechs.length > 0) {
        const matchedTechs: string[] = [];
        
        for (const tag of userTechTags) {
            const normalizedTag = tag.replace(/-/g, '').replace(/js$/, '');
            for (const jobTech of jobTechs) {
                const normalizedJobTech = jobTech.replace(/-/g, '').replace(/\.js$/, '').replace(/js$/, '');
                if (normalizedJobTech.includes(normalizedTag) || normalizedTag.includes(normalizedJobTech) ||
                    jobTech.includes(tag) || tag.includes(jobTech)) {
                    matchedTechs.push(jobTech);
                    break;
                }
            }
        }
        
        const techMatchRatio = matchedTechs.length / Math.min(userTechTags.length, 5);
        const techScore = Math.round(techMatchRatio * 6);
        
        if (techScore > 0) {
            score += techScore;
            if (matchedTechs.length > 0) {
                const displayTechs = [...new Set(matchedTechs)].slice(0, 3);
                reasons.push(`Tech stack: ${displayTechs.join(', ')}`);
            }
        }
    }

    // 3. INDUSTRY MATCHING (max +4)
    if (userIndustryTags.length > 0 && jobIndustries.length > 0) {
        let industryMatch = false;
        let matchedIndustry = '';
        
        for (const tag of userIndustryTags) {
            for (const jobInd of jobIndustries) {
                if (jobInd.includes(tag) || tag.includes(jobInd)) {
                    industryMatch = true;
                    matchedIndustry = jobInd;
                    break;
                }
            }
            if (industryMatch) break;
        }
        
        if (industryMatch) {
            score += 4;
            reasons.push(`Industry fit: ${matchedIndustry}`);
        }
    }

    // 4. ROLE TYPE MATCHING (max +4)
    if (userRoleTags.length > 0) {
        let roleMatch = false;
        
        for (const tag of userRoleTags) {
            const normalizedTag = tag.replace(/-/g, ' ').replace('_', ' ');
            // Match against roleFunction
            if (jobRoleFunction && (jobRoleFunction.includes(normalizedTag) || normalizedTag.includes(jobRoleFunction))) {
                roleMatch = true;
                break;
            }
            // Match against job title
            if (jobTitle.includes(normalizedTag) || jobTitle.includes(tag)) {
                roleMatch = true;
                break;
            }
        }
        
        if (roleMatch) {
            score += 4;
            if (reasons.length < 3) {
                reasons.push('Role type alignment');
            }
        }
    }

    // 5. DOMAIN MATCHING (max +3)
    if (userDomainTags.length > 0) {
        let domainMatch = false;
        let matchedDomain = '';
        
        for (const tag of userDomainTags) {
            // Match against job title
            if (jobTitle.includes(tag.replace('-', ' ')) || jobTitle.includes(tag)) {
                domainMatch = true;
                matchedDomain = tag;
                break;
            }
            // Match against technologies (frontend -> react/vue, backend -> node/python, etc.)
            const domainTechMap: Record<string, string[]> = {
                'frontend': ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'typescript', 'nextjs', 'next.js'],
                'backend': ['node', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'django', 'fastapi', 'spring'],
                'full-stack': ['react', 'node', 'python', 'javascript', 'typescript'],
                'fullstack': ['react', 'node', 'python', 'javascript', 'typescript'],
                'devops': ['docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'ci/cd', 'aws', 'azure', 'gcp'],
                'cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda'],
                'mobile': ['ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'],
                'data': ['sql', 'python', 'spark', 'hadoop', 'snowflake', 'databricks', 'etl'],
                'machine-learning': ['python', 'tensorflow', 'pytorch', 'ml', 'ai', 'deep learning'],
            };
            
            const relatedTechs = domainTechMap[tag] || [];
            if (relatedTechs.length > 0 && jobTechs.some(jt => relatedTechs.some(rt => jt.includes(rt)))) {
                domainMatch = true;
                matchedDomain = tag;
                break;
            }
            // Match in description
            if (jobDesc.includes(tag.replace('-', ' '))) {
                domainMatch = true;
                matchedDomain = tag;
                break;
            }
        }
        
        if (domainMatch) {
            score += 3;
            if (reasons.length < 3) {
                reasons.push(`${matchedDomain.replace('-', ' ')} focus`);
            }
        }
    }

    // 6. WORK STYLE MATCHING (max +2)
    if (userWorkStyleTags.length > 0) {
        let workStyleMatch = false;
        
        for (const tag of userWorkStyleTags) {
            // Remote preference
            if (tag === 'remote' && (jobWorkLocs.includes('remote') || jobDesc.includes('remote'))) {
                workStyleMatch = true;
                break;
            }
            // Startup preference
            if (tag === 'startup' && (jobDesc.includes('startup') || jobDesc.includes('early-stage') || jobDesc.includes('fast-paced'))) {
                workStyleMatch = true;
                break;
            }
            // Enterprise preference
            if (tag === 'enterprise' && (jobDesc.includes('enterprise') || jobDesc.includes('fortune 500') || jobDesc.includes('large scale'))) {
                workStyleMatch = true;
                break;
            }
            // Leadership
            if (tag === 'leadership' && (jobTitle.includes('lead') || jobTitle.includes('manager') || jobTitle.includes('head') || jobTitle.includes('director'))) {
                workStyleMatch = true;
                break;
            }
        }
        
        if (workStyleMatch) {
            score += 2;
        }
    }

    return { score: Math.min(score, 25), reasons: reasons.slice(0, 2) };
}

/**
 * Data Quality Penalty (-15 if enrichment quality < 50%)
 */
function calculateDataQualityPenalty(job: EnrichedJob): { penalty: number; reasons: string[] } {
    const quality = job.enrichmentQuality ?? 50; // Default to 50 if not set

    if (quality < 30) {
        return { penalty: 15, reasons: ['Very low job data quality'] };
    }
    if (quality < 50) {
        return { penalty: 8, reasons: ['Low job data quality'] };
    }

    return { penalty: 0, reasons: [] };
}

/**
 * V6.0 Domain Mismatch Penalty (up to -35)
 * CRITICAL: Prevents accounting jobs from matching with tech consultants
 * 
 * Detects when job is in a completely different professional domain than the user
 * e.g., Salesforce consultant should NOT match with Accounting Consolidation jobs
 */
function calculateDomainMismatchPenalty(user: UserProfileData, job: EnrichedJob, matchingProfile?: UserMatchingProfile): { penalty: number; reasons: string[] } {
    const reasons: string[] = [];
    let penalty = 0;
    
    // Get user's technical domain
    const userDomain = matchingProfile?.primaryDomain || 'other';
    const userTools = (user.tools || []).map(t => t.toLowerCase());
    const userSkills = (user.skills || []).map(s => s.toLowerCase());
    const allUserTech = [...userTools, ...userSkills];
    
    // Job text for analysis
    const jobTitle = (job.title || '').toLowerCase();
    const jobDesc = (job.description || '').toLowerCase();
    const jobText = `${jobTitle} ${jobDesc}`;
    const jobTechs = (job.technologies || []).map(t => t.toLowerCase());
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    
    // Define incompatible domain pairs
    // Tech domains (Salesforce, Web Dev, Data Engineering, etc.)
    const techDomainKeywords = ['salesforce', 'apex', 'lightning', 'crm', 'developer', 'engineer', 'software', 'programming', 'coding', 'react', 'javascript', 'python', 'java', 'aws', 'cloud', 'devops', 'data engineer', 'machine learning', 'ai', 'frontend', 'backend', 'fullstack', 'mobile', 'ios', 'android'];
    
    // Finance/Accounting domains
    const financeDomainKeywords = ['accounting', 'accountant', 'consolidation', 'financial reporting', 'ifrs', 'gaap', 'audit', 'auditor', 'controller', 'bookkeeping', 'tax', 'treasury', 'ledger', 'accounts payable', 'accounts receivable', 'cpa', 'chartered accountant', 'finance controller'];
    
    // HR domains
    const hrDomainKeywords = ['hr manager', 'human resources', 'talent acquisition', 'recruiter', 'recruiting', 'compensation', 'benefits', 'payroll specialist', 'employee relations', 'hr business partner', 'hrbp'];
    
    // Legal domains
    const legalDomainKeywords = ['attorney', 'lawyer', 'legal counsel', 'paralegal', 'litigation', 'contract law', 'corporate law', 'compliance officer', 'regulatory'];
    
    // Medical/Healthcare domains  
    const medicalDomainKeywords = ['doctor', 'nurse', 'physician', 'medical', 'healthcare', 'clinical', 'patient care', 'pharmacy', 'therapist', 'surgeon'];
    
    // Check if user is in tech domain
    const userIsTech = techDomainKeywords.some(kw => 
        allUserTech.some(t => t.includes(kw) || kw.includes(t))
    ) || ['frontend', 'backend', 'fullstack', 'data', 'devops', 'mobile'].includes(userDomain);
    
    // Check if user is Salesforce specific
    const userIsSalesforce = allUserTech.some(t => 
        t.includes('salesforce') || t.includes('apex') || t.includes('lightning') || 
        t.includes('visualforce') || t.includes('soql') || t.includes('sfdc')
    );
    
    // Check job domain
    const jobIsFinance = financeDomainKeywords.some(kw => jobTitle.includes(kw) || jobText.includes(kw));
    const jobIsHR = hrDomainKeywords.some(kw => jobTitle.includes(kw));
    const jobIsLegal = legalDomainKeywords.some(kw => jobTitle.includes(kw));
    const jobIsMedical = medicalDomainKeywords.some(kw => jobTitle.includes(kw));
    const jobIsTech = techDomainKeywords.some(kw => 
        jobTitle.includes(kw) || jobTechs.some(t => t.includes(kw))
    );
    
    // Apply penalties for domain mismatches
    if (userIsTech || userIsSalesforce) {
        // Tech user seeing non-tech job
        if (jobIsFinance && !jobText.includes('salesforce') && !jobText.includes('software')) {
            penalty = 35;
            reasons.push('Accounting/Finance domain - not your field');
        } else if (jobIsHR && !jobTitle.includes('tech') && !jobTitle.includes('it')) {
            penalty = 30;
            reasons.push('HR domain - not your field');
        } else if (jobIsLegal) {
            penalty = 35;
            reasons.push('Legal domain - not your field');
        } else if (jobIsMedical) {
            penalty = 35;
            reasons.push('Medical domain - not your field');
        }
    }
    
    // Salesforce consultant seeing non-Salesforce consulting
    if (userIsSalesforce && job.roleFunction === 'consulting') {
        const jobMentionsSalesforce = jobText.includes('salesforce') || jobText.includes('crm') || 
                                       jobTechs.some(t => t.includes('salesforce'));
        const jobMentionsFinance = jobIsFinance || jobText.includes('consolidation') || 
                                   jobText.includes('accounting') || jobText.includes('financial');
        
        if (!jobMentionsSalesforce && jobMentionsFinance) {
            // This is finance/accounting consulting, not Salesforce consulting
            penalty = Math.max(penalty, 30);
            if (!reasons.includes('Accounting/Finance domain - not your field')) {
                reasons.push('Finance consulting - you do Salesforce consulting');
            }
        }
    }
    
    // Check for completely mismatched tech stacks
    if (userIsTech && jobTechs.length > 0) {
        // Job requires specific tech that user doesn't have
        const majorMismatchTech = ['sap', 'oracle erp', 'netsuite', 'workday', 'peoplesoft'];
        const jobRequiresMismatch = majorMismatchTech.some(tech => 
            jobTechs.some(jt => jt.includes(tech)) || jobTitle.includes(tech)
        );
        const userHasMismatch = majorMismatchTech.some(tech => 
            allUserTech.some(ut => ut.includes(tech))
        );
        
        if (jobRequiresMismatch && !userHasMismatch) {
            penalty = Math.max(penalty, 20);
            const mismatchTech = majorMismatchTech.find(tech => 
                jobTechs.some(jt => jt.includes(tech)) || jobTitle.includes(tech)
            );
            if (mismatchTech && !reasons.some(r => r.includes('not your field'))) {
                reasons.push(`Requires ${mismatchTech.toUpperCase()} - different tech stack`);
            }
        }
    }
    
    return { penalty, reasons };
}

/**
 * Deal Breaker Penalty (up to -30)
 */
function calculateDealBreakerPenalty(user: UserProfileData, job: EnrichedJob): { penalty: number; reasons: string[] } {
    const reasons: string[] = [];
    let penalty = 0;

    if (!user.dealBreakers || user.dealBreakers.length === 0) {
        return { penalty: 0, reasons: [] };
    }

    const jobText = `${job.title} ${job.description || ''} ${job.company} ${job.location}`.toLowerCase();

    for (const breaker of user.dealBreakers) {
        const breakerLower = breaker.toLowerCase();

        if (breakerLower.includes('travel') && /travel required|frequent travel/i.test(jobText)) {
            penalty += 15;
            reasons.push('Travel required');
        }
        if (breakerLower.includes('onsite') && !job.workLocations?.includes('remote') && !job.workLocations?.includes('hybrid')) {
            penalty += 10;
            reasons.push('Onsite only');
        }
        if (breakerLower.includes('startup') && /startup/i.test(jobText)) {
            penalty += 15;
            reasons.push('Startup environment');
        }
        if (breakerLower.includes('management') && /manage team|people management/i.test(jobText)) {
            penalty += 10;
            reasons.push('Management required');
        }

        if (jobText.includes(breakerLower)) {
            penalty += 10;
            reasons.push(`Contains: ${breaker}`);
        }
    }

    return { penalty: Math.min(penalty, 30), reasons };
}

/**
 * Sector Avoid Penalty (up to -20)
 */
function calculateSectorAvoidPenalty(user: UserProfileData, job: EnrichedJob): { penalty: number; reasons: string[] } {
    if (!user.sectorsToAvoid || user.sectorsToAvoid.length === 0) {
        return { penalty: 0, reasons: [] };
    }

    const jobIndustries = (job.industries || []).map(normalizeString);
    const jobText = `${job.company} ${job.description || ''}`.toLowerCase();

    for (const avoid of user.sectorsToAvoid) {
        const avoidLower = normalizeString(avoid);

        if (jobIndustries.some(ind => fuzzyMatch(ind, avoidLower))) {
            return { penalty: 20, reasons: [`${avoid} industry`] };
        }

        if (jobText.includes(avoidLower)) {
            return { penalty: 15, reasons: [`Related to ${avoid}`] };
        }
    }

    return { penalty: 0, reasons: [] };
}

// =============================================================================
// MAIN MATCHING FUNCTION V5.0
// =============================================================================

function calculateMatchScore(
    user: UserProfileData, 
    job: EnrichedJob,
    savedJobsData: EnrichedJob[] = [],
    collaborativeData: CollaborativeData = { popularJobIds: new Set(), popularCompanies: new Set() },
    matchingProfile?: UserMatchingProfile
): { matched: MatchedJob | null; excluded: boolean; excludeReason?: string } {
    // HARD FILTER: Language requirements
    const langCheck = shouldExcludeByLanguage(user, job);
    if (langCheck.exclude) {
        return { matched: null, excluded: true, excludeReason: langCheck.reason };
    }

    // Calculate all rule-based scores
    const roleFunction = calculateRoleFunctionScore(user, job);
    
    // V6.0: Weighted skills with certification boost
    const skills = calculateWeightedSkillsScore(user, job, matchingProfile);
    
    const location = calculateLocationScore(user, job);
    
    // V6.0: Precise seniority using matchingProfile
    const experience = calculatePreciseSeniorityScore(user, job, matchingProfile);
    
    const industry = calculateIndustryScore(user, job);
    const title = calculateTitleScore(user, job);
    const history = calculateHistoryBonus(user, job);
    const environment = calculateEnvironmentBonus(user, job);
    
    // V6.0 New scores
    const companyNetwork = calculateCompanyNetworkScore(user, job);
    const cultureFit = calculateCultureFitScore(user, job);
    const educationMatch = calculateEducationMatchScore(user, job);
    
    // V5.0 scores
    const salary = calculateSalaryScore(user, job);
    const recency = calculateRecencyBonus(user, job);
    const careerPriorities = calculateCareerPrioritiesScore(user, job);
    const feedback = calculateFeedbackScore(user, job, savedJobsData);
    
    // V5.0 Semantic Score (embedding-based)
    const semantic = calculateSemanticScore(user.embedding, job.embedding);
    
    // V5.0 Collaborative Score (based on similar users)
    const collaborative = calculateCollaborativeScore(job, collaborativeData);
    
    // V5.1 Profile Tags Score (AI-generated CV summary tags)
    const profileTags = calculateProfileTagsScore(user, job);

    // Penalties
    const dataQuality = calculateDataQualityPenalty(job);
    const dealBreaker = calculateDealBreakerPenalty(user, job);
    const sectorAvoid = calculateSectorAvoidPenalty(user, job);
    
    // V6.0: Domain mismatch penalty (e.g., Salesforce consultant seeing accounting jobs)
    const domainMismatch = calculateDomainMismatchPenalty(user, job, matchingProfile);

    // =============================================================================
    // V6.0 HYBRID SCORING: 60% Rule-based + 40% Semantic
    // =============================================================================
    
    // Calculate rule-based score (max 209 points - V6.0 with new scores)
    // Role: 25, Skills: 35, Location: 15, Experience: 15, Industry: 10, Title: 10
    // CompanyNetwork: 10, CultureFit: 8, Education: 5, History: 10, Environment: 5
    // Collaborative: 8, ProfileTags: 25, Salary: 10, Recency: 5, CareerPriorities: 8, Feedback: 10
    // CertBoost: up to 15 (included in skills calc)
    const ruleBasedPositive = 
        roleFunction.score + 
        skills.score + skills.certBoost + // V6.0: Include certification boost
        location.score + 
        experience.score + // V6.0: Precise seniority (max 15)
        industry.score + 
        title.score + 
        companyNetwork.score + // V6.0 NEW
        cultureFit.score + // V6.0 NEW
        educationMatch.score + // V6.0 NEW
        history.score + 
        environment.score +
        salary.score + 
        recency.score + 
        careerPriorities.score +
        feedback.score + 
        collaborative.score + 
        profileTags.score;
    
    // Scale rule-based to 100 (max 209 points with V6.0 additions)
    const MAX_RULE_BASED_SCORE = 209;
    const ruleBasedScore = Math.round((Math.max(ruleBasedPositive, 0) / MAX_RULE_BASED_SCORE) * 100);
    
    // Semantic score is already 0-40, scale to 0-100
    const semanticScore100 = Math.round((semantic.score / 40) * 100);
    
    // Hybrid score: 60% rule-based + 40% semantic
    // If no embeddings available, use 100% rule-based
    let hybridScore: number;
    if (semantic.score > 0) {
        hybridScore = Math.round(
            (1 - SEMANTIC_WEIGHT) * ruleBasedScore + 
            SEMANTIC_WEIGHT * semanticScore100
        );
    } else {
        // No semantic data available - use rule-based only
        hybridScore = ruleBasedScore;
    }

    // Apply penalties (V6.0: includes domain mismatch)
    const totalPenalty = dataQuality.penalty + dealBreaker.penalty + sectorAvoid.penalty + domainMismatch.penalty;
    const finalScore = Math.max(0, Math.min(100, hybridScore - totalPenalty));

    // Collect reasons - V6.0: Prioritize new high-value signals
    const allReasons: string[] = [];
    
    // Company network first (strong signal)
    if (companyNetwork.score >= 8) allReasons.push(...companyNetwork.reasons);
    
    // Collaborative reasons (social proof)
    if (collaborative.score > 3) allReasons.push(...collaborative.reasons);
    
    // Semantic match reasons (if strong)
    if (semantic.score >= 28) allReasons.push(...semantic.reasons);
    
    // V5.1 Profile Tags reasons (personalized matching from CV analysis)
    if (profileTags.score > 5) allReasons.push(...profileTags.reasons);
    
    // Then feedback reasons (user interest signal)
    if (feedback.score > 3) allReasons.push(...feedback.reasons);
    
    // Core matching signals
    if (roleFunction.score > 0) allReasons.push(...roleFunction.reasons);
    if (skills.score > 0) allReasons.push(...skills.reasons);
    if (location.score > 0) allReasons.push(...location.reasons);
    if (experience.score > 0) allReasons.push(...experience.reasons);
    if (industry.score > 0) allReasons.push(...industry.reasons);
    if (title.score > 0) allReasons.push(...title.reasons);
    if (history.score > 0) allReasons.push(...history.reasons);
    if (environment.score > 0) allReasons.push(...environment.reasons);
    
    // V6.0 new reasons
    if (cultureFit.score > 3) allReasons.push(...cultureFit.reasons);
    if (educationMatch.score > 2) allReasons.push(...educationMatch.reasons);
    
    // V5.0 reasons
    if (salary.score > 5) allReasons.push(...salary.reasons);
    if (recency.score > 0) allReasons.push(...recency.reasons);
    if (careerPriorities.score > 2) allReasons.push(...careerPriorities.reasons);

    // Add negative reasons if significant
    const negativeReasons: string[] = [];
    if (roleFunction.score < 0) negativeReasons.push(...roleFunction.reasons);
    if (skills.score < 0) negativeReasons.push(...skills.reasons);
    if (salary.score === 0 && salary.reasons.length > 0) negativeReasons.push(...salary.reasons);
    if (dataQuality.penalty > 0) negativeReasons.push(...dataQuality.reasons);
    if (dealBreaker.penalty > 0) negativeReasons.push(...dealBreaker.reasons);
    if (sectorAvoid.penalty > 0) negativeReasons.push(...sectorAvoid.reasons);
    // V6.0: Domain mismatch is critical - show at top of warnings
    if (domainMismatch.penalty > 0) negativeReasons.unshift(...domainMismatch.reasons);

    const matchedJob: MatchedJob = {
        ...job,
        matchScore: finalScore,
        matchDetails: {
            roleFunctionScore: roleFunction.score,
            skillsScore: skills.score + skills.certBoost, // V6.0: Include cert boost in total
            locationScore: location.score,
            experienceScore: experience.score,
            industryScore: industry.score,
            titleScore: title.score,
            historyBonus: history.score,
            environmentBonus: environment.score,
            // V5.0 scores
            salaryScore: salary.score,
            recencyBonus: recency.score,
            careerPrioritiesScore: careerPriorities.score,
            feedbackScore: feedback.score,
            semanticScore: semantic.score,
            collaborativeScore: collaborative.score,
            // V5.1 Profile Tags
            profileTagsScore: profileTags.score,
            // V6.0 New scores
            companyNetworkScore: companyNetwork.score,
            cultureFitScore: cultureFit.score,
            educationMatchScore: educationMatch.score,
            certificationBoost: skills.certBoost,
            // V6.0 Skill gaps for UI
            skillGaps: skills.skillGaps,
            matchedCoreSkills: skills.matchedCoreSkills,
            // Penalties
            dataQualityPenalty: dataQuality.penalty,
            dealBreakerPenalty: dealBreaker.penalty,
            sectorAvoidPenalty: sectorAvoid.penalty,
            domainMismatchPenalty: domainMismatch.penalty, // V6.0
        },
        matchReasons: allReasons.slice(0, 5),
        excludeReasons: negativeReasons.length > 0 ? negativeReasons.slice(0, 3) : undefined,
    };

    return { matched: matchedJob, excluded: false };
}

// =============================================================================
// CLOUD FUNCTION V4.0
// =============================================================================

export const getMatchedJobs = onRequest({
    region: REGION,
    cors: true,
    maxInstances: 10,
    invoker: 'public',
}, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const db = admin.firestore();
        const userId = req.query.userId as string || req.body?.userId;

        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' });
            return;
        }

        // Fetch user profile
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const userData = userDoc.data() as UserProfileData;

        // Check minimum profile completeness
        const hasSkills = (userData.skills?.length || 0) > 0 || (userData.tools?.length || 0) > 0;
        const hasHistory = (userData.professionalHistory?.length || 0) > 0;
        const hasLocation = userData.city || userData.country || userData.workPreference || (userData.preferredCities?.length || 0) > 0;
        const hasObjectives = userData.targetPosition || (userData.targetSectors?.length || 0) > 0;

        if (!hasSkills && !hasHistory && !hasLocation && !hasObjectives) {
            res.status(200).json({
                success: true,
                message: 'Please complete your profile to see personalized job matches',
                jobs: [],
                profileIncomplete: true,
                missingFields: ['skills', 'professionalHistory', 'location', 'targetPosition']
            });
            return;
        }

        // Query recent jobs (last 30 days) - prefer V4.0 enriched jobs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const jobsQuery = db.collection('jobs')
            .where('postedAt', '>=', thirtyDaysAgo)
            .orderBy('postedAt', 'desc')
            .limit(1000); // Get more to filter

        const jobsSnapshot = await jobsQuery.get();

        if (jobsSnapshot.empty) {
            res.status(200).json({ success: true, jobs: [], message: 'No recent jobs found' });
            return;
        }

        // V5.0: Get user's dismissed jobs to filter out
        const dismissedJobIds = new Set(userData.dismissedJobs || []);
        
        // V5.0: Fetch saved jobs for feedback scoring
        let savedJobsData: EnrichedJob[] = [];
        if (userData.savedJobs && userData.savedJobs.length > 0) {
            const savedJobIds = userData.savedJobs.slice(0, 20); // Max 20 for performance
            const savedJobsPromises = savedJobIds.map(id => 
                db.collection('jobs').doc(id).get()
            );
            const savedJobsDocs = await Promise.all(savedJobsPromises);
            savedJobsData = savedJobsDocs
                .filter(doc => doc.exists)
                .map(doc => ({ id: doc.id, ...doc.data() } as EnrichedJob));
        }

        // V5.0: Fetch collaborative data - find popular jobs among similar users
        const collaborativeData: CollaborativeData = { 
            popularJobIds: new Set(), 
            popularCompanies: new Set() 
        };
        
        try {
            // Get user's inferred role function
            const userRoleFn = inferUserRoleFunction(userData);
            
            // Query recent interactions from users with same role function
            // This is a simplified collaborative approach
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const interactionsQuery = db.collection('userJobInteractions')
                .where('action', 'in', ['save', 'apply'])
                .where('timestamp', '>=', sevenDaysAgo)
                .limit(200);
            
            const interactionsSnap = await interactionsQuery.get();
            
            // Count job and company occurrences
            const jobCounts: Record<string, number> = {};
            const companyCounts: Record<string, number> = {};
            
            for (const intDoc of interactionsSnap.docs) {
                const interaction = intDoc.data();
                const jobId = interaction.jobId;
                
                jobCounts[jobId] = (jobCounts[jobId] || 0) + 1;
                
                // Get company name if score is in metadata
                if (interaction.metadata?.matchScore && interaction.metadata.matchScore >= 60) {
                    // This interaction came from a good match, boost it
                    jobCounts[jobId] += 1;
                }
            }
            
            // Get popular jobs (saved/applied by 3+ users)
            for (const [jobId, count] of Object.entries(jobCounts)) {
                if (count >= 3) {
                    collaborativeData.popularJobIds.add(jobId);
                    
                    // Also get the company for these popular jobs
                    const jobDoc = await db.collection('jobs').doc(jobId).get();
                    if (jobDoc.exists) {
                        const company = (jobDoc.data()?.company || '').toLowerCase();
                        if (company) {
                            companyCounts[company] = (companyCounts[company] || 0) + count;
                        }
                    }
                }
            }
            
            // Get popular companies
            for (const [company, count] of Object.entries(companyCounts)) {
                if (count >= 5) {
                    collaborativeData.popularCompanies.add(company);
                }
            }
            
            console.log(`📊 Collaborative: ${collaborativeData.popularJobIds.size} popular jobs, ${collaborativeData.popularCompanies.size} popular companies`);
            
        } catch (collabError) {
            console.log('Collaborative data fetch failed (non-critical):', collabError);
        }

        // V6.0: Build user matching profile for enhanced scoring
        const matchingProfile = buildUserMatchingProfile(userData);
        console.log(`🎯 V6.0 Matching Profile: ${matchingProfile.inferredSeniority} level, ${matchingProfile.totalYearsExperience}y exp, ${matchingProfile.coreSkills.length} core skills, ${matchingProfile.profileCompleteness}% complete`);

        // Calculate match scores with hard filters
        const matchedJobs: MatchedJob[] = [];
        let excludedByLanguage = 0;
        let excludedByScore = 0;
        let excludedByDismiss = 0;

        for (const doc of jobsSnapshot.docs) {
            const jobData = doc.data() as EnrichedJob;
            const job: EnrichedJob = { id: doc.id, ...jobData };

            // V5.0: Skip dismissed jobs
            if (dismissedJobIds.has(doc.id)) {
                excludedByDismiss++;
                continue;
            }

            // V6.0: Pass matchingProfile to scoring function
            const result = calculateMatchScore(userData, job, savedJobsData, collaborativeData, matchingProfile);

            if (result.excluded) {
                excludedByLanguage++;
                continue;
            }

            if (result.matched) {
                // Only include jobs with score >= 25 (filter out very poor matches)
                if (result.matched.matchScore >= 25) {
                    matchedJobs.push(result.matched);
                } else {
                    excludedByScore++;
                }
            }
        }

        // Sort by match score
        matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

        // Return top 100
        const topMatches = matchedJobs.slice(0, 100);

        // Format response
        const formattedJobs = topMatches.map(job => ({
            id: job.id,
            title: job.title || '',
            company: job.company || '',
            logoUrl: job.logoUrl || job.companyLogo || '',
            location: job.location || '',
            tags: job.technologies?.slice(0, 5) || job.skills?.slice(0, 5) || [],
            postedAt: job.postedAt,
            applyUrl: job.applyUrl || '',
            description: job.description || job.summary || '',
            seniority: job.seniority || job.experienceLevels?.[0] || '',
            type: job.employmentTypes?.[0] || 'full-time',
            salaryRange: job.salaryRange || '',
            remote: job.remote || job.workLocations?.[0] || '',
            industries: job.industries || [],
            technologies: job.technologies || [],
            roleFunction: job.roleFunction || 'other',
            languageRequirements: job.languageRequirements || [],
            enrichmentQuality: job.enrichmentQuality || 50,
            matchScore: job.matchScore,
            matchDetails: job.matchDetails,
            matchReasons: job.matchReasons,
            excludeReasons: job.excludeReasons,
        }));

        // Profile analysis - V6.0 Enhanced with matching profile data
        const userRoleFunction = inferUserRoleFunction(userData);
        const userLanguages = getUserLanguages(userData);

        const profileAnalysis = {
            inferredRoleFunction: userRoleFunction,
            languagesDetected: userLanguages,
            skillsCount: (userData.skills?.length || 0) + (userData.tools?.length || 0),
            historyCount: userData.professionalHistory?.length || 0,
            locationsCount: (userData.preferredCities?.length || 0) + (userData.preferredCountries?.length || 0) + (userData.city ? 1 : 0),
            dealBreakersCount: userData.dealBreakers?.length || 0,
            sectorsToAvoidCount: userData.sectorsToAvoid?.length || 0,
            // V5.0 Feedback stats
            savedJobsCount: userData.savedJobs?.length || 0,
            dismissedJobsCount: userData.dismissedJobs?.length || 0,
            appliedJobsCount: userData.appliedJobs?.length || 0,
            // V6.0 Enhanced matching profile
            matchingProfile: {
                inferredSeniority: matchingProfile.inferredSeniority,
                totalYearsExperience: matchingProfile.totalYearsExperience,
                primaryDomain: matchingProfile.primaryDomain,
                coreSkillsCount: matchingProfile.coreSkills.length,
                certificationsCount: matchingProfile.certificationBoosts.length,
                companiesInNetwork: matchingProfile.relevantCompanies.length,
                profileCompleteness: matchingProfile.profileCompleteness,
            },
        };

        const stats = {
            totalJobsAnalyzed: jobsSnapshot.size,
            excludedByLanguage,
            excludedByScore,
            excludedByDismiss,
            matchedJobs: matchedJobs.length,
            returned: formattedJobs.length,
            // V5.0 Feedback influence
            savedJobsUsedForScoring: savedJobsData.length,
        };

        res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs,
            profileAnalysis,
            stats,
        });

    } catch (error: any) {
        console.error('❌ Error in getMatchedJobs v6.0:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matched jobs',
            error: error.message
        });
    }
});
