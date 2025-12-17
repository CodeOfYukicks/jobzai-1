import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Upload, 
  Link2, 
  X, 
  Loader2, 
  Check,
  AlertCircle,
  Trash2,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  searchUnsplashPhotos, 
  getRandomUnsplashPhotos, 
  fetchImageAsBlob as fetchUnsplashImageAsBlob,
  type UnsplashPhoto,
  UnsplashRateLimitError
} from '../../lib/unsplash';
import {
  getFallbackPhotos,
  searchFallbackPhotos,
  fallbackToUnsplash,
  type FallbackPhoto
} from '../../lib/fallback-images';

interface CoverPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlob?: (blob: Blob) => void;
  onDirectApply?: (blob: Blob) => Promise<void>;
  onRemove?: () => void;
  currentCover?: string;
  triggerRef?: React.RefObject<HTMLElement>;
}

type TabType = 'gallery' | 'unsplash' | 'upload' | 'link';

const THUMB_W = 640;
const THUMB_H = 160; // 4:1 for preview
const FULL_W = 1584;
const FULL_H = 396; // 4:1 for export/cropper

// ============================================================================
// COLORS & GRADIENTS
// ============================================================================

interface ColorOption {
  id: string;
  type: 'solid' | 'gradient';
  value: string; // CSS value
  label: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  // Solid colors (matching Notion screenshot)
  { id: 'coral', type: 'solid', value: '#E57373', label: 'Coral' },
  { id: 'amber', type: 'solid', value: '#F5C563', label: 'Amber' },
  { id: 'sky', type: 'solid', value: '#4FC3F7', label: 'Sky Blue' },
  { id: 'cream', type: 'solid', value: '#FFF8E7', label: 'Cream' },
  // Gradients
  { id: 'teal-blue', type: 'gradient', value: 'linear-gradient(135deg, #2DD4BF 0%, #3B82F6 100%)', label: 'Teal Blue' },
  { id: 'magenta', type: 'gradient', value: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', label: 'Magenta' },
  { id: 'sunset', type: 'gradient', value: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', label: 'Sunset' },
  { id: 'peach', type: 'gradient', value: 'linear-gradient(135deg, #FED7AA 0%, #FECACA 100%)', label: 'Peach' },
  // Second row of gradients
  { id: 'nebula', type: 'gradient', value: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)', label: 'Nebula' },
  { id: 'aurora', type: 'gradient', value: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)', label: 'Aurora' },
  { id: 'dawn', type: 'gradient', value: 'linear-gradient(135deg, #FDE68A 0%, #FCA5A5 50%, #C4B5FD 100%)', label: 'Dawn' },
];

// ============================================================================
// IMAGE COLLECTIONS (Using Unsplash categories)
// ============================================================================

interface ImageCollection {
  id: string;
  label: string;
  query: string; // Unsplash search query
}

const IMAGE_COLLECTIONS: ImageCollection[] = [
  {
    id: 'abstract',
    label: 'Abstract',
    query: 'abstract geometric',
  },
  {
    id: 'nature',
    label: 'Nature',
    query: 'nature landscape',
  },
  {
    id: 'architecture',
    label: 'Architecture',
    query: 'architecture building',
  },
];

// ============================================================================
// TAB COMPONENTS
// ============================================================================

interface GalleryTabProps {
  onSelectColor: (color: ColorOption) => void;
  onSelectImage: (url: string) => void;
  isFetching: boolean;
}

const GalleryTab = ({ onSelectColor, onSelectImage, isFetching }: GalleryTabProps) => {
  const [collections, setCollections] = useState<Record<string, UnsplashPhoto[]>>({});
  const [loadingCollections, setLoadingCollections] = useState<Record<string, boolean>>({});
  const [usingFallback, setUsingFallback] = useState<Record<string, boolean>>({});

  // Load Unsplash photos for each collection, with fallback support
  useEffect(() => {
    const loadCollections = async () => {
      for (const collection of IMAGE_COLLECTIONS) {
        if (!collections[collection.id] && !loadingCollections[collection.id]) {
          setLoadingCollections(prev => ({ ...prev, [collection.id]: true }));
          try {
            // Try Unsplash first
            const photos = await getRandomUnsplashPhotos(4, collection.query);
            setCollections(prev => ({ ...prev, [collection.id]: photos }));
            setUsingFallback(prev => ({ ...prev, [collection.id]: false }));
          } catch (error) {
            // If rate limit error, use fallback
            if (error instanceof UnsplashRateLimitError) {
              console.log(`Unsplash rate limit exceeded, using fallback for ${collection.label}`);
              try {
                const fallbackPhotos = getFallbackPhotos(4, collection.query);
                const unsplashCompatible = fallbackPhotos.map(fallbackToUnsplash);
                setCollections(prev => ({ ...prev, [collection.id]: unsplashCompatible }));
                setUsingFallback(prev => ({ ...prev, [collection.id]: true }));
              } catch (fallbackError) {
                console.error(`Error loading fallback photos for ${collection.label}:`, fallbackError);
              }
            } else {
              console.error(`Error loading ${collection.label} photos:`, error);
            }
          } finally {
            setLoadingCollections(prev => ({ ...prev, [collection.id]: false }));
          }
        }
      }
    };
    loadCollections();
  }, []);

  return (
    <div className="space-y-8">
      {/* Color & Gradient Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Color & Gradient
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {COLOR_OPTIONS.map((color) => (
            <motion.button
              key={color.id}
              onClick={() => onSelectColor(color)}
              disabled={isFetching}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg"
              style={{ background: color.value }}
              title={color.label}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                <span className="px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-md backdrop-blur-sm">
                  {color.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Image Collections */}
      {IMAGE_COLLECTIONS.map((collection) => {
        const photos = collections[collection.id] || [];
        const isLoading = loadingCollections[collection.id];
        const isUsingFallback = usingFallback[collection.id];

        return (
          <div key={collection.id}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {collection.label}
              </h4>
              {isUsingFallback && (
                <span className="px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                  Limited mode
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/1] rounded-lg bg-gray-100 dark:bg-[#2b2a2c] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <motion.button
                    key={photo.id}
                    onClick={() => onSelectImage(photo.urls.regular)}
                    disabled={isFetching}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative aspect-[4/1] rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg bg-gray-100 dark:bg-[#2b2a2c]"
                  >
                    <img
                      src={photo.urls.thumb}
                      alt={photo.alt_description || photo.description || collection.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-sm font-medium rounded-lg backdrop-blur-sm shadow-lg">
                        Select
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface UploadTabProps {
  onFileSelect: (file: File) => void;
  isFetching: boolean;
}

const UploadTab = ({ onFileSelect, isFetching }: UploadTabProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) {
      onFileSelect(imageFile);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragOver ? '#8B5CF6' : 'rgba(156, 163, 175, 0.3)',
          backgroundColor: isDragOver ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
        }}
        className="relative w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={isFetching}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-2xl transition-colors ${isDragOver ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-[#2b2a2c]'}`}>
            <Upload className={`w-8 h-8 transition-colors ${isDragOver ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          
          <div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
              {isDragOver ? 'Drop image here' : 'Drag and drop an image'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse from your computer
            </p>
          </div>

          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={isFetching}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              'Choose file'
            )}
          </motion.button>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Supports: JPEG, PNG, WebP, GIF • Max 10MB
          </p>
        </div>
      </motion.div>
    </div>
  );
};

interface UnsplashTabProps {
  onSelectPhoto: (photoUrl: string) => void;
  isFetching: boolean;
}

const UnsplashTab = ({ onSelectPhoto, isFetching }: UnsplashTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
  const [defaultPhotos, setDefaultPhotos] = useState<UnsplashPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchUsingFallback, setSearchUsingFallback] = useState(false);

  const handleSearch = useCallback(async (query: string, pageNum: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchUsingFallback(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      // Try Unsplash first
      const response = await searchUnsplashPhotos(query, pageNum, 20);
      if (pageNum === 1) {
        setSearchResults(response.results);
      } else {
        setSearchResults(prev => [...prev, ...response.results]);
      }
      setHasMore(pageNum < response.total_pages);
      setPage(pageNum);
      setSearchUsingFallback(false);
    } catch (err) {
      // If rate limit error, use fallback
      if (err instanceof UnsplashRateLimitError) {
        console.log('Unsplash rate limit exceeded, using fallback for search');
        try {
          const fallbackResponse = searchFallbackPhotos(query, pageNum, 20);
          const unsplashCompatible = fallbackResponse.results.map(fallbackToUnsplash);
          if (pageNum === 1) {
            setSearchResults(unsplashCompatible);
          } else {
            setSearchResults(prev => [...prev, ...unsplashCompatible]);
          }
          setHasMore(pageNum < fallbackResponse.total_pages);
          setPage(pageNum);
          setSearchUsingFallback(true);
        } catch (fallbackError) {
          console.error('Error using fallback for search:', fallbackError);
          setError('Failed to search photos');
        }
      } else {
        console.error('Error searching Unsplash:', err);
        setError(err instanceof Error ? err.message : 'Failed to search photos');
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    handleSearch(searchQuery, 1);
  }, [searchQuery, handleSearch]);

  const handleLoadMore = useCallback(() => {
    if (!isSearching && hasMore) {
      handleSearch(searchQuery, page + 1);
    }
  }, [searchQuery, page, hasMore, isSearching, handleSearch]);

  const handleSelectPhoto = useCallback((photo: UnsplashPhoto) => {
    onSelectPhoto(photo.urls.regular);
  }, [onSelectPhoto]);

  // Load default photos function with fallback support
  const loadDefaultPhotos = useCallback(async () => {
    setIsLoadingDefaults(true);
    setError(null);
    try {
      // Try Unsplash first
      const photos = await getRandomUnsplashPhotos(12);
      setDefaultPhotos(photos);
      setUsingFallback(false);
    } catch (err) {
      // If rate limit error, use fallback
      if (err instanceof UnsplashRateLimitError) {
        console.log('Unsplash rate limit exceeded, using fallback for default photos');
        try {
          const fallbackPhotos = getFallbackPhotos(12);
          const unsplashCompatible = fallbackPhotos.map(fallbackToUnsplash);
          setDefaultPhotos(unsplashCompatible);
          setUsingFallback(true);
        } catch (fallbackError) {
          console.error('Error using fallback for default photos:', fallbackError);
          setError('Failed to load photos');
        }
      } else {
        console.error('Error loading default Unsplash photos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load photos');
      }
    } finally {
      setIsLoadingDefaults(false);
    }
  }, []);

  // Load default photos when component mounts
  useEffect(() => {
    loadDefaultPhotos();
  }, [loadDefaultPhotos]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadDefaultPhotos();
  }, [loadDefaultPhotos]);

  // Show default photos when no search query
  const displayPhotos = searchQuery.trim() ? searchResults : defaultPhotos;
  const showDefaultSection = !searchQuery.trim() && !isLoadingDefaults && defaultPhotos.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            disabled={isSearching || isFetching}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </form>

      {/* Default Photos Section */}
      {showDefaultSection && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Suggested Photos
              </h4>
              {usingFallback && (
                <span className="px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                  Limited mode
                </span>
              )}
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={isLoadingDefaults || isFetching}
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh photos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDefaults ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {defaultPhotos.map((photo) => (
              <motion.button
                key={photo.id}
                onClick={() => handleSelectPhoto(photo)}
                disabled={isFetching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative aspect-[4/1] rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg bg-gray-100 dark:bg-[#2b2a2c]"
              >
                <img
                  src={photo.urls.thumb}
                  alt={photo.alt_description || photo.description || 'Unsplash photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                  <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-sm font-medium rounded-lg backdrop-blur-sm shadow-lg">
                    Select
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Default Photos */}
      {isLoadingDefaults && !searchQuery && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Suggested Photos
            </h4>
            <div className="p-1.5 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-[4/1] rounded-lg bg-gray-100 dark:bg-[#2b2a2c] animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery.trim() && searchResults.length > 0 && (
        <div className={showDefaultSection ? 'mt-8' : ''}>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Search Results
            </h4>
            {searchUsingFallback && (
              <span className="px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                Limited mode
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {searchResults.map((photo) => (
              <motion.button
                key={photo.id}
                onClick={() => handleSelectPhoto(photo)}
                disabled={isFetching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative aspect-[4/1] rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg bg-gray-100 dark:bg-[#2b2a2c]"
              >
                <img
                  src={photo.urls.thumb}
                  alt={photo.alt_description || photo.description || 'Unsplash photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                  <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-sm font-medium rounded-lg backdrop-blur-sm shadow-lg">
                    Select
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <motion.button
                onClick={handleLoadMore}
                disabled={isSearching || isFetching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b2a2c] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3d3c3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Empty Search Results */}
      {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No photos found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
};

interface LinkTabProps {
  onSubmitUrl: (url: string) => void;
  isFetching: boolean;
}

const LinkTab = ({ onSubmitUrl, isFetching }: LinkTabProps) => {
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateUrl = useCallback((urlString: string): boolean => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setError(null);
    setPreviewUrl(null);
  }, []);

  const handlePreview = useCallback(() => {
    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsValidating(true);
    setError(null);

    // Create an image element to validate the URL
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setPreviewUrl(url);
      setIsValidating(false);
    };
    
    img.onerror = () => {
      setError('Could not load image from this URL');
      setIsValidating(false);
    };
    
    img.src = url;
  }, [url, validateUrl]);

  const handleSubmit = useCallback(() => {
    if (previewUrl) {
      onSubmitUrl(previewUrl);
    }
  }, [previewUrl, onSubmitUrl]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (previewUrl) {
        handleSubmit();
      } else {
        handlePreview();
      }
    }
  }, [previewUrl, handlePreview, handleSubmit]);

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                disabled={isFetching}
              />
            </div>
            <motion.button
              onClick={handlePreview}
              disabled={!url || isValidating || isFetching}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-200 font-medium text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Preview'
              )}
            </motion.button>
          </div>
          
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              <div className="relative aspect-[4/1] rounded-xl overflow-hidden border-2 border-green-400 dark:border-green-500 shadow-lg">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  <Check className="w-3 h-3" />
                  Valid
                </div>
              </div>
              
              <motion.button
                onClick={handleSubmit}
                disabled={isFetching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Use this image'
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CoverPhotoGallery = ({ 
  isOpen, 
  onClose, 
  onSelectBlob, 
  onDirectApply,
  onRemove,
  currentCover,
  triggerRef
}: CoverPhotoGalleryProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [isFetching, setIsFetching] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Use direct apply mode when onDirectApply is provided
  const useDirectApply = !!onDirectApply;

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('gallery');
    }
  }, [isOpen]);

  // Calculate position based on trigger element
  useEffect(() => {
    if (!isOpen || !triggerRef?.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef?.current) return;
      
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = 520; // Fixed width for the panel
      const panelHeight = 400; // Estimated max height
      const spacing = 8; // Space between button and panel
      
      let left = rect.right + spacing;
      let top = rect.bottom + spacing;
      
      // Adjust if panel would overflow right edge
      if (left + panelWidth > window.innerWidth) {
        left = rect.left - panelWidth - spacing;
      }
      
      // Adjust if panel would overflow bottom edge
      if (top + panelHeight > window.innerHeight) {
        top = rect.top - panelHeight - spacing;
      }
      
      // Ensure panel doesn't go off-screen on left
      if (left < 0) {
        left = spacing;
      }
      
      // Ensure panel doesn't go off-screen on top
      if (top < 0) {
        top = spacing;
      }
      
      setPosition({ top, left });
    };

    updatePosition();
    
    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef]);

  // Helper: Fetch URL and convert to blob
  const fetchImageAsBlob = useCallback(async (url: string): Promise<Blob> => {
    const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch image');
    return res.blob();
  }, []);

  // Handle color/gradient selection (create canvas and convert to blob)
  const handleSelectColor = useCallback(async (color: ColorOption) => {
    setIsFetching(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = FULL_W;
      canvas.height = FULL_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      if (color.type === 'solid') {
        ctx.fillStyle = color.value;
        ctx.fillRect(0, 0, FULL_W, FULL_H);
      } else {
        // Parse gradient
        const gradient = ctx.createLinearGradient(0, 0, FULL_W, FULL_H);
        // Simple parsing for our gradient format
        const colorStops = color.value.match(/#[A-Fa-f0-9]{6}/g) || [];
        if (colorStops.length >= 2) {
          gradient.addColorStop(0, colorStops[0]);
          if (colorStops.length === 3) {
            gradient.addColorStop(0.5, colorStops[1]);
            gradient.addColorStop(1, colorStops[2]);
          } else {
            gradient.addColorStop(1, colorStops[1]);
          }
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, FULL_W, FULL_H);
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          if (useDirectApply && onDirectApply) {
            // Direct apply mode: apply immediately, keep modal open
            await onDirectApply(blob);
          } else if (onSelectBlob) {
            // Legacy mode: pass blob and close
            onSelectBlob(blob);
            onClose();
          }
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error creating color cover:', error);
    } finally {
      setIsFetching(false);
    }
  }, [onSelectBlob, onDirectApply, useDirectApply, onClose]);

  // Handle image selection from gallery
  const handleSelectImage = useCallback(async (url: string) => {
    setIsFetching(true);
    try {
      const blob = await fetchImageAsBlob(url);
      if (useDirectApply && onDirectApply) {
        // Direct apply mode: apply immediately, keep modal open
        await onDirectApply(blob);
      } else if (onSelectBlob) {
        // Legacy mode: pass blob and close
        onSelectBlob(blob);
        onClose();
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchImageAsBlob, onSelectBlob, onDirectApply, useDirectApply, onClose]);

  // Handle file upload
  const handleFileSelect = useCallback(async (file: File) => {
    setIsFetching(true);
    try {
      if (useDirectApply && onDirectApply) {
        // Direct apply mode: apply immediately, keep modal open
        await onDirectApply(file);
      } else if (onSelectBlob) {
        // Legacy mode: pass blob and close
        onSelectBlob(file);
        onClose();
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsFetching(false);
    }
  }, [onSelectBlob, onDirectApply, useDirectApply, onClose]);

  // Handle URL submission
  const handleSubmitUrl = useCallback(async (url: string) => {
    setIsFetching(true);
    try {
      const blob = await fetchImageAsBlob(url);
      if (useDirectApply && onDirectApply) {
        // Direct apply mode: apply immediately, keep modal open
        await onDirectApply(blob);
      } else if (onSelectBlob) {
        // Legacy mode: pass blob and close
        onSelectBlob(blob);
        onClose();
      }
    } catch (error) {
      console.error('Error fetching image from URL:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchImageAsBlob, onSelectBlob, onDirectApply, useDirectApply, onClose]);

  // Handle remove
  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
      onClose();
    }
  }, [onRemove, onClose]);

  // Handle Unsplash photo selection
  const handleSelectUnsplashPhoto = useCallback(async (photoUrl: string) => {
    setIsFetching(true);
    try {
      const blob = await fetchImageAsBlob(photoUrl);
      if (useDirectApply && onDirectApply) {
        // Direct apply mode: apply immediately, keep modal open
        await onDirectApply(blob);
      } else if (onSelectBlob) {
        // Legacy mode: pass blob and close
        onSelectBlob(blob);
        onClose();
      }
    } catch (error) {
      console.error('Error fetching Unsplash photo:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchImageAsBlob, onSelectBlob, onDirectApply, useDirectApply, onClose]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'gallery', label: 'Gallery', icon: <Image className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'link', label: 'Link', icon: <Link2 className="w-4 h-4" /> },
    { id: 'unsplash', label: 'Unsplash', icon: <Search className="w-4 h-4" /> },
  ];

  const renderPanelContent = () => (
    <>
      {/* Header with tabs */}
      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-[#3d3c3e]/50 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side - Remove button */}
        <div className="flex items-center gap-2">
          {currentCover && onRemove && (
            <button
              onClick={handleRemove}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <GalleryTab
                onSelectColor={handleSelectColor}
                onSelectImage={handleSelectImage}
                isFetching={isFetching}
              />
            </motion.div>
          )}

          {activeTab === 'unsplash' && (
            <motion.div
              key="unsplash"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <UnsplashTab
                onSelectPhoto={handleSelectUnsplashPhoto}
                isFetching={isFetching}
              />
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <UploadTab
                onFileSelect={handleFileSelect}
                isFetching={isFetching}
              />
            </motion.div>
          )}

          {activeTab === 'link' && (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <LinkTab
                onSubmitUrl={handleSubmitUrl}
                isFetching={isFetching}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isFetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Processing...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (!isOpen) return null;

  // If no triggerRef provided, use centered modal (fallback)
  const usePositionedPanel = triggerRef && position;

  return (
    <AnimatePresence>
      {usePositionedPanel ? (
        // Positioned panel (Notion style)
        <>
          {/* Light backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/10"
            onClick={onClose}
          />
          
          {/* Panel positioned next to button */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 50,
            }}
            className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-2xl w-[520px] ring-1 ring-black/5 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {renderPanelContent()}
          </motion.div>
        </>
      ) : (
        // Centered modal (fallback for when no triggerRef)
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20" 
            onClick={onClose} 
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-2xl my-auto ring-1 ring-black/5 dark:ring-white/10"
          >
            {renderPanelContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoverPhotoGallery;
