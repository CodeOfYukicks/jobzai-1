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

// Premium Toggle Switch Component with glow effect
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
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0a0a0b]
        ${enabled 
          ? 'bg-[#635BFF] shadow-[0_0_20px_rgba(99,91,255,0.4)]' 
          : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15'}
      `}
      role="switch"
      aria-checked={enabled}
    >
      <motion.span
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg
          transition-colors duration-200
          ${enabled ? 'bg-white' : 'bg-white dark:bg-white/80'}
        `}
        style={{ marginTop: 2 }}
      />
    </button>
  );
}

// Premium Slider Component with tick marks
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
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => 
    Math.round(min + (i * (max - min)) / (tickCount - 1))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-600 dark:text-white/60">
          {label}
        </span>
        <span className="text-[13px] font-semibold text-[#635BFF] tabular-nums">
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
          className="w-full h-1 rounded-full appearance-none cursor-pointer premium-slider relative z-10"
          style={{
            background: `linear-gradient(to right, #635BFF 0%, #635BFF ${percentage}%, var(--slider-track-bg, rgba(229, 231, 235, 1)) ${percentage}%, var(--slider-track-bg, rgba(229, 231, 235, 1)) 100%)`,
          }}
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-2 px-0.5">
          {ticks.map((tick, i) => (
            <span 
              key={i} 
              className={`text-[10px] tabular-nums ${
                tick <= value ? 'text-[#635BFF]/70' : 'text-gray-400 dark:text-white/30'
              }`}
            >
              {tick}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Premium Multi-select Chips with checkmarks
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
    <div className="space-y-2.5">
      <span className="text-[13px] font-medium text-gray-600 dark:text-white/60">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium 
                transition-all duration-200 ease-out border
                ${isSelected
                  ? 'bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff] border-[#635BFF]/40 shadow-[0_0_12px_rgba(99,91,255,0.2)]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }
              `}
            >
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Check className="w-3 h-3" />
                </motion.span>
              )}
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Rule Category Header
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
      className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-100 dark:from-white/[0.03] to-transparent hover:from-gray-200 dark:hover:from-white/[0.06] transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#635BFF]/20 to-[#635BFF]/5 flex items-center justify-center border border-[#635BFF]/20">
          <Icon className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff] rounded-full">
                {activeCount} active
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 dark:text-white/40 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 group-hover:text-gray-600 dark:group-hover:text-white/60"
      >
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </button>
  );
}

// Individual Rule Card
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-xl border transition-all duration-300 overflow-hidden
        ${enabled 
          ? 'bg-[#635BFF]/[0.08] border-[#635BFF]/30' 
          : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.1]'
        }
      `}
    >
      {/* Active indicator bar */}
      {enabled && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#635BFF] to-[#8b85ff]"
        />
      )}
      
      <div className="p-5 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
              ${enabled 
                ? 'bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff]' 
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40'
              }
              transition-colors duration-200
            `}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-medium text-gray-900 dark:text-white tracking-tight">
                {title}
              </h4>
              <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-relaxed">
                {description}
              </p>
              
              {/* Preview badge */}
              {enabled && preview !== undefined && preview > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#635BFF]/10 border border-[#635BFF]/20"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#635BFF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#635BFF]"></span>
                  </span>
                  <span className="text-[11px] font-medium text-[#635BFF] dark:text-[#a5a0ff]">
                    {preview} {previewLabel}
                  </span>
                </motion.div>
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
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-white/[0.06] space-y-5">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
          {/* Premium Slider Styles */}
          <style>{`
            :root {
              --slider-track-bg: rgba(229, 231, 235, 1);
            }
            .dark {
              --slider-track-bg: rgba(255, 255, 255, 0.1);
            }
            .premium-slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #635BFF;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(99, 91, 255, 0.5), 0 0 0 3px rgba(99, 91, 255, 0.2);
              transition: all 0.2s ease-out;
            }
            .premium-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 4px 12px rgba(99, 91, 255, 0.6), 0 0 0 4px rgba(99, 91, 255, 0.25);
            }
            .premium-slider::-webkit-slider-thumb:active {
              transform: scale(1.1);
            }
            .premium-slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #635BFF;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 8px rgba(99, 91, 255, 0.5), 0 0 0 3px rgba(99, 91, 255, 0.2);
              transition: all 0.2s ease-out;
            }
            .premium-slider::-moz-range-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 4px 12px rgba(99, 91, 255, 0.6), 0 0 0 4px rgba(99, 91, 255, 0.25);
            }
          `}</style>

          {/* Premium Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50"
          />

          {/* Premium Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="w-full max-w-2xl bg-white/95 dark:bg-[#0f0f10]/95 backdrop-blur-2xl rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-white/[0.08]"
            >
              {/* Premium Header */}
              <div className="relative px-6 py-5 border-b border-gray-200 dark:border-white/[0.06]">
                {/* Subtle gradient glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#635BFF]/5 via-transparent to-transparent" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#635BFF]/30 to-[#635BFF]/10 flex items-center justify-center border border-[#635BFF]/20 shadow-lg shadow-[#635BFF]/10">
                      <Sparkles className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white tracking-tight">
                          Automation
                        </h2>
                        {getActiveRulesCount() > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-[#635BFF]/20 text-[#635BFF] dark:text-[#a5a0ff] rounded-full border border-[#635BFF]/30"
                          >
                            {getActiveRulesCount()} active
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-white/40 mt-0.5">
                        Automate your job application workflow
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors duration-200"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  
                  {/* Status Management Category */}
                  <div className="space-y-3">
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
                          transition={{ duration: 0.3 }}
                          className="space-y-3 pl-1"
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
                  <div className="space-y-3">
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
                          transition={{ duration: 0.3 }}
                          className="space-y-3 pl-1"
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
                  <div className="space-y-3">
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
                          transition={{ duration: 0.3 }}
                          className="space-y-3 pl-1"
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

              {/* Premium Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-black/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 text-[13px] font-semibold text-white bg-[#635BFF] hover:bg-[#5249e6] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#635BFF]/25 hover:shadow-[#635BFF]/40"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Saving
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
