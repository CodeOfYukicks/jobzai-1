/**
 * CV Parsing Validator
 * Validates parsed CV data structure and completeness
 */

export interface ParsingValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  stats: {
    experiencesCount: number;
    educationsCount: number;
    skillsCount: number;
    certificationsCount: number;
    languagesCount: number;
    expectedExperiencesCount?: number; // Si fourni depuis extraction_summary
    expectedEducationsCount?: number;
  };
}

export interface ExtractionSummary {
  experiences_found?: number;
  educations_found?: number;
  skills_found?: number;
  certifications_found?: number;
  languages_found?: number;
  sections_detected?: string[];
}

/**
 * Validate parsed CV structure and completeness
 */
export function validateParsedCV(
  parsedCV: any,
  extractionSummary?: ExtractionSummary
): ParsingValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Vérifier que experiences est un array
  if (!Array.isArray(parsedCV.experience) && !Array.isArray(parsedCV.experiences)) {
    errors.push('Experiences must be an array');
  }

  // Normaliser le nom du champ (experience vs experiences)
  const experiences = parsedCV.experience || parsedCV.experiences || [];
  const expCount = Array.isArray(experiences) ? experiences.length : 0;

  // Vérifier le nombre d'expériences
  if (extractionSummary?.experiences_found !== undefined) {
    if (expCount !== extractionSummary.experiences_found) {
      warnings.push(
        `Mismatch: Found ${expCount} experiences but extraction reported ${extractionSummary.experiences_found}`
      );
    }
  }

  // Vérifier que chaque expérience a les champs requis
  experiences.forEach((exp: any, idx: number) => {
    if (!exp.title && !exp.jobTitle) {
      warnings.push(`Experience #${idx + 1} missing title`);
    }
    if (!exp.company) {
      warnings.push(`Experience #${idx + 1} missing company`);
    }
    const bullets = exp.bullets || exp.description || [];
    if (!Array.isArray(bullets) || bullets.length === 0) {
      warnings.push(`Experience #${idx + 1} has no bullet points`);
    }
    if (!exp.startDate && !exp.period) {
      warnings.push(`Experience #${idx + 1} missing start date`);
    }
  });

  // Vérifier educations
  const educations = parsedCV.education || parsedCV.educations || [];
  const eduCount = Array.isArray(educations) ? educations.length : 0;

  if (extractionSummary?.educations_found !== undefined) {
    if (eduCount !== extractionSummary.educations_found) {
      warnings.push(
        `Mismatch: Found ${eduCount} educations but extraction reported ${extractionSummary.educations_found}`
      );
    }
  }

  educations.forEach((edu: any, idx: number) => {
    if (!edu.degree && !edu.title) {
      warnings.push(`Education #${idx + 1} missing degree`);
    }
    if (!edu.institution && !edu.school && !edu.university) {
      warnings.push(`Education #${idx + 1} missing institution`);
    }
  });

  // Vérifier skills
  const skills = parsedCV.skills || [];
  const skillsCount = Array.isArray(skills) ? skills.length : 0;

  if (extractionSummary?.skills_found !== undefined) {
    const expectedSkills = extractionSummary.skills_found;
    if (skillsCount < expectedSkills * 0.5) {
      // Tolérance de 50% pour les skills (peuvent être fusionnés)
      warnings.push(
        `Found ${skillsCount} skills but extraction reported ${expectedSkills}. Some skills may have been merged.`
      );
    }
  }

  // Vérifier certifications
  const certifications = parsedCV.certifications || parsedCV.certificates || [];
  const certCount = Array.isArray(certifications) ? certifications.length : 0;

  if (extractionSummary?.certifications_found !== undefined) {
    if (certCount !== extractionSummary.certifications_found) {
      warnings.push(
        `Mismatch: Found ${certCount} certifications but extraction reported ${extractionSummary.certifications_found}`
      );
    }
  }

  // Vérifier languages
  const languages = parsedCV.languages || [];
  const langCount = Array.isArray(languages) ? languages.length : 0;

  if (extractionSummary?.languages_found !== undefined) {
    if (langCount !== extractionSummary.languages_found) {
      warnings.push(
        `Mismatch: Found ${langCount} languages but extraction reported ${extractionSummary.languages_found}`
      );
    }
  }

  // Vérifier les données personnelles essentielles
  const personalInfo = parsedCV.personalInfo || {};
  if (!personalInfo.name && !personalInfo.firstName) {
    warnings.push('Missing personal information: name');
  }
  if (!personalInfo.email) {
    warnings.push('Missing personal information: email');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    stats: {
      experiencesCount: expCount,
      educationsCount: eduCount,
      skillsCount,
      certificationsCount: certCount,
      languagesCount: langCount,
      expectedExperiencesCount: extractionSummary?.experiences_found,
      expectedEducationsCount: extractionSummary?.educations_found,
    },
  };
}

