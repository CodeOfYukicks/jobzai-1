/**
 * Avatar Editor Component
 * 
 * A customization UI for the Notion-like avatar system.
 * 
 * HOW IT WORKS:
 * 1. Displays the current avatar with a preview
 * 2. Provides tabs for different customization categories (Eyes, Hair, etc.)
 * 3. Each option shows a small preview avatar with that specific feature
 * 4. Clicking an option immediately updates the AvatarConfig
 * 5. Changes are live - no refresh needed
 * 
 * The component is designed to be modal-like and can be toggled from the main avatar.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shuffle, Eye, Smile, Glasses, Sparkles as BrowIcon, Scissors, User2 } from 'lucide-react';
import Avatar from './Avatar';
import { 
  AvatarConfig, 
  AVATAR_OPTIONS, 
  generateRandomConfig,
  DEFAULT_AVATAR_CONFIG 
} from './avatarConfig';

interface AvatarEditorProps {
  config: AvatarConfig;
  onConfigChange: (config: AvatarConfig) => void;
  onClose: () => void;
  onSave?: () => void;
}

type TabKey = 'eyes' | 'mouth' | 'hair' | 'glasses' | 'brows' | 'nose';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'eyes', label: 'Eyes', icon: <Eye className="w-3.5 h-3.5" /> },
  { key: 'mouth', label: 'Mouth', icon: <Smile className="w-3.5 h-3.5" /> },
  { key: 'hair', label: 'Hair', icon: <Scissors className="w-3.5 h-3.5" /> },
  { key: 'glasses', label: 'Glasses', icon: <Glasses className="w-3.5 h-3.5" /> },
  { key: 'brows', label: 'Brows', icon: <BrowIcon className="w-3.5 h-3.5" /> },
  { key: 'nose', label: 'Nose', icon: <User2 className="w-3.5 h-3.5" /> },
];

export default function AvatarEditor({ 
  config, 
  onConfigChange, 
  onClose,
  onSave 
}: AvatarEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('eyes');

  // Handle option selection for the active tab
  const handleOptionSelect = useCallback((option: string) => {
    const newConfig = { ...config };
    
    // Update the specific feature based on active tab
    switch (activeTab) {
      case 'eyes':
        newConfig.eyes = [option];
        break;
      case 'mouth':
        newConfig.mouth = [option];
        break;
      case 'hair':
        newConfig.hair = [option];
        break;
      case 'glasses':
        newConfig.glasses = [option];
        newConfig.glassesProbability = 100; // Show glasses when selected
        break;
      case 'brows':
        newConfig.brows = [option];
        break;
      case 'nose':
        newConfig.nose = [option];
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

  // Randomize the entire avatar
  const handleRandomize = useCallback(() => {
    onConfigChange(generateRandomConfig());
  }, [onConfigChange]);

  // Reset to default
  const handleReset = useCallback(() => {
    onConfigChange({
      ...DEFAULT_AVATAR_CONFIG,
      seed: config.seed, // Keep the same seed for consistency
    });
  }, [config.seed, onConfigChange]);

  // Get options for the current tab
  const currentOptions = AVATAR_OPTIONS[activeTab] || [];
  
  // Get the currently selected option for highlighting
  const getCurrentSelection = (): string | undefined => {
    switch (activeTab) {
      case 'eyes': return config.eyes?.[0];
      case 'mouth': return config.mouth?.[0];
      case 'hair': return config.hair?.[0];
      case 'glasses': return config.glasses?.[0];
      case 'brows': return config.brows?.[0];
      case 'nose': return config.nose?.[0];
      default: return undefined;
    }
  };

  const currentSelection = getCurrentSelection();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-white dark:bg-[#1e1e1f] flex flex-col"
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
      <div className="flex flex-col items-center py-6 px-5">
        <motion.div
          key={JSON.stringify(config)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
        >
          <Avatar 
            config={config} 
            size={100} 
            className="rounded-2xl ring-2 ring-gray-200 dark:ring-white/10 shadow-lg"
          />
        </motion.div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleRandomize}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-gray-900/5 dark:bg-white/5
              text-gray-700 dark:text-gray-300 text-xs font-medium
              hover:bg-violet-500 hover:text-white dark:hover:bg-violet-500
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

      {/* Options Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'glasses' && (
          <div className="mb-4">
            <button
              onClick={handleToggleGlasses}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl
                border transition-all
                ${config.glassesProbability === 100
                  ? 'border-violet-300 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10'
                  : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                }`}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Glasses
              </span>
              <div className={`w-10 h-6 rounded-full transition-colors relative
                ${config.glassesProbability === 100 
                  ? 'bg-violet-500' 
                  : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                  ${config.glassesProbability === 100 ? 'translate-x-5' : 'translate-x-1'}`} 
                />
              </div>
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-2">
          <AnimatePresence mode="wait">
            {currentOptions.map((option) => {
              // Create a preview config with this specific option
              const previewConfig: AvatarConfig = {
                ...config,
                [activeTab]: [option],
                ...(activeTab === 'glasses' && { glassesProbability: 100 }),
              };
              
              const isSelected = currentSelection === option;
              
              return (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleOptionSelect(option)}
                  className={`relative p-2 rounded-xl transition-all
                    ${isSelected
                      ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-500/20'
                      : 'hover:bg-gray-100 dark:hover:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10'
                    }`}
                >
                  <Avatar 
                    config={previewConfig} 
                    size={60} 
                    className="rounded-lg mx-auto"
                  />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full 
                        bg-violet-500 flex items-center justify-center"
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
      </div>

      {/* Save Button */}
      {onSave && (
        <div className="px-4 py-3 border-t border-gray-200/60 dark:border-white/5">
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="w-full py-2 rounded-lg text-sm
              bg-gray-900 dark:bg-white
              text-white dark:text-gray-900
              font-medium
              hover:bg-gray-800 dark:hover:bg-gray-100
              active:scale-[0.98]
              transition-all duration-150"
          >
            Save
          </button>
        </div>
      )}
    </motion.div>
  );
}

