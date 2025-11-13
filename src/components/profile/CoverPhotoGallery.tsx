import { useEffect, useMemo, useState } from 'react';

interface CoverPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlob: (blob: Blob) => void;
}

const THUMB_W = 640;
const THUMB_H = 160; // 4:1 for preview
const FULL_W = 1584;
const FULL_H = 396; // 4:1 for export/cropper

const CoverPhotoGallery = ({ isOpen, onClose, onSelectBlob }: CoverPhotoGalleryProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const [seeds, setSeeds] = useState<string[]>([]);

  const generateSeed = () => {
    // Use a mix of readable and random seeds to get visually diverse images
    const words = ['abstract', 'gradient', 'geometry', 'waves', 'texture', 'shape', 'pattern', 'color', 'light', 'bokeh', 'lines', 'mesh'];
    const w = words[Math.floor(Math.random() * words.length)];
    return `${w}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  };
  const generateBatch = (count = 8) => Array.from({ length: count }, () => generateSeed());

  useEffect(() => {
    if (!isOpen) return;
    // Show 8 options immediately
    setSeeds(generateBatch(8));
  }, [isOpen]);

  const handleUseUrl = async (url: string) => {
    try {
      setIsFetching(true);
      const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
      const blob = await res.blob();
      onSelectBlob(blob);
      onClose();
    } catch (e) {
      // Silent; consumer can toast
    } finally {
      setIsFetching(false);
    }
  };

  const thumbnails = useMemo(() => {
    return seeds.map((seed) => ({
      id: seed,
      thumb: `https://picsum.photos/seed/${encodeURIComponent(seed)}/${THUMB_W}/${THUMB_H}`,
      full: `https://picsum.photos/seed/${encodeURIComponent(seed)}/${FULL_W}/${FULL_H}`,
      label: 'Cover',
    }));
  }, [seeds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-5xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a cover</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pick a template from our free gallery</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {thumbnails.map((item) => (
              <button
                key={item.id}
                disabled={isFetching}
                onClick={() => handleUseUrl(item.full)}
                className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                title="Use this cover"
              >
                <img
                  src={item.thumb}
                  alt={item.label}
                  className="w-full h-28 object-cover group-hover:scale-[1.02] transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => setSeeds((prev) => [...prev, ...generateBatch(8)])}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200"
            >
              Load more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPhotoGallery;


