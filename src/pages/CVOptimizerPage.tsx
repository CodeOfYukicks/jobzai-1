import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Briefcase, Building2, Sparkles, Upload, Check, X, 
  ChevronRight, Trash2, Loader2,
  Wand2, Calendar, Info, AlignLeft, Search, Filter, XCircle,
  ArrowUpDown, LayoutGrid, List, Globe2, ChevronDown
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, collection, query, orderBy, 
  addDoc, serverTimestamp, deleteDoc, onSnapshot, updateDoc 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { pdfToImages } from '../lib/pdfToImages';

interface OptimizedCV {
  id: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  date: string;
  userId: string;
  optimizedResumeMarkdown: string;
  atsScore?: number;
  keywordsUsed?: string[];
  changesSummary?: string[];
  shortSummary?: string;
  cvFileName?: string;
  language?: string;
}

export default function CVOptimizerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    jobUrl: '',
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [jobInputMode, setJobInputMode] = useState<'ai' | 'manual'>('ai');
  const [optimizedCVs, setOptimizedCVs] = useState<OptimizedCV[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('preparing');
  const [loadingMessage, setLoadingMessage] = useState<string>('Preparing CV optimization...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLLabelElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | '3months'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'company'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; cvId: string | null; cvTitle: string }>({
    isOpen: false,
    cvId: null,
    cvTitle: ''
  });
  const [openVersionDropdown, setOpenVersionDropdown] = useState<string | null>(null);
  useEffect(() => {
    const close = () => setOpenVersionDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Load saved optimized CVs
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'users', currentUser.uid, 'optimizedCVs'),
        orderBy('timestamp', 'desc')
      ),
      (snapshot) => {
        const cvs: OptimizedCV[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.deleted) {
            cvs.push({
              id: doc.id,
              ...data,
              date: data.date || formatDateString(new Date().toISOString().split('T')[0])
            } as OptimizedCV);
          }
        });
        setOptimizedCVs(cvs);
      },
      (error) => {
        console.error('Error loading optimized CVs:', error);
        toast.error('Unable to load optimized CVs');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Save optimized CV to Firestore
  const saveOptimizedCV = async (cv: Omit<OptimizedCV, 'id'>) => {
    if (!currentUser) return null;

    try {
      const cvToSave = {
        ...cv,
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        deleted: false
      };

      const docRef = await addDoc(
        collection(db, 'users', currentUser.uid, 'optimizedCVs'),
        cvToSave
      );

      toast.success('Optimized resume saved!');
      return docRef.id;
    } catch (error) {
      console.error('Error saving optimized CV:', error);
      toast.error('Unable to save optimized CV');
      return null;
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (cvId: string, cvTitle: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      cvId,
      cvTitle
    });
  };

  // Delete optimized CV
  const deleteOptimizedCV = async (cvId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cvId));
      setOptimizedCVs(prev => prev.filter(cv => cv.id !== cvId));
      toast.success('Optimized resume deleted');
      setDeleteConfirmModal({ isOpen: false, cvId: null, cvTitle: '' });
    } catch (error) {
      console.error('Error deleting optimized CV:', error);
      toast.error('Unable to delete optimized CV');
    }
  };

  // Filter, search and sort CVs
  const filteredAndSortedCVs = () => {
    let filtered = [...optimizedCVs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cv) => 
        cv.jobTitle.toLowerCase().includes(query) ||
        cv.company.toLowerCase().includes(query) ||
        (cv.keywordsUsed?.some(kw => kw.toLowerCase().includes(query))) ||
        false
      );
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter((cv) => {
        const score = cv.atsScore || 0;
        if (scoreFilter === 'high') return score >= 80;
        if (scoreFilter === 'medium') return score >= 65 && score < 80;
        if (scoreFilter === 'low') return score < 65;
        return true;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter((cv) => {
        try {
          const cvDate = new Date(cv.date);
          if (isNaN(cvDate.getTime())) return true; // If date is invalid, include it
          
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          cvDate.setHours(0, 0, 0, 0);
          const diffTime = now.getTime() - cvDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (dateFilter === 'week' && diffDays > 7) return false;
          if (dateFilter === 'month' && diffDays > 30) return false;
          if (dateFilter === '3months' && diffDays > 90) return false;
          return true;
        } catch (e) {
          // If date parsing fails, include the CV
          return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'score') {
        return (b.atsScore || 0) - (a.atsScore || 0);
      }
      if (sortBy === 'company') {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

    return filtered;
  };

  const filteredCVs = filteredAndSortedCVs();

  // Group CVs by jobTitle + company to show only one tile per job
  interface GroupedCV {
    jobKey: string; // jobTitle + company
    versions: OptimizedCV[];
    primaryCV: OptimizedCV; // The most recent or highest scored CV
  }

  const groupedCVs = (): GroupedCV[] => {
    const groups = new Map<string, OptimizedCV[]>();
    
    // Group all filtered CVs by jobTitle + company
    filteredCVs.forEach((cv) => {
      const key = `${cv.jobTitle}|||${cv.company}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(cv);
    });

    // Convert to array and select primary CV for each group
    const grouped = Array.from(groups.entries()).map(([jobKey, versions]) => {
      // Sort versions: most recent first, then by score
      versions.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.atsScore || 0) - (a.atsScore || 0);
      });
      
      return {
        jobKey,
        versions,
        primaryCV: versions[0] // Most recent or highest scored
      };
    });

    // Sort groups by the same criteria as filteredCVs
    grouped.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.primaryCV.date).getTime() - new Date(a.primaryCV.date).getTime();
      }
      if (sortBy === 'score') {
        return (b.primaryCV.atsScore || 0) - (a.primaryCV.atsScore || 0);
      }
      if (sortBy === 'company') {
        return a.primaryCV.company.localeCompare(b.primaryCV.company);
      }
      return 0;
    });

    return grouped;
  };

  const groupedCVsList = groupedCVs();

  // Extract job info from URL using Puppeteer

  // Gestion du fichier CV
  const handleFileUpload = (file: File | React.ChangeEvent<HTMLInputElement>) => {
    let fileToProcess: File;
    
    if (file instanceof File) {
      fileToProcess = file;
    } else {
      if (!file.target.files?.[0]) return;
      fileToProcess = file.target.files[0];
    }
    
    if (fileToProcess.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    
    setCvFile(fileToProcess);
    toast.success('Resume selected successfully');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Fallback: Extract text from a PDF using pdfjs if Vision API fails
  async function extractTextWithPDFJS(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Lazy import pdfjs to avoid bundling issues until needed
      const pdfjsLib = await import('pdfjs-dist');
      // Some builds expose getDocument under default, others as named
      const getDocument = (pdfjsLib as any).getDocument || (pdfjsLib as any).default.getDocument;
      const doc = await getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = (content as any).items?.map((it: any) => it.str) || [];
        fullText += strings.join(' ') + '\n\n';
      }
      return fullText.trim();
    } catch (err) {
      console.error('pdfjs text extraction failed', err);
      return '';
    }
  }

  // Local parser to convert AI markdown to structured CV data used by the editor
  function parseMarkdownToCVData(markdown: string) {
    const lines = markdown.split('\n');
    const cvData: any = {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        portfolio: '',
        jobTitle: '',
      },
      professionalSummary: '',
      experiences: [],
      educations: [],
      skills: [],
      languages: [],
      certificates: [],
      hobbies: [],
    };

    let currentSection = '';
    let currentExperience: any = null;
    let currentEducation: any = null;
    let experienceId = 0;
    let educationId = 0;
    let skillId = 0;
    let languageId = 0;
    let certificateId = 0;

    // Name
    const nameMatch = markdown.match(/^#\s*(.+?)$/m);
    if (nameMatch) {
      const nameParts = nameMatch[1].trim().split(/\s+/);
      if (nameParts.length >= 2) {
        cvData.personalInfo.firstName = nameParts[0];
        cvData.personalInfo.lastName = nameParts.slice(1).join(' ');
      } else {
        cvData.personalInfo.firstName = nameParts[0];
      }
    }
    // Email
    const emailMatch = markdown.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) cvData.personalInfo.email = emailMatch[1] || emailMatch[0];
    // Phone
    const phoneMatch = markdown.match(/(\+?\d[\d\s().-]{7,})/);
    if (phoneMatch) cvData.personalInfo.phone = (phoneMatch[1] || phoneMatch[0]).trim();
    // LinkedIn
    const liMatch = markdown.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/);
    if (liMatch) cvData.personalInfo.linkedin = liMatch[0].startsWith('http') ? liMatch[0] : `https://${liMatch[0]}`;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('# ')) {
        const title = line.substring(2).toLowerCase();
        if (title.includes('experience')) currentSection = 'experience';
        else if (title.includes('education')) currentSection = 'education';
        else if (title.includes('skill')) currentSection = 'skills';
        else if (title.includes('language')) currentSection = 'languages';
        else if (title.includes('certificate')) currentSection = 'certificates';
        else if (title.includes('hobbie') || title.includes('hobby') || title.includes('loisir')) currentSection = 'hobbies';
        else if (title.includes('summary') || title.includes('professional')) currentSection = 'summary';
        else currentSection = '';
      } else if (line.startsWith('## ')) {
        const title = line.substring(3).trim();
        if (currentSection === 'experience') {
          if (currentExperience) {
            cvData.experiences.push({
              id: `exp-${experienceId++}`,
              title: currentExperience.title || '',
              company: currentExperience.company || '',
              startDate: currentExperience.startDate || '',
              endDate: currentExperience.endDate || '',
              isCurrent: currentExperience.isCurrent || false,
              description: currentExperience.description || [],
              order: cvData.experiences.length,
            });
          }
          const m = title.match(/^(.+?)(?:\s*[-–—]\s*|\s+at\s+|\s+chez\s+)(.+)$/i);
          currentExperience = m ? { title: m[1].trim(), company: m[2].trim(), description: [] } : { title, company: '', description: [] };
        } else if (currentSection === 'education') {
          if (currentEducation) {
            cvData.educations.push({
              id: `edu-${educationId++}`,
              degree: currentEducation.degree || '',
              institution: currentEducation.institution || '',
              startDate: currentEducation.startDate || '',
              endDate: currentEducation.endDate || '',
              isCurrent: currentEducation.isCurrent || false,
              description: currentEducation.description,
              order: cvData.educations.length,
            });
          }
          const m = title.match(/^(.+?)(?:\s*[-–—]\s*|\s+at\s+|\s+à\s+)(.+)$/i);
          currentEducation = m ? { degree: m[1].trim(), institution: m[2].trim() } : { degree: title, institution: '' };
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const bullet = line.substring(2).trim();
        if (currentSection === 'experience' && currentExperience) {
          (currentExperience.description ||= []).push(bullet);
        } else if (currentSection === 'skills') {
          cvData.skills.push({ id: `skill-${skillId++}`, name: bullet.replace(/\s*-\s*(Beginner|Intermediate|Advanced|Expert).*/i, ''), level: 'Intermediate', order: cvData.skills.length });
        } else if (currentSection === 'languages') {
          cvData.languages.push({ id: `lang-${languageId++}`, name: bullet.split('-')[0].trim(), level: 'Intermediate', order: cvData.languages.length });
        } else if (currentSection === 'certificates') {
          cvData.certificates.push({ id: `cert-${certificateId++}`, name: bullet, issuer: '', date: '', order: cvData.certificates.length });
        } else if (currentSection === 'hobbies') {
          cvData.hobbies.push({ id: `hobby-${cvData.hobbies.length}`, name: bullet, order: cvData.hobbies.length });
        }
      } else if (line) {
        if (currentSection === 'summary') {
          cvData.professionalSummary += line + ' ';
        } else if (currentSection === 'experience' && currentExperience) {
          const m = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|Present|Présent|Actuel|Current)/i);
          if (m) {
            currentExperience.startDate = m[1];
            currentExperience.endDate = m[2];
            currentExperience.isCurrent = /present|présent|actuel|current/i.test(m[2]);
          } else if (!currentExperience.company) {
            currentExperience.company = line;
          }
        } else if (currentSection === 'education' && currentEducation) {
          const m = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|Present|Présent|Actuel|Current)/i);
          if (m) {
            currentEducation.startDate = m[1];
            currentEducation.endDate = m[2];
            currentEducation.isCurrent = /present|présent|actuel|current/i.test(m[2]);
          } else if (!currentEducation.institution) {
            currentEducation.institution = line;
          } else {
            currentEducation.description = (currentEducation.description || '') + line + ' ';
          }
        }
      }
    }
    if (currentExperience) {
      cvData.experiences.push({
        id: `exp-${experienceId++}`,
        title: currentExperience.title || '',
        company: currentExperience.company || '',
        startDate: currentExperience.startDate || '',
        endDate: currentExperience.endDate || '',
        isCurrent: currentExperience.isCurrent || false,
        description: currentExperience.description || [],
        order: cvData.experiences.length,
      });
    }
    if (currentEducation) {
      cvData.educations.push({
        id: `edu-${educationId++}`,
        degree: currentEducation.degree || '',
        institution: currentEducation.institution || '',
        startDate: currentEducation.startDate || '',
        endDate: currentEducation.endDate || '',
        isCurrent: currentEducation.isCurrent || false,
        description: (currentEducation.description || '').trim(),
        order: cvData.educations.length,
      });
    }
    cvData.professionalSummary = cvData.professionalSummary.trim();
    return cvData;
  }

  // Ensure optimized data keeps all original information and stays concise
  function enforceCompleteness(original: any, optimized: any) {
    const merged = JSON.parse(JSON.stringify(optimized || {}));

    // Helpers
    const toKey = (exp: any) =>
      `${(exp.title || '').toLowerCase()}|${(exp.company || '').toLowerCase()}|${(exp.startDate || '').toLowerCase()}|${(exp.endDate || '').toLowerCase()}`;
    const limitWords = (text: string, maxWords: number) => {
      if (!text) return '';
      const words = text.split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ');
    };
    const dedupeByName = (arr: any[] = []) => {
      const map = new Map<string, any>();
      for (const item of arr) {
        const key = (item.name || '').trim().toLowerCase();
        if (key && !map.has(key)) map.set(key, item);
      }
      return Array.from(map.values());
    };

    // Initialize required containers
    merged.personalInfo = merged.personalInfo || original.personalInfo || {};
    merged.professionalSummary = merged.professionalSummary || original.professionalSummary || '';
    merged.experiences = Array.isArray(merged.experiences) ? merged.experiences : [];
    merged.educations = Array.isArray(merged.educations) ? merged.educations : [];
    merged.skills = Array.isArray(merged.skills) ? merged.skills : [];
    merged.languages = Array.isArray(merged.languages) ? merged.languages : [];
    merged.certificates = Array.isArray(merged.certificates) ? merged.certificates : [];
    merged.hobbies = Array.isArray(merged.hobbies) ? merged.hobbies : [];

    // EXPERIENCES: ensure all original experiences are present
    const existingKeys = new Set(merged.experiences.map((e: any) => toKey(e)));
    for (const exp of original.experiences || []) {
      const key = toKey(exp);
      if (!existingKeys.has(key)) {
        // Add condensed copy
        merged.experiences.push({
          id: exp.id,
          title: exp.title,
          company: exp.company,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: !!exp.isCurrent,
          description: (exp.description || []).slice(0, 5).map((b: string) => limitWords(b, 20)),
          order: typeof exp.order === 'number' ? exp.order : merged.experiences.length,
        });
      }
    }

    // For all experiences: enforce concise bullets: 3-5 bullets, 20 words each
    merged.experiences = merged.experiences.map((e: any, idx: number) => {
      const bullets = Array.isArray(e.description) ? e.description : [];
      const trimmed = bullets.map((b: string) => limitWords(b, 20)).slice(0, Math.max(3, Math.min(5, bullets.length)));
      return {
        id: e.id || `exp-${idx}`,
        title: e.title || '',
        company: e.company || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        isCurrent: !!e.isCurrent,
        description: trimmed,
        order: typeof e.order === 'number' ? e.order : idx,
      };
    });

    // EDUCATIONS: union, preserve originals
    const eduKeys = new Set(merged.educations.map((e: any) => `${(e.degree || '').toLowerCase()}|${(e.institution || '').toLowerCase()}`));
    for (const edu of original.educations || []) {
      const k = `${(edu.degree || '').toLowerCase()}|${(edu.institution || '').toLowerCase()}`;
      if (!eduKeys.has(k)) {
        merged.educations.push({
          id: edu.id,
          degree: edu.degree,
          institution: edu.institution,
          startDate: edu.startDate,
          endDate: edu.endDate,
          isCurrent: !!edu.isCurrent,
          description: (edu.description || '').toString().slice(0, 300),
          order: typeof edu.order === 'number' ? edu.order : merged.educations.length,
        });
      }
    }

    // SKILLS/LANGUAGES/CERTIFICATES: make union and dedupe
    merged.skills = dedupeByName([...(merged.skills || []), ...(original.skills || [])]);
    merged.languages = dedupeByName([...(merged.languages || []), ...(original.languages || [])]);
    merged.certificates = dedupeByName([...(merged.certificates || []), ...(original.certificates || [])]);
    merged.hobbies = dedupeByName([...(merged.hobbies || []), ...(original.hobbies || [])]);

    return merged;
  }

  function serializeStructuredCVToMarkdown(cv: any): string {
    const lines: string[] = [];
    const name = [cv?.personalInfo?.firstName, cv?.personalInfo?.lastName].filter(Boolean).join(' ').trim();
    if (name) lines.push(`# ${name}`);

    // Contact line (compact)
    const contacts: string[] = [];
    if (cv?.personalInfo?.email) contacts.push(cv.personalInfo.email);
    if (cv?.personalInfo?.phone) contacts.push(cv.personalInfo.phone);
    if (cv?.personalInfo?.location) contacts.push(cv.personalInfo.location);
    if (cv?.personalInfo?.linkedin) contacts.push(cv.personalInfo.linkedin);
    if (contacts.length) {
      lines.push(contacts.join(' · '));
      lines.push('');
    }

    if (cv?.professionalSummary) {
      lines.push(`## Professional Summary`);
      lines.push(cv.professionalSummary.trim());
      lines.push('');
    }

    if (Array.isArray(cv?.experiences) && cv.experiences.length) {
      lines.push(`## Work Experience`);
      cv.experiences
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .forEach((e: any) => {
          const header = [e.title, e.company].filter(Boolean).join(' - ');
          if (header) lines.push(`### ${header}`);
          const dateLine = [e.startDate, e.endDate].filter(Boolean).join(' - ');
          if (dateLine) lines.push(dateLine);
          (e.description || []).forEach((b: string) => lines.push(`- ${b}`));
          lines.push('');
        });
    }

    if (Array.isArray(cv?.educations) && cv.educations.length) {
      lines.push(`## Education`);
      cv.educations
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .forEach((ed: any) => {
          const header = [ed.degree, ed.institution].filter(Boolean).join(' - ');
          if (header) lines.push(`### ${header}`);
          const dateLine = [ed.startDate, ed.endDate].filter(Boolean).join(' - ');
          if (dateLine) lines.push(dateLine);
          if (ed.description) lines.push(ed.description);
          lines.push('');
        });
    }

    if (Array.isArray(cv?.skills) && cv.skills.length) {
      lines.push(`## Skills`);
      const skillNames = cv.skills.map((s: any) => s.name).filter(Boolean);
      if (skillNames.length) lines.push(`- ${skillNames.join(', ')}`);
      lines.push('');
    }

    if (Array.isArray(cv?.languages) && cv.languages.length) {
      lines.push(`## Languages`);
      cv.languages.forEach((l: any) => {
        const label = [l.name, l.level ? `(${l.level})` : ''].filter(Boolean).join(' ');
        lines.push(`- ${label}`);
      });
      lines.push('');
    }

    if (Array.isArray(cv?.certificates) && cv.certificates.length) {
      lines.push(`## Certifications`);
      cv.certificates.forEach((c: any) => {
        const label = [c.name, c.issuer ? `- ${c.issuer}` : '', c.date ? `(${c.date})` : ''].filter(Boolean).join(' ');
        lines.push(`- ${label}`);
      });
      lines.push('');
    }

    if (Array.isArray(cv?.hobbies) && cv.hobbies.length) {
      lines.push(`## Hobbies`);
      cv.hobbies.forEach((h: any) => {
        const label = h.name || '';
        if (label) lines.push(`- ${label}`);
      });
      lines.push('');
    }

    return lines.join('\n').trim();
  }
  // Generate optimized CV
  const handleGenerate = async () => {
    if (!cvFile) {
      toast.error('Please select a resume');
      return;
    }

    // Validation: In AI mode, URL is required. In manual mode, all fields are required.
    if (jobInputMode === 'ai') {
      if (!formData.jobUrl || !formData.jobUrl.trim()) {
        toast.error('Please enter a job posting URL');
        return;
      }
    } else {
      if (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim()) {
        toast.error('Please fill in all job information fields');
        return;
      }
    }

    setIsModalOpen(false);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(true);
    setLoadingStep('preparing');
    setLoadingProgress(0);

    try {
      // Step 1: Convert PDF to images
      setLoadingStep('preparing');
      setLoadingProgress(10);
      setLoadingMessage('Converting resume to images...');
      
      const images = await pdfToImages(cvFile, 2, 1.5);
      console.log(`✅ PDF converted to ${images.length} image(s)`);
      
      setLoadingProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Extract CV with Vision API - COMPREHENSIVE STRUCTURED EXTRACTION
      setLoadingStep('analyzing');
      setLoadingProgress(40);
      setLoadingMessage('Analyzing resume with Vision AI...');

      const comprehensiveExtractionPrompt = `
You are an expert CV/resume analyst. Your task is to analyze this resume image(s) and extract EVERYTHING you see, then rewrite it in a well-structured markdown format.

CRITICAL INSTRUCTIONS:
1. Look at EVERY section, EVERY line, EVERY detail visible in the resume images
2. Extract ALL information including:
   - Personal information (full name, email, phone, address, city, country, LinkedIn URL, portfolio, GitHub, etc.)
   - Professional summary/objective (if present, extract the complete text)
   - Work experience (EVERY position with: exact job title, company name, location, start date, end date, current status, ALL bullet points and descriptions)
   - Education (EVERY degree/certificate with: degree name, institution, location, dates, GPA/honors if mentioned, relevant coursework)
   - Skills (ALL technical skills, soft skills, tools, technologies, frameworks, methodologies - extract EVERYTHING)
   - Languages (ALL languages with proficiency levels if mentioned)
   - Certifications (ALL certifications with issuer, date, credential ID if visible)
   - Projects (ALL projects with descriptions, technologies used, outcomes)
   - Awards/Achievements (if any)
   - Publications (if any)
   - Volunteer work (if any)
   - Any other sections visible

3. After extracting everything, rewrite the complete CV in a clean, structured markdown format with these sections:
   - # [Full Name]
   - Contact information (email, phone, location, LinkedIn, etc.)
   - ## Professional Summary (if present)
   - ## Work Experience (each role as ## [Job Title] - [Company])
   - ## Education (each degree as ## [Degree] - [Institution])
   - ## Skills
   - ## Languages (if present)
   - ## Certifications (if present)
   - ## Projects (if present)
   - Any other relevant sections

4. Be EXTREMELY thorough - do not skip any information. If you see it, include it.
5. CRITICAL for Work Experience: Extract EVERY SINGLE work experience/position you see. Count them and make sure none are missing. Include ALL positions, even if they seem less relevant or older.
6. Preserve all dates, numbers, percentages, company names, job titles exactly as they appear.
7. For work experience bullets, include ALL bullet points you see, preserving the original wording as much as possible.
8. If there are multiple pages, make sure to extract information from ALL pages.

Return ONLY a JSON object with this structure:
{
  "structuredCVMarkdown": "Complete CV rewritten in markdown format with all sections and information",
  "extractionNotes": "Brief notes about what sections were found and any challenges in extraction"
}

The "structuredCVMarkdown" field should be a complete, well-formatted markdown document that contains ALL information from the resume.
`;

      let structuredCVMarkdown = '';
      let extractionOk = false;
      
      try {
      const extractionResponse = await fetch('/api/analyze-cv-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                  { type: 'text', text: comprehensiveExtractionPrompt },
                ...images.map(img => ({
                  type: 'image_url',
                    image_url: { 
                      url: `data:image/jpeg;base64,${img}`,
                      detail: 'high' // High detail for comprehensive visual analysis
                    }
                }))
              ]
            }
          ],
          response_format: { type: 'json_object' },
            max_tokens: 8000, // Increased for comprehensive extraction
          temperature: 0.1
        })
      });

        if (!extractionResponse.ok) {
          const errorData = await extractionResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to extract CV content');
        }

        const extractionData = await extractionResponse.json();
        
        if (extractionData.status !== 'success') {
          throw new Error(extractionData.message || 'Failed to extract CV content');
        }

        // Parse the structured extraction
        let parsedExtraction: any = {};
        if (typeof extractionData.content === 'string') {
          try {
            const normalized = extractionData.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            parsedExtraction = JSON.parse(normalized);
          } catch {
            // If parsing fails, try to extract markdown directly
            parsedExtraction = { structuredCVMarkdown: extractionData.content };
          }
        } else if (extractionData.content && typeof extractionData.content === 'object') {
          parsedExtraction = extractionData.content;
        }

        structuredCVMarkdown = parsedExtraction.structuredCVMarkdown || parsedExtraction.text || '';
        extractionOk = !!structuredCVMarkdown && structuredCVMarkdown.trim().length > 100;
        
        if (extractionOk) {
          console.log('✅ Comprehensive CV extraction successful');
          console.log('   Extraction notes:', parsedExtraction.extractionNotes || 'N/A');
          console.log('   Structured markdown length:', structuredCVMarkdown.length);
        }
      } catch (e) {
        console.warn('⚠️ Vision extraction failed, will try pdfjs fallback', e);
      }

      // Fallback via pdfjs if needed
      if (!extractionOk) {
        setLoadingStep('analyzing');
        setLoadingMessage('Fallback: extracting text from PDF...');
        const text = await extractTextWithPDFJS(cvFile);
        structuredCVMarkdown = text;
        console.log('⚠️ Using PDF.js fallback extraction');
      }

      if (!structuredCVMarkdown || structuredCVMarkdown.trim().length < 50) {
        throw new Error('Extracted CV content is too short or empty. Please ensure your resume is clear and readable.');
      }

      // Use the structured markdown as our base CV text
      const cvText = structuredCVMarkdown;
      const originalStructured = parseMarkdownToCVData(cvText);

      setLoadingProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Get job posting content (extract if AI mode, use manual entry otherwise)
      setLoadingStep('retargeting');
      setLoadingProgress(70);
      setLoadingMessage('Preparing job information...');

      let jobDescription = formData.jobDescription;
      let jobTitle = formData.jobTitle;
      let company = formData.company;

      // If AI mode and we have a URL but no description, extract it now
      if (jobInputMode === 'ai' && formData.jobUrl && (!jobDescription || jobDescription.trim().length < 100)) {
        try {
          setLoadingMessage('Extracting job posting content...');
          
          // Validate URL before sending
          const urlToExtract = formData.jobUrl.trim();
          if (!urlToExtract || urlToExtract.length < 10) {
            throw new Error('Invalid URL. Please provide a valid job posting URL.');
          }

          console.log('📡 Sending extraction request for URL:', urlToExtract);
          
          const extractResponse = await fetch('/api/extract-job-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToExtract })
          });

          if (!extractResponse.ok) {
            let errorMessage = 'Failed to extract job posting';
            try {
              const errorData = await extractResponse.json();
              errorMessage = errorData.message || errorMessage;
              console.error('❌ Extraction failed with error:', errorData);
            } catch {
              const errorText = await extractResponse.text();
              console.error('❌ Extraction failed:', extractResponse.status, errorText);
              errorMessage = extractResponse.status === 404 
                ? 'Endpoint not found. Please restart the server.' 
                : errorText || extractResponse.statusText;
            }
            throw new Error(errorMessage);
          }

          const extractData = await extractResponse.json();
          
          if (extractData.status === 'success') {
            // Validate extracted data
            if (!extractData.content || extractData.content.trim().length < 50) {
              throw new Error('Extracted job description is too short. The page may not contain a valid job posting.');
            }

            // Use extracted data, with fallbacks
            jobDescription = extractData.content.trim() || jobDescription;
            jobTitle = (extractData.title && extractData.title.trim()) || jobTitle || 'Not specified';
            company = (extractData.company && extractData.company.trim()) || company || 'Not specified';

            // Log what was extracted
            console.log('✅ Job content extracted successfully:', {
              title: jobTitle,
              company: company,
              contentLength: jobDescription.length,
              location: extractData.location || 'Not specified'
            });

            // Update formData with extracted values so they're saved correctly
            setFormData({
              ...formData,
              jobTitle: jobTitle,
              company: company,
              jobDescription: jobDescription
            });
          } else {
            throw new Error(extractData.message || 'Failed to extract job posting content');
          }
        } catch (extractError: any) {
          console.error('❌ Failed to extract job content:', extractError);
          console.error('   Error details:', {
            message: extractError.message,
            name: extractError.name,
            stack: extractError.stack
          });
          
          // Provide helpful error message
          let errorMessage = `Failed to extract job posting from URL: ${extractError.message || 'Unknown error'}`;
          if (extractError.message?.includes('timeout') || extractError.message?.includes('Navigation')) {
            errorMessage += '. The page may be taking too long to load or may require authentication.';
          } else if (extractError.message?.includes('too short')) {
            errorMessage += ' Please try manual entry or check if the URL points to a valid job posting.';
          } else {
            errorMessage += ' Please try manual entry or check the URL.';
          }
          
          throw new Error(errorMessage);
        }
      }

      if (!jobDescription || jobDescription.trim().length < 50) {
        throw new Error('Job description is required. Please provide job information.');
      }

      // Step 4: Compare and optimize - Compare structured CV with job post
      setLoadingStep('retargeting');
      setLoadingProgress(75);
      setLoadingMessage('Comparing CV with job requirements...');

      // First, do a comparison analysis
      setLoadingMessage('Analyzing job requirements vs CV...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then optimize
      setLoadingStep('matching');
      setLoadingProgress(80);
      setLoadingMessage('Optimizing resume to match job posting...');

      const optimizationPrompt = buildOptimizationPrompt({
        cvText,
        jobTitle: jobTitle || 'Not specified',
        company: company || 'Not specified',
        jobDescription: jobDescription,
        jobUrl: formData.jobUrl || undefined
      });

      const optimizationResponse = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resume-optimizer',
          prompt: optimizationPrompt
        })
      });

      if (!optimizationResponse.ok) {
        throw new Error('Failed to optimize CV');
      }

      const optimizationData = await optimizationResponse.json();
      if (optimizationData.status !== 'success') {
        throw new Error(optimizationData.message || 'Failed to optimize CV');
      }

      // Normalize and parse the model output into an object
      let optimizedResult: {
        optimizedResumeMarkdown: string;
        atsScore?: number;
        keywordsUsed?: string[];
        changesSummary?: string[];
        shortSummary?: string;
        structuredCV?: any;
      };
      
      try {
      if (typeof optimizationData.content === 'string') {
          // Try to parse as JSON string
          let normalized = optimizationData.content.trim();
          // Remove markdown code blocks if present
          normalized = normalized.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        optimizedResult = JSON.parse(normalized);
        } else if (optimizationData.content && typeof optimizationData.content === 'object') {
          // Already an object
        optimizedResult = optimizationData.content;
        } else {
          throw new Error('Invalid content format from API');
        }

        // Validate required fields
        if (!optimizedResult.optimizedResumeMarkdown) {
          console.error('❌ Missing optimizedResumeMarkdown in response');
          throw new Error('Missing optimizedResumeMarkdown in API response');
        }

        // Validate structuredCV if present
        if (optimizedResult.structuredCV) {
          if (!optimizedResult.structuredCV.personalInfo) {
            console.warn('⚠️ structuredCV missing personalInfo, will parse from markdown');
            optimizedResult.structuredCV = undefined; // Will be parsed from markdown
          } else {
            // Ensure required arrays exist
            optimizedResult.structuredCV.experiences = optimizedResult.structuredCV.experiences || [];
            optimizedResult.structuredCV.educations = optimizedResult.structuredCV.educations || [];
            optimizedResult.structuredCV.skills = optimizedResult.structuredCV.skills || [];
            optimizedResult.structuredCV.languages = optimizedResult.structuredCV.languages || [];
            optimizedResult.structuredCV.certificates = optimizedResult.structuredCV.certificates || [];
          }
        }

        console.log('✅ Successfully parsed optimization result:', {
          hasMarkdown: !!optimizedResult.optimizedResumeMarkdown,
          markdownLength: optimizedResult.optimizedResumeMarkdown.length,
          hasStructuredCV: !!optimizedResult.structuredCV,
          atsScore: optimizedResult.atsScore,
          keywordsCount: optimizedResult.keywordsUsed?.length || 0
        });
      } catch (parseError: any) {
        console.error('❌ Error parsing optimization result:', parseError);
        console.error('Raw content type:', typeof optimizationData.content);
        console.error('Raw content preview:', 
          typeof optimizationData.content === 'string' 
            ? optimizationData.content.substring(0, 500) 
            : JSON.stringify(optimizationData.content).substring(0, 500)
        );
        throw new Error(`Failed to parse optimization result: ${parseError.message || 'Invalid JSON format'}`);
      }

      // Build structured data candidate from AI, then enforce completeness against original
      let candidateStructured: any = optimizedResult.structuredCV && optimizedResult.structuredCV.personalInfo
        ? optimizedResult.structuredCV
        : parseMarkdownToCVData(optimizedResult.optimizedResumeMarkdown || '');
      const mergedStructured = enforceCompleteness(originalStructured, candidateStructured);
      const finalMarkdown = serializeStructuredCVToMarkdown(mergedStructured);

      setLoadingStep('finalizing');
      setLoadingProgress(90);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sauvegarder le CV optimisé (markdown brut)
      // Use the extracted jobTitle and company (which may have been updated from URL extraction)
      const savedId = await saveOptimizedCV({
        jobTitle: jobTitle || formData.jobTitle || 'Untitled Position',
        company: company || formData.company || 'Unknown Company',
        jobUrl: formData.jobUrl || undefined,
        date: formatDateString(new Date().toISOString().split('T')[0]),
        userId: currentUser?.uid || '',
        optimizedResumeMarkdown: finalMarkdown,
        atsScore: optimizedResult.atsScore,
        keywordsUsed: optimizedResult.keywordsUsed,
        changesSummary: optimizedResult.changesSummary,
        shortSummary: optimizedResult.shortSummary,
        cvFileName: cvFile.name
      });

      // Parse markdown to structured data and persist, then navigate to editor
      if (savedId && currentUser) {
        console.log('🔍 DEBUG: Using merged structured data with completeness checks...');
        const structured = mergedStructured;
        
        // Save structured data to Firestore
        try {
          await updateDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', savedId), {
            cvData: structured,
            optimizedResumeMarkdown: finalMarkdown
          });
          console.log('✅ cvData saved successfully to Firestore');
        } catch (saveError: any) {
          console.error('❌ Failed to save structured cvData:', saveError);
          // Don't throw - navigation should still happen even if save fails
          toast.warning('CV optimized but failed to save structured data. You can still edit the resume.');
        }
        
        navigate(`/cv-optimizer/${savedId}`);
      }

      setLoadingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset form
      setCvFile(null);
      setFormData({
        jobUrl: '',
        jobTitle: '',
        company: '',
        jobDescription: '',
      });
      setCurrentStep(1);

      setIsLoading(false);
      toast.success('Optimized resume generated successfully!');
    } catch (error: any) {
      console.error('Error generating optimized CV:', error);
      setIsLoading(false);
      toast.error(`Optimization error: ${error.message || 'Unknown error'}`);
    }
  };

  const steps = [
    {
      title: "Upload Resume",
      description: "",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4">
            <label
              ref={dropZoneRef}
              htmlFor="cv-upload-input-modal"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full flex items-center p-6 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200 ease-out
                backdrop-blur-sm
                group
                ${
                  isDragging
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : cvFile
                    ? 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-gray-200/60 dark:border-gray-700/50 hover:border-purple-400/60 dark:hover:border-purple-600/60 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
                }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 transition-transform duration-200
                ${
                  isDragging
                    ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/30 scale-105'
                    : cvFile
                    ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-900/20 group-hover:scale-105'
                }`}>
                {cvFile ? 
                  <Check className="w-7 h-7 text-green-600 dark:text-green-400" /> : 
                  <Upload className={`w-7 h-7 ${isDragging ? 'text-purple-600 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`} />
                }
              </div>
              <div className="flex-1 text-left">
                {cvFile ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {cvFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(cvFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      isDragging
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {isDragging ? "Drop your file here" : "Select or drag and drop a PDF file"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isDragging ? "Release to upload" : "PDF format only"}
                    </p>
                  </div>
                )}
              </div>
              {cvFile && (
                <span className="ml-3 flex-shrink-0 rounded-full bg-green-100/60 dark:bg-green-900/30 backdrop-blur-sm p-2.5 border border-green-200/50 dark:border-green-800/30">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                </span>
              )}
              <input
                id="cv-upload-input-modal"
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
            </label>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center 
            bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm 
            px-3 py-2.5 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
            <Info className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Your resume will be optimized to match the job posting</span>
          </div>
        </motion.div>
      ),
    },
    {
      title: "Job Information",
      description: "",
      icon: <Briefcase className="w-5 h-5" />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={() => setJobInputMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ease-out ${
                jobInputMode === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Extraction
            </button>
            <button
              onClick={() => setJobInputMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ease-out ${
                jobInputMode === 'manual'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/50'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Manual Entry
            </button>
          </div>

          {/* AI Mode */}
          {jobInputMode === 'ai' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white text-sm
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="https://linkedin.com/jobs/view/..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Content will be extracted automatically</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Manual Mode */}
          {jobInputMode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
        <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white text-sm
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200/60 dark:border-gray-700/50 
                    focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    dark:bg-gray-800/30 dark:text-white text-sm
                    bg-gray-50/50 backdrop-blur-sm
                    transition-all duration-200"
                  placeholder="e.g., Google"
                />
              </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Description
          </label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
            className="w-full px-3 py-2.5 border border-gray-200/60 dark:border-gray-700/50 rounded-lg 
              focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
              dark:bg-gray-800/30 dark:text-white h-40 text-sm resize-none
              bg-gray-50/50 backdrop-blur-sm
              transition-all duration-200"
            placeholder="Paste the complete job description here..."
          />
        </div>
            </motion.div>
          )}
        </motion.div>
      )
    }
  ];

  const loadingMessages = {
    preparing: [
      "Preparing your resume optimization...",
      "Initializing AI optimization engine...",
      "Loading analysis tools...",
    ],
    analyzing: [
      "Extracting your resume content...",
      "Analyzing your professional profile...",
      "Processing your qualifications...",
    ],
    retargeting: [
      "Retargeting CV to the job description...",
      "Aligning content with role requirements...",
      "Rephrasing for ATS and relevance...",
    ],
    matching: [
      "Optimizing resume according to job posting...",
      "Integrating relevant keywords...",
      "Adapting content...",
    ],
    finalizing: [
      "Finalizing your optimized resume...",
      "Generating final result...",
      "Almost done...",
    ]
  };

  useEffect(() => {
    if (!isLoading) return;
    
    const messages = loadingMessages[loadingStep as keyof typeof loadingMessages];
    if (messages && messages.length > 0) {
      setLoadingMessage(messages[0]);
    }
    
    const messageInterval = setInterval(() => {
      const messages = loadingMessages[loadingStep as keyof typeof loadingMessages];
      if (messages && messages.length > 0) {
        setLoadingMessage(prev => {
          const currentMessage = prev;
          let newMessage;
          let attempts = 0;
          do {
            const idx = Math.floor(Math.random() * messages.length);
            newMessage = messages[idx];
            attempts++;
            if (attempts > 10) break;
          } while (newMessage === currentMessage && messages.length > 1);
          return newMessage || messages[0];
        });
      }
    }, 8000);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const caps = {
          'preparing': 25,
          'analyzing': 65,
          'matching': 85,
          'finalizing': 95
        };
        const cap = caps[loadingStep as keyof typeof caps] || 95;
        if (prev >= cap) return prev;
        const remainingProgress = cap - prev;
        const increment = Math.max(0.1, remainingProgress * 0.01);
        return Math.min(prev + increment, cap);
      });
    }, 500);
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading, loadingStep]);

  return (
    <AuthLayout>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLoading ? 'overflow-hidden' : ''}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-600 dark:text-white">
                Resume Lab
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Optimize your resume to perfectly match each job posting with AI
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  jobUrl: '',
                  jobTitle: '',
                  company: '',
                  jobDescription: '',
                });
                setCvFile(null);
                setCurrentStep(1);
                setJobInputMode('ai');
                setIsModalOpen(true);
              }}
              className="group px-4 py-2.5 rounded-xl 
                bg-gradient-to-r from-purple-600 to-indigo-600
                hover:opacity-90 transition-all duration-200
                shadow-lg shadow-purple-500/20"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">New Resume</span>
              </div>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {optimizedCVs.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Optimized Resumes</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {optimizedCVs.filter(cv => (cv.atsScore || 0) >= 80).length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High Score (80%+)</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(optimizedCVs.map(cv => `${cv.jobTitle}|||${cv.company}`)).size}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unique Jobs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filters and View Toggle */}
        {optimizedCVs.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company, or keywords..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-xl
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Score Filter */}
              <div className="relative">
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value as any)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High (80%+)</option>
                  <option value="medium">Medium (65-79%)</option>
                  <option value="low">Low (&lt;65%)</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                    rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                  <option value="company">Sort by Company</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* View Toggle Buttons */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg flex items-center justify-center ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg flex items-center justify-center ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des CVs optimisés */}
        {groupedCVsList.length > 0 ? (
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }`}>
            {groupedCVsList.map((group) => {
              const hasMultipleVersions = group.versions.length > 1;
              
              return (
                <motion.div
                  key={group.jobKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 
                    hover:border-purple-300 dark:hover:border-purple-700
                    hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-900/20
                    transition-all duration-300 cursor-pointer group
                    overflow-hidden"
                  onClick={() => navigate(`/cv-optimizer/${group.primaryCV.id}`)}
                >
                  {/* Gradient background effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-indigo-50/0 to-purple-50/0 
                    group-hover:from-purple-50/50 group-hover:via-indigo-50/30 group-hover:to-purple-50/50
                    dark:group-hover:from-purple-950/20 dark:group-hover:via-indigo-950/10 dark:group-hover:to-purple-950/20
                    transition-all duration-300 -z-0" />
                  
                  <div className="relative z-10">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {group.primaryCV.jobTitle}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="truncate">{group.primaryCV.company}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">{formatDateString(group.primaryCV.date)}</span>
                      </div>
                      {hasMultipleVersions && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenVersionDropdown(openVersionDropdown === group.jobKey ? null : group.jobKey);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                            aria-label="Select version"
                          >
                            <Globe2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">
                              {group.versions.length} versions
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </button>
                          {openVersionDropdown === group.jobKey && (
                            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
                              <div className="py-1 max-h-64 overflow-y-auto">
                                {group.versions.map((v) => (
                                  <button
                                    key={v.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/cv-optimizer/${v.id}`);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-start gap-2"
                                  >
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {(v.language || '').toUpperCase() || 'VERSION'}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {(typeof v.atsScore === 'number' ? `Score ${v.atsScore}%` : 'Score —')} · {formatDateString(v.date)}
                                      </div>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(group.primaryCV.id, group.primaryCV.jobTitle);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 
                          p-2 rounded-lg bg-red-50 dark:bg-red-900/20 
                          text-red-600 dark:text-red-400 
                          hover:bg-red-100 dark:hover:bg-red-900/30
                          hover:shadow-md"
                        aria-label="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                    
                    {group.primaryCV.keywordsUsed && group.primaryCV.keywordsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {group.primaryCV.keywordsUsed.slice(0, 5).map((keyword, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="text-xs px-2.5 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 
                              dark:from-purple-900/30 dark:to-indigo-900/30
                              text-purple-700 dark:text-purple-300 
                              rounded-full font-medium
                              border border-purple-200/50 dark:border-purple-700/50
                              group-hover:from-purple-200 group-hover:to-indigo-200
                              dark:group-hover:from-purple-800/40 dark:group-hover:to-indigo-800/40
                              transition-all duration-200"
                          >
                            {keyword}
                          </motion.span>
                        ))}
                        {group.primaryCV.keywordsUsed.length > 5 && (
                          <span className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400 font-medium">
                            +{group.primaryCV.keywordsUsed.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : optimizedCVs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              No Optimized Resumes
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Create your first optimized resume by clicking "New Resume" and following the steps.
            </p>
            <button
              onClick={() => {
                setFormData({
                  jobUrl: '',
                  jobTitle: '',
                  company: '',
                  jobDescription: '',
                });
                setCvFile(null);
                setCurrentStep(1);
                setJobInputMode('ai');
                setIsModalOpen(true);
              }}
              className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto"
            >
              <Sparkles className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">Create Your First Optimized Resume</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              No Results Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              No resumes match your current search and filter criteria. Try adjusting your filters or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setScoreFilter('all');
                setDateFilter('all');
                setSortBy('date');
              }}
              className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto"
            >
              <XCircle className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">Clear All Filters</span>
            </button>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: "100%" }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: "100%" }}
                onClick={(e) => e.stopPropagation()}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 w-full rounded-2xl max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Drag handle for mobile */}
                <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
                  {/* Minimal Step Indicator - très discret */}
                  <div className="mb-3 flex items-center justify-center gap-1">
                    {steps.map((step, index) => {
                      const stepNumber = index + 1;
                      const isActive = currentStep === stepNumber;
                      const isCompleted = currentStep > stepNumber;
                      
                      return (
                        <div key={step.title} className="flex items-center">
                          <div 
                            className={`
                              w-1.5 h-1.5 rounded-full transition-all duration-300
                              ${isActive 
                                ? 'bg-purple-600 dark:bg-purple-400 w-2 h-2' 
                                : isCompleted 
                                  ? 'bg-purple-400 dark:bg-purple-500' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }
                            `}
                          />
                          {index < steps.length - 1 && (
                            <div 
                              className={`
                                h-0.5 w-3 mx-0.5 transition-all duration-300
                                ${isCompleted 
                                  ? 'bg-purple-400 dark:bg-purple-500' 
                                  : 'bg-gray-200 dark:bg-gray-700'
                                }
                              `}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Title Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                        <span className="inline-flex p-2 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400">
                          {steps[currentStep - 1].icon}
                        </span>
                        {steps[currentStep - 1].title}
                      </h2>
                      {steps[currentStep - 1].description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-12">
                          {steps[currentStep - 1].description}
                        </p>
                      )}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95 ml-4 flex-shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                  {steps[currentStep - 1].content}
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-center p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                      }
                    }}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 ${
                      currentStep === 1 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                    }`}
                  >
                    <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                    Back
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentStep < steps.length) {
                        // Validate step 2 before proceeding
                        if (currentStep === 2) {
                          if (jobInputMode === 'ai') {
                            // In AI mode, only URL is required
                            if (!formData.jobUrl || !formData.jobUrl.trim()) {
                              toast.error('Please enter a job posting URL');
                              return;
                            }
                          } else {
                            // In manual mode, all fields are required
                            if (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim()) {
                              toast.error('Please fill in all job information fields');
                              return;
                            }
                          }
                        }
                        setCurrentStep(currentStep + 1);
                      } else {
                        // Call handleGenerate instead of just closing the modal
                        handleGenerate();
                      }
                    }}
                    disabled={
                      (currentStep === 1 && !cvFile) || 
                      (currentStep === 2 && (
                        jobInputMode === 'ai' 
                          ? (!formData.jobUrl || !formData.jobUrl.trim())
                          : (!formData.jobTitle.trim() || !formData.company.trim() || !formData.jobDescription.trim())
                      )) ||
                      isLoading
                    }
                    className={`px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 
                      hover:from-indigo-700 hover:to-violet-700 disabled:from-gray-400 disabled:to-gray-500 
                      text-white rounded-lg text-sm font-semibold flex items-center 
                      transition-all duration-200 ease-out
                      disabled:cursor-not-allowed 
                      shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30
                      hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/40
                      disabled:shadow-none disabled:hover:shadow-none`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        <span>Optimization in progress...</span>
                      </>
                    ) :
                      <>
                        {currentStep === steps.length ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            <span>Optimize Resume</span>
                          </>
                        ) : (
                          <>
                            <span>Continue</span>
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </>
                    }
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Loading Modal */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center px-6"
            >
              <div className="cvopt-walker mb-8" aria-label="Loading">
                <div className="loader">
                  <svg className="legl" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20.69332" height="68.19944" viewBox="0,0,20.69332,68.19944">
                    <g transform="translate(-201.44063,-235.75466)">
                      <g strokeMiterlimit={10}>
                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                        <path d="M218.11971,301.20087c-2.20708,1.73229 -4.41416,0 -4.41416,0l-1.43017,-1.1437c-1.42954,-1.40829 -3.04351,-2.54728 -4.56954,-3.87927c-0.95183,-0.8308 -2.29837,-1.49883 -2.7652,-2.55433c-0.42378,-0.95815 0.14432,-2.02654 0.29355,-3.03399c0.41251,-2.78499 1.82164,-5.43386 2.41472,-8.22683c1.25895,-4.44509 2.73863,-8.98683 3.15318,-13.54796c0.22615,-2.4883 -0.21672,-5.0155 -0.00278,-7.50605c0.30636,-3.56649 1.24602,-7.10406 1.59992,-10.6738c0.29105,-2.93579 -0.00785,-5.9806 -0.00785,-8.93046c0,0 0,-2.44982 3.12129,-2.44982c3.12129,0 3.12129,2.44982 3.12129,2.44982c0,3.06839 0.28868,6.22201 -0.00786,9.27779c-0.34637,3.56935 -1.30115,7.10906 -1.59992,10.6738c-0.2103,2.50918 0.22586,5.05326 -0.00278,7.56284c-0.43159,4.7371 -1.94029,9.46317 -3.24651,14.07835c-0.47439,2.23403 -1.29927,4.31705 -2.05805,6.47156c-0.18628,0.52896 -0.1402,1.0974 -0.327,1.62624c-0.09463,0.26791 -0.64731,0.47816 -0.50641,0.73323c0.19122,0.34617 0.86423,0.3445 1.2346,0.58502c1.88637,1.22503 3.50777,2.79494 5.03,4.28305l0.96971,0.73991c0,0 2.20708,1.73229 0,3.46457z" fill="none" stroke="#191e2e" strokeWidth={7} />
                      </g>
                    </g>
                  </svg>
                  <svg className="legr" version="1.1" xmlns="http://www.w3.org/2000/svg" width="41.02537" height="64.85502" viewBox="0,0,41.02537,64.85502">
                    <g transform="translate(-241.54137,-218.44347)">
                      <g strokeMiterlimit={10}>
                        <path d="M279.06674,279.42662c-2.27967,1.98991 -6.08116,0.58804 -6.08116,0.58804l-2.47264,-0.92915c-2.58799,-1.18826 -5.31176,-2.08831 -7.99917,-3.18902c-1.67622,-0.68654 -3.82471,-1.16116 -4.93147,-2.13229c-1.00468,-0.88156 -0.69132,-2.00318 -0.92827,-3.00935c-0.65501,-2.78142 0.12275,-5.56236 -0.287,-8.37565c-0.2181,-4.51941 -0.17458,-9.16283 -1.60696,-13.68334c-0.78143,-2.46614 -2.50162,-4.88125 -3.30086,-7.34796c-1.14452,-3.53236 -1.40387,-7.12078 -2.48433,-10.66266c-0.88858,-2.91287 -2.63779,-5.85389 -3.93351,-8.74177c0,0 -1.07608,-2.39835 3.22395,-2.81415c4.30003,-0.41581 2.41605,1.98254 2.41605,1.98254c1.34779,3.00392 3.13072,6.05282 4.06444,9.0839c1.09065,3.54049 1.33011,7.13302 2.48433,10.66266c0.81245,2.48448 2.5308,4.917 3.31813,7.40431c1.48619,4.69506 1.48366,9.52281 1.71137,14.21503c0.32776,2.25028 0.10631,4.39942 0.00736,6.60975c-0.02429,0.54266 0.28888,1.09302 0.26382,1.63563c-0.01269,0.27488 -0.68173,0.55435 -0.37558,0.78529c0.41549,0.31342 1.34191,0.22213 1.95781,0.40826c3.13684,0.94799 6.06014,2.26892 8.81088,3.52298l1.66093,0.59519c0,0 6.76155,1.40187 4.48187,3.39177z" fill="none" stroke="#000000" strokeWidth={7} />
                        <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" />
                        <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} />
                      </g>
                    </g>
                  </svg>
                  <div className="bod">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="144.10576" height="144.91623" viewBox="0,0,144.10576,144.91623">
                      <g transform="translate(-164.41679,-112.94712)">
                        <g strokeMiterlimit={10}>
                          <path d="M166.9168,184.02633c0,-36.49454 35.0206,-66.07921 72.05288,-66.07921c37.03228,0 67.05288,29.58467 67.05288,66.07921c0,6.94489 -1.08716,13.63956 -3.10292,19.92772c-2.71464,8.46831 -7.1134,16.19939 -12.809,22.81158c-2.31017,2.68194 -7.54471,12.91599 -7.54471,12.91599c0,0 -5.46714,-1.18309 -8.44434,0.6266c-3.86867,2.35159 -10.95356,10.86714 -10.95356,10.86714c0,0 -6.96906,-3.20396 -9.87477,-2.58085c-2.64748,0.56773 -6.72538,5.77072 -6.72538,5.77072c0,0 -5.5023,-4.25969 -7.5982,-4.25969c-3.08622,0 -9.09924,3.48259 -9.09924,3.48259c0,0 -6.0782,-5.11244 -9.00348,-5.91884c-4.26461,-1.17561 -12.23343,0.75049 -12.23343,0.75049c0,0 -5.18164,-8.26065 -7.60688,-9.90388c-3.50443,-2.37445 -8.8271,-3.95414 -8.8271,-3.95414c0,0 -5.33472,-8.81718 -7.27019,-11.40895c-4.81099,-6.44239 -13.46422,-9.83437 -15.65729,-17.76175c-1.53558,-5.55073 -2.35527,-21.36472 -2.35527,-21.36472z" fill="#191e2e" stroke="#000000" strokeWidth={5} strokeLinecap="butt" />
                          <path d="M167.94713,180c0,-37.03228 35.0206,-67.05288 72.05288,-67.05288c37.03228,0 67.05288,30.0206 67.05288,67.05288c0,7.04722 -1.08716,13.84053 -3.10292,20.22135c-2.71464,8.59309 -7.1134,16.43809 -12.809,23.14771c-2.31017,2.72146 -7.54471,13.1063 -7.54471,13.1063c0,0 -5.46714,-1.20052 -8.44434,0.63584c-3.86867,2.38624 -10.95356,11.02726 -10.95356,11.02726c0,0 -6.96906,-3.25117 -9.87477,-2.61888c-2.64748,0.5761 -6.72538,5.85575 -6.72538,5.85575c0,0 -5.5023,-4.32246 -7.5982,-4.32246c-3.08622,0 -9.09924,3.5339 -9.09924,3.5339c0,0 -6.0782,-5.18777 -9.00348,-6.00605c-4.26461,-1.19293 -12.23343,0.76155 -12.23343,0.76155c0,0 -5.18164,-8.38236 -7.60688,-10.04981c-3.50443,-2.40943 -8.8271,-4.0124 -8.8271,-4.0124c0,0 -5.33472,-8.9471 -7.27019,-11.57706c-4.81099,-6.53732 -13.46422,-9.97928 -15.65729,-18.02347c-1.53558,-5.63252 -2.35527,-21.67953 -2.35527,-21.67953z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="M216.22445,188.06994c0,0 1.02834,11.73245 -3.62335,21.11235c-4.65169,9.3799 -13.06183,10.03776 -13.06183,10.03776c0,0 7.0703,-3.03121 10.89231,-10.7381c4.34839,-8.76831 5.79288,-20.41201 5.79288,-20.41201z" fill="none" stroke="#2f3a50" strokeWidth={3} strokeLinecap="round" />
                        </g>
                      </g>
                    </svg>
                    <svg className="head" version="1.1" xmlns="http://www.w3.org/2000/svg" width="115.68559" height="88.29441" viewBox="0,0,115.68559,88.29441">
                      <g transform="translate(-191.87889,-75.62023)">
                        <g strokeMiterlimit={10}>
                          <path d="" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="M195.12889,128.77752c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,0.60102 -9.22352,20.49284 -9.22352,20.49284l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="butt" />
                          <path d="M195.31785,124.43649c0,-26.96048 21.33334,-48.81626 47.64934,-48.81626c26.316,0 47.64935,21.85578 47.64935,48.81626c0,1.03481 -0.08666,2.8866 -0.08666,2.8866c0,0 16.8538,15.99287 16.21847,17.23929c-0.66726,1.30905 -23.05667,-4.14265 -23.05667,-4.14265l-2.29866,4.5096l-7.75885,0.35623l-7.59417,6.15039l-8.64295,-1.74822l-11.70703,6.06119l-6.38599,-4.79382l-6.45999,2.36133l-7.01451,-7.38888l-8.11916,1.29382l-6.19237,-6.07265l-7.6263,-1.37795l-4.19835,-7.87062l-4.24236,-4.16907c0,0 -0.13314,-2.0999 -0.13314,-3.29458z" fill="#191e2e" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                          <path d="M271.10348,122.46768l10.06374,-3.28166l24.06547,24.28424" fill="none" stroke="#2f3a50" strokeWidth={6} strokeLinecap="round" />
                          <path d="M306.56448,144.85764l-41.62024,-8.16845l2.44004,-7.87698" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M276.02738,115.72434c-0.66448,-4.64715 2.56411,-8.95308 7.21127,-9.61756c4.64715,-0.66448 8.95309,2.56411 9.61757,7.21126c0.46467,3.24972 -1.94776,8.02206 -5.96624,9.09336c-2.11289,-1.73012 -5.08673,-5.03426 -5.08673,-5.03426c0,0 -4.12095,1.16329 -4.60481,1.54229c-0.16433,-0.04891 -0.62732,-0.38126 -0.72803,-0.61269c-0.30602,-0.70328 -0.36302,-2.02286 -0.44303,-2.58239z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="M242.49281,125.6424c0,-4.69442 3.80558,-8.5 8.5,-8.5c4.69442,0 8.5,3.80558 8.5,8.5c0,4.69442 -3.80558,8.5 -8.5,8.5c-4.69442,0 -8.5,-3.80558 -8.5,-8.5z" fill="#ffffff" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />
                          <path d="" fillOpacity="0.26667" fill="#97affd" strokeOpacity="0.48627" stroke="#ffffff" strokeWidth={0} strokeLinecap="butt" />
                        </g>
                      </g>
                    </svg>
                  </div>
                  <svg id="gnd" version="1.1" xmlns="http://www.w3.org/2000/svg" width={475} height={530} viewBox="0,0,163.40011,85.20095">
                    <g transform="translate(-176.25,-207.64957)">
                      <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeMiterlimit={10}>
                        <path d="M295.5,273.1829c0,0 -57.38915,6.69521 -76.94095,-9.01465c-13.65063,-10.50609 15.70098,-20.69467 -2.5451,-19.94465c-30.31027,2.05753 -38.51396,-26.84135 -38.51396,-26.84135c0,0 6.50084,13.30023 18.93224,19.17888c9.53286,4.50796 26.23632,-1.02541 32.09529,4.95137c3.62417,3.69704 2.8012,6.33005 0.66517,8.49452c-3.79415,3.84467 -11.7312,6.21103 -6.24682,10.43645c22.01082,16.95812 72.55412,12.73944 72.55412,12.73944z" fill="#000000" />
                        <path d="M338.92138,217.76285c0,0 -17.49626,12.55408 -45.36424,10.00353c-8.39872,-0.76867 -17.29557,-6.23066 -17.29557,-6.23066c0,0 3.06461,-2.23972 15.41857,0.72484c26.30467,6.31228 47.24124,-4.49771 47.24124,-4.49771z" fill="#000000" />
                        <path d="M209.14443,223.00182l1.34223,15.4356l-10.0667,-15.4356" fill="none" />
                        <path d="M198.20391,230.41806l12.95386,7.34824l6.71113,-12.08004" fill="none" />
                        <path d="M211.19621,238.53825l8.5262,-6.09014" fill="none" />
                        <path d="M317.57068,215.80173l5.27812,6.49615l0.40601,-13.39831" fill="none" />
                        <path d="M323.66082,222.70389l6.09014,-9.33822" fill="none" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="w-[min(60vw,520px)] h-2 rounded-full bg-white/20 dark:bg-white/15 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                />
              </div>
              <p className="text-base font-semibold text-white">
                {loadingMessage}
              </p>
              <p className="mt-2 text-sm text-white/80">
                This may take up to 2 minutes.
              </p>
            </motion.div>
            <style>
              {`
                .cvopt-walker .loader {
                  position: relative;
                  width: 200px;
                  height: 200px;
                  transform: translate(10px, -20px) scale(0.75);
                }
                .cvopt-walker .loader svg {
                  position: absolute;
                  top: 0;
                  left: 0;
                }
                .cvopt-walker .head {
                  transform: translate(27px, -30px);
                  z-index: 3;
                  animation: bob-head 1s infinite ease-in;
                }
                .cvopt-walker .bod {
                  transform: translate(0px, 30px);
                  z-index: 3;
                  animation: bob-bod 1s infinite ease-in-out;
                }
                .cvopt-walker .legr {
                  transform: translate(75px, 135px);
                  z-index: 0;
                  animation: rstep-full 1s infinite ease-in;
                }
                .cvopt-walker .legr {
                  animation-delay: 0.45s;
                }
                .cvopt-walker .legl {
                  transform: translate(30px, 155px);
                  z-index: 3;
                  animation: lstep-full 1s infinite ease-in;
                }
                @keyframes bob-head {
                  0% { transform: translate(27px, -30px) rotate(3deg); }
                  5% { transform: translate(27px, -30px) rotate(3deg); }
                  25% { transform: translate(27px, -25px) rotate(0deg); }
                  50% { transform: translate(27px, -30px) rotate(-3deg); }
                  70% { transform: translate(27px, -25px) rotate(0deg); }
                  100% { transform: translate(27px, -30px) rotate(3deg); }
                }
                @keyframes bob-bod {
                  0% { transform: translate(0px, 30px) rotate(3deg); }
                  5% { transform: translate(0px, 30px) rotate(3deg); }
                  25% { transform: translate(0px, 35px) rotate(0deg); }
                  50% { transform: translate(0px, 30px) rotate(-3deg); }
                  70% { transform: translate(0px, 35px) rotate(0deg); }
                  100% { transform: translate(0px, 30px) rotate(3deg); }
                }
                @keyframes lstep-full {
                  0% { transform: translate(30px, 155px) rotate(-5deg); }
                  33% { transform: translate(62px, 140px) rotate(35deg); }
                  66% { transform: translate(55px, 155px) rotate(-25deg); }
                  100% { transform: translate(30px, 155px) rotate(-5deg); }
                }
                @keyframes rstep-full {
                  0% { transform: translate(75px, 135px) rotate(-5deg); }
                  33% { transform: translate(105px, 125px) rotate(35deg); }
                  66% { transform: translate(95px, 135px) rotate(-25deg); }
                  100% { transform: translate(75px, 135px) rotate(-5deg); }
                }
                .cvopt-walker #gnd {
                  transform: translate(-140px, 0) rotate(10deg);
                  z-index: -1;
                  filter: blur(0.5px) drop-shadow(1px 3px 5px #000000);
                  opacity: 0.25;
                  animation: scroll 5s infinite linear;
                }
                @keyframes scroll {
                  0% { transform: translate(50px, 25px); opacity: 0; }
                  33% { opacity: 0.25; }
                  66% { opacity: 0.25; }
                  100% { transform: translate(-100px, -50px); opacity: 0; }
                }
              `}
            </style>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-semibold">Delete Resume</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirmModal({ isOpen: false, cvId: null, cvTitle: '' })}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete your optimized resume for <strong>{deleteConfirmModal.cvTitle}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmModal({ isOpen: false, cvId: null, cvTitle: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex-1 sm:flex-initial"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmModal.cvId) {
                      deleteOptimizedCV(deleteConfirmModal.cvId);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg flex-1 sm:flex-initial"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

function buildOptimizationPrompt(params: { cvText: string; jobTitle: string; company: string; jobDescription: string; jobUrl?: string }) {
  const { cvText, jobTitle, company, jobDescription, jobUrl } = params;
  return `
You are a principal CV optimization expert and ATS specialist. Your mission is to transform this candidate's CV to PERFECTLY match the target job while preserving truth and authenticity.

IMPORTANT: The CV text below is a COMPREHENSIVE structured extraction from the original resume. It contains ALL information from the candidate's CV. Your job is to compare this complete CV with the job posting and adapt it intelligently.

═══════════════════════════════════════════════════════════════════
TARGET JOB POSTING
═══════════════════════════════════════════════════════════════════
Position: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}
${jobUrl ? `Job Posting URL: ${jobUrl}` : ''}

Full Job Description:
"""
${jobDescription}
"""

${jobUrl ? `NOTE: The job description above was extracted from the job posting URL: ${jobUrl}. Analyze this content carefully to understand the exact requirements, responsibilities, and qualifications needed for this position.` : ''}

═══════════════════════════════════════════════════════════════════
CANDIDATE'S COMPLETE CV (STRUCTURED EXTRACTION)
═══════════════════════════════════════════════════════════════════
This is a comprehensive structured extraction of the candidate's resume containing ALL their information:
"""
${cvText}
"""

═══════════════════════════════════════════════════════════════════
YOUR MISSION - INTELLIGENT COMPARISON & OPTIMIZATION
═══════════════════════════════════════════════════════════════════

STEP 1: DEEP JOB ANALYSIS
Analyze the job description systematically and extract:
- Must-have technical skills, tools, technologies, frameworks (list ALL)
- Must-have soft skills and methodologies
- Key responsibilities and expected outcomes (prioritize by importance)
- Industry-specific terminology and jargon
- Seniority level and years of experience expected
- Company culture indicators
- Preferred qualifications (nice-to-have)

STEP 2: COMPREHENSIVE CV vs JOB COMPARISON
Systematically compare the candidate's COMPLETE CV (from the structured extraction above) with the job requirements:

A) EXACT MATCHES - What the candidate has that directly matches:
   - Skills/tools that appear in both CV and job posting
   - Experiences/responsibilities that align
   - Qualifications that match requirements

B) HIDDEN GEMS - What the candidate HAS but needs highlighting:
   - Skills/experiences in CV that are relevant but not emphasized
   - Transferable skills that could match job requirements
   - Achievements that demonstrate required competencies

C) CONTENT TO ADAPT (NOT REMOVE):
   - Skills/experiences that can be rephrased to match job terminology
   - Bullet points that can be rewritten to emphasize relevant aspects
   - Information that can be condensed or reworded for better alignment

D) MISSING REQUIREMENTS - What's in job but not in CV:
   - List what's missing (but DO NOT invent - be honest)
   - Note if candidate has similar/equivalent skills that could compensate

STEP 3: STRATEGIC TEXT ADAPTATION (PRESERVE ALL STRUCTURE)
CRITICAL: You MUST keep ALL experiences, ALL education entries, ALL skills, ALL sections from the original CV.
Your job is ONLY to adapt the TEXT/DESCRIPTIONS, not to remove any content.

Transform the CV to maximize ATS score and recruiter appeal while staying 100% truthful:

A) PROFESSIONAL SUMMARY (2-3 sentences, ~50-60 words MAX for one-page CV):
   - Lead with years of experience + exact job title match if applicable
   - Mention 2-3 TOP skills/tools from the job description that the candidate has
   - Include 1 quantified achievement that relates to the role
   - Use power words from the job posting
   - Keep it concise to save space for experiences

B) SKILLS SECTION:
   ⚠️ MANDATORY: Include ALL skills from the original CV
   - Keep all skills, just reorder by relevance to the job (most important first)
   - Prioritize skills mentioned in the job description at the top
   - Group by category if needed (Technical, Tools, Methodologies)
   - Include exact tool names/versions from job posting when candidate has them
   - Format compactly to save space (comma-separated or short list)

C) WORK EXPERIENCE (CRITICAL - KEEP ALL EXPERIENCES):
   ⚠️ MANDATORY: You MUST include EVERY SINGLE work experience from the original CV. DO NOT remove, skip, or omit any experience.
   - Title: Keep exact title (DO NOT change)
   - Company: Keep factual (DO NOT change)
   - Dates: Keep factual (DO NOT change)
   - Location: Keep if present (DO NOT change)
   - For EACH experience, adapt ONLY the bullet points/descriptions:
     * Keep the SAME NUMBER of bullets (or condense if too many, but keep all key points)
     * Rewrite bullets to match job description language and keywords
     * Start with STRONG action verbs (Led, Spearheaded, Architected, Optimized, Delivered, Implemented, etc.)
     * MIRROR the job description's language and keywords naturally
     * Quantify results when present in original CV (%, $, time, scale, impact)
     * Focus on outcomes and achievements, not just tasks
     * Make each bullet UNIQUE and SPECIFIC to that role
     * Keep bullets concise (≤20 words per bullet to fit one page)
     * Use present tense for current role, past tense for previous roles
     * If an experience has many bullets, prioritize the most relevant ones but keep a summary of others
   - You may reorder experiences to put most relevant first, but ALL must be included

D) EDUCATION:
   ⚠️ MANDATORY: Include ALL education entries from the original CV
   - Keep ALL degrees, institutions, dates exactly as they appear
   - Keep relevant coursework, honors, or projects if present
   - You may condense descriptions but keep all entries

E) SKILLS:
   ⚠️ MANDATORY: Include ALL skills from the original CV
   - Keep all skills, just reorder by relevance to the job
   - Prioritize skills mentioned in job description at the top
   - Do not remove any skills

F) LANGUAGES:
   ⚠️ MANDATORY: Include ALL languages from the original CV
   - Keep all languages exactly as they appear

G) CERTIFICATIONS/ADDITIONAL:
   ⚠️ MANDATORY: Include ALL certifications from the original CV
   - Keep all certifications, just reorder by relevance if needed
   - Do not remove any certifications

STEP 4: ONE-PAGE CV OPTIMIZATION & QUALITY CHECKS
CRITICAL RULES - NEVER VIOLATE:
- ✅ DO preserve ALL factual information (dates, companies, titles, achievements)
- ✅ DO include ALL experiences, ALL education, ALL skills, ALL certifications from original CV
- ✅ DO rephrase and emphasize existing content to match job keywords
- ✅ DO reorder sections/experiences to highlight most relevant first
- ✅ DO use job posting terminology when describing similar experiences
- ✅ DO condense bullet points to fit one page (aim for 3-5 bullets per experience, max 20 words each)
- ✅ DO prioritize most relevant content but keep everything
- ❌ DO NOT invent skills, experiences, or achievements
- ❌ DO NOT change dates, company names, or job titles
- ❌ DO NOT remove any work experience, education entry, skill, language, or certification
- ❌ DO NOT add qualifications the candidate doesn't have
- ❌ DO NOT exaggerate or fabricate accomplishments

ONE-PAGE CV REQUIREMENTS:
- The final CV must fit on ONE page
- To achieve this, condense bullet points (3-5 per experience instead of 6-8)
- Keep descriptions concise (max 20 words per bullet)
- Prioritize most relevant experiences at the top with more detail
- Less relevant experiences can have fewer bullets but must still be included
- Professional summary should be 2-3 sentences (50-60 words max)
- Skills section: list all skills but in a compact format

Additional Quality Checks:
- Ensure NO DUPLICATION of accomplishments across different roles
- Verify consistent tense usage (present for current, past for previous)
- Confirm all facts are preserved (no inventions)
- Confirm ALL original experiences are included (count them)
- Validate ATS-friendly formatting (no tables, columns, or special characters)
- Check that top 15 keywords from job description appear naturally in CV
- Ensure natural language flow (don't stuff keywords unnaturally)
- Verify the CV fits on one page when formatted

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT - CRITICAL
═══════════════════════════════════════════════════════════════════

Return ONLY a valid JSON object (NO markdown, NO code blocks, NO explanations).
The JSON MUST have this EXACT structure:
{
  "optimizedResumeMarkdown": "<full optimized CV in Markdown format with all sections>",
  "atsScore": <integer 0-100, calculated based on keyword matching and relevance>,
  "keywordsUsed": ["keyword1 from job posting that appears in optimized CV", "keyword2", ...],
  "changesSummary": [
    "Brief description of what changed and why (e.g., 'Emphasized React experience in summary to match job requirements')",
    "Another change...",
    ...
  ],
  "shortSummary": "2-3 lines executive summary of the candidate tailored specifically to this role",
  "structuredCV": {
    "personalInfo": {
      "firstName": "<extracted from CV>",
      "lastName": "<extracted from CV>",
      "email": "<extracted from CV>",
      "phone": "<extracted from CV>",
      "location": "<extracted from CV>",
      "linkedin": "<extracted from CV, if present>",
      "portfolio": "<extracted from CV, if present>",
      "jobTitle": "<current or most recent job title>"
    },
    "professionalSummary": "<optimized professional summary tailored to the job>",
    "experiences": [
      {
        "title": "<job title, keep factual>",
        "company": "<company name, keep factual>",
        "startDate": "<start date, keep factual>",
        "endDate": "<end date or 'Present', keep factual>",
        "isCurrent": <true/false>,
        "description": ["<optimized bullet point 1>", "<optimized bullet point 2>", ...]
      }
    ],
    "educations": [
      {
        "degree": "<degree name, keep factual>",
        "institution": "<institution name, keep factual>",
        "startDate": "<start date, if available>",
        "endDate": "<end date, keep factual>",
        "isCurrent": <true/false>,
        "description": "<any additional info like GPA, honors, relevant coursework>"
      }
    ],
    "skills": [
      { "name": "<skill name>", "level": "Beginner|Intermediate|Advanced|Expert" }
    ],
    "languages": [
      { "name": "<language name>", "level": "Basic|Intermediate|Advanced|Native" }
    ],
    "certificates": [
      { "name": "<certificate name>", "issuer": "<issuing organization>", "date": "<date if available>" }
    ]
  }
}

CRITICAL INSTRUCTIONS FOR structuredCV:
- Extract ALL information from the optimizedResumeMarkdown
- ⚠️ MANDATORY: Include ALL experiences from the original CV - count them and ensure none are missing
- ⚠️ MANDATORY: Include ALL educations from the original CV
- ⚠️ MANDATORY: Include ALL skills from the original CV
- ⚠️ MANDATORY: Include ALL languages from the original CV
- ⚠️ MANDATORY: Include ALL certificates from the original CV
- For skills: If no level is specified in CV, default to "Intermediate"
- For languages: If no level is specified, default to "Intermediate"
- Ensure dates are preserved exactly as they appear in the CV
- The structuredCV should be a complete representation of the optimizedResumeMarkdown
- Each experience should have optimized descriptions but the same structure (title, company, dates)

IMPORTANT FORMATTING FOR optimizedResumeMarkdown:
- Use "#" for main title (candidate name)
- Use "##" for major sections (Professional Summary, Work Experience, Education, etc.)
- Use "###" for individual roles within Work Experience
- Use "-" for bullet points
- Keep clean, ATS-friendly formatting (no tables, columns, or special markdown fences)
- Preserve all factual information while optimizing language and emphasis
- Format to fit ONE PAGE: concise bullets (max 20 words), 3-5 bullets per experience
- Include ALL experiences, even if some have fewer bullets to fit the page
`.trim();
}

function formatDateString(dateString: string): string {
  if (dateString && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
}
