import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { notify } from '@/lib/notify';
import { LiveSessionConfig, InterviewType, QuestionCount } from './LiveSessionConfig';
import { LiveInterviewIntro } from './LiveInterviewIntro';
import { LiveInterviewQuestion } from './LiveInterviewQuestion';
import { LiveInterviewResults } from './LiveInterviewResults';
import { QuestionEntry, InterviewAnalysis, JobContext } from '../../../types/interview';

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
}) => {
    const [sessionState, setSessionState] = useState<SessionState>('config');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
    const [sessionQuestions, setSessionQuestions] = useState<QuestionEntry[]>(questions);
    const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType | undefined>(undefined);

    // Update session questions when questions prop changes
    React.useEffect(() => {
        if (questions.length > 0) {
            setSessionQuestions(questions);
        }
    }, [questions]);

    // Reset state when session opens/closes
    React.useEffect(() => {
        if (isOpen) {
            // Always start with config screen to let user choose type and count
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
    }, [isOpen]);

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
            console.log('📤 Sending to analyze-interview:', {
                questionsCount: sessionQuestions.length,
                questionIds: sessionQuestions.map(q => q.id),
                answersKeys: Object.keys(finalAnswers),
                answers: finalAnswers
            });

            const response = await fetch('/api/analyze-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questions: sessionQuestions,
                    answers: finalAnswers,
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
                    className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0c0c0e]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">Live Session</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
                        >
                            <X className="h-5 w-5" />
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
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
