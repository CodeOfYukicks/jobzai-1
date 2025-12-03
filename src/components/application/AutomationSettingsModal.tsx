import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Info } from 'lucide-react';
import { AutomationSettings, defaultAutomationSettings, JobApplication } from '../../types/job';
import { getAutomationPreview } from '../../lib/automationEngine';

interface AutomationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AutomationSettings;
  onSave: (settings: AutomationSettings) => Promise<void>;
  applications: JobApplication[];
}

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'pending_decision', label: 'Pending Decision' },
] as const;

const statusOptionsNoResponse = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
] as const;

// Premium Toggle Switch Component - iOS style
function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-[15px] font-medium text-neutral-900 dark:text-white cursor-pointer tracking-tight">
          {label}
        </label>
        {description && (
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full
          transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:ring-offset-2
          ${enabled ? 'bg-[#635BFF]' : 'bg-neutral-200 dark:bg-white/10'}
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm
            transition-all duration-200 ease-out m-0.5
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

// Premium Slider Component
function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit = 'days',
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 tracking-tight">
          {label}
        </label>
        <span className="text-[14px] font-semibold text-[#635BFF] dark:text-[#a5a0ff]">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer premium-slider"
        style={{
          background: `linear-gradient(to right, #635BFF 0%, #635BFF ${percentage}%, rgba(229, 231, 235, 0.3) ${percentage}%, rgba(229, 231, 235, 0.3) 100%)`,
        }}
      />
      <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// Premium Multi-select Tags Component
function MultiSelectCheckboxes({
  options,
  selected,
  onChange,
  label,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2.5">
      <label className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 tracking-tight">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={`
                px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ease-out
                border
                ${
                  isSelected
                    ? 'bg-[#635BFF]/10 text-[#635BFF] dark:text-[#a5a0ff] border-[#635BFF]/20 dark:border-[#a5a0ff]/30'
                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AutomationSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  applications,
}: AutomationSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AutomationSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(getAutomationPreview(applications, localSettings));

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    setPreview(getAutomationPreview(applications, localSettings));
  }, [applications, localSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } catch (error) {
      console.error('Error saving automation settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultAutomationSettings);
  };

  const getActiveRulesCount = () => {
    let count = 0;
    if (localSettings.autoRejectDays.enabled) count++;
    if (localSettings.autoArchiveRejected.enabled) count++;
    if (localSettings.autoMoveToInterview.enabled) count++;
    if (localSettings.inactiveReminder.enabled) count++;
    if (localSettings.autoMoveToPendingDecision.enabled) count++;
    if (localSettings.autoRejectNoResponse.enabled) count++;
    return count;
  };

  const rules = [
    {
      id: 'autoRejectDays',
      title: 'Auto-reject after days in same column',
      description: "Automatically move applications to rejected after they've been in the same column for a specified number of days.",
      toggleLabel: 'Enable auto-reject',
      enabled: localSettings.autoRejectDays.enabled,
      preview: preview.autoRejectDays,
      previewLabel: 'applications will be affected',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          autoRejectDays: { ...localSettings.autoRejectDays, enabled },
        }),
      children: localSettings.autoRejectDays.enabled && (
        <div className="space-y-5 pt-4 border-t border-neutral-200 dark:border-white/10">
          <Slider
            value={localSettings.autoRejectDays.days}
            onChange={(days) =>
              setLocalSettings({
                ...localSettings,
                autoRejectDays: { ...localSettings.autoRejectDays, days },
              })
            }
            min={5}
            max={90}
            label="Days threshold"
          />
          <MultiSelectCheckboxes
            options={statusOptions}
            selected={localSettings.autoRejectDays.applyTo}
            onChange={(applyTo) =>
              setLocalSettings({
                ...localSettings,
                autoRejectDays: {
                  ...localSettings.autoRejectDays,
                  applyTo: applyTo as typeof localSettings.autoRejectDays.applyTo,
                },
              })
            }
            label="Apply to columns"
          />
        </div>
      ),
    },
    {
      id: 'autoArchiveRejected',
      title: 'Auto-archive rejected applications',
      description: 'Automatically archive applications that have been rejected for a specified number of days.',
      toggleLabel: 'Enable auto-archive',
      enabled: localSettings.autoArchiveRejected.enabled,
      preview: preview.autoArchiveRejected,
      previewLabel: 'applications will be affected',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          autoArchiveRejected: { ...localSettings.autoArchiveRejected, enabled },
        }),
      children: localSettings.autoArchiveRejected.enabled && (
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
          <Slider
            value={localSettings.autoArchiveRejected.days}
            onChange={(days) =>
              setLocalSettings({
                ...localSettings,
                autoArchiveRejected: { ...localSettings.autoArchiveRejected, days },
              })
            }
            min={7}
            max={180}
            label="Days threshold"
          />
        </div>
      ),
    },
    {
      id: 'autoMoveToInterview',
      title: 'Auto-move to interview when scheduled',
      description: 'Automatically move applications to the interview column when an interview is scheduled.',
      toggleLabel: 'Enable auto-move to interview',
      enabled: localSettings.autoMoveToInterview.enabled,
      preview: preview.autoMoveToInterview,
      previewLabel: 'applications will be affected',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          autoMoveToInterview: { enabled },
        }),
      children: null,
    },
    {
      id: 'inactiveReminder',
      title: 'Inactive reminder badge',
      description: "Show a visual badge on applications that haven't been updated for a specified number of days.",
      toggleLabel: 'Enable inactive reminder',
      enabled: localSettings.inactiveReminder.enabled,
      preview: preview.inactiveReminder,
      previewLabel: 'applications will show badge',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          inactiveReminder: { ...localSettings.inactiveReminder, enabled },
        }),
      children: localSettings.inactiveReminder.enabled && (
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
          <Slider
            value={localSettings.inactiveReminder.days}
            onChange={(days) =>
              setLocalSettings({
                ...localSettings,
                inactiveReminder: { ...localSettings.inactiveReminder, days },
              })
            }
            min={7}
            max={60}
            label="Days threshold"
          />
        </div>
      ),
    },
    {
      id: 'autoMoveToPendingDecision',
      title: 'Auto-move to pending decision after interviews',
      description: 'Automatically move applications to pending decision after completing a specified number of interviews.',
      toggleLabel: 'Enable auto-move to pending',
      enabled: localSettings.autoMoveToPendingDecision.enabled,
      preview: preview.autoMoveToPendingDecision,
      previewLabel: 'applications will be affected',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          autoMoveToPendingDecision: {
            ...localSettings.autoMoveToPendingDecision,
            enabled,
          },
        }),
      children: localSettings.autoMoveToPendingDecision.enabled && (
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
          <Slider
            value={localSettings.autoMoveToPendingDecision.interviewCount}
            onChange={(interviewCount) =>
              setLocalSettings({
                ...localSettings,
                autoMoveToPendingDecision: {
                  ...localSettings.autoMoveToPendingDecision,
                  interviewCount,
                },
              })
            }
            min={1}
            max={5}
            step={1}
            label="Completed interviews required"
            unit="interviews"
          />
        </div>
      ),
    },
    {
      id: 'autoRejectNoResponse',
      title: 'Auto-reject if no response',
      description: "Automatically reject applications that haven't had any activity for a specified number of days.",
      toggleLabel: 'Enable auto-reject no response',
      enabled: localSettings.autoRejectNoResponse.enabled,
      preview: preview.autoRejectNoResponse,
      previewLabel: 'applications will be affected',
      onToggle: (enabled: boolean) =>
        setLocalSettings({
          ...localSettings,
          autoRejectNoResponse: { ...localSettings.autoRejectNoResponse, enabled },
        }),
      children: localSettings.autoRejectNoResponse.enabled && (
        <div className="space-y-5 pt-4 border-t border-neutral-200 dark:border-white/10">
          <Slider
            value={localSettings.autoRejectNoResponse.days}
            onChange={(days) =>
              setLocalSettings({
                ...localSettings,
                autoRejectNoResponse: {
                  ...localSettings.autoRejectNoResponse,
                  days,
                },
              })
            }
            min={14}
            max={90}
            label="Days threshold"
          />
          <MultiSelectCheckboxes
            options={statusOptionsNoResponse}
            selected={localSettings.autoRejectNoResponse.applyTo}
            onChange={(applyTo) =>
              setLocalSettings({
                ...localSettings,
                autoRejectNoResponse: {
                  ...localSettings.autoRejectNoResponse,
                  applyTo: applyTo as typeof localSettings.autoRejectNoResponse.applyTo,
                },
              })
            }
            label="Apply to columns"
          />
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Premium Slider Styles */}
          <style>{`
            .premium-slider::-webkit-slider-thumb {
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #635BFF;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(99, 91, 255, 0.3);
              transition: all 0.2s ease-out;
            }
            .premium-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 8px rgba(99, 91, 255, 0.4);
            }
            .premium-slider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #635BFF;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(99, 91, 255, 0.3);
              transition: all 0.2s ease-out;
            }
            .premium-slider::-moz-range-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 8px rgba(99, 91, 255, 0.4);
            }
            .dark .premium-slider::-webkit-slider-thumb {
              background: #a5a0ff;
              box-shadow: 0 2px 4px rgba(165, 160, 255, 0.3);
            }
            .dark .premium-slider::-moz-range-thumb {
              background: #a5a0ff;
              box-shadow: 0 2px 4px rgba(165, 160, 255, 0.3);
            }
          `}</style>

          {/* Premium Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
          />

          {/* Premium Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Premium Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[22px] font-semibold text-neutral-900 dark:text-white tracking-tight">
                      Automation Settings
                    </h2>
                    {getActiveRulesCount() > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#635BFF]/10 dark:bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff] rounded-full tracking-tight"
                      >
                        {getActiveRulesCount()} active
                      </motion.span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 ease-out"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </button>
              </div>

              {/* Premium Body with Stagger Animation */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="space-y-4">
                  {rules.map((rule, index) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] px-6 py-5 hover:bg-neutral-50/50 dark:hover:bg-white/[0.03] transition-colors duration-200 ease-out"
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-white tracking-tight mb-1.5">
                            {rule.title}
                          </h3>
                          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {rule.description}
                          </p>
                          {rule.enabled && rule.preview > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#635BFF] dark:text-[#a5a0ff]"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>
                                {rule.preview} {rule.previewLabel}
                              </span>
                            </motion.div>
                          )}
                        </div>
                        <ToggleSwitch
                          enabled={rule.enabled}
                          onChange={rule.onToggle}
                          label={rule.toggleLabel}
                        />
                        {rule.children && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {rule.children}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Premium Footer */}
              <div className="px-8 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 ease-out"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to defaults
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 ease-out"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2 text-[13px] font-semibold text-white bg-[#635BFF] hover:bg-[#5249e6] dark:bg-[#635BFF] dark:hover:bg-[#7c75ff] rounded-lg transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md shadow-[#635BFF]/20"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
