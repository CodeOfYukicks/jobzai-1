import { Resume } from '../pages/ResumeBuilderPage';
import { NotionDocument, extractTextPreview } from './notionDocService';
import { WhiteboardDocument } from '../types/whiteboardDoc';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Extract text content from a Resume/CV document
 */
export function extractResumeText(resume: Resume): string {
  const { cvData } = resume;
  const parts: string[] = [];

  // Personal Info
  if (cvData.personalInfo) {
    const { firstName, lastName, email, phone, location, linkedin, portfolio, github, title } = cvData.personalInfo;
    if (firstName || lastName) parts.push(`Name: ${firstName || ''} ${lastName || ''}`.trim());
    if (title) parts.push(`Title: ${title}`);
    if (email) parts.push(`Email: ${email}`);
    if (phone) parts.push(`Phone: ${phone}`);
    if (location) parts.push(`Location: ${location}`);
    if (linkedin) parts.push(`LinkedIn: ${linkedin}`);
    if (portfolio) parts.push(`Portfolio: ${portfolio}`);
    if (github) parts.push(`GitHub: ${github}`);
  }

  // Summary
  if (cvData.summary) {
    parts.push(`\nSummary:\n${cvData.summary}`);
  }

  // Experiences
  if (cvData.experiences && cvData.experiences.length > 0) {
    parts.push('\nWork Experience:');
    cvData.experiences.forEach((exp) => {
      parts.push(`\n${exp.title} at ${exp.company}`);
      if (exp.location) parts.push(`Location: ${exp.location}`);
      if (exp.client) parts.push(`Client: ${exp.client}`);
      parts.push(`Period: ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`);
      if (exp.description) parts.push(`Description: ${exp.description}`);
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => parts.push(`  • ${bullet}`));
      }
    });
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    parts.push('\nEducation:');
    cvData.education.forEach((edu) => {
      parts.push(`\n${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
      parts.push(`Institution: ${edu.institution}`);
      if (edu.location) parts.push(`Location: ${edu.location}`);
      if (edu.startDate) parts.push(`Start: ${edu.startDate}`);
      parts.push(`End: ${edu.endDate}`);
      if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
      if (edu.honors && edu.honors.length > 0) {
        parts.push(`Honors: ${edu.honors.join(', ')}`);
      }
      if (edu.coursework && edu.coursework.length > 0) {
        parts.push(`Coursework: ${edu.coursework.join(', ')}`);
      }
    });
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    parts.push('\nSkills:');
    const skillsByCategory: Record<string, string[]> = {};
    cvData.skills.forEach((skill) => {
      const category = skill.category || 'other';
      if (!skillsByCategory[category]) skillsByCategory[category] = [];
      skillsByCategory[category].push(skill.name);
    });
    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      parts.push(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${skills.join(', ')}`);
    });
  }

  // Certifications
  if (cvData.certifications && cvData.certifications.length > 0) {
    parts.push('\nCertifications:');
    cvData.certifications.forEach((cert) => {
      parts.push(`\n${cert.name} - ${cert.issuer}`);
      parts.push(`Date: ${cert.date}`);
      if (cert.expiryDate) parts.push(`Expires: ${cert.expiryDate}`);
      if (cert.credentialId) parts.push(`Credential ID: ${cert.credentialId}`);
      if (cert.url) parts.push(`URL: ${cert.url}`);
    });
  }

  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    parts.push('\nProjects:');
    cvData.projects.forEach((project) => {
      parts.push(`\n${project.name}`);
      if (project.description) parts.push(`Description: ${project.description}`);
      if (project.technologies && project.technologies.length > 0) {
        parts.push(`Technologies: ${project.technologies.join(', ')}`);
      }
      if (project.url) parts.push(`URL: ${project.url}`);
      if (project.startDate || project.endDate) {
        parts.push(`Period: ${project.startDate || 'N/A'} - ${project.endDate || 'N/A'}`);
      }
      if (project.highlights && project.highlights.length > 0) {
        project.highlights.forEach((highlight) => parts.push(`  • ${highlight}`));
      }
    });
  }

  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    parts.push('\nLanguages:');
    cvData.languages.forEach((lang) => {
      parts.push(`${lang.name}: ${lang.proficiency}`);
    });
  }

  // Custom Sections
  if (cvData.customSections) {
    Object.entries(cvData.customSections).forEach(([key, section]) => {
      parts.push(`\n${section.title}:`);
      parts.push(section.content);
    });
  }

  return parts.join('\n').trim();
}

/**
 * Extract text content from a NotionDocument (Note)
 */
export function extractNoteText(note: NotionDocument): string {
  if (!note.content) {
    return '';
  }
  
  // Use extractTextPreview with Infinity to get all text
  return extractTextPreview(note.content, Infinity);
}

/**
 * Extract text content from a WhiteboardDocument
 */
export function extractWhiteboardText(whiteboard: WhiteboardDocument): string {
  if (!whiteboard.snapshot) {
    return '';
  }

  try {
    const snapshot = JSON.parse(whiteboard.snapshot) as any;
    const textParts: string[] = [];

    // TLStoreSnapshot structure: { store: { [id]: shape } }
    if (snapshot.store) {
      Object.values(snapshot.store).forEach((shape: any) => {
        // Check for text shapes (tldraw text elements)
        if (shape.typeName === 'shape' && shape.type === 'text') {
          if (shape.props?.text) {
            textParts.push(shape.props.text);
          }
        }
        // Check for other text-containing shapes
        if (shape.typeName === 'shape' && shape.props?.text) {
          textParts.push(shape.props.text);
        }
        // Check for arrow/connector labels
        if (shape.typeName === 'shape' && shape.props?.label) {
          textParts.push(shape.props.label);
        }
      });
    }

    return textParts.join('\n').trim() || '';
  } catch (error) {
    console.error('Error extracting text from whiteboard:', error);
    return '';
  }
}

/**
 * Extract text content from a PDF file URL
 */
export async function extractPDFText(fileUrl: string): Promise<string> {
  try {
    console.log('Starting PDF text extraction from URL:', fileUrl);
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    // Fetch the PDF file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('PDF loaded into memory, size:', arrayBuffer.byteLength);
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i}/${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    console.log('Text extraction completed successfully');
    return fullText.trim() || 'Failed to extract meaningful text from PDF';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Truncate text content to a maximum length (useful for context limits)
 */
export function truncateText(text: string, maxLength: number = 5000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '\n\n[... content truncated ...]';
}

