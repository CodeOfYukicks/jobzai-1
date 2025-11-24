import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, ArrowRight, Sparkles } from 'lucide-react';

interface LiveInterviewIntroProps {
    onStart: () => void;
    onCancel: () => void;
    questionCount: number;
}

export const LiveInterviewIntro: React.FC<LiveInterviewIntroProps> = ({
    onStart,
    onCancel,
    questionCount,
}) => {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
            >
                <div className="mb-8 flex justify-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-20 dark:bg-purple-800"></div>
                        <Mic className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                        <div className="absolute -right-2 -top-2 rounded-full bg-white p-2 shadow-lg dark:bg-neutral-800">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Live Interview Simulation
                </h1>

                <p className="mb-10 text-lg text-neutral-600 dark:text-neutral-300">
                    Practice answering {questionCount} questions in real-time. Speak your answers out loud,
                    and receive instant AI feedback on your delivery, content, and clarity.
                </p>

                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            <span className="font-bold">1</span>
                        </div>
                        <h3 className="mb-1 font-semibold text-neutral-900 dark:text-white">Read Question</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            A question will appear on screen. Take a moment to think.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            <span className="font-bold">2</span>
                        </div>
                        <h3 className="mb-1 font-semibold text-neutral-900 dark:text-white">Record Answer</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Speak clearly. We'll transcribe and analyze your response.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                            <span className="font-bold">3</span>
                        </div>
                        <h3 className="mb-1 font-semibold text-neutral-900 dark:text-white">Get Feedback</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Receive a detailed score and tips to improve your answer.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <button
                        onClick={onCancel}
                        className="w-full rounded-full border border-neutral-200 px-8 py-3.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5 sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onStart}
                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
                    >
                        Start Session
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
