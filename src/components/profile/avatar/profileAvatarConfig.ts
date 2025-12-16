/**
 * Profile Avatar Configuration System
 * 
 * This module defines the TypeScript interfaces and default values for the
 * profile avatar customization system using DiceBear's "lorelei" style.
 * 
 * HOW IT WORKS:
 * - The ProfileAvatarConfig object is stored in Firestore under the user document
 * - Avatars are generated dynamically at runtime using DiceBear
 * - No images or SVGs are stored - everything is computed from the config
 * - The seed ensures reproducible random generation for consistent avatars
 * 
 * AVAILABLE OPTIONS for lorelei:
 * - hair: 48 variants
 * - eyes: 24 variants
 * - mouth: 27 variants (happy/sad expressions)
 * - eyebrows: 13 variants
 * - nose: 6 variants
 * - glasses: 5 variants + probability
 * - beard: 2 variants + probability
 * - earrings: 3 variants + probability
 * - freckles: 1 variant + probability
 */

// Available options for each avatar feature (from DiceBear lorelei schema)
export const LORELEI_OPTIONS = {
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
    'variant46', 'variant47', 'variant48'
  ],
  eyes: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13', 'variant14', 'variant15',
    'variant16', 'variant17', 'variant18', 'variant19', 'variant20',
    'variant21', 'variant22', 'variant23', 'variant24'
  ],
  mouth: [
    'happy01', 'happy02', 'happy03', 'happy04', 'happy05',
    'happy06', 'happy07', 'happy08', 'happy09', 'happy10',
    'happy11', 'happy12', 'happy13', 'happy14', 'happy15',
    'happy16', 'happy17', 'happy18',
    'sad01', 'sad02', 'sad03', 'sad04', 'sad05',
    'sad06', 'sad07', 'sad08', 'sad09'
  ],
  eyebrows: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05',
    'variant06', 'variant07', 'variant08', 'variant09', 'variant10',
    'variant11', 'variant12', 'variant13'
  ],
  nose: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06'
  ],
  glasses: [
    'variant01', 'variant02', 'variant03', 'variant04', 'variant05'
  ],
  head: [
    'variant01', 'variant02', 'variant03', 'variant04'
  ],
  beard: [
    'variant01', 'variant02'
  ],
  earrings: [
    'variant01', 'variant02', 'variant03'
  ],
} as const;

// Background color palette (hex without #)
export const BACKGROUND_COLORS = [
  { id: 'white', hex: 'ffffff', label: 'White' },
  { id: 'lightgray', hex: 'f3f4f6', label: 'Light Gray' },
  { id: 'warmgray', hex: 'e5e3df', label: 'Warm Gray' },
  { id: 'beige', hex: 'f5f0e6', label: 'Beige' },
  { id: 'cream', hex: 'faf8f5', label: 'Cream' },
  { id: 'blush', hex: 'fce8e8', label: 'Blush' },
  { id: 'rose', hex: 'fde2e4', label: 'Rose' },
  { id: 'lavender', hex: 'e8e0f0', label: 'Lavender' },
  { id: 'lilac', hex: 'f0e6fa', label: 'Lilac' },
  { id: 'skyblue', hex: 'e0f2fe', label: 'Sky Blue' },
  { id: 'mint', hex: 'dcfce7', label: 'Mint' },
  { id: 'sage', hex: 'e6f0e6', label: 'Sage' },
  { id: 'peach', hex: 'fef3e2', label: 'Peach' },
  { id: 'lemon', hex: 'fef9c3', label: 'Lemon' },
  { id: 'charcoal', hex: '374151', label: 'Charcoal' },
  { id: 'navy', hex: '1e3a5f', label: 'Navy' },
] as const;

// Main avatar configuration interface - THIS is what gets stored in the database
export interface ProfileAvatarConfig {
  style: 'lorelei';
  seed: string;
  hair?: string[];
  eyes?: string[];
  mouth?: string[];
  eyebrows?: string[];
  nose?: string[];
  glasses?: string[];
  glassesProbability?: number;
  head?: string[];
  beard?: string[];
  beardProbability?: number;
  earrings?: string[];
  earringsProbability?: number;
  frecklesProbability?: number;
  // Colors (hex without #)
  hairColor?: string[];
  eyesColor?: string[];
  eyebrowsColor?: string[];
  mouthColor?: string[];
  skinColor?: string[];
  backgroundColor?: string[];
}

// Default configuration for new users
export const DEFAULT_PROFILE_AVATAR_CONFIG: ProfileAvatarConfig = {
  style: 'lorelei',
  seed: 'profile-default',
  glassesProbability: 0,
  beardProbability: 0,
  earringsProbability: 0,
  frecklesProbability: 0,
};

// Generate a random seed
export function generateRandomSeed(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a completely random avatar configuration
export function generateRandomConfig(): ProfileAvatarConfig {
  const randomFromArray = <T>(arr: readonly T[]): T => 
    arr[Math.floor(Math.random() * arr.length)];
  
  // Filter to only happy mouths for a friendly appearance
  const happyMouths = LORELEI_OPTIONS.mouth.filter(m => m.startsWith('happy'));
  
  return {
    style: 'lorelei',
    seed: generateRandomSeed(),
    hair: [randomFromArray(LORELEI_OPTIONS.hair)],
    eyes: [randomFromArray(LORELEI_OPTIONS.eyes)],
    mouth: [randomFromArray(happyMouths)],
    eyebrows: [randomFromArray(LORELEI_OPTIONS.eyebrows)],
    nose: [randomFromArray(LORELEI_OPTIONS.nose)],
    head: [randomFromArray(LORELEI_OPTIONS.head)],
    glasses: [randomFromArray(LORELEI_OPTIONS.glasses)],
    glassesProbability: Math.random() > 0.7 ? 100 : 0, // 30% chance
    beardProbability: 0,
    earringsProbability: Math.random() > 0.85 ? 100 : 0, // 15% chance
    frecklesProbability: Math.random() > 0.9 ? 100 : 0, // 10% chance
  };
}

// Avatar type - stored in Firestore to determine display mode
export type ProfileAvatarType = 'photo' | 'avatar';

// Preset avatar configurations for quick selection
export const AVATAR_PRESETS = {
  feminine: {
    style: 'lorelei' as const,
    seed: 'preset-feminine',
    hair: ['variant21'], // Long flowing hair
    eyes: ['variant12'],
    mouth: ['happy06'],
    eyebrows: ['variant05'],
    nose: ['variant02'],
    glasses: ['variant01'],
    glassesProbability: 0,
    beardProbability: 0,
    earringsProbability: 100,
    earrings: ['variant01'],
    frecklesProbability: 0,
  } as ProfileAvatarConfig,
  masculine: {
    style: 'lorelei' as const,
    seed: 'preset-masculine',
    hair: ['variant04'], // Short hair
    eyes: ['variant03'],
    mouth: ['happy02'],
    eyebrows: ['variant08'],
    nose: ['variant04'],
    glasses: ['variant01'],
    glassesProbability: 0,
    beardProbability: 0,
    earringsProbability: 0,
    frecklesProbability: 0,
  } as ProfileAvatarConfig,
};

// ============================================================================
// GENDERED AVATAR GENERATION FOR CAMPAIGN CONTACTS
// ============================================================================

// Common feminine first names (French, English, Spanish, Italian, German, etc.)
const FEMININE_NAMES = new Set([
  // French
  'marie', 'sophie', 'julie', 'emma', 'léa', 'sarah', 'anna', 'laura', 'claire',
  'camille', 'alice', 'charlotte', 'chloé', 'manon', 'lucie', 'pauline', 'marine',
  'mathilde', 'margot', 'céline', 'nathalie', 'valérie', 'isabelle', 'florence',
  'catherine', 'françoise', 'christine', 'anne', 'brigitte', 'sylvie', 'patricia',
  'sandrine', 'véronique', 'audrey', 'aurélie', 'emilie', 'caroline', 'elodie',
  'laetitia', 'virginie', 'stéphanie', 'delphine', 'mélanie', 'laurence', 'morgane',
  'amandine', 'justine', 'clemence', 'helene', 'amelie', 'juliette', 'lea', 'chloe',
  // English
  'emily', 'jessica', 'jennifer', 'amanda', 'michelle', 'stephanie', 'elizabeth',
  'lisa', 'ashley', 'nicole', 'samantha', 'katherine', 'rebecca', 'rachel', 'megan',
  'hannah', 'olivia', 'abigail', 'madison', 'victoria', 'grace', 'natalie', 'julia',
  'lauren', 'amber', 'brittany', 'danielle', 'christina', 'kimberly', 'melissa',
  'heather', 'mary', 'patricia', 'linda', 'barbara', 'susan', 'margaret', 'dorothy',
  'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon',
  'diana', 'cynthia', 'angela', 'cheryl', 'deborah', 'kate', 'catherine', 'kelly',
  // Spanish/Italian
  'maria', 'ana', 'carmen', 'rosa', 'elena', 'lucia', 'paula', 'sara', 'marta',
  'cristina', 'andrea', 'alba', 'silvia', 'beatriz', 'rocio', 'pilar', 'teresa',
  'isabel', 'patricia', 'nuria', 'monica', 'susana', 'raquel', 'sonia', 'alicia',
  'giulia', 'francesca', 'chiara', 'valentina', 'alessia', 'federica', 'elisa',
  'claudia', 'simona', 'paola', 'daniela', 'roberta', 'alessandra', 'veronica',
  // German
  'anna', 'julia', 'laura', 'lisa', 'sarah', 'lena', 'marie', 'sophie', 'lea',
  'katharina', 'nina', 'jana', 'melanie', 'stefanie', 'sabine', 'andrea', 'monika',
  'petra', 'ursula', 'renate', 'brigitte', 'helga', 'ingrid', 'gisela', 'heike',
  // International
  'eva', 'katarina', 'natasha', 'olga', 'tatiana', 'irina', 'svetlana', 'marina',
  'yuki', 'sakura', 'mei', 'lin', 'fatima', 'aisha', 'layla', 'yasmin', 'priya',
  'ananya', 'deepika', 'pooja', 'neha', 'shruti', 'kavita', 'sunita', 'anjali',
]);

// Hair variants that look more feminine (longer styles)
const FEMININE_HAIR_VARIANTS = [
  'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22',
  'variant23', 'variant24', 'variant25', 'variant26', 'variant27', 'variant28',
  'variant29', 'variant30', 'variant31', 'variant32', 'variant33', 'variant34',
  'variant35', 'variant36', 'variant37', 'variant38', 'variant39', 'variant40',
  'variant41', 'variant42', 'variant43', 'variant44', 'variant45', 'variant46',
  'variant47', 'variant48'
];

// Hair variants that look more masculine (shorter styles)
const MASCULINE_HAIR_VARIANTS = [
  'variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06',
  'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12',
  'variant13', 'variant14', 'variant15', 'variant16'
];

/**
 * Simple seeded random number generator for deterministic avatar generation.
 * Uses a hash of the seed string to produce consistent random values.
 */
function seededRandom(seed: string): () => number {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Linear congruential generator
  let state = Math.abs(hash) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Infer gender from first name using known feminine names and heuristics.
 * Returns 'female' or 'male'.
 */
export function inferGenderFromName(firstName: string): 'female' | 'male' {
  if (!firstName) return 'male';
  
  const normalizedName = firstName.toLowerCase().trim();
  
  // Check against known feminine names
  if (FEMININE_NAMES.has(normalizedName)) {
    return 'female';
  }
  
  // Heuristics based on name endings (common in Romance languages)
  const feminineEndings = ['a', 'ie', 'ine', 'elle', 'ette', 'yne', 'ina', 'ina', 'ia'];
  for (const ending of feminineEndings) {
    if (normalizedName.endsWith(ending) && normalizedName.length > ending.length + 1) {
      return 'female';
    }
  }
  
  // Default to male
  return 'male';
}

/**
 * Generate a consistent seed from a person's full name.
 * This ensures the same person always gets the same avatar across the site,
 * regardless of whether they're a campaign recipient or a job application contact.
 * 
 * @param fullName - The person's full name (e.g., "John Doe")
 * @returns A consistent seed string
 */
export function generateNameBasedSeed(fullName: string): string {
  // Normalize the name: lowercase, remove extra spaces, trim
  const normalized = fullName.toLowerCase().trim().replace(/\s+/g, '-');
  return `person-${normalized}`;
}

/**
 * Generate a deterministic, gender-appropriate avatar configuration.
 * Uses either an ID or name-based seed for consistent avatar generation.
 * 
 * For consistency across the site (campaigns → job applications), 
 * prefer using generateGenderedAvatarConfigByName() with the full name.
 * 
 * @param firstName - The recipient's first name (used to infer gender)
 * @param seedOrId - A unique identifier or seed for the recipient
 * @returns A ProfileAvatarConfig object for rendering with ProfileAvatar component
 */
export function generateGenderedAvatarConfig(
  firstName: string,
  seedOrId: string
): ProfileAvatarConfig {
  const gender = inferGenderFromName(firstName);
  const random = seededRandom(seedOrId);
  
  // Helper to pick random item from array using seeded random
  const pickRandom = <T>(arr: readonly T[] | T[]): T => 
    arr[Math.floor(random() * arr.length)];
  
  // Only happy mouths for a friendly appearance
  const happyMouths = LORELEI_OPTIONS.mouth.filter(m => m.startsWith('happy'));
  
  // Select hair based on gender
  const hairVariants = gender === 'female' ? FEMININE_HAIR_VARIANTS : MASCULINE_HAIR_VARIANTS;
  
  // Background colors - use softer colors
  const softBackgrounds = ['f3f4f6', 'e5e3df', 'f5f0e6', 'faf8f5', 'e0f2fe', 'dcfce7', 'fef3e2'];
  
  const config: ProfileAvatarConfig = {
    style: 'lorelei',
    seed: `gendered-${seedOrId}`,
    hair: [pickRandom(hairVariants)],
    eyes: [pickRandom(LORELEI_OPTIONS.eyes)],
    mouth: [pickRandom(happyMouths)],
    eyebrows: [pickRandom(LORELEI_OPTIONS.eyebrows)],
    nose: [pickRandom(LORELEI_OPTIONS.nose)],
    head: [pickRandom(LORELEI_OPTIONS.head)],
    glasses: [pickRandom(LORELEI_OPTIONS.glasses)],
    glassesProbability: random() > 0.75 ? 100 : 0, // 25% chance of glasses
    backgroundColor: [pickRandom(softBackgrounds)],
    frecklesProbability: random() > 0.9 ? 100 : 0, // 10% chance
  };
  
  // Gender-specific traits
  if (gender === 'female') {
    config.earrings = [pickRandom(LORELEI_OPTIONS.earrings)];
    config.earringsProbability = random() > 0.5 ? 100 : 0; // 50% chance for women
    config.beardProbability = 0;
  } else {
    config.earringsProbability = 0;
    config.beard = [pickRandom(LORELEI_OPTIONS.beard)];
    config.beardProbability = random() > 0.7 ? 100 : 0; // 30% chance for men
  }
  
  return config;
}

/**
 * Generate a deterministic, gender-appropriate avatar configuration using full name.
 * This ensures the same person always gets the same avatar across the entire site,
 * whether they're a campaign recipient, job application contact, or calendar event.
 * 
 * @param fullName - The person's full name (e.g., "John Doe" or "Marie Dupont")
 * @returns A ProfileAvatarConfig object for rendering with ProfileAvatar component
 */
export function generateGenderedAvatarConfigByName(fullName: string): ProfileAvatarConfig {
  const firstName = fullName.split(' ')[0] || fullName;
  const seed = generateNameBasedSeed(fullName);
  return generateGenderedAvatarConfig(firstName, seed);
}

