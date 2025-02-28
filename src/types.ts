export interface UserData {
  plan?: string;
  firstName?: string;
  lastName?: string;
  jobPreferences?: string;
  industry?: string;
  credits: number;
  cvUrl?: string;
  emailVerified?: boolean;
  createdAt?: any;
  lastUpdated?: any;
  isPremium?: boolean;
  email?: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  yearsOfExperience?: string | number;
  skills?: string[];
  education?: string[];
}

export interface Campaign {
  id: string;
  title: string;
  jobTitle: string;
  industry: string;
  location: string;
  status: string;
  emailsSent: number;
  responses: number;
  createdAt: any;
  description?: string;
  credits?: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  category: 'profile' | 'strategy' | 'skills' | 'timing';
  priority: 'high' | 'medium' | 'low';
  icon?: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  folder?: string;
  liked: boolean;
  aiGenerated: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EditTemplateModalProps {
  template: EmailTemplate;
  onClose: () => void;
  onUpdate: () => void;
}