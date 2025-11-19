import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Edit3, Layout, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

type LeftTab = 'ai-tailor' | 'editor' | 'layout';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // For the Editor content passed from parent
  fontFamily?: string;
  setFontFamily?: (font: string) => void;
  fontSize?: number;
  setFontSize?: (size: number) => void;
}

export default function LeftSidebar({ 
  isOpen, 
  onToggle, 
  children,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('editor');

  return (
    <motion.div 
      className={`relative flex flex-col h-full bg-white dark:bg-[#1A1A1D] border-r border-gray-200 dark:border-gray-800 z-20 flex-shrink-0`}
      animate={{ width: isOpen ? 400 : 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-white dark:bg-[#26262B] border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-50 z-50 text-gray-600 dark:text-gray-300"
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
        <TabButton 
          active={activeTab === 'ai-tailor'} 
          onClick={() => setActiveTab('ai-tailor')} 
          icon={<Wand2 className="w-4 h-4" />} 
          label="AI Tailor"
          showLabel={isOpen}
        />
        <TabButton 
          active={activeTab === 'editor'} 
          onClick={() => setActiveTab('editor')} 
          icon={<Edit3 className="w-4 h-4" />} 
          label="Editor"
          showLabel={isOpen}
        />
        <TabButton 
          active={activeTab === 'layout'} 
          onClick={() => setActiveTab('layout')} 
          icon={<Layout className="w-4 h-4" />} 
          label="Layout"
          showLabel={isOpen}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isOpen ? (
          <div className="p-6">
            {activeTab === 'ai-tailor' && <AITailorTab />}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                {children || <div className="text-gray-500 text-center mt-10">Editor content goes here</div>}
              </div>
            )}
            {activeTab === 'layout' && (
              <LayoutTab 
                fontFamily={fontFamily} 
                setFontFamily={setFontFamily}
                fontSize={fontSize}
                setFontSize={setFontSize}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 space-y-4">
            <button 
              onClick={() => { onToggle(); setActiveTab('ai-tailor'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="AI Tailor"
            >
              <Wand2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab('editor'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Editor"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab('layout'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Layout"
            >
              <Layout className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label, showLabel }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; showLabel: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
        active 
          ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      title={label}
    >
      {icon}
      {showLabel && <span>{label}</span>}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
      )}
    </button>
  );
}

function AITailorTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">AI</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tailor</h2>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        Instantly optimize your resume for the provided job description with JobZai's 
        AI Tailor, aligning your qualifications with job requirements to significantly 
        boost your interview chances.
      </p>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        Receive targeted suggestions to highlight relevant experiences, reframe 
        accomplishments, and incorporate essential terminology—all while 
        maintaining your authentic voice.
      </p>
      
      <button className="w-full py-3.5 px-4 bg-[#FCD34D] hover:bg-[#FBBF24] text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm mt-4">
        <Sparkles className="w-4 h-4" />
        Tailor Resume
      </button>
    </div>
  );
}

function LayoutTab({ 
  fontFamily, 
  setFontFamily,
  fontSize, 
  setFontSize 
}: { 
  fontFamily?: string; 
  setFontFamily?: (font: string) => void;
  fontSize?: number;
  setFontSize?: (size: number) => void;
}) {
  const FONT_OPTIONS = [
    'Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Helvetica', 'Inter', 'Roboto'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Typography</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Font Family</label>
            <select 
              value={fontFamily}
              onChange={(e) => setFontFamily?.(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#26262B] border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Font Size: {fontSize}pt
            </label>
            <input 
              type="range" 
              min="8" 
              max="14" 
              step="0.5"
              value={fontSize}
              onChange={(e) => setFontSize?.(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
