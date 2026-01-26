/**
 * Profile to CV Data Mapping Utilities
 * 
 * Provides functions to convert data from different sources
 * (PDF extraction, Firestore profile, existing CV) into the CV editor format.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateId } from './cvEditorUtils';
import type { CVFullProfileExtractionResult, ExtractedExperience, ExtractedEducation, ExtractedLanguage } from './cvExperienceExtractor';

/**
 * CV Data structure used by the CV Editor
 */
export interface CVData {
    personalInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        portfolio: string;
        github: string;
        title: string;
        photoUrl: string;
    };
    summary: string;
    experiences: CVExperience[];
    education: CVEducation[];
    skills: CVSkill[];
    certifications: any[];
    projects: any[];
    languages: CVLanguage[];
    sections: CVSection[];
}

export interface CVExperience {
    id: string;
    title: string;
    company: string;
    client?: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    bullets: string[];  // Template expects 'bullets' not 'highlights'
}

export interface CVEducation {
    id: string;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    gpa?: string;
}

export interface CVSkill {
    id: string;
    name: string;
    level: number; // 1-5 scale
    category?: string;
}

export interface CVLanguage {
    id: string;
    name: string;
    proficiency: string;  // Template expects 'proficiency' not 'level'
}

export interface CVSection {
    id: string;
    type: string;
    title: string;
    enabled: boolean;
    order: number;
}

/**
 * Default sections configuration for a new CV
 */
const DEFAULT_SECTIONS: CVSection[] = [
    { id: 'personal', type: 'personal', title: 'Personal Information', enabled: true, order: 0 },
    { id: 'summary', type: 'summary', title: 'Professional Summary', enabled: true, order: 1 },
    { id: 'experience', type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
    { id: 'education', type: 'education', title: 'Education', enabled: true, order: 3 },
    { id: 'skills', type: 'skills', title: 'Skills', enabled: true, order: 4 },
    { id: 'certifications', type: 'certifications', title: 'Certifications', enabled: false, order: 5 },
    { id: 'projects', type: 'projects', title: 'Projects', enabled: false, order: 6 },
    { id: 'languages', type: 'languages', title: 'Languages', enabled: false, order: 7 }
];

/**
 * Create an empty CV data structure
 */
export function createEmptyCVData(targetJobTitle: string = ''): CVData {
    return {
        personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            portfolio: '',
            github: '',
            title: targetJobTitle,
            photoUrl: ''
        },
        summary: '',
        experiences: [],
        education: [],
        skills: [],
        certifications: [],
        projects: [],
        languages: [],
        sections: [...DEFAULT_SECTIONS]
    };
}

/**
 * Map extracted PDF profile data to CV editor format
 * 
 * @param extractedProfile - Data extracted from PDF using extractFullProfileFromText
 * @param targetJobTitle - Target job title for the CV
 * @returns CVData formatted for the CV editor
 */
export function mapExtractedProfileToCVData(
    extractedProfile: CVFullProfileExtractionResult,
    targetJobTitle: string
): CVData {
    const { personalInfo, experiences, educations, skills, tools, languages, summary } = extractedProfile;

    // Map personal info
    const location = [personalInfo?.city, personalInfo?.country]
        .filter(Boolean)
        .join(', ');

    // Map experiences
    const mappedExperiences: CVExperience[] = (experiences || []).map((exp: ExtractedExperience) => ({
        id: generateId(),
        title: exp.title || '',
        company: exp.company || '',
        client: exp.client || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
        description: '', // Main description field
        bullets: exp.responsibilities || []  // Template expects 'bullets'
    }));

    // Map educations
    const mappedEducation: CVEducation[] = (educations || []).map((edu: ExtractedEducation) => ({
        id: generateId(),
        degree: edu.degree && edu.field ? `${edu.degree} in ${edu.field}` : (edu.degree || edu.field || ''),
        institution: edu.institution || '',
        location: '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        current: edu.current || false,
        description: edu.description || ''
    }));

    // Map skills (combine skills and tools)
    const allSkills = [...(skills || []), ...(tools || [])];
    const mappedSkills: CVSkill[] = allSkills.map((skill: string) => ({
        id: generateId(),
        name: skill,
        level: 3, // Default to mid-level
        category: tools?.includes(skill) ? 'technical' : 'soft'
    }));

    // Map languages
    const mappedLanguages: CVLanguage[] = (languages || []).map((lang: ExtractedLanguage) => ({
        id: generateId(),
        name: lang.language || '',
        proficiency: lang.level || 'intermediate'  // Template expects 'proficiency'
    }));

    // Determine which sections should be enabled
    const sections = DEFAULT_SECTIONS.map(section => ({
        ...section,
        enabled: section.type === 'personal' ||
            section.type === 'summary' ||
            (section.type === 'experience' && mappedExperiences.length > 0) ||
            (section.type === 'education' && mappedEducation.length > 0) ||
            (section.type === 'skills' && mappedSkills.length > 0) ||
            (section.type === 'languages' && mappedLanguages.length > 0)
    }));

    return {
        personalInfo: {
            firstName: personalInfo?.firstName || '',
            lastName: personalInfo?.lastName || '',
            email: personalInfo?.email || '',
            phone: personalInfo?.phone || '',
            location: location,
            linkedin: '',
            portfolio: '',
            github: '',
            title: personalInfo?.headline || targetJobTitle,
            photoUrl: ''
        },
        summary: summary || '',
        experiences: mappedExperiences,
        education: mappedEducation,
        skills: mappedSkills,
        certifications: [],
        projects: [],
        languages: mappedLanguages,
        sections
    };
}

/**
 * Map Firestore user profile data to CV editor format
 * 
 * @param userId - Firebase Auth user ID
 * @param targetJobTitle - Target job title for the CV
 * @returns Promise<CVData> formatted for the CV editor
 */
export async function mapFirestoreProfileToCVData(
    userId: string,
    targetJobTitle: string
): Promise<CVData> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            console.warn('User document not found, returning empty CV data');
            return createEmptyCVData(targetJobTitle);
        }

        const userData = userDoc.data();

        // Map personal info
        const location = [userData.city, userData.country]
            .filter(Boolean)
            .join(', ');

        // Map professional history to experiences
        const mappedExperiences: CVExperience[] = (userData.professionalHistory || []).map((exp: any) => ({
            id: generateId(),
            title: exp.title || '',
            company: exp.company || '',
            client: exp.client || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            current: exp.current || false,
            description: '',
            bullets: exp.responsibilities || exp.achievements || []  // Template expects 'bullets'
        }));

        // Map educations (new format) or legacy education fields
        let mappedEducation: CVEducation[] = [];

        if (userData.educations && Array.isArray(userData.educations) && userData.educations.length > 0) {
            // New format with educations array
            mappedEducation = userData.educations.map((edu: any) => ({
                id: generateId(),
                degree: edu.degree && edu.field ? `${edu.degree} in ${edu.field}` : (edu.degree || edu.field || ''),
                institution: edu.institution || '',
                location: edu.location || '',
                startDate: edu.startDate || '',
                endDate: edu.endDate || '',
                current: edu.current || false,
                description: edu.description || ''
            }));
        } else if (userData.educationLevel || userData.educationInstitution) {
            // Legacy format with single education
            const degreeStr = userData.educationLevel && userData.educationField
                ? `${userData.educationLevel} in ${userData.educationField}`
                : (userData.educationLevel || userData.educationField || '');

            mappedEducation = [{
                id: generateId(),
                degree: degreeStr,
                institution: userData.educationInstitution || '',
                location: '',
                startDate: '',
                endDate: userData.graduationYear ? `${userData.graduationYear}-06` : '',
                current: false,
                description: userData.educationMajor || ''
            }];
        }

        // Map skills (combine skills and tools)
        const allSkills = [...(userData.skills || []), ...(userData.tools || [])];
        const mappedSkills: CVSkill[] = allSkills.map((skill: string) => ({
            id: generateId(),
            name: skill,
            level: 3,
            category: userData.tools?.includes(skill) ? 'technical' : 'soft'
        }));

        // Map languages
        const mappedLanguages: CVLanguage[] = (userData.languages || []).map((lang: any) => ({
            id: generateId(),
            name: lang.language || lang.name || '',
            proficiency: lang.level || 'intermediate'  // Template expects 'proficiency'
        }));

        // Determine which sections should be enabled
        const sections = DEFAULT_SECTIONS.map(section => ({
            ...section,
            enabled: section.type === 'personal' ||
                section.type === 'summary' ||
                (section.type === 'experience' && mappedExperiences.length > 0) ||
                (section.type === 'education' && mappedEducation.length > 0) ||
                (section.type === 'skills' && mappedSkills.length > 0) ||
                (section.type === 'languages' && mappedLanguages.length > 0)
        }));

        return {
            personalInfo: {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                location: location,
                linkedin: userData.linkedinUrl || '',
                portfolio: userData.portfolioUrl || '',
                github: userData.githubUrl || '',
                title: userData.targetPosition || userData.headline || targetJobTitle,
                photoUrl: userData.profilePhoto || ''
            },
            summary: userData.professionalSummary || userData.bio || '',
            experiences: mappedExperiences,
            education: mappedEducation,
            skills: mappedSkills,
            certifications: [],
            projects: [],
            languages: mappedLanguages,
            sections
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return createEmptyCVData(targetJobTitle);
    }
}

/**
 * Clone an existing CV's data for a new CV
 * 
 * @param sourceCVData - The source CV data to clone
 * @param targetJobTitle - New target job title for the cloned CV
 * @returns CVData with regenerated IDs
 */
export function cloneCVData(
    sourceCVData: any,
    targetJobTitle: string
): CVData {
    // Deep clone the source data
    const cloned = JSON.parse(JSON.stringify(sourceCVData));

    // Update the job title
    if (cloned.personalInfo) {
        cloned.personalInfo.title = targetJobTitle;
    }

    // Regenerate IDs for experiences
    if (cloned.experiences && Array.isArray(cloned.experiences)) {
        cloned.experiences = cloned.experiences.map((exp: any) => ({
            ...exp,
            id: generateId()
        }));
    }

    // Regenerate IDs for education
    if (cloned.education && Array.isArray(cloned.education)) {
        cloned.education = cloned.education.map((edu: any) => ({
            ...edu,
            id: generateId()
        }));
    }

    // Regenerate IDs for skills
    if (cloned.skills && Array.isArray(cloned.skills)) {
        cloned.skills = cloned.skills.map((skill: any) => ({
            ...skill,
            id: generateId()
        }));
    }

    // Regenerate IDs for languages
    if (cloned.languages && Array.isArray(cloned.languages)) {
        cloned.languages = cloned.languages.map((lang: any) => ({
            ...lang,
            id: generateId()
        }));
    }

    // Ensure sections exist
    if (!cloned.sections || !Array.isArray(cloned.sections)) {
        cloned.sections = [...DEFAULT_SECTIONS];
    }

    return cloned as CVData;
}
