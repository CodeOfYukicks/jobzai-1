import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Copy, Globe, Eye, EyeOff,
  CheckCircle, ChevronDown, PenTool
} from 'lucide-react';
import { TemplateType } from './PreviewPanel';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
}

const TEMPLATES: Template[] = [
  { id: 'tech_minimalist', name: 'Tech Minimalist', description: 'Google/Linear' },
  { id: 'harvard', name: 'Harvard', description: 'Traditional' },
  { id: 'notion', name: 'Notion', description: 'Clear hierarchy' },
  { id: 'apple', name: 'Apple', description: 'Ultra-clean' },
  { id: 'consulting', name: 'Consulting', description: 'Metrics-first' },
  { id: 'ats_boost', name: 'Modern ATS', description: 'Keyword-optimized' },
];

interface TopBarProps {
  jobTitle: string;
  company: string;
  selectedTemplate: TemplateType;
  onTemplateChange: (template: TemplateType) => void;
  currentLanguage: 'en' | 'fr';
  onTranslate: () => void;
  onDownloadPDF: () => void;
  onCopy: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onBack: () => void;
  isCopied: boolean;
  isTranslating: boolean;
}

export default function TopBar({
  jobTitle,
  company,
  selectedTemplate,
  onTemplateChange,
  currentLanguage,
  onTranslate,
  onDownloadPDF,
  onCopy,
  showPreview,
  onTogglePreview,
  onBack,
  isCopied,
  isTranslating,
}: TopBarProps) {
  return (
    <div className="bg-white/95 dark:bg-[#1A1A1D]/95 border-b border-gray-200/80 dark:border-gray-800/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1800px] mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-5">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="h-7 w-px bg-gray-200 dark:bg-gray-700" />
            
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">CV Rewrite</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {jobTitle} • {company}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions with improved spacing */}
          <div className="flex items-center gap-3">
            {/* Template Selector - improved */}
            <div className="relative">
              <select
                value={selectedTemplate}
                onChange={(e) => onTemplateChange(e.target.value as TemplateType)}
                className="appearance-none pl-4 pr-11 py-2.5 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                {TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Toggle Preview */}
            <button
              onClick={onTogglePreview}
              className="lg:flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hidden shadow-sm"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden xl:inline">{showPreview ? 'Hide' : 'Show'}</span>
            </button>
            
            {/* Language Toggle - improved */}
            <button
              onClick={onTranslate}
              disabled={isTranslating}
              className="px-3.5 py-2.5 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">{currentLanguage.toUpperCase()}</span>
            </button>
            
            {/* Copy - improved */}
            <button
              onClick={onCopy}
              className="px-3.5 py-2.5 bg-white dark:bg-[#26262B] border border-gray-200/60 dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
            >
              {isCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="hidden sm:inline text-green-600 dark:text-green-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
            
            {/* Download PDF - improved */}
            <button
              onClick={onDownloadPDF}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 flex items-center gap-2.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

