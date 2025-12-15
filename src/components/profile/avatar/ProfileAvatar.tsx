/**
 * Profile Avatar Component
 * 
 * A reusable React component that renders DiceBear Lorelei avatars from configuration.
 * 
 * HOW IT WORKS:
 * 1. Receives a ProfileAvatarConfig object as props
 * 2. Uses DiceBear's createAvatar() to generate an SVG at runtime
 * 3. Converts the SVG to a data URI for safe rendering
 * 4. Re-renders instantly when config changes (fully reactive)
 * 
 * NO images are stored - the avatar is computed on every render from the config.
 */

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { ProfileAvatarConfig, DEFAULT_PROFILE_AVATAR_CONFIG } from './profileAvatarConfig';

interface ProfileAvatarProps {
  config?: ProfileAvatarConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function ProfileAvatar({ 
  config = DEFAULT_PROFILE_AVATAR_CONFIG, 
  size = 120,
  className = '',
  onClick
}: ProfileAvatarProps) {
  
  const avatarSvg = useMemo(() => {
    try {
      const avatar = createAvatar(lorelei, {
        seed: config.seed,
        size: size,
        // Apply optional customizations if provided
        ...(config.hair && { hair: config.hair as any }),
        ...(config.eyes && { eyes: config.eyes as any }),
        ...(config.mouth && { mouth: config.mouth as any }),
        ...(config.eyebrows && { eyebrows: config.eyebrows as any }),
        ...(config.nose && { nose: config.nose as any }),
        ...(config.glasses && { glasses: config.glasses as any }),
        ...(config.glassesProbability !== undefined && { glassesProbability: config.glassesProbability }),
        ...(config.head && { head: config.head as any }),
        ...(config.beard && { beard: config.beard as any }),
        ...(config.beardProbability !== undefined && { beardProbability: config.beardProbability }),
        ...(config.earrings && { earrings: config.earrings as any }),
        ...(config.earringsProbability !== undefined && { earringsProbability: config.earringsProbability }),
        ...(config.frecklesProbability !== undefined && { frecklesProbability: config.frecklesProbability }),
        // Colors
        ...(config.hairColor && { hairColor: config.hairColor as any }),
        ...(config.eyesColor && { eyesColor: config.eyesColor as any }),
        ...(config.eyebrowsColor && { eyebrowsColor: config.eyebrowsColor as any }),
        ...(config.mouthColor && { mouthColor: config.mouthColor as any }),
        ...(config.skinColor && { skinColor: config.skinColor as any }),
        ...(config.backgroundColor && { backgroundColor: config.backgroundColor as any }),
      });
      
      return avatar.toDataUri();
    } catch (error) {
      console.error('[ProfileAvatar] Error generating avatar:', error);
      // Fallback to default avatar on error
      const fallback = createAvatar(lorelei, {
        seed: 'fallback',
        size: size,
      });
      return fallback.toDataUri();
    }
  }, [config, size]);

  return (
    <div
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <img
        src={avatarSvg}
        alt="Profile Avatar"
        className="w-full h-full object-cover"
        style={{ 
          borderRadius: 'inherit',
        }}
      />
    </div>
  );
}

