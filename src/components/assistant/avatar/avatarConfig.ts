/**
 * Avatar Configuration System
 * 
 * This module defines the TypeScript interfaces and default values for the
 * Notion-like avatar customization system using DiceBear's "notionists-neutral" style.
 * 
 * HOW IT WORKS:
 * - The AvatarConfig object is the ONLY thing stored in the database
 * - Avatars are generated dynamically at runtime using DiceBear
 * - No images or SVGs are stored - everything is computed from the config
 * - The seed ensures reproducible random generation for consistent avatars
 */

// Available options for each avatar feature (from DiceBear notionists-neutral)
export const AVATAR_OPTIONS = {
  eyes: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12'
  ],
  mouth: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12'
  ],
  nose: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12'
  ],
  glasses: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05'
  ],
  glassesProbability: [0, 50, 100], // 0 = never, 50 = sometimes, 100 = always
  brows: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13'
  ],
  lips: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12'
  ],
  hair: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13', 'variant14', 'variant15',
    'variant16', 'variant17', 'variant18', 'variant19', 'variant20',
    'variant21', 'variant22', 'variant23', 'variant24', 'variant25',
    'variant26', 'variant27', 'variant28', 'variant29', 'variant30',
    'variant31', 'variant32', 'variant33', 'variant34', 'variant35',
    'variant36', 'variant37', 'variant38', 'variant39', 'variant40',
    'variant41', 'variant42', 'variant43', 'variant44', 'variant45',
    'variant46', 'variant47', 'variant48', 'variant49', 'variant50',
    'variant51', 'variant52', 'variant53', 'variant54', 'variant55',
    'variant56', 'variant57', 'variant58', 'variant59', 'variant60',
    'variant61', 'variant62', 'variant63'
  ],
  beard: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05'
  ],
  beardProbability: [0, 50, 100],
} as const;

// Main avatar configuration interface - THIS is what gets stored in the database
export interface AvatarConfig {
  style: 'notionists-neutral';
  seed: string;
  eyes?: string[];
  mouth?: string[];
  nose?: string[];
  glasses?: string[];
  glassesProbability?: number;
  brows?: string[];
  lips?: string[];
  hair?: string[];
  beard?: string[];
  beardProbability?: number;
  backgroundColor?: string[];
  flip?: boolean;
}

// Default configuration for new users
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  style: 'notionists-neutral',
  seed: 'jobzai-assistant',
  glassesProbability: 30,
  beardProbability: 0,
  flip: false,
};

// Generate a random seed
export function generateRandomSeed(): string {
  return `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a completely random avatar configuration
export function generateRandomConfig(): AvatarConfig {
  const randomFromArray = <T>(arr: readonly T[]): T => 
    arr[Math.floor(Math.random() * arr.length)];
  
  return {
    style: 'notionists-neutral',
    seed: generateRandomSeed(),
    eyes: [randomFromArray(AVATAR_OPTIONS.eyes)],
    mouth: [randomFromArray(AVATAR_OPTIONS.mouth)],
    nose: [randomFromArray(AVATAR_OPTIONS.nose)],
    glasses: [randomFromArray(AVATAR_OPTIONS.glasses)],
    glassesProbability: randomFromArray(AVATAR_OPTIONS.glassesProbability),
    brows: [randomFromArray(AVATAR_OPTIONS.brows)],
    lips: [randomFromArray(AVATAR_OPTIONS.lips)],
    hair: [randomFromArray(AVATAR_OPTIONS.hair)],
    beard: [randomFromArray(AVATAR_OPTIONS.beard)],
    beardProbability: Math.random() > 0.7 ? 100 : 0, // 30% chance to have beard
    flip: Math.random() > 0.5,
  };
}

// Placeholder function for saving avatar config to database
// In production, this would save to Firestore or your preferred database
export async function saveAvatarConfig(userId: string, config: AvatarConfig): Promise<void> {
  console.log('[Avatar] Saving config for user:', userId, config);
  // In production: await db.collection('users').doc(userId).update({ avatarConfig: config });
  localStorage.setItem(`avatar-config-${userId}`, JSON.stringify(config));
}

// Placeholder function for loading avatar config from database
export async function loadAvatarConfig(userId: string): Promise<AvatarConfig> {
  console.log('[Avatar] Loading config for user:', userId);
  // In production: const doc = await db.collection('users').doc(userId).get();
  const stored = localStorage.getItem(`avatar-config-${userId}`);
  if (stored) {
    try {
      return JSON.parse(stored) as AvatarConfig;
    } catch {
      return DEFAULT_AVATAR_CONFIG;
    }
  }
  return DEFAULT_AVATAR_CONFIG;
}

