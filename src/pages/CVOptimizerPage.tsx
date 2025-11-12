import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Briefcase, Building2, Sparkles, Upload, Check, X, 
  ChevronRight, Trash2, Loader2,
  Wand2, Calendar, Info, AlignLeft, Search, Filter, XCircle,
  ArrowUpDown, LayoutGrid, List
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
import LoadingModal from '../components/LoadingModal';

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

  // Delete optimized CV
  const deleteOptimizedCV = async (cvId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cvId));
      setOptimizedCVs(prev => prev.filter(cv => cv.id !== cvId));
      toast.success('Optimized resume deleted');
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

      // Step 2: Extract CV text with GPT‑5 Vision
      setLoadingStep('analyzing');
      setLoadingProgress(40);
      setLoadingMessage('Extracting resume content...');

      const cvExtractionPrompt = `
Analyze this resume/CV image and extract ALL text content in a structured format.

Extract:
1. Personal information (name, email, phone, address, LinkedIn, etc.)
2. Professional summary/objective (if present)
3. Work experience (all positions with dates, companies, titles, descriptions)
4. Education (degrees, institutions, dates)
5. Skills (technical skills, soft skills, languages)
6. Certifications (if any)
7. Projects (if any)
8. Any other relevant sections

Return the extracted content as a JSON object with this exact structure:
{
  "text": "Full extracted text content preserving structure and formatting",
  "extractedText": "Full extracted text content preserving structure and formatting"
}

Be thorough and extract EVERYTHING visible on the resume. The "text" and "extractedText" fields should contain the complete extracted text content.
`;

      const extractionResponse = await fetch('/api/analyze-cv-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: cvExtractionPrompt },
                ...images.map(img => ({
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${img}` }
                }))
              ]
            }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      let cvText = '';
      let extractionOk = false;
      try {
        if (!extractionResponse.ok) {
          const errorData = await extractionResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to extract CV content');
        }

        const extractionData = await extractionResponse.json();
        
        if (extractionData.status !== 'success') {
          throw new Error(extractionData.message || 'Failed to extract CV content');
        }

        // Handle different response formats
        if (typeof extractionData.content === 'string') {
          try {
            const normalized = extractionData.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(normalized);
            cvText = parsed.text || parsed.extractedText || normalized;
          } catch {
            cvText = extractionData.content;
          }
        } else if (extractionData.content && typeof extractionData.content === 'object') {
          cvText = extractionData.content.text || extractionData.content.extractedText || '';
        }
        extractionOk = !!cvText;
      } catch (e) {
        console.warn('Vision extraction failed, will try pdfjs fallback', e);
      }

      // Fallback via pdfjs if needed
      if (!extractionOk) {
        setLoadingStep('analyzing');
        setLoadingMessage('Fallback: extracting text from PDF...');
        const text = await extractTextWithPDFJS(cvFile);
        cvText = text;
      }

      if (!cvText || cvText.trim().length < 50) {
        throw new Error('Extracted CV content is too short or empty. Please ensure your resume is clear and readable.');
      }

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
          const extractResponse = await fetch('/api/extract-job-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: formData.jobUrl.trim() })
          });

          if (!extractResponse.ok) {
            const errorText = await extractResponse.text();
            console.error('❌ Extraction failed:', extractResponse.status, errorText);
            throw new Error(`Failed to extract job posting: ${extractResponse.status === 404 ? 'Endpoint not found. Please restart the server.' : extractResponse.statusText}`);
          }

          const extractData = await extractResponse.json();
          if (extractData.status === 'success') {
            jobDescription = extractData.content || jobDescription;
            jobTitle = extractData.title || jobTitle;
            company = extractData.company || company;
            // Update formData with extracted values so they're saved correctly
            setFormData({
              ...formData,
              jobTitle: jobTitle,
              company: company,
              jobDescription: jobDescription
            });
            console.log('✅ Job content extracted for optimization');
          } else {
            throw new Error(extractData.message || 'Failed to extract job posting content');
          }
        } catch (extractError: any) {
          console.error('❌ Failed to extract job content:', extractError);
          // If extraction fails, we cannot continue without job description
          throw new Error(`Failed to extract job posting from URL: ${extractError.message || 'Unknown error'}. Please try manual entry or check the URL.`);
        }
      }

      if (!jobDescription || jobDescription.trim().length < 50) {
        throw new Error('Job description is required. Please provide job information.');
      }

      // Step 4: Optimize with AI using the job posting content
      setLoadingStep('retargeting');
      setLoadingProgress(75);
      setLoadingMessage('Retargeting CV to the job description...');

      const optimizationPrompt = buildOptimizationPrompt({
        cvText,
        jobTitle: jobTitle || 'Not specified',
        company: company || 'Not specified',
        jobDescription: jobDescription,
        jobUrl: formData.jobUrl || undefined
      });

      // Move to matching while calling optimizer
      setLoadingStep('matching');
      setLoadingMessage('Optimizing resume with AI...');

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
      if (typeof optimizationData.content === 'string') {
        const normalized = optimizationData.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        optimizedResult = JSON.parse(normalized);
      } else {
        optimizedResult = optimizationData.content;
      }

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
        optimizedResumeMarkdown: optimizedResult.optimizedResumeMarkdown,
        atsScore: optimizedResult.atsScore,
        keywordsUsed: optimizedResult.keywordsUsed,
        changesSummary: optimizedResult.changesSummary,
        shortSummary: optimizedResult.shortSummary,
        cvFileName: cvFile.name
      });

      // Parse markdown to structured data and persist, then navigate to editor
      if (savedId && currentUser) {
        console.log('🔍 DEBUG: Checking structuredCV from AI response...');
        console.log('structuredCV present:', !!optimizedResult.structuredCV);
        
        // Prefer structuredCV from the model if present; fall back to parsing markdown
        let structured = optimizedResult.structuredCV;
        
        if (!structured || !structured.personalInfo) {
          console.warn('⚠️ structuredCV missing or invalid, parsing markdown instead...');
          console.log('optimizedResumeMarkdown length:', optimizedResult.optimizedResumeMarkdown?.length || 0);
          structured = parseMarkdownToCVData(optimizedResult.optimizedResumeMarkdown || '');
          console.log('Parsed cvData:', {
            hasName: !!structured.personalInfo.firstName,
            expCount: structured.experiences.length,
            eduCount: structured.educations.length,
            skillsCount: structured.skills.length
          });
        } else {
          console.log('✅ Using structuredCV from AI:', {
            hasName: !!structured.personalInfo.firstName,
            expCount: structured.experiences?.length || 0,
            eduCount: structured.educations?.length || 0,
            skillsCount: structured.skills?.length || 0
          });
        }
        
        try {
          await updateDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', savedId), {
            cvData: structured,
          });
          console.log('✅ cvData saved successfully to Firestore');
        } catch (e) {
          console.error('❌ Failed to save structured cvData:', e);
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
                CV Optimizer
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
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {optimizedCVs.length > 0 
                      ? Math.round(optimizedCVs.reduce((sum, cv) => sum + (cv.atsScore || 0), 0) / optimizedCVs.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
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
        {filteredCVs.length > 0 ? (
          <div className={`${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }`}>
            {filteredCVs.map((cv) => (
              <motion.div
                key={cv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 
                  hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/cv-optimizer/${cv.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {cv.jobTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {cv.company}
                    </p>
                  </div>
                  {cv.atsScore && (
                    <div className={`text-2xl font-bold ${
                      cv.atsScore >= 80 ? 'text-purple-600' :
                      cv.atsScore >= 65 ? 'text-blue-600' : 'text-pink-600'
                    }`}>
                      {cv.atsScore}%
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateString(cv.date)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOptimizedCV(cv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {cv.keywordsUsed && cv.keywordsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cv.keywordsUsed.slice(0, 5).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                    {cv.keywordsUsed.length > 5 && (
                      <span className="text-[10px] text-gray-400">+{cv.keywordsUsed.length - 5}</span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
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
                  {/* Step Progress Indicator */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center w-full relative px-2">
                      {/* Progress Bar Background */}
                      <div className="absolute h-0.5 bg-gray-200 dark:bg-gray-700 left-8 right-8 top-1/2 -translate-y-1/2 z-0 rounded-full"></div>
                      {/* Progress Bar Fill */}
                      <div 
                        className="absolute h-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 left-8 top-1/2 -translate-y-1/2 z-10 transition-all duration-500 ease-out rounded-full"
                        style={{ 
                          width: currentStep === 1 
                            ? '0%' 
                            : `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                          maxWidth: 'calc(100% - 4rem)'
                        }}
                      ></div>
                      
                      {/* Step Circles */}
                      {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        
                        return (
                          <div 
                            key={step.title} 
                            className="z-20 flex flex-col items-center flex-1 relative"
                          >
                            <div 
                              className={`
                                w-10 h-10 rounded-full flex items-center justify-center mb-2
                                transition-all duration-300 ease-out
                                ${isActive 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white ring-4 ring-purple-100 dark:ring-purple-900/30 shadow-lg shadow-purple-500/20 scale-110' 
                                  : isCompleted 
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/10' 
                                    : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600'
                                }
                              `}
                            >
                              {isCompleted ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-semibold">
                                  {stepNumber}
                                </span>
                              )}
                            </div>
                            <span className={`
                              text-xs font-medium text-center transition-colors duration-300
                              ${isActive 
                                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                                : isCompleted
                                  ? 'text-gray-700 dark:text-gray-300'
                                  : 'text-gray-400 dark:text-gray-500'
                              }
                            `}>
                              {step.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
        <LoadingModal
          isOpen={isLoading}
          progress={loadingProgress}
          message={loadingMessage}
        />
      </div>
    </AuthLayout>
  );
}

function buildOptimizationPrompt(params: { cvText: string; jobTitle: string; company: string; jobDescription: string; jobUrl?: string }) {
  const { cvText, jobTitle, company, jobDescription, jobUrl } = params;
  return `
You are a principal CV optimization expert and ATS specialist. Your mission is to transform this candidate's CV to PERFECTLY match the target job while preserving truth and authenticity.

═══════════════════════════════════════════════════════════════════
TARGET JOB
═══════════════════════════════════════════════════════════════════
Position: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}
${jobUrl ? `Job Posting URL: ${jobUrl}` : ''}

Full Job Description (extracted from the job posting${jobUrl ? ` at ${jobUrl}` : ''}):
"""
${jobDescription}
"""

${jobUrl ? `NOTE: The job description above was extracted from the job posting URL: ${jobUrl}. Analyze this content carefully to understand the exact requirements, responsibilities, and qualifications needed for this position.` : ''}

═══════════════════════════════════════════════════════════════════
CANDIDATE'S CURRENT CV
═══════════════════════════════════════════════════════════════════
"""
${cvText}
"""

═══════════════════════════════════════════════════════════════════
YOUR MISSION - CRITICAL OPTIMIZATION STEPS
═══════════════════════════════════════════════════════════════════

STEP 1: DEEP ANALYSIS
Analyze the job description line by line and extract:
- Must-have technical skills, tools, technologies, frameworks
- Must-have soft skills and methodologies
- Key responsibilities and expected outcomes
- Industry-specific terminology and jargon
- Seniority level and years of experience expected
- Company culture indicators

STEP 2: CV GAP ANALYSIS
Compare the candidate's CV with the job requirements:
- What EXACTLY matches (skills, tools, responsibilities, outcomes)
- What the candidate HAS but is UNDER-EMPHASIZED (hidden gems to highlight)
- What's IRRELEVANT for this specific job (de-emphasize or remove)
- What's MISSING entirely (acknowledge but don't invent)

STEP 3: STRATEGIC REWRITING
Transform each section to maximize ATS score and recruiter appeal:

A) PROFESSIONAL SUMMARY (2-4 sentences, ~50-80 words):
   - Lead with years of experience + exact job title match if applicable
   - Mention 3-4 TOP skills/tools from the job description that the candidate has
   - Include 1-2 quantified achievements that relate to the role
   - Use power words from the job posting

B) SKILLS SECTION (6-12 items):
   - Prioritize skills mentioned in the job description that the candidate has
   - Group by category if needed (Technical, Tools, Methodologies)
   - Include exact tool names/versions from job posting when candidate has them
   - Order by relevance to the job (most important first)

C) WORK EXPERIENCE (PER ROLE):
   - Title: Keep exact title or adapt slightly to match job posting terminology
   - Company: Keep factual
   - Dates: Keep factual
   - Bullets (4-6 per role):
     * Start with STRONG action verbs (Led, Spearheaded, Architected, Optimized, Delivered, Implemented, etc.)
     * MIRROR the job description's language and keywords naturally
     * Quantify results when implied by original CV (%, $, time, scale, impact)
     * Focus on outcomes and achievements, not just tasks
     * Make each bullet UNIQUE and SPECIFIC to that role
     * Keep bullets concise (≤22 words)
     * Use present tense for current role, past tense for previous roles
     * PRIORITIZE experiences that match the target job (reorder if needed)

D) EDUCATION:
   - Keep factual
   - Add relevant coursework, honors, or projects ONLY if they relate to the target job
   - De-emphasize if not directly relevant

E) CERTIFICATIONS/ADDITIONAL:
   - Highlight only if relevant to the job
   - Remove if not adding value for this specific role

STEP 4: QUALITY CHECKS
- Ensure NO DUPLICATION of accomplishments across different roles
- Verify consistent tense usage
- Confirm all facts are preserved (no inventions)
- Validate ATS-friendly formatting (no tables, columns, or special characters)
- Check that top 10 keywords from job description appear naturally in CV

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT - CRITICAL
═══════════════════════════════════════════════════════════════════

Return ONLY a valid JSON object (NO markdown, NO code blocks, NO explanations).
The JSON MUST have this EXACT structure:
{
  "optimizedResumeMarkdown": "<full CV in Markdown with the sections above>",
  "atsScore": <integer 0-100>,
  "keywordsUsed": ["keyword1 from job posting", "..."],
  "changesSummary": ["what changed and why", "..."],
  "shortSummary": "2-3 lines executive summary tailored to the role",
  "structuredCV": {
    "personalInfo": {
      "firstName": "", "lastName": "", "email": "", "phone": "",
      "location": "", "linkedin": "", "portfolio": "", "jobTitle": ""
    },
    "professionalSummary": "",
    "experiences": [
      { "title": "", "company": "", "startDate": "", "endDate": "", "isCurrent": false, "description": ["...","..."] }
    ],
    "educations": [
      { "degree": "", "institution": "", "startDate": "", "endDate": "", "isCurrent": false, "description": "" }
    ],
    "skills": [{ "name": "", "level": "Beginner|Intermediate|Advanced|Expert" }],
    "languages": [{ "name": "", "level": "Basic|Intermediate|Advanced|Native" }],
    "certificates": [{ "name": "", "issuer": "", "date": "" }]
  }
}

IMPORTANT FORMATTING
- Use "#" for title, "##" for sections, "-" bullets, blank lines between sections.
- Keep clean, ATS-friendly, no tables/columns, no markdown fences.
`.trim();
}

function formatDateString(dateString: string): string {
  if (dateString && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
}
