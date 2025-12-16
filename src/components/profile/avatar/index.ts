// Profile Avatar Components
export { default as ProfileAvatar } from './ProfileAvatar';
export { default as ProfileAvatarEditor } from './ProfileAvatarEditor';
export { default as ProfileAvatarSelector } from './ProfileAvatarSelector';

// Configuration & Types
export type { ProfileAvatarConfig, ProfileAvatarType } from './profileAvatarConfig';
export {
  LORELEI_OPTIONS,
  DEFAULT_PROFILE_AVATAR_CONFIG,
  BACKGROUND_COLORS,
  AVATAR_PRESETS,
  generateRandomConfig,
  generateRandomSeed,
  generateGenderedAvatarConfig,
  generateGenderedAvatarConfigByName,
  generateNameBasedSeed,
  inferGenderFromName,
} from './profileAvatarConfig';

