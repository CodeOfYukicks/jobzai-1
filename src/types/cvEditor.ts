// CV Editor Types and Interfaces

export interface CVPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
  title?: string; // Professional title/headline
}

export interface CVExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  bullets: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  field?: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate: string;
  gpa?: string;
  honors?: string[];
  coursework?: string[];
}

export interface CVSkill {
  id: string;
  name: string;
  category?: 'technical' | 'soft' | 'language' | 'tool';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface CVProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  highlights: string[];
}

export interface CVLanguage {
  id: string;
  name: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'fluent' | 'native';
}

export interface CVSection {
  id: string;
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'languages' | 'custom';
  title: string;
  enabled: boolean;
  order: number;
  content?: any; // Section-specific content
}

export interface CVData {
  personalInfo: CVPersonalInfo;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  certifications: CVCertification[];
  projects: CVProject[];
  languages: CVLanguage[];
  sections: CVSection[];
  customSections?: {
    [key: string]: {
      title: string;
      content: string;
    };
  };
}

export type CVTemplate = 'modern-professional' | 'executive-classic' | 'tech-minimalist' | 'creative-balance';

export interface CVEditorState {
  data: CVData;
  template: CVTemplate;
  zoom: number;
  isDirty: boolean;
  lastSaved?: Date;
  activeSection?: string;
}

export interface CVEditorConfig {
  enableAI: boolean;
  enableDragDrop: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number; // in seconds
  maxExperiences: number;
  maxEducation: number;
  maxSkills: number;
  maxProjects: number;
}

export interface AIAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  action: 'improve' | 'rewrite' | 'suggest' | 'metrics' | 'keywords' | 'shorten';
}

export interface CVDiff {
  section: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: Date;
}

export interface CVValidation {
  isValid: boolean;
  errors: {
    section: string;
    field: string;
    message: string;
  }[];
  warnings: {
    section: string;
    message: string;
  }[];
}

export interface CVLayoutSettings {
  fontSize: number;          // 8-14 pt
  dateFormat: string;         // 'jan-24', 'january-2024', '01-2024', '2024-01'
  lineHeight: number;         // 1.0, 1.3, 1.5, 2.0
  fontFamily: string;         // 'Inter', 'Playfair Display', 'Montserrat', etc.
}
