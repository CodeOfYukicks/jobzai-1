import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { QuestionEntry } from '../../../types/interview';

interface LiveInterviewQuestionProps {
    question: QuestionEntry;
    questionIndex: number;
    totalQuestions: number;
    onNext: (answer: string) => void;
    onSkip: () => void;
    detectedLanguage: string | null;
    onLanguageDetected: (language: string) => void;
}

export const LiveInterviewQuestion: React.FC<LiveInterviewQuestionProps> = ({
    question,
    questionIndex,
    totalQuestions,
    onNext,
    onSkip,
    detectedLanguage,
    onLanguageDetected,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Reset state when question changes
        setIsRecording(false);
        setTranscript('');
        setElapsedTime(0);
        setIsProcessing(false);
        setIsTranscribing(false);
        setError(null);
        audioChunksRef.current = [];

        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.error('Error stopping media recorder:', e);
            }
        }
    }, [question]);

    const startRecording = async () => {
        try {
            setError(null);
            setTranscript('');
            audioChunksRef.current = [];

            console.log('🎤 Starting audio recording with Whisper...');

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize MediaRecorder for audio capture
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log('📼 Audio chunk received:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('⏹️ Recording stopped, processing audio...');
                await transcribeAudio();
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            console.log('✅ Recording started successfully');

            // Start timer
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error('❌ Error starting recording:', err);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow microphone access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone detected. Please connect a microphone.');
            } else {
                setError('Error starting recording: ' + err.message);
            }
        }
    };

    const transcribeAudio = async () => {
        try {
            setIsTranscribing(true);
            console.log('🔄 Transcribing audio with Whisper...');

            // Create audio blob from chunks
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('📦 Audio blob created:', audioBlob.size, 'bytes');

            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            
            await new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        const base64Audio = reader.result as string;
                        console.log('📤 Sending to Whisper API...', {
                            hasDetectedLanguage: !!detectedLanguage,
                            language: detectedLanguage || 'auto-detect'
                        });

                        // Send to backend for transcription
                        const response = await fetch('/api/transcribe-audio', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                audioData: base64Audio,
                                detectedLanguage: detectedLanguage // Send previously detected language
                            })
                        });

                        if (!response.ok) {
                            throw new Error('Transcription failed');
                        }

                        const data = await response.json();
                        
                        if (data.status === 'success') {
                            const transcription = data.transcription || '';
                            const language = data.detectedLanguage;
                            
                            console.log('✅ Transcription received:', {
                                transcription: transcription.substring(0, 50) + '...',
                                language: language,
                                isFirstDetection: !detectedLanguage
                            });
                            
                            setTranscript(transcription);
                            
                            // Store detected language for subsequent questions
                            if (!detectedLanguage && language) {
                                console.log('🌍 Language detected for session:', language);
                                onLanguageDetected(language);
                            }
                        } else {
                            throw new Error(data.message || 'Transcription failed');
                        }

                        resolve(null);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
            });

        } catch (error) {
            console.error('❌ Error transcribing audio:', error);
            setError('Error during transcription. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const stopRecording = () => {
        setIsRecording(false);

        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Stop media recorder (this will trigger onstop which calls transcribeAudio)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.error('Error stopping media recorder:', e);
            }
        }
    };

    const handleNext = () => {
        setIsProcessing(true);

        // Small delay for better UX
        setTimeout(() => {
            const finalText = transcript || "No transcription available";
            console.log('📤 Sending transcript to next question:', finalText);
            onNext(finalText);
        }, 500);
    };

    const handleRedo = () => {
        setTranscript('');
        setElapsedTime(0);
        audioChunksRef.current = [];
        startRecording();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayTranscript = transcript;

    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6">
            <div className="w-full max-w-3xl">
                {/* Progress */}
                <div className="mb-12 flex items-center justify-between text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    <span>Question {questionIndex + 1} of {totalQuestions}</span>
                    <span>{question.tags[0] || 'General'}</span>
                </div>

                {/* Question Card */}
                <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-3xl font-bold leading-tight text-neutral-900 dark:text-white md:text-4xl">
                        {question.text}
                    </h2>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                {/* Recording Interface */}
                <div className="flex flex-col items-center">
                    {/* Visualizer / Transcription Display */}
                    <div className="mb-8 flex min-h-[160px] w-full items-center justify-center rounded-2xl bg-neutral-50 p-6 dark:bg-white/5 border-2 border-transparent transition-colors" style={{ borderColor: isRecording ? 'rgba(239, 68, 68, 0.3)' : isTranscribing ? 'rgba(147, 51, 234, 0.3)' : 'transparent' }}>
                        {isTranscribing ? (
                            <div className="flex flex-col items-center w-full gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-base font-medium text-purple-600 dark:text-purple-400">
                                        Transcribing...
                                    </span>
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                        Analyzing your answer with Whisper AI
                                    </span>
                                </div>
                            </div>
                        ) : isRecording ? (
                            <div className="flex flex-col items-center w-full gap-4">
                                {/* Audio Visualizer */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-end gap-1 h-16">
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [12, Math.random() * 50 + 15, 12] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.08 }}
                                                className="w-1.5 rounded-full bg-gradient-to-t from-red-600 to-red-400"
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Recording Indicator */}
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                    <span className="text-sm font-medium">Recording...</span>
                                </div>
                            </div>
                        ) : displayTranscript ? (
                            <div className="max-h-40 w-full overflow-y-auto px-8 text-left">
                                <div className="rounded-lg bg-white dark:bg-white/10 p-6 shadow-sm">
                                    <p className="text-base text-neutral-800 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap">
                                        {displayTranscript}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-neutral-400">
                                <Mic className="mb-3 h-8 w-8" />
                                <span className="text-base font-medium">Ready to record</span>
                                <span className="text-sm mt-1 text-neutral-400">Click the microphone to start</span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Recording Button */}
                        {!isRecording && !transcript && !isProcessing && (
                            <button
                                onClick={startRecording}
                                className="group flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/30"
                            >
                                <Mic className="h-10 w-10" />
                            </button>
                        )}

                        {/* Stop Button */}
                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="group flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-neutral-800 focus:outline-none focus:ring-4 focus:ring-neutral-500/30 dark:bg-white dark:text-neutral-900"
                            >
                                <Square className="h-8 w-8 fill-current" />
                            </button>
                        )}

                        {/* Action Buttons (Redo + Next) */}
                        {transcript && !isRecording && !isProcessing && !isTranscribing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleRedo}
                                    className="flex items-center gap-2 rounded-full border-2 border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:border-white/30 dark:hover:bg-white/5"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Re-record
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 px-10 py-3.5 text-base font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-500/30"
                                >
                                    Next Question
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {/* Processing State */}
                        {isProcessing && (
                            <button
                                disabled
                                className="flex items-center gap-2 rounded-full bg-neutral-100 px-8 py-3.5 text-base font-medium text-neutral-400 dark:bg-white/10 dark:text-neutral-500"
                            >
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Processing...
                            </button>
                        )}

                        {/* Timer */}
                        {isRecording && (
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-mono text-base font-medium text-red-500">
                                    {formatTime(elapsedTime)}
                                </span>
                            </div>
                        )}

                        {/* Skip Button */}
                        {!isRecording && !transcript && !isProcessing && (
                            <button
                                onClick={onSkip}
                                className="mt-4 text-sm text-neutral-400 hover:text-neutral-600 transition dark:hover:text-neutral-200"
                            >
                                Skip this question
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
