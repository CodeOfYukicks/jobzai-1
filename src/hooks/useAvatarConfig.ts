import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG, loadAvatarConfig } from '../components/assistant/avatar/avatarConfig';

/**
 * Hook to load and provide the user's avatar configuration.
 * Used to display the AI assistant's avatar throughout the app.
 */
export function useAvatarConfig() {
  const { currentUser } = useAuth();
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadAvatarConfig(currentUser.uid)
        .then(config => {
          setAvatarConfig(config);
          setIsLoaded(true);
        })
        .catch(() => {
          setIsLoaded(true);
        });
    }
  }, [currentUser?.uid]);

  return { avatarConfig, isLoaded };
}

