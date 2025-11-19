import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Target, Award, LayoutTemplate, Check } from 'lucide-react';
import { TemplateType } from './PreviewPanel';
import { PremiumATSAnalysis } from '../../types/premiumATS';

type RightTab = 'job-match' | 'score' | 'templates';

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
  analysis?: PremiumATSAnalysis | null;
}

export default function RightSidebar({ 
  isOpen, 
  onToggle,
  selectedTemplate,
  onSelectTemplate,
  analysis
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<RightTab>('templates');

  return (
    <motion.div 
      className={`relative flex flex-col h-full bg-white dark:bg-[#1A1A1D] border-l border-gray-200 dark:border-gray-800 z-20 flex-shrink-0`}
      animate={{ width: isOpen ? 350 : 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-6 bg-white dark:bg-[#26262B] border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-50 z-50 text-gray-600 dark:text-gray-300"
      >
        {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
        <TabButton 
          active={activeTab === 'job-match'} 
          onClick={() => setActiveTab('job-match')} 
          icon={<Target className="w-4 h-4" />} 
          label="Job Match"
          showLabel={isOpen}
        />
        <TabButton 
          active={activeTab === 'score'} 
          onClick={() => setActiveTab('score')} 
          icon={<Award className="w-4 h-4" />} 
          label="Score"
          showLabel={isOpen}
        />
        <TabButton 
          active={activeTab === 'templates'} 
          onClick={() => setActiveTab('templates')} 
          icon={<LayoutTemplate className="w-4 h-4" />} 
          label="Templates"
          showLabel={isOpen}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isOpen ? (
          <div className="p-6">
            {activeTab === 'job-match' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Match Breakdown</h3>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Overall Score</div>
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {analysis.analysis.match_scores.overall_score}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Keywords</span>
                        <span className="font-semibold">{analysis.analysis.match_scores.keywords_score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${analysis.analysis.match_scores.keywords_score}%` }} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Skills</span>
                        <span className="font-semibold">{analysis.analysis.match_scores.skills_score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analysis.analysis.match_scores.skills_score}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No analysis data available</p>
                )}
              </div>
            )}
            
            {activeTab === 'score' && (
               <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">ATS Score</h3>
                 {analysis ? (
                   <div className="flex flex-col items-center justify-center py-8">
                     <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-purple-100 dark:border-purple-900/30 mb-4">
                       <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                         {analysis.analysis.match_scores.overall_score}
                       </div>
                     </div>
                     <p className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                       Your resume is {analysis.analysis.match_scores.overall_score >= 70 ? 'well-optimized' : 'needs improvement'} for this job description.
                     </p>
                   </div>
                 ) : (
                  <p className="text-sm text-gray-500">No score data available</p>
                 )}
               </div>
            )}
            
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose Template</h3>
                <div className="grid grid-cols-1 gap-4">
                  <TemplateCard 
                    id="consulting" 
                    name="Classic" 
                    description="simple • classic"
                    isSelected={selectedTemplate === 'consulting'}
                    onSelect={() => onSelectTemplate('consulting')}
                  />
                  <TemplateCard 
                    id="harvard" 
                    name="Harvard" 
                    description="professional • academic"
                    isSelected={selectedTemplate === 'harvard'}
                    onSelect={() => onSelectTemplate('harvard')}
                  />
                  <TemplateCard 
                    id="notion" 
                    name="Notion" 
                    description="modern • simple"
                    isSelected={selectedTemplate === 'notion'}
                    onSelect={() => onSelectTemplate('notion')}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 space-y-4">
            <button 
              onClick={() => { onToggle(); setActiveTab('job-match'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Job Match"
            >
              <Target className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab('score'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Score"
            >
              <Award className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { onToggle(); setActiveTab('templates'); }}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Templates"
            >
              <LayoutTemplate className="w-5 h-5" />
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

function TemplateCard({ 
  id, 
  name, 
  description, 
  isSelected, 
  onSelect 
}: { 
  id: string; 
  name: string; 
  description: string; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  return (
    <div 
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border transition-all overflow-hidden ${
        isSelected 
          ? 'border-purple-600 dark:border-purple-500 ring-1 ring-purple-600 dark:ring-purple-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
      }`}
    >
      <div className="aspect-[0.7] bg-gray-100 dark:bg-[#26262B] relative overflow-hidden">
        {/* Placeholder Preview */}
        <div className="absolute inset-4 bg-white dark:bg-[#1A1A1D] shadow-sm p-2 opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-1/3 h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded mb-1"></div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded mb-1"></div>
          <div className="w-2/3 h-1.5 bg-gray-100 dark:bg-gray-800 rounded mb-4"></div>
          <div className="w-1/4 h-2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="space-y-1">
            <div className="w-full h-1 bg-gray-50 dark:bg-gray-800 rounded"></div>
            <div className="w-full h-1 bg-gray-50 dark:bg-gray-800 rounded"></div>
            <div className="w-full h-1 bg-gray-50 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full shadow-sm">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-[#1A1A1D]">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{name}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        
        {/* Color Swatches (Visual only for now as we don't have color state yet) */}
        <div className="flex gap-1.5 mt-2">
          <div className="w-4 h-4 rounded-full bg-white border border-gray-200"></div>
          <div className="w-4 h-4 rounded-full bg-gray-800"></div>
          <div className="w-4 h-4 rounded-full bg-blue-600"></div>
        </div>
      </div>
    </div>
  );
}
