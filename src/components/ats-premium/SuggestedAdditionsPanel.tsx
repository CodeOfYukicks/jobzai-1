import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Sparkles,
  Target,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedAddition {
  bullet: string;
  reason: string;
  target_experience_id: string;
  target_experience_title: string;
  priority: 'high' | 'medium' | 'low';
}

interface SuggestedAdditionsData {
  description?: string;
  items: SuggestedAddition[];
  note?: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
}

interface SuggestedAdditionsPanelProps {
  suggestedAdditions: SuggestedAdditionsData | null | undefined;
  experiences: Experience[];
  onAddToExperience?: (experienceId: string, bullet: string) => void;
}

// Priority badge component
const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800/50',
      label: 'High Priority'
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/50',
      label: 'Medium'
    },
    low: {
      bg: 'bg-gray-50 dark:bg-gray-800/40',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700/50',
      label: 'Nice to have'
    }
  };

  const { bg, text, border, label } = config[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
};

// Single suggestion card
const SuggestionCard = ({
  suggestion,
  onCopy,
  onAdd,
  copiedId
}: {
  suggestion: SuggestedAddition;
  onCopy: (id: string, text: string) => void;
  onAdd?: (experienceId: string, bullet: string) => void;
  copiedId: string | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bulletId = `${suggestion.target_experience_id}-${suggestion.bullet.slice(0, 20)}`;
  const isCopied = copiedId === bulletId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <PriorityBadge priority={suggestion.priority} />
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {suggestion.target_experience_title}
            </span>
          </div>
          
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-2">
            {suggestion.bullet}
          </p>
        </div>

        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700/50">
              {/* Why it matters */}
              <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    Why this matters for the job
                  </span>
                </div>
                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {suggestion.reason}
                </p>
              </div>

              {/* Full bullet text */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Suggested bullet point
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {suggestion.bullet}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(bulletId, suggestion.bullet);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isCopied
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to clipboard
                    </>
                  )}
                </button>
                
                {onAdd && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(suggestion.target_experience_id, suggestion.bullet);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to experience
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Experience group
const ExperienceGroup = ({
  experienceId,
  experienceTitle,
  suggestions,
  onCopy,
  onAdd,
  copiedId
}: {
  experienceId: string;
  experienceTitle: string;
  suggestions: SuggestedAddition[];
  onCopy: (id: string, text: string) => void;
  onAdd?: (experienceId: string, bullet: string) => void;
  copiedId: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-3">
      {/* Experience header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {experienceTitle}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 pl-4"
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={`${suggestion.target_experience_id}-${index}`}
                suggestion={suggestion}
                onCopy={onCopy}
                onAdd={onAdd}
                copiedId={copiedId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SuggestedAdditionsPanel({
  suggestedAdditions,
  experiences,
  onAddToExperience
}: SuggestedAdditionsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group suggestions by experience
  const suggestionsByExperience = useMemo(() => {
    if (!suggestedAdditions?.items?.length) return new Map<string, SuggestedAddition[]>();

    const grouped = new Map<string, SuggestedAddition[]>();
    
    suggestedAdditions.items.forEach((item) => {
      const existing = grouped.get(item.target_experience_id) || [];
      grouped.set(item.target_experience_id, [...existing, item]);
    });

    return grouped;
  }, [suggestedAdditions]);

  // Handle copy
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // No suggestions
  if (!suggestedAdditions?.items?.length) {
    return null;
  }

  const totalSuggestions = suggestedAdditions.items.length;
  const highPriorityCount = suggestedAdditions.items.filter(i => i.priority === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-100">AI Suggestions</p>
              <p className="text-2xl font-bold">{totalSuggestions} bullet{totalSuggestions > 1 ? 's' : ''} to add</p>
            </div>
          </div>
          <p className="text-sm text-indigo-100 leading-relaxed">
            {highPriorityCount > 0 && (
              <span className="font-semibold">{highPriorityCount} high priority. </span>
            )}
            These additions will strengthen your match with the job requirements.
          </p>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      </div>

      {/* Description */}
      {suggestedAdditions.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {suggestedAdditions.description}
        </p>
      )}

      {/* Suggestions grouped by experience */}
      <div className="space-y-4">
        {Array.from(suggestionsByExperience.entries()).map(([expId, suggestions]) => (
          <ExperienceGroup
            key={expId}
            experienceId={expId}
            experienceTitle={suggestions[0]?.target_experience_title || 'Unknown Experience'}
            suggestions={suggestions}
            onCopy={handleCopy}
            onAdd={onAddToExperience}
            copiedId={copiedId}
          />
        ))}
      </div>

      {/* Note */}
      {suggestedAdditions.note && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <span className="font-semibold">Note:</span> {suggestedAdditions.note}
          </p>
        </div>
      )}
    </div>
  );
}
