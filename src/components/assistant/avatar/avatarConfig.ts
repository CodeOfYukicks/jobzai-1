/**
 * Avatar Configuration System
 * 
 * This module defines the TypeScript interfaces and default values for the
 * Notion-like avatar customization system using DiceBear's "notionists-neutral" style.
 * 
 * HOW IT WORKS:
 * - The AvatarConfig object is stored in Firestore under the user document
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

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

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

// Save avatar config to Firestore
export async function saveAvatarConfig(userId: string, config: AvatarConfig): Promise<void> {
  console.log('[Avatar] Saving config for user:', userId, config);
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      assistantAvatarConfig: config,
      lastUpdated: new Date().toISOString()
    });
    // Also save to localStorage as cache
    localStorage.setItem(`avatar-config-${userId}`, JSON.stringify(config));
  } catch (error) {
    console.error('[Avatar] Error saving to Firestore:', error);
    // Fallback to localStorage only
    localStorage.setItem(`avatar-config-${userId}`, JSON.stringify(config));
  }
}

// Load avatar config from Firestore (with localStorage fallback)
export async function loadAvatarConfig(userId: string): Promise<AvatarConfig> {
  console.log('[Avatar] Loading config for user:', userId);
  try {
    // Try Firestore first
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.assistantAvatarConfig) {
        // Cache in localStorage
        localStorage.setItem(`avatar-config-${userId}`, JSON.stringify(data.assistantAvatarConfig));
        return data.assistantAvatarConfig as AvatarConfig;
      }
    }
    
    // Fallback to localStorage (for backwards compatibility)
    const stored = localStorage.getItem(`avatar-config-${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored) as AvatarConfig;
      } catch {
        return DEFAULT_AVATAR_CONFIG;
      }
    }
  } catch (error) {
    console.error('[Avatar] Error loading from Firestore:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem(`avatar-config-${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored) as AvatarConfig;
      } catch {
        return DEFAULT_AVATAR_CONFIG;
      }
    }
  }
  return DEFAULT_AVATAR_CONFIG;
}
