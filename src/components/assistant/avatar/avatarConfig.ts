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
 * 
 * AVAILABLE OPTIONS for notionists-neutral:
 * - eyes: 5 variants
 * - brows: 13 variants
 * - glasses: 11 variants + probability
 * - lips: 30 variants (this is the mouth)
 * - nose: 20 variants
 */

// Available options for each avatar feature (from DiceBear notionists-neutral schema)
export const AVATAR_OPTIONS = {
  eyes: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05'
  ],
  brows: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13'
  ],
  glasses: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11'
  ],
  lips: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13', 'variant14', 'variant15',
    'variant16', 'variant17', 'variant18', 'variant19', 'variant20',
    'variant21', 'variant22', 'variant23', 'variant24', 'variant25',
    'variant26', 'variant27', 'variant28', 'variant29', 'variant30'
  ],
  nose: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13', 'variant14', 'variant15',
    'variant16', 'variant17', 'variant18', 'variant19', 'variant20'
  ],
  glassesProbability: [0, 100], // 0 = never, 100 = always
} as const;

// Main avatar configuration interface - THIS is what gets stored in the database
export interface AvatarConfig {
  style: 'notionists-neutral';
  seed: string;
  eyes?: string[];
  brows?: string[];
  glasses?: string[];
  glassesProbability?: number;
  lips?: string[];
  nose?: string[];
  backgroundColor?: string[];
  flip?: boolean;
}

// Default configuration for new users
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  style: 'notionists-neutral',
  seed: 'jobzai-assistant',
  glassesProbability: 0,
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
    brows: [randomFromArray(AVATAR_OPTIONS.brows)],
    glasses: [randomFromArray(AVATAR_OPTIONS.glasses)],
    glassesProbability: Math.random() > 0.7 ? 100 : 0, // 30% chance to have glasses
    lips: [randomFromArray(AVATAR_OPTIONS.lips)],
    nose: [randomFromArray(AVATAR_OPTIONS.nose)],
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
