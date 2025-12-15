/**
 * Profile Avatar Selector Component
 * 
 * A popover component that allows users to choose between:
 * - Uploading a photo
 * - Creating a custom avatar
 * 
 * Appears when hovering over the profile photo area in the header.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Pencil, Sparkles } from 'lucide-react';
import { ProfileAvatarType } from './profileAvatarConfig';

interface ProfileAvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: () => void;
  onSelectAvatar: () => void;
  currentType: ProfileAvatarType;
  hasExistingPhoto: boolean;
  hasExistingAvatar: boolean;
}

export default function ProfileAvatarSelector({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectAvatar,
  currentType,
  hasExistingPhoto,
  hasExistingAvatar,
}: ProfileAvatarSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-50 w-64 bg-white dark:bg-[#2b2a2c] 
              rounded-xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] 
              overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#3d3c3e]">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Choose your profile image
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Upload a photo or create an avatar
              </p>
            </div>
            
            {/* Options */}
            <div className="p-2">
              {/* Upload Photo Option */}
              <button
                onClick={() => {
                  onSelectPhoto();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${currentType === 'photo' 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-700 dark:text-gray-300'
                  }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                  ${currentType === 'photo' 
                    ? 'bg-indigo-100 dark:bg-indigo-500/20' 
                    : 'bg-gray-100 dark:bg-[#3d3c3e]'
                  }`}
                >
                  <Camera className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {hasExistingPhoto ? 'Change Photo' : 'Upload Photo'}
                  </p>
                  <p className="text-xs opacity-70">
                    Use your own picture
                  </p>
                </div>
                {currentType === 'photo' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </button>

              {/* Create Avatar Option */}
              <button
                onClick={() => {
                  onSelectAvatar();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mt-1
                  ${currentType === 'avatar' 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#3d3c3e] text-gray-700 dark:text-gray-300'
                  }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                  ${currentType === 'avatar' 
                    ? 'bg-indigo-100 dark:bg-indigo-500/20' 
                    : 'bg-gray-100 dark:bg-[#3d3c3e]'
                  }`}
                >
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">
                    {hasExistingAvatar ? 'Edit Avatar' : 'Create Avatar'}
                  </p>
                  <p className="text-xs opacity-70">
                    Customize your look
                  </p>
                </div>
                {currentType === 'avatar' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </button>
            </div>

            {/* Tip */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#252526] border-t border-gray-100 dark:border-[#3d3c3e]">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Pencil className="w-3 h-3" />
                Click to switch anytime
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

