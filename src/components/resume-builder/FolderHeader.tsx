import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Camera, X, Smile, Folder as FolderIcon, Briefcase, Target, Star, Heart, Zap, Rocket, BookOpen, Code, Palette, Check } from 'lucide-react';
import { Folder } from './FolderCard';
import CoverPhotoCropper from '../profile/CoverPhotoCropper';
import CoverPhotoGallery from '../profile/CoverPhotoGallery';

// Emoji options for folders
const EMOJI_OPTIONS = ['📁', '💼', '🎯', '⭐', '🚀', '💡', '📚', '🎨', '💻', '🔥', '✨', '🎪'];

// Common emojis for special views (like notes)
const COMMON_EMOJIS = [
  '📝', '📄', '📋', '📌', '🎯', '💡', '🚀', '⭐',
  '📚', '💼', '🎨', '🔧', '📊', '🗂️', '✅', '❤️',
  '📁', '📂', '📑', '📃', '📜', '📰', '📕', '📗',
  '📘', '📙', '📓', '📔', '📒', '📖', '🔖', '🏷️'
];

// Lucide icon options mapping
const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Folder': FolderIcon,
  'Briefcase': Briefcase,
  'Target': Target,
  'Star': Star,
  'Heart': Heart,
  'Zap': Zap,
  'Rocket': Rocket,
  'BookOpen': BookOpen,
  'Code': Code,
  'Palette': Palette,
};

// Helper function to get Lucide icon component from icon name
const getLucideIcon = (iconName: string): React.ComponentType<{ className?: string }> | null => {
  return LUCIDE_ICON_MAP[iconName] || null;
};

interface FolderHeaderProps {
  folder?: Folder | null; // null means uncategorized or special view if not passed
  title: string;
  subtitle: string;
  icon?: React.ReactNode | string; // Can be ReactNode or emoji string for special views
  coverPhoto?: string; // For special views (all, uncategorized)
  isSpecialView?: boolean;
  viewType?: 'all' | 'uncategorized';
  onUpdateCover?: (blob: Blob) => Promise<void>;
  onRemoveCover?: () => Promise<void>;
  onUpdateEmoji?: (emoji: string) => Promise<void>;
  isUpdating?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function FolderHeader({
  folder,
  title,
  subtitle,
  icon,
  coverPhoto: coverPhotoProp,
  isSpecialView = false,
  viewType,
  onUpdateCover,
  onRemoveCover,
  onUpdateEmoji,
  isUpdating = false,
  children,
  className = ''
}: FolderHeaderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Inline repositioning states
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDragPosition, setInitialDragPosition] = useState({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverButtonRef = useRef<HTMLButtonElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const coverImageRef = useRef<HTMLImageElement>(null);

  // Use coverPhoto from prop for special views, or from folder for regular folders
  const coverPhoto = isSpecialView ? coverPhotoProp : folder?.coverPhoto;
  const hasCover = !!coverPhoto;
  
  // Debug log for cover photo
  useEffect(() => {
    if (isSpecialView) {
      console.log('FolderHeader - isSpecialView:', isSpecialView, 'coverPhotoProp:', coverPhotoProp, 'coverPhoto:', coverPhoto, 'hasCover:', hasCover);
    }
  }, [isSpecialView, coverPhotoProp, coverPhoto, hasCover]);
  
  // Get current emoji for special views
  const currentEmoji = isSpecialView && typeof icon === 'string' ? icon : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCroppedCover = async (blob: Blob) => {
    if (onUpdateCover) {
      await onUpdateCover(blob);
    }
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
  };

  // Handle direct cover apply from gallery (no cropper)
  const handleDirectApplyCover = async (blob: Blob) => {
    if (onUpdateCover) {
      await onUpdateCover(blob);
    }
  };

  // Calculate container dimensions
  const getContainerDimensions = useCallback(() => {
    if (!coverContainerRef.current) return { width: 1584, height: 288 };
    return {
      width: coverContainerRef.current.clientWidth || 1584,
      height: coverContainerRef.current.clientHeight || 288
    };
  }, []);

  // Calculate bounds for image positioning
  const getBounds = useCallback(() => {
    if (!imageNaturalSize) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const { width: containerWidth, height: containerHeight } = getContainerDimensions();
    const imgAspectRatio = imageNaturalSize.width / imageNaturalSize.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    
    if (imgAspectRatio > containerAspectRatio) {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgAspectRatio;
    } else {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgAspectRatio;
    }

    return {
      minX: containerWidth - displayWidth,
      maxX: 0,
      minY: containerHeight - displayHeight,
      maxY: 0,
      displayWidth,
      displayHeight
    };
  }, [imageNaturalSize, getContainerDimensions]);

  // Load image dimensions when starting to reposition
  useEffect(() => {
    if (!isRepositioning || !coverPhoto) {
      setImageNaturalSize(null);
      setImagePosition({ x: 0, y: 0 });
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Calculate initial centered position
      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let displayWidth: number;
      let displayHeight: number;
      
      if (imgAspectRatio > containerAspectRatio) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspectRatio;
      } else {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imgAspectRatio;
      }
      
      const initialX = (containerWidth - displayWidth) / 2;
      const initialY = (containerHeight - displayHeight) / 2;
      
      setImagePosition({ x: initialX, y: initialY });
      setInitialDragPosition({ x: initialX, y: initialY });
    };
    img.src = coverPhoto;
  }, [isRepositioning, coverPhoto, getContainerDimensions]);

  // Mouse handlers for inline repositioning
  const handleCoverMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialDragPosition({ ...imagePosition });
  }, [isRepositioning, imagePosition]);

  const handleCoverMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const bounds = getBounds();
    
    const newX = Math.max(bounds.minX, Math.min(bounds.maxX, initialDragPosition.x + dx));
    const newY = Math.max(bounds.minY, Math.min(bounds.maxY, initialDragPosition.y + dy));
    
    setImagePosition({ x: newX, y: newY });
  }, [isDragging, dragStart, initialDragPosition, getBounds]);

  const handleCoverMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Touch handlers for mobile
  const handleCoverTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isRepositioning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setInitialDragPosition({ ...imagePosition });
  }, [isRepositioning, imagePosition]);

  const handleCoverTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStart || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    const bounds = getBounds();
    
    const newX = Math.max(bounds.minX, Math.min(bounds.maxX, initialDragPosition.x + dx));
    const newY = Math.max(bounds.minY, Math.min(bounds.maxY, initialDragPosition.y + dy));
    
    setImagePosition({ x: newX, y: newY });
  }, [isDragging, dragStart, initialDragPosition, getBounds]);

  const handleCoverTouchEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleCoverMouseMove);
      document.addEventListener('mouseup', handleCoverMouseUp);
      document.addEventListener('touchmove', handleCoverTouchMove, { passive: false });
      document.addEventListener('touchend', handleCoverTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleCoverMouseMove);
        document.removeEventListener('mouseup', handleCoverMouseUp);
        document.removeEventListener('touchmove', handleCoverTouchMove);
        document.removeEventListener('touchend', handleCoverTouchEnd);
      };
    }
  }, [isDragging, handleCoverMouseMove, handleCoverMouseUp, handleCoverTouchMove, handleCoverTouchEnd]);

  // Save repositioned cover - using fetch to avoid CORS issues
  const handleRepositionSave = async () => {
    if (!coverPhoto || !onUpdateCover || !coverContainerRef.current || !imageNaturalSize) return;

    setIsSavingPosition(true);
    try {
      // Fetch the image as a blob to avoid CORS issues when drawing to canvas
      const response = await fetch(coverPhoto);
      const imageBlob = await response.blob();
      const localImageUrl = URL.createObjectURL(imageBlob);

      const img = new window.Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = localImageUrl;
      });

      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      const bounds = getBounds();

      const canvas = document.createElement('canvas');
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw the image at the current position
      ctx.drawImage(
        img,
        0, 0, img.naturalWidth, img.naturalHeight,
        imagePosition.x, imagePosition.y, bounds.displayWidth || containerWidth, bounds.displayHeight || containerHeight
      );

      // Clean up the object URL
      URL.revokeObjectURL(localImageUrl);

      // Convert canvas to blob and save
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.92);
      });

      await onUpdateCover(blob);
      setIsRepositioning(false);
      setImagePosition({ x: 0, y: 0 });
      setImageNaturalSize(null);
    } catch (error) {
      console.error('Error repositioning cover:', error);
    } finally {
      setIsSavingPosition(false);
    }
  };

  // Cancel repositioning
  const handleRepositionCancel = () => {
    setIsRepositioning(false);
    setImagePosition({ x: 0, y: 0 });
    setImageNaturalSize(null);
    setIsDragging(false);
    setDragStart(null);
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (onUpdateEmoji) {
      await onUpdateEmoji(emoji);
    }
    setShowEmojiPicker(false);
  };

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className={`relative group/header ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Cover Photo Area */}
      <div 
        ref={coverContainerRef}
        className={`relative w-full transition-all duration-300 ease-in-out ${hasCover ? 'h-56 sm:h-72' : 'h-32 sm:h-40'}`}
      >
        {hasCover ? (
          <div 
            className={`absolute inset-0 w-full h-full overflow-hidden ${isRepositioning ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onMouseDown={handleCoverMouseDown}
            onTouchStart={handleCoverTouchStart}
          >
            {isRepositioning && imageNaturalSize ? (
              // Repositioning mode - show draggable image
              <img 
                ref={coverImageRef}
                key={`reposition-${coverPhoto}`}
                src={coverPhoto} 
                alt="Folder cover" 
                className="absolute select-none"
                draggable={false}
                style={{
                  left: `${imagePosition.x}px`,
                  top: `${imagePosition.y}px`,
                  width: `${getBounds().displayWidth}px`,
                  height: `${getBounds().displayHeight}px`,
                  objectFit: 'cover',
                  touchAction: 'none',
                }}
              />
            ) : (
              // Normal mode
              <img 
                key={coverPhoto}
                src={coverPhoto} 
                alt="Folder cover" 
                className="w-full h-full object-cover animate-in fade-in duration-500"
              />
            )}
            <div className={`absolute inset-0 transition-colors duration-300 ${isRepositioning ? 'bg-black/10 dark:bg-black/30' : 'bg-black/5 dark:bg-black/20 group-hover/header:bg-black/10 dark:group-hover/header:bg-black/30'}`} />
            
            {/* Repositioning indicator */}
            {isRepositioning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-md rounded-lg border border-gray-700/50">
                  <p className="text-sm font-medium text-white">
                    Drag to reposition
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-gray-700/20">
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
               style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
            />
            {/* Subtle animated gradient orbs */}
            <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
          </div>
        )}

        {/* Cover Controls - Visible on hover or when repositioning */}
        <AnimatePresence>
          {onUpdateCover && (isHovering || !hasCover || isRepositioning) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute ${hasCover ? 'top-4 right-4' : 'bottom-4 right-4'} flex items-center gap-2 z-20`}
            >
              {isRepositioning ? (
                // Repositioning controls - Save/Cancel
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRepositionCancel}
                    disabled={isSavingPosition}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800
                      border border-gray-200 dark:border-gray-700 rounded-md shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRepositionSave}
                    disabled={isSavingPosition}
                    className="px-3 py-1.5 text-sm font-medium text-white 
                      bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700
                      rounded-md shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingPosition ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : !hasCover ? (
                 // "Add Cover" button when no cover exists
                <button
                  onClick={() => setIsCoverGalleryOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                    bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800
                    border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200
                    hover:shadow-md group"
                >
                  <Image className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                  <span>Add cover</span>
                </button>
              ) : (
                // Controls when cover exists
                <div className="flex items-center gap-2">
                  <button
                    ref={coverButtonRef}
                    onClick={() => setIsCoverGalleryOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800
                      border border-gray-200 dark:border-gray-700 rounded-md shadow-sm transition-all duration-200"
                  >
                    Change cover
                  </button>
                  
                  <button
                    onClick={() => setIsRepositioning(true)}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                      bg-white/90 dark:bg-gray-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800
                      border border-gray-200 dark:border-gray-700 rounded-md shadow-sm transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reposition
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
        />
      </div>

      {/* Content Area - Overlapping the cover slightly if cover exists, or normal padding */}
      <div className="px-6 sm:px-8 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 sm:-mt-10 relative z-10">
          <div className="flex items-end gap-4">
            {/* Icon */}
            <div 
              ref={emojiPickerRef}
              className={`relative shrink-0 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-2xl border-4 border-white dark:border-[#121212] ${!folder ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700' : ''}`}
              style={folder ? { 
                backgroundColor: folder.color,
                boxShadow: `0 20px 40px ${folder.color}40, 0 0 0 1px ${folder.color}20`
              } : undefined}
            >
              {folder ? (
                (EMOJI_OPTIONS.includes(folder.icon) || folder.icon.length <= 2 || /^\p{Emoji}/u.test(folder.icon)) ? (
                  <span className="text-3xl sm:text-4xl select-none leading-none filter drop-shadow-sm">{folder.icon}</span>
                ) : (
                  (() => {
                    const LucideIcon = getLucideIcon(folder.icon);
                    return LucideIcon ? (
                      <LucideIcon className={`w-8 h-8 sm:w-10 sm:h-10 text-white`} />
                    ) : (
                      <FolderIcon className={`w-8 h-8 sm:w-10 sm:h-10 text-white`} />
                    );
                  })()
                )
              ) : isSpecialView && typeof icon === 'string' ? (
                <>
                  <motion.button
                    onClick={() => onUpdateEmoji && setShowEmojiPicker(!showEmojiPicker)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-3xl sm:text-4xl select-none leading-none filter drop-shadow-sm hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-xl p-2 transition-colors cursor-pointer"
                  >
                    {currentEmoji || icon || '📁'}
                  </motion.button>
                  
                  <AnimatePresence>
                    {showEmojiPicker && onUpdateEmoji && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 min-w-max"
                      >
                        <div className="grid grid-cols-8 gap-1">
                          {COMMON_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className={`p-2 text-2xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                currentEmoji === emoji ? 'bg-purple-100 dark:bg-purple-900/30' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {typeof icon === 'string' ? icon : (icon || <FolderIcon className="w-8 h-8 sm:w-10 sm:h-10" />)}
                </span>
              )}
            </div>
            
            {/* Title & Subtitle */}
            <div className="mb-2 sm:mb-3">
              <div className={`inline-block px-4 py-2 rounded-xl ${hasCover ? 'bg-black/40 dark:bg-black/50 backdrop-blur-md' : ''}`}>
                <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${hasCover ? 'text-white drop-shadow-2xl' : 'text-gray-900 dark:text-white'}`}>
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-base font-semibold mt-2 px-4 text-gray-600 dark:text-gray-300">
                <span>{subtitle}</span>
              </div>
            </div>
          </div>

          {/* Actions (New Resume, etc.) */}
          <div className="mb-1.5 sm:mb-2">
            {children}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CoverPhotoCropper
        isOpen={isCoverCropperOpen}
        file={selectedCoverFile}
        onClose={() => {
          setIsCoverCropperOpen(false);
          setSelectedCoverFile(null);
        }}
        onCropped={handleCroppedCover}
        exportWidth={1584}
        exportHeight={396}
      />
      
      <CoverPhotoGallery
        isOpen={isCoverGalleryOpen}
        onClose={() => setIsCoverGalleryOpen(false)}
        onDirectApply={handleDirectApplyCover}
        onRemove={onRemoveCover}
        currentCover={coverPhoto}
      />
    </div>
  );
}

