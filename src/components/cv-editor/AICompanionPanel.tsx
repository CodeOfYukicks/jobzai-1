import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, TrendingUp, AlertCircle, CheckCircle, 
  Target, Lightbulb, ChevronRight, RefreshCw, Brain,
  FileText, Award, Briefcase, GraduationCap
} from 'lucide-react';
import { CVData } from '../../types/cvEditor';

interface AICompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
  jobContext?: {
    jobTitle: string;
    company: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
}

interface Suggestion {
  id: string;
  type: 'improvement' | 'warning' | 'success';
  section: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export default function AICompanionPanel({
  isOpen,
  onClose,
  cvData,
  jobContext
}: AICompanionPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [atsScore, setAtsScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze CV and generate suggestions
  useEffect(() => {
    if (isOpen) {
      analyzeCVContent();
    }
  }, [isOpen, cvData]);

  const analyzeCVContent = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis (in production, this would call an AI service)
    setTimeout(() => {
      const newSuggestions: Suggestion[] = [];
      
      // Check for missing sections
      if (!cvData.summary || cvData.summary.length < 50) {
        newSuggestions.push({
          id: '1',
          type: 'warning',
          section: 'Summary',
          title: 'Professional Summary Too Short',
          description: 'Your summary should be 2-3 sentences (50-100 words) highlighting your key strengths.',
          priority: 'high',
          action: 'Expand summary with key achievements'
        });
      }

      // Check for quantified achievements
      const hasMetrics = cvData.experiences.some(exp => 
        exp.bullets.some(bullet => /\d+/.test(bullet))
      );
      
      if (!hasMetrics) {
        newSuggestions.push({
          id: '2',
          type: 'improvement',
          section: 'Experience',
          title: 'Add Quantified Achievements',
          description: 'Include metrics (%, $, #) to demonstrate impact in your experience bullets.',
          priority: 'high',
          action: 'Add metrics to achievements'
        });
      }

      // Check for keywords
      if (jobContext && jobContext.keywords.length > 0) {
        const cvText = JSON.stringify(cvData).toLowerCase();
        const missingKeywords = jobContext.keywords.filter(keyword => 
          !cvText.includes(keyword.toLowerCase())
        );
        
        if (missingKeywords.length > 0) {
          newSuggestions.push({
            id: '3',
            type: 'warning',
            section: 'Keywords',
            title: `Missing ${missingKeywords.length} Important Keywords`,
            description: `Add these keywords naturally: ${missingKeywords.slice(0, 5).join(', ')}`,
            priority: 'high',
            action: 'Integrate missing keywords'
          });
        }
      }

      // Check for skills count
      if (cvData.skills.length < 5) {
        newSuggestions.push({
          id: '4',
          type: 'improvement',
          section: 'Skills',
          title: 'Add More Relevant Skills',
          description: 'Include at least 8-10 relevant skills for better ATS matching.',
          priority: 'medium',
          action: 'Expand skills section'
        });
      }

      // Positive feedback
      if (cvData.experiences.length >= 3) {
        newSuggestions.push({
          id: '5',
          type: 'success',
          section: 'Experience',
          title: 'Strong Work History',
          description: 'Your experience section shows good career progression.',
          priority: 'low'
        });
      }

      setSuggestions(newSuggestions);
      
      // Calculate ATS score
      calculateATSScore();
      
      setIsAnalyzing(false);
    }, 1500);
  };

  const calculateATSScore = () => {
    let score = 0;
    
    // Basic scoring logic
    if (cvData.summary && cvData.summary.length > 50) score += 15;
    if (cvData.experiences.length > 0) score += 20;
    if (cvData.education.length > 0) score += 15;
    if (cvData.skills.length >= 5) score += 15;
    
    // Check for quantified achievements
    const hasMetrics = cvData.experiences.some(exp => 
      exp.bullets.some(bullet => /\d+/.test(bullet))
    );
    if (hasMetrics) score += 20;
    
    // Keywords matching
    if (jobContext && jobContext.keywords.length > 0) {
      const cvText = JSON.stringify(cvData).toLowerCase();
      const matchedKeywords = jobContext.keywords.filter(keyword => 
        cvText.includes(keyword.toLowerCase())
      );
      score += Math.min(15, matchedKeywords.length * 3);
    }
    
    setAtsScore(Math.min(100, score));
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'improvement':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-[#635BFF]" />;
    }
  };

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#635BFF] dark:text-[#a5a0ff]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-12 h-[calc(100vh-48px)] w-96 bg-white dark:bg-[#242325] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3c3e]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#635BFF]/10 dark:bg-[#5249e6]/30 rounded-lg">
                    <Brain className="w-5 h-5 text-[#5249e6] dark:text-[#a5a0ff]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Assistant
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Real-time CV analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* ATS Score */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3d3c3e]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ATS Compatibility Score
                </span>
                <button
                  onClick={analyzeCVContent}
                  disabled={isAnalyzing}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded transition-colors"
                  title="Refresh analysis"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="relative">
                <div className="w-full h-3 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${atsScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${
                      atsScore >= 80 
                        ? 'bg-[#635BFF]' 
                        : atsScore >= 60 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {atsScore}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>

              {jobContext && (
                <div className="mt-3 p-2 bg-[#635BFF]/5 dark:bg-[#5249e6]/20 rounded-lg">
                  <p className="text-xs text-[#635BFF] dark:text-[#a5a0ff]">
                    Optimized for: <span className="font-medium">{jobContext.jobTitle}</span> at {jobContext.company}
                  </p>
                </div>
              )}
            </div>

            {/* Suggestions List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Improvement Suggestions ({suggestions.length})
              </h3>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-[#635BFF] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing your CV...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(suggestion => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 dark:bg-[#2b2a2c] rounded-lg border border-gray-200 dark:border-[#3d3c3e]"
                    >
                      <div className="flex items-start gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {suggestion.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {suggestion.description}
                          </p>
                          {suggestion.action && (
                            <button className="flex items-center gap-1 text-xs text-[#5249e6] dark:text-[#a5a0ff] hover:text-[#635BFF] dark:hover:text-[#a5a0ff] font-medium">
                              <Sparkles className="w-3 h-3" />
                              {suggestion.action}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {suggestions.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-[#635BFF] mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your CV looks great! No major improvements needed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-[#3d3c3e]">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Experiences</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cvData.experiences.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Education</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cvData.education.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Skills</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cvData.skills.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Certifications</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cvData.certifications.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
