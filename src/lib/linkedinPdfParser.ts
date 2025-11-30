import { pdfToImages } from './pdfToImages';

export interface ParsedLinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  positions: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    location?: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
}

/**
 * Parse a LinkedIn PDF export file and extract profile data
 * Uses Claude Vision API to analyze the PDF images
 */
export async function parseLinkedInPdf(file: File): Promise<ParsedLinkedInProfile> {
  try {
    // Convert PDF to images (use lower quality for faster processing)
    const images = await pdfToImages(file, 5, 1.2);
    
    if (images.length === 0) {
      throw new Error('Failed to convert PDF to images');
    }

    // Send to API for parsing
    const response = await fetch('/api/parse-linkedin-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: images.map(img => img.dataUrl)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse LinkedIn PDF');
    }

    const data = await response.json();
    return normalizeLinkedInData(data);
  } catch (error) {
    console.error('Error parsing LinkedIn PDF:', error);
    throw error;
  }
}

/**
 * Normalize and clean the parsed LinkedIn data
 */
function normalizeLinkedInData(data: any): ParsedLinkedInProfile {
  return {
    firstName: cleanString(data.firstName),
    lastName: cleanString(data.lastName),
    headline: cleanString(data.headline),
    email: cleanString(data.email),
    phone: cleanString(data.phone),
    location: cleanString(data.location),
    summary: cleanString(data.summary),
    positions: normalizePositions(data.positions || data.experience || []),
    education: normalizeEducation(data.education || []),
    skills: normalizeSkills(data.skills || []),
    languages: normalizeLanguages(data.languages || []),
    certifications: normalizeCertifications(data.certifications || [])
  };
}

function cleanString(str: any): string | undefined {
  if (!str) return undefined;
  return String(str).trim().replace(/\s+/g, ' ');
}

function normalizePositions(positions: any[]): ParsedLinkedInProfile['positions'] {
  if (!Array.isArray(positions)) return [];
  
  return positions.map(pos => ({
    title: cleanString(pos.title) || 'Unknown Position',
    company: cleanString(pos.company) || 'Unknown Company',
    startDate: normalizeDate(pos.startDate || pos.start_date),
    endDate: pos.current ? undefined : normalizeDate(pos.endDate || pos.end_date),
    current: Boolean(pos.current || pos.isCurrent),
    location: cleanString(pos.location),
    description: cleanString(pos.description)
  })).filter(pos => pos.title && pos.company);
}

function normalizeEducation(education: any[]): ParsedLinkedInProfile['education'] {
  if (!Array.isArray(education)) return [];
  
  return education.map(edu => ({
    school: cleanString(edu.school || edu.institution) || 'Unknown School',
    degree: cleanString(edu.degree),
    field: cleanString(edu.field || edu.fieldOfStudy),
    startDate: normalizeDate(edu.startDate || edu.start_date),
    endDate: normalizeDate(edu.endDate || edu.end_date)
  })).filter(edu => edu.school);
}

function normalizeSkills(skills: any[]): string[] {
  if (!Array.isArray(skills)) return [];
  
  return skills
    .map(skill => typeof skill === 'string' ? cleanString(skill) : cleanString(skill?.name))
    .filter((skill): skill is string => Boolean(skill));
}

function normalizeLanguages(languages: any[]): ParsedLinkedInProfile['languages'] {
  if (!Array.isArray(languages)) return [];
  
  return languages.map(lang => {
    if (typeof lang === 'string') {
      return { language: cleanString(lang) || 'Unknown' };
    }
    return {
      language: cleanString(lang.language || lang.name) || 'Unknown',
      level: cleanString(lang.level || lang.proficiency)
    };
  }).filter(lang => lang.language);
}

function normalizeCertifications(certifications: any[]): ParsedLinkedInProfile['certifications'] {
  if (!Array.isArray(certifications)) return [];
  
  return certifications.map(cert => ({
    name: cleanString(cert.name || cert.title) || 'Unknown Certification',
    issuer: cleanString(cert.issuer || cert.organization),
    date: normalizeDate(cert.date || cert.issued_date)
  })).filter(cert => cert.name);
}

function normalizeDate(date: any): string {
  if (!date) return '';
  
  // If already in YYYY-MM format
  if (typeof date === 'string' && /^\d{4}-\d{2}$/.test(date)) {
    return date;
  }
  
  // If it's a string like "Jan 2020" or "January 2020"
  if (typeof date === 'string') {
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    const normalized = date.toLowerCase().trim();
    
    // Try to extract month and year
    const match = normalized.match(/(\w+)\s*(\d{4})/);
    if (match) {
      const month = monthMap[match[1]] || '01';
      const year = match[2];
      return `${year}-${month}`;
    }
    
    // Try just year
    const yearMatch = normalized.match(/\d{4}/);
    if (yearMatch) {
      return `${yearMatch[0]}-01`;
    }
  }
  
  return '';
}

/**
 * Map LinkedIn data to profile data format for Jobzai
 */
export function mapLinkedInToProfile(linkedInData: ParsedLinkedInProfile) {
  return {
    firstName: linkedInData.firstName,
    lastName: linkedInData.lastName,
    headline: linkedInData.headline,
    email: linkedInData.email,
    phone: linkedInData.phone,
    
    // Professional History
    professionalHistory: linkedInData.positions.map(pos => ({
      title: pos.title,
      company: pos.company,
      startDate: pos.startDate,
      endDate: pos.endDate || '',
      current: pos.current,
      industry: '', // Not available from LinkedIn PDF
      contractType: 'full-time', // Default
      location: pos.location || '',
      responsibilities: pos.description ? [pos.description] : [],
      achievements: []
    })),
    
    // Education
    educationLevel: mapEducationLevel(linkedInData.education[0]?.degree),
    educationField: linkedInData.education[0]?.field || '',
    educationInstitution: linkedInData.education[0]?.school || '',
    graduationYear: linkedInData.education[0]?.endDate?.split('-')[0] || '',
    
    // Skills
    skills: linkedInData.skills,
    
    // Languages
    languages: linkedInData.languages.map(lang => ({
      language: lang.language,
      level: mapLanguageLevel(lang.level)
    })),
    
    // Certifications
    certifications: linkedInData.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer || '',
      year: cert.date?.split('-')[0] || ''
    }))
  };
}

function mapEducationLevel(degree?: string): string {
  if (!degree) return '';
  
  const normalized = degree.toLowerCase();
  
  if (normalized.includes('phd') || normalized.includes('doctor')) return 'phd';
  if (normalized.includes('master') || normalized.includes('mba') || normalized.includes('msc')) return 'master';
  if (normalized.includes('bachelor') || normalized.includes('bsc') || normalized.includes('ba')) return 'bachelor';
  if (normalized.includes('associate')) return 'associate';
  
  return 'other';
}

function mapLanguageLevel(level?: string): string {
  if (!level) return 'intermediate';
  
  const normalized = level.toLowerCase();
  
  if (normalized.includes('native') || normalized.includes('bilingual')) return 'native';
  if (normalized.includes('fluent') || normalized.includes('full professional')) return 'fluent';
  if (normalized.includes('intermediate') || normalized.includes('professional working')) return 'intermediate';
  if (normalized.includes('beginner') || normalized.includes('elementary')) return 'beginner';
  
  return 'intermediate';
}



