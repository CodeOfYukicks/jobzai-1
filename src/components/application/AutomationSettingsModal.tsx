import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  RotateCcw, 
  Clock, 
  Archive, 
  CalendarCheck, 
  Bell, 
  CheckCircle2, 
  XCircle,
  ArrowRightCircle,
  FolderArchive,
  ChevronDown,
  ChevronRight,
  Check,
  Sparkles,
  LucideIcon
} from 'lucide-react';
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

// Notion-style Toggle Switch Component - Clean & Minimal
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
        transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#b7e219]/20 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1a1a]
        ${enabled 
          ? 'bg-[#b7e219]' 
          : 'bg-gray-200 dark:bg-[#3a3a3a] hover:bg-gray-250 dark:hover:bg-[#404040]'}
      `}
      role="switch"
      aria-checked={enabled}
    >
      <motion.span
        animate={{ x: enabled ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className="pointer-events-none inline-block h-4 w-4 mt-0.5 transform rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

// Notion-style Slider Component - Clean & Minimal
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-[#9b9b9b]">
          {label}
        </span>
        <span className="text-xs font-medium text-gray-900 dark:text-white tabular-nums px-2 py-0.5 bg-gray-100 dark:bg-[#2a2a2a] rounded">
          {value} {unit}
        </span>
      </div>
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer notion-slider relative z-10"
          style={{
            background: `linear-gradient(to right, #b7e219 0%, #b7e219 ${percentage}%, var(--slider-track-bg, rgba(229, 231, 235, 1)) ${percentage}%, var(--slider-track-bg, rgba(229, 231, 235, 1)) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

// Notion-style Multi-select Chips - Clean & Minimal
function MultiSelectChips({
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
    <div className="space-y-2">
      <span className="text-xs text-gray-600 dark:text-[#9b9b9b]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={`
                inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium 
                transition-all duration-150
                ${isSelected
                  ? 'bg-[#b7e219]/15 text-gray-900 dark:text-white border border-[#b7e219]/30'
                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#9b9b9b] border border-transparent hover:bg-gray-150 dark:hover:bg-[#303030]'
                }
              `}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Notion-style Category Header - Clean & Minimal
function CategoryHeader({
  icon: Icon,
  title,
  description,
  activeCount,
  isExpanded,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  activeCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 py-2 hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-all duration-150 group"
    >
      <div className="flex items-center gap-2.5">
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-gray-400 dark:text-[#6b6b6b]"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <Icon className="w-4 h-4 text-gray-600 dark:text-[#9b9b9b]" />
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#b7e219]/15 text-gray-900 dark:text-white rounded">
                {activeCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// Notion-style Rule Card - Clean & Minimal
function RuleCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  preview,
  previewLabel,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  preview?: number;
  previewLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`
        rounded-lg border transition-all duration-150 overflow-hidden
        ${enabled 
          ? 'bg-gray-50/50 dark:bg-[#202020] border-gray-200 dark:border-[#303030]' 
          : 'bg-transparent border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50/30 dark:hover:bg-[#1f1f1f]'
        }
      `}
    >
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${enabled ? 'text-gray-700 dark:text-[#b7e219]' : 'text-gray-400 dark:text-[#6b6b6b]'}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-[#9b9b9b] mt-0.5 leading-relaxed">
                {description}
              </p>
              
              {/* Preview badge */}
              {enabled && preview !== undefined && preview > 0 && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#b7e219]/10 border border-[#b7e219]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b7e219]"></span>
                  <span className="text-[10px] font-medium text-gray-900 dark:text-white">
                    {preview} {previewLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <ToggleSwitch enabled={enabled} onChange={onToggle} />
        </div>
        
        {/* Expandable options */}
        <AnimatePresence>
          {enabled && children && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2a2a2a] space-y-3">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    status: true,
    cleanup: true,
    reminders: true,
  });

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

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
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

  const getStatusCategoryActiveCount = () => {
    let count = 0;
    if (localSettings.autoRejectDays.enabled) count++;
    if (localSettings.autoMoveToInterview.enabled) count++;
    if (localSettings.autoMoveToPendingDecision.enabled) count++;
    return count;
  };

  const getCleanupCategoryActiveCount = () => {
    let count = 0;
    if (localSettings.autoArchiveRejected.enabled) count++;
    if (localSettings.autoRejectNoResponse.enabled) count++;
    return count;
  };

  const getRemindersCategoryActiveCount = () => {
    return localSettings.inactiveReminder.enabled ? 1 : 0;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Notion-style Slider Styles */}
          <style>{`
            :root {
              --slider-track-bg: rgba(229, 231, 235, 1);
            }
            .dark {
              --slider-track-bg: rgba(58, 58, 58, 1);
            }
            .notion-slider::-webkit-slider-thumb {
              appearance: none;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: 2px solid #b7e219;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              transition: all 0.15s ease-out;
            }
            .notion-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            }
            .notion-slider::-moz-range-thumb {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: 2px solid #b7e219;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              transition: all 0.15s ease-out;
            }
            .notion-slider::-moz-range-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-[#2a2a2a]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#b7e219]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          Automation
                        </h2>
                        {getActiveRulesCount() > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#b7e219]/15 text-gray-900 dark:text-white rounded">
                            {getActiveRulesCount()} active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#9b9b9b] mt-0.5">
                        Automate your workflow
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-md transition-colors duration-150"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-[#9b9b9b]" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-4">
                  
                  {/* Status Management Category */}
                  <div className="space-y-2">
                    <CategoryHeader
                      icon={ArrowRightCircle}
                      title="Status Management"
                      description="Automatically move applications between columns"
                      activeCount={getStatusCategoryActiveCount()}
                      isExpanded={expandedCategories.status}
                      onToggle={() => toggleCategory('status')}
                    />
                    
                    <AnimatePresence>
                      {expandedCategories.status && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 pl-6"
                        >
                          {/* Auto-reject after days */}
                          <RuleCard
                            icon={Clock}
                            title="Auto-reject after days"
                            description="Move applications to rejected after being in the same column"
                            enabled={localSettings.autoRejectDays.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                autoRejectDays: { ...localSettings.autoRejectDays, enabled },
                              })
                            }
                            preview={preview.autoRejectDays}
                            previewLabel="will be affected"
                          >
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
                            <MultiSelectChips
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
                          </RuleCard>

                          {/* Auto-move to interview */}
                          <RuleCard
                            icon={CalendarCheck}
                            title="Auto-move to interview"
                            description="Move applications to interview column when scheduled"
                            enabled={localSettings.autoMoveToInterview.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                autoMoveToInterview: { enabled },
                              })
                            }
                            preview={preview.autoMoveToInterview}
                            previewLabel="will be affected"
                          />

                          {/* Auto-move to pending decision */}
                          <RuleCard
                            icon={CheckCircle2}
                            title="Auto-move to pending decision"
                            description="Move to pending after completing interviews"
                            enabled={localSettings.autoMoveToPendingDecision.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                autoMoveToPendingDecision: {
                                  ...localSettings.autoMoveToPendingDecision,
                                  enabled,
                                },
                              })
                            }
                            preview={preview.autoMoveToPendingDecision}
                            previewLabel="will be affected"
                          >
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
                              label="Interviews required"
                              unit="interviews"
                            />
                          </RuleCard>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Cleanup & Archiving Category */}
                  <div className="space-y-2">
                    <CategoryHeader
                      icon={FolderArchive}
                      title="Cleanup & Archiving"
                      description="Keep your board organized automatically"
                      activeCount={getCleanupCategoryActiveCount()}
                      isExpanded={expandedCategories.cleanup}
                      onToggle={() => toggleCategory('cleanup')}
                    />
                    
                    <AnimatePresence>
                      {expandedCategories.cleanup && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 pl-6"
                        >
                          {/* Auto-archive rejected */}
                          <RuleCard
                            icon={Archive}
                            title="Auto-archive rejected"
                            description="Archive applications after being rejected"
                            enabled={localSettings.autoArchiveRejected.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                autoArchiveRejected: { ...localSettings.autoArchiveRejected, enabled },
                              })
                            }
                            preview={preview.autoArchiveRejected}
                            previewLabel="will be affected"
                          >
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
                          </RuleCard>

                          {/* Auto-reject no response */}
                          <RuleCard
                            icon={XCircle}
                            title="Auto-reject no response"
                            description="Reject applications with no activity"
                            enabled={localSettings.autoRejectNoResponse.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                autoRejectNoResponse: { ...localSettings.autoRejectNoResponse, enabled },
                              })
                            }
                            preview={preview.autoRejectNoResponse}
                            previewLabel="will be affected"
                          >
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
                            <MultiSelectChips
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
                          </RuleCard>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Reminders Category */}
                  <div className="space-y-2">
                    <CategoryHeader
                      icon={Bell}
                      title="Reminders"
                      description="Visual indicators for attention"
                      activeCount={getRemindersCategoryActiveCount()}
                      isExpanded={expandedCategories.reminders}
                      onToggle={() => toggleCategory('reminders')}
                    />
                    
                    <AnimatePresence>
                      {expandedCategories.reminders && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 pl-6"
                        >
                          {/* Inactive reminder */}
                          <RuleCard
                            icon={Bell}
                            title="Inactive reminder badge"
                            description="Show badge on stale applications"
                            enabled={localSettings.inactiveReminder.enabled}
                            onToggle={(enabled) =>
                              setLocalSettings({
                                ...localSettings,
                                inactiveReminder: { ...localSettings.inactiveReminder, enabled },
                              })
                            }
                            preview={preview.inactiveReminder}
                            previewLabel="will show badge"
                          >
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
                          </RuleCard>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1f1f1f] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9b9b9b] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252525] rounded-md transition-all duration-150"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#9b9b9b] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252525] rounded-md transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-[#9fc015]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border-2 border-gray-900/30 border-t-gray-900 rounded-full"
                        />
                        Saving
                      </span>
                    ) : (
                      'Save Changes'
                    )}
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
