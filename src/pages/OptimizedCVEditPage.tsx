import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  ArrowLeft, Download, Save, FileText, Check, Loader2, Sparkles, Copy, Trash2,
  ChevronDown, Copy as CopyIcon, Plus, X, GripVertical, Upload,
  Mail, Phone, MapPin, Link as LinkIcon, Info, Briefcase, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { notify } from '@/lib/notify';
import { toResumeJson } from '../lib/resumeAdapter';
import { db } from '../lib/firebase';

// CV Data Structure
interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  jobTitle: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string[];
  order: number;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  order: number;
}

interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  order: number;
}

interface Language {
  id: string;
  name: string;
  level: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
  order: number;
}

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  order: number;
}

interface Hobby {
  id: string;
  name: string;
  order: number;
}

interface CVData {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  languages: Language[];
  certificates: Certificate[];
  hobbies?: Hobby[];
}

function normalizeCVData(input: CVData): CVData {
  const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
  const safeArray = <T,>(arr: T[] | undefined | null): T[] => Array.isArray(arr) ? [...arr] : [];
  const normalized: CVData = {
    personalInfo: clone(input.personalInfo || {
      firstName: '', lastName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', jobTitle: ''
    }),
    professionalSummary: input.professionalSummary || '',
    experiences: (input.experiences || []).map((e, idx) => ({
      id: e.id || `exp-${idx}-${Date.now()}`,
      title: e.title || '',
      company: e.company || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      isCurrent: !!e.isCurrent,
      description: safeArray(e.description),
      order: typeof e.order === 'number' ? e.order : idx,
    })),
    educations: (input.educations || []).map((e, idx) => ({
      id: e.id || `edu-${idx}-${Date.now()}`,
      degree: e.degree || '',
      institution: e.institution || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      isCurrent: !!e.isCurrent,
      description: e.description || '',
      order: typeof e.order === 'number' ? e.order : idx,
    })),
    skills: (input.skills || []).map((s, idx) => ({
      id: s.id || `skill-${idx}-${Date.now()}`,
      name: s.name || '',
      level: (s.level as any) || 'Intermediate',
      order: typeof s.order === 'number' ? s.order : idx,
    })),
    languages: (input.languages || []).map((l, idx) => ({
      id: l.id || `lang-${idx}-${Date.now()}`,
      name: l.name || '',
      level: (l.level as any) || 'Intermediate',
      order: typeof l.order === 'number' ? l.order : idx,
    })),
    certificates: (input.certificates || []).map((c, idx) => ({
      id: c.id || `cert-${idx}-${Date.now()}`,
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || '',
      order: typeof c.order === 'number' ? c.order : idx,
    })),
    hobbies: (input.hobbies || []).map((h, idx) => ({
      id: h.id || `hobby-${idx}-${Date.now()}`,
      name: h.name || '',
      order: typeof h.order === 'number' ? h.order : idx,
    })),
  };
  return normalized;
}

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
  cvData?: CVData;
  cvPhoto?: string;
  language?: string; // Language code (e.g., 'en', 'fr', 'es', 'de', 'it')
  originalCVId?: string; // ID of the original CV if this is a translation
}


const fontOptions = [
  { name: 'Inter (Modern, clean)', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto (Professional)', value: 'Roboto, sans-serif' },
  { name: 'Lato (Clear, readable)', value: 'Lato, sans-serif' },
  { name: 'Open Sans (Classic)', value: 'Open Sans, sans-serif' },
  { name: 'Merriweather (Elegant serif)', value: 'Merriweather, serif' },
  { name: 'Crimson Text (Formal serif)', value: 'Crimson Text, serif' },
  { name: 'Source Sans Pro (Technical)', value: 'Source Sans Pro, sans-serif' },
];


// Parse Markdown to CV Data structure - Improved version
function parseMarkdownToCVData(markdown: string): CVData {
  // Normalize common bullet and line endings, keep original content as much as possible
  const normalized = markdown
    .replace(/\u2022/g, '-') // • -> -
    .replace(/\r/g, '');
  const lines = normalized.split('\n');
  const cvData: CVData = {
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
  let currentExperience: Partial<Experience> | null = null;
  let currentEducation: Partial<Education> | null = null;
  let experienceId = 0;
  let educationId = 0;
  let skillId = 0;
  let languageId = 0;
  let certificateId = 0;
  let hobbyId = 0;

  // First pass: Extract personal info from header - Improved extraction
  // Try multiple patterns for name extraction
  const namePatterns = [
    /^#\s*(.+?)(?:\n|$)/m,  // # Name
    /^##\s*(.+?)(?:\n|$)/m, // ## Name
    /^(.+?)\n(?:Email|Phone|Location|LinkedIn)/i, // Name before contact info
  ];
  
  for (const pattern of namePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const nameText = match[1].trim();
      // Skip if it looks like a section title
      if (!nameText.toLowerCase().includes('experience') && 
          !nameText.toLowerCase().includes('education') &&
          !nameText.toLowerCase().includes('summary') &&
          !nameText.toLowerCase().includes('skill')) {
        const nameParts = nameText.split(/\s+/);
        if (nameParts.length >= 2) {
          cvData.personalInfo.firstName = nameParts[0];
          cvData.personalInfo.lastName = nameParts.slice(1).join(' ');
          break;
        } else if (nameParts.length === 1 && nameParts[0].length > 1) {
          cvData.personalInfo.firstName = nameParts[0];
          break;
        }
      }
    }
  }

  // Extract email - improved pattern
  const emailPatterns = [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    /Email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ];
  for (const pattern of emailPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      cvData.personalInfo.email = match[1] || match[0];
      break;
    }
  }

  // Extract phone - improved patterns
  const phonePatterns = [
    /Phone[:\s]+([+\d\s\-\(\)]+)/i,
    /Tel[:\s]+([+\d\s\-\(\)]+)/i,
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /(\+\d{1,3}[\s\-]?)?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/,
  ];
  for (const pattern of phonePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const phone = (match[1] || match[0]).trim();
      if (phone.length >= 8) {
        cvData.personalInfo.phone = phone;
        break;
      }
    }
  }

  // Extract LinkedIn - improved patterns
  const linkedinPatterns = [
    /LinkedIn[:\s]+(https?:\/\/)?(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
    /(https?:\/\/)?(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
    /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
  ];
  for (const pattern of linkedinPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const linkedin = match[0];
      cvData.personalInfo.linkedin = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
      break;
    }
  }

  // Extract location - improved patterns
  const locationPatterns = [
    /Location[:\s]+([^\n]+)/i,
    /Adresse[:\s]+([^\n]+)/i,
    /Address[:\s]+([^\n]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s+[A-Z]{2})?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)/,
  ];
  for (const pattern of locationPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const location = (match[1] || match[0]).trim();
      // Filter out false positives
      if (location.length > 2 && location.length < 100 && 
          !location.toLowerCase().includes('email') &&
          !location.toLowerCase().includes('phone')) {
        cvData.personalInfo.location = location;
        break;
      }
    }
  }

  // Extract job title from header or first section
  const jobTitlePatterns = [
    /Job Title[:\s]+([^\n]+)/i,
    /Position[:\s]+([^\n]+)/i,
    /Title[:\s]+([^\n]+)/i,
  ];
  for (const pattern of jobTitlePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      cvData.personalInfo.jobTitle = match[1].trim();
      break;
    }
  }

  // Main parsing loop
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect sections
    if (line.startsWith('# ')) {
      const sectionTitle = line.substring(2).toLowerCase();
      if (sectionTitle.includes('experience') || sectionTitle.includes('expérience') || sectionTitle.includes('work')) {
        currentSection = 'experience';
      } else if (sectionTitle.includes('education') || sectionTitle.includes('formation') || sectionTitle.includes('formation')) {
        currentSection = 'education';
      } else if (sectionTitle.includes('skill') || sectionTitle.includes('compétence') || sectionTitle.includes('competence')) {
        currentSection = 'skills';
      } else if (sectionTitle.includes('language') || sectionTitle.includes('langue')) {
        currentSection = 'languages';
      } else if (sectionTitle.includes('certificate') || sectionTitle.includes('certificat')) {
        currentSection = 'certificates';
      } else if (sectionTitle.includes('hobby') || sectionTitle.includes('hobbie') || sectionTitle.includes('interest') || sectionTitle.includes('loisir')) {
        currentSection = 'hobbies';
      } else if (sectionTitle.includes('summary') || sectionTitle.includes('résumé') || sectionTitle.includes('resume') || sectionTitle.includes('professional')) {
        currentSection = 'summary';
      } else if (sectionTitle.includes('personal') || sectionTitle.includes('contact') || sectionTitle.includes('header')) {
        currentSection = 'personal';
      }
    } else if (line.startsWith('## ')) {
      // Subsection (e.g., job title or company)
      const title = line.substring(3).trim();
      
      if (currentSection === 'experience') {
        // Save previous experience
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
        
        // Parse title and company from format like "Job Title - Company" or "Job Title at Company"
        const titleCompanyMatch = title.match(/^(.+?)(?:\s*[-–—]\s*|\s+at\s+|\s+chez\s+)(.+)$/i);
        if (titleCompanyMatch) {
          currentExperience = {
            title: titleCompanyMatch[1].trim(),
            company: titleCompanyMatch[2].trim(),
            description: [],
          };
        } else {
          currentExperience = { title, company: '', description: [] };
        }
      } else if (currentSection === 'education') {
        // Save previous education
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
        
        // Parse degree and institution
        const degreeInstitutionMatch = title.match(/^(.+?)(?:\s*[-–—]\s*|\s+at\s+|\s+à\s+)(.+)$/i);
        if (degreeInstitutionMatch) {
          currentEducation = {
            degree: degreeInstitutionMatch[1].trim(),
            institution: degreeInstitutionMatch[2].trim(),
          };
        } else {
          currentEducation = { degree: title, institution: '' };
        }
      }
    } else if (
      // Headerless uppercase section titles like "EXPERIENCE", "WORK EXPERIENCE", etc.
      /^[A-Z][A-Z\s]+:?$/.test(line) ||
      /^(Experience|Work Experience|Education|Summary|Professional Summary|Skills|Languages|Certificates|Hobbies|Interests|Loisirs)[:\s]*$/i.test(line)
    ) {
      const t = line.replace(/[:]/g, '').trim().toLowerCase();
      if (t.includes('experience') && !t.includes('education')) currentSection = 'experience';
      else if (t.includes('education') || t.includes('formation')) currentSection = 'education';
      else if (t.includes('summary') || t.includes('professional')) currentSection = 'summary';
      else if (t.includes('skill')) currentSection = 'skills';
      else if (t.includes('language')) currentSection = 'languages';
      else if (t.includes('certificate')) currentSection = 'certificates';
      else if (t.includes('hobbies') || t.includes('interests') || t.includes('loisirs')) currentSection = 'hobbies';
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet point
      const bullet = line.substring(2).trim();
      if (currentSection === 'experience' && currentExperience) {
        if (!currentExperience.description) {
          currentExperience.description = [];
        }
        currentExperience.description.push(bullet);
      } else if (currentSection === 'summary') {
        cvData.professionalSummary += bullet + ' ';
      } else if (currentSection === 'skills') {
        // Parse skill with optional level
        const skillMatch = bullet.match(/^(.+?)(?:\s*[-–—]\s*(Beginner|Intermediate|Advanced|Expert|Débutant|Intermédiaire|Avancé|Expert))?$/i);
        if (skillMatch) {
          cvData.skills.push({
            id: `skill-${skillId++}`,
            name: skillMatch[1].trim(),
            level: (skillMatch[2] as any) || 'Intermediate',
            order: cvData.skills.length,
          });
        }
      } else if (currentSection === 'languages') {
        // Parse language with level
        const langMatch = bullet.match(/^(.+?)(?:\s*[-–—]\s*(Basic|Intermediate|Advanced|Native|Débutant|Intermédiaire|Avancé|Natif|Courant|Bilingue))?$/i);
        if (langMatch) {
          cvData.languages.push({
            id: `lang-${languageId++}`,
            name: langMatch[1].trim(),
            level: (langMatch[2] as any) || 'Intermediate',
            order: cvData.languages.length,
          });
        }
      } else if (currentSection === 'certificates') {
        // Parse certificate
        const certMatch = bullet.match(/^(.+?)(?:\s*[-–—]\s*(.+?)(?:\s*\((.+?)\))?)?$/);
        if (certMatch) {
          cvData.certificates.push({
            id: `cert-${certificateId++}`,
            name: certMatch[1].trim(),
            issuer: certMatch[2]?.trim() || '',
            date: certMatch[3]?.trim() || '',
            order: cvData.certificates.length,
          });
        }
      } else if (currentSection === 'hobbies') {
        cvData.hobbies!.push({
          id: `hobby-${hobbyId++}`,
          name: bullet,
          order: cvData.hobbies!.length,
        });
      }
    } else if (line && !line.startsWith('#')) {
      // Regular text line
      if (currentSection === 'summary') {
        cvData.professionalSummary += line + ' ';
      } else if (currentSection === 'experience' && currentExperience) {
        // Try to extract dates from line
        const dateMatch = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|Present|Présent|Actuel|Current)/i);
        if (dateMatch) {
          currentExperience.startDate = dateMatch[1];
          currentExperience.endDate = dateMatch[2];
          currentExperience.isCurrent = /present|présent|actuel|current/i.test(dateMatch[2]);
        } else if (!currentExperience.company && line.length > 0) {
          // If no company yet, this might be the company
          currentExperience.company = line;
        }
      } else if (currentSection === 'education' && currentEducation) {
        // Try to extract dates or institution
        const dateMatch = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|Present|Présent|Actuel|Current)/i);
        if (dateMatch) {
          currentEducation.startDate = dateMatch[1];
          currentEducation.endDate = dateMatch[2];
          currentEducation.isCurrent = /present|présent|actuel|current/i.test(dateMatch[2]);
        } else if (!currentEducation.institution && line.length > 0) {
          // If no institution yet, this might be the institution
          currentEducation.institution = line;
        } else if (line.length > 0) {
          // Description
          currentEducation.description = (currentEducation.description || '') + line + ' ';
        }
      }
    }
  }

  // Add last experience/education
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
      description: currentEducation.description?.trim(),
      order: cvData.educations.length,
    });
  }

  // Clean up professional summary
  cvData.professionalSummary = cvData.professionalSummary.trim();

  return cvData;
}

// Convert CV Data to Markdown
function convertCVDataToMarkdown(cvData: CVData): string {
  let markdown = '';

  // Personal Information (CRITICAL: Include all personal info for context)
  if (cvData.personalInfo) {
    const pi = cvData.personalInfo;
    const fullName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
    if (fullName) {
      markdown += `# ${fullName}\n\n`;
    }
    
    // Contact information
    const contactInfo: string[] = [];
    if (pi.email) contactInfo.push(`Email: ${pi.email}`);
    if (pi.phone) contactInfo.push(`Phone: ${pi.phone}`);
    if (pi.location) contactInfo.push(`Location: ${pi.location}`);
    if (pi.linkedin) contactInfo.push(`LinkedIn: ${pi.linkedin}`);
    if (pi.portfolio) contactInfo.push(`Portfolio: ${pi.portfolio}`);
    if (pi.jobTitle) contactInfo.push(`Current Title: ${pi.jobTitle}`);
    
    if (contactInfo.length > 0) {
      markdown += contactInfo.join(' | ') + '\n\n';
    }
  }

  // Professional Summary
  if (cvData.professionalSummary) {
    markdown += `# Professional Summary\n\n${cvData.professionalSummary.trim()}\n\n`;
  }

  // Experience
  if (cvData.experiences.length > 0) {
    markdown += `# Experience\n\n`;
    cvData.experiences.forEach(exp => {
      markdown += `## ${exp.title} - ${exp.company}\n`;
      markdown += `${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}\n\n`;
      if (exp.description && exp.description.length > 0) {
      exp.description.forEach(desc => {
        markdown += `- ${desc}\n`;
      });
      }
      markdown += '\n';
    });
  }

  // Education
  if (cvData.educations.length > 0) {
    markdown += `# Education\n\n`;
    cvData.educations.forEach(edu => {
      markdown += `## ${edu.degree}\n`;
      if (edu.institution) markdown += `${edu.institution}\n`;
      if (edu.startDate || edu.endDate) {
        markdown += `${edu.startDate || ''} - ${edu.isCurrent ? 'Present' : (edu.endDate || '')}\n`;
      }
      if (edu.description) {
        markdown += `${edu.description}\n`;
      }
      markdown += '\n';
    });
  }

  // Skills
  if (cvData.skills.length > 0) {
    markdown += `# Skills\n\n`;
    cvData.skills.forEach(skill => {
      markdown += `- ${skill.name}${skill.level ? ` - ${skill.level}` : ''}\n`;
    });
    markdown += '\n';
  }

  // Languages
  if (cvData.languages.length > 0) {
    markdown += `# Languages\n\n`;
    cvData.languages.forEach(lang => {
      markdown += `- ${lang.name}${lang.level ? ` - ${lang.level}` : ''}\n`;
    });
    markdown += '\n';
  }

  // Certificates
  if (cvData.certificates.length > 0) {
    markdown += `# Certificates\n\n`;
    cvData.certificates.forEach(cert => {
      const certParts = [cert.name];
      if (cert.issuer) certParts.push(cert.issuer);
      if (cert.date) certParts.push(`(${cert.date})`);
      markdown += `- ${certParts.join(' - ')}\n`;
    });
  }

  return markdown;
}

// Helper function to render a section based on sectionId
function renderCVSection(sectionId: string, cvData: CVData, styling: any, showSkillLevel: boolean = true) {
  switch (sectionId) {
    case 'professionalSummary':
      if (!cvData.professionalSummary) return null;
      return (
        <div key="professionalSummary" style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '10px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Professional Summary
          </h2>
          <p style={{ 
            fontSize: '11px',
            color: '#2d3748',
            lineHeight: '1.6',
            textAlign: 'justify',
            whiteSpace: 'pre-wrap'
          }}>
            {cvData.professionalSummary}
          </p>
        </div>
      );
    
    case 'experience':
      if (cvData.experiences.length === 0) return null;
      return (
        <div key="experience" style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Experience
          </h2>
          {cvData.experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '15px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '6px'
              }}>
                <h3 style={{ 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#1a202c'
                }}>
                  {exp.title || 'Job Title'} | {exp.company || 'Company'}
                </h3>
                <p style={{ 
                  fontSize: '10px',
                  color: '#4a5568',
                  whiteSpace: 'nowrap',
                  marginLeft: '10px'
                }}>
                  {exp.startDate || 'Start'} - {exp.isCurrent ? 'Present' : (exp.endDate || 'End')}
                </p>
              </div>
              {exp.description.length > 0 && (
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: '8px 0 0 0'
                }}>
                  {exp.description.map((desc, idx) => (
                    <li key={idx} style={{ 
                      fontSize: '10px',
                      color: '#2d3748',
                      lineHeight: '1.5',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ marginRight: '8px', color: styling.color }}>•</span>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    
    case 'education':
      if (cvData.educations.length === 0) return null;
      return (
        <div key="education" style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Education
          </h2>
          {cvData.educations.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '12px' }}>
              <h3 style={{ 
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#1a202c',
                marginBottom: '4px'
              }}>
                {edu.degree || 'Degree'}
              </h3>
              <p style={{ 
                fontSize: '10px',
                color: '#4a5568',
                marginBottom: '4px'
              }}>
                {edu.institution || 'Institution'}
                {edu.startDate && `, ${edu.startDate}${edu.endDate ? ` - ${edu.endDate}` : ''}`}
              </p>
              {edu.description && (
                <p style={{ 
                  fontSize: '10px',
                  color: '#2d3748',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    
    case 'skills':
      if (cvData.skills.length === 0) return null;
      return (
        <div key="skills" style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Skills
          </h2>
          <div style={{ fontSize: '10px', color: '#2d3748', lineHeight: '1.6' }}>
            {cvData.skills.map((skill) => (
              <span key={skill.id} style={{ marginRight: '12px' }}>
                {skill.name}{showSkillLevel && skill.level && ` (${skill.level})`}
              </span>
            ))}
          </div>
        </div>
      );
    
    case 'languages':
      if (cvData.languages.length === 0) return null;
      return (
        <div key="languages" style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Languages
          </h2>
          <div style={{ fontSize: '10px', color: '#2d3748', lineHeight: '1.6' }}>
            {cvData.languages.map((lang) => (
              <span key={lang.id} style={{ marginRight: '12px' }}>
                {lang.name} ({lang.level})
              </span>
            ))}
          </div>
        </div>
      );
    
    case 'certificates':
      if (cvData.certificates.length === 0) return null;
      return (
        <div key="certificates">
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Certificates
          </h2>
          {cvData.certificates.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '8px' }}>
              <p style={{ 
                fontSize: '11px',
                fontWeight: '600',
                color: '#1a202c',
                marginBottom: '2px'
              }}>
                {cert.name}
              </p>
              <p style={{ 
                fontSize: '10px',
                color: '#4a5568'
              }}>
                {cert.issuer} - {cert.date}
              </p>
            </div>
          ))}
        </div>
      );
    
    case 'hobbies':
      if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
      return (
        <div key="hobbies">
          <h2 style={{ 
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: styling.color,
            marginBottom: '12px',
            borderBottom: `1px solid ${styling.color}`,
            paddingBottom: '4px'
          }}>
            Hobbies
          </h2>
          <ul style={{ paddingLeft: '16px', margin: 0 }}>
            {cvData.hobbies.map((h) => (
              <li key={h.id} style={{ fontSize: '11px', color: '#1a202c', marginBottom: '4px' }}>
                {h.name}
              </li>
            ))}
          </ul>
        </div>
      );

    case 'hobbies':
      if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
      return (
        <div key="hobbies">
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: styling.color,
            borderBottom: `2px solid ${styling.color}`,
            paddingBottom: '5px',
            marginBottom: '10px'
          }}>
            HOBBIES
          </h2>
          <ul style={{ paddingLeft: '16px', margin: 0 }}>
            {cvData.hobbies.map((h) => (
              <li key={h.id} style={{ fontSize: '10px', color: '#1a202c', marginBottom: '4px' }}>
                {h.name}
              </li>
            ))}
          </ul>
        </div>
      );
    
    case 'hobbies':
      if (!cvData.hobbies || cvData.hobbies.length === 0) return null;
      return (
        <div key="hobbies" style={{ marginTop: '16px' }}>
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: styling.color,
            borderBottom: `2px solid ${styling.color}`,
            paddingBottom: '5px',
            marginBottom: '10px'
          }}>
            HOBBIES
          </h2>
          <ul style={{ paddingLeft: '16px', margin: 0 }}>
            {cvData.hobbies.map((h) => (
              <li key={h.id} style={{ fontSize: '10px', color: '#1a202c', marginBottom: '4px' }}>
                {h.name}
              </li>
            ))}
          </ul>
        </div>
      );
    
    default:
      return null;
  }
}

// Harvard Template Component
function HarvardTemplate({ cvData, styling, sectionOrder, showSkillLevel }: { cvData: CVData | null; styling: any; sectionOrder?: string[]; showSkillLevel?: boolean }) {
  if (!cvData) return null;

  const defaultOrder = ['professionalSummary', 'experience', 'education', 'skills', 'languages', 'certificates', 'hobbies'];
  const order = sectionOrder || defaultOrder;

  return (
    <div 
      data-cv-preview
      style={{ 
        fontFamily: styling.font,
        minHeight: '297mm',
        width: '100%',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        padding: '40px',
        lineHeight: '1.6'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '28px',
          fontWeight: 'bold',
          color: styling.color,
          marginBottom: '8px',
          lineHeight: '1.2'
        }}>
          {cvData.personalInfo.firstName || 'First'} {cvData.personalInfo.lastName || 'Last'}
        </h1>
        <p style={{ 
          fontSize: '14px',
          color: '#4a5568',
          marginBottom: '8px'
        }}>
          {cvData.personalInfo.jobTitle || 'Job Title'}
        </p>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          {cvData.personalInfo.email && <span>{cvData.personalInfo.email}</span>}
          {cvData.personalInfo.phone && <span style={{ margin: '0 8px' }}>•</span>}
          {cvData.personalInfo.phone && <span>{cvData.personalInfo.phone}</span>}
          {cvData.personalInfo.location && <span style={{ margin: '0 8px' }}>•</span>}
          {cvData.personalInfo.location && <span>{cvData.personalInfo.location}</span>}
        </div>
      </div>

      {/* Sections in order */}
      {order.map(sectionId => renderCVSection(sectionId, cvData, styling, showSkillLevel ?? true))}
    </div>
  );
}

// Helper function to render Modern template right column sections
function renderModernRightSection(sectionId: string, cvData: CVData, styling: any) {
  switch (sectionId) {
    case 'professionalSummary':
      if (!cvData.professionalSummary) return null;
      return (
        <div key="professionalSummary" style={{ marginBottom: '20px' }}>
          <p style={{ 
            fontSize: '10px',
            color: '#2d3748',
            lineHeight: '1.6',
            textAlign: 'justify',
            whiteSpace: 'pre-wrap'
          }}>
            {cvData.professionalSummary}
          </p>
        </div>
      );
    
    case 'experience':
      if (cvData.experiences.length === 0) return null;
      return (
        <div key="experience" style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#1e3a5f',
            borderBottom: '2px solid #1e3a5f',
            paddingBottom: '5px',
            marginBottom: '12px'
          }}>
            WORK EXPERIENCE
          </h2>
          {cvData.experiences.map((exp, idx) => (
            <div key={exp.id} style={{ 
              marginBottom: idx < cvData.experiences.length - 1 ? '15px' : '0',
              paddingBottom: idx < cvData.experiences.length - 1 ? '15px' : '0',
              borderBottom: idx < cvData.experiences.length - 1 ? '1px solid #e2e8f0' : 'none'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '6px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#1a202c',
                    marginBottom: '3px'
                  }}>
                    {exp.title || 'Job Title'}
                  </h3>
                  <p style={{ 
                    fontSize: '9px',
                    color: '#4a5568',
                    marginBottom: '6px'
                  }}>
                    {exp.company || 'Company'}, {exp.startDate || 'Start'} {exp.endDate || exp.isCurrent ? '-' : ''} {exp.isCurrent ? 'Present' : (exp.endDate || 'End')}
                  </p>
                </div>
              </div>
              {exp.description.length > 0 && (
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: '6px 0 0 0'
                }}>
                  {exp.description.map((desc, descIdx) => (
                    <li key={descIdx} style={{ 
                      fontSize: '9px',
                      color: '#2d3748',
                      lineHeight: '1.5',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ marginRight: '8px', color: '#1e3a5f' }}>•</span>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    
    case 'education':
      if (cvData.educations.length === 0) return null;
      return (
        <div key="education" style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#1e3a5f',
            borderBottom: '2px solid #1e3a5f',
            paddingBottom: '5px',
            marginBottom: '12px'
          }}>
            EDUCATION
          </h2>
          {cvData.educations.map((edu, idx) => (
            <div key={edu.id} style={{ 
              marginBottom: idx < cvData.educations.length - 1 ? '12px' : '0',
              paddingBottom: idx < cvData.educations.length - 1 ? '12px' : '0',
              borderBottom: idx < cvData.educations.length - 1 ? '1px solid #e2e8f0' : 'none'
            }}>
              <h3 style={{ 
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#1a202c',
                marginBottom: '3px'
              }}>
                {edu.degree || 'Degree'}
              </h3>
              <p style={{ 
                fontSize: '9px',
                color: '#4a5568',
                marginBottom: '4px'
              }}>
                {edu.institution || 'Institution'}
                {edu.startDate && `, ${edu.startDate}${edu.endDate ? ` - ${edu.endDate}` : ''}`}
              </p>
              {edu.description && (
                <p style={{ 
                  fontSize: '9px',
                  color: '#2d3748',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    
    case 'skills':
    case 'languages':
      // Skills and Languages stay in left column for Modern template
      return null;
    
    case 'certificates':
      if (cvData.certificates.length === 0) return null;
      return (
        <div key="certificates">
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: styling.color,
            borderBottom: `2px solid ${styling.color}`,
            paddingBottom: '5px',
            marginBottom: '10px'
          }}>
            CERTIFICATES
          </h2>
          {cvData.certificates.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '8px' }}>
              <p style={{ 
                fontSize: '10px',
                fontWeight: '600',
                color: '#1a202c',
                marginBottom: '2px'
              }}>
                {cert.name}
              </p>
              <p style={{ 
                fontSize: '9px',
                color: '#4a5568'
              }}>
                {cert.issuer} - {cert.date}
              </p>
            </div>
          ))}
        </div>
      );
    
    default:
      return null;
  }
}

// Modern Template Component
function ModernTemplate({ cvData, styling, cvPhoto, sectionOrder, showSkillLevel }: { cvData: CVData | null; styling: any; cvPhoto?: string; sectionOrder?: string[]; showSkillLevel?: boolean }) {
  if (!cvData) return null;

  const defaultOrder = ['professionalSummary', 'experience', 'education', 'skills', 'languages', 'certificates'];
  const order = sectionOrder || defaultOrder;
  // Filter sections that go in the right column (exclude skills and languages which stay in left)
  const rightColumnSections = order.filter(id => id !== 'skills' && id !== 'languages');

  return (
    <div 
      data-cv-preview
      style={{ 
        fontFamily: styling.font,
        minHeight: '297mm',
        width: '100%',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        display: 'flex',
        lineHeight: '1.6',
        pageBreakInside: 'avoid'
      }}
    >
      {/* Left Column - Dark Blue */}
      <div style={{ 
        width: '35%',
        padding: '30px 20px',
        backgroundColor: '#1e3a5f',
        color: '#ffffff'
      }}>
        {/* Profile Picture */}
        <div style={{ 
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: '#4a5568',
          margin: '0 auto 25px',
          border: '3px solid #ffffff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {cvPhoto ? (
            <img 
              src={cvPhoto} 
              alt="Profile" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <span style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#ffffff' 
            }}>
              {cvData?.personalInfo.firstName?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        
        {/* CONTACT */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#ffffff',
            marginBottom: '12px'
          }}>
            CONTACT
          </h2>
          {cvData.personalInfo.phone && (
            <p style={{ fontSize: '9px', marginBottom: '6px', lineHeight: '1.5' }}>
              Phone: {cvData.personalInfo.phone}
            </p>
          )}
          {cvData.personalInfo.email && (
            <p style={{ fontSize: '9px', marginBottom: '6px', lineHeight: '1.5' }}>
              Email: {cvData.personalInfo.email}
            </p>
          )}
          {cvData.personalInfo.location && (
            <p style={{ fontSize: '9px', marginBottom: '6px', lineHeight: '1.5' }}>
              Location: {cvData.personalInfo.location}
            </p>
          )}
          {cvData.personalInfo.linkedin && (
            <p style={{ fontSize: '9px', marginBottom: '6px', lineHeight: '1.5' }}>
              LinkedIn: {cvData.personalInfo.linkedin}
            </p>
          )}
        </div>

        {/* SKILLS */}
        {cvData.skills.length > 0 && (
          <div>
            <h2 style={{ 
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#ffffff',
              marginBottom: '12px'
            }}>
              SKILLS
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cvData.skills.map((skill) => (
                <p key={skill.id} style={{ 
                  fontSize: '9px',
                  lineHeight: '1.5'
                }}>
                  {skill.name}{showSkillLevel && skill.level && ` (Level: ${skill.level})`}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div style={{ 
        flex: 1,
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ 
            fontSize: '22px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: '#1e3a5f',
            marginBottom: '8px',
            letterSpacing: '1px',
            lineHeight: '1.2'
          }}>
            {cvData.personalInfo.firstName || 'FIRST'} {cvData.personalInfo.lastName || 'LAST'}
          </h1>
          <p style={{ 
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#4a5568',
            letterSpacing: '0.5px'
          }}>
            {cvData.personalInfo.jobTitle || 'JOB TITLE'}
          </p>
        </div>

        {/* Sections in order */}
        {rightColumnSections.map(sectionId => renderModernRightSection(sectionId, cvData, styling))}
      </div>
    </div>
  );
}

// HtmlThemePreview Component
function HtmlThemePreview({ html }: { html: string }) {
  if (!html) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#6b7280',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <p>No preview available</p>
      </div>
    );
  }

  return (
    <div 
      data-cv-preview
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ 
        minHeight: '297mm',
        width: '100%'
      }}
    />
  );
}

function OptimizedCVEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cv, setCv] = useState<OptimizedCV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personalize']));
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiEditingSection, setAiEditingSection] = useState<string | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiUpdatingExperience, setAiUpdatingExperience] = useState<string | null>(null);
  const [aiPulseExperience, setAiPulseExperience] = useState<string | null>(null);
  const [aiUpdatingSummary, setAiUpdatingSummary] = useState(false);
  const [aiPulseSummary, setAiPulseSummary] = useState(false);
  const [aiUpdatingEducation, setAiUpdatingEducation] = useState<string | null>(null);
  const [aiPulseEducation, setAiPulseEducation] = useState<string | null>(null);
  const [aiUpdatingSkills, setAiUpdatingSkills] = useState(false);
  const [aiPulseSkills, setAiPulseSkills] = useState(false);
  const [externalThemeHtml, setExternalThemeHtml] = useState<string>('');
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.9); // 90% par défaut
  const [cvPhoto, setCvPhoto] = useState<string>(''); // Photo pour le CV
  const [panelWidth, setPanelWidth] = useState(520); // Largeur du panneau gauche (min: 520px, max: 800px)
  const [isResizing, setIsResizing] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'professionalSummary',
    'experience',
    'education',
    'skills',
    'languages',
    'certificates',
    'hobbies'
  ]);
  const [styling, setStyling] = useState({
    color: '#000000',
    font: 'Inter, system-ui, sans-serif',
    template: 'harvard' as string,
  });
  const [harvardTemplatePreviewUrl, setHarvardTemplatePreviewUrl] = useState<string>('');
  const [modernTemplatePreviewUrl, setModernTemplatePreviewUrl] = useState<string>('');
  const [isLoadingTemplatePreviews, setIsLoadingTemplatePreviews] = useState(false);
  const [showSkillLevel, setShowSkillLevel] = useState(true); // Show skill level by default
  const [atsTips, setAtsTips] = useState<string[]>([]);
  const [isLoadingAtsTips, setIsLoadingAtsTips] = useState(false);
  const [cvVersions, setCvVersions] = useState<OptimizedCV[]>([]); // All language versions of this CV
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [openChatExperienceId, setOpenChatExperienceId] = useState<string | null>(null); // Which experience has chat open
  const [openChatSummary, setOpenChatSummary] = useState(false); // Chat open for summary
  const [openChatSkills, setOpenChatSkills] = useState(false); // Chat open for skills
  const [openChatEducationId, setOpenChatEducationId] = useState<string | null>(null); // Which education has chat open
  // Chat history per experience/section (supports assistant suggestions that can be inserted)
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{
    role: 'user' | 'assistant';
    content: string;
    // Optional suggestion payload to enable "Insert" UX
    suggestion?: {
      kind: 'experience' | 'summary' | 'education' | 'skills';
      id?: string;
      data: any;
    };
  }>>>({}); // Chat history per experience/section
  const [chatInput, setChatInput] = useState<Record<string, string>>({}); // Input text per experience/section
  // Job overview (structured summary of the target position)
  const [jobOverview, setJobOverview] = useState<{
    summary: string;
    responsibilities?: string[];
    requirements?: string[];
    seniority?: string;
    location?: string;
  } | null>(null);
  const [isLoadingJobOverview, setIsLoadingJobOverview] = useState(false);

  // Apply a pending assistant suggestion into the CV data and clear the suggestion flag on that message
  const applySuggestion = (threadKey: string, messageIndex: number) => {
    const thread = chatMessages[threadKey] || [];
    const msg = thread[messageIndex];
    if (!msg?.suggestion || !cvData) return;

    const { kind, id, data } = msg.suggestion;
    try {
      if (kind === 'experience' && id && Array.isArray(data?.bullets)) {
        updateExperience(id, { description: data.bullets });
        setAiPulseExperience(id);
        setTimeout(() => setAiPulseExperience(null), 1200);
        notify.success('Inserted AI bullets into experience');
      } else if (kind === 'summary' && typeof data?.summary === 'string') {
        setCvData(prev => prev ? { ...prev, professionalSummary: data.summary } : prev);
        setAiPulseSummary(true);
        setTimeout(() => setAiPulseSummary(false), 1200);
        notify.success('Inserted AI summary');
      } else if (kind === 'education' && id && typeof data?.description === 'string') {
        updateEducation(id, { description: data.description });
        setAiPulseEducation(id);
        setTimeout(() => setAiPulseEducation(null), 1200);
        notify.success('Inserted AI education description');
      } else if (kind === 'skills' && Array.isArray(data?.skills)) {
        setCvData(prev => prev ? { ...prev, skills: data.skills } : prev);
        setAiPulseSkills(true);
        setTimeout(() => setAiPulseSkills(false), 1200);
        notify.success('Inserted AI skills');
      }
    } finally {
      // Replace the message with a non-actionable confirmation note
      const updated = [...thread];
      updated[messageIndex] = {
        role: 'assistant',
        content: `${msg.content}\n\nInserted into your resume.`,
      };
      setChatMessages({
        ...chatMessages,
        [threadKey]: updated,
      });
    }
  };

  // Load CV data and merge with Professional Profile info
  useEffect(() => {
    if (!currentUser || !id) return;

    const loadCV = async () => {
      try {
        console.log('🔍 DEBUG: Loading CV with id:', id);
        
        // Load CV document
        const cvDoc = await getDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', id));
        
        // Load user profile data in parallel
        const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const profileData = profileDoc.exists() ? profileDoc.data() : null;
        
        // Load profile photo
        if (profileData?.profilePhoto) {
          console.log('📸 Profile photo loaded from user profile');
          setCvPhoto(profileData.profilePhoto);
        }
        
        if (cvDoc.exists()) {
          const data = cvDoc.data() as OptimizedCV;
          console.log('📄 CV Document loaded:', {
            hasCVData: !!data.cvData,
            hasMarkdown: !!data.optimizedResumeMarkdown,
            markdownLength: data.optimizedResumeMarkdown?.length || 0,
            jobTitle: data.jobTitle,
            company: data.company
          });
          // Load job overview if available
          if ((data as any).jobOverview) {
            setJobOverview((data as any).jobOverview);
          }
          
          if (profileData) {
            console.log('👤 Profile data loaded for merge:', {
              hasFirstName: !!profileData.firstName,
              hasLastName: !!profileData.lastName,
              hasEmail: !!profileData.email,
              hasLinkedIn: !!profileData.linkedinUrl
            });
          }
          
          setCv({ ...data, id: cvDoc.id });
          
          // Load section order if saved
          if ((data as any).sectionOrder && Array.isArray((data as any).sectionOrder)) {
            setSectionOrder((data as any).sectionOrder);
          }
          
          // Load CV photo if saved, fallback to profile photo
          const savedPhoto = (data as any).cvPhoto;
          if (savedPhoto) {
            console.log('📸 Using saved CV photo');
            setCvPhoto(savedPhoto);
          } else if (profileData?.profilePhoto) {
            console.log('📸 Using profile photo as fallback');
            setCvPhoto(profileData.profilePhoto);
          }

          // Load showSkillLevel preference
          if ((data as any).showSkillLevel !== undefined) {
            setShowSkillLevel((data as any).showSkillLevel);
          }
          
          // Parse markdown to structured data or use existing cvData
          let loadedCVData: CVData;
          
          if (data.cvData) {
            console.log('✅ Using existing cvData from Firestore');
            console.log('cvData structure:', {
              hasPersonalInfo: !!data.cvData.personalInfo,
              firstName: data.cvData.personalInfo?.firstName,
              expCount: data.cvData.experiences?.length || 0,
              eduCount: data.cvData.educations?.length || 0,
              skillsCount: data.cvData.skills?.length || 0
            });
            loadedCVData = normalizeCVData(data.cvData as unknown as CVData);
          } else {
            console.warn('⚠️ No cvData in Firestore, parsing markdown...');
            console.log('Markdown preview (first 500 chars):', data.optimizedResumeMarkdown?.substring(0, 500));
            const parsed = parseMarkdownToCVData(data.optimizedResumeMarkdown || '');
            console.log('Parsed result:', {
              hasName: !!parsed.personalInfo.firstName,
              expCount: parsed.experiences.length,
              eduCount: parsed.educations.length,
              skillsCount: parsed.skills.length
            });
            
            // If parsing didn't extract much, create default structure
            if (parsed.experiences.length === 0 && parsed.educations.length === 0) {
              console.warn('⚠️ Parsing failed, creating default structure');
              loadedCVData = {
                personalInfo: {
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  location: '',
                  linkedin: '',
                  portfolio: '',
                  jobTitle: data.jobTitle || '',
                },
                professionalSummary: data.shortSummary || data.optimizedResumeMarkdown?.substring(0, 500) || '',
                experiences: [],
                educations: [],
                skills: (data.keywordsUsed || []).map((k, i) => ({
                  id: `skill-${i}`,
                  name: k,
                  level: 'Intermediate' as const,
                  order: i,
                })),
                languages: [],
                certificates: [],
              };
            } else {
              loadedCVData = parsed;
            }
            loadedCVData = normalizeCVData(loadedCVData);
          }
          
          // Merge with Professional Profile data (fill missing fields only)
          if (profileData) {
            console.log('🔄 Merging CV data with Professional Profile...');
            const merged: CVData = {
              ...loadedCVData,
              personalInfo: {
                firstName: loadedCVData.personalInfo.firstName || profileData.firstName || '',
                lastName: loadedCVData.personalInfo.lastName || profileData.lastName || '',
                email: loadedCVData.personalInfo.email || profileData.email || currentUser.email || '',
                phone: loadedCVData.personalInfo.phone || profileData.phone || '',
                location: loadedCVData.personalInfo.location || (profileData.city && profileData.country ? `${profileData.city}, ${profileData.country}` : profileData.city || profileData.country || ''),
                linkedin: loadedCVData.personalInfo.linkedin || profileData.linkedinUrl || '',
                portfolio: loadedCVData.personalInfo.portfolio || profileData.portfolioUrl || profileData.githubUrl || '',
                jobTitle: loadedCVData.personalInfo.jobTitle || profileData.currentPosition || profileData.targetPosition || data.jobTitle || '',
              },
              // Add skills from profile if CV has none
              skills: loadedCVData.skills.length > 0 ? loadedCVData.skills : (profileData.skills || []).map((s: string, i: number) => ({
                id: `skill-${i}`,
                name: s,
                level: 'Intermediate' as const,
                order: i,
              })),
              // Add languages from profile if CV has none
              languages: loadedCVData.languages.length > 0 ? loadedCVData.languages : (profileData.languages || []).map((l: any, i: number) => ({
                id: `lang-${i}`,
                name: l.language || l.name || l,
                level: (l.level || 'Intermediate') as any,
                order: i,
              })),
            };
            console.log('✅ Merged data:', {
              firstName: merged.personalInfo.firstName,
              hasEmail: !!merged.personalInfo.email,
              hasPhone: !!merged.personalInfo.phone,
              skillsCount: merged.skills.length,
              languagesCount: merged.languages.length
            });
            setCvData(merged);
          } else {
            setCvData(loadedCVData);
          }
        } else {
          console.error('❌ CV document not found');
          notify.error('CV not found');
          navigate('/cv-optimizer');
        }
      } catch (error: any) {
        console.error('❌ Error loading CV:', error);
        notify.error('Failed to load CV');
        navigate('/cv-optimizer');
      } finally {
        setIsLoading(false);
      }
    };

    loadCV();
  }, [id, currentUser, navigate]);

  // Generate a structured job overview if missing
  useEffect(() => {
    const run = async () => {
      if (!currentUser || !cv || jobOverview || isLoadingJobOverview) return;
      try {
        setIsLoadingJobOverview(true);
        // Try to get job content: prefer stored jobDescription, else extract from jobUrl if present
        let jobContent: string = (cv as any).jobDescription || '';
        if ((!jobContent || jobContent.length < 50) && (cv as any).jobUrl) {
          try {
            const res = await fetch('/api/extract-job-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: (cv as any).jobUrl })
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.status === 'success' && typeof data?.content === 'string' && data.content.length > 50) {
                jobContent = data.content;
              }
            }
          } catch (e) {
            console.warn('extract-job-url failed, continuing without it', e);
          }
        }
        // If still nothing substantial, build a minimal text from title and keywords
        if (!jobContent || jobContent.length < 50) {
          const kws = Array.isArray((cv as any).keywordsUsed) ? (cv as any).keywordsUsed.slice(0, 15).join(', ') : '';
          jobContent = `Role: ${cv.jobTitle} at ${cv.company || 'Company'}. Key terms: ${kws}.`;
        }
        const prompt = `
You are a hiring expert. Read the job posting and produce a concise, structured overview that helps a candidate tailor their CV.
Return ONLY JSON with this schema:
{
  "summary": "2-3 sentences summarizing the mission and impact",
  "responsibilities": ["bullet", "bullet", "bullet"],
  "requirements": ["bullet", "bullet", "bullet"],
  "seniority": "e.g., Mid, Senior, Lead (if inferable)",
  "location": "Location or Remote (if inferable)"
}
Job Title: ${cv.jobTitle}
Company: ${cv.company || 'N/A'}
Job Posting:
"""
${jobContent.substring(0, 6000)}
"""`.trim();
        const resp = await fetch('/api/chatgpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'job-overview', prompt })
        });
        if (!resp.ok) throw new Error('Failed to generate job overview');
        const data = await resp.json();
        let parsed: any;
        if (typeof data.content === 'string') {
          const normalized = data.content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          parsed = JSON.parse(normalized);
        } else {
          parsed = data.content;
        }
        // Basic validation
        const overview = {
          summary: String(parsed?.summary || '').trim(),
          responsibilities: Array.isArray(parsed?.responsibilities) ? parsed.responsibilities.slice(0, 6) : [],
          requirements: Array.isArray(parsed?.requirements) ? parsed.requirements.slice(0, 6) : [],
          seniority: parsed?.seniority ? String(parsed.seniority) : undefined,
          location: parsed?.location ? String(parsed.location) : undefined,
        };
        setJobOverview(overview);
        // Persist to Firestore
        try {
          await updateDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cv.id), {
            jobOverview: overview
          });
        } catch (e) {
          console.warn('Failed to save jobOverview to Firestore', e);
        }
      } catch (err) {
        console.error('Job overview generation failed', err);
      } finally {
        setIsLoadingJobOverview(false);
      }
    };
    run();
  }, [currentUser, cv, jobOverview, isLoadingJobOverview]);

  // Load all language versions of this CV (same job)
  useEffect(() => {
    if (!currentUser || !cv) return;

    const loadCVVersions = async () => {
      try {
        // Find all CVs with the same jobTitle and company
        const cvRef = collection(db, 'users', currentUser.uid, 'optimizedCVs');
        const q = query(
          cvRef,
          where('jobTitle', '==', cv.jobTitle),
          where('company', '==', cv.company)
        );
        const querySnapshot = await getDocs(q);
        const versions: OptimizedCV[] = [];
        
        querySnapshot.forEach((doc) => {
          versions.push({ ...doc.data(), id: doc.id } as OptimizedCV);
        });

        // Sort: original first (no language or language='en'), then others
        versions.sort((a, b) => {
          const langA = a.language || 'en';
          const langB = b.language || 'en';
          if (langA === 'en') return -1;
          if (langB === 'en') return 1;
          return langA.localeCompare(langB);
        });

        setCvVersions(versions);
      } catch (error) {
        console.error('Error loading CV versions:', error);
      }
    };

    loadCVVersions();
  }, [currentUser, cv?.jobTitle, cv?.company]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!cv || !cvData) return;

    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [cvData, cv]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      const minWidth = 520;
      const maxWidth = 800;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      } else if (newWidth < minWidth) {
        setPanelWidth(minWidth);
      } else if (newWidth > maxWidth) {
        setPanelWidth(maxWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Load external theme HTML when template changes or data changes
  useEffect(() => {
    const isExternal = styling.template !== 'harvard' && styling.template !== 'modern';
    if (!cvData || !isExternal) {
      setExternalThemeHtml('');
      return;
    }
    const load = async () => {
      try {
        setIsLoadingTheme(true);
        const resume = toResumeJson(cvData as any);
        const resp = await fetch('/api/render-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeId: styling.template, resumeJson: resume })
        });
        const data = await resp.json();
        if (resp.ok && data?.status === 'success' && typeof data.html === 'string') {
          setExternalThemeHtml(data.html);
        } else {
          notify.error(data?.message || 'Failed to render theme');
          setExternalThemeHtml('');
        }
      } catch (e: any) {
        console.error(e);
        notify.error('Theme render failed');
        setExternalThemeHtml('');
      } finally {
        setIsLoadingTheme(false);
      }
    };
    load();
  }, [styling.template, cvData]);

  // Load template preview images from Firebase Storage
  useEffect(() => {
    if (!isTemplateModalOpen) return; // Only load when modal opens

    const loadTemplatePreviews = async () => {
      setIsLoadingTemplatePreviews(true);
      try {
        const storage = getStorage();
        
        // Load Harvard template preview
        try {
          const harvardRef = ref(storage, 'images/harvard-template-preview.png');
          const harvardUrl = await getDownloadURL(harvardRef);
          setHarvardTemplatePreviewUrl(harvardUrl);
        } catch (error) {
          console.error('Error loading Harvard template preview:', error);
          setHarvardTemplatePreviewUrl('');
        }

        // Load Modern template preview
        try {
          const modernRef = ref(storage, 'images/modern-template-preview.png');
          const modernUrl = await getDownloadURL(modernRef);
          setModernTemplatePreviewUrl(modernUrl);
        } catch (error) {
          console.error('Error loading Modern template preview:', error);
          setModernTemplatePreviewUrl('');
        }
      } catch (error) {
        console.error('Error loading template previews:', error);
      } finally {
        setIsLoadingTemplatePreviews(false);
      }
    };

    loadTemplatePreviews();
  }, [isTemplateModalOpen]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!cv || !currentUser || !cvData) return;

    setIsSaving(true);
    try {
      const markdown = convertCVDataToMarkdown(cvData);
      await updateDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cv.id), {
        optimizedResumeMarkdown: markdown,
        cvData: cvData,
        cvPhoto: cvPhoto || null, // Save photo
        sectionOrder: sectionOrder, // Save section order
        showSkillLevel: showSkillLevel, // Save show skill level preference
        updatedAt: serverTimestamp(),
      });
      setCv({ ...cv, optimizedResumeMarkdown: markdown });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving CV:', error);
      notify.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save and exit with glow effect
  const handleSaveAndExit = async () => {
    if (!cv || !currentUser || !cvData) {
      navigate('/cv-optimizer');
      return;
    }

    // Activate glow effect
    setIsGlowing(true);
    
    // Save the CV
    setIsSaving(true);
    try {
      const markdown = convertCVDataToMarkdown(cvData);
      await updateDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cv.id), {
        optimizedResumeMarkdown: markdown,
        cvData: cvData,
        cvPhoto: cvPhoto || null,
        sectionOrder: sectionOrder,
        showSkillLevel: showSkillLevel,
        updatedAt: serverTimestamp(),
      });
      setCv({ ...cv, optimizedResumeMarkdown: markdown });
    } catch (error: any) {
      console.error('Error saving CV:', error);
      notify.error('Failed to save changes');
      setIsSaving(false);
      setIsGlowing(false);
      return;
    }

    // Wait 300ms to show the save animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reset states and navigate
    setIsSaving(false);
    setIsGlowing(false);
    navigate('/cv-optimizer');
  };

  // Handle section reordering via drag and drop
  const onSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSectionOrder(items);
    // Force CV preview to update by triggering a state change
    if (cvData) {
      setCvData({ ...cvData });
    }
    notify.success('Section order updated');
  };

  // Generate personalized ATS tips using AI
  const generateAtsTips = async () => {
    if (!cvData || !cv || isLoadingAtsTips) return;

    setIsLoadingAtsTips(true);
    try {
      const markdown = convertCVDataToMarkdown(cvData);
      const jobTitle = cv.jobTitle || 'the position';
      const company = cv.company || 'the company';
      const jobDescription = (cv as any).jobDescription || '';

      const prompt = `You are an expert ATS (Applicant Tracking System) reviewer and career coach. Analyze the following CV and provide 3-5 ultra-concise, actionable tips to improve the ATS score. Each tip should be maximum 15 words and focus on specific, implementable improvements.

CV Content:
${markdown.substring(0, 3000)}

Job Title: ${jobTitle}
Company: ${company}
${jobDescription ? `Job Description: ${jobDescription.substring(0, 1000)}` : ''}

Current ATS Score: ${cv.atsScore}%

Return ONLY a JSON array of strings, each string being one concise tip. Example format:
["Add keyword 'React' to experience section", "Quantify achievements with specific numbers", "Include missing skill 'TypeScript' in skills section"]

Be specific, actionable, and focus on quick wins that will improve the ATS score.`;

      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert ATS reviewer. Provide concise, actionable tips in JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error('Failed to generate tips');

      const data = await response.json();
      let tips: string[] = [];

      if (data.content) {
        try {
          // Try to parse as JSON array
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed)) {
            tips = parsed;
          } else if (typeof parsed === 'string') {
            tips = [parsed];
          }
        } catch {
          // If not JSON, try to extract tips from text
          const lines = data.content.split('\n').filter((line: string) => line.trim().length > 0);
          tips = lines.slice(0, 5).map((line: string) => line.replace(/^[-•*]\s*/, '').trim());
        }
      }

      if (tips.length === 0) {
        tips = [
          'Add more keywords from the job description',
          'Quantify achievements with specific numbers',
          'Ensure all sections are complete'
        ];
      }

      setAtsTips(tips);
    } catch (error) {
      console.error('Error generating ATS tips:', error);
      notify.error('Failed to generate tips');
      setAtsTips([
        'Add more keywords from the job description',
        'Quantify achievements with specific numbers',
        'Ensure all sections are complete'
      ]);
    } finally {
      setIsLoadingAtsTips(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('Image must be less than 5MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCvPhoto(base64);
        notify.success('Photo updated');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      notify.error('Failed to upload photo');
    }
  };

  // AI Edit function (legacy modal - kept for backward compatibility)
  const handleAIEdit = async () => {
    if (!aiPrompt.trim() || !cvData) return;

    setIsAIGenerating(true);
    try {
      let contentToEdit = cvData.professionalSummary;
      let updateFunction: (content: string) => void = (content: string) => {
        setCvData({ ...cvData, professionalSummary: content });
      };

      if (aiEditingSection && aiEditingSection.startsWith('experience-')) {
        const expId = aiEditingSection.replace('experience-', '');
        const exp = cvData.experiences.find(e => e.id === expId);
        if (exp) {
          contentToEdit = exp.description.join('\n');
          updateFunction = (content: string) => {
            const bullets = content.split('\n').filter(b => b.trim());
            updateExperience(expId, { description: bullets });
          };
        }
      }

      switch (aiEditingSection) {
        case 'summary':
          contentToEdit = cvData.professionalSummary;
          updateFunction = (content: string) => {
            setCvData({ ...cvData, professionalSummary: content });
          };
          break;
        case 'experience':
          // Edit last experience or all experiences
          contentToEdit = cvData.experiences.map(e => 
            `${e.title} at ${e.company}: ${e.description.join(' ')}`
          ).join('\n');
          updateFunction = () => {
            // Parse AI response and update experiences
            // This is simplified - you might want more sophisticated parsing
            notify.success('AI editing applied to experiences');
          };
          break;
        default:
          contentToEdit = cvData.professionalSummary;
          updateFunction = (content: string) => {
            setCvData({ ...cvData, professionalSummary: content });
          };
      }

      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cv-edit',
          prompt: `Edit this CV content: "${contentToEdit}". Instruction: ${aiPrompt}. Return only the edited content, keeping the same format.`,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        updateFunction(data.content);
        notify.success('Content edited with AI!');
        setIsAIModalOpen(false);
        setAiPrompt('');
      } else {
        throw new Error(data.message || 'AI editing failed');
      }
    } catch (error: any) {
      console.error('Error editing with AI:', error);
      notify.error(error.message || 'Failed to edit with AI');
    } finally {
      setIsAIGenerating(false);
    }
  };

  // AI improvement for a specific experience's bullet points with chat interface
  const improveExperienceBullets = async (expId: string, userPrompt?: string) => {
    if (!cvData) return;
    const exp = cvData.experiences.find(e => e.id === expId);
    if (!exp) return;
    
    try {
      setAiUpdatingExperience(expId);
      
      // Add user message to chat history
      if (userPrompt) {
        const currentMessages = chatMessages[expId] || [];
        setChatMessages({
          ...chatMessages,
          [expId]: [...currentMessages, { role: 'user', content: userPrompt }]
        });
      }
      
      const jobTitle = cv?.jobTitle || cvData.personalInfo.jobTitle || '';
      const company = cv?.company || '';
      const keywords = (cv?.keywordsUsed || []).slice(0, 20).join(', ');
      const jobDescription = cv?.optimizedResumeMarkdown ? 
        (cv.optimizedResumeMarkdown.split('##')[0] || '').slice(0, 1000) : '';
      
      const otherExperiencesArr = cvData.experiences
        .filter(e => e.id !== expId)
        .map(e => {
          const bullets = (e.description || []).map(b => `- ${b}`).join('\n');
          return `${e.title} | ${e.company}\n${e.startDate} - ${e.isCurrent ? 'Present' : e.endDate}\n${bullets}`;
        });
      const otherExperiences = otherExperiencesArr.join('\n\n');
      
      // Get chat history for this experience
      const history = chatMessages[expId] || [];
      const historyContext = history.length > 0 
        ? `\n\nPREVIOUS CONVERSATION HISTORY:\n${history.map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n')}`
        : '';
      
      // Very simple phrase list to discourage duplicates
      const avoidPhrases = otherExperiencesArr
        .flatMap(bloc => bloc.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2)))
        .slice(0, 50)
        .join(' | ');

      const basePrompt = `
You are a principal HR/ATS resume reviewer (GPT‑5 level) crafting ultra‑effective bullets for ONE role while ensuring global CV coherence.

FULL CV CONTEXT (you have access to the entire CV):
- Candidate summary:
"${(cvData.professionalSummary || '').slice(0, 800)}"
- Other experiences (for complementarity only; do NOT duplicate wording):
${otherExperiences || 'N/A'}
- Education: ${cvData.educations.map(e => `${e.degree} at ${e.institution}`).join(', ') || 'N/A'}
- Skills: ${cvData.skills.map(s => s.name).join(', ') || 'N/A'}

TARGET JOB POSITION:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description (excerpt): ${jobDescription || 'N/A'}
- Priority keywords to weave naturally (no stuffing): ${keywords || 'N/A'}

ROLE TO OPTIMIZE:
- Title: ${exp.title}
- Company: ${exp.company}
- Dates: ${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}
- Current bullets:
${exp.description.map((b) => `- ${b}`).join('\n')}
${historyContext}

STRICT GUIDELINES:
1) Truthful only; DO NOT invent facts. If metrics are implied, use approximations (~15%) otherwise omit.
2) 4–6 bullets, each ≤ 22 words, starting with varied, strong action verbs (no repetition across bullets).
3) Each bullet must be UNIQUE versus other roles. Avoid phrases found here: ${avoidPhrases || 'N/A'}.
4) Focus on outcomes, scale, scope, and tools; align tightly to the TARGET ROLE.
5) Maintain tense: present role → present; past roles → past.
6) Limit generic bullets (client engagement, mentoring) to max one and only if relevant; prefer high-signal, specific achievements.
7) End each bullet with a period. No emojis, no confidential client names.
8) If the user provides specific instructions, follow them precisely while maintaining quality and truthfulness.

RETURN JSON ONLY:
{
  "bullets": ["<bullet 1>.", "<bullet 2>.", "<bullet 3>.", "<bullet 4>."]
}
`;

      const prompt = userPrompt 
        ? `${basePrompt}\n\nUSER REQUEST: ${userPrompt}\n\nPlease modify the bullets according to the user's request while following all guidelines above.`
        : basePrompt;
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cv-edit', prompt }),
      });
      const data = await res.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'AI update failed');
      }
      // Normalize AI response into array of bullets
      let bullets: string[] = [];
      // If the model returned an object with bullets
      if (data.content && typeof data.content === 'object') {
        if (Array.isArray(data.content.bullets)) {
          bullets = data.content.bullets as string[];
        } else {
          // Attempt to stringify then parse below
          try {
            const maybe = JSON.stringify(data.content);
            const parsed = JSON.parse(maybe);
            if (Array.isArray(parsed?.bullets)) bullets = parsed.bullets;
          } catch {
            // ignore
          }
        }
      }
      // If still empty, try parse string content
      if (!bullets.length) {
        let contentStr = '';
        if (typeof data.content === 'string') {
          contentStr = data.content;
        } else if (data.content != null) {
          contentStr = JSON.stringify(data.content);
        }
        if (contentStr) {
          contentStr = contentStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          try {
            const parsed = JSON.parse(contentStr);
            if (Array.isArray(parsed?.bullets)) {
              bullets = parsed.bullets;
            }
          } catch {
            // Fallback: split lines from plain text
            bullets = contentStr.split('\n').map((l: string) => l.replace(/^-+\s*/, '').trim()).filter(Boolean);
          }
        }
      }
      // Normalize punctuation & bounds
      bullets = bullets
        .map((b: string) => {
          const t = b.trim().replace(/\s+/g, ' ');
          return /[.!?]$/.test(t) ? t : `${t}.`;
        })
        .slice(0, 6);
      if (bullets.length === 0) {
        throw new Error('AI did not return bullet points');
      }
      // Prepare assistant suggestion instead of immediately updating
      const responseText = `Suggested bullet points:\n\n${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`;
      const currentMessages = chatMessages[expId] || [];
      setChatMessages({
        ...chatMessages,
        [expId]: [
          ...currentMessages,
          { role: 'assistant', content: responseText, suggestion: { kind: 'experience', id: expId, data: { bullets } } }
        ]
      });
      // No immediate update; user can insert or continue chatting
    } catch (e: any) {
      console.error(e);
      notify.error(e.message || 'Failed to improve bullets');
      
      // Add error message to chat
      const currentMessages = chatMessages[expId] || [];
      setChatMessages({
        ...chatMessages,
        [expId]: [...currentMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.` }]
      });
    } finally {
      setAiUpdatingExperience(null);
    }
  };

  // AI improvement for Professional Summary with chat interface
  const improveSummary = async (userPrompt?: string) => {
    if (!cvData) return;
    try {
      setAiUpdatingSummary(true);
      
      // Add user message to chat history
      if (userPrompt) {
        const currentMessages = chatMessages['summary'] || [];
        setChatMessages({
          ...chatMessages,
          'summary': [...currentMessages, { role: 'user', content: userPrompt }]
        });
      }
      
      const jobTitle = cv?.jobTitle || cvData.personalInfo.jobTitle || '';
      const company = cv?.company || '';
      const keywords = (cv?.keywordsUsed || []).slice(0, 20).join(', ');
      const jobDescription = cv?.optimizedResumeMarkdown ? 
        (cv.optimizedResumeMarkdown.split('##')[0] || '').slice(0, 1000) : '';
      const experiences = cvData.experiences
        .map(e => {
          const bullets = (e.description || []).slice(0, 3).map(b => `- ${b}`).join('\n');
          return `${e.title} | ${e.company}\n${bullets}`;
        }).join('\n\n');
      
      // Get chat history
      const history = chatMessages['summary'] || [];
      const historyContext = history.length > 0 
        ? `\n\nPREVIOUS CONVERSATION HISTORY:\n${history.map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n')}`
        : '';
      
      const basePrompt = `
You are a principal HR/ATS expert (GPT-5 level). Write a concise 2–4 sentence Professional Summary tailored to the target role.
Use the candidate's background and keep coherence with experiences; weave keywords naturally; avoid clichés, buzzwords and repetitions.
Tone: confident, professional, impact-driven. No first person. Max ~60 words.

FULL CV CONTEXT:
- Education: ${cvData.educations.map(e => `${e.degree} at ${e.institution}`).join(', ') || 'N/A'}
- Skills: ${cvData.skills.map(s => s.name).join(', ') || 'N/A'}
- Experiences:
${experiences || 'N/A'}

TARGET JOB POSITION:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description (excerpt): ${jobDescription || 'N/A'}
- KEYWORDS (use naturally): ${keywords || 'N/A'}
${historyContext}

Return JSON only:
{ "summary": "<2-4 sentences>" }
`;

      const prompt = userPrompt 
        ? `${basePrompt}\n\nUSER REQUEST: ${userPrompt}\n\nPlease modify the summary according to the user's request while following all guidelines above.`
        : basePrompt;
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cv-edit', prompt }),
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'AI update failed');
      let summary = '';
      if (data.content && typeof data.content === 'object' && typeof data.content.summary === 'string') {
        summary = data.content.summary;
      } else {
        let s = typeof data.content === 'string' ? data.content : JSON.stringify(data.content || '');
        s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          const parsed = JSON.parse(s);
          summary = parsed.summary || s;
        } catch {
          summary = s;
        }
      }
      summary = summary.replace(/\s+/g, ' ').trim();
      // Add assistant suggestion instead of directly updating
      const responseText = `Suggested professional summary:\n\n"${summary}"`;
      const currentMessages = chatMessages['summary'] || [];
      setChatMessages({
        ...chatMessages,
        'summary': [
          ...currentMessages,
          { role: 'assistant', content: responseText, suggestion: { kind: 'summary', data: { summary } } }
        ]
      });
      // No immediate update; user can insert or continue chatting
    } catch (e: any) {
      console.error(e);
      notify.error(e.message || 'Failed to improve summary');
      
      // Add error message to chat
      const currentMessages = chatMessages['summary'] || [];
      setChatMessages({
        ...chatMessages,
        'summary': [...currentMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.` }]
      });
    } finally {
      setAiUpdatingSummary(false);
    }
  };

  // AI improvement for Education description with chat interface
  const improveEducationDescription = async (eduId: string, userPrompt?: string) => {
    if (!cvData) return;
    const edu = cvData.educations.find(e => e.id === eduId);
    if (!edu) return;
    
    try {
      setAiUpdatingEducation(eduId);
      
      // Add user message to chat history
      if (userPrompt) {
        const currentMessages = chatMessages[`education-${eduId}`] || [];
        setChatMessages({
          ...chatMessages,
          [`education-${eduId}`]: [...currentMessages, { role: 'user', content: userPrompt }]
        });
      }
      
      const jobTitle = cv?.jobTitle || cvData.personalInfo.jobTitle || '';
      const company = cv?.company || '';
      const keywords = (cv?.keywordsUsed || []).slice(0, 20).join(', ');
      const jobDescription = cv?.optimizedResumeMarkdown ? 
        (cv.optimizedResumeMarkdown.split('##')[0] || '').slice(0, 1000) : '';
      
      // Get chat history
      const history = chatMessages[`education-${eduId}`] || [];
      const historyContext = history.length > 0 
        ? `\n\nPREVIOUS CONVERSATION HISTORY:\n${history.map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n')}`
        : '';
      
      const basePrompt = `
You are a principal HR/ATS expert. Create a 1–2 sentence description for this education entry, tailored to the target role.
Include relevant coursework, projects, honors or specialization ONLY if relevant to the target role. Avoid generic filler.
Max ~35 words. End with a period.

FULL CV CONTEXT:
- Professional Summary: "${(cvData.professionalSummary || '').slice(0, 300)}"
- Experiences: ${cvData.experiences.map(e => `${e.title} at ${e.company}`).join(', ') || 'N/A'}
- Skills: ${cvData.skills.map(s => s.name).join(', ') || 'N/A'}

TARGET JOB POSITION:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description (excerpt): ${jobDescription || 'N/A'}
- KEYWORDS (use naturally): ${keywords || 'N/A'}
${historyContext}

EDUCATION TO OPTIMIZE:
- Degree: ${edu.degree}
- Institution: ${edu.institution}
- Dates: ${edu.startDate} - ${edu.isCurrent ? 'Present' : edu.endDate}
- Current description: ${edu.description || 'N/A'}

Return JSON only:
{ "description": "<1-2 sentences>" }
`;

      const prompt = userPrompt 
        ? `${basePrompt}\n\nUSER REQUEST: ${userPrompt}\n\nPlease modify the education description according to the user's request while following all guidelines above.`
        : basePrompt;
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cv-edit', prompt }),
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'AI update failed');
      let description = '';
      if (data.content && typeof data.content === 'object' && typeof data.content.description === 'string') {
        description = data.content.description;
      } else {
        let s = typeof data.content === 'string' ? data.content : JSON.stringify(data.content || '');
        s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          const parsed = JSON.parse(s);
          description = parsed.description || s;
        } catch {
          description = s;
        }
      }
      description = description.replace(/\s+/g, ' ').trim();
      // Add assistant suggestion instead of directly updating
      const responseText = `Suggested education description:\n\n"${description}"`;
      const currentMessages = chatMessages[`education-${eduId}`] || [];
      setChatMessages({
        ...chatMessages,
        [`education-${eduId}`]: [
          ...currentMessages,
          { role: 'assistant', content: responseText, suggestion: { kind: 'education', id: eduId, data: { description } } }
        ]
      });
      // No immediate update; user can insert or continue chatting
    } catch (e: any) {
      console.error(e);
      notify.error(e.message || 'Failed to improve education');
      
      // Add error message to chat
      const currentMessages = chatMessages[`education-${eduId}`] || [];
      setChatMessages({
        ...chatMessages,
        [`education-${eduId}`]: [...currentMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.` }]
      });
    } finally {
      setAiUpdatingEducation(null);
    }
  };

  // AI generation for Skills with chat interface
  const improveSkills = async (userPrompt?: string) => {
    if (!cvData) return;
    try {
      setAiUpdatingSkills(true);
      
      // Add user message to chat history
      if (userPrompt) {
        const currentMessages = chatMessages['skills'] || [];
        setChatMessages({
          ...chatMessages,
          'skills': [...currentMessages, { role: 'user', content: userPrompt }]
        });
      }
      
      const jobTitle = cv?.jobTitle || cvData.personalInfo.jobTitle || '';
      const company = cv?.company || '';
      const keywords = (cv?.keywordsUsed || []).slice(0, 25).join(', ');
      const jobDescription = cv?.optimizedResumeMarkdown ? 
        (cv.optimizedResumeMarkdown.split('##')[0] || '').slice(0, 1000) : '';
      const existing = (cvData.skills || []).map(s => s.name).join(', ');
      const experiences = cvData.experiences
        .map(e => `${e.title} | ${e.company}: ${(e.description || []).slice(0, 2).join(' ')}`)
        .join('\n');
      
      // Get chat history
      const history = chatMessages['skills'] || [];
      const historyContext = history.length > 0 
        ? `\n\nPREVIOUS CONVERSATION HISTORY:\n${history.map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n')}`
        : '';

      const basePrompt = `
You are a principal HR/ATS expert. Produce the MOST relevant, deduplicated skill list for the target role, using the candidate's background.

FULL CV CONTEXT:
- Professional Summary: "${(cvData.professionalSummary || '').slice(0, 300)}"
- Education: ${cvData.educations.map(e => `${e.degree} at ${e.institution}`).join(', ') || 'N/A'}
- Experiences:
${experiences || 'N/A'}

TARGET JOB POSITION:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description (excerpt): ${jobDescription || 'N/A'}
- PRIORITY KEYWORDS (use if relevant): ${keywords || 'N/A'}
- EXISTING SKILLS (avoid duplicates, consolidate synonyms): ${existing || 'N/A'}
${historyContext}

RULES:
- Return 6–10 skills max, high signal only (tools, methodologies, domain skills).
- Avoid vague/soft duplicates (e.g., "teamwork", "communication" unless critical to role).
- For each skill, assign a level: Beginner | Intermediate | Advanced | Expert (best estimate).

JSON ONLY:
{
  "skills": [
    { "name": "Strategic Consulting", "level": "Expert" },
    { "name": "Salesforce", "level": "Advanced" }
  ]
}
`;

      const prompt = userPrompt 
        ? `${basePrompt}\n\nUSER REQUEST: ${userPrompt}\n\nPlease modify the skills list according to the user's request while following all guidelines above.`
        : basePrompt;
      
      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cv-edit', prompt }),
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'AI update failed');

      let skillsArr: any[] = [];
      if (data.content && typeof data.content === 'object' && Array.isArray(data.content.skills)) {
        skillsArr = data.content.skills;
      } else {
        let s = typeof data.content === 'string' ? data.content : JSON.stringify(data.content || '');
        s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed?.skills)) skillsArr = parsed.skills;
        } catch {
          // Fallback: split lines as simple names
          skillsArr = s.split('\n').map((l: string) => ({ name: l.replace(/^[-*]\s*/, '').trim(), level: 'Advanced' })).filter((x: any) => x.name);
        }
      }
      const allowedLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      const cleaned = skillsArr
        .map((sk: any, idx: number) => {
          const name = (sk?.name || '').toString().trim();
          if (!name) return null;
          let level = (sk?.level || 'Advanced').toString();
          if (!allowedLevels.includes(level)) level = 'Advanced';
          return {
            id: `skill-${Date.now()}-${idx}`,
            name,
            level: level as any,
            order: idx,
          };
        })
        .filter(Boolean)
        .slice(0, 10) as any[];

      if (!cleaned.length) throw new Error('AI did not return skills');
      
      // Add assistant suggestion instead of directly updating
      const responseText = `Suggested skills list:\n\n${cleaned.map((s, i) => `${i + 1}. ${s.name} (${s.level})`).join('\n')}`;
      const currentMessages = chatMessages['skills'] || [];
      setChatMessages({
        ...chatMessages,
        'skills': [
          ...currentMessages,
          { role: 'assistant', content: responseText, suggestion: { kind: 'skills', data: { skills: cleaned } } }
        ]
      });
      // No immediate update; user can insert or continue chatting
    } catch (e: any) {
      console.error(e);
      notify.error(e.message || 'Failed to generate skills');
      
      // Add error message to chat
      const currentMessages = chatMessages['skills'] || [];
      setChatMessages({
        ...chatMessages,
        'skills': [...currentMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.` }]
      });
    } finally {
      setAiUpdatingSkills(false);
    }
  };

  // Add experience
  const addExperience = () => {
    if (!cvData) return;
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: [],
      order: cvData.experiences.length,
    };
    setCvData({ ...cvData, experiences: [...cvData.experiences, newExp] });
  };

  // Update experience
  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setCvData((prev) => {
      if (!prev) return prev as any;
      return {
        ...prev,
        experiences: prev.experiences.map((e) => {
          if (e.id !== id) return e;
          const next: Experience = {
            ...e,
            ...updates,
            // Ensure description is a new array to avoid accidental shared references
            description: updates.description ? [...updates.description] : e.description,
          };
          // Guard: if toggling isCurrent, normalize endDate
          if (typeof updates.isCurrent === 'boolean') {
            next.endDate = updates.isCurrent ? 'Present' : (updates.endDate ?? '');
          }
          return next;
        }),
      };
    });
  };

  // Delete experience
  const deleteExperience = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      experiences: cvData.experiences.filter(e => e.id !== id),
    });
  };

  // Add education
  const addEducation = () => {
    if (!cvData) return;
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      order: cvData.educations.length,
    };
    setCvData({ ...cvData, educations: [...cvData.educations, newEdu] });
  };

  // Update education
  const updateEducation = (id: string, updates: Partial<Education>) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      educations: cvData.educations.map(e => e.id === id ? { ...e, ...updates } : e),
    });
  };

  // Delete education
  const deleteEducation = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      educations: cvData.educations.filter(e => e.id !== id),
    });
  };

  // Add skill
  const addSkill = () => {
    if (!cvData) return;
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: '',
      level: 'Intermediate',
      order: cvData.skills.length,
    };
    setCvData({ ...cvData, skills: [...cvData.skills, newSkill] });
  };

  // Update skill
  const updateSkill = (id: string, updates: Partial<Skill>) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      skills: cvData.skills.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  };

  // Delete skill
  const deleteSkill = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      skills: cvData.skills.filter(s => s.id !== id),
    });
  };

  // Add language
  const addLanguage = () => {
    if (!cvData) return;
    const newLang: Language = {
      id: `lang-${Date.now()}`,
      name: '',
      level: 'Intermediate',
      order: cvData.languages.length,
    };
    setCvData({ ...cvData, languages: [...cvData.languages, newLang] });
  };

  // Update language
  const updateLanguage = (id: string, updates: Partial<Language>) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      languages: cvData.languages.map(l => l.id === id ? { ...l, ...updates } : l),
    });
  };

  // Delete language
  const deleteLanguage = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      languages: cvData.languages.filter(l => l.id !== id),
    });
  };

  // Add certificate
  const addCertificate = () => {
    if (!cvData) return;
    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      order: cvData.certificates.length,
    };
    setCvData({ ...cvData, certificates: [...cvData.certificates, newCert] });
  };

  // Update certificate
  const updateCertificate = (id: string, updates: Partial<Certificate>) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      certificates: cvData.certificates.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  };

  // Hobbies CRUD
  const addHobby = () => {
    if (!cvData) return;
    const newHobby: Hobby = {
      id: `hobby-${Date.now()}`,
      name: '',
      order: (cvData.hobbies || []).length,
    };
    setCvData({ ...cvData, hobbies: [...(cvData.hobbies || []), newHobby] });
  };

  const updateHobby = (id: string, updates: Partial<Hobby>) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      hobbies: (cvData.hobbies || []).map(h => h.id === id ? { ...h, ...updates } : h),
    });
  };

  const deleteHobby = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      hobbies: (cvData.hobbies || []).filter(h => h.id !== id),
    });
  };

  // Delete certificate
  const deleteCertificate = (id: string) => {
    if (!cvData) return;
    setCvData({
      ...cvData,
      certificates: cvData.certificates.filter(c => c.id !== id),
    });
  };

  // Handle drag end for experiences
  const handleExperienceDragEnd = (result: DropResult) => {
    if (!result.destination || !cvData) return;
    const items = Array.from(cvData.experiences);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const reordered = items.map((item, index) => ({ ...item, order: index }));
    setCvData({ ...cvData, experiences: reordered });
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!cv || !cvData) return;
    
    try {
      notify.info('Generating PDF...');
      
      // Dynamically import jsPDF (use doc.html first for better text fidelity)
      const { default: jsPDF } = await import('jspdf');
      const preview = document.querySelector('[data-cv-preview]') as HTMLElement;
      if (!preview) throw new Error('CV preview element not found');

      const filename = `${cvData.personalInfo.firstName || 'CV'}_${cvData.personalInfo.lastName || 'Resume'}_${cv.jobTitle || 'Optimized'}.pdf`;

      try {
        // Try jsPDF.html which preserves text spacing better
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const htmlOpts: any = {
          x: 0,
          y: 0,
          width: 210, // A4 width in mm
          windowWidth: preview.scrollWidth || 794,
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          },
          autoPaging: 'text',
          callback: (d: any) => {
            d.save(filename);
          },
        };
        await (doc as any).html(preview, htmlOpts);
      } catch (err) {
        // Fallback to html2canvas image if html() fails
        const html2canvas = (await import('html2canvas')).default;
        const canvasOptions: any = {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: preview.scrollWidth,
          height: preview.scrollHeight,
        };
        const canvas = await html2canvas(preview, canvasOptions);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF({
          orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [imgWidth, imgHeight],
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(filename);
      }
      notify.success('PDF generated successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      notify.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    }
  };

  // Delete CV
  const handleDelete = async () => {
    if (!cv || !currentUser) return;
    if (!confirm('Are you sure you want to delete this optimized resume?')) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'optimizedCVs', cv.id));
      notify.success('Resume deleted');
      navigate('/cv-optimizer');
    } catch (error: any) {
      console.error('Error deleting CV:', error);
      notify.error('Failed to delete resume');
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!cvData) return;
    try {
      const markdown = convertCVDataToMarkdown(cvData);
      await navigator.clipboard.writeText(markdown);
      notify.success('Copied to clipboard!');
    } catch (error) {
      notify.error('Failed to copy');
    }
  };

  // Language options for translation
  const languageOptions = [
    { code: 'en', name: 'English', shortCode: 'EN', flag: '🇬🇧' },
    { code: 'fr', name: 'French', shortCode: 'FR', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', shortCode: 'ES', flag: '🇪🇸' },
    { code: 'de', name: 'German', shortCode: 'DE', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', shortCode: 'IT', flag: '🇮🇹' },
  ];

  // Duplicate and translate CV to a new language
  const duplicateAndTranslateCV = async (targetLanguageCode: string, targetLanguageName: string) => {
    if (!cvData || !cv || !currentUser || isDuplicating) return;

    // First, reload all versions to ensure we have the latest data
    try {
      const cvRef = collection(db, 'users', currentUser.uid, 'optimizedCVs');
      const q = query(
        cvRef,
        where('jobTitle', '==', cv.jobTitle),
        where('company', '==', cv.company)
      );
      const querySnapshot = await getDocs(q);
      const allVersions: OptimizedCV[] = [];
      
      querySnapshot.forEach((doc) => {
        allVersions.push({ ...doc.data(), id: doc.id } as OptimizedCV);
      });

      // Check if this language version already exists
      const existingVersion = allVersions.find(v => {
        const versionLang = v.language || 'en';
        return versionLang === targetLanguageCode;
      });

      if (existingVersion) {
        notify.info(`Switching to existing ${targetLanguageName} version`);
        navigate(`/cv-optimizer/${existingVersion.id}`);
        return;
      }
    } catch (error) {
      console.error('Error checking existing versions:', error);
      // Continue with creation if check fails
    }

    setIsDuplicating(true);
    try {
      notify.info(`Creating ${targetLanguageName} version...`);

      // Get current CV content - NOW INCLUDES ALL INFORMATION (personal info, etc.)
      const currentMarkdown = convertCVDataToMarkdown(cvData);
      const currentCVData = { ...cvData };

      // Create comprehensive, high-quality translation prompt with enhanced context awareness
      const translationPrompt = `You are an elite professional translator and localization expert specializing in CV/resume translation for ${targetLanguageName}-speaking markets. Your mission is to produce a PERFECT translation that reads as if the CV was originally written by a native ${targetLanguageName} professional in the candidate's industry.

## CRITICAL TRANSLATION PHILOSOPHY
This is NOT a word-for-word translation. This is a PROFESSIONAL LOCALIZATION. You must:
1. Read and understand the ENTIRE CV context first (industry, seniority, career trajectory)
2. Identify the professional domain and adapt terminology accordingly
3. Translate meaning, intent, and professional impact - not individual words
4. Produce text that a native ${targetLanguageName} speaker would naturally write
5. Think like a ${targetLanguageName}-speaking recruiter or HR professional reading this CV

## COMPREHENSIVE TRANSLATION STRATEGY

### STEP 1: CONTEXTUAL ANALYSIS
Before translating ANYTHING:
- Analyze the candidate's industry (tech, finance, marketing, etc.)
- Identify their seniority level (junior, mid-level, senior, executive)
- Understand their career progression and narrative arc
- Note the professional domain-specific terminology used
- Recognize cultural references and professional conventions

### STEP 2: INTELLIGENT TERMINOLOGY HANDLING

#### Technical Terms & Anglicisms (CRITICAL RULES):
- **KEEP in original form**: Programming languages (Python, JavaScript, TypeScript, Java, C++, etc.)
- **KEEP in original form**: Frameworks & libraries (React, Angular, Vue, Django, Spring, etc.)
- **KEEP in original form**: Tools & platforms (AWS, Azure, Docker, Kubernetes, Git, Jenkins, etc.)
- **KEEP in original form**: Software & services (Salesforce, SAP, Tableau, Power BI, etc.)
- **KEEP in original form**: Methodologies (Agile, Scrum, DevOps, CI/CD, etc.)
- **KEEP in original form**: Technical acronyms (API, REST, SQL, NoSQL, JSON, XML, etc.)
- **KEEP in original form**: Cloud services (S3, EC2, Lambda, etc.)
- **TRANSLATE**: Generic terms like "project management", "team leadership", "client relations" → use ${targetLanguageName} equivalents
- **TRANSLATE**: Soft skills and business concepts → use natural ${targetLanguageName} expressions
- **ADAPT**: Job titles to ${targetLanguageName} conventions (e.g., "Software Engineer" → "Ingénieur Logiciel" in French, "Ingeniero de Software" in Spanish)

#### Industry-Specific Guidelines:
- **Tech Industry**: Keep most technical terms in English, translate descriptions and achievements
- **Business/Finance**: Translate business terminology, keep financial software names
- **Marketing**: Translate marketing concepts, keep platform names (Google Ads, Facebook Ads)
- **Healthcare**: Translate medical terms appropriately, keep certification names
- **Legal**: Translate legal terminology, keep jurisdiction-specific terms

### STEP 3: CULTURAL & PROFESSIONAL ADAPTATION

#### Job Titles:
- Adapt to ${targetLanguageName} professional conventions
- Examples:
  * English "Project Manager" → French "Chef de Projet" or "Responsable de Projet"
  * English "Senior Developer" → French "Développeur Senior" or "Ingénieur Senior"
  * English "Product Manager" → French "Chef de Produit" or "Responsable Produit"
- Research common ${targetLanguageName} job title patterns for the industry

#### Professional Language:
- Use ${targetLanguageName} business action verbs (e.g., French: "dirigé", "développé", "optimisé", "implémenté")
- Adapt achievement descriptions to ${targetLanguageName} professional writing style
- Use natural ${targetLanguageName} expressions for business outcomes
- Match the formality level expected in ${targetLanguageName} CVs for this industry level

#### Formatting & Conventions:
- Adapt date formats to ${targetLanguageName} conventions (e.g., French: "janvier 2020" vs "January 2020")
- Adapt number formats (e.g., French: "25 %" with space, Spanish: "25%" without space)
- Use ${targetLanguageName} currency symbols and formats when relevant
- Adapt measurement units if culturally appropriate

### STEP 4: LINGUISTIC EXCELLENCE & NATURALNESS

#### Writing Quality:
- Use natural, idiomatic ${targetLanguageName} - avoid literal translations
- Vary sentence structure to avoid repetitive patterns
- Use strong, industry-appropriate action verbs
- Ensure perfect grammar, syntax, and professional vocabulary
- Write as a native ${targetLanguageName} professional would - not as a translator

#### Professional Tone:
- Match the formality level: more formal for senior roles, slightly less formal for creative/tech roles
- Use ${targetLanguageName} professional CV conventions
- Ensure the tone is consistent throughout all sections
- Make it sound confident and professional, not translated

### STEP 5: SECTION-SPECIFIC GUIDELINES

#### Personal Information:
- Keep names, emails, phone numbers, URLs exactly as they are
- Translate location names only if there's a standard ${targetLanguageName} version
- Keep LinkedIn, portfolio URLs unchanged

#### Professional Summary:
- Translate to sound like a native ${targetLanguageName} professional wrote it
- Use ${targetLanguageName} professional summary conventions and structure
- Maintain the impact and value proposition
- Use natural ${targetLanguageName} phrasing, not literal translation
- Ensure it flows naturally and professionally

#### Experience Descriptions:
- Translate achievements using ${targetLanguageName} business action verbs
- Adapt metrics and results to ${targetLanguageName} formatting conventions
- Use ${targetLanguageName} professional achievement language patterns
- Each bullet point must read naturally in ${targetLanguageName}
- Preserve the impact and quantification of achievements
- Use varied sentence structures to avoid repetition

#### Education:
- Adapt degree names to ${targetLanguageName} equivalents when appropriate
- Translate institution names only if they have official ${targetLanguageName} names
- Keep international university names as they are
- Adapt dates to ${targetLanguageName} format

#### Skills:
- Keep technical skill names in original form (Python, React, AWS, etc.)
- Translate skill categories if needed (e.g., "Programming Languages" → "Langages de Programmation" in French)
- Adapt proficiency levels to ${targetLanguageName} conventions if different

#### Languages:
- Translate language names to ${targetLanguageName} (e.g., "English" → "Anglais" in French)
- Adapt proficiency levels to ${targetLanguageName} conventions

#### Certifications:
- Keep certification names in their original form (AWS Certified Solutions Architect, PMP, etc.)
- Translate issuer names only if they have official ${targetLanguageName} names
- Keep certification numbers and dates as they are

### STEP 6: STRUCTURE & FORMATTING PRESERVATION
- Preserve EXACTLY the same Markdown structure, headings, and formatting
- Maintain all bullet points, sections, and organizational hierarchy
- Keep the same visual structure (headers, subheaders, lists)
- Preserve spacing and line breaks exactly
- Do NOT change the document structure

### STEP 7: COHERENCE & CONSISTENCY
- Ensure all dates, numbers, and achievements are logically consistent
- Maintain the professional narrative flow across all sections
- Ensure skills, experiences, and education align coherently
- Verify that the professional summary matches the experience descriptions
- Use consistent terminology throughout (e.g., if you translate "project" as "projet" in one place, use it consistently)

## OUTPUT FORMAT - CRITICAL
You MUST return a valid JSON object (NO markdown code blocks, NO explanations) with TWO required fields:

{
  "translated_content": "<Complete translated Markdown content with all sections, preserving structure>",
  "translated_cv_data": {
  "personalInfo": {
      "firstName": "<translated if culturally appropriate, otherwise keep>",
      "lastName": "<keep as is>",
      "email": "<keep as is>",
      "phone": "<keep as is>",
      "location": "<translate location name if standard ${targetLanguageName} version exists>",
      "linkedin": "<keep as is>",
      "portfolio": "<keep as is>",
      "jobTitle": "<translate to ${targetLanguageName} professional convention>"
    },
    "professionalSummary": "<translated professional summary in natural ${targetLanguageName}>",
  "experiences": [
    {
      "id": "exp-1",
        "title": "<translated job title following ${targetLanguageName} conventions>",
        "company": "<keep company name as is unless official ${targetLanguageName} name exists>",
        "startDate": "<adapt date format to ${targetLanguageName} conventions>",
        "endDate": "<adapt date format, use 'Present' equivalent in ${targetLanguageName}>",
        "isCurrent": <boolean>,
        "description": ["<translated bullet 1 in natural ${targetLanguageName}>", "<translated bullet 2>", ...],
        "order": <number>
      }
    ],
    "educations": [
      {
        "id": "edu-1",
        "degree": "<translated degree name if ${targetLanguageName} equivalent exists>",
        "institution": "<keep as is unless official ${targetLanguageName} name>",
        "startDate": "<adapt format>",
        "endDate": "<adapt format>",
        "isCurrent": <boolean>,
        "description": "<translated if present>",
        "order": <number>
      }
    ],
    "skills": [
      {
        "id": "skill-1",
        "name": "<keep technical skills in original, translate generic categories>",
        "level": "<translate proficiency level to ${targetLanguageName} conventions>",
        "order": <number>
      }
    ],
    "languages": [
      {
        "id": "lang-1",
        "name": "<translate language name to ${targetLanguageName}>",
        "level": "<translate proficiency level to ${targetLanguageName} conventions>",
        "order": <number>
      }
    ],
    "certificates": [
      {
        "id": "cert-1",
        "name": "<keep certification name in original form>",
        "issuer": "<translate issuer if official ${targetLanguageName} name exists>",
        "date": "<keep as is>",
        "order": <number>
      }
    ]
  }
}

## COMPLETE CV CONTENT TO TRANSLATE:
${currentMarkdown}

## FINAL REMINDERS:
- This must read as if written by a native ${targetLanguageName} professional
- Keep technical terms, tools, and technologies in their original form
- Translate meaning and intent, not words
- Use natural, idiomatic ${targetLanguageName} throughout
- Ensure professional coherence and consistency
- The translation should be PERFECT - indistinguishable from a native-written CV

Return ONLY the JSON object. No markdown code blocks, no explanations, no additional text.`;

      // Call AI for translation with enhanced prompt
      // Add explicit instruction for JSON format in the prompt
      const enhancedPrompt = `${translationPrompt}

IMPORTANT: You MUST return a valid JSON object with both "translated_content" (markdown string) and "translated_cv_data" (structured JSON object) fields. Do not wrap the response in markdown code blocks. Return only the raw JSON.`;
      
      // Use 'resume-optimizer' type to get higher token limit (8000 tokens) for comprehensive translations
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resume-optimizer', // Use this type for higher token limit (8000 vs 4000)
          prompt: enhancedPrompt,
          // Include full CV data as context for better translation quality
          cvContent: currentMarkdown
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Translation API failed');
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Translation failed');
      }
      
      // Extract translated content from response
      let translatedMarkdown = '';
      let translatedCVData: CVData | null = null;
      
      // Parse the response
      let parsedResponse: any = null;
      if (typeof data.content === 'string') {
        try {
          parsedResponse = JSON.parse(data.content);
        } catch {
          // If not JSON, treat as plain markdown
          translatedMarkdown = data.content;
        }
      } else if (data.content && typeof data.content === 'object') {
        parsedResponse = data.content;
      }
      
      // Extract translated_cv_data if available (preferred method)
      if (parsedResponse && parsedResponse.translated_cv_data) {
        console.log('✅ Using structured translated_cv_data from AI response');
        translatedCVData = parsedResponse.translated_cv_data as CVData;
        translatedMarkdown = parsedResponse.translated_content || convertCVDataToMarkdown(translatedCVData);
      } else if (parsedResponse && parsedResponse.translated_content) {
        // Fallback: extract markdown and parse it
        translatedMarkdown = parsedResponse.translated_content;
      } else if (translatedMarkdown) {
        // Already set from string parsing
      } else {
        throw new Error('No translation received');
      }
      
      // Clean up markdown code fences if present
      translatedMarkdown = translatedMarkdown
        .replace(/```markdown\s*/gi, '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      if (!translatedMarkdown) {
        throw new Error('Translation is empty');
      }

      // If we don't have structured data yet, parse the markdown
      if (!translatedCVData) {
        console.log('⚠️ No structured data, parsing markdown...');
        translatedCVData = parseMarkdownToCVData(translatedMarkdown);
        
        // If parsing failed or returned empty data, use current CV data structure as fallback
        if (!translatedCVData || !translatedCVData.personalInfo || 
            (translatedCVData.experiences.length === 0 && translatedCVData.educations.length === 0 && !translatedCVData.professionalSummary)) {
          console.warn('⚠️ Parsing translated markdown failed, using current CV structure with translated content');
          // Use current CV data structure but update with translated content where possible
          translatedCVData = {
            ...cvData,
            professionalSummary: translatedMarkdown.split('##')[0]?.trim() || cvData.professionalSummary || '',
          };
        }
      }
      
      // Normalize the parsed data to ensure proper structure
      translatedCVData = normalizeCVData(translatedCVData);
      
      console.log('✅ Translated CV Data parsed:', {
        hasName: !!translatedCVData.personalInfo.firstName,
        expCount: translatedCVData.experiences.length,
        eduCount: translatedCVData.educations.length,
        skillsCount: translatedCVData.skills.length,
        summaryLength: translatedCVData.professionalSummary.length
      });

      // Helper function to remove undefined values recursively
      // Preserves Firestore special values like serverTimestamp()
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return null;
        }
        // Preserve Firestore FieldValue objects (like serverTimestamp())
        if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'FieldValue') {
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map(item => removeUndefined(item));
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
              cleaned[key] = removeUndefined(obj[key]);
            }
          }
          return cleaned;
        }
        return obj;
      };

      // Create new CV document
      const newCvRef = collection(db, 'users', currentUser.uid, 'optimizedCVs');
      const originalCVId = cv.originalCVId || cv.id;
      
      // Prepare data object, ensuring no undefined values
      const newCvDataRaw: any = {
        jobTitle: cv.jobTitle || '',
        company: cv.company || '',
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.uid,
        optimizedResumeMarkdown: translatedMarkdown,
        cvData: translatedCVData,
        sectionOrder: sectionOrder || [],
        showSkillLevel: showSkillLevel ?? true,
        styling: styling || { color: '#000000', font: 'Inter, system-ui, sans-serif', template: 'harvard' },
        language: targetLanguageCode,
        originalCVId: originalCVId,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add optional fields only if they exist
      if (cv.jobUrl) newCvDataRaw.jobUrl = cv.jobUrl;
      if (cvPhoto) newCvDataRaw.cvPhoto = cvPhoto;
      if (cv.atsScore !== undefined && cv.atsScore !== null) newCvDataRaw.atsScore = cv.atsScore;
      if (cv.keywordsUsed && Array.isArray(cv.keywordsUsed)) newCvDataRaw.keywordsUsed = cv.keywordsUsed;
      
      // Remove all undefined values recursively before saving
      const newCvData = removeUndefined(newCvDataRaw);
      
      console.log('💾 Saving translated CV with data:', {
        hasCvData: !!newCvData.cvData,
        cvDataKeys: newCvData.cvData ? Object.keys(newCvData.cvData) : [],
        hasPersonalInfo: !!newCvData.cvData?.personalInfo,
        expCount: newCvData.cvData?.experiences?.length || 0,
        markdownLength: newCvData.optimizedResumeMarkdown?.length || 0
      });
      
      const newCvDoc = await addDoc(newCvRef, newCvData);
      
      console.log('✅ Translated CV saved with ID:', newCvDoc.id);

      notify.success(`${targetLanguageName} version created!`);
      
      // Small delay to ensure Firestore write is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to the new CV
      navigate(`/cv-optimizer/${newCvDoc.id}`);
    } catch (error: any) {
      console.error('Error duplicating and translating CV:', error);
      notify.error(error.message || 'Failed to create translated version');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-[#EB7134]" />
      </div>
    );
  }

  if (!cv || !cvData) {
    return null;
  }

  return (
    <div className="fixed inset-0 h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 z-50">
      {/* Top Navigation Bar */}
      <div className="flex flex-col bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Main bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleSaveAndExit}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Glow effect */}
              {isGlowing && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: [0, 1, 0.9, 0.7, 0],
                      scale: [0.8, 1.3, 1.6, 1.8, 2]
                    }}
                    transition={{ 
                      duration: 0.6,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#EB7134]/40 via-[#5D4D6B]/40 to-[#EB7134]/40 -z-10"
                    style={{
                      filter: 'blur(16px)',
                      transform: 'translateZ(0)',
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: [0, 0.8, 0.6, 0],
                      scale: [0.9, 1.5, 1.8, 2.2]
                    }}
                    transition={{ 
                      duration: 0.5,
                      times: [0, 0.3, 0.6, 1],
                      ease: "easeOut",
                      delay: 0.1
                    }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#5D4D6B]/30 via-[#EB7134]/30 to-[#5D4D6B]/30 -z-10"
                    style={{
                      filter: 'blur(20px)',
                      transform: 'translateZ(0)',
                    }}
                  />
                </>
              )}
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Saving...</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Save and exit</span>
                </>
              )}
            </motion.button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Job Position</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{cv.jobTitle || 'Untitled'}</span>
            </div>
            {cv.company && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Company</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{cv.company}</span>
                </div>
              </>
            )}
          </div>

          {isSaved && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Saved in the cloud</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                disabled={zoomLevel <= 0.5}
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                −
              </button>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[45px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                disabled={zoomLevel >= 1.5}
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(0.9)}
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors ml-1"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#EB7134] to-[#5D4D6B] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
        {/* Left Control Panel */}
        <div 
          className="min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto relative group mr-4 flex-shrink-0"
          style={{ 
            width: `${panelWidth}px`,
            borderRadius: '20px',
            boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            transition: isResizing ? 'none' : 'width 0.2s ease-out, box-shadow 0.2s ease-out',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            className={`absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 ${
              isResizing ? 'bg-[#EB7134]/60' : 'bg-transparent hover:bg-[#EB7134]/30'
            } transition-colors`}
            style={{ 
              borderRadius: '0 20px 20px 0',
              touchAction: 'none'
            }}
          >
            {/* Visual indicator dots */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-1 h-1 rounded-full bg-[#EB7134]"></div>
              <div className="w-1 h-1 rounded-full bg-[#EB7134]"></div>
              <div className="w-1 h-1 rounded-full bg-[#EB7134]"></div>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* CV Title - Apple Style */}
            <div className="pb-6 border-b border-gray-200/60 dark:border-gray-700/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">
                {cv.jobTitle}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{cv.company}</p>
            </div>

            {/* Job overview - collapsible summary */}
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-[#5D4D6B]/10 dark:bg-[#5D4D6B]/20">
                        <Briefcase className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">Job overview</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {cv.jobTitle}{cv.company ? ` · ${cv.company}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 py-3 space-y-3">
                    {/* Company and link */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{cv.company || '—'}</span>
                      </div>
                      {cv.jobUrl && (
                        <a
                          href={cv.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EB7134] dark:text-[#EB7134] hover:underline"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          View posting
                        </a>
                      )}
                    </div>

                    {/* Structured summary */}
                    {jobOverview?.summary ? (
                      <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50/70 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 rounded-lg p-3">
                        {jobOverview.summary}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                        {isLoadingJobOverview ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing job posting…</span>
                          </div>
                        ) : (
                          <>
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>A concise role summary will appear here when available.</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Responsibilities and requirements */}
                    {(jobOverview?.responsibilities?.length || jobOverview?.requirements?.length) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {jobOverview?.responsibilities?.length ? (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                              Responsibilities
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                              {jobOverview.responsibilities.map((r, i) => (
                                <li key={`resp-${i}`}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {jobOverview?.requirements?.length ? (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                              Requirements
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                              {jobOverview.requirements.map((r, i) => (
                                <li key={`req-${i}`}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Keywords */}
                    {Array.isArray((cv as any).keywordsUsed) && (cv as any).keywordsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(cv as any).keywordsUsed.slice(0, 12).map((kw: string, idx: number) => (
                          <span
                            key={`${kw}-${idx}`}
                            className="text-xs px-2.5 py-1 bg-gradient-to-r from-[#EB7134]/20 to-[#5D4D6B]/20 dark:from-[#EB7134]/30 dark:to-[#5D4D6B]/30 text-[#EB7134] dark:text-[#EB7134] rounded-full font-medium border border-[#EB7134]/30 dark:border-[#EB7134]/50"
                          >
                            {kw}
                          </span>
                        ))}
                        {(cv as any).keywordsUsed.length > 12 && (
                          <span className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400 font-medium">
                            +{(cv as any).keywordsUsed.length - 12}
                          </span>
                        )}
                      </div>
                    )}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            {/* Language versions - simplified dropdown (no flag emojis) */}
            {cvVersions.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#EB7134]/10 dark:bg-[#EB7134]/20">
                    <Sparkles className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Versions</span>
                </div>
                <Popover className="relative">
                  {({ close }) => (
                    <>
                      <Popover.Button
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {(() => {
                          const currentLang = languageOptions.find(l => l.code === (cv?.language || 'en')) || languageOptions[0];
                          return (
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">{currentLang.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({currentLang.shortCode})</span>
                            </span>
                          );
                        })()}
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </Popover.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-150"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <Popover.Panel className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                          <div className="py-1 max-h-64 overflow-y-auto">
                            {cvVersions.map((version) => {
                              const lang = languageOptions.find(l => l.code === (version.language || 'en')) || languageOptions[0];
                              const isActive = version.id === cv?.id;
                              return (
                                <button
                                  key={version.id}
                                  onClick={() => { close(); navigate(`/cv-optimizer/${version.id}`); }}
                                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                                    isActive
                                      ? 'bg-[#EB7134]/10 dark:bg-[#EB7134]/20 text-[#EB7134] dark:text-[#EB7134]'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="font-medium">{lang.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{lang.shortCode}</span>
                                  </span>
                                  {isActive && <Check className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />}
                                </button>
                              );
                            })}
                          </div>
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              </div>
            )}

            {/* Quick Actions - Apple Style */}
            <div className="space-y-2">
              {/* Duplicate & Translate */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow">
                      <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#EB7134]/10 dark:bg-[#EB7134]/20">
                    <CopyIcon className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                        </div>
                        <span>Duplicate and translate</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 py-3 space-y-2">
                      {languageOptions.map((lang) => {
                        // Check if this language version exists (considering 'en' as default if no language specified)
                        const existingVersion = cvVersions.find(v => {
                          const versionLang = v.language || 'en';
                          return versionLang === lang.code;
                        });
                        const isCurrentVersion = (cv?.language || 'en') === lang.code;
                        
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              if (existingVersion && !isCurrentVersion) {
                                // Switch to existing version
                                navigate(`/cv-optimizer/${existingVersion.id}`);
                              } else if (!isCurrentVersion && !existingVersion) {
                                // Create new translation only if it doesn't exist
                                duplicateAndTranslateCV(lang.code, lang.name);
                              }
                            }}
                            disabled={isDuplicating || isCurrentVersion}
                            className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isCurrentVersion
                                ? 'bg-[#EB7134]/20 dark:bg-[#EB7134]/30 text-[#EB7134] dark:text-[#EB7134] border border-[#EB7134]/40 dark:border-[#EB7134]/70'
                                : existingVersion
                                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-semibold transition-colors ${
                                  isCurrentVersion
                                    ? 'bg-[#EB7134] text-white'
                                    : existingVersion
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {lang.shortCode}
                                </div>
                                <span className="font-medium">{lang.name}</span>
                              </span>
                              {isCurrentVersion && (
                                <div className="flex items-center gap-1">
                                  <Check className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                                  <span className="text-xs text-[#EB7134] dark:text-[#EB7134]">Current</span>
                                </div>
                              )}
                              {existingVersion && !isCurrentVersion && (
                                <div className="flex items-center gap-1">
                                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs text-blue-600 dark:text-blue-400">Available</span>
                                </div>
                              )}
                              {isDuplicating && !existingVersion && !isCurrentVersion && (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>

              {/* Choose Template */}
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#5D4D6B]/10 dark:bg-[#5D4D6B]/20">
                    <FileText className="w-4 h-4 text-[#5D4D6B] dark:text-[#5D4D6B]" />
                  </div>
                  <span>Choose a model</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Customize Section - Apple Style */}
            <div className="pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
              <button
                onClick={() => toggleSection('personalize')}
                className="flex items-center justify-between w-full mb-5"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Customize</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('personalize') ? 'transform rotate-180' : ''}`} />
              </button>

              {expandedSections.has('personalize') && (
                <div className="space-y-5">
                  {/* Profile Photo - Only for Modern Template */}
                  {styling.template === 'modern' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 tracking-wide uppercase">
                        Profile Photo
                      </label>
                      <div className="flex items-center gap-4">
                        {cvPhoto && (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                            <img src={cvPhoto} alt="Profile" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            id="cv-photo-upload"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="cv-photo-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            {cvPhoto ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          {cvPhoto && (
                            <button
                              onClick={() => setCvPhoto('')}
                              className="ml-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Recommended: Square image, at least 400x400px
                      </p>
                    </div>
                  )}

                  {/* Font */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 tracking-wide uppercase">
                      Font
                    </label>
                    <select
                      value={styling.font}
                      onChange={(e) => {
                        setStyling({ ...styling, font: e.target.value });
                        notify.success('Font updated');
                      }}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                      style={{ fontFamily: styling.font }}
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Choose a professional font for your CV
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CV Score - Apple Style */}
            {cv.atsScore && (
              <div className="pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">ATS Score</h3>
                  <Popover className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          onClick={() => {
                            if (!open && atsTips.length === 0) {
                              generateAtsTips();
                            }
                          }}
                          className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] font-medium transition-colors focus:outline-none cursor-pointer"
                        >
                          {isLoadingAtsTips ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading...
                            </span>
                          ) : (
                            'Tips'
                          )}
                        </Popover.Button>
                        <AnimatePresence>
                          {open && (atsTips.length > 0 || isLoadingAtsTips) && (
                            <Popover.Panel
                              static
                              as={motion.div}
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute right-0 top-8 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
                            >
                              {isLoadingAtsTips ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-[#EB7134] dark:text-[#EB7134]" />
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Generating tips...</span>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Personalized Tips</h4>
                                    <Popover.Button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                      <X className="w-4 h-4" />
                                    </Popover.Button>
                                  </div>
                                  <ul className="space-y-2">
                                    {atsTips.map((tip, index) => (
                                      <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                                      >
                                        <span className="text-[#EB7134] dark:text-[#EB7134] mt-0.5 flex-shrink-0">•</span>
                                        <span>{tip}</span>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </Popover.Panel>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </Popover>
                </div>
                <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`absolute h-full transition-all duration-700 ease-out rounded-full ${
                      cv.atsScore >= 80 ? 'bg-gradient-to-r from-[#EB7134] to-[#5D4D6B]' :
                      cv.atsScore >= 65 ? 'bg-gradient-to-r from-blue-500 to-[#5D4D6B]' :
                      'bg-gradient-to-r from-pink-500 to-red-600'
                    }`}
                    style={{ width: `${cv.atsScore}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2.5">{cv.atsScore}% match</p>
              </div>
            )}

            {/* Personal Information - Apple Style */}
            <div className="pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5 tracking-tight">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.firstName}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, firstName: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.lastName}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, lastName: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.jobTitle}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, jobTitle: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="Job Title"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={cvData.personalInfo.email}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, email: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={cvData.personalInfo.phone || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, phone: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="(313) - 867-5309"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={cvData.personalInfo.location || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, location: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={cvData.personalInfo.linkedin || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, linkedin: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="https://www.linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Portfolio Link
                  </label>
                  <input
                    type="url"
                    value={cvData.personalInfo.portfolio || ''}
                    onChange={(e) => setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, portfolio: e.target.value },
                    })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] transition-all shadow-sm"
                    placeholder="https://myportfolio.com"
                  />
                </div>
              </div>
            </div>

            {/* Draggable Sections */}
            <DragDropContext onDragEnd={onSectionDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sectionOrder.map((sectionId, index) => {
                      // Professional Summary
                      if (sectionId === 'professionalSummary') {
                        return (
                          <Draggable key="professionalSummary" draggableId="professionalSummary" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Professional Summary</h3>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (openChatSummary) {
                                        setOpenChatSummary(false);
                                      } else {
                                        setOpenChatSummary(true);
                                        if (!chatMessages['summary']) {
                                          setChatMessages({
                                            ...chatMessages,
                                            'summary': []
                                          });
                                        }
                                      }
                                    }}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] hover:bg-[#EB7134]/10 dark:hover:bg-[#EB7134]/20"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {openChatSummary ? 'Close AI Chat' : 'Generate by AI'}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  Introduce yourself in 2-4 sentences, focusing on your main role, relevant experience, and significant achievements. Highlight your unique strengths and skills to captivate the reader.
                                </p>
                                <textarea
                                  value={cvData.professionalSummary}
                                  onChange={(e) => setCvData({ ...cvData, professionalSummary: e.target.value })}
                                  className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134] resize-none ${aiPulseSummary ? 'animate-pulse' : ''}`}
                                  rows={4}
                                  placeholder="Experienced CRM consultant passionate about leveraging technology..."
                                />
                                
                                {/* AI Chat Interface for Summary */}
                                {openChatSummary && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
                                  >
                                    <div className="bg-gradient-to-br from-[#EB7134]/10 to-[#5D4D6B]/10 dark:from-[#EB7134]/20 dark:to-[#5D4D6B]/20 rounded-xl p-4 border border-[#EB7134]/30 dark:border-[#EB7134]/50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-[#EB7134]/20 dark:bg-[#EB7134]/40">
                                          <Sparkles className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
                                          <p className="text-xs text-gray-600 dark:text-gray-400">Describe what you'd like to modify</p>
                                        </div>
                                      </div>
                                      
                                      {/* Chat Messages */}
                                      <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                                        {chatMessages['summary'] && chatMessages['summary'].length > 0 ? (
                                          chatMessages['summary'].map((msg, idx) => (
                                            <motion.div
                                              key={idx}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                                msg.role === 'user'
                                                  ? 'bg-[#EB7134] text-white'
                                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                              }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                              </div>
                                              {msg.role === 'assistant' && msg.suggestion && (
                                                <div className="basis-full pl-10 mt-1.5 flex items-center gap-2">
                                                  <button
                                                    onClick={() => applySuggestion('summary', idx)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#EB7134] text-white shadow-sm hover:bg-[#5D4D6B] focus:outline-none focus:ring-2 focus:ring-[#EB7134]/40 transition-colors"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                    Insert
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      const thread = chatMessages['summary'] || [];
                                                      const updated = [...thread];
                                                      updated[idx] = { role: 'assistant', content: msg.content };
                                                      setChatMessages({ ...chatMessages, ['summary']: updated });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-colors"
                                                  >
                                                    <X className="w-3 h-3" />
                                                    Dismiss
                                                  </button>
                                                </div>
                                              )}
                                            </motion.div>
                                          ))
                                        ) : (
                                          <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                            <p>Start a conversation to improve your professional summary.</p>
                                            <p className="mt-1">Example: "Make it more technical" or "Focus on leadership"</p>
                                          </div>
                                        )}
                                        {aiUpdatingSummary && (
                                          <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>AI is thinking...</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Chat Input */}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={chatInput['summary'] || ''}
                                          onChange={(e) => setChatInput({ ...chatInput, 'summary': e.target.value })}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && chatInput['summary']?.trim()) {
                                              e.preventDefault();
                                              improveSummary(chatInput['summary']);
                                              setChatInput({ ...chatInput, 'summary': '' });
                                            }
                                          }}
                                          placeholder="What would you like to change? (e.g., 'Make it more concise', 'Add leadership focus')"
                                          className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134]"
                                          disabled={aiUpdatingSummary}
                                        />
                                        <button
                                          onClick={() => {
                                            if (chatInput['summary']?.trim()) {
                                              improveSummary(chatInput['summary']);
                                              setChatInput({ ...chatInput, 'summary': '' });
                                            } else {
                                              improveSummary();
                                            }
                                          }}
                                          disabled={aiUpdatingSummary}
                                          className="px-4 py-2 bg-[#EB7134] hover:bg-[#5D4D6B] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        >
                                          {aiUpdatingSummary ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Sparkles className="w-3 h-3" />
                                          )}
                                          {chatInput['summary']?.trim() ? 'Send' : 'Quick Generate'}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Experience Section
                      if (sectionId === 'experience') {
                        return (
                          <Draggable key="experience" draggableId="experience" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Experience</h3>
                                  </div>
                                  <button
                                    onClick={addExperience}
                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  Summarize your main achievements from the last ten years using bullet points with measurable results (e.g., "20% increase in efficiency thanks to new processes").
                                </p>
                                <DragDropContext onDragEnd={handleExperienceDragEnd}>
                                  <Droppable droppableId="experiences">
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {cvData.experiences.map((exp, expIndex) => (
                                          <Draggable key={exp.id} draggableId={exp.id} index={expIndex}>
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{
                                                  ...provided.draggableProps.style,
                                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                  opacity: snapshot.isDragging ? 1 : 1,
                                                  transform: snapshot.isDragging 
                                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                                    : provided.draggableProps.style?.transform || 'none',
                                                  boxShadow: snapshot.isDragging 
                                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                                }}
                                                className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 ${
                                                  snapshot.isDragging ? 'bg-[#EB7134]/10 dark:bg-[#EB7134]/20' : ''
                                                }`}
                                              >
                                                <div className="flex items-start justify-between mb-3">
                                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                                    <div className="flex-1">
                                                      <input
                                                        type="text"
                                                        value={exp.title}
                                                        onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                                                        className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-1"
                                                        placeholder="Job Title"
                                                      />
                                                      <input
                                                        type="text"
                                                        value={exp.company}
                                                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                                                        className="text-xs text-gray-600 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                                        placeholder="Company"
                                                      />
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() => deleteExperience(exp.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                  <input
                                                    type="text"
                                                    value={exp.startDate}
                                                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                                                    className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                                                    placeholder="Start Date"
                                                  />
                                                  <span className="text-xs text-gray-400">-</span>
                                                  <input
                                                    type="text"
                                                    value={exp.endDate}
                                                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                                                    className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                                                    placeholder="End Date"
                                                    disabled={exp.isCurrent}
                                                  />
                                                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <input
                                                      type="checkbox"
                                                      checked={exp.isCurrent}
                                                      onChange={(e) => updateExperience(exp.id, { isCurrent: e.target.checked, endDate: e.target.checked ? 'Present' : '' })}
                                                      className="rounded"
                                                    />
                                                    Present
                                                  </label>
                                                </div>
                                                <div className={`space-y-2 ${aiPulseExperience === exp.id ? 'animate-pulse' : ''}`}>
                                                  {exp.description.map((desc, idx) => (
                                                    <motion.div
                                                      key={idx + '-' + desc}
                                                      initial={{ opacity: 0, y: 4 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      transition={{ duration: 0.15 }}
                                                      className="flex items-start gap-2"
                                                    >
                                                      <span className="text-gray-400 mt-1">•</span>
                                                      <input
                                                        type="text"
                                                        value={desc}
                                                        onChange={(e) => {
                                                          const newDesc = [...exp.description];
                                                          newDesc[idx] = e.target.value;
                                                          updateExperience(exp.id, { description: newDesc });
                                                        }}
                                                        className="flex-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                                                        placeholder="Achievement or responsibility"
                                                      />
                                                      <button
                                                        onClick={() => {
                                                          const newDesc = exp.description.filter((_, i) => i !== idx);
                                                          updateExperience(exp.id, { description: newDesc });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </motion.div>
                                                  ))}
                                                  <button
                                                    onClick={() => {
                                                      updateExperience(exp.id, { description: [...exp.description, ''] });
                                                    }}
                                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                    Add bullet point
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      if (openChatExperienceId === exp.id) {
                                                        setOpenChatExperienceId(null);
                                                      } else {
                                                        setOpenChatExperienceId(exp.id);
                                                        // Initialize chat if first time
                                                        if (!chatMessages[exp.id]) {
                                                          setChatMessages({
                                                            ...chatMessages,
                                                            [exp.id]: []
                                                          });
                                                        }
                                                      }
                                                    }}
                                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                  >
                                                    <Sparkles className="w-3 h-3" />
                                                    {openChatExperienceId === exp.id ? 'Close AI Chat' : 'Generate by AI'}
                                                  </button>
                                                </div>
                                                
                                                {/* AI Chat Interface */}
                                                {openChatExperienceId === exp.id && (
                                                  <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
                                                  >
                                                    <div className="bg-gradient-to-br from-blue-50 to-[#5D4D6B]/10 dark:from-blue-900/20 dark:to-[#5D4D6B]/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                                                      <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
                                                          <p className="text-xs text-gray-600 dark:text-gray-400">Describe what you'd like to modify</p>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Chat Messages */}
                                                      <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                                                        {chatMessages[exp.id] && chatMessages[exp.id].length > 0 ? (
                                                          chatMessages[exp.id].map((msg, idx) => (
                                                            <motion.div
                                                              key={idx}
                                                              initial={{ opacity: 0, y: 10 }}
                                                              animate={{ opacity: 1, y: 0 }}
                                                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                            >
                                                              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                                                msg.role === 'user'
                                                                  ? 'bg-blue-600 text-white'
                                                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                                              }`}>
                                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                              </div>
                                                              {msg.role === 'assistant' && msg.suggestion && (
                                                                <div className="basis-full pl-10 mt-1.5 flex items-center gap-2">
                                                                  <button
                                                                    onClick={() => applySuggestion(exp.id, idx)}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                                                                  >
                                                                    <Check className="w-3 h-3" />
                                                                    Insert
                                                                  </button>
                                                                  <button
                                                                    onClick={() => {
                                                                      const thread = chatMessages[exp.id] || [];
                                                                      const updated = [...thread];
                                                                      updated[idx] = { role: 'assistant', content: msg.content };
                                                                      setChatMessages({ ...chatMessages, [exp.id]: updated });
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-colors"
                                                                  >
                                                                    <X className="w-3 h-3" />
                                                                    Dismiss
                                                                  </button>
                                                                </div>
                                                              )}
                                                            </motion.div>
                                                          ))
                                                        ) : (
                                                          <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                                            <p>Start a conversation to improve your bullet points.</p>
                                                            <p className="mt-1">Example: "Make them more technical" or "Add metrics"</p>
                                                          </div>
                                                        )}
                                                        {aiUpdatingExperience === exp.id && (
                                                          <div className="flex justify-start">
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                                                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                <span>AI is thinking...</span>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                      
                                                      {/* Chat Input */}
                                                      <div className="flex gap-2">
                                                        <input
                                                          type="text"
                                                          value={chatInput[exp.id] || ''}
                                                          onChange={(e) => setChatInput({ ...chatInput, [exp.id]: e.target.value })}
                                                          onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey && chatInput[exp.id]?.trim()) {
                                                              e.preventDefault();
                                                              improveExperienceBullets(exp.id, chatInput[exp.id]);
                                                              setChatInput({ ...chatInput, [exp.id]: '' });
                                                            }
                                                          }}
                                                          placeholder="What would you like to change? (e.g., 'Add more metrics', 'Make it more technical')"
                                                          className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                          disabled={aiUpdatingExperience === exp.id}
                                                        />
                                                        <button
                                                          onClick={() => {
                                                            if (chatInput[exp.id]?.trim()) {
                                                              improveExperienceBullets(exp.id, chatInput[exp.id]);
                                                              setChatInput({ ...chatInput, [exp.id]: '' });
                                                            } else {
                                                              // Quick generate without prompt
                                                              improveExperienceBullets(exp.id);
                                                            }
                                                          }}
                                                          disabled={aiUpdatingExperience === exp.id}
                                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                        >
                                                          {aiUpdatingExperience === exp.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                          ) : (
                                                            <Sparkles className="w-3 h-3" />
                                                          )}
                                                          {chatInput[exp.id]?.trim() ? 'Send' : 'Quick Generate'}
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </motion.div>
                                                )}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Education Section
                      if (sectionId === 'education') {
                        return (
                          <Draggable key="education" draggableId="education" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Initial Education</h3>
                                  </div>
                                  <button
                                    onClick={addEducation}
                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  Present your journey over the last 10 years. Mention your qualifications, certifications, and all relevant achievements or specialized training.
                                </p>
                                <div className="space-y-3">
                                  {cvData.educations.map((edu) => (
                                    <div
                                      key={edu.id}
                                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                                            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-1"
                                            placeholder="Degree"
                                          />
                                          <input
                                            type="text"
                                            value={edu.institution}
                                            onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                                            className="text-xs text-gray-600 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                            placeholder="Institution"
                                          />
                                        </div>
                                        <button
                                          onClick={() => deleteEducation(edu.id)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <input
                                          type="text"
                                          value={edu.startDate}
                                          onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                                          className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                                          placeholder="Start Date"
                                        />
                                        <span className="text-xs text-gray-400">-</span>
                                        <input
                                          type="text"
                                          value={edu.endDate}
                                          onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                                          className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1"
                                          placeholder="End Date"
                                          disabled={edu.isCurrent}
                                        />
                                        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                          <input
                                            type="checkbox"
                                            checked={edu.isCurrent}
                                            onChange={(e) => updateEducation(edu.id, { isCurrent: e.target.checked, endDate: e.target.checked ? 'Present' : '' })}
                                            className="rounded"
                                          />
                                          Present
                                        </label>
                                      </div>
                                      <textarea
                                        value={edu.description || ''}
                                        onChange={(e) => updateEducation(edu.id, { description: e.target.value })}
                                        className={`w-full text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 resize-none ${aiPulseEducation === edu.id ? 'animate-pulse' : ''}`}
                                        rows={2}
                                        placeholder="Description"
                                      />
                                      <button
                                        onClick={() => {
                                          if (openChatEducationId === edu.id) {
                                            setOpenChatEducationId(null);
                                          } else {
                                            setOpenChatEducationId(edu.id);
                                            // Initialize chat if first time
                                            if (!chatMessages[`education-${edu.id}`]) {
                                              setChatMessages({
                                                ...chatMessages,
                                                [`education-${edu.id}`]: []
                                              });
                                            }
                                          }
                                        }}
                                        className="mt-2 text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        {openChatEducationId === edu.id ? 'Close AI Chat' : 'Generate by AI'}
                                      </button>
                                      
                                      {/* AI Chat Interface for Education */}
                                      {openChatEducationId === edu.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3"
                                        >
                                          <div className="bg-gradient-to-br from-blue-50 to-[#5D4D6B]/10 dark:from-blue-900/20 dark:to-[#5D4D6B]/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                                            <div className="flex items-center gap-2 mb-3">
                                              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Describe what you'd like to modify</p>
                                              </div>
                                            </div>
                                            
                                            {/* Chat Messages */}
                                            <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                                              {chatMessages[`education-${edu.id}`] && chatMessages[`education-${edu.id}`].length > 0 ? (
                                                chatMessages[`education-${edu.id}`].map((msg, idx) => (
                                                  <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                  >
                                                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                                      msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                                    }`}>
                                                      <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                    {msg.role === 'assistant' && msg.suggestion && (
                                                      <div className="basis-full pl-10 mt-1.5 flex items-center gap-2">
                                                        <button
                                                          onClick={() => applySuggestion(`education-${edu.id}`, idx)}
                                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                                                        >
                                                          <Check className="w-3 h-3" />
                                                          Insert
                                                        </button>
                                                        <button
                                                          onClick={() => {
                                                            const thread = chatMessages[`education-${edu.id}`] || [];
                                                            const updated = [...thread];
                                                            updated[idx] = { role: 'assistant', content: msg.content };
                                                            setChatMessages({ ...chatMessages, [`education-${edu.id}`]: updated });
                                                          }}
                                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-colors"
                                                        >
                                                          <X className="w-3 h-3" />
                                                          Dismiss
                                                        </button>
                                                      </div>
                                                    )}
                                                  </motion.div>
                                                ))
                                              ) : (
                                                <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                                  <p>Start a conversation to improve your education description.</p>
                                                  <p className="mt-1">Example: "Add relevant coursework" or "Focus on achievements"</p>
                                                </div>
                                              )}
                                              {aiUpdatingEducation === edu.id && (
                                                <div className="flex justify-start">
                                                  <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                      <Loader2 className="w-3 h-3 animate-spin" />
                                                      <span>AI is thinking...</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Chat Input */}
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                value={chatInput[`education-${edu.id}`] || ''}
                                                onChange={(e) => setChatInput({ ...chatInput, [`education-${edu.id}`]: e.target.value })}
                                                onKeyPress={(e) => {
                                                  if (e.key === 'Enter' && !e.shiftKey && chatInput[`education-${edu.id}`]?.trim()) {
                                                    e.preventDefault();
                                                    improveEducationDescription(edu.id, chatInput[`education-${edu.id}`]);
                                                    setChatInput({ ...chatInput, [`education-${edu.id}`]: '' });
                                                  }
                                                }}
                                                placeholder="What would you like to change? (e.g., 'Add relevant coursework', 'Focus on achievements')"
                                                className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={aiUpdatingEducation === edu.id}
                                              />
                                              <button
                                                onClick={() => {
                                                  if (chatInput[`education-${edu.id}`]?.trim()) {
                                                    improveEducationDescription(edu.id, chatInput[`education-${edu.id}`]);
                                                    setChatInput({ ...chatInput, [`education-${edu.id}`]: '' });
                                                  } else {
                                                    // Quick generate without prompt
                                                    improveEducationDescription(edu.id);
                                                  }
                                                }}
                                                disabled={aiUpdatingEducation === edu.id}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                              >
                                                {aiUpdatingEducation === edu.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Sparkles className="w-3 h-3" />
                                                )}
                                                {chatInput[`education-${edu.id}`]?.trim() ? 'Send' : 'Quick Generate'}
                                              </button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Skills Section
                      if (sectionId === 'skills') {
                        return (
                          <Draggable key="skills" draggableId="skills" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Skills</h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (openChatSkills) {
                                          setOpenChatSkills(false);
                                        } else {
                                          setOpenChatSkills(true);
                                          if (!chatMessages['skills']) {
                                            setChatMessages({
                                              ...chatMessages,
                                              'skills': []
                                            });
                                          }
                                        }
                                      }}
                                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] hover:bg-[#EB7134]/10 dark:hover:bg-[#EB7134]/20"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      {openChatSkills ? 'Close AI Chat' : 'Generate by AI'}
                                    </button>
                                    <button
                                      onClick={addSkill}
                                      className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                  Highlight the 5 skills that match the position. Tip: use keywords from the job description to make your CV more relevant.
                                </p>
                                <div className={`space-y-3 ${aiPulseSkills ? 'animate-pulse' : ''}`}>
                                  {cvData.skills.map((skill) => (
                                    <div
                                      key={skill.id}
                                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                    >
                                      <input
                                        type="text"
                                        value={skill.name}
                                        onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                                        className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0"
                                        placeholder="Skill name"
                                      />
                                      <select
                                        value={skill.level}
                                        onChange={(e) => updateSkill(skill.id, { level: e.target.value as any })}
                                        className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5"
                                      >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                      </select>
                                      <button
                                        onClick={() => deleteSkill(skill.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <label className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
                                  <input 
                                    type="checkbox" 
                                    className="rounded" 
                                    checked={showSkillLevel}
                                    onChange={(e) => setShowSkillLevel(e.target.checked)}
                                  />
                                  Show skill level in CV
                                </label>
                                
                                {/* AI Chat Interface for Skills */}
                                {openChatSkills && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
                                  >
                                    <div className="bg-gradient-to-br from-[#EB7134]/10 to-[#5D4D6B]/10 dark:from-[#EB7134]/20 dark:to-[#5D4D6B]/20 rounded-xl p-4 border border-[#EB7134]/30 dark:border-[#EB7134]/50">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-[#EB7134]/20 dark:bg-[#EB7134]/40">
                                          <Sparkles className="w-4 h-4 text-[#EB7134] dark:text-[#EB7134]" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h4>
                                          <p className="text-xs text-gray-600 dark:text-gray-400">Describe what you'd like to modify</p>
                                        </div>
                                      </div>
                                      
                                      {/* Chat Messages */}
                                      <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                                        {chatMessages['skills'] && chatMessages['skills'].length > 0 ? (
                                          chatMessages['skills'].map((msg, idx) => (
                                            <motion.div
                                              key={idx}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                                msg.role === 'user'
                                                  ? 'bg-[#EB7134] text-white'
                                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                              }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                              </div>
                                              {msg.role === 'assistant' && msg.suggestion && (
                                                <div className="basis-full pl-10 mt-1.5 flex items-center gap-2">
                                                  <button
                                                    onClick={() => applySuggestion('skills', idx)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#EB7134] text-white shadow-sm hover:bg-[#5D4D6B] focus:outline-none focus:ring-2 focus:ring-[#EB7134]/40 transition-colors"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                    Insert
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      const thread = chatMessages['skills'] || [];
                                                      const updated = [...thread];
                                                      updated[idx] = { role: 'assistant', content: msg.content };
                                                      setChatMessages({ ...chatMessages, ['skills']: updated });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400/30 transition-colors"
                                                  >
                                                    <X className="w-3 h-3" />
                                                    Dismiss
                                                  </button>
                                                </div>
                                              )}
                                            </motion.div>
                                          ))
                                        ) : (
                                          <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                            <p>Start a conversation to improve your skills list.</p>
                                            <p className="mt-1">Example: "Add more technical skills" or "Focus on leadership"</p>
                                          </div>
                                        )}
                                        {aiUpdatingSkills && (
                                          <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>AI is thinking...</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Chat Input */}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={chatInput['skills'] || ''}
                                          onChange={(e) => setChatInput({ ...chatInput, 'skills': e.target.value })}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && chatInput['skills']?.trim()) {
                                              e.preventDefault();
                                              improveSkills(chatInput['skills']);
                                              setChatInput({ ...chatInput, 'skills': '' });
                                            }
                                          }}
                                          placeholder="What would you like to change? (e.g., 'Add more technical skills', 'Focus on leadership')"
                                          className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EB7134] focus:border-[#EB7134]"
                                          disabled={aiUpdatingSkills}
                                        />
                                        <button
                                          onClick={() => {
                                            if (chatInput['skills']?.trim()) {
                                              improveSkills(chatInput['skills']);
                                              setChatInput({ ...chatInput, 'skills': '' });
                                            } else {
                                              improveSkills();
                                            }
                                          }}
                                          disabled={aiUpdatingSkills}
                                          className="px-4 py-2 bg-[#EB7134] hover:bg-[#5D4D6B] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        >
                                          {aiUpdatingSkills ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Sparkles className="w-3 h-3" />
                                          )}
                                          {chatInput['skills']?.trim() ? 'Send' : 'Quick Generate'}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Languages Section
                      if (sectionId === 'languages') {
                        return (
                          <Draggable key="languages" draggableId="languages" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Languages</h3>
                                  </div>
                                  <button
                                    onClick={addLanguage}
                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                  List the languages you know and your level of proficiency.
                                </p>
                                <div className="space-y-3">
                                  {cvData.languages.map((lang) => (
                                    <div
                                      key={lang.id}
                                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                    >
                                      <input
                                        type="text"
                                        value={lang.name}
                                        onChange={(e) => updateLanguage(lang.id, { name: e.target.value })}
                                        className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0"
                                        placeholder="Language"
                                      />
                                      <select
                                        value={lang.level}
                                        onChange={(e) => updateLanguage(lang.id, { level: e.target.value as any })}
                                        className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5"
                                      >
                                        <option value="Basic">Basic</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Native">Native</option>
                                      </select>
                                      <button
                                        onClick={() => deleteLanguage(lang.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Certificates Section
                      if (sectionId === 'certificates') {
                        return (
                          <Draggable key="certificates" draggableId="certificates" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Certificates</h3>
                                  </div>
                                  <button
                                    onClick={addCertificate}
                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  Highlight your professional achievements and verified expertise. Add industry-recognized certifications, training programs or specialized courses.
                                </p>
                                <div className="space-y-2">
                                  {cvData.certificates.map((cert) => (
                                    <div
                                      key={cert.id}
                                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <input
                                            type="text"
                                            value={cert.name}
                                            onChange={(e) => updateCertificate(cert.id, { name: e.target.value })}
                                            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-1"
                                            placeholder="Certificate name"
                                          />
                                          <input
                                            type="text"
                                            value={cert.issuer}
                                            onChange={(e) => updateCertificate(cert.id, { issuer: e.target.value })}
                                            className="text-xs text-gray-600 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                            placeholder="Issuer"
                                          />
                                        </div>
                                        <button
                                          onClick={() => deleteCertificate(cert.id)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={cert.date}
                                        onChange={(e) => updateCertificate(cert.id, { date: e.target.value })}
                                        className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full"
                                        placeholder="Date"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      // Hobbies Section
                      if (sectionId === 'hobbies') {
                        return (
                          <Draggable key="hobbies" draggableId="hobbies" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  opacity: snapshot.isDragging ? 1 : 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform || ''} rotate(0.5deg) scale(1.01)`
                                    : provided.draggableProps.style?.transform || 'none',
                                  boxShadow: snapshot.isDragging 
                                    ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  backgroundColor: snapshot.isDragging ? '#faf5ff' : 'transparent',
                                }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex items-center gap-2 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hobbies</h3>
                                  </div>
                                  <button
                                    onClick={addHobby}
                                    className="text-xs text-[#EB7134] dark:text-[#EB7134] hover:text-[#5D4D6B] dark:hover:text-[#5D4D6B] flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  Add your hobbies or interests to show personality and stand out.
                                </p>
                                <div className="space-y-2">
                                  {(cvData.hobbies || []).map((hobby) => (
                                    <div
                                      key={hobby.id}
                                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                    >
                                      <input
                                        type="text"
                                        value={hobby.name}
                                        onChange={(e) => updateHobby(hobby.id, { name: e.target.value })}
                                        className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0"
                                        placeholder="e.g., Chess, Generative AI projects, Cinema"
                                      />
                                      <button
                                        onClick={() => deleteHobby(hobby.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      
                      return null;
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#EB7134] to-[#5D4D6B] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save CV
                  </>
                )}
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Preview Area - PDF-like View with Zoom */}
        <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-8 flex items-start justify-center">
          <div className="bg-white shadow-2xl transition-transform duration-200" style={{ 
            width: '210mm',
            minHeight: '297mm',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            borderRadius: '8px'
          }}>
            {styling.template === 'harvard' && <HarvardTemplate cvData={cvData} styling={styling} sectionOrder={sectionOrder} showSkillLevel={showSkillLevel} />}
            {styling.template === 'modern' && <ModernTemplate cvData={cvData} styling={styling} cvPhoto={cvPhoto} sectionOrder={sectionOrder} showSkillLevel={showSkillLevel} />}
            {styling.template !== 'harvard' && styling.template !== 'modern' && (
              isLoadingTheme ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Loading theme...
                </div>
              ) : (
                <HtmlThemePreview html={externalThemeHtml || getHtmlForTheme(styling.template, cvData)} />
              )
            )}
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <Dialog open={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-5 relative max-h-[85vh] overflow-y-auto">
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Choisissez un modèle
                </Dialog.Title>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Choisissez l'un de nos modèles professionnels
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Harvard Template */}
                  <button
                    onClick={() => {
                      setStyling({ ...styling, template: 'harvard' });
                      setIsTemplateModalOpen(false);
                      notify.success('Template: Harvard');
                    }}
                    className={`group relative rounded-lg overflow-hidden transition-all ${
                      styling.template === 'harvard'
                        ? 'ring-2 ring-[#EB7134] shadow-xl'
                        : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-[#EB7134] shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="bg-white overflow-hidden relative" style={{ aspectRatio: '210/297', width: '100%' }}>
                      {isLoadingTemplatePreviews || !harvardTemplatePreviewUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={harvardTemplatePreviewUrl}
                          alt="Harvard Template"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEwIiBoZWlnaHQ9IjI5NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcnZhcmQgVGVtcGxhdGU8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      )}
                    </div>
                    {styling.template === 'harvard' && (
                      <div className="absolute top-2 right-2 bg-[#EB7134] text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-10 backdrop-blur-[2px]">
                      <h3 className="text-white drop-shadow-md font-bold text-base mb-0.5">Harvard</h3>
                      <p className="text-white/95 drop-shadow-md text-sm mb-1.5">Classic single-column layout</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="inline-block px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-semibold">
                          Recommended
                        </span>
                        <div className="relative group">
                          <button
                            type="button"
                            aria-label="Why Harvard is recommended"
                            className="p-1.5 rounded-full bg-white/80 text-gray-700 hover:bg-white shadow transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-8 right-0 w-64 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 p-3 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Why Harvard?</p>
                            <p>
                              Clean single-column, highly readable, ATS-friendly structure that prints well and fits more content without clutter.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Modern Template */}
                  <button
                    onClick={() => {
                      setStyling({ ...styling, template: 'modern' });
                      setIsTemplateModalOpen(false);
                      notify.success('Template: Modern');
                    }}
                    className={`group relative rounded-lg overflow-hidden transition-all ${
                      styling.template === 'modern'
                        ? 'ring-2 ring-[#EB7134] shadow-xl'
                        : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-[#EB7134] shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="bg-white overflow-hidden relative" style={{ aspectRatio: '210/297', width: '100%' }}>
                      {isLoadingTemplatePreviews || !modernTemplatePreviewUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={modernTemplatePreviewUrl}
                          alt="Modern Template"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEwIiBoZWlnaHQ9IjI5NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1vZGVybiBUZW1wbGF0ZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                      )}
                    </div>
                    {styling.template === 'modern' && (
                      <div className="absolute top-2 right-2 bg-[#EB7134] text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-10 backdrop-blur-[2px]">
                      <h3 className="text-white drop-shadow-md font-bold text-base mb-0.5">Modern</h3>
                      <p className="text-white/95 drop-shadow-md text-sm mb-1.5">Two-column layout with sidebar</p>
                      <span className="inline-block px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-semibold">
                        Popular
                      </span>
                    </div>
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get HTML for external themes
function getHtmlForTheme(themeId: string, cvData: CVData | null): string {
  if (!cvData) return '';
  // This is a placeholder - actual implementation would call the API
  return '';
}

export default OptimizedCVEditPage;
