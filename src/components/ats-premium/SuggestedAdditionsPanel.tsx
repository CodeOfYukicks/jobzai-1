import { useState, useMemo } from 'react';
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
  Target
} from 'lucide-react';
import { notify } from '@/lib/notify';

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

// Priority badge component - Compact
const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: {
      bg: 'bg-red-100 dark:bg-red-950/40',
      text: 'text-red-600 dark:text-red-400',
      label: 'High'
    },
    medium: {
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      label: 'Medium'
    },
    low: {
      bg: 'bg-gray-100 dark:bg-[#3d3c3e]',
      text: 'text-gray-500 dark:text-gray-400',
      label: 'Low'
    }
  };

  const { bg, text, label } = config[priority];

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded ${bg} ${text}`}>
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
      className="group relative bg-white dark:bg-[#2b2a2c] rounded-lg border border-gray-200 dark:border-[#3d3c3e] hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-2.5 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
          <Lightbulb className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <PriorityBadge priority={suggestion.priority} />
          </div>
          
          <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
            {suggestion.bullet}
          </p>
        </div>

        <div className="flex-shrink-0">
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
            <div className="px-3 pb-3 pt-0 border-t border-gray-100 dark:border-[#3d3c3e]">
              {/* Why it matters */}
              <div className="mt-2.5 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                    Why this matters
                  </span>
                </div>
                <p className="text-[10px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  {suggestion.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(bulletId, suggestion.bullet);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                    isCopied
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
                
                {onAdd && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(suggestion.target_experience_id, suggestion.bullet);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
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
    <div className="space-y-2">
      {/* Experience header - Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-[#242325] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2b2a2c] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
              {experienceTitle}
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {/* Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-1.5 pl-3"
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
    notify.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // No suggestions
  if (!suggestedAdditions?.items?.length) {
    return null;
  }

  const totalSuggestions = suggestedAdditions.items.length;
  const highPriorityCount = suggestedAdditions.items.filter(i => i.priority === 'high').length;

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {totalSuggestions} Suggestions
            </span>
            {highPriorityCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {highPriorityCount} priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions grouped by experience */}
      <div className="space-y-3">
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
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <span className="font-medium">Note:</span> {suggestedAdditions.note}
        </p>
      )}
    </div>
  );
}
