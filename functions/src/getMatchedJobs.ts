/**
 * Job Matching API v4.0 - Precision Rule-based Matching
 * 
 * CRITICAL FIXES from v2.0:
 * - Role function matching (engineering vs sales vs consulting etc.)
 * - Language requirements HARD FILTER (job excluded if user doesn't speak required language)
 * - PENALTIES for jobs with empty/poor enrichment data
 * - Enrichment quality penalty (jobs with low data quality penalized)
 * 
 * Scoring system:
 * - Role Function: +25 (match) / -20 (mismatch)
 * - Skills/Tech: +30 (match) / -10 (job has no tech data)
 * - Location: +15 (match)
 * - Experience: +10 (match)
 * - Industry: +10 (match)
 * - History Bonus: +10 (past experience)
 * - Data Quality Penalty: -15 (if enrichmentQuality < 50)
 * - Deal Breakers/Sectors: -30/-20
 * - Language: HARD FILTER (excluded)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const REGION = 'us-central1';

// =============================================================================
// TYPES
// =============================================================================

type RoleFunction = 'engineering' | 'sales' | 'marketing' | 'operations' | 'hr' | 'finance' | 'design' | 'data' | 'product' | 'consulting' | 'support' | 'legal' | 'other';

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
        startDate: string;
        endDate: string;
        current: boolean;
        industry?: string;
        contractType?: string;
        location?: string;
        responsibilities?: string[];
        achievements?: string[];
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
    dataQualityPenalty: number;
    dealBreakerPenalty: number;
    sectorAvoidPenalty: number;
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
 */
function inferUserRoleFunction(user: UserProfileData): RoleFunction {
    // Check target position first
    if (user.targetPosition) {
        const target = user.targetPosition.toLowerCase();
        if (/engineer|developer|devops|sre|software|backend|frontend|fullstack/i.test(target)) return 'engineering';
        if (/consultant|advisory/i.test(target)) return 'consulting';
        if (/sales|account executive|bdr|sdr|ae\b/i.test(target)) return 'sales';
        if (/data scientist|data engineer|ml|ai|analyst/i.test(target)) return 'data';
        if (/product manager|product owner|pm\b/i.test(target)) return 'product';
        if (/designer|ux|ui|creative/i.test(target)) return 'design';
        if (/marketing|growth|content|seo/i.test(target)) return 'marketing';
    }

    // Check most recent job in professional history
    if (user.professionalHistory && user.professionalHistory.length > 0) {
        const currentJob = user.professionalHistory.find(h => h.current) || user.professionalHistory[0];
        const title = currentJob.title.toLowerCase();

        if (/engineer|developer|devops|sre|software|backend|frontend|fullstack/i.test(title)) return 'engineering';
        if (/consultant|advisory/i.test(title)) return 'consulting';
        if (/sales|account executive|bdr|sdr|ae\b/i.test(title)) return 'sales';
        if (/data scientist|data engineer|ml|ai|analyst/i.test(title)) return 'data';
        if (/product manager|product owner|pm\b/i.test(title)) return 'product';
        if (/designer|ux|ui|creative/i.test(title)) return 'design';
        if (/marketing|growth|content|seo/i.test(title)) return 'marketing';
        if (/operations|ops\b|supply chain|logistics/i.test(title)) return 'operations';
        if (/hr\b|recruiter|people/i.test(title)) return 'hr';
        if (/finance|accountant|controller/i.test(title)) return 'finance';
        if (/support|customer success/i.test(title)) return 'support';
        if (/legal|lawyer|counsel/i.test(title)) return 'legal';
    }

    // Check skills/tools for tech signals
    const allSkills = [...(user.skills || []), ...(user.tools || [])].join(' ').toLowerCase();
    if (/salesforce|apex|lightning|sfdc|crm implementation/i.test(allSkills)) return 'consulting';
    if (/python|javascript|react|node|java|aws|azure|docker|kubernetes/i.test(allSkills)) return 'engineering';
    if (/tableau|powerbi|sql|analytics|looker/i.test(allSkills)) return 'data';
    if (/figma|sketch|adobe|ux|ui/i.test(allSkills)) return 'design';

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
        'consulting': ['engineering', 'product', 'data', 'operations'],
        'data': ['engineering', 'product', 'consulting'],
        'product': ['engineering', 'data', 'design'],
        'design': ['product', 'marketing'],
        'marketing': ['sales', 'design', 'product'],
        'sales': ['marketing', 'support'],
        'support': ['sales', 'operations'],
        'operations': ['support', 'finance', 'consulting'],
        'finance': ['operations'],
        'hr': ['operations'],
        'legal': ['operations', 'finance'],
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
 * Skills & Technologies Match (max +30 / penalty -10 for no data)
 */
function calculateSkillsScore(user: UserProfileData, job: EnrichedJob): { score: number; reasons: string[] } {
    const reasons: string[] = [];

    // Collect all user skills
    const userSkills = [
        ...(user.skills || []),
        ...(user.tools || []),
        ...(user.softSkills || []),
        ...(user.certifications?.map(c => c.name) || [])
    ].map(normalizeString);

    // Extract keywords from responsibilities
    const responsibilityKeywords: string[] = [];
    user.professionalHistory?.forEach(exp => {
        exp.responsibilities?.forEach(resp => {
            responsibilityKeywords.push(...extractKeywords(resp));
        });
    });

    const allUserTerms = [...new Set([...userSkills, ...responsibilityKeywords])];

    // Job requirements
    const jobTerms = [
        ...(job.technologies || []),
        ...(job.skills || [])
    ].map(normalizeString);

    // PENALTY: User has skills but job has NO tech data
    if (allUserTerms.length > 0 && jobTerms.length === 0) {
        reasons.push('Job has no technical requirements listed');
        return { score: -10, reasons };
    }

    // User has no skills data - neutral
    if (allUserTerms.length === 0) {
        return { score: 5, reasons: ['No skills data to match'] };
    }

    let matchCount = 0;
    const matchedSkills: string[] = [];

    for (const userTerm of allUserTerms) {
        for (const jobTerm of jobTerms) {
            if (fuzzyMatch(userTerm, jobTerm)) {
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
    } else if (jobTerms.length > 0) {
        reasons.push('No matching skills found');
    }

    return { score, reasons };
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
// MAIN MATCHING FUNCTION V4.0
// =============================================================================

function calculateMatchScore(user: UserProfileData, job: EnrichedJob): { matched: MatchedJob | null; excluded: boolean; excludeReason?: string } {
    // HARD FILTER: Language requirements
    const langCheck = shouldExcludeByLanguage(user, job);
    if (langCheck.exclude) {
        return { matched: null, excluded: true, excludeReason: langCheck.reason };
    }

    // Calculate all scores
    const roleFunction = calculateRoleFunctionScore(user, job);
    const skills = calculateSkillsScore(user, job);
    const location = calculateLocationScore(user, job);
    const experience = calculateExperienceScore(user, job);
    const industry = calculateIndustryScore(user, job);
    const title = calculateTitleScore(user, job);
    const history = calculateHistoryBonus(user, job);
    const environment = calculateEnvironmentBonus(user, job);

    // Penalties
    const dataQuality = calculateDataQualityPenalty(job);
    const dealBreaker = calculateDealBreakerPenalty(user, job);
    const sectorAvoid = calculateSectorAvoidPenalty(user, job);

    // Calculate total
    // Positive max: 25 + 30 + 15 + 10 + 10 + 10 + 10 + 5 = 115
    const rawPositive = 
        roleFunction.score + skills.score + location.score + 
        experience.score + industry.score + title.score + 
        history.score + environment.score;

    // Scale to 100 and apply penalties
    const totalPenalty = dataQuality.penalty + dealBreaker.penalty + sectorAvoid.penalty;
    const scaledScore = Math.round((Math.max(rawPositive, 0) / 115) * 100);
    const finalScore = Math.max(0, Math.min(100, scaledScore - totalPenalty));

    // Collect reasons
    const allReasons: string[] = [];
    if (roleFunction.score > 0) allReasons.push(...roleFunction.reasons);
    if (skills.score > 0) allReasons.push(...skills.reasons);
    if (location.score > 0) allReasons.push(...location.reasons);
    if (experience.score > 0) allReasons.push(...experience.reasons);
    if (industry.score > 0) allReasons.push(...industry.reasons);
    if (title.score > 0) allReasons.push(...title.reasons);
    if (history.score > 0) allReasons.push(...history.reasons);
    if (environment.score > 0) allReasons.push(...environment.reasons);

    // Add negative reasons if significant
    const negativeReasons: string[] = [];
    if (roleFunction.score < 0) negativeReasons.push(...roleFunction.reasons);
    if (skills.score < 0) negativeReasons.push(...skills.reasons);
    if (dataQuality.penalty > 0) negativeReasons.push(...dataQuality.reasons);
    if (dealBreaker.penalty > 0) negativeReasons.push(...dealBreaker.reasons);
    if (sectorAvoid.penalty > 0) negativeReasons.push(...sectorAvoid.reasons);

    const matchedJob: MatchedJob = {
        ...job,
        matchScore: finalScore,
        matchDetails: {
            roleFunctionScore: roleFunction.score,
            skillsScore: skills.score,
            locationScore: location.score,
            experienceScore: experience.score,
            industryScore: industry.score,
            titleScore: title.score,
            historyBonus: history.score,
            environmentBonus: environment.score,
            dataQualityPenalty: dataQuality.penalty,
            dealBreakerPenalty: dealBreaker.penalty,
            sectorAvoidPenalty: sectorAvoid.penalty,
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

        // Calculate match scores with hard filters
        const matchedJobs: MatchedJob[] = [];
        let excludedByLanguage = 0;
        let excludedByScore = 0;

        for (const doc of jobsSnapshot.docs) {
            const jobData = doc.data() as EnrichedJob;
            const job: EnrichedJob = { id: doc.id, ...jobData };

            const result = calculateMatchScore(userData, job);

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

        // Profile analysis
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
        };

        const stats = {
            totalJobsAnalyzed: jobsSnapshot.size,
            excludedByLanguage,
            excludedByScore,
            matchedJobs: matchedJobs.length,
            returned: formattedJobs.length,
        };

        res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs,
            profileAnalysis,
            stats,
        });

    } catch (error: any) {
        console.error('❌ Error in getMatchedJobs v4.0:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matched jobs',
            error: error.message
        });
    }
});
