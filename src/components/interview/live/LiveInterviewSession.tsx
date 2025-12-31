import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { notify } from '@/lib/notify';
import { LiveSessionConfig, InterviewType, QuestionCount } from './LiveSessionConfig';
import { LiveInterviewIntro } from './LiveInterviewIntro';
import { LiveInterviewQuestion } from './LiveInterviewQuestion';
import { LiveInterviewResults } from './LiveInterviewResults';
import { QuestionEntry, InterviewAnalysis, JobContext } from '../../../types/interview';

interface SessionRecord {
    id: string;
    date: string;
    timestamp: number;
    overallScore: number;
    passed: boolean;
    tier: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export interface HistorySessionData {
    questions: QuestionEntry[];
    answers: Record<number, string>;
    analysis: InterviewAnalysis;
    date: string;
}

interface LiveInterviewSessionProps {
    isOpen: boolean;
    onClose: () => void;
    questions: QuestionEntry[];
    jobContext?: JobContext;
    onSessionComplete?: (sessionData: {
        analysis: InterviewAnalysis;
        answers: Record<number, string>;
        questionsCount: number;
    }) => void;
    onGenerateQuestions?: (type: InterviewType, count: QuestionCount) => Promise<QuestionEntry[]>;
    companyName?: string;
    position?: string;
    previousSessions?: SessionRecord[];
    historySession?: HistorySessionData;
}

type SessionState = 'config' | 'intro' | 'question' | 'results';

export const LiveInterviewSession: React.FC<LiveInterviewSessionProps> = ({
    isOpen,
    onClose,
    questions,
    jobContext,
    onSessionComplete,
    onGenerateQuestions,
    companyName,
    position,
    previousSessions = [],
    historySession,
}) => {
    const isHistoryMode = !!historySession;
    const [sessionState, setSessionState] = useState<SessionState>(isHistoryMode ? 'results' : 'config');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>(historySession?.answers || {});
    const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(historySession?.analysis || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
    const [sessionQuestions, setSessionQuestions] = useState<QuestionEntry[]>(historySession?.questions || questions);
    const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType | undefined>(undefined);

    // Update session questions when questions prop changes
    React.useEffect(() => {
        if (!isHistoryMode && questions.length > 0) {
            setSessionQuestions(questions);
        }
    }, [questions, isHistoryMode]);

    // Reset state when session opens/closes
    React.useEffect(() => {
        if (isOpen) {
            if (historySession) {
                // History mode: start directly in results with pre-loaded data
                setSessionState('results');
                setSessionQuestions(historySession.questions);
                setAnswers(historySession.answers);
                setAnalysis(historySession.analysis);
                setIsAnalyzing(false);
                setIsGeneratingQuestions(false);
            } else {
                // Normal mode: start with config screen
                setSessionState('config');
                setCurrentQuestionIndex(0);
                setAnswers({});
                setAnalysis(null);
                setIsAnalyzing(false);
                setIsGeneratingQuestions(false);
                setDetectedLanguage(null);
                setSessionQuestions([]); // Reset to empty, will be populated after config
                setSelectedInterviewType(undefined);
            }
        }
    }, [isOpen, historySession]);

    const handleConfigStart = async (type: InterviewType, count: QuestionCount) => {
        setSelectedInterviewType(type); // Store the selected interview type
        if (!onGenerateQuestions) {
            // If no generator, use existing questions if available
            if (questions.length > 0) {
                setSessionQuestions(questions);
                setSessionState('intro');
            } else {
                // No questions and no generator - show error or stay on config
                console.error('No question generator available and no existing questions');
                return;
            }
            return;
        }

        setIsGeneratingQuestions(true);
        setSelectedInterviewType(type); // Store the selected interview type
        try {
            const generatedQuestions = await onGenerateQuestions(type, count);
            console.log('✅ Generated questions for live session:', {
                type,
                count,
                questionsCount: generatedQuestions.length,
                questions: generatedQuestions.map(q => ({ id: q.id, text: q.text.substring(0, 50) + '...' }))
            });
            setSessionQuestions(generatedQuestions);
            setSessionState('intro');
        } catch (error) {
            console.error('Error generating questions:', error);
            // On error, try to use existing questions if available
            if (questions.length > 0) {
                setSessionQuestions(questions);
                setSessionState('intro');
            } else {
                // No fallback questions - stay on config or show error
                notify.error('Failed to generate questions. Please try again.');
            }
        } finally {
            setIsGeneratingQuestions(false);
        }
    };

    const handleStart = () => {
        setSessionState('question');
    };

    const analyzeInterview = async (finalAnswers: Record<number, string>) => {
        setIsAnalyzing(true);
        try {
            // Construct transcript for backend
            const transcript = sessionQuestions.flatMap(q => [
                { role: 'interviewer', text: q.text },
                { role: 'candidate', text: finalAnswers[q.id] || "No answer provided" }
            ]);

            console.log('📤 Sending to analyze-live-interview:', {
                transcriptLength: transcript.length,
                jobContext
            });

            const response = await fetch('/api/analyze-live-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript,
                    jobContext
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            if (data.status === 'success') {
                setAnalysis(data.analysis);

                // Save session to history
                if (onSessionComplete) {
                    onSessionComplete({
                        analysis: data.analysis,
                        answers: finalAnswers,
                        questionsCount: sessionQuestions.length
                    });
                }
            } else {
                console.error('Analysis error:', data.message);
            }
        } catch (error) {
            console.error('Error analyzing interview:', error);
            // In a real app, handle error state appropriately
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNextQuestion = (answer: string) => {
        const currentQuestion = sessionQuestions[currentQuestionIndex];
        console.log(`📝 Answering question ${currentQuestionIndex + 1}/${sessionQuestions.length}:`, {
            questionId: currentQuestion.id,
            questionText: currentQuestion.text.substring(0, 60) + (currentQuestion.text.length > 60 ? '...' : ''),
            answerLength: answer.length
        });
        const newAnswers = {
            ...answers,
            [currentQuestion.id]: answer
        };
        setAnswers(newAnswers);

        if (currentQuestionIndex < sessionQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionState('results');
            analyzeInterview(newAnswers);
        }
    };

    const handleSkipQuestion = () => {
        if (currentQuestionIndex < sessionQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionState('results');
            analyzeInterview(answers);
        }
    };

    const handleRetry = () => {
        // In history mode, close the view and let parent handle re-opening a new session
        if (isHistoryMode) {
            onClose();
            return;
        }
        setSessionState('config');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setAnalysis(null);
        setSessionQuestions([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] md:z-40 flex flex-col bg-white dark:bg-[#1a1a1c] md:top-12 md:left-16 md:bottom-0"
                >
                    {/* Header - Compact */}
                    <div className="flex items-center justify-between px-4 py-3 sm:py-2 border-b border-black/5 dark:border-white/5" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
                        <div className="flex items-center gap-2 min-w-0">
                            {isHistoryMode ? (
                                <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                        Session History
                                    </span>
                                    {historySession?.date && (
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                            — {new Date(historySession.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Live Session</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 text-neutral-400 hover:bg-black/5 dark:text-neutral-500 dark:hover:bg-white/5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {isGeneratingQuestions && (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white"></div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Generating personalized questions...
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isGeneratingQuestions && sessionState === 'config' && (
                            <LiveSessionConfig
                                onStart={handleConfigStart}
                                onCancel={onClose}
                                companyName={companyName}
                                position={position}
                            />
                        )}

                        {!isGeneratingQuestions && sessionState === 'intro' && (
                            <LiveInterviewIntro
                                onStart={handleStart}
                                onCancel={onClose}
                                questionCount={sessionQuestions.length}
                                interviewType={selectedInterviewType}
                            />
                        )}

                        {!isGeneratingQuestions && sessionState === 'question' && sessionQuestions.length > 0 && (
                            <LiveInterviewQuestion
                                question={sessionQuestions[currentQuestionIndex]}
                                questionIndex={currentQuestionIndex}
                                totalQuestions={sessionQuestions.length}
                                onNext={handleNextQuestion}
                                onSkip={handleSkipQuestion}
                                detectedLanguage={detectedLanguage}
                                onLanguageDetected={setDetectedLanguage}
                            />
                        )}

                        {!isGeneratingQuestions && sessionState === 'results' && (
                            <LiveInterviewResults
                                questions={sessionQuestions}
                                answers={answers}
                                analysis={analysis}
                                onClose={onClose}
                                onRetry={handleRetry}
                                previousSessions={previousSessions}
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
