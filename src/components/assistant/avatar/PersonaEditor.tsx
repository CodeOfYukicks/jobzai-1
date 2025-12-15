/**
 * Persona Editor Component
 * 
 * A Notion-style UI for customizing the AI assistant's personality.
 * 
 * HOW IT WORKS:
 * 1. Displays the current persona config with editable fields
 * 2. Provides quick preset selection chips for common personas
 * 3. Allows custom name, instructions, tone, and language settings
 * 4. Changes update the PersonaConfig in real-time
 * 5. Style matches Notion's "Instructions" card design
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, ChevronDown, ChevronUp, Check, Globe } from 'lucide-react';
import {
  PersonaConfig,
  ToneType,
  LanguageType,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  PERSONA_PRESETS,
  DEFAULT_PERSONA_CONFIG,
} from './personaConfig';
import Avatar from './Avatar';
import { AvatarConfig } from './avatarConfig';

interface PersonaEditorProps {
  config: PersonaConfig;
  onConfigChange: (config: PersonaConfig) => void;
  avatarConfig: AvatarConfig;
}

export default function PersonaEditor({
  config,
  onConfigChange,
  avatarConfig,
}: PersonaEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToneSelect, setShowToneSelect] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  // Handle field changes
  const handleChange = useCallback(
    <K extends keyof PersonaConfig>(field: K, value: PersonaConfig[K]) => {
      onConfigChange({ ...config, [field]: value });
    },
    [config, onConfigChange]
  );

  // Apply a preset
  const handleApplyPreset = useCallback(
    (preset: typeof PERSONA_PRESETS[0]) => {
      onConfigChange({
        ...config,
        ...preset.config,
      });
    },
    [config, onConfigChange]
  );

  // Reset to default
  const handleReset = useCallback(() => {
    onConfigChange(DEFAULT_PERSONA_CONFIG);
  }, [onConfigChange]);

  // Get current tone and language options
  const currentTone = TONE_OPTIONS.find((t) => t.value === config.tone);
  const currentLanguage = LANGUAGE_OPTIONS.find((l) => l.value === config.language);

  return (
    <div className="mx-4 my-3">
      {/* Main Card - Notion style */}
      <motion.div
        layout
        className="bg-gray-50/80 dark:bg-white/[0.03] rounded-2xl 
          border border-gray-200/60 dark:border-white/[0.06]
          overflow-hidden"
      >
        {/* Card Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 p-4 
            hover:bg-gray-100/50 dark:hover:bg-white/[0.02]
            transition-colors text-left"
        >
          {/* Avatar thumbnail */}
          <div className="flex-shrink-0">
            <Avatar
              config={avatarConfig}
              size={40}
              className="rounded-xl ring-1 ring-gray-200/60 dark:ring-white/10 
                bg-amber-50 dark:bg-amber-900/30"
            />
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {config.name || 'Assistant'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {config.instructions
                ? 'Custom instructions set'
                : 'No custom instructions'}
            </p>
          </div>

          {/* Edit button */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-gray-200/60 dark:bg-white/10
                text-gray-700 dark:text-gray-300
                text-xs font-medium"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-200/60 dark:border-white/[0.06]">
                {/* Presets */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PERSONA_PRESETS.map((preset) => {
                      const isActive = config.name === preset.config.name;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            transition-all duration-150
                            ${
                              isActive
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                          <span>{preset.name}</span>
                          {isActive && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Assistant"
                    className="w-full px-3 py-2 rounded-xl text-sm
                      bg-white dark:bg-[#2a2a2b]
                      border border-gray-200 dark:border-white/10
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500
                      transition-all"
                  />
                </div>

                {/* Instructions Textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Custom Instructions
                  </label>
                  <textarea
                    value={config.instructions}
                    onChange={(e) => handleChange('instructions', e.target.value)}
                    placeholder="Tell the AI how to behave, what to focus on, or any specific guidelines..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl text-sm resize-none
                      bg-white dark:bg-[#2a2a2b]
                      border border-gray-200 dark:border-white/10
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500
                      transition-all"
                  />
                </div>

                {/* Tone & Language Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Tone Select */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Tone
                    </label>
                    <button
                      onClick={() => {
                        setShowToneSelect(!showToneSelect);
                        setShowLanguageSelect(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm
                        bg-white dark:bg-[#2a2a2b]
                        border border-gray-200 dark:border-white/10
                        text-gray-900 dark:text-white
                        hover:border-gray-300 dark:hover:border-white/20
                        transition-all"
                    >
                      <span className="text-sm">{currentTone?.label}</span>
                      <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${showToneSelect ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Tone Dropdown - Opens upward */}
                    <AnimatePresence>
                      {showToneSelect && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 bottom-full left-0 right-0 mb-1
                            bg-white dark:bg-[#2a2a2b]
                            border border-gray-200 dark:border-white/10
                            rounded-xl shadow-xl overflow-hidden"
                        >
                          {TONE_OPTIONS.map((tone) => (
                            <button
                              key={tone.value}
                              onClick={() => {
                                handleChange('tone', tone.value);
                                setShowToneSelect(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                                hover:bg-gray-50 dark:hover:bg-white/5 transition-colors
                                ${
                                  config.tone === tone.value
                                    ? 'bg-gray-100 dark:bg-white/10'
                                    : ''
                                }`}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {tone.label}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {tone.description}
                                </p>
                              </div>
                              {config.tone === tone.value && (
                                <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Language Select */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Language
                    </label>
                    <button
                      onClick={() => {
                        setShowLanguageSelect(!showLanguageSelect);
                        setShowToneSelect(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm
                        bg-white dark:bg-[#2a2a2b]
                        border border-gray-200 dark:border-white/10
                        text-gray-900 dark:text-white
                        hover:border-gray-300 dark:hover:border-white/20
                        transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">{currentLanguage?.label}</span>
                      </span>
                      <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${showLanguageSelect ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Language Dropdown - Opens upward */}
                    <AnimatePresence>
                      {showLanguageSelect && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 bottom-full left-0 right-0 mb-1
                            bg-white dark:bg-[#2a2a2b]
                            border border-gray-200 dark:border-white/10
                            rounded-xl shadow-xl overflow-hidden"
                        >
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <button
                              key={lang.value}
                              onClick={() => {
                                handleChange('language', lang.value);
                                setShowLanguageSelect(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                                hover:bg-gray-50 dark:hover:bg-white/5 transition-colors
                                ${
                                  config.language === lang.value
                                    ? 'bg-gray-100 dark:bg-white/10'
                                    : ''
                                }`}
                            >
                              <span className="font-medium text-gray-900 dark:text-white flex-1 text-sm">
                                {lang.label}
                              </span>
                              {config.language === lang.value && (
                                <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 dark:text-gray-400 
                      hover:text-gray-700 dark:hover:text-gray-200
                      transition-colors"
                  >
                    Reset to default
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

