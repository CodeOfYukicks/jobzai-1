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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl shadow-premium w-full max-w-6xl my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm flex items-center justify-between flex-shrink-0 sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Choose a cover</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pick a template from our free gallery</p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-200/80 dark:hover:bg-gray-600/80 text-gray-900 dark:text-gray-200 font-semibold text-sm transition-all duration-300 hover:scale-105"
          >
            Close
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {thumbnails.map((item) => (
              <button
                key={item.id}
                disabled={isFetching}
                onClick={() => handleUseUrl(item.full)}
                className="group relative rounded-xl overflow-hidden border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 shadow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Use this cover"
              >
                <img
                  src={item.thumb}
                  alt={item.label}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-sm font-semibold text-gray-900 dark:text-white shadow-lg">
                    Select
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="mt-8 flex items-center justify-center pb-4">
            <button
              onClick={() => setSeeds((prev) => [...prev, ...generateBatch(8)])}
              disabled={isFetching}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? 'Loading...' : 'Load more'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPhotoGallery;


