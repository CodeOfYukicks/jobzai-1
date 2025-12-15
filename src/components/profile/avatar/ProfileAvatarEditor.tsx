/**
 * Profile Avatar Editor Component
 * 
 * A customization UI for the Lorelei avatar system.
 * 
 * HOW IT WORKS:
 * 1. Displays the current avatar with a preview
 * 2. Provides tabs for different customization categories
 * 3. Each option shows a small preview avatar with that specific feature
 * 4. Clicking an option immediately updates the ProfileAvatarConfig
 * 5. Changes are live - no refresh needed
 * 
 * AVAILABLE OPTIONS for lorelei:
 * - hair (48 variants) - most impactful, shown first
 * - eyes (24 variants)
 * - mouth (27 variants)
 * - eyebrows (13 variants)
 * - nose (6 variants)
 * - glasses (5 variants + toggle)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Eye, Smile, Glasses, Sparkles as BrowIcon, User2, Palette } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { 
  ProfileAvatarConfig, 
  LORELEI_OPTIONS, 
  generateRandomConfig,
  DEFAULT_PROFILE_AVATAR_CONFIG,
  BACKGROUND_COLORS,
  AVATAR_PRESETS
} from './profileAvatarConfig';

// Hair icon component
const HairIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c-4 0-8 2-8 8s2 12 8 12 8-6 8-12-4-8-8-8z" />
    <path d="M8 6c0-2 2-4 4-4s4 2 4 4" />
  </svg>
);

interface ProfileAvatarEditorProps {
  config: ProfileAvatarConfig;
  onConfigChange: (config: ProfileAvatarConfig) => void;
  onClose: () => void;
  onSave?: () => void;
}

type TabKey = 'hair' | 'eyes' | 'mouth' | 'eyebrows' | 'nose' | 'glasses' | 'color';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hair', label: 'Hair', icon: <HairIcon /> },
  { key: 'eyes', label: 'Eyes', icon: <Eye className="w-3.5 h-3.5" /> },
  { key: 'mouth', label: 'Mouth', icon: <Smile className="w-3.5 h-3.5" /> },
  { key: 'eyebrows', label: 'Brows', icon: <BrowIcon className="w-3.5 h-3.5" /> },
  { key: 'nose', label: 'Nose', icon: <User2 className="w-3.5 h-3.5" /> },
  { key: 'glasses', label: 'Glasses', icon: <Glasses className="w-3.5 h-3.5" /> },
  { key: 'color', label: 'Color', icon: <Palette className="w-3.5 h-3.5" /> },
];

export default function ProfileAvatarEditor({ 
  config, 
  onConfigChange, 
  onClose,
  onSave,
}: ProfileAvatarEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('hair');

  // Handle option selection for the active tab
  const handleOptionSelect = useCallback((option: string) => {
    const newConfig = { ...config };
    
    // Update the specific feature based on active tab
    switch (activeTab) {
      case 'hair':
        newConfig.hair = [option];
        break;
      case 'eyes':
        newConfig.eyes = [option];
        break;
      case 'mouth':
        newConfig.mouth = [option];
        break;
      case 'eyebrows':
        newConfig.eyebrows = [option];
        break;
      case 'nose':
        newConfig.nose = [option];
        break;
      case 'glasses':
        newConfig.glasses = [option];
        newConfig.glassesProbability = 100; // Show glasses when selected
        break;
    }
    
    onConfigChange(newConfig);
  }, [activeTab, config, onConfigChange]);

  // Toggle glasses visibility
  const handleToggleGlasses = useCallback(() => {
    onConfigChange({
      ...config,
      glassesProbability: config.glassesProbability === 100 ? 0 : 100,
    });
  }, [config, onConfigChange]);

  // Handle background color selection
  const handleColorSelect = useCallback((hex: string) => {
    onConfigChange({
      ...config,
      backgroundColor: [hex],
    });
  }, [config, onConfigChange]);

  // Randomize the entire avatar
  const handleRandomize = useCallback(() => {
    onConfigChange(generateRandomConfig());
  }, [onConfigChange]);

  // Reset to default
  const handleReset = useCallback(() => {
    onConfigChange({
      ...DEFAULT_PROFILE_AVATAR_CONFIG,
      seed: config.seed, // Keep the same seed for consistency
    });
  }, [config.seed, onConfigChange]);

  // Get options for the current tab
  const currentOptions = LORELEI_OPTIONS[activeTab] || [];
  
  // Get the currently selected option for highlighting
  const getCurrentSelection = (): string | undefined => {
    switch (activeTab) {
      case 'hair': return config.hair?.[0];
      case 'eyes': return config.eyes?.[0];
      case 'mouth': return config.mouth?.[0];
      case 'eyebrows': return config.eyebrows?.[0];
      case 'nose': return config.nose?.[0];
      case 'glasses': return config.glasses?.[0];
      default: return undefined;
    }
  };

  const currentSelection = getCurrentSelection();
  
  // Base config for previews - uses FIXED values so previews are consistent
  // Only the active tab's feature will change between previews
  const basePreviewConfig: ProfileAvatarConfig = {
    style: 'lorelei',
    seed: 'preview-base', // Fixed seed for consistency
    hair: ['variant01'],
    eyes: ['variant01'],
    mouth: ['happy01'],
    eyebrows: ['variant01'],
    nose: ['variant01'],
    glasses: ['variant01'],
    glassesProbability: activeTab === 'glasses' ? 100 : 0,
    beardProbability: 0,
    earringsProbability: 0,
    frecklesProbability: 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 max-h-[90vh] bg-white dark:bg-[#1e1e1f] rounded-2xl shadow-2xl flex flex-col overflow-hidden isolate"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customize Avatar
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 
              dark:text-gray-500 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/5
              transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Preview */}
        <div className="flex flex-col items-center py-6 px-5 bg-gradient-to-b from-gray-50 to-white dark:from-[#252526] dark:to-[#1e1e1f]">
          <motion.div
            key={JSON.stringify(config)}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            <ProfileAvatar 
              config={config} 
              size={120} 
              className="rounded-full ring-4 ring-white dark:ring-[#2b2a2c] shadow-xl"
            />
          </motion.div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleRandomize}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-gray-900/5 dark:bg-white/5
                text-gray-700 dark:text-gray-300 text-xs font-medium
                hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500
                border border-gray-200/60 dark:border-white/10
                hover:border-transparent
                transition-all duration-200"
            >
              <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
              Randomize
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg
                text-gray-500 dark:text-gray-400 text-xs font-medium
                hover:text-gray-700 dark:hover:text-gray-200
                hover:bg-gray-100 dark:hover:bg-white/5
                transition-all duration-200"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                transition-all duration-150 whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area - Avatar Options only */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px] max-h-[300px]">
          {activeTab === 'glasses' && (
            <div className="mb-4">
              <button
                onClick={handleToggleGlasses}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl
                  border transition-all
                  ${config.glassesProbability === 100
                    ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                  }`}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Glasses
                </span>
                <div className={`w-10 h-6 rounded-full transition-colors relative
                  ${config.glassesProbability === 100 
                    ? 'bg-indigo-500' 
                    : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                    ${config.glassesProbability === 100 ? 'translate-x-5' : 'translate-x-1'}`} 
                  />
                </div>
              </button>
            </div>
          )}
          
          {/* Presets - shown at top of Hair tab */}
          {activeTab === 'hair' && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Start</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onConfigChange({ ...AVATAR_PRESETS.feminine, seed: config.seed, backgroundColor: config.backgroundColor })}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
                    border border-gray-200 dark:border-white/10
                    bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10
                    hover:border-pink-300 dark:hover:border-pink-500/30
                    transition-all group"
                >
                  <ProfileAvatar 
                    config={AVATAR_PRESETS.feminine}
                    size={32}
                    className="rounded-lg ring-1 ring-pink-200 dark:ring-pink-500/20"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Feminine
                  </span>
                </button>
                <button
                  onClick={() => onConfigChange({ ...AVATAR_PRESETS.masculine, seed: config.seed, backgroundColor: config.backgroundColor })}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl
                    border border-gray-200 dark:border-white/10
                    bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10
                    hover:border-blue-300 dark:hover:border-blue-500/30
                    transition-all group"
                >
                  <ProfileAvatar 
                    config={AVATAR_PRESETS.masculine}
                    size={32}
                    className="rounded-lg ring-1 ring-blue-200 dark:ring-blue-500/20"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Masculine
                  </span>
                </button>
              </div>
            </div>
          )}
          
          {/* Background Color Picker */}
          {activeTab === 'color' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Choose a background color for your avatar
              </p>
              <div className="grid grid-cols-4 gap-3">
                {BACKGROUND_COLORS.map((color) => {
                  const isSelected = config.backgroundColor?.[0] === color.hex;
                  return (
                    <motion.button
                      key={color.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleColorSelect(color.hex)}
                      className={`relative aspect-square rounded-xl transition-all
                        ${isSelected
                          ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1e1e1f]'
                          : 'ring-1 ring-gray-200 dark:ring-white/10 hover:ring-gray-300 dark:hover:ring-white/20'
                        }`}
                      style={{ backgroundColor: `#${color.hex}` }}
                      title={color.label}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {/* Clear color option */}
              <button
                onClick={() => onConfigChange({ ...config, backgroundColor: undefined })}
                className={`w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  border transition-all
                  ${!config.backgroundColor
                    ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
              >
                No Background (Transparent)
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-4 gap-2 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentOptions.map((option, index) => {
                // Create a preview config with this specific option
                // Uses fixed base config so only the current feature changes
                const previewConfig: ProfileAvatarConfig = {
                  ...basePreviewConfig,
                  [activeTab]: [option],
                };
                
                const isSelected = currentSelection === option;
                
                return (
                  <motion.button
                    key={`${activeTab}-${option}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.3) }}
                    onClick={() => handleOptionSelect(option)}
                    className={`relative p-1.5 rounded-xl transition-all
                      ${isSelected
                        ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10'
                      }`}
                  >
                    <ProfileAvatar 
                      config={previewConfig} 
                      size={56} 
                      className="rounded-lg mx-auto"
                    />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full 
                          bg-indigo-500 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
          )}
        </div>

        {/* Save Button */}
        {onSave && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200/60 dark:border-white/5">
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl text-sm
                bg-gray-900 dark:bg-white
                text-white dark:text-gray-900
                font-semibold
                hover:bg-gray-800 dark:hover:bg-gray-100
                active:scale-[0.98]
                transition-all duration-150"
            >
              Save Avatar
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

