/**
 * CV Quality Checker
 * Validates CV quality: bullet points, metrics, keywords, etc.
 */

export interface CVQualityReport {
  score: number; // 0-100
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    section: string;
    message: string;
    fix?: string;
  }>;
}

export interface JobContext {
  jobTitle: string;
  company: string;
  keywords: string[];
  jobDescription?: string;
}

/**
 * Check CV quality and return a report
 */
export function checkCVQuality(cvData: any, jobContext: JobContext): CVQualityReport {
  const issues: CVQualityReport['issues'] = [];
  let score = 100;

  // Normalize experiences array
  const experiences = cvData.experience || cvData.experiences || [];

  // Vérifier que chaque expérience a 3-6 bullet points
  experiences.forEach((exp: any, idx: number) => {
    const bullets = exp.bullets || exp.description || [];
    const bulletCount = Array.isArray(bullets) ? bullets.length : 0;

    if (bulletCount < 3) {
      issues.push({
        type: 'warning',
        section: `Experience ${idx + 1}: ${exp.title || 'Unknown'}`,
        message: `Only ${bulletCount} bullet points. Recommended: 3-6.`,
        fix: 'Add more achievements or responsibilities',
      });
      score -= 5;
    }

    if (bulletCount > 6) {
      issues.push({
        type: 'suggestion',
        section: `Experience ${idx + 1}: ${exp.title || 'Unknown'}`,
        message: `${bulletCount} bullet points. Consider condensing to 4-5 most impactful.`,
      });
    }

    // Vérifier que chaque expérience a un titre et une entreprise
    if (!exp.title && !exp.jobTitle) {
      issues.push({
        type: 'error',
        section: `Experience ${idx + 1}`,
        message: 'Missing job title',
        fix: 'Add a job title for this experience',
      });
      score -= 10;
    }

    if (!exp.company) {
      issues.push({
        type: 'error',
        section: `Experience ${idx + 1}`,
        message: 'Missing company name',
        fix: 'Add a company name for this experience',
      });
      score -= 10;
    }
  });

  // Vérifier la présence de métriques
  const hasMetrics = experiences.some((exp: any) => {
    const bullets = exp.bullets || exp.description || [];
    return bullets.some((b: string) =>
      /\d+%|\$|\d+\s*(users|people|team|clients|customers|projects|features|revenue|K|M|million|thousand)/i.test(
        b
      )
    );
  });

  if (!hasMetrics) {
    issues.push({
      type: 'warning',
      section: 'Overall',
      message: 'No quantified metrics found. Add numbers, percentages, or scale indicators.',
      fix: 'Add metrics like "increased by 40%", "$2M revenue", "2M users", etc.',
    });
    score -= 10;
  }

  // Vérifier les keywords du job
  const cvText = JSON.stringify(cvData).toLowerCase();
  const missingKeywords = jobContext.keywords.filter(
    (kw: string) => !cvText.includes(kw.toLowerCase())
  );

  if (missingKeywords.length > 5) {
    issues.push({
      type: 'suggestion',
      section: 'Keywords',
      message: `${missingKeywords.length} important keywords not found in CV.`,
      fix: `Consider integrating: ${missingKeywords.slice(0, 5).join(', ')}`,
    });
    score -= 5;
  }

  // Vérifier que le résumé professionnel existe et a une longueur raisonnable
  const summary = cvData.summary || cvData.professionalSummary || '';
  if (!summary || summary.length < 50) {
    issues.push({
      type: 'warning',
      section: 'Professional Summary',
      message: 'Summary is missing or too short (less than 50 characters).',
      fix: 'Add a compelling 2-3 sentence professional summary',
    });
    score -= 5;
  }

  if (summary.length > 300) {
    issues.push({
      type: 'suggestion',
      section: 'Professional Summary',
      message: `Summary is quite long (${summary.length} characters). Consider condensing to 2-3 sentences.`,
    });
  }

  // Vérifier les compétences
  const skills = cvData.skills || [];
  const skillsCount = Array.isArray(skills) ? skills.length : 0;

  if (skillsCount < 5) {
    issues.push({
      type: 'warning',
      section: 'Skills',
      message: `Only ${skillsCount} skills listed. Recommended: 10-20 relevant skills.`,
      fix: 'Add more relevant technical and soft skills',
    });
    score -= 5;
  }

  // Vérifier que les dates sont présentes pour les expériences
  experiences.forEach((exp: any, idx: number) => {
    if (!exp.startDate && !exp.period) {
      issues.push({
        type: 'warning',
        section: `Experience ${idx + 1}: ${exp.title || 'Unknown'}`,
        message: 'Missing start date',
        fix: 'Add start date for this experience',
      });
      score -= 2;
    }
  });

  // Vérifier la cohérence des verbes d'action
  const weakVerbs = ['worked', 'helped', 'assisted', 'participated', 'was responsible'];
  const hasWeakVerbs = experiences.some((exp: any) => {
    const bullets = exp.bullets || exp.description || [];
    return bullets.some((b: string) =>
      weakVerbs.some((verb) => b.toLowerCase().includes(verb))
    );
  });

  if (hasWeakVerbs) {
    issues.push({
      type: 'suggestion',
      section: 'Overall',
      message: 'Some bullet points use weak action verbs (worked, helped, assisted).',
      fix: 'Replace with stronger verbs: Led, Architected, Delivered, Optimized, etc.',
    });
    score -= 3;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return { score, issues };
}

