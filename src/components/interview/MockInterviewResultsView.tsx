import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target,
  MessageSquare,
  Quote,
  AlertCircle,
  Zap,
  TrendingUp,
  User,
  Award,
  BarChart3,
  Lightbulb,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  X,
  Circle,
  Star,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import type { TranscriptEntry } from '../../types/openai-realtime';
import type { 
  MockInterviewAnalysis,
  MockInterviewTranscriptHighlight,
  MockInterviewResponseAnalysis,
} from '../../types/interview';
import { Avatar, DEFAULT_AVATAR_CONFIG, loadAvatarConfig, type AvatarConfig } from '../assistant/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { CompanyLogo } from '../common/CompanyLogo';

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
      <span className="text-[8px] text-neutral-500 dark:text-neutral-500 w-10">{label}</span>
      <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[8px] font-medium text-neutral-600 dark:text-neutral-400 w-5 text-right">{score}</span>
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
  avatarConfig: AvatarConfig;
  userProfilePhoto: string | null;
}

const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
  entry,
  highlights,
  responseAnalysis,
  onHighlightClick,
  onResponseClick,
  activeHighlightId,
  index,
  avatarConfig,
  userProfilePhoto,
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
        {isUser ? (
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center ${
          userProfilePhoto ? '' : 'bg-[#b7e219]/20 border border-[#b7e219]/30'
        }`}>
          {userProfilePhoto ? (
            <img 
              src={userProfilePhoto} 
              alt="You" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-[#b7e219]" />
        )}
      </div>
      ) : (
        <Avatar 
          config={avatarConfig}
          size={32}
          className="flex-shrink-0 rounded-lg ring-1 ring-neutral-200/60 dark:ring-white/10 bg-neutral-50 dark:bg-[#2a2a2b]"
        />
      )}
      
      {/* Message */}
      <div className={`flex-1 max-w-[88%] ${isUser ? 'text-right' : ''}`}>
        <div 
          className={`inline-block text-left rounded-xl overflow-hidden ${
            isUser && responseAnalysis
              ? `border-l-2 ${getBorderColor(responseAnalysis.overallResponseScore)}`
              : ''
          }`}
        >
          <div 
            className={`px-3.5 py-3 ${
              isUser
                ? 'bg-white dark:bg-[#1e1e20] border border-neutral-200 dark:border-neutral-700/50 border-l-0'
                : 'bg-white dark:bg-[#1e1e20] border border-neutral-100 dark:border-neutral-700/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isUser ? 'text-[#b7e219]' : 'text-neutral-400 dark:text-neutral-500'
              }`}>
                {isUser ? 'You' : 'AI'}
              </span>
              
              {/* Score badge for user messages */}
              {isUser && responseAnalysis && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getScoreColor(responseAnalysis.overallResponseScore)}`}>
                  {responseAnalysis.overallResponseScore}
                </span>
              )}
              
              {entryHighlights.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  entryHighlights.some(h => h.type === 'weakness')
                    ? 'bg-red-500/20 text-red-500 dark:text-red-400'
                    : entryHighlights.some(h => h.type === 'improvement')
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {entryHighlights.length}
                </span>
              )}
            </div>
            
            <p className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {renderHighlightedText()}
            </p>
          </div>
          
          {/* Response Analysis Panel for user messages */}
          {isUser && responseAnalysis && (
            <div className="bg-neutral-50 dark:bg-[#161618] border-t border-neutral-100 dark:border-neutral-700/30">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-[#1e1e20] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <div className="flex items-center gap-0.5 text-[9px]">
                      <Target className="h-3 w-3 text-neutral-400" />
                      <span className={getScoreColor(responseAnalysis.contentScore)}>{responseAnalysis.contentScore}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[9px]">
                      <MessageCircle className="h-3 w-3 text-neutral-400" />
                      <span className={getScoreColor(responseAnalysis.expressionScore)}>{responseAnalysis.expressionScore}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[9px]">
                      <BarChart3 className="h-3 w-3 text-neutral-400" />
                      <span className={getScoreColor(responseAnalysis.structureScore)}>{responseAnalysis.structureScore}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    responseAnalysis.tone === 'confident' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    responseAnalysis.tone === 'enthusiastic' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                    responseAnalysis.tone === 'hesitant' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {responseAnalysis.tone}
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-2.5 space-y-2">
                      {/* Score bars */}
                      <div className="space-y-1">
                        <MiniScoreBar score={responseAnalysis.contentScore} label="Content" />
                        <MiniScoreBar score={responseAnalysis.expressionScore} label="Expr." />
                        <MiniScoreBar score={responseAnalysis.structureScore} label="Struct." />
                      </div>
                      
                      {/* What was good */}
                      {responseAnalysis.whatWasGood && responseAnalysis.whatWasGood.length > 0 && (
                        <div className="pt-1.5">
                          <div className="flex items-center gap-1 mb-1">
                            <ThumbsUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Good</span>
                          </div>
                          <ul className="space-y-0.5">
                            {responseAnalysis.whatWasGood.slice(0, 2).map((item, i) => (
                              <li key={i} className="text-[10px] text-neutral-600 dark:text-neutral-400 pl-3.5 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-500">
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
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">Improve</span>
                          </div>
                          <ul className="space-y-0.5">
                            {responseAnalysis.whatToImprove.slice(0, 2).map((item, i) => (
                              <li key={i} className="text-[10px] text-neutral-600 dark:text-neutral-400 pl-3.5 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500">
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
                            <span className="text-[9px] font-medium text-[#b7e219]">Better</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 dark:text-neutral-400 italic bg-[#b7e219]/5 rounded p-2 border border-[#b7e219]/20">
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
  const { currentUser } = useAuth();
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<MockInterviewTranscriptHighlight | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);

  // Load avatar config and user profile photo
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser?.uid) {
        try {
          // Load AI avatar config
          const config = await loadAvatarConfig(currentUser.uid);
          setAvatarConfig(config);
          
          // Load user profile photo from Firestore
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.profilePhoto) {
              setUserProfilePhoto(userData.profilePhoto);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [currentUser?.uid]);

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
  const answeredCount = transcript.filter(e => e.role === 'user' && e.text && e.text.trim().length > 0).length;
  const isPassed = analysis?.verdict?.passed || (analysis?.overallScore ?? 0) >= 60;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-[#1a1a1c]">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1c]">
        {/* Left: Close + Company Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 
              dark:text-neutral-500 dark:hover:text-neutral-300
              hover:bg-neutral-100 dark:hover:bg-white/5
              transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
              <div className="flex items-center gap-2.5">
            {/* Company Logo */}
            <CompanyLogo companyName={companyName} size="lg" />
                <div>
              <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {companyName}
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {position} · {formatTime(elapsedTime)}
                  </p>
                </div>
              </div>
            </div>
            
        {/* Right: Practice Again - Green button like JobApplicationsPage */}
              <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm bg-[#b7e219] text-gray-900 hover:bg-[#a5cb17] hover:shadow-md border border-[#9fc015] transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Practice Again
              </button>
          </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Analysis Summary */}
        <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto">
          <div className="px-8 py-6 pb-8">
          {/* Hero - Status + Score + Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Status indicator with dot */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-2 w-2 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-sm font-medium ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isPassed ? 'Passed' : 'Needs Practice'}
              </span>
                      </div>
                      
            {/* Score + Summary side by side */}
            <div className="flex items-start gap-4">
              <ScoreRing score={analysis.overallScore ?? 0} size="md" delay={0.1} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {tierInfo.label} · {answeredCount} response{answeredCount !== 1 ? 's' : ''}
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {analysis.executiveSummary || 'Analysis complete.'}
                      </p>
                    </div>
                  </div>
                </motion.div>

          {/* Insights sections with dot indicators */}
          <div className="space-y-4">
            {/* Strengths */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Strengths
                </h3>
                          </div>
              <div className="pl-5 space-y-1.5">
                {analysis?.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.slice(0, 4).map((s, i) => (
                    <p key={i} className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Answer more questions to identify strengths
                  </p>
                )}
                      </div>
                    </motion.div>

            {/* Focus Areas */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Focus Areas
                </h3>
                    </div>
              <div className="pl-5 space-y-1.5">
                {analysis?.criticalIssues && analysis.criticalIssues.length > 0 ? (
                  analysis.criticalIssues.slice(0, 4).map((a, i) => (
                    <p key={i} className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex items-start gap-2">
                      <ArrowUpRight className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Great job! Keep up the good work
                  </p>
                )}
                    </div>
                  </motion.div>

            {/* Expert Insight */}
            {analysis?.actionPlan && analysis.actionPlan.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3 w-3 text-indigo-500" />
                  <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Expert Insight
                  </h3>
                      </div>
                <div className="pl-5">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {analysis.actionPlan[0]}
                  </p>
                    </div>
                  </motion.div>
                )}
          </div>

          {/* Metrics - Compact Grid */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { 
                  label: 'Content', 
                  score: analysis?.contentAnalysis?.relevanceScore ?? analysis?.contentAnalysis?.specificityScore ?? 0,
                },
                { 
                  label: 'Expression', 
                  score: analysis?.expressionAnalysis?.clarityScore ?? analysis?.expressionAnalysis?.organizationScore ?? 0,
                },
                { 
                  label: 'Job Fit', 
                  score: analysis?.jobFitAnalysis?.fitScore ?? 0,
                },
              ].map(({ label, score }) => {
                const getScoreTextColor = (s: number) => {
                  if (s >= 70) return 'text-emerald-600 dark:text-emerald-400';
                  if (s >= 50) return 'text-amber-600 dark:text-amber-400';
                  if (s >= 30) return 'text-orange-600 dark:text-orange-400';
                  return 'text-red-600 dark:text-red-400';
                };
                
                return (
                  <div key={label} className="text-center">
                    <div className={`text-lg font-bold ${getScoreTextColor(score)}`}>{score}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{label}</div>
                      </div>
                );
              })}
                    </div>
                    </motion.div>

          {/* STAR Method - Only show if at least one element is used */}
          {analysis?.contentAnalysis?.starMethodUsage && (
            analysis.contentAnalysis.starMethodUsage.situation ||
            analysis.contentAnalysis.starMethodUsage.task ||
            analysis.contentAnalysis.starMethodUsage.action ||
            analysis.contentAnalysis.starMethodUsage.result
          ) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-3 w-3 text-neutral-500" />
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  STAR Method
                </h3>
                      </div>
              <div className="flex gap-1">
                {(['situation', 'task', 'action', 'result'] as const).map((key) => {
                  const present = analysis.contentAnalysis.starMethodUsage?.[key];
                  return (
                    <div
                      key={key}
                      className={`flex-1 rounded py-1 text-center text-[10px] font-medium ${
                        present
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                      }`}
                    >
                      {key.charAt(0).toUpperCase()}
                      </div>
                  );
                })}
              </div>
                    </motion.div>
                  )}
        </div>
                </div>

        {/* Right Column - Transcript */}
        <div className="w-1/2 overflow-y-auto bg-neutral-50 dark:bg-[#141416]">
          <div className="px-6 py-5 pb-8">
                  <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                Conversation
              </h2>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {transcript.length} messages
                          </span>
                        </div>

            {/* Messages */}
            <div className="space-y-3">
              {transcript.map((entry, idx) => (
                <TranscriptMessage
                  key={entry.id || idx}
                  entry={entry}
                  highlights={analysis?.transcriptHighlights || []}
                  responseAnalysis={entry.role === 'user' ? getResponseAnalysis(entry.id || `entry-${idx}`) : undefined}
                  onHighlightClick={handleHighlightClick}
                  activeHighlightId={activeHighlightId}
                  index={idx}
                  avatarConfig={avatarConfig}
                  userProfilePhoto={userProfilePhoto}
                />
              ))}
              
              {hasMinimalResponses && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                      Limited responses. Practice more for better analysis.
                    </p>
                    </div>
                  </motion.div>
                )}
                  </div>
          </motion.div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewResultsView;
