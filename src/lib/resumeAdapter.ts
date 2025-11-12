export interface CVData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    jobTitle: string;
  };
  professionalSummary: string;
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string[];
    order: number;
  }>;
  educations: Array<{
    id: string;
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description?: string;
    order: number;
  }>;
  skills: Array<{ id: string; name: string; level: string; order: number }>;
  languages: Array<{ id: string; name: string; level: string; order: number }>;
  certificates: Array<{ id: string; name: string; issuer: string; date: string; order: number }>;
}

// Adapter cvData -> JSON Resume (https://jsonresume.org/)
export function toResumeJson(cvData: CVData) {
  return {
    basics: {
      name: `${cvData.personalInfo.firstName || ''} ${cvData.personalInfo.lastName || ''}`.trim(),
      email: cvData.personalInfo.email || '',
      phone: cvData.personalInfo.phone || '',
      label: cvData.personalInfo.jobTitle || '',
      location: {
        address: '',
        city: cvData.personalInfo.location || ''
      },
      profiles: [
        ...(cvData.personalInfo.linkedin ? [{ network: 'LinkedIn', url: cvData.personalInfo.linkedin }] : []),
        ...(cvData.personalInfo.portfolio ? [{ network: 'Website', url: cvData.personalInfo.portfolio }] : [])
      ]
    },
    summary: cvData.professionalSummary || '',
    work: cvData.experiences.map((e) => ({
      name: e.company || '',
      position: e.title || '',
      startDate: e.startDate || '',
      endDate: e.isCurrent ? undefined : (e.endDate || ''),
      highlights: Array.isArray(e.description) ? e.description : []
    })),
    education: cvData.educations.map((ed) => ({
      institution: ed.institution || '',
      area: ed.degree || '',
      startDate: ed.startDate || '',
      endDate: ed.isCurrent ? undefined : (ed.endDate || ''),
      summary: ed.description || ''
    })),
    skills: cvData.skills.map((s) => ({
      name: s.name || '',
      level: s.level || 'Intermediate'
    })),
    languages: cvData.languages.map((l) => ({
      language: l.name || '',
      fluency: l.level || 'Intermediate'
    })),
    certificates: cvData.certificates.map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || ''
    }))
  };
}



