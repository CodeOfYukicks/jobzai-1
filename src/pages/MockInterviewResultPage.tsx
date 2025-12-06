import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import AuthLayout from '../components/AuthLayout';
import { motion } from 'framer-motion';
import {
  Mic,
  Building,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
} from 'lucide-react';
import { CompanyLogo } from '../components/common/CompanyLogo';
import type { TranscriptEntry } from '../types/openai-realtime';
import type { MockInterviewSession } from './MockInterviewPage';

// Interface for the analysis data
interface InterviewAnalysis {
  summary: string;
  answerQuality?: {
    didTheyAnswer: string;
    specificExamples: string;
    starMethodUsage: string;
  };
  jobFit?: {
    score: number;
    assessment: string;
    missingSkills: string[];
    relevantExperience: string;
  };
  strengths: string[];
  improvements: string[];
  scores: {
    communication: number;
    relevance: number;
    structure: number;
    confidence: number;
    overall: number;
  };
  memorableQuotes?: {
    good: string;
    needsWork: string;
  };
  recommendation: string;
}

export default function MockInterviewResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!currentUser || !sessionId) return;
      
      try {
        setIsLoading(true);
        const sessionRef = doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);
        
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          setSession({
            id: sessionDoc.id,
            date: data.date,
            applicationId: data.applicationId,
            companyName: data.companyName,
            position: data.position,
            elapsedTime: data.elapsedTime,
            transcript: data.transcript || [],
            analysis: data.analysis,
            createdAt: data.createdAt,
          });
        } else {
          toast.error('Session not found');
          navigate('/mock-interview');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        toast.error('Failed to load session');
        navigate('/mock-interview');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [currentUser, sessionId, navigate]);

  // Poll for analysis updates when analysis is null
  useEffect(() => {
    if (!currentUser || !sessionId || !session || session.analysis) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const sessionRef = doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);
        
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          if (data.analysis) {
            // Analysis is ready, update state
            setSession(prev => prev ? {
              ...prev,
              analysis: data.analysis,
            } : null);
            console.log('✅ Analysis received via polling');
          }
        }
      } catch (error) {
        console.error('Error polling for analysis:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [currentUser, sessionId, session]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle delete session
  const handleDelete = async () => {
    if (!currentUser || !sessionId) return;
    
    if (!confirm('Are you sure you want to delete this interview session? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId));
      toast.success('Session deleted');
      navigate('/mock-interview');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  // Go back
  const handleBack = () => {
    navigate('/mock-interview');
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading interview...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!session) {
    return (
      <AuthLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Session not found</p>
            <button
              onClick={handleBack}
              className="mt-4 text-violet-600 dark:text-violet-400 hover:underline text-sm"
            >
              Go back to Mock Interview
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const analysis = session.analysis as InterviewAnalysis;

  return (
    <AuthLayout>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <CompanyLogo
                    companyName={session.companyName}
                    size="md"
                    className="rounded-lg border border-gray-100 dark:border-gray-700"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                      {session.position}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.companyName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Meta info */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(session.elapsedTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(session.date)}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 
                    dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Transcript */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Full Transcript
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {session.transcript.length} messages
                  </span>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
                {session.transcript.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No transcript available
                    </p>
                  </div>
                ) : (
                  session.transcript.map((entry: TranscriptEntry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl ${
                        entry.role === 'assistant' 
                          ? 'bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600' 
                          : 'bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          entry.role === 'assistant' 
                            ? 'text-violet-600 dark:text-violet-400' 
                            : 'text-cyan-600 dark:text-cyan-400'
                        }`}>
                          {entry.role === 'assistant' ? 'AI Interviewer' : 'You'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Right: Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Performance Analysis
                  </h2>
                </div>
              </div>
              
              <div className="p-5">
                {analysis ? (
                  <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
                    {/* Overall Score with color coding */}
                    <div className={`text-center p-4 rounded-xl border ${
                      analysis.scores.overall >= 8 
                        ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border-emerald-200 dark:border-emerald-500/20'
                        : analysis.scores.overall >= 6
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border-amber-200 dark:border-amber-500/20'
                          : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 border-red-200 dark:border-red-500/20'
                    }`}>
                      <div className={`text-4xl font-bold mb-1 ${
                        analysis.scores.overall >= 8 
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : analysis.scores.overall >= 6
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {analysis.scores.overall}/10
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
                    </div>

                    {/* Individual Scores */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Communication', score: analysis.scores.communication },
                        { label: 'Relevance', score: analysis.scores.relevance },
                        { label: 'Structure', score: analysis.scores.structure },
                        { label: 'Confidence', score: analysis.scores.confidence },
                      ].map(({ label, score }) => (
                        <div key={label} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                            <span className={`text-sm font-bold ${
                              score >= 8 ? 'text-emerald-600 dark:text-emerald-400' :
                              score >= 6 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>{score}/10</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                score >= 8 ? 'bg-emerald-500' :
                                score >= 6 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Job Fit Assessment */}
                    {analysis.jobFit && (
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-violet-500" />
                            Job Fit
                          </h3>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                            analysis.jobFit.score >= 7 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            analysis.jobFit.score >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          }`}>{analysis.jobFit.score}/10</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{analysis.jobFit.assessment}</p>
                        {analysis.jobFit.missingSkills && analysis.jobFit.missingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Missing:</span>
                            {analysis.jobFit.missingSkills.map((skill, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer Quality */}
                    {analysis.answerQuality && (
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Answer Quality</h3>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Did you answer? </span>
                            <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.didTheyAnswer}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Specific examples: </span>
                            <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.specificExamples}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">STAR method: </span>
                            <span className="text-gray-600 dark:text-gray-400">{analysis.answerQuality.starMethodUsage}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Honest Assessment</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>

                    {/* Memorable Quotes */}
                    {analysis.memorableQuotes && (
                      <div className="space-y-2">
                        {analysis.memorableQuotes.good && (
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500">
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Good quote</span>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{analysis.memorableQuotes.good}"</p>
                          </div>
                        )}
                        {analysis.memorableQuotes.needsWork && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border-l-2 border-amber-500">
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Needs work</span>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{analysis.memorableQuotes.needsWork}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Strengths */}
                    <div>
                      <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        What You Did Well
                      </h3>
                      <ul className="space-y-1">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div>
                      <h3 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        What to Fix
                      </h3>
                      <ul className="space-y-1">
                        {analysis.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <span className="text-red-500 mt-0.5">✗</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Plan */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-500/10 dark:to-cyan-500/10 border border-violet-100 dark:border-violet-500/20">
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">🎯 Action Plan</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {analysis.recommendation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    {/* Premium Loading Animation */}
                    <div className="relative mb-8">
                      {/* Outer ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-500/20" />
                      {/* Animated gradient ring */}
                      <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-violet-500 border-r-cyan-500 animate-spin" />
                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Text */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Analyzing Your Performance
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs mb-4">
                      Our AI is evaluating your responses and preparing detailed feedback...
                    </p>
                    
                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    {/* Tip */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center max-w-[200px]">
                      This page will update automatically when the analysis is ready
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

