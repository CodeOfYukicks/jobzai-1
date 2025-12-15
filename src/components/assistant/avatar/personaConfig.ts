/**
 * Persona Configuration System
 * 
 * This module defines the TypeScript interfaces and default values for the
 * AI assistant personality customization system (similar to Notion's Sidekick).
 * 
 * HOW IT WORKS:
 * - The PersonaConfig object is stored alongside AvatarConfig
 * - It defines the AI's name, instructions, tone, and language
 * - Presets provide quick personality templates for common use cases
 * - The config is injected into the system prompt when chatting with the AI
 */

// Tone options for the AI assistant
export type ToneType = 'formal' | 'friendly' | 'professional' | 'casual';

// Language options
export type LanguageType = 'fr' | 'en' | 'auto';

// Main persona configuration interface
export interface PersonaConfig {
  name: string;              // Custom name like "Sidekick", "JobBot", etc.
  instructions: string;      // Free-form custom instructions
  tone: ToneType;            // Communication style
  language: LanguageType;    // Response language preference
}

// Default configuration for new users
export const DEFAULT_PERSONA_CONFIG: PersonaConfig = {
  name: 'Assistant',
  instructions: '',
  tone: 'professional',
  language: 'auto',
};

// Tone configuration with labels and descriptions (no emojis for minimalist design)
export const TONE_OPTIONS: { value: ToneType; label: string; labelFr: string; description: string }[] = [
  { 
    value: 'formal', 
    label: 'Formal', 
    labelFr: 'Formel',
    description: 'Polished and structured' 
  },
  { 
    value: 'friendly', 
    label: 'Friendly', 
    labelFr: 'Amical',
    description: 'Warm and approachable' 
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    labelFr: 'Professionnel',
    description: 'Balanced and business-like' 
  },
  { 
    value: 'casual', 
    label: 'Casual', 
    labelFr: 'Décontracté',
    description: 'Relaxed and conversational' 
  },
];

// Language options (no emojis for minimalist design)
export const LANGUAGE_OPTIONS: { value: LanguageType; label: string; shortLabel: string }[] = [
  { value: 'auto', label: 'Auto-detect', shortLabel: 'Auto' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'fr', label: 'Français', shortLabel: 'FR' },
];

// Preset personas for quick selection (minimalist - no emojis)
export interface PersonaPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<PersonaConfig>;
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'career-coach',
    name: 'Career Coach',
    description: 'Motivational career guidance',
    config: {
      name: 'Coach',
      instructions: 'Act as an experienced career coach. Be encouraging and help identify strengths. Provide actionable advice for career growth and job searching. Focus on building confidence.',
      tone: 'friendly',
    },
  },
  {
    id: 'cv-expert',
    name: 'CV Expert',
    description: 'Professional resume writing',
    config: {
      name: 'Resume Pro',
      instructions: 'You are an expert CV/resume writer. Focus on impactful bullet points, quantifiable achievements, and ATS optimization. Be direct and specific about improvements.',
      tone: 'professional',
    },
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    description: 'Mock interviews & feedback',
    config: {
      name: 'Interview Coach',
      instructions: 'Prepare candidates for job interviews. Ask common interview questions, provide feedback on responses, and share tips for handling difficult questions. Be constructive but honest.',
      tone: 'formal',
    },
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'LinkedIn & outreach tips',
    config: {
      name: 'Network Pro',
      instructions: 'Help craft professional networking messages, LinkedIn content, and cold outreach emails. Focus on building genuine connections while being concise and impactful.',
      tone: 'friendly',
    },
  },
  {
    id: 'job-search',
    name: 'Strategist',
    description: 'Strategic job hunting',
    config: {
      name: 'Strategist',
      instructions: 'Provide strategic advice for job searching. Help identify target companies, optimize application timing, and create a structured job search plan. Be analytical and methodical.',
      tone: 'professional',
    },
  },
];

// Generate system prompt addition from persona config
export function generatePersonaPrompt(config: PersonaConfig): string {
  const parts: string[] = [];

  // Add name context
  if (config.name && config.name !== 'Assistant') {
    parts.push(`Your name is "${config.name}".`);
  }

  // Add tone instructions
  const toneInstructions: Record<ToneType, string> = {
    formal: 'Use formal language with proper grammar and structure. Be polished and respectful.',
    friendly: 'Be warm, approachable, and encouraging. Use a conversational style.',
    professional: 'Maintain a professional tone that is business-like but not overly formal.',
    casual: 'Be relaxed and conversational. Use a natural, easy-going style.',
  };
  parts.push(toneInstructions[config.tone]);

  // Add language preference
  if (config.language !== 'auto') {
    const langInstructions: Record<string, string> = {
      en: 'Always respond in English.',
      fr: 'Réponds toujours en français.',
    };
    parts.push(langInstructions[config.language]);
  }

  // Add custom instructions
  if (config.instructions.trim()) {
    parts.push(`Additional instructions: ${config.instructions.trim()}`);
  }

  return parts.join(' ');
}

// Save persona config to localStorage (placeholder for database)
export async function savePersonaConfig(userId: string, config: PersonaConfig): Promise<void> {
  console.log('[Persona] Saving config for user:', userId, config);
  // In production: await db.collection('users').doc(userId).update({ personaConfig: config });
  localStorage.setItem(`persona-config-${userId}`, JSON.stringify(config));
}

// Load persona config from localStorage (placeholder for database)
export async function loadPersonaConfig(userId: string): Promise<PersonaConfig> {
  console.log('[Persona] Loading config for user:', userId);
  // In production: const doc = await db.collection('users').doc(userId).get();
  const stored = localStorage.getItem(`persona-config-${userId}`);
  if (stored) {
    try {
      return { ...DEFAULT_PERSONA_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PERSONA_CONFIG;
    }
  }
  return DEFAULT_PERSONA_CONFIG;
}

