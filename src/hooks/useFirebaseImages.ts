import { useState, useEffect } from 'react';
import { getImageUrl, getStepImages, getFeatureIcons } from '../lib/firebase';

interface FirebaseImages {
  logo: string;
  heroPlaceholder: string;
  steps: string[];
  featureIcons: {
    dashboard: string;
    credit: string;
    tracking: string;
  };
  isLoading: boolean;
  error: Error | null;
}

export function useFirebaseImages(): FirebaseImages {
  const [images, setImages] = useState<FirebaseImages>({
    logo: '',
    heroPlaceholder: '',
    steps: [],
    featureIcons: {
      dashboard: '',
      credit: '',
      tracking: '',
    },
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Load all images in parallel
        const [
          logo,
          heroPlaceholder,
          steps,
          featureIcons,
        ] = await Promise.all([
          getImageUrl('images/logo.png'),
          getImageUrl('images/hero-placeholder.png'),
          getStepImages(),
          getFeatureIcons(),
        ]);

        setImages({
          logo,
          heroPlaceholder,
          steps,
          featureIcons: featureIcons as FirebaseImages['featureIcons'],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading images:', error);
        setImages(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    };

    loadImages();
  }, []);

  return images;
}