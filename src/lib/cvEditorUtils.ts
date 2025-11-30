import { CVData, CVTemplate, CVLayoutSettings } from '../types/cvEditor';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { prepareDOMForPDFExport, cleanupAfterPDFExport } from './pdfIconUtils';

// A4 dimensions in pixels at 96 DPI
export const A4_WIDTH_PX = 794; // 210mm
export const A4_HEIGHT_PX = 1123; // 297mm

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format date for display
export function formatDate(date: string, format: 'short' | 'long' = 'short'): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } else {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

// Format date range
export function formatDateRange(startDate: string, endDate: string, current: boolean = false): string {
  if (current) {
    return `${formatDate(startDate)} - Present`;
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Parse markdown-like text to HTML
export function parseMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Bullet points
    .replace(/^- (.+)$/gm, '• $1')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Clean text for ATS compatibility
export function cleanForATS(text: string): string {
  if (!text) return '';
  
  return text
    // Remove special characters except basic punctuation
    .replace(/[^\w\s.,;:!?()-]/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+()-]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Validate URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // Also accept URLs without protocol
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Format URL for display
export function formatURL(url: string): string {
  if (!url) return '';
  
  // Remove protocol and www
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

// Ensure URL has protocol
export function ensureProtocol(url: string): string {
  if (!url) return '';
  if (!/^https?:\/\//.test(url)) {
    return `https://${url}`;
  }
  return url;
}

// Calculate reading time
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Truncate text
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

// Sort sections by order
export function sortSections<T extends { order: number }>(sections: T[]): T[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

// Get enabled sections
export function getEnabledSections<T extends { enabled: boolean }>(sections: T[]): T[] {
  return sections.filter(s => s.enabled);
}

// Export CV to PDF using canvas method for pixel-perfect rendering
export async function exportToPDF(
  cvData: CVData, 
  template: CVTemplate, 
  layoutSettings?: CVLayoutSettings
): Promise<void> {
  const element = document.getElementById('cv-preview-content');
  if (!element) {
    throw new Error('Preview element not found');
  }

  try {
    // Use high-quality canvas method for best results
    await exportWithCanvas(cvData, template, 'high');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Export CV to PDF with canvas method - pixel perfect rendering
async function exportWithCanvas(
  cvData: CVData, 
  template: CVTemplate, 
  quality: 'high' | 'medium' | 'low' = 'high'
): Promise<void> {
  const element = document.getElementById('cv-preview-content');
  if (!element) {
    throw new Error('Preview element not found');
  }

  try {
    // Determine scale based on quality
    const canvasScale = quality === 'high' ? 2.5 : quality === 'medium' ? 2 : 1.5;
    const jpegQuality = quality === 'high' ? 0.95 : quality === 'medium' ? 0.92 : 0.88;

    // Create canvas from the preview element
    const canvas = await html2canvas(element, {
      scale: canvasScale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', jpegQuality);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Calculate image dimensions to fit A4
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
    // Add image to PDF (x, y, width, height)
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Generate filename
    const firstName = cvData.personalInfo.firstName || 'CV';
    const lastName = cvData.personalInfo.lastName || '';
    const fileName = `${firstName}_${lastName}_CV_${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '_');
    
    // Save PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF with canvas:', error);
    throw error;
  }
}

// Enhanced export - always uses canvas for best quality and reliability
export async function exportToPDFEnhanced(
  cvData: CVData, 
  template: CVTemplate,
  layoutSettings?: CVLayoutSettings,
  options?: {
    quality?: 'high' | 'medium' | 'low';
    compression?: boolean;
    method?: 'canvas';
  }
): Promise<void> {
  const quality = options?.quality || 'high';
  
  // Always use canvas method for pixel-perfect rendering
  // This ensures what you see in preview is exactly what you get in PDF
  await exportWithCanvas(cvData, template, quality);
}

// Generate PDF as Blob for upload to library (does not download)
export async function exportToPDFBlob(
  cvData: CVData, 
  template: CVTemplate,
  quality: 'high' | 'medium' | 'low' = 'high'
): Promise<{ blob: Blob; fileName: string }> {
  const element = document.getElementById('cv-preview-content');
  if (!element) {
    throw new Error('Preview element not found');
  }

  // Determine scale based on quality
  const canvasScale = quality === 'high' ? 2.5 : quality === 'medium' ? 2 : 1.5;
  const jpegQuality = quality === 'high' ? 0.95 : quality === 'medium' ? 0.92 : 0.88;

  // Create canvas from the preview element
  const canvas = await html2canvas(element, {
    scale: canvasScale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  // Convert canvas to image
  const imgData = canvas.toDataURL('image/jpeg', jpegQuality);
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 dimensions
  const pageWidth = 210;
  
  // Calculate image dimensions to fit A4
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  
  // Add image to PDF (x, y, width, height)
  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

  // Generate filename
  const firstName = cvData.personalInfo.firstName || 'CV';
  const lastName = cvData.personalInfo.lastName || '';
  const fileName = `${firstName}_${lastName}_CV_${new Date().toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '_');
  
  // Get blob from PDF
  const blob = pdf.output('blob');
  
  return { blob, fileName };
}

// Copy CV content to clipboard
export async function copyToClipboard(cvData: CVData): Promise<void> {
  const text = formatCVAsText(cvData);
  
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Format CV as plain text
function formatCVAsText(cvData: CVData): string {
  const lines: string[] = [];
  
  // Personal Info
  lines.push(`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`);
  if (cvData.personalInfo.title) lines.push(cvData.personalInfo.title);
  lines.push(cvData.personalInfo.email);
  if (cvData.personalInfo.phone) lines.push(cvData.personalInfo.phone);
  if (cvData.personalInfo.location) lines.push(cvData.personalInfo.location);
  if (cvData.personalInfo.linkedin) lines.push(cvData.personalInfo.linkedin);
  lines.push('');
  
  // Summary
  if (cvData.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(cvData.summary);
    lines.push('');
  }
  
  // Experience
  if (cvData.experiences.length > 0) {
    lines.push('WORK EXPERIENCE');
    cvData.experiences.forEach(exp => {
      lines.push(`${exp.title} at ${exp.company}`);
      lines.push(formatDateRange(exp.startDate, exp.endDate, exp.current));
      if (exp.location) lines.push(exp.location);
      if (exp.description) lines.push(exp.description);
      exp.bullets.forEach(bullet => lines.push(`• ${bullet}`));
      lines.push('');
    });
  }
  
  // Education
  if (cvData.education.length > 0) {
    lines.push('EDUCATION');
    cvData.education.forEach(edu => {
      lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
      lines.push(edu.institution);
      if (edu.endDate) lines.push(formatDate(edu.endDate));
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push('');
    });
  }
  
  // Skills
  if (cvData.skills.length > 0) {
    lines.push('SKILLS');
    lines.push(cvData.skills.map(s => s.name).join(', '));
    lines.push('');
  }
  
  // Certifications
  if (cvData.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    cvData.certifications.forEach(cert => {
      lines.push(`${cert.name} - ${cert.issuer} (${formatDate(cert.date)})`);
    });
    lines.push('');
  }
  
  // Projects
  if (cvData.projects.length > 0) {
    lines.push('PROJECTS');
    cvData.projects.forEach(project => {
      lines.push(project.name);
      lines.push(project.description);
      if (project.technologies.length > 0) {
        lines.push(`Technologies: ${project.technologies.join(', ')}`);
      }
      project.highlights.forEach(highlight => lines.push(`• ${highlight}`));
      lines.push('');
    });
  }
  
  // Languages
  if (cvData.languages.length > 0) {
    lines.push('LANGUAGES');
    cvData.languages.forEach(lang => {
      lines.push(`${lang.name} - ${lang.proficiency}`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}

// Get template metadata
export function getTemplateMetadata(template: CVTemplate): {
  name: string;
  description: string;
  features: string[];
} {
  const templates = {
    'modern-professional': {
      name: 'Modern Professional',
      description: 'Clean, minimalist design optimized for ATS systems',
      features: ['ATS-friendly', 'Single column', 'Clear hierarchy', 'Professional']
    },
    'executive-classic': {
      name: 'Executive Classic',
      description: 'Traditional two-column layout for senior positions',
      features: ['Two columns', 'Elegant serif fonts', 'Executive presence', 'Detailed sections']
    },
    'tech-minimalist': {
      name: 'Tech Minimalist',
      description: 'Google/Linear inspired design for tech professionals',
      features: ['Clean lines', 'Tech-focused', 'Skills emphasis', 'Modern typography']
    },
    'creative-balance': {
      name: 'Creative Balance',
      description: 'Modern design with personality while remaining professional',
      features: ['Visual hierarchy', 'Subtle colors', 'Creative touches', 'ATS-compliant']
    }
  };
  
  return templates[template] || templates['modern-professional'];
}
