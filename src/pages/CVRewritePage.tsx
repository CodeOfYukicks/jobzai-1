import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { 
  ArrowLeft, Loader2, Wand2, AlertCircle, Sparkles,
  ZoomIn, ZoomOut, Maximize2, Download, Copy, Globe, 
  CheckCircle, ChevronDown, X, Plus, Check
} from 'lucide-react';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { CVRewrite, PremiumATSAnalysis } from '../types/premiumATS';
import { generateCVRewrite, translateCV } from '../lib/cvRewriteService';
import { rewriteSection, parseCVData } from '../lib/cvSectionAI';
import { validateParsedCV } from '../lib/cvParsingValidator';
import { checkCVQuality } from '../lib/cvQualityChecker';
import EditorSectionCard from '../components/cv-rewrite/EditorSectionCard';
import PreviewPanel, { TemplateType, FontFamily, FONT_FAMILIES } from '../components/cv-rewrite/PreviewPanel';
import DraggableEntry from '../components/cv-rewrite/DraggableEntry';
import DraggableSection from '../components/cv-rewrite/DraggableSection';
import SkillEntryCard from '../components/cv-rewrite/SkillEntryCard';
import jsPDF from 'jspdf';
import { useA4ContentFitter } from '../hooks/useA4ContentFitter';

interface CVSectionEntry {
  id: string;
  content: string; // Format markdown d'une seule expérience/éducation
}

interface SkillEntry {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  showOnCV: boolean;
}

interface CVSectionData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitleLabel: string;
  location: string;
  phone: string;
  linkedin: string;
  summary: string;
  experience: string; // Garder pour compatibilité (string concaténée)
  experiences?: CVSectionEntry[]; // NOUVEAU: array d'expériences
  education: string; // Garder pour compatibilité
  educations?: CVSectionEntry[]; // NOUVEAU: array d'éducations
  skills: string; // Garder pour compatibilité (string concaténée)
  skillsEntries?: SkillEntry[]; // NOUVEAU: array de skills avec level et showOnCV
  certifications: string;
  languages: string;
  hobbies: string;
  keywords: string;
}

// A4 dimensions: 210mm x 297mm
// At 96 DPI: 1 inch = 96 pixels, 1 inch = 25.4mm
// Width: 210mm / 25.4mm * 96 = 793.7px
// Height: 297mm / 25.4mm * 96 = 1122.52px
const A4_WIDTH_PX = 793.7; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1122.52; // 297mm at 96 DPI
const PREVIEW_ZOOM_LEVELS = [50, 70, 100, 120] as const;

type ExperienceEntry = {
  title: string;
  company: string;
  client?: string; // Client/projet si différent de l'entreprise
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};

type EducationEntry = {
  degree: string;
  institution: string;
  year: string;
  details?: string;
};

type LanguageEntry = {
  name: string;
  level?: string;
};

type CertificationEntry = {
  name: string;
  issuer?: string;
  year?: string;
  details?: string;
};

const parsePeriodLine = (line?: string) => {
  if (!line) return { start: '', end: '' };
  const [start, end] = line.split(/[-–—]/).map(part => part.trim());
  return {
    start: start || '',
    end: end || '',
  };
};

const parseExperienceSection = (raw: string): ExperienceEntry[] => {
  if (!raw?.trim()) return [];
  const blocks = raw.split(/\n(?=###\s+)/).map(block => block.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(line => line.trim());
    const headerLine = lines[0]?.replace(/^###\s*/, '') || '';
    const [title, ...companyParts] = headerLine.split(' - ');
    let company = companyParts.join(' - ').trim();
    
    // Extraire le client depuis le format "Client (via Company)" ou simplement "Client"
    let client: string | undefined = undefined;
    const clientMatch = company.match(/^(.+?)\s*\(via\s+(.+)\)$/i);
    if (clientMatch) {
      client = clientMatch[1].trim();
      company = clientMatch[2].trim();
    } else if (company && !company.includes('via')) {
      // Si pas de "via", le company pourrait être le client lui-même
      // On garde company tel quel pour l'instant
    }
    
    let periodLine = '';
    let bodyLines = lines.slice(1);
    if (bodyLines[0] && !bodyLines[0].startsWith('-') && !bodyLines[0].startsWith('•')) {
      periodLine = bodyLines[0];
      bodyLines = bodyLines.slice(1);
    }
    const { start, end } = parsePeriodLine(periodLine);
    const bullets = bodyLines
      .map(line => line.replace(/^[\s-•]+/, '').trim())
      .filter(Boolean);
    return {
      title: title || '',
      company: company || '',
      client: client,
      startDate: start,
      endDate: end,
      bullets,
    };
  });
};

const parseEducationSection = (raw: string): EducationEntry[] => {
  if (!raw?.trim()) return [];
  const blocks = raw.split(/\n(?=###\s+)/).map(block => block.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const headerLine = lines[0]?.replace(/^###\s*/, '') || '';
    const [degree, ...institutionParts] = headerLine.split(' - ');
    const institution = institutionParts.join(' - ').trim();
    const periodLine = lines[1] || '';
    const description = lines.slice(2).join('\n');
    return {
      degree: degree || '',
      institution: institution || '',
      year: periodLine,
      details: description,
    };
  });
};

const parseSkillsSection = (raw: string): string[] => {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]/)
    .map(skill => skill.trim())
    .filter(Boolean);
};

const parseCertificationsSection = (raw: string): CertificationEntry[] => {
  if (!raw?.trim()) return [];
  const blocks = raw.split(/\n(?=###\s+)/).map(block => block.trim()).filter(Boolean);

  if (blocks.length === 0) {
    return raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({
        name: line,
      }));
  }

  return blocks.map(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const headerLine = lines[0]?.replace(/^###\s*/, '') || '';
    const [name, ...issuerParts] = headerLine.split(' - ');
    const issuer = issuerParts.join(' - ').trim();
    const remaining = lines.slice(1);
    let year = '';
    let details = '';

    if (remaining[0] && !remaining[0].startsWith('-') && !remaining[0].startsWith('•')) {
      year = remaining[0];
      details = remaining.slice(1).join('\n');
    } else {
      details = remaining.join('\n');
    }

    return {
      name: (name || '').trim(),
      issuer: issuer || undefined,
      year: year || undefined,
      details: details || undefined,
    };
  });
};

const parseLanguagesSection = (raw: string): LanguageEntry[] => {
  if (!raw?.trim()) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const delimiter = line.includes('|') ? '|' : line.includes('-') ? '-' : '';
      if (!delimiter) {
        return { name: line };
      }
      const [language, level] = line.split(delimiter);
      return {
        name: language.trim(),
        level: level ? level.replace(/[\[\]()]/g, '').trim() : undefined,
      };
    });
};

const parseHobbiesSection = (raw: string): string[] => {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean);
};

const buildPreviewData = (baseData: any, sections: CVSectionData, showSkillsOnCV: boolean = true) => {
  // Utiliser les arrays si disponibles, sinon parser les strings
  let experience: ExperienceEntry[] = [];
  if (sections.experiences && sections.experiences.length > 0) {
    // Convertir les entries en ExperienceEntry
    experience = sections.experiences.map(entry => {
      const parsed = parseExperienceSection(entry.content);
      return parsed[0] || {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        bullets: [],
      };
    }).filter(exp => exp.title || exp.company);
  } else {
    experience = parseExperienceSection(sections.experience);
  }

  let education: EducationEntry[] = [];
  if (sections.educations && sections.educations.length > 0) {
    // Convertir les entries en EducationEntry
    education = sections.educations.map(entry => {
      const parsed = parseEducationSection(entry.content);
      return parsed[0] || {
        degree: '',
        institution: '',
        year: '',
        details: '',
      };
    }).filter(edu => edu.degree || edu.institution);
  } else {
    education = parseEducationSection(sections.education);
  }

  // Utiliser skillsEntries si disponible, sinon parser la string
  // Note: showOnCV est maintenant géré globalement via le paramètre showSkillsOnCV
  let skills: string[] = [];
  if (sections.skillsEntries && sections.skillsEntries.length > 0) {
    // Filtrer selon le toggle global
    if (showSkillsOnCV) {
      skills = sections.skillsEntries.map(skill => skill.name);
    } else {
      skills = []; // Ne pas afficher les skills si le toggle est désactivé
    }
  } else {
    skills = showSkillsOnCV ? parseSkillsSection(sections.skills) : [];
  }
  const certifications = parseCertificationsSection(sections.certifications);
  const languages = parseLanguagesSection(sections.languages);
  const hobbies = parseHobbiesSection(sections.hobbies);

  const fallbackLanguages = Array.isArray(baseData?.languages)
    ? baseData.languages.map((lang: any) =>
        typeof lang === 'string' ? { name: lang } : lang
      )
    : [];
  const fallbackCertifications = Array.isArray(baseData?.certifications)
    ? baseData.certifications.map((cert: any) =>
        typeof cert === 'string' ? { name: cert } : cert
      )
    : [];

  const composedName = `${sections.firstName} ${sections.lastName}`.trim();
  const personalInfo = {
    ...(baseData?.personalInfo || {}),
    name: composedName || baseData?.personalInfo?.name || '',
    email: sections.email || baseData?.personalInfo?.email || '',
    phone: sections.phone || baseData?.personalInfo?.phone || '',
    location: sections.location || baseData?.personalInfo?.location || '',
    linkedin: sections.linkedin || baseData?.personalInfo?.linkedin || '',
    title: sections.jobTitleLabel || baseData?.personalInfo?.title || '',
  };

  return {
    ...baseData,
    personalInfo,
    summary: sections.summary || baseData?.summary || '',
    experience: experience.length ? experience : baseData?.experience || [],
    education: education.length ? education : baseData?.education || [],
    skills: skills.length ? skills : baseData?.skills || [],
    certifications: certifications.length ? certifications : fallbackCertifications,
    languages: languages.length ? languages : fallbackLanguages,
    hobbies: hobbies.length ? hobbies : baseData?.hobbies || [],
  };
};

const flattenSectionContent = (sections: CVSectionData) => {
  const personalBlock = [
    `${sections.firstName} ${sections.lastName}`.trim(),
    sections.jobTitleLabel,
    sections.email,
    sections.phone,
    sections.location,
    sections.linkedin,
  ].filter(Boolean).join('\n');

  return [
    personalBlock,
    sections.summary,
    sections.experience,
    sections.education,
    sections.skills,
    sections.certifications,
    sections.languages,
    sections.hobbies,
    sections.keywords,
  ]
    .filter(Boolean)
    .join('\n\n');
};

const LOGO_PLACEHOLDER = '/images/logo-placeholder.svg';

type AnalysisLogoExtensions = {
  companyLogo?: string | null;
  jobLogo?: string | null;
  jobLogoUrl?: string | null;
  job_summary?: PremiumATSAnalysis['job_summary'] & {
    companyLogo?: string | null;
    logo?: string | null;
    logoUrl?: string | null;
  };
};

const getDomainFromCompanyName = (name?: string | null) => {
  if (!name) return null;
  try {
    const slug = name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) return null;
    return `${slug}.com`;
  } catch {
    return null;
  }
};

const getCompanyLogoUrl = (company?: string | null) => {
  const domain = getDomainFromCompanyName(company);
  if (!domain) return LOGO_PLACEHOLDER;
  return `https://logo.clearbit.com/${domain}`;
};

const resolveCompanyLogo = (analysis: PremiumATSAnalysis | null) => {
  if (!analysis) return LOGO_PLACEHOLDER;
  const extended = analysis as PremiumATSAnalysis & AnalysisLogoExtensions;
  return (
    extended.companyLogo ||
    extended.jobLogo ||
    extended.jobLogoUrl ||
    extended.job_summary?.companyLogo ||
    extended.job_summary?.logo ||
    extended.job_summary?.logoUrl ||
    getCompanyLogoUrl(analysis.company)
  );
};

export default function CVRewritePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [analysis, setAnalysis] = useState<PremiumATSAnalysis | null>(null);
  const [cvRewrite, setCvRewrite] = useState<CVRewrite | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('consulting');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');
  const [isCopied, setIsCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(70); // Zoom percentage - optimized for readability
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorWidth, setEditorWidth] = useState(600); // Editor width in px - 30/70 split (will be calculated on mount)
  const [isResizing, setIsResizing] = useState(false);
  
  // Font management
  const [selectedFont, setSelectedFont] = useState<FontFamily>('Times New Roman');
  const [fontSize, setFontSize] = useState<number>(11); // Base font size in pt
  
  // Structured CV data for editor
  const [cvSections, setCvSections] = useState<CVSectionData>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitleLabel: '',
    location: '',
    phone: '',
    linkedin: '',
    summary: '',
    experience: '',
    experiences: [],
    education: '',
    educations: [],
    skills: '',
    certifications: '',
    languages: '',
    hobbies: '',
    keywords: '',
  });

  // Parsed CV data for preview
  const [cvData, setCvData] = useState<any>(null);
  const [initialCvData, setInitialCvData] = useState<any>(null);

  // Section order for drag and drop
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'summary',
    'experience',
    'education',
    'skills',
    'certifications',
    'languages',
    'hobbies',
  ]);
  
  // A4 content fitting with ResizeObserver-based architecture
  // Must be after cvData declaration
  const {
    containerRef: previewRef,
    adjustedFontSize: autoAdjustedFontSize,
    reset: resetA4Fitter,
    triggerAdjustment: triggerA4Adjustment,
  } = useA4ContentFitter({
    enabled: !!cvData,
    debounceMs: 300,
  });

  // Global show skills on CV toggle
  const [showSkillsOnCV, setShowSkillsOnCV] = useState(true);

  // Fetch analysis
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', id));
        
        if (analysisDoc.exists()) {
          const data = analysisDoc.data() as PremiumATSAnalysis;
          setAnalysis({ ...data, id: analysisDoc.id });
          
          if (data.cv_rewrite) {
            setCvRewrite(data.cv_rewrite);
            initializeSections(data.cv_rewrite);
          }
        } else {
          toast.error('Analysis not found');
          navigate('/cv-analysis');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        toast.error('Failed to load analysis');
        navigate('/cv-analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id, currentUser, navigate]);

  // Initialize sections from CV rewrite
  const initializeSections = (rewrite: CVRewrite) => {
    console.log('🔍 Initializing sections from CV rewrite:', {
      hasRewrite: !!rewrite,
      rewriteKeys: rewrite ? Object.keys(rewrite) : [],
      hasInitialCV: !!rewrite?.initial_cv,
      initialCVLength: rewrite?.initial_cv?.length || 0,
      hasAnalysis: !!rewrite?.analysis,
      analysisKeys: rewrite?.analysis ? Object.keys(rewrite.analysis) : [],
      hasStructuredData: !!(rewrite as any).structured_data,
      structuredDataKeys: (rewrite as any).structured_data ? Object.keys((rewrite as any).structured_data) : []
    });
    
    // PRIORITÉ 1: Utiliser structured_data si disponible (format JSON structuré)
    const structuredData = (rewrite as any).structured_data;
    if (structuredData && structuredData.experiences && Array.isArray(structuredData.experiences)) {
      console.log('✅ Utilisation de structured_data (format JSON) - méthode la plus fiable');
      console.log(`   ${structuredData.experiences.length} expériences trouvées`);
      console.log(`   ${structuredData.educations?.length || 0} éducations trouvées`);
      
      // Utiliser directement structured_data
      const experiencesArray: CVSectionEntry[] = structuredData.experiences.map((exp: any, idx: number) => {
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : (exp.description || []);
        // Inclure le client dans le titre si disponible (priorité au client sur l'entreprise)
        const companyDisplay = exp.client ? exp.client : (exp.company || 'Unknown');
        const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
        return {
          id: exp.id || `exp-${idx}`,
          content: `### ${exp.title || 'Untitled'} - ${companyDisplay}${companySuffix}\n${exp.startDate || ''} – ${exp.endDate || 'Present'}\n${bullets.map((b: string) => `- ${b}`).join('\n')}`,
        };
      });
      
      const educationsArray: CVSectionEntry[] = (structuredData.educations || []).map((edu: any, idx: number) => ({
        id: edu.id || `edu-${idx}`,
        content: `### ${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}\n${edu.endDate || edu.year || ''}${edu.details ? `\n${edu.details}` : ''}`,
      }));
      
      const personalInfo = structuredData.personalInfo || {};
      const nameParts = (personalInfo.name || '').split(/\s+/).filter(Boolean);
      const extractedFirstName = personalInfo.firstName || nameParts[0] || '';
      const extractedLastName = personalInfo.lastName || nameParts.slice(1).join(' ') || '';
      
      const languagesString = Array.isArray(structuredData.languages)
        ? structuredData.languages.map((lang: any) => {
            if (typeof lang === 'string') return lang;
            const name = lang?.name || '';
            const level = lang?.level || lang?.proficiency;
            return level ? `${name} | ${level}` : name;
          }).filter(Boolean).join('\n')
        : '';
      
      const certificationsString = Array.isArray(structuredData.certifications)
        ? structuredData.certifications.map((cert: any) => {
            const header = `### ${cert.name || 'Certification'}${cert.issuer ? ` - ${cert.issuer}` : ''}`.trim();
            const yearLine = cert.date || cert.year ? `\n${cert.date || cert.year}` : '';
            const detailsLine = cert.details ? `\n${cert.details}` : '';
            return `${header}${yearLine}${detailsLine}`.trim();
          }).filter(Boolean).join('\n\n')
        : '';
      
      const nextSections: CVSectionData = {
        firstName: extractedFirstName,
        lastName: extractedLastName,
        email: personalInfo.email || '',
        jobTitleLabel: personalInfo.title || personalInfo.jobTitle || analysis?.jobTitle || '',
        location: personalInfo.location || '',
        phone: personalInfo.phone || '',
        linkedin: personalInfo.linkedin || '',
        summary: structuredData.summary || '',
        experience: experiencesArray.map(e => e.content).join('\n\n'),
        experiences: experiencesArray,
        education: educationsArray.map(e => e.content).join('\n\n'),
        educations: educationsArray,
        skills: Array.isArray(structuredData.skills) ? structuredData.skills.join(', ') : '',
        skillsEntries: Array.isArray(structuredData.skills)
          ? structuredData.skills.map((skill: string, idx: number) => ({
              id: `skill-${idx}`,
              name: skill,
              level: 'Intermediate' as const,
              showOnCV: true,
            }))
          : [],
        certifications: certificationsString,
        languages: languagesString,
        hobbies: Array.isArray(structuredData.hobbies) ? structuredData.hobbies.join(', ') : '',
        keywords: rewrite.analysis?.recommended_keywords?.join(', ') || '',
      };
      
      setCvSections(nextSections);
      
      // Créer initialCvData à partir de structured_data
      const initialCvDataFromStructured = {
        personalInfo: personalInfo,
        summary: structuredData.summary || '',
        experience: structuredData.experiences.map((exp: any) => ({
          id: exp.id,
          title: exp.title,
          company: exp.company,
          client: exp.client, // ← Préserver le champ client
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: /present|current/i.test(exp.endDate || ''),
          bullets: Array.isArray(exp.bullets) ? exp.bullets : (exp.description || []),
        })),
        education: structuredData.educations || [],
        skills: structuredData.skills || [],
        languages: structuredData.languages || [],
        certifications: structuredData.certifications || [],
      };
      
      setInitialCvData(initialCvDataFromStructured);
      setCvData(buildPreviewData(initialCvDataFromStructured, nextSections, showSkillsOnCV));
      
      console.log(`✅ Sections initialisées depuis structured_data: ${experiencesArray.length} expériences, ${educationsArray.length} éducations`);
      return;
    }
    
    // PRIORITÉ 2: Fallback sur parsing du markdown si structured_data n'est pas disponible
    console.log('⚠️ structured_data non disponible, fallback sur parsing markdown');
    
    // If initial_cv is empty or missing, use the raw markdown directly
    if (!rewrite?.initial_cv || rewrite.initial_cv.length < 50) {
      console.warn('⚠️ initial_cv is empty or too short, cannot parse CV data');
      toast.error('CV rewrite data is incomplete. Please regenerate the CV.');
      return;
    }
    
    const parsed = parseCVData(rewrite);
    
    // Fallback: Si seulement 1 expérience détectée, vérifier manuellement le markdown
    let finalParsed = parsed;
    if (parsed.experience && parsed.experience.length === 1) {
      // Compter les headers ### dans la section Experience
      const experienceSectionMatch = rewrite.initial_cv.match(/##\s+Professional Experience\s*\n([\s\S]*?)(?=\n##|$)/i);
      if (experienceSectionMatch) {
        const experienceSection = experienceSectionMatch[1];
        const experienceHeaders = experienceSection.match(/###\s+/g);
        const headerCount = experienceHeaders ? experienceHeaders.length : 0;
        
        if (headerCount > 1) {
          console.warn(`⚠️ ${headerCount} headers ### détectés mais seulement 1 expérience parsée. Réessayer le parsing...`);
          // Réessayer le parsing en forçant la détection
          const reParsed = parseCVData(rewrite);
          if (reParsed.experience && reParsed.experience.length > parsed.experience.length) {
            console.log(`✅ Réparsing réussi: ${reParsed.experience.length} expériences détectées`);
            finalParsed = reParsed;
          }
        }
      }
    }
    
    console.log('✅ Parsed CV data:', {
      hasName: !!finalParsed.personalInfo?.name,
      hasSummary: !!finalParsed.summary,
      experienceCount: finalParsed.experience?.length || 0,
      educationCount: finalParsed.education?.length || 0,
      skillsCount: finalParsed.skills?.length || 0,
      experiences: finalParsed.experience?.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        bulletsCount: exp.bullets?.length || 0,
      })) || [],
    });
    
    // Vérifier que plusieurs expériences ont été détectées
    if (finalParsed.experience && finalParsed.experience.length > 1) {
      console.log(`✅ ${finalParsed.experience.length} expériences détectées dans le CV réécrit`);
    } else if (finalParsed.experience && finalParsed.experience.length === 1) {
      console.warn(`⚠️ Seulement 1 expérience détectée. Vérifier le format du markdown.`);
      console.log('Markdown preview:', rewrite.initial_cv.substring(0, 1000));
    }
    
    setInitialCvData(finalParsed);
    
    const languagesString = Array.isArray(finalParsed.languages)
      ? finalParsed.languages
          .map((lang: any) => {
            if (typeof lang === 'string') return lang;
            const name = lang?.name || '';
            const level = lang?.level || lang?.proficiency;
            return level ? `${name} | ${level}` : name;
          })
          .filter(Boolean)
          .join('\n')
      : '';
    
    const certificationsString = Array.isArray(finalParsed.certifications)
      ? finalParsed.certifications
          .map((cert: CertificationEntry) => {
            const header = `### ${cert.name || 'Certification'}${cert.issuer ? ` - ${cert.issuer}` : ''}`.trim();
            const yearLine = cert.year ? `\n${cert.year}` : '';
            const detailsLine = cert.details ? `\n${cert.details}` : '';
            return `${header}${yearLine}${detailsLine}`.trim();
          })
          .filter(Boolean)
          .join('\n\n')
      : '';

    const personalInfo = finalParsed.personalInfo || {};
    const nameParts = (personalInfo.name || '').split(/\s+/).filter(Boolean);
    const fallbackFirstName = nameParts[0] || '';
    const fallbackLastName = nameParts.slice(1).join(' ');
    const extractedFirstName = personalInfo.firstName || fallbackFirstName;
    const extractedLastName = personalInfo.lastName || fallbackLastName;

    // Créer un array d'expériences au lieu d'une string concaténée
    // S'assurer que finalParsed.experience est un array
    let experiencesArray: CVSectionEntry[] = (finalParsed.experience || []).map((exp: any, idx: number) => {
      const bullets = exp.bullets || exp.description || [];
      // Inclure le client dans le titre si disponible (priorité au client sur l'entreprise)
      const companyDisplay = exp.client ? exp.client : (exp.company || 'Unknown');
      const companySuffix = exp.client && exp.company && exp.company !== exp.client ? ` (via ${exp.company})` : '';
      return {
        id: exp.id || `exp-${idx}`,
        content: `### ${exp.title || 'Untitled'} - ${companyDisplay}${companySuffix}\n${exp.startDate || ''} – ${exp.endDate || 'Present'}\n${bullets.map((b: string) => `- ${b}`).join('\n')}`,
      };
    });
    
    // Si on n'a qu'une seule expérience, vérifier le markdown original pour détecter plusieurs ### headers
    if (experiencesArray.length === 1) {
      console.log('⚠️ Seulement 1 expérience détectée, vérification du markdown pour détecter plusieurs headers ###...');
      
      // Extraire la section Experience du markdown original
      const experienceSectionMatch = rewrite.initial_cv.match(/##\s+Professional Experience\s*\n([\s\S]*?)(?=\n##|$)/i);
      if (experienceSectionMatch) {
        const experienceSection = experienceSectionMatch[1];
        const allHeaders = experienceSection.match(/^###\s+(.+)$/gm);
        
        if (allHeaders && allHeaders.length > 1) {
          console.log(`🔍 Détecté ${allHeaders.length} headers ### dans le markdown, parsing manuel...`);
          
          // Parser manuellement chaque bloc ###
          const blocks = experienceSection.split(/\n(?=###\s+)/).map(b => b.trim()).filter(Boolean);
          
          experiencesArray = blocks.map((block, idx) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            if (!lines.length) return null;
            
            const headerLine = lines[0].replace(/^###\s*/, '');
            const [title, ...companyParts] = headerLine.split(/\s*[-–—]\s*/);
            const company = companyParts.join(' - ').trim();
            
            // Trouver la ligne de dates
            let periodLine = '';
            const bullets: string[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!periodLine && !line.startsWith('-') && !line.startsWith('•') && !line.startsWith('*')) {
                if (line.match(/\d{4}|Present|Current|months?/i)) {
                  periodLine = line;
                  continue;
                }
              }
              if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                bullets.push(line.replace(/^[-•*]\s*/, '').trim());
              }
            }
            
            // Essayer d'extraire le client depuis le company (peut contenir "Client (via Company)")
            const clientMatch = company.match(/^(.+?)\s*\(via\s+(.+)\)$/i);
            const extractedClient = clientMatch ? clientMatch[1].trim() : null;
            const extractedCompany = clientMatch ? clientMatch[2].trim() : company;
            const companyDisplay = extractedClient || extractedCompany || 'Unknown';
            const companySuffix = extractedClient && extractedCompany && extractedCompany !== extractedClient ? ` (via ${extractedCompany})` : '';
            
            return {
              id: `exp-${idx}`,
              content: `### ${title || 'Untitled'} - ${companyDisplay}${companySuffix}\n${periodLine || '2018 – Present'}\n${bullets.map(b => `- ${b}`).join('\n')}`,
            };
          }).filter(Boolean) as CVSectionEntry[];
          
          console.log(`✅ Parsing manuel réussi: ${experiencesArray.length} expériences créées`);
        } else {
          // Essayer de détecter des projets dans le contenu de l'expérience unique
          const singleExp = experiencesArray[0];
          const content = singleExp.content;
          const allLines = content.split('\n');
          
          // Chercher des patterns comme "Ayvens", "Danone", "Technicolor" dans les lignes
          const projectNames = ['Ayvens', 'Danone', 'Technicolor', 'Société Générale'];
          const detectedProjects: Array<{name: string; startLine: number; endLine?: number}> = [];
          
          allLines.forEach((line, idx) => {
            projectNames.forEach(projectName => {
              if (line.includes(projectName) && !line.startsWith('-') && !line.startsWith('###')) {
                // Vérifier si c'est une nouvelle section de projet
                const isProjectHeader = /^[A-Z]/.test(line.trim()) && line.length < 100;
                if (isProjectHeader) {
                  detectedProjects.push({
                    name: projectName,
                    startLine: idx,
                  });
                }
              }
            });
          });
          
          if (detectedProjects.length > 1) {
            console.log(`🔍 Détecté ${detectedProjects.length} projets par nom dans le contenu, division...`);
            // Pour l'instant, on garde l'approche de parsing manuel des headers ###
          }
        }
      }
    }
    
    let educationsArray: CVSectionEntry[] = (finalParsed.education || []).map((edu: any, idx: number) => ({
      id: edu.id || `edu-${idx}`,
      content: `### ${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}\n${edu.year || edu.endDate || ''}${edu.details ? `\n${edu.details}` : ''}`,
    }));
    
    // Si on n'a qu'une seule éducation, vérifier le markdown original pour détecter plusieurs ### headers
    if (educationsArray.length === 1) {
      console.log('⚠️ Seulement 1 éducation détectée, vérification du markdown pour détecter plusieurs headers ###...');
      
      // Extraire la section Education du markdown original
      const educationSectionMatch = rewrite.initial_cv.match(/##\s+Education\s*\n([\s\S]*?)(?=\n##|$)/i);
      if (educationSectionMatch) {
        const educationSection = educationSectionMatch[1];
        const allHeaders = educationSection.match(/^###\s+(.+)$/gm);
        
        if (allHeaders && allHeaders.length > 1) {
          console.log(`🔍 Détecté ${allHeaders.length} headers ### dans la section Education, parsing manuel...`);
          
          // Parser manuellement chaque bloc ###
          const blocks = educationSection.split(/\n(?=###\s+)/).map(b => b.trim()).filter(Boolean);
          
          educationsArray = blocks.map((block, idx) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            if (!lines.length) return null;
            
            const headerLine = lines[0].replace(/^###\s*/, '');
            const [degree, ...institutionParts] = headerLine.split(/\s*[-–—]\s*/);
            const institution = institutionParts.join(' - ').trim();
            
            // Trouver la ligne de dates/année
            let yearLine = '';
            const details: string[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!yearLine && !line.startsWith('-') && !line.startsWith('•')) {
                if (line.match(/\d{4}/) || line.length < 20) {
                  yearLine = line;
                  continue;
                }
              }
              if (line && !line.startsWith('-') && !line.startsWith('•')) {
                details.push(line);
              }
            }
            
            return {
              id: `edu-${idx}`,
              content: `### ${degree || 'Degree'} - ${institution || 'Institution'}\n${yearLine || ''}${details.length > 0 ? `\n${details.join('\n')}` : ''}`,
            };
          }).filter(Boolean) as CVSectionEntry[];
          
          console.log(`✅ Parsing manuel réussi: ${educationsArray.length} éducations créées`);
        }
      }
    }
    
    console.log(`✅ Créé ${experiencesArray.length} entrées d'expériences pour l'UI`);
    console.log(`✅ Créé ${educationsArray.length} entrées d'éducations pour l'UI`);

    const nextSections: CVSectionData = {
      firstName: extractedFirstName,
      lastName: extractedLastName,
      email: personalInfo.email || '',
      jobTitleLabel: personalInfo.title || personalInfo.jobTitle || analysis?.jobTitle || '',
      location: personalInfo.location || '',
      phone: personalInfo.phone || '',
      linkedin: personalInfo.linkedin || '',
      summary: finalParsed.summary || '',
      experience: experiencesArray.map(e => e.content).join('\n\n'), // Pour compatibilité
      experiences: experiencesArray, // NOUVEAU: array d'expériences
      education: educationsArray.map(e => e.content).join('\n\n'), // Pour compatibilité
      educations: educationsArray, // NOUVEAU: array d'éducations
      skills: (finalParsed.skills || []).join(', '),
      skillsEntries: (finalParsed.skills || []).map((skill: string, idx: number) => ({
        id: `skill-${idx}`,
        name: skill,
        level: 'Intermediate' as const,
        showOnCV: true,
      })),
      certifications: certificationsString,
      languages: languagesString,
      hobbies: Array.isArray(finalParsed.hobbies) ? finalParsed.hobbies.join(', ') : '',
      keywords: rewrite.analysis?.recommended_keywords?.join(', ') || '',
    };
    
    setCvSections(nextSections);
    setCvData(buildPreviewData(finalParsed, nextSections, showSkillsOnCV));
    
    console.log('✅ Sections initialized successfully');
  };

  // Track dragging state to prevent preview updates during drag
  const [isDragging, setIsDragging] = useState(false);

  // Update CV data when sections change (but not during drag for performance)
  useEffect(() => {
    if (!initialCvData || isDragging) return;
    setCvData(buildPreviewData(initialCvData, cvSections, showSkillsOnCV));
  }, [cvSections, initialCvData, isDragging, showSkillsOnCV]);

  // Generate CV rewrite
  const handleGenerateRewrite = async () => {
    if (!analysis) return;
    
    if (!analysis.cvText || !analysis.jobDescription) {
      toast.error('This analysis is missing required data. Please run a new analysis.', {
        duration: 6000
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await generateCVRewrite({
        cvText: analysis.cvText,
        jobDescription: analysis.jobDescription,
        atsAnalysis: {
          strengths: analysis.top_strengths.map(s => s.name),
          gaps: analysis.top_gaps.map(g => g.name),
          keywords: analysis.match_breakdown.keywords.missing || [],
          matchScore: analysis.matchScore,
        },
        jobTitle: analysis.jobTitle,
        company: analysis.company,
      });
      
      setCvRewrite(result);
      initializeSections(result);
      
      // Validation avant sauvegarde
      const parsedCV = parseCVData(result);
      const parsingValidation = validateParsedCV(parsedCV);
      const qualityReport = checkCVQuality(parsedCV, {
        jobTitle: analysis.jobTitle,
        company: analysis.company,
        keywords: analysis.match_breakdown.keywords.missing || [],
        jobDescription: analysis.jobDescription,
      });
      
      // Afficher les erreurs critiques
      if (!parsingValidation.isValid) {
        console.error('Parsing validation errors:', parsingValidation.errors);
        toast.error(`CV rewrite has validation errors: ${parsingValidation.errors.join(', ')}`, {
          duration: 8000,
        });
        // Ne pas sauvegarder si erreurs critiques
        return;
      }
      
      // Afficher les warnings
      if (parsingValidation.warnings.length > 0) {
        console.warn('Parsing validation warnings:', parsingValidation.warnings);
        toast.warning(`${parsingValidation.warnings.length} parsing warnings detected. Check console.`, {
          duration: 6000,
        });
      }
      
      // Afficher le rapport de qualité
      if (qualityReport.score < 80) {
        const criticalIssues = qualityReport.issues.filter(i => i.type === 'error' || i.type === 'warning');
        if (criticalIssues.length > 0) {
          console.warn('CV Quality Report:', qualityReport);
          toast.warning(`CV quality score: ${qualityReport.score}/100. ${criticalIssues.length} issues found.`, {
            duration: 6000,
          });
        }
      } else {
        console.log('CV Quality Report:', qualityReport);
        toast.success(`CV quality score: ${qualityReport.score}/100`, {
          duration: 3000,
        });
      }
      
      // Save to Firestore
      if (currentUser && id) {
        await updateDoc(doc(db, 'users', currentUser.uid, 'analyses', id), {
          cv_rewrite: result,
          cv_rewrite_validation: {
            parsing: parsingValidation,
            quality: qualityReport,
            validated_at: new Date().toISOString(),
          },
        });
      }
      
      toast.success('CV rewritten successfully!');
    } catch (error: any) {
      console.error('Error generating CV rewrite:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('API key')) {
        toast.error('Please run a new ATS analysis to automatically generate CV rewrite.', {
          duration: 6000
        });
      } else {
        toast.error(`Failed to generate: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle AI section rewriting with FULL context
  const handleAIAction = async (action: string, sectionType: string, currentContent: string): Promise<string> => {
    if (!analysis) throw new Error('Analysis not found');
    
    // Build complete CV from all sections for context
    const fullCVText = `
# ${cvData?.personalInfo?.name || 'Professional CV'}

${cvData?.personalInfo?.email || ''} | ${cvData?.personalInfo?.phone || ''}

## Professional Summary
${cvSections.summary}

## Work Experience
${cvSections.experience}

## Education
${cvSections.education}

## Skills
${cvSections.skills}

${cvSections.certifications ? `## Certifications\n${cvSections.certifications}` : ''}
${cvSections.languages ? `## Languages\n${cvSections.languages}` : ''}
${cvSections.hobbies ? `## Hobbies & Interests\n${cvSections.hobbies}` : ''}
    `.trim();
    
    return await rewriteSection({
      sectionType,
      currentContent,
      action,
      fullCV: fullCVText,
      jobContext: {
        jobTitle: analysis.jobTitle,
        company: analysis.company,
        jobDescription: analysis.jobDescription,
        keywords: analysis.match_breakdown.keywords.missing || [],
        strengths: analysis.top_strengths.map(s => s.name),
        gaps: analysis.top_gaps.map(g => g.name),
      },
    });
  };

  // Update section
  const updateSection = (sectionKey: keyof CVSectionData, newContent: string) => {
    setCvSections(prev => ({
      ...prev,
      [sectionKey]: newContent,
    }));
  };

  // Handle drag end for sections - Optimisé pour éviter le freeze
  const handleSectionDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (destination.index === source.index) return;

    if (type === 'SECTION') {
      // Mise à jour immédiate de l'état (sans freeze)
      const newOrder = Array.from(sectionOrder);
      const [removed] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, removed);
      
      // Utiliser requestAnimationFrame pour différer les mises à jour lourdes
      requestAnimationFrame(() => {
        setSectionOrder(newOrder);
        // Mettre à jour le preview après l'animation de drop
        requestAnimationFrame(() => {
          if (initialCvData) {
            setCvData(buildPreviewData(initialCvData, cvSections, showSkillsOnCV));
          }
        });
      });
      
      toast.success('Section reordered');
    }
  };

  // Handle drag end for experiences - Optimisé pour éviter le freeze
  const handleExperienceDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.index === source.index) return;

    const experiences = [...(cvSections.experiences || [])];
    const [removed] = experiences.splice(source.index, 1);
    experiences.splice(destination.index, 0, removed);

    // Mise à jour immédiate de l'état
    const updatedSections = {
      ...cvSections,
      experiences,
      experience: experiences.map(e => e.content).join('\n\n'),
    };
    
    setCvSections(updatedSections);
    
    // Mettre à jour le preview après l'animation de drop
    requestAnimationFrame(() => {
      if (initialCvData) {
        setCvData(buildPreviewData(initialCvData, updatedSections, showSkillsOnCV));
      }
    });
    
    toast.success('Experience reordered');
  };

  // Handle drag end for educations - Optimisé pour éviter le freeze
  const handleEducationDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.index === source.index) return;

    const educations = [...(cvSections.educations || [])];
    const [removed] = educations.splice(source.index, 1);
    educations.splice(destination.index, 0, removed);

    // Mise à jour immédiate de l'état
    const updatedSections = {
      ...cvSections,
      educations,
      education: educations.map(e => e.content).join('\n\n'),
    };
    
    setCvSections(updatedSections);
    
    // Mettre à jour le preview après l'animation de drop
    requestAnimationFrame(() => {
      if (initialCvData) {
        setCvData(buildPreviewData(initialCvData, updatedSections, showSkillsOnCV));
      }
    });
    
    toast.success('Education reordered');
  };

  // Handle drag end for skills - Optimisé pour éviter le freeze
  const handleSkillDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.index === source.index) return;

    const skills = [...(cvSections.skillsEntries || [])];
    const [removed] = skills.splice(source.index, 1);
    skills.splice(destination.index, 0, removed);

    // Mise à jour immédiate de l'état
    const updatedSections = {
      ...cvSections,
      skillsEntries: skills,
      skills: skills.map(s => s.name).join(', '), // Update compatibility string
    };
    
    setCvSections(updatedSections);
    
    // Mettre à jour le preview après l'animation de drop
    requestAnimationFrame(() => {
      if (initialCvData) {
        setCvData(buildPreviewData(initialCvData, updatedSections, showSkillsOnCV));
      }
    });
    
    toast.success('Skill reordered');
  };

  const handlePersonalFieldChange = (
    field: 'firstName' | 'lastName' | 'email' | 'jobTitleLabel' | 'location' | 'phone' | 'linkedin',
    value: string
  ) => {
    setCvSections(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Download PDF
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      // TODO: Use proper PDF generation from preview
      const content = flattenSectionContent(cvSections);
      doc.text(content, 20, 20, { maxWidth: 170 });
      doc.save(`${analysis?.jobTitle}_${analysis?.company}_CV.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      const content = flattenSectionContent(cvSections);
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Translate
  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const targetLang = currentLanguage === 'en' ? 'fr' : 'en';
      const content = flattenSectionContent(cvSections);
      await translateCV(content, targetLang);
      
      // TODO: Split translated content back into sections
      toast.success(`Translated to ${targetLang === 'en' ? 'English' : 'French'}!`);
      setCurrentLanguage(targetLang);
    } catch (error: any) {
      toast.error(error.message || 'Translation failed', { duration: 5000 });
    } finally {
      setIsTranslating(false);
    }
  };

  // Zoom handlers
  const handleZoomStep = (direction: 'in' | 'out') => {
    const currentIndex = PREVIEW_ZOOM_LEVELS.findIndex(level => level === previewZoom);
    if (currentIndex === -1) {
      setPreviewZoom(70);
      return;
    }
    if (direction === 'in' && currentIndex < PREVIEW_ZOOM_LEVELS.length - 1) {
      setPreviewZoom(PREVIEW_ZOOM_LEVELS[currentIndex + 1]);
    }
    if (direction === 'out' && currentIndex > 0) {
      setPreviewZoom(PREVIEW_ZOOM_LEVELS[currentIndex - 1]);
    }
  };
  const handleZoomIn = () => handleZoomStep('in');
  const handleZoomOut = () => handleZoomStep('out');
  const handleZoomPreset = (value: number) => {
    if (PREVIEW_ZOOM_LEVELS.includes(value as (typeof PREVIEW_ZOOM_LEVELS)[number])) {
      setPreviewZoom(value);
    }
  };
  const handleResetZoom = () => setPreviewZoom(70);

  // Reset font size when template changes
  useEffect(() => {
    const defaultFontSizes: Record<TemplateType, number> = {
      harvard: 11,
      notion: 10.5,
      consulting: 10,
    };
    const newFontSize = defaultFontSizes[selectedTemplate];
    setFontSize(newFontSize);
    // Reset A4 fitter when template changes
    resetA4Fitter(newFontSize, selectedTemplate, selectedFont);
  }, [selectedTemplate, selectedFont, resetA4Fitter]);

  // Trigger adjustment when CV data changes (user edits content)
  useEffect(() => {
    if (!cvData) return;
    // Debounce to avoid adjusting on every keystroke
    const timeoutId = setTimeout(() => {
      triggerA4Adjustment(fontSize, selectedTemplate, selectedFont);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [cvData, triggerA4Adjustment, fontSize, selectedTemplate, selectedFont]);

  // Reset and trigger adjustment when font changes
  useEffect(() => {
    resetA4Fitter(fontSize, selectedTemplate, selectedFont);
  }, [selectedFont, fontSize, selectedTemplate, resetA4Fitter]);

  // Resize handlers with useCallback to fix dependencies
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Calculate new width based on mouse position
    const container = document.getElementById('cv-rewrite-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Constrain between 480px (base) and 900px (max)
    const constrainedWidth = Math.max(480, Math.min(900, newWidth));
    setEditorWidth(constrainedWidth);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const previewScale = previewZoom / 100;
  const scaledWidth = A4_WIDTH_PX * previewScale;
  const scaledHeight = A4_HEIGHT_PX * previewScale;

  // Calculate initial editor width to 30% of container on mount
  useEffect(() => {
    const calculateInitialWidth = () => {
      const container = document.getElementById('cv-rewrite-container');
      if (container) {
        const containerWidth = container.offsetWidth;
        // 30% of container width, accounting for gap (gap-4 = 16px)
        const calculatedWidth = (containerWidth - 16) * 0.3;
        // Constrain between 480px (min) and 900px (max)
        const constrainedWidth = Math.max(480, Math.min(900, calculatedWidth));
        setEditorWidth(constrainedWidth);
      }
    };

    // Calculate on mount - use setTimeout to ensure container is rendered
    const timeoutId = setTimeout(calculateInitialWidth, 0);

    // Recalculate on window resize
    window.addEventListener('resize', calculateInitialWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateInitialWidth);
    };
  }, []);

  // Setup resize listeners
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      window.addEventListener('mousemove', handleResizeMove as any);
      window.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleResizeMove as any);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Loading state - Full screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading CV Rewrite...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">This analysis doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/cv-analysis')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg"
          >
            Back to Analyses
          </button>
        </div>
      </div>
    );
  }

  const companyLogoUrl = resolveCompanyLogo(analysis);
  const jobTitleDisplay = analysis.jobTitle;
  const companyDisplay = analysis.company;
  const companyAlt = companyDisplay ? `${companyDisplay} logo` : 'Company logo';

  const renderHeaderMeta = () => (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-11 h-11 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-[#111113] flex items-center justify-center overflow-hidden shadow-sm">
        <img
          src={companyLogoUrl}
          alt={companyAlt}
          className="w-full h-full object-cover"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).src = LOGO_PLACEHOLDER;
          }}
        />
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight truncate">
          {jobTitleDisplay}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {companyDisplay}
        </p>
      </div>
    </div>
  );

  const renderBackButton = () => (
    <button
      onClick={() => navigate(`/ats-analysis/${id}`)}
      className="h-11 w-11 flex items-center justify-center rounded-full border border-gray-200/70 dark:border-gray-800/70 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-all bg-white/70 dark:bg-[#111113]/70 backdrop-blur-sm"
      aria-label="Back to ATS analysis"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );

  // Generate landing page - Full screen
  if (!cvRewrite) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
        {/* Simple Header */}
        <div className="bg-white/95 dark:bg-[#1A1A1D]/95 border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              {renderBackButton()}
              {renderHeaderMeta()}
            </div>
          </div>
        </div>

          {/* Generation Card */}
          <div className="max-w-4xl mx-auto px-6 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1A1A1D] rounded-3xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-xl dark:shadow-2xl dark:shadow-purple-500/10"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25 dark:shadow-purple-500/40">
                <Wand2 className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                AI-Powered CV Rewrite
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed">
                Generate a professionally rewritten CV tailored for{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">{analysis.jobTitle}</span>
                {' '}at{' '}
                <span className="font-semibold text-purple-600 dark:text-purple-400">{analysis.company}</span>
              </p>

              {(!analysis.cvText || !analysis.jobDescription) && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        Older Analysis Detected
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-400">
                        This analysis was created before the CV Rewrite feature. For the best experience with automatic generation, please run a new ATS analysis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-2xl p-8 mb-8 border border-purple-200 dark:border-purple-900">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div className="text-left space-y-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      What makes this rewrite special:
                    </p>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Section-by-section AI rewriting with targeted improvements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Real-time PDF preview with 6 professional templates</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Smart keyword integration based on your ATS analysis</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Zero hallucination - only improves existing content</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Premium Apple/Notion-style editing experience</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateRewrite}
                disabled={isGenerating}
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 dark:shadow-purple-500/50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Your CV...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Rewritten CV
                  </>
                )}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Editor View - FULL SCREEN (No AuthLayout)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B]">
      {/* Premium Top Navigation Bar */}
      <div className="bg-white/95 dark:bg-[#1A1A1D]/95 border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[2000px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Back + Opportunity */}
            <div className="flex items-center gap-4 min-w-0">
              {renderBackButton()}
              {renderHeaderMeta()}
            </div>

            {/* Right: Premium Actions */}
            <div className="flex items-center gap-2.5">
              {/* Font Selector */}
              <div className="relative">
                <select
                  value={selectedFont}
                  onChange={(e) => {
                    setSelectedFont(e.target.value as FontFamily);
                    // Reset will be handled by useEffect watching selectedFont
                  }}
                  className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                  style={{ fontFamily: FONT_FAMILIES[selectedFont] }}
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Template Selector */}
              <div className="relative">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                  className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                >
                  <option value="consulting">Consulting</option>
                  <option value="harvard">Harvard</option>
                  <option value="notion">Notion</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Language */}
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-3.5 py-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {currentLanguage.toUpperCase()}
              </button>
              
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {/* Download PDF */}
              <button
                onClick={handleDownloadPDF}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center gap-2.5"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Premium Split Layout with Resizable */}
      <div className="max-w-[2000px] mx-auto px-10 py-12">
        <div id="cv-rewrite-container" className="flex gap-4 relative">
          {/* LEFT: AI-Guided Editor - Resizable */}
          <div 
            className="space-y-7 flex-shrink-0 transition-none"
            style={{ width: `${editorWidth}px` }}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Editor
                </h2>
              </div>
              <span className="px-3.5 py-1.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-full font-bold text-xs">
                {currentLanguage.toUpperCase()}
              </span>
            </div>

            <div className="bg-[#FAFAFA] dark:bg-[#1A1A1D] rounded-2xl border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400">
                    Personal Information
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Header details</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Auto-syncs with preview</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={cvSections.firstName}
                    onChange={(e) => handlePersonalFieldChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={cvSections.lastName}
                    onChange={(e) => handlePersonalFieldChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="e.g. Dupont"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={cvSections.jobTitleLabel}
                    onChange={(e) => handlePersonalFieldChange('jobTitleLabel', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="e.g. Senior Product Manager"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={cvSections.location}
                    onChange={(e) => handlePersonalFieldChange('location', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="e.g. Paris, France"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={cvSections.email}
                    onChange={(e) => handlePersonalFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={cvSections.phone}
                    onChange={(e) => handlePersonalFieldChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={cvSections.linkedin}
                    onChange={(e) => handlePersonalFieldChange('linkedin', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
              </div>
            </div>

            {/* Section Cards with Drag and Drop */}
            <DragDropContext
              onDragStart={() => {
                setIsDragging(true);
              }}
              onDragEnd={(result) => {
                const { type } = result;
                
                // Gérer le drop immédiatement
                if (type === 'SECTION') {
                  handleSectionDragEnd(result);
                } else if (type === 'EXPERIENCE') {
                  handleExperienceDragEnd(result);
                } else if (type === 'EDUCATION') {
                  handleEducationDragEnd(result);
                } else if (type === 'SKILL') {
                  handleSkillDragEnd(result);
                }
                
                // Réinitialiser l'état de drag après un court délai pour permettre l'animation
                requestAnimationFrame(() => {
                  setIsDragging(false);
                });
              }}
            >
              <Droppable droppableId="sections" type="SECTION">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-7 ${snapshot.isDraggingOver ? 'bg-purple-50/30 dark:bg-purple-950/10 rounded-2xl p-2' : ''}`}
                  >
                    {sectionOrder.map((sectionKey, sectionIndex) => {
                      // Render Summary
                      if (sectionKey === 'summary') {
                        return (
                          <DraggableSection
                            key="summary"
                            id="summary"
                            index={sectionIndex}
                            title="Professional Summary"
                          >
                            <EditorSectionCard
                              title="Professional Summary"
                              content={cvSections.summary}
                              sectionType="summary"
                              jobContext={{
                                jobTitle: analysis.jobTitle,
                                company: analysis.company,
                                keywords: cvRewrite.analysis.recommended_keywords,
                              }}
                              onChange={(newContent) => updateSection('summary', newContent)}
                              onAIAction={handleAIAction}
                            />
                          </DraggableSection>
                        );
                      }

                      // Render Experience
                      if (sectionKey === 'experience') {
                        if (cvSections.experiences && cvSections.experiences.length > 0) {
                          return (
                            <DraggableSection
                              key="experience"
                              id="experience"
                              index={sectionIndex}
                              title="Professional Experience"
                            >
                              <Droppable droppableId="experiences" type="EXPERIENCE">
                                {(expProvided, expSnapshot) => (
                                  <div
                                    ref={expProvided.innerRef}
                                    {...expProvided.droppableProps}
                                    className={`space-y-4 ${expSnapshot.isDraggingOver ? 'bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-2' : ''}`}
                                  >
                                    {(cvSections.experiences || []).map((exp, idx) => (
                                      <DraggableEntry key={exp.id} id={exp.id} index={idx}>
                                        <EditorSectionCard
                                          title={`Work Experience ${idx + 1}`}
                                          content={exp.content}
                                          sectionType="experience"
                                          jobContext={{
                                            jobTitle: analysis.jobTitle,
                                            company: analysis.company,
                                            keywords: cvRewrite.analysis.recommended_keywords,
                                          }}
                                          onChange={(newContent) => {
                                            const updated = [...(cvSections.experiences || [])];
                                            updated[idx] = { ...updated[idx], content: newContent };
                                            setCvSections({
                                              ...cvSections,
                                              experiences: updated,
                                              experience: updated.map(e => e.content).join('\n\n'),
                                            });
                                          }}
                                          onAIAction={handleAIAction}
                                        />
                                      </DraggableEntry>
                                    ))}
                                    {expProvided.placeholder}
                                    <button
                                      onClick={() => {
                                        const newExp: CVSectionEntry = {
                                          id: `exp-${cvSections.experiences?.length || 0}`,
                                          content: '### New Job Title - Company Name\nStart Date – End Date\n- Bullet point 1',
                                        };
                                        setCvSections({
                                          ...cvSections,
                                          experiences: [...(cvSections.experiences || []), newExp],
                                          experience: [...(cvSections.experiences || []), newExp].map(e => e.content).join('\n\n'),
                                        });
                                      }}
                                      className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Experience
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </DraggableSection>
                          );
                        } else {
                          return (
                            <DraggableSection
                              key="experience"
                              id="experience"
                              index={sectionIndex}
                              title="Professional Experience"
                            >
                              <EditorSectionCard
                                title="Work Experience"
                                content={cvSections.experience}
                                sectionType="experience"
                                jobContext={{
                                  jobTitle: analysis.jobTitle,
                                  company: analysis.company,
                                  keywords: cvRewrite.analysis.recommended_keywords,
                                }}
                                onChange={(newContent) => updateSection('experience', newContent)}
                                onAIAction={handleAIAction}
                              />
                            </DraggableSection>
                          );
                        }
                      }

                      // Render Education
                      if (sectionKey === 'education') {
                        if (cvSections.educations && cvSections.educations.length > 0) {
                          return (
                            <DraggableSection
                              key="education"
                              id="education"
                              index={sectionIndex}
                              title="Education"
                            >
                              <Droppable droppableId="educations" type="EDUCATION">
                                {(eduProvided, eduSnapshot) => (
                                  <div
                                    ref={eduProvided.innerRef}
                                    {...eduProvided.droppableProps}
                                    className={`space-y-4 ${eduSnapshot.isDraggingOver ? 'bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-2' : ''}`}
                                  >
                                    {(cvSections.educations || []).map((edu, idx) => (
                                      <DraggableEntry key={edu.id} id={edu.id} index={idx}>
                                        <EditorSectionCard
                                          title={`Education ${idx + 1}`}
                                          content={edu.content}
                                          sectionType="education"
                                          jobContext={{
                                            jobTitle: analysis.jobTitle,
                                            company: analysis.company,
                                            keywords: cvRewrite.analysis.recommended_keywords,
                                          }}
                                          onChange={(newContent) => {
                                            const updated = [...(cvSections.educations || [])];
                                            updated[idx] = { ...updated[idx], content: newContent };
                                            setCvSections({
                                              ...cvSections,
                                              educations: updated,
                                              education: updated.map(e => e.content).join('\n\n'),
                                            });
                                          }}
                                          onAIAction={handleAIAction}
                                        />
                                      </DraggableEntry>
                                    ))}
                                    {eduProvided.placeholder}
                                    <button
                                      onClick={() => {
                                        const newEdu: CVSectionEntry = {
                                          id: `edu-${cvSections.educations?.length || 0}`,
                                          content: '### Degree Name - Institution Name\n2020\nAdditional details',
                                        };
                                        setCvSections({
                                          ...cvSections,
                                          educations: [...(cvSections.educations || []), newEdu],
                                          education: [...(cvSections.educations || []), newEdu].map(e => e.content).join('\n\n'),
                                        });
                                      }}
                                      className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Education Entry
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </DraggableSection>
                          );
                        } else {
                          return (
                            <DraggableSection
                              key="education"
                              id="education"
                              index={sectionIndex}
                              title="Education"
                            >
                              <EditorSectionCard
                                title="Education"
                                content={cvSections.education}
                                sectionType="education"
                                jobContext={{
                                  jobTitle: analysis.jobTitle,
                                  company: analysis.company,
                                  keywords: cvRewrite.analysis.recommended_keywords,
                                }}
                                onChange={(newContent) => updateSection('education', newContent)}
                                onAIAction={handleAIAction}
                              />
                            </DraggableSection>
                          );
                        }
                      }

                      // Render Skills
                      if (sectionKey === 'skills') {
                        if (cvSections.skillsEntries && cvSections.skillsEntries.length > 0) {
                          return (
                            <DraggableSection
                              key="skills"
                              id="skills"
                              index={sectionIndex}
                              title="Skills"
                            >
                              {/* Global Show on CV Toggle */}
                              <div className="bg-[#FAFAFA] dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-4 mb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400 mb-1">
                                      Display Settings
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      Show Skills on CV
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newValue = !showSkillsOnCV;
                                      setShowSkillsOnCV(newValue);
                                      // Mettre à jour tous les skills avec la nouvelle valeur
                                      const updated = (cvSections.skillsEntries || []).map(skill => ({
                                        ...skill,
                                        showOnCV: newValue,
                                      }));
                                      const updatedSections = {
                                        ...cvSections,
                                        skillsEntries: updated,
                                      };
                                      setCvSections(updatedSections);
                                      // Mettre à jour le preview immédiatement
                                      if (initialCvData) {
                                        setCvData(buildPreviewData(initialCvData, updatedSections, newValue));
                                      }
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                      showSkillsOnCV
                                        ? 'bg-purple-600 dark:bg-purple-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                    role="switch"
                                    aria-checked={showSkillsOnCV}
                                  >
                                    <span
                                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                                        showSkillsOnCV ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    >
                                      {showSkillsOnCV && (
                                        <Check className="w-3 h-3 text-purple-600 absolute top-1 left-1" />
                                      )}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <Droppable droppableId="skills" type="SKILL">
                                {(skillProvided, skillSnapshot) => (
                                  <div
                                    ref={skillProvided.innerRef}
                                    {...skillProvided.droppableProps}
                                    className={`space-y-4 ${skillSnapshot.isDraggingOver ? 'bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-2' : ''}`}
                                  >
                                    {(cvSections.skillsEntries || []).map((skill, idx) => (
                                      <DraggableEntry key={skill.id} id={skill.id} index={idx}>
                                        <SkillEntryCard
                                          skill={skill}
                                          index={idx}
                                          onUpdate={(updatedSkill) => {
                                            const updated = [...(cvSections.skillsEntries || [])];
                                            updated[idx] = updatedSkill;
                                            const updatedSections = {
                                              ...cvSections,
                                              skillsEntries: updated,
                                              skills: updated.map(s => s.name).join(', '),
                                            };
                                            setCvSections(updatedSections);
                                            // Mettre à jour le preview immédiatement
                                            if (initialCvData) {
                                              setCvData(buildPreviewData(initialCvData, updatedSections, showSkillsOnCV));
                                            }
                                          }}
                                          onDelete={() => {
                                            const updated = (cvSections.skillsEntries || []).filter((_, i) => i !== idx);
                                            const updatedSections = {
                                              ...cvSections,
                                              skillsEntries: updated,
                                              skills: updated.map(s => s.name).join(', '),
                                            };
                                            setCvSections(updatedSections);
                                            // Mettre à jour le preview immédiatement
                                            if (initialCvData) {
                                              setCvData(buildPreviewData(initialCvData, updatedSections, showSkillsOnCV));
                                            }
                                          }}
                                        />
                                      </DraggableEntry>
                                    ))}
                                    {skillProvided.placeholder}
                                    <button
                                      onClick={() => {
                                        const newSkill: SkillEntry = {
                                          id: `skill-${cvSections.skillsEntries?.length || 0}`,
                                          name: '',
                                          level: 'Intermediate',
                                          showOnCV: showSkillsOnCV, // Utiliser la valeur globale
                                        };
                                        setCvSections({
                                          ...cvSections,
                                          skillsEntries: [...(cvSections.skillsEntries || []), newSkill],
                                          skills: [...(cvSections.skillsEntries || []), newSkill].map(s => s.name).join(', '),
                                        });
                                      }}
                                      className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Skill
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </DraggableSection>
                          );
                        } else {
                          return (
                            <DraggableSection
                              key="skills"
                              id="skills"
                              index={sectionIndex}
                              title="Skills"
                            >
                              <EditorSectionCard
                                title="Skills"
                                content={cvSections.skills}
                                sectionType="skills"
                                jobContext={{
                                  jobTitle: analysis.jobTitle,
                                  company: analysis.company,
                                  keywords: cvRewrite.analysis.recommended_keywords,
                                }}
                                onChange={(newContent) => {
                                  // Convertir la string en skillsEntries
                                  const skillsArray = parseSkillsSection(newContent).map((skill, idx) => ({
                                    id: `skill-${idx}`,
                                    name: skill,
                                    level: 'Intermediate' as const,
                                    showOnCV: true,
                                  }));
                                  setCvSections({
                                    ...cvSections,
                                    skills: newContent,
                                    skillsEntries: skillsArray,
                                  });
                                }}
                                onAIAction={handleAIAction}
                              />
                            </DraggableSection>
                          );
                        }
                      }

                      // Render Certifications
                      if (sectionKey === 'certifications') {
                        return (
                          <DraggableSection
                            key="certifications"
                            id="certifications"
                            index={sectionIndex}
                            title="Certifications"
                          >
                            <EditorSectionCard
                              title="Certifications"
                              content={cvSections.certifications}
                              sectionType="certifications"
                              jobContext={{
                                jobTitle: analysis.jobTitle,
                                company: analysis.company,
                                keywords: cvRewrite.analysis.recommended_keywords,
                              }}
                              onChange={(newContent) => updateSection('certifications', newContent)}
                              onAIAction={handleAIAction}
                            />
                          </DraggableSection>
                        );
                      }

                      // Render Languages
                      if (sectionKey === 'languages') {
                        return (
                          <DraggableSection
                            key="languages"
                            id="languages"
                            index={sectionIndex}
                            title="Languages"
                          >
                            <EditorSectionCard
                              title="Languages"
                              content={cvSections.languages}
                              sectionType="languages"
                              jobContext={{
                                jobTitle: analysis.jobTitle,
                                company: analysis.company,
                                keywords: cvRewrite.analysis.recommended_keywords,
                              }}
                              onChange={(newContent) => updateSection('languages', newContent)}
                              onAIAction={handleAIAction}
                            />
                          </DraggableSection>
                        );
                      }

                      // Render Hobbies
                      if (sectionKey === 'hobbies') {
                        return (
                          <DraggableSection
                            key="hobbies"
                            id="hobbies"
                            index={sectionIndex}
                            title="Hobbies & Interests"
                          >
                            <EditorSectionCard
                              title="Hobbies & Interests"
                              content={cvSections.hobbies}
                              sectionType="hobbies"
                              jobContext={{
                                jobTitle: analysis.jobTitle,
                                company: analysis.company,
                                keywords: cvRewrite.analysis.recommended_keywords,
                              }}
                              onChange={(newContent) => updateSection('hobbies', newContent)}
                              onAIAction={handleAIAction}
                            />
                          </DraggableSection>
                        );
                      }

                      return null;
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Resizable Divider */}
          <div
            onMouseDown={handleResizeStart}
            className={`w-1 flex-shrink-0 cursor-col-resize group relative ${
              isResizing ? 'bg-purple-400 dark:bg-purple-500' : 'bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600'
            } transition-colors`}
            style={{ 
              minWidth: '4px',
              marginLeft: '16px',
              marginRight: '16px'
            }}
          >
            {/* Visual indicator on hover */}
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-16 bg-purple-400 dark:bg-purple-500 rounded-full shadow-lg"></div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-xl">
                Drag to resize
              </div>
            </div>
          </div>

          {/* RIGHT: Premium Preview with Zoom - Takes remaining space */}
          <div className="relative flex-1 min-w-0">
            <AnimatePresence>
              {cvData && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="sticky top-28"
                >
                  {/* Preview Header with Zoom Controls */}
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Live Preview
                      </h2>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        • PDF-grade • Real-time • A4
                      </span>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleZoomOut}
                        disabled={previewZoom === PREVIEW_ZOOM_LEVELS[0]}
                        className="p-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>

                      <div className="flex rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-sm">
                        {PREVIEW_ZOOM_LEVELS.map((level) => (
                          <button
                            key={level}
                            onClick={() => handleZoomPreset(level)}
                            className={`px-3 py-1.5 text-xs font-semibold ${
                              previewZoom === level
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {level}%
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleZoomIn}
                        disabled={previewZoom === PREVIEW_ZOOM_LEVELS[PREVIEW_ZOOM_LEVELS.length - 1]}
                        className="p-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>

                      <button
                        onClick={handleResetZoom}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/70 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        Reset
                      </button>

                      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                        title="Fullscreen Preview"
                      >
                        <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Preview Container with Zoom */}
                  <div className="pb-2">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                      <div className="flex items-start justify-center py-10">
                        <div
                          className="relative"
                          style={{
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                          }}
                        >
                          <div
                            ref={previewRef}
                            className="bg-white dark:bg-white"
                            style={{
                              width: `${A4_WIDTH_PX}px`,
                              height: `${A4_HEIGHT_PX}px`,
                              maxHeight: `${A4_HEIGHT_PX}px`,
                              overflow: 'hidden',
                              transform: `scale(${previewScale})`,
                              transformOrigin: 'top left',
                              padding: '36px 44px',
                            }}
                          >
                            <PreviewPanel 
                              cvData={cvData} 
                              template={selectedTemplate}
                              fontFamily={selectedFont}
                              fontSize={autoAdjustedFontSize ?? fontSize}
                              sectionOrder={sectionOrder}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isFullscreen && cvData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[100] flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Zoom Controls in Fullscreen */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                disabled={previewZoom === PREVIEW_ZOOM_LEVELS[0]}
                className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <div className="flex rounded-2xl border border-white/30 overflow-hidden">
                {PREVIEW_ZOOM_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={(e) => { e.stopPropagation(); handleZoomPreset(level); }}
                    className={`px-3 py-1 text-xs font-semibold ${
                      previewZoom === level ? 'bg-white text-gray-900' : 'text-white/80'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                disabled={previewZoom === PREVIEW_ZOOM_LEVELS[PREVIEW_ZOOM_LEVELS.length - 1]}
                className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                className="px-3 py-1 text-xs font-semibold text-white/80 hover:text-white transition-all"
              >
                Reset
              </button>
            </div>

            <div className="overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div 
                className="bg-white dark:bg-white m-8"
                style={{
                  width: `${A4_WIDTH_PX}px`,
                  height: `${A4_HEIGHT_PX}px`,
                  maxHeight: `${A4_HEIGHT_PX}px`,
                  overflow: 'hidden',
                  padding: '36px 44px',
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <PreviewPanel 
                  cvData={cvData} 
                  template={selectedTemplate}
                  fontFamily={selectedFont}
                  fontSize={autoAdjustedFontSize ?? fontSize}
                  sectionOrder={sectionOrder}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
