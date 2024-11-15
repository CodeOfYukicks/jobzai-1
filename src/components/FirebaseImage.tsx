import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

interface FirebaseImageProps {
  path: string;
  alt: string;
  className?: string;
}

export default function FirebaseImage({ path, alt, className = '' }: FirebaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        // Remove 'images/' prefix if it exists since we add it in the storage ref
        const imagePath = path.replace(/^images\//, '');
        const imageRef = ref(storage, `images/${imagePath}`);
        const url = await getDownloadURL(imageRef);
        setImageUrl(url);
      } catch (err) {
        console.error('Error loading image:', err);
        setError('Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [path]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}