import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target,
  MessageSquare,
  Briefcase,
  Quote,
  AlertCircle,
  Zap,
  TrendingUp,
  User,
  Bot,
  Award,
  BarChart3,
  Lightbulb,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import type { TranscriptEntry } from '../../types/openai-realtime';
import type { 
  MockInterviewAnalysis,
  MockInterviewTranscriptHighlight,
  MockInterviewResponseAnalysis,
} from '../../types/interview';

// ============================================
// PROPS
// ============================================

interface MockInterviewResultsViewProps {
  transcript: TranscriptEntry[];
  analysis: MockInterviewAnalysis | null;
  isLoading: boolean;
  companyName: string;
  position: string;
  elapsedTime: number;
  onBack: () => void;
}

// ============================================
// MINI SCORE BAR
// ============================================

const MiniScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const getColor = (s: number) => {
    if (s >= 70) return 'bg-emerald-500';
    if (s >= 50) return 'bg-amber-500';
    if (s >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-gray-500 dark:text-white/40 w-12">{label}</span>
      <div className="flex-1 h-1 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[8px] font-medium text-gray-600 dark:text-white/50 w-6 text-right">{score}</span>
    </div>
  );
};

// ============================================
// SCORE RING - COMPACT
// ============================================

const ScoreRing: React.FC<{ 
  score: number; 
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  delay?: number;
}> = ({ score, size = 'md', label, delay = 0 }) => {
  const sizeConfig = {
    sm: { container: 48, stroke: 3, fontSize: 'text-sm' },
    md: { container: 80, stroke: 4, fontSize: 'text-xl' },
    lg: { container: 100, stroke: 5, fontSize: 'text-2xl' },
  };
  
  const { container, stroke, fontSize } = sizeConfig[size];
  const radius = (container - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 70) return '#10B981';
    if (s >= 50) return '#F59E0B';
    if (s >= 30) return '#F97316';
    return '#EF4444';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative" style={{ width: container, height: container }}>
        <svg width={container} height={container} className="-rotate-90">
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-[#3d3c3e]"
          />
          <motion.circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut", delay: delay + 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={`${fontSize} font-semibold text-gray-900 dark:text-white`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">
          {label}
        </span>
      )}
    </motion.div>
  );
};

// ============================================
// STAR INDICATOR - COMPACT
// ============================================

const STARIndicator: React.FC<{ 
  star: { situation: boolean; task: boolean; action: boolean; result: boolean } 
}> = ({ star }) => {
  const items = [
    { key: 'situation', label: 'S', present: star.situation },
    { key: 'task', label: 'T', present: star.task },
    { key: 'action', label: 'A', present: star.action },
    { key: 'result', label: 'R', present: star.result },
  ];

  return (
    <div className="flex gap-1">
      {items.map(({ key, label, present }) => (
        <div
          key={key}
          className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold ${
            present
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-100 dark:bg-[#3d3c3e]/50 text-gray-400 dark:text-white/30 border border-gray-200 dark:border-[#3d3c3e]'
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

// ============================================
// TRANSCRIPT MESSAGE WITH ANALYSIS
// ============================================

interface TranscriptMessageProps {
  entry: TranscriptEntry;
  highlights: MockInterviewTranscriptHighlight[];
  responseAnalysis?: MockInterviewResponseAnalysis;
  onHighlightClick: (highlight: MockInterviewTranscriptHighlight) => void;
  onResponseClick?: (analysis: MockInterviewResponseAnalysis) => void;
  activeHighlightId: string | null;
  index: number;
}

const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
  entry,
  highlights,
  responseAnalysis,
  onHighlightClick,
  onResponseClick,
  activeHighlightId,
  index,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const entryHighlights = (highlights || []).filter(h => h.entryId === entry.id);
  const isUser = entry.role === 'user';
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-500 dark:text-amber-400';
    if (score >= 30) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getBorderColor = (score: number) => {
    if (score >= 70) return 'border-l-emerald-500';
    if (score >= 50) return 'border-l-amber-500';
    if (score >= 30) return 'border-l-orange-500';
    return 'border-l-red-500';
  };
  
  const renderHighlightedText = () => {
    if (entryHighlights.length === 0 || !entry.text) {
      return <span>{entry.text || '(no response)'}</span>;
    }

    let text = entry.text;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedHighlights = [...entryHighlights].sort((a, b) => {
      const indexA = text.toLowerCase().indexOf(a.excerpt.toLowerCase());
      const indexB = text.toLowerCase().indexOf(b.excerpt.toLowerCase());
      return indexA - indexB;
    });

    sortedHighlights.forEach((highlight, i) => {
      const excerptLower = highlight.excerpt.toLowerCase();
      const textLower = text.toLowerCase();
      const startIdx = textLower.indexOf(excerptLower, lastIndex);
      
      if (startIdx === -1) return;
      
      if (startIdx > lastIndex) {
        parts.push(<span key={`text-${i}`}>{text.substring(lastIndex, startIdx)}</span>);
      }
      
      const highlightId = `${entry.id}-${i}`;
      const isActive = activeHighlightId === highlightId;
      const endIdx = startIdx + highlight.excerpt.length;
      
      const highlightColors = {
        strength: 'bg-emerald-500/20 border-b border-emerald-400 hover:bg-emerald-500/30',
        improvement: 'bg-amber-500/20 border-b border-amber-400 hover:bg-amber-500/30',
        weakness: 'bg-red-500/20 border-b border-red-400 hover:bg-red-500/30',
      };
      
      parts.push(
        <span
          key={`highlight-${i}`}
          id={highlightId}
          onClick={() => onHighlightClick(highlight)}
          className={`cursor-pointer transition-all rounded px-0.5 ${
            highlightColors[highlight.type]
          } ${isActive ? 'ring-1 ring-gray-400 dark:ring-white/50' : ''}`}
        >
          {text.substring(startIdx, endIdx)}
        </span>
      );
      
      lastIndex = endIdx;
    });
    
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }
    
    return <>{parts}</>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser 
          ? 'bg-[#b7e219]/20 border border-[#b7e219]/30' 
          : 'bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-[#b7e219]" />
        ) : (
          <Bot className="h-4 w-4 text-gray-500 dark:text-white/60" />
        )}
      </div>
      
      {/* Message */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div 
          className={`inline-block text-left rounded-xl overflow-hidden ${
            isUser && responseAnalysis
              ? `border-l-2 ${getBorderColor(responseAnalysis.overallResponseScore)}`
              : ''
          }`}
        >
          <div 
            className={`px-3.5 py-2.5 ${
              isUser
                ? 'bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] border-l-0'
                : 'bg-white dark:bg-[#242325] border border-gray-100 dark:border-[#3d3c3e]/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                isUser ? 'text-[#b7e219]' : 'text-gray-500 dark:text-white/50'
              }`}>
                {isUser ? 'You' : 'Interviewer'}
              </span>
              
              {/* Score badge for user messages */}
              {isUser && responseAnalysis && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getScoreColor(responseAnalysis.overallResponseScore)}`}>
                  {responseAnalysis.overallResponseScore}/100
                </span>
              )}
              
              {entryHighlights.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                  entryHighlights.some(h => h.type === 'weakness')
                    ? 'bg-red-500/20 text-red-500 dark:text-red-400'
                    : entryHighlights.some(h => h.type === 'improvement')
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {entryHighlights.length} insight{entryHighlights.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed">
              {renderHighlightedText()}
            </p>
          </div>
          
          {/* Response Analysis Panel for user messages */}
          {isUser && responseAnalysis && (
            <div className="bg-gray-50 dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-[#3d3c3e]">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#242325] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="flex items-center gap-1 text-[9px]">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className={getScoreColor(responseAnalysis.contentScore)}>{responseAnalysis.contentScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px]">
                      <MessageCircle className="h-3 w-3 text-gray-400" />
                      <span className={getScoreColor(responseAnalysis.expressionScore)}>{responseAnalysis.expressionScore}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px]">
                      <BarChart3 className="h-3 w-3 text-gray-400" />
                      <span className={getScoreColor(responseAnalysis.structureScore)}>{responseAnalysis.structureScore}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    responseAnalysis.tone === 'confident' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    responseAnalysis.tone === 'enthusiastic' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    responseAnalysis.tone === 'hesitant' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-white/60'
                  }`}>
                    {responseAnalysis.tone}
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {/* Score bars */}
                      <div className="space-y-1">
                        <MiniScoreBar score={responseAnalysis.contentScore} label="Content" />
                        <MiniScoreBar score={responseAnalysis.expressionScore} label="Expression" />
                        <MiniScoreBar score={responseAnalysis.structureScore} label="Structure" />
                      </div>
                      
                      {/* What was good */}
                      {responseAnalysis.whatWasGood && responseAnalysis.whatWasGood.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <ThumbsUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Good</span>
                          </div>
                          <ul className="space-y-0.5">
                            {responseAnalysis.whatWasGood.map((item, i) => (
                              <li key={i} className="text-[10px] text-gray-600 dark:text-white/60 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-500">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* What to improve */}
                      {responseAnalysis.whatToImprove && responseAnalysis.whatToImprove.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <ThumbsDown className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">To Improve</span>
                          </div>
                          <ul className="space-y-0.5">
                            {responseAnalysis.whatToImprove.map((item, i) => (
                              <li key={i} className="text-[10px] text-gray-600 dark:text-white/60 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Ideal response */}
                      {responseAnalysis.idealResponse && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1 mb-1">
                            <Sparkles className="h-3 w-3 text-[#b7e219]" />
                            <span className="text-[9px] font-medium text-[#b7e219]">Better Response</span>
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-white/60 italic bg-[#b7e219]/5 rounded p-2 border border-[#b7e219]/20">
                            "{responseAnalysis.idealResponse}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// LOADING STATE - MINIMAL
// ============================================

const MinimalLoadingState: React.FC = () => (
  <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#1c1c1e]">
    <div className="text-center">
      <div className="relative w-12 h-12 mx-auto mb-6">
        <motion.div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-[#3d3c3e]" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#b7e219]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-white/60">Analyzing...</p>
      <div className="w-48 mx-auto mt-4 h-0.5 bg-gray-200 dark:bg-[#2b2a2c] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#b7e219]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
);

// ============================================
// RESPONSE ANALYSIS CARD
// ============================================

const ResponseAnalysisCard: React.FC<{
  analysis: MockInterviewResponseAnalysis;
  index: number;
}> = ({ analysis, index }) => {
  const [expanded, setExpanded] = useState(index === 0);
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-[#242325] rounded-lg border border-gray-200 dark:border-[#3d3c3e]/60 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-start gap-3 text-left hover:bg-gray-50 dark:hover:bg-[#2b2a2c] transition-colors"
      >
        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getScoreColor(analysis.overallResponseScore)} bg-gray-100 dark:bg-[#3d3c3e]`}>
          {analysis.overallResponseScore}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-white/50 mb-0.5 line-clamp-1">
            Q: {analysis.questionAsked || 'Previous question'}
          </p>
          <p className="text-sm text-gray-700 dark:text-white/80 line-clamp-2">
            "{analysis.responseText}"
          </p>
        </div>
        <ChevronDown className={`flex-shrink-0 h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-3 border-t border-gray-100 dark:border-[#3d3c3e]">
              {/* Scores */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                <div className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(analysis.contentScore)}`}>{analysis.contentScore}</div>
                  <div className="text-[9px] text-gray-500 dark:text-white/40">Content</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(analysis.expressionScore)}`}>{analysis.expressionScore}</div>
                  <div className="text-[9px] text-gray-500 dark:text-white/40">Expression</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(analysis.structureScore)}`}>{analysis.structureScore}</div>
                  <div className="text-[9px] text-gray-500 dark:text-white/40">Structure</div>
                </div>
              </div>
              
              {/* Detailed feedback */}
              {analysis.detailedFeedback && (
                <p className="text-xs text-gray-600 dark:text-white/70 leading-relaxed">
                  {analysis.detailedFeedback}
                </p>
              )}
              
              {/* Good & Improve in columns */}
              <div className="grid grid-cols-2 gap-2">
                {analysis.whatWasGood && analysis.whatWasGood.length > 0 && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Good</span>
                    </div>
                    <ul className="space-y-0.5">
                      {analysis.whatWasGood.map((item, i) => (
                        <li key={i} className="text-[10px] text-gray-600 dark:text-white/60">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.whatToImprove && analysis.whatToImprove.length > 0 && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">Improve</span>
                    </div>
                    <ul className="space-y-0.5">
                      {analysis.whatToImprove.map((item, i) => (
                        <li key={i} className="text-[10px] text-gray-600 dark:text-white/60">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Ideal response */}
              {analysis.idealResponse && (
                <div className="p-2.5 rounded-lg bg-[#b7e219]/10 border border-[#b7e219]/20">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#b7e219]" />
                    <span className="text-[10px] font-medium text-gray-900 dark:text-white">A Better Response</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-white/70 italic leading-relaxed">
                    "{analysis.idealResponse}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MockInterviewResultsView: React.FC<MockInterviewResultsViewProps> = ({
  transcript,
  analysis,
  isLoading,
  companyName,
  position,
  elapsedTime,
  onBack,
}) => {
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<MockInterviewTranscriptHighlight | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHighlightClick = useCallback((highlight: MockInterviewTranscriptHighlight) => {
    setSelectedHighlight(highlight);
  }, []);

  const scrollToTranscriptEntry = useCallback((entryId: string, highlightIndex: number) => {
    const highlightId = `${entryId}-${highlightIndex}`;
    setActiveHighlightId(highlightId);
    const element = document.getElementById(highlightId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setActiveHighlightId(null), 2000);
    }
  }, []);

  const getTierInfo = (score: number) => {
    if (score >= 70) return { label: 'Strong', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' };
    if (score >= 50) return { label: 'Average', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15' };
    if (score >= 30) return { label: 'Needs Work', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/15' };
    return { label: 'Practice More', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/15' };
  };

  // Get response analysis for a specific entry
  const getResponseAnalysis = (entryId: string) => {
    return analysis?.responseAnalysis?.find(r => r.entryId === entryId);
  };

  const userResponseCount = transcript.filter(e => e.role === 'user' && e.text && e.text.trim().length > 0).length;
  const hasMinimalResponses = userResponseCount <= 2;

  if (isLoading || !analysis) {
    return <MinimalLoadingState />;
  }

  const tierInfo = getTierInfo(analysis.overallScore ?? 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1c1c1e] overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Transcript */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-[#3d3c3e]/60">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#3d3c3e]/60 bg-white dark:bg-[#242325]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]">
                  <MessageSquare className="h-4 w-4 text-gray-500 dark:text-white/60" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white">Transcript</h2>
                  <p className="text-[10px] text-gray-500 dark:text-white/40">Click on responses to see details</p>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-2.5 text-[9px]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 dark:text-white/40">Good</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-gray-500 dark:text-white/40">Improve</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-gray-500 dark:text-white/40">Issue</span>
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-[#1c1c1e]">
            {transcript.map((entry, idx) => (
              <TranscriptMessage
                key={entry.id || idx}
                entry={entry}
                highlights={analysis?.transcriptHighlights || []}
                responseAnalysis={entry.role === 'user' ? getResponseAnalysis(entry.id || `entry-${idx}`) : undefined}
                onHighlightClick={handleHighlightClick}
                activeHighlightId={activeHighlightId}
                index={idx}
              />
            ))}
            
            {hasMinimalResponses && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    Limited responses. Practice answering more questions for better analysis.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - Analysis */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-white dark:bg-[#1c1c1e]">
          {/* Header with tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#3d3c3e]/60 bg-white dark:bg-[#242325]">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]">
                  <BarChart3 className="h-4 w-4 text-gray-500 dark:text-white/60" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white">Analysis</h2>
                  <p className="text-[10px] text-gray-500 dark:text-white/40">
                    {position} · {formatTime(elapsedTime)}
                  </p>
                </div>
              </div>
              
              {/* Status */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                (analysis?.verdict?.passed || (analysis?.overallScore ?? 0) >= 60)
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                {(analysis?.verdict?.passed || (analysis?.overallScore ?? 0) >= 60) ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                )}
                <span className={`text-[10px] font-medium ${
                  (analysis?.verdict?.passed || (analysis?.overallScore ?? 0) >= 60) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {(analysis?.verdict?.passed || (analysis?.overallScore ?? 0) >= 60) ? 'Ready' : 'Keep Practicing'}
                </span>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="px-4 flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white border-t border-x border-gray-200 dark:border-[#3d3c3e]'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('responses')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'responses'
                    ? 'bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white border-t border-x border-gray-200 dark:border-[#3d3c3e]'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                }`}
              >
                By Response
                {analysis?.responseAnalysis && analysis.responseAnalysis.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-200 dark:bg-[#3d3c3e]">
                    {analysis.responseAnalysis.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#1c1c1e]">
            {activeTab === 'overview' ? (
              <>
                {/* Score Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e]/60"
                >
                  <div className="flex items-start gap-5">
                    <ScoreRing 
                      score={analysis.overallScore ?? 0} 
                      size="lg"
                      delay={0.1}
                    />
                    
                    <div className="flex-1 pt-1">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${tierInfo.bg} mb-2`}>
                        <Award className={`h-3 w-3 ${tierInfo.color}`} />
                        <span className={`text-xs font-medium ${tierInfo.color}`}>{tierInfo.label}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                        {analysis.executiveSummary || 'Analysis complete.'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Score Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { label: 'Content', score: analysis?.contentAnalysis?.relevanceScore ?? analysis?.contentAnalysis?.specificityScore ?? 0, icon: Target },
                    { label: 'Expression', score: analysis?.expressionAnalysis?.clarityScore ?? analysis?.expressionAnalysis?.organizationScore ?? 0, icon: MessageCircle },
                    { label: 'Job Fit', score: analysis?.jobFitAnalysis?.fitScore ?? 0, icon: Briefcase },
                  ].map(({ label, score, icon: Icon }, idx) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="p-3 rounded-lg bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e]/60 flex flex-col items-center gap-2"
                    >
                      <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                      <ScoreRing score={score} size="sm" delay={0.2 + idx * 0.05} />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-white/40">{label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Selected Highlight */}
                <AnimatePresence>
                  {selectedHighlight && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-3.5 rounded-lg border-l-2 ${
                        selectedHighlight.type === 'strength'
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : selectedHighlight.type === 'improvement'
                          ? 'bg-amber-500/10 border-amber-500'
                          : 'bg-red-500/10 border-red-500'
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Quote className={`h-3.5 w-3.5 ${
                              selectedHighlight.type === 'strength' ? 'text-emerald-500 dark:text-emerald-400' :
                              selectedHighlight.type === 'improvement' ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                            }`} />
                            <span className={`text-xs font-medium ${
                              selectedHighlight.type === 'strength' ? 'text-emerald-600 dark:text-emerald-400' :
                              selectedHighlight.type === 'improvement' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {selectedHighlight.type === 'strength' ? 'Strength' : 
                               selectedHighlight.type === 'improvement' ? 'To Improve' : 'Issue'}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedHighlight(null)}
                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs italic text-gray-500 dark:text-white/60 mb-2">
                          "{selectedHighlight.excerpt}"
                        </p>
                        <p className="text-xs text-gray-700 dark:text-white/80">
                          {selectedHighlight.feedback}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Key Moments */}
                {analysis?.transcriptHighlights && analysis.transcriptHighlights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="h-3.5 w-3.5 text-[#b7e219]" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Key Moments</span>
                      <span className="text-[10px] text-gray-500 dark:text-white/40">({analysis.transcriptHighlights.length})</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      {analysis.transcriptHighlights.slice(0, 4).map((highlight, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedHighlight(highlight);
                            const entryHighlights = (analysis.transcriptHighlights || []).filter(h => h.entryId === highlight.entryId);
                            const highlightIndex = entryHighlights.indexOf(highlight);
                            scrollToTranscriptEntry(highlight.entryId, highlightIndex >= 0 ? highlightIndex : 0);
                          }}
                          className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e]/60 hover:border-gray-300 dark:hover:border-[#3d3c3e] transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              highlight.type === 'strength' ? 'bg-emerald-500' :
                              highlight.type === 'improvement' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <p className="text-[11px] text-gray-600 dark:text-white/60 line-clamp-1 flex-1">
                              "{highlight.excerpt.length > 45 ? highlight.excerpt.substring(0, 45) + '...' : highlight.excerpt}"
                            </p>
                            <ChevronRight className="h-3 w-3 text-gray-300 dark:text-white/20 group-hover:text-gray-400 dark:group-hover:text-white/40" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STAR Method */}
                {analysis?.contentAnalysis?.starMethodUsage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-3 rounded-lg bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e]/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                        <span className="text-xs font-medium text-gray-900 dark:text-white">STAR Method</span>
                      </div>
                      <STARIndicator star={analysis.contentAnalysis.starMethodUsage} />
                    </div>
                  </motion.div>
                )}

                {/* Strengths & Issues */}
                <div className="grid grid-cols-2 gap-3">
                  {analysis?.strengths && analysis.strengths.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Strengths</span>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-white/60">
                            <span className="text-emerald-500 dark:text-emerald-400 mt-0.5">•</span>
                            <span className="line-clamp-2">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {analysis?.criticalIssues && analysis.criticalIssues.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">To Fix</span>
                      </div>
                      <ul className="space-y-1.5">
                        {analysis.criticalIssues.slice(0, 3).map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-white/60">
                            <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                            <span className="line-clamp-2">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                {/* Action Plan */}
                {analysis?.actionPlan && analysis.actionPlan.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="p-3.5 rounded-lg bg-[#b7e219]/10 border border-[#b7e219]/20"
                  >
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Zap className="h-3.5 w-3.5 text-[#b7e219]" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">Action Plan</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.actionPlan.map((action, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded bg-[#b7e219] text-gray-900 text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-[11px] text-gray-600 dark:text-white/70 pt-0.5">{action}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              /* Response-by-Response Tab */
              <div className="space-y-3">
                {analysis?.responseAnalysis && analysis.responseAnalysis.length > 0 ? (
                  analysis.responseAnalysis.map((respAnalysis, idx) => (
                    <ResponseAnalysisCard key={respAnalysis.entryId || idx} analysis={respAnalysis} index={idx} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-white/50">No response analysis available</p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Try having a longer conversation for detailed feedback</p>
                  </div>
                )}
              </div>
            )}

            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-[#3d3c3e]/60 bg-white dark:bg-[#242325]">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            ← Back to Selection
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b7e219] hover:bg-[#a5cb17] text-gray-900 text-xs font-semibold transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Practice Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewResultsView;
