import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LiveInterviewIntro } from './LiveInterviewIntro';
import { LiveInterviewQuestion } from './LiveInterviewQuestion';
import { LiveInterviewResults } from './LiveInterviewResults';
import { QuestionEntry, InterviewAnalysis, JobContext } from '../../../types/interview';

interface LiveInterviewSessionProps {
    isOpen: boolean;
    onClose: () => void;
    questions: QuestionEntry[];
    jobContext?: JobContext;
}

type SessionState = 'intro' | 'question' | 'results';

export const LiveInterviewSession: React.FC<LiveInterviewSessionProps> = ({
    isOpen,
    onClose,
    questions,
    jobContext,
}) => {
    const [sessionState, setSessionState] = useState<SessionState>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Reset state when session opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setSessionState('intro');
            setCurrentQuestionIndex(0);
            setAnswers({});
            setAnalysis(null);
            setIsAnalyzing(false);
        }
    }, [isOpen]);

    const handleStart = () => {
        setSessionState('question');
    };

    const analyzeInterview = async (finalAnswers: Record<number, string>) => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/analyze-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questions,
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
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswers = {
            ...answers,
            [currentQuestion.id]: answer
        };
        setAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionState('results');
            analyzeInterview(newAnswers);
        }
    };

    const handleSkipQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionState('results');
            analyzeInterview(answers);
        }
    };

    const handleRetry = () => {
        setSessionState('intro');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setAnalysis(null);
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
                        {sessionState === 'intro' && (
                            <LiveInterviewIntro
                                onStart={handleStart}
                                onCancel={onClose}
                                questionCount={questions.length}
                            />
                        )}

                        {sessionState === 'question' && (
                            <LiveInterviewQuestion
                                question={questions[currentQuestionIndex]}
                                questionIndex={currentQuestionIndex}
                                totalQuestions={questions.length}
                                onNext={handleNextQuestion}
                                onSkip={handleSkipQuestion}
                            />
                        )}

                        {sessionState === 'results' && (
                            <LiveInterviewResults
                                questions={questions}
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
