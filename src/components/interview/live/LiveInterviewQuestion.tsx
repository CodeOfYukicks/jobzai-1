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
}

export const LiveInterviewQuestion: React.FC<LiveInterviewQuestionProps> = ({
    question,
    questionIndex,
    totalQuestions,
    onNext,
    onSkip,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>('');

    useEffect(() => {
        // Reset state when question changes
        setIsRecording(false);
        setTranscript('');
        setInterimTranscript('');
        setElapsedTime(0);
        setIsProcessing(false);
        setError(null);
        finalTranscriptRef.current = '';

        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors on stop
            }
        }
    }, [question]);

    const startRecording = async () => {
        try {
            setError(null);
            setTranscript('');
            setInterimTranscript('');
            finalTranscriptRef.current = '';
            audioChunksRef.current = [];

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize MediaRecorder for audio capture
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();

            // Initialize Web Speech API for real-time transcription
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                // Auto-detect language or use multiple languages
                // Default to English, but will adapt to what user speaks
                recognition.lang = 'en-US';

                // Alternative: support multiple languages
                // recognition.lang = 'en-US,fr-FR,es-ES,de-DE';

                recognition.onresult = (event: any) => {
                    let interim = '';
                    let final = finalTranscriptRef.current;

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPiece = event.results[i][0].transcript;

                        if (event.results[i].isFinal) {
                            final += transcriptPiece + ' ';
                            finalTranscriptRef.current = final;
                        } else {
                            interim += transcriptPiece;
                        }
                    }

                    setTranscript(final.trim());
                    setInterimTranscript(interim);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);

                    if (event.error === 'no-speech') {
                        // Don't show error for no-speech, just wait
                        return;
                    }

                    if (event.error === 'network') {
                        setError('Erreur réseau. Vérifiez votre connexion internet.');
                    } else if (event.error === 'not-allowed') {
                        setError('Permission micro refusée. Veuillez autoriser l\'accès au microphone.');
                    } else {
                        setError(`Erreur: ${event.error}`);
                    }
                };

                recognition.onend = () => {
                    // If recording is still active, restart recognition
                    if (isRecording) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                        }
                    }
                };

                recognition.start();
                recognitionRef.current = recognition;
            } else {
                setError('La reconnaissance vocale n\'est pas supportée par ce navigateur. Utilisez Chrome ou Edge.');
            }

            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);

        } catch (err: any) {
            console.error('Error starting recording:', err);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permission micro refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
            } else if (err.name === 'NotFoundError') {
                setError('Aucun microphone détecté. Veuillez connecter un microphone.');
            } else {
                setError('Erreur lors du démarrage de l\'enregistrement: ' + err.message);
            }
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        setInterimTranscript(''); // Clear interim when stopping

        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.error('Error stopping media recorder:', e);
            }
        }

        // Stop speech recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
        }

        // Ensure we have the final transcript
        setTranscript(finalTranscriptRef.current.trim());
    };

    const handleNext = () => {
        setIsProcessing(true);

        // Small delay for better UX
        setTimeout(() => {
            const finalText = transcript || "No transcription available";
            onNext(finalText);
        }, 500);
    };

    const handleRedo = () => {
        setTranscript('');
        setInterimTranscript('');
        finalTranscriptRef.current = '';
        setElapsedTime(0);
        startRecording();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayTranscript = transcript + (interimTranscript ? ' ' + interimTranscript : '');

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
                    <div className="mb-8 flex min-h-[128px] w-full items-center justify-center rounded-2xl bg-neutral-50 p-6 dark:bg-white/5">
                        {isRecording ? (
                            <div className="flex flex-col items-center w-full gap-4">
                                {/* Audio Visualizer */}
                                <div className="flex items-end gap-1 h-12">
                                    {[...Array(8)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                            className="w-2 rounded-full bg-red-500"
                                        />
                                    ))}
                                </div>
                                {/* Live Transcription */}
                                {displayTranscript && (
                                    <div className="w-full max-h-20 overflow-y-auto text-center text-sm text-neutral-600 dark:text-neutral-300">
                                        <span className="font-medium">{transcript}</span>
                                        {interimTranscript && (
                                            <span className="text-neutral-400 italic"> {interimTranscript}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : displayTranscript ? (
                            <div className="max-h-32 w-full overflow-y-auto px-6 text-center">
                                <p className="text-lg text-neutral-700 dark:text-neutral-200 leading-relaxed">
                                    "{displayTranscript}"
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-neutral-400">
                                <Mic className="mb-2 h-6 w-6" />
                                <span className="text-sm">Ready to record</span>
                                <span className="text-xs mt-1 text-neutral-400">Speak in any language</span>
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
                        {transcript && !isRecording && !isProcessing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleRedo}
                                    className="flex items-center gap-2 rounded-full border-2 border-neutral-300 px-8 py-3.5 text-base font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-white/20 dark:text-neutral-200 dark:hover:border-white/30 dark:hover:bg-white/5"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                    Refaire
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 rounded-full bg-purple-600 px-8 py-3.5 text-base font-medium text-white shadow-lg transition hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/30"
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
