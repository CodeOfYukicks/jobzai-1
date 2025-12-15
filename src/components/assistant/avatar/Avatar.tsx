/**
 * Avatar Component
 * 
 * A reusable React component that renders DiceBear avatars from configuration.
 * 
 * HOW IT WORKS:
 * 1. Receives an AvatarConfig object as props
 * 2. Uses DiceBear's createAvatar() to generate an SVG at runtime
 * 3. Converts the SVG to a data URI for safe rendering
 * 4. Re-renders instantly when config changes (fully reactive)
 * 
 * NO images are stored - the avatar is computed on every render from the config.
 * 
 * AVAILABLE OPTIONS for notionists-neutral:
 * - eyes, brows, glasses, glassesProbability, lips, nose, backgroundColor, flip
 */

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { notionistsNeutral } from '@dicebear/collection';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from './avatarConfig';

interface AvatarProps {
  config?: AvatarConfig;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function Avatar({ 
  config = DEFAULT_AVATAR_CONFIG, 
  size = 56,
  className = '',
  onClick
}: AvatarProps) {
  // Generate the SVG avatar from config - memoized for performance
  const avatarSvg = useMemo(() => {
    try {
      const avatar = createAvatar(notionistsNeutral, {
        seed: config.seed,
        size: size,
        // Apply optional customizations if provided
        // Note: notionists-neutral only supports: eyes, brows, glasses, lips, nose
        ...(config.eyes && { eyes: config.eyes as any }),
        ...(config.brows && { brows: config.brows as any }),
        ...(config.glasses && { glasses: config.glasses as any }),
        ...(config.glassesProbability !== undefined && { glassesProbability: config.glassesProbability }),
        ...(config.lips && { lips: config.lips as any }),
        ...(config.nose && { nose: config.nose as any }),
        ...(config.backgroundColor && { backgroundColor: config.backgroundColor as any }),
        ...(config.flip !== undefined && { flip: config.flip }),
      });
      
      return avatar.toDataUri();
    } catch (error) {
      console.error('[Avatar] Error generating avatar:', error);
      // Fallback to default avatar on error
      const fallback = createAvatar(notionistsNeutral, {
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
        alt="AI Assistant Avatar"
        className="w-full h-full object-cover"
        style={{ 
          borderRadius: 'inherit',
        }}
      />
    </div>
  );
}
