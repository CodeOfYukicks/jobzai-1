import React, { useState } from 'react';
import { FileEdit, Copy, Check, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import type { CVFixes } from '../../types/premiumATS';
import { toast } from 'sonner';

interface CVFixesPanelProps {
  cvFixes: CVFixes;
}

interface FixSectionProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  defaultOpen?: boolean;
}

function FixSection({ title, items, icon, defaultOpen = false }: FixSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (items.length === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900 dark:text-white">
            {title}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
            {items.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-3 bg-white dark:bg-[#1A1A1D]">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {index + 1}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {item}
              </p>
              <button
                onClick={() => handleCopy(item, index)}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CVFixesPanel({ cvFixes }: CVFixesPanelProps) {
  return (
    <div className="space-y-6">
      {/* Score Gain Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-100">Potential Score Improvement</p>
              <p className="text-4xl font-bold">+{cvFixes.estimated_score_gain} points</p>
            </div>
          </div>
          <p className="text-sm text-indigo-100 leading-relaxed">
            By implementing these CV improvements, you could significantly increase your match score and ATS performance.
          </p>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      {/* Fix Sections */}
      <div className="space-y-4">
        <FixSection
          title="High-Impact Bullets to Add"
          items={cvFixes.high_impact_bullets_to_add}
          icon={<FileEdit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          defaultOpen={true}
        />
        
        <FixSection
          title="Bullets to Rewrite"
          items={cvFixes.bullets_to_rewrite}
          icon={<FileEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        />
        
        <FixSection
          title="Keywords to Insert"
          items={cvFixes.keywords_to_insert}
          icon={<FileEdit className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        />
        
        <FixSection
          title="Sections to Reorder"
          items={cvFixes.sections_to_reorder}
          icon={<FileEdit className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        />
      </div>
    </div>
  );
}

