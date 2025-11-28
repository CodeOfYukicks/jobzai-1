import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Camera, X, Smile, Folder as FolderIcon, Briefcase, Target, Star, Heart, Zap, Rocket, BookOpen, Code, Palette } from 'lucide-react';
import { Folder } from './FolderCard';
import CoverPhotoCropper from '../profile/CoverPhotoCropper';
import CoverPhotoGallery from '../profile/CoverPhotoGallery';

// Emoji options for folders
const EMOJI_OPTIONS = ['📁', '💼', '🎯', '⭐', '🚀', '💡', '📚', '🎨', '💻', '🔥', '✨', '🎪'];

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
  icon?: React.ReactNode;
  onUpdateCover?: (blob: Blob) => Promise<void>;
  onRemoveCover?: () => Promise<void>;
  isUpdating?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function FolderHeader({
  folder,
  title,
  subtitle,
  icon,
  onUpdateCover,
  onRemoveCover,
  isUpdating = false,
  children,
  className = ''
}: FolderHeaderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverPhoto = folder?.coverPhoto;
  const hasCover = !!coverPhoto;

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

  const handleGallerySelect = (blob: Blob) => {
    setSelectedCoverFile(blob);
    setIsCoverGalleryOpen(false);
    setIsCoverCropperOpen(true);
  };

  return (
    <div 
      className={`relative group/header ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Cover Photo Area */}
      <div className={`relative w-full transition-all duration-300 ease-in-out ${hasCover ? 'h-56 sm:h-72' : 'h-32 sm:h-40'}`}>
        {hasCover ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src={coverPhoto} 
              alt="Folder cover" 
              className="w-full h-full object-cover animate-in fade-in duration-500"
            />
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 transition-colors duration-300 group-hover/header:bg-black/10 dark:group-hover/header:bg-black/30" />
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

        {/* Cover Controls - Visible on hover */}
        <AnimatePresence>
          {onUpdateCover && (isHovering || !hasCover) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute ${hasCover ? 'top-4 right-4' : 'bottom-4 right-4'} flex items-center gap-2 z-20`}
            >
              {!hasCover ? (
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
                <>
                  <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                    <button
                      onClick={() => setIsCoverGalleryOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                        hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <Image className="w-3.5 h-3.5" />
                      Change cover
                    </button>
                    
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                        hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                      {isUpdating ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </button>
                    
                    <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                    
                    <button
                      onClick={onRemoveCover}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 
                        hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      title="Remove cover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
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
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {icon || <FolderIcon className="w-8 h-8 sm:w-10 sm:h-10" />}
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
              <div className={`flex items-center gap-2 text-base font-semibold mt-2 px-4 ${hasCover ? 'text-white/90 drop-shadow-lg' : 'text-gray-600 dark:text-gray-300'}`}>
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
        onSelectBlob={handleGallerySelect}
      />
    </div>
  );
}

