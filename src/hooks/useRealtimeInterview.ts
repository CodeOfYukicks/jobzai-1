/**
 * useRealtimeInterview - Clean hook for OpenAI Realtime API
 * 
 * Handles:
 * - WebSocket connection with ephemeral token
 * - Audio capture via Web Audio API + AudioWorklet
 * - Real-time transcription (user + AI)
 * - Audio playback from AI responses
 * 
 * Critical implementation notes:
 * - Uses gpt-4o-transcribe (NOT whisper-1)
 * - Sends session.update on ws.onopen (no hard-block on session.created)
 * - Tolerant event handling for AI transcript variants
 * - Manual silence fallback in addition to server VAD
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ConnectionStatus, TranscriptEntry } from '../types/openai-realtime';

// ============================================
// TYPES
// ============================================

export interface JobContext {
  companyName: string;
  position: string;
  jobDescription?: string;
  requirements?: string[];
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPosition?: string;
  yearsOfExperience?: number;
  skills?: string[];
  education?: string;
  cvText?: string;
  targetPosition?: string;
  targetSectors?: string[];
}

export interface UseRealtimeInterviewReturn {
  // State
  connectionStatus: ConnectionStatus;
  transcript: TranscriptEntry[];
  error: string | null;
  isAISpeaking: boolean;
  elapsedTime: number;
  isMuted: boolean;
  
  // Actions
  connect: (jobContext: JobContext, userProfile: UserProfile) => Promise<void>;
  disconnect: () => void;
  concludeInterview: () => void;
  getFullTranscript: () => TranscriptEntry[];
  toggleMute: () => void;
  
  // Audio levels (for UI visualization)
  inputAudioLevel: number;
  outputAudioLevel: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const SILENCE_TIMEOUT_MS = 2000; // 2 seconds of silence = fallback commit

// ============================================
// HOOK
// ============================================

export function useRealtimeInterview(): UseRealtimeInterviewReturn {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  // Audio state
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Refs for resources
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null); // For capture (48kHz)
  const playbackContextRef = useRef<AudioContext | null>(null); // For playback (24kHz) - eliminates resampling artifacts
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);
  
  // Refs for state tracking
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioTimeRef = useRef<number>(0);
  const isEndedRef = useRef<boolean>(false);
  const currentAssistantIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const jobContextRef = useRef<JobContext | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);
  const sessionReadyRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  
  // Audio playback queue
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const nextPlayTimeRef = useRef<number>(0);
  
  // Audio accumulation buffer for smoother playback (reduces chunk boundary artifacts)
  const pendingSamplesRef = useRef<Float32Array[]>([]);
  const pendingSamplesLengthRef = useRef<number>(0);
  const CHUNK_ACCUMULATION_MS = 100; // Accumulate 100ms of audio before playing
  const SAMPLES_PER_CHUNK = Math.floor(24000 * CHUNK_ACCUMULATION_MS / 1000); // ~2400 samples

  // ============================================
  // TRANSCRIPT MANAGEMENT
  // ============================================

  const addOrUpdateTranscript = useCallback((
    id: string,
    role: 'user' | 'assistant',
    text: string,
    isComplete: boolean = false
  ) => {
    setTranscript(prev => {
      const existingIndex = prev.findIndex(e => e.id === id);
      if (existingIndex === -1) {
        // Add new entry
        return [...prev, {
          id,
          role,
          text,
          timestamp: Date.now(),
          isComplete,
        }];
      } else {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          text: updated[existingIndex].text + text,
          isComplete,
        };
        return updated;
      }
    });
  }, []);

  const setTranscriptComplete = useCallback((id: string, finalText?: string) => {
    setTranscript(prev => {
      const index = prev.findIndex(e => e.id === id);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        text: finalText ?? updated[index].text,
        isComplete: true,
      };
      return updated;
    });
  }, []);

  // ============================================
  // SESSION INSTRUCTIONS
  // ============================================

  const buildInstructions = useCallback((): string => {
    const job = jobContextRef.current;
    const user = userProfileRef.current;
    
    const userName = user?.firstName || 'the candidate';
    const position = job?.position || 'the position';
    const company = job?.companyName || 'the company';
    
    // Build user context
    const userParts: string[] = [];
    if (user?.firstName || user?.lastName) {
      userParts.push(`Name: ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`);
    }
    if (user?.currentPosition) userParts.push(`Current Position: ${user.currentPosition}`);
    if (user?.yearsOfExperience) userParts.push(`Years of Experience: ${user.yearsOfExperience}`);
    if (user?.skills?.length) userParts.push(`Key Skills: ${user.skills.slice(0, 10).join(', ')}`);
    if (user?.education) userParts.push(`Education: ${user.education}`);
    if (user?.cvText) userParts.push(`Resume Summary:\n${user.cvText.slice(0, 2000)}`);
    
    const userContext = userParts.length > 0 
      ? `\n\n## Candidate Profile\n${userParts.join('\n')}` 
      : '';
    
    // Build job context
    const jobParts: string[] = [];
    if (job?.companyName) jobParts.push(`Company: ${job.companyName}`);
    if (job?.position) jobParts.push(`Position: ${job.position}`);
    if (job?.jobDescription) jobParts.push(`Job Description:\n${job.jobDescription.slice(0, 1500)}`);
    if (job?.requirements?.length) jobParts.push(`Key Requirements: ${job.requirements.slice(0, 8).join(', ')}`);
    
    const jobContext = jobParts.length > 0
      ? `\n\n## Position Details\n${jobParts.join('\n')}`
      : '';

    return `# Senior HR Interview Manager - Mock Interview Session

You are Alex, an elite Senior HR Interview Manager conducting a professional mock interview.

## Your Identity
- Your name is Alex
- 15 years of experience in talent acquisition
- Specialize in technical and leadership roles

## Interview Structure
1. Opening (1-2 min): Introduce yourself, make candidate comfortable
2. Background Questions (3-4 min): Explore experience
3. Technical/Role-Specific (5-7 min): Deep dive into skills
4. Behavioral Questions (5-7 min): STAR method prompts
5. Situational Questions (3-4 min): Hypothetical scenarios
6. Candidate Questions (2-3 min): Allow them to ask questions
7. Closing (1 min): Thank them, explain next steps

## Response Style
- Keep responses concise (2-4 sentences typically)
- Acknowledge answers before next question
- If answers are vague, ask for specific examples
- Never interrupt mid-sentence

## Important Rules
- Stay in character throughout
- Do not break the fourth wall
- Save detailed feedback for the end
- Be culturally sensitive
${userContext}
${jobContext}

## Starting the Interview
Greet ${userName} professionally, introduce yourself as Alex, interviewer for ${position} at ${company}. Explain the format briefly, then ask your first question about their background.

IMPORTANT: Your name is Alex. Never say "[Interviewer Name]".`;
  }, []);

  // ============================================
  // AUDIO PLAYBACK
  // ============================================

  const playNextInQueue = useCallback(() => {
    if (!playbackContextRef.current || !playbackGainRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsAISpeaking(false);
      setOutputAudioLevel(0);
      return;
    }

    isPlayingRef.current = true;
    setIsAISpeaking(true);
    
    const buffer = audioQueueRef.current.shift()!;
    const source = playbackContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackGainRef.current);
    
    const currentTime = playbackContextRef.current.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
    
    // Calculate output level for visualization
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < data.length; i += 100) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / (data.length / 100));
    setOutputAudioLevel(Math.min(1, rms * 3));
    
    source.onended = () => {
      if (audioQueueRef.current.length > 0) {
        playNextInQueue();
      } else {
        isPlayingRef.current = false;
        setIsAISpeaking(false);
        setOutputAudioLevel(0);
      }
    };
  }, []);

  // Flush accumulated samples into an AudioBuffer and queue it
  const flushPendingSamples = useCallback(() => {
    if (!playbackContextRef.current || pendingSamplesRef.current.length === 0) return;
    
    // Concatenate all pending samples into one buffer
    const totalLength = pendingSamplesLengthRef.current;
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pendingSamplesRef.current) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Apply fade-in/fade-out to reduce clicks at boundaries
    const fadeLength = Math.min(64, Math.floor(totalLength / 10)); // ~2.7ms fade at 24kHz
    for (let i = 0; i < fadeLength; i++) {
      const fadeIn = i / fadeLength;
      combined[i] *= fadeIn;
      combined[totalLength - 1 - i] *= fadeIn;
    }
    
    // Create audio buffer
    const audioBuffer = playbackContextRef.current.createBuffer(1, totalLength, 24000);
    audioBuffer.getChannelData(0).set(combined);
    
    audioQueueRef.current.push(audioBuffer);
    
    // Clear pending samples
    pendingSamplesRef.current = [];
    pendingSamplesLengthRef.current = 0;
    
    // Start playback if not already playing
    if (!isPlayingRef.current) {
      nextPlayTimeRef.current = playbackContextRef.current.currentTime + 0.1;
      playNextInQueue();
    }
  }, [playNextInQueue]);

  const queueAudioChunk = useCallback(async (base64Audio: string) => {
    if (!playbackContextRef.current) return;
    
    try {
      // Decode base64 to PCM16
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }
      
      // Accumulate samples instead of playing immediately
      pendingSamplesRef.current.push(float32);
      pendingSamplesLengthRef.current += float32.length;
      
      // Flush when we have enough samples (reduces boundary artifacts)
      if (pendingSamplesLengthRef.current >= SAMPLES_PER_CHUNK) {
        flushPendingSamples();
      }
    } catch (err) {
      console.error('Error decoding audio:', err);
    }
  }, [flushPendingSamples]);

  const stopAudioPlayback = useCallback(() => {
    audioQueueRef.current = [];
    pendingSamplesRef.current = [];
    pendingSamplesLengthRef.current = 0;
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    setIsAISpeaking(false);
    setOutputAudioLevel(0);
    
    // Mute instantly
    if (playbackGainRef.current && playbackContextRef.current) {
      playbackGainRef.current.gain.setValueAtTime(0, playbackContextRef.current.currentTime);
      // Restore after a moment for new audio
      setTimeout(() => {
        if (playbackGainRef.current && playbackContextRef.current) {
          playbackGainRef.current.gain.setValueAtTime(1, playbackContextRef.current.currentTime);
        }
      }, 100);
    }
  }, []);

  // ============================================
  // WEBSOCKET EVENT HANDLING
  // ============================================

  const sendEvent = useCallback((event: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  const handleServerEvent = useCallback((event: any) => {
    const eventType = event.type as string;
    
    // Log events (except frequent audio deltas)
    if (!eventType.includes('audio.delta')) {
      console.log('📨 Server event:', eventType);
    }

    switch (eventType) {
      // ========== SESSION EVENTS ==========
      case 'session.created':
        console.log('✅ Session created');
        // Don't block here - we already sent session.update on open
        break;
        
      case 'session.updated':
        console.log('✅ Session updated - ready to go');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f1b6f097-e586-4b69-89f1-94728d17977c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useRealtimeInterview.ts:364',message:'session.updated received - config applied',data:{sessionConfig: event.session ? JSON.stringify(event.session).substring(0, 300) : 'no session data'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
        // #endregion
        sessionReadyRef.current = true;
        setConnectionStatus('live');
        // Trigger initial greeting
        triggerGreeting();
        break;
        
      case 'error':
        const errorMsg = event.error?.message || 'Unknown error';
        console.error('❌ Server error:', errorMsg);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f1b6f097-e586-4b69-89f1-94728d17977c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useRealtimeInterview.ts:374',message:'SERVER ERROR',data:{errorMsg, fullError: JSON.stringify(event.error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H4'})}).catch(()=>{});
        // #endregion
        // Ignore "no active response" errors (normal after barge-in)
        if (!errorMsg.includes('no active response')) {
          setError(errorMsg);
        }
        break;

      // ========== USER SPEECH EVENTS ==========
      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking');
        // Generate stable ID for this user entry
        const userId = event.item_id || `user_${Date.now()}`;
        currentUserIdRef.current = userId;
        
        // Create placeholder entry immediately to reserve correct position in transcript
        // This ensures user entries always appear before AI responses
        addOrUpdateTranscript(userId, 'user', '', false);
        
        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // Barge-in: stop AI audio
        stopAudioPlayback();
        sendEvent({ type: 'response.cancel' });
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 User stopped speaking');
        break;
        
      case 'input_audio_buffer.committed':
        console.log('🎤 Audio buffer committed');
        if (event.item_id) {
          currentUserIdRef.current = event.item_id;
        }
        break;

      // ========== USER TRANSCRIPTION EVENTS ==========
      case 'conversation.item.input_audio_transcription.completed':
        console.log('📝 User transcription:', event.transcript);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f1b6f097-e586-4b69-89f1-94728d17977c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useRealtimeInterview.ts:408',message:'USER TRANSCRIPTION RECEIVED',data:{transcript: event.transcript, itemId: event.item_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        if (event.transcript?.trim()) {
          const id = event.item_id || currentUserIdRef.current || `user_${Date.now()}`;
          // Replace any existing partial with final
          setTranscript(prev => {
            const existing = prev.findIndex(e => e.id === id);
            if (existing !== -1) {
              const updated = [...prev];
              updated[existing] = {
                ...updated[existing],
                text: event.transcript,
                isComplete: true,
              };
              return updated;
            }
            return [...prev, {
              id,
              role: 'user',
              text: event.transcript,
              timestamp: Date.now(),
              isComplete: true,
            }];
          });
        }
        break;
        
      case 'conversation.item.input_audio_transcription.failed':
        console.warn('⚠️ Transcription failed:', event.error);
        break;

      // ========== AI RESPONSE EVENTS ==========
      case 'response.created':
        console.log('🤖 Response started');
        currentAssistantIdRef.current = null;
        break;
        
      case 'response.output_item.added':
        if (event.item?.role === 'assistant') {
          currentAssistantIdRef.current = event.item.id;
          console.log('🤖 Assistant item:', event.item.id);
        }
        break;

      // ========== AI TRANSCRIPT EVENTS (tolerant handling) ==========
      case 'response.audio_transcript.delta':
      case 'response.output_audio_transcript.delta':
      case 'response.text.delta':
      case 'response.output_text.delta':
        const delta = event.delta;
        if (delta) {
          const id = event.item_id || currentAssistantIdRef.current || `assistant_${Date.now()}`;
          addOrUpdateTranscript(id, 'assistant', delta, false);
        }
        break;
        
      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
      case 'response.text.done':
      case 'response.output_text.done':
        const finalText = event.transcript || event.text;
        console.log('📝 AI transcript done:', finalText?.substring(0, 50) + '...');
        if (finalText) {
          const id = event.item_id || currentAssistantIdRef.current;
          if (id) {
            setTranscriptComplete(id, finalText);
          }
        }
        break;

      // ========== AI AUDIO EVENTS ==========
      case 'response.audio.delta':
      case 'response.output_audio.delta':
        if (event.delta) {
          queueAudioChunk(event.delta);
        }
        break;
        
      case 'response.audio.done':
      case 'response.output_audio.done':
        console.log('🔊 AI audio done');
        // Flush any remaining accumulated samples
        flushPendingSamples();
        break;

      // ========== RESPONSE LIFECYCLE ==========
      case 'response.done':
        console.log('✅ Response complete');
        if (currentAssistantIdRef.current) {
          setTranscriptComplete(currentAssistantIdRef.current);
        }
        currentAssistantIdRef.current = null;
        
        // Check if this was the conclusion
        if (isEndedRef.current) {
          console.log('🏁 Interview concluded');
        }
        break;
        
      case 'response.cancelled':
        console.log('🔇 Response cancelled');
        currentAssistantIdRef.current = null;
        break;

      // ========== OTHER EVENTS ==========
      case 'rate_limits.updated':
        // Ignore
        break;
        
      default:
        // Log unknown events that might contain useful data
        if (event.transcript) {
          console.log('📝 Unknown event with transcript:', eventType, event.transcript);
        }
        if (event.delta && typeof event.delta === 'string' && event.delta.length > 100) {
          // Might be audio
          queueAudioChunk(event.delta);
        }
        break;
    }
  }, [addOrUpdateTranscript, setTranscriptComplete, stopAudioPlayback, sendEvent, queueAudioChunk, flushPendingSamples]);

  const triggerGreeting = useCallback(() => {
    if (!jobContextRef.current || !userProfileRef.current) return;
    
    const userName = userProfileRef.current.firstName || 'the candidate';
    const position = jobContextRef.current.position || 'the position';
    const company = jobContextRef.current.companyName || 'the company';
    
    console.log('🎤 Triggering initial greeting...');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f1b6f097-e586-4b69-89f1-94728d17977c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useRealtimeInterview.ts:533',message:'triggerGreeting called',data:{userName, position, company},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
    sendEvent({
      type: 'response.create',
      response: {
        instructions: `START THE INTERVIEW NOW:
1. Greet ${userName} professionally (NOT casually)
2. Introduce yourself as Alex, interviewer for ${position} at ${company}
3. Briefly explain the interview format
4. Ask your first question about their background

Be warm but professional. Your name is Alex.`,
      },
    });
  }, [sendEvent]);

  // ============================================
  // AUDIO CAPTURE
  // ============================================

  const setupAudioCapture = useCallback(async () => {
    try {
      // Get microphone
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      // Create audio context for capture (48kHz for microphone)
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      
      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create separate audio context for playback at 24kHz (matches OpenAI output)
      // This eliminates resampling artifacts that cause crackling/buzzing
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (playbackContextRef.current.state === 'suspended') {
        await playbackContextRef.current.resume();
      }
      
      // Create playback gain node on the playback context
      playbackGainRef.current = playbackContextRef.current.createGain();
      playbackGainRef.current.connect(playbackContextRef.current.destination);
      
      // Load audio worklet
      await audioContextRef.current.audioWorklet.addModule('/audio-worklet-processor.js');
      
      // Create nodes
      const sourceNode = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-realtime-processor');
      
      // Handle audio data from worklet
      workletNodeRef.current.port.onmessage = (event) => {
        const { type, audio, level } = event.data;
        
        if (type === 'audio' && wsRef.current?.readyState === WebSocket.OPEN) {
          // Only send audio if not muted
          if (!isMutedRef.current) {
            sendEvent({
              type: 'input_audio_buffer.append',
              audio,
            });
            lastAudioTimeRef.current = Date.now();
            
            // Reset silence timeout
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }
            
            // Set silence fallback timeout
            silenceTimeoutRef.current = setTimeout(() => {
              // Manual commit if server VAD didn't trigger
              if (wsRef.current?.readyState === WebSocket.OPEN && !isMutedRef.current) {
                console.log('⏱️ Silence timeout - committing audio buffer');
                sendEvent({ type: 'input_audio_buffer.commit' });
              }
            }, SILENCE_TIMEOUT_MS);
          }
        } else if (type === 'volume') {
          // Show audio level even when muted (so user can see their mic is working)
          setInputAudioLevel(isMutedRef.current ? 0 : level);
        }
      };
      
      // Connect pipeline
      sourceNode.connect(workletNodeRef.current);
      
      // Silent output to keep worklet running
      const silentGain = audioContextRef.current.createGain();
      silentGain.gain.value = 0;
      workletNodeRef.current.connect(silentGain);
      silentGain.connect(audioContextRef.current.destination);
      
      console.log('✅ Audio capture ready');
    } catch (err) {
      console.error('❌ Audio setup failed:', err);
      throw new Error('Microphone access required. Please allow microphone access.');
    }
  }, [sendEvent]);

  // ============================================
  // CONNECTION
  // ============================================

  const connect = useCallback(async (jobContext: JobContext, userProfile: UserProfile) => {
    // Store context
    jobContextRef.current = jobContext;
    userProfileRef.current = userProfile;
    isEndedRef.current = false;
    sessionReadyRef.current = false;
    
    // Reset state
    setTranscript([]);
    setError(null);
    setElapsedTime(0);
    setConnectionStatus('connecting');
    
    try {
      // Get session credentials from backend
      const response = await fetch('/api/openai-realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const sessionData = await response.json();
      if (sessionData.status === 'error') {
        throw new Error(sessionData.message);
      }
      
      console.log('✅ Session credentials received');
      
      // Setup audio capture first
      await setupAudioCapture();
      
      // Connect WebSocket
      wsRef.current = new WebSocket(sessionData.url, [
        'realtime',
        `openai-insecure-api-key.${sessionData.client_secret}`,
      ]);
      
      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setConnectionStatus('ready');
        
        // IMMEDIATELY send session.update (don't wait for session.created)
        const instructions = buildInstructions();
        console.log('📝 Sending session.update...');
        
        // GA Realtime API session.update payload
        // - session.type: "realtime" is REQUIRED
        // - audio.input.transcription replaces input_audio_transcription
        // - audio.output.voice replaces session.voice
        // - turn_detection is under audio.input
        const sessionUpdatePayload = {
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions,
            audio: {
              input: {
                format: { type: 'audio/pcm', rate: 24000 },
                transcription: { model: 'gpt-4o-transcribe' },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500,
                },
              },
              output: {
                voice: 'cedar',
              },
            },
          },
        };
        
        sendEvent(sessionUpdatePayload);
        
        // Start timer
        startTimeRef.current = Date.now();
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
          
          // Auto-conclude at max duration
          if (elapsed * 1000 >= MAX_DURATION_MS && !isEndedRef.current) {
            console.log('⏱️ Time is up!');
            concludeInterview();
          }
        }, 1000);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerEvent(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
      
      wsRef.current.onerror = (event) => {
        console.error('🔌 WebSocket error:', event);
        setError('Connection error');
        setConnectionStatus('error');
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        if (connectionStatus !== 'ended') {
          setConnectionStatus('disconnected');
        }
      };
      
    } catch (err) {
      console.error('❌ Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectionStatus('error');
      throw err;
    }
  }, [setupAudioCapture, buildInstructions, sendEvent, handleServerEvent]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting...');
    setConnectionStatus('ended');
    
    // Clear timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Stop audio worklet
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'stop' });
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio contexts (check state to avoid "already closed" error)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsAISpeaking(false);
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
  }, []);

  const concludeInterview = useCallback(() => {
    if (isEndedRef.current) return;
    
    console.log('🏁 Concluding interview...');
    isEndedRef.current = true;
    
    // Stop audio playback
    stopAudioPlayback();
    
    // Send conclusion request
    sendEvent({
      type: 'response.create',
      response: {
        instructions: `The interview time is up. Conclude the interview by:
1. Thanking the candidate for their time
2. Briefly summarizing you've covered key areas
3. Explaining they will receive feedback shortly
4. Wishing them well

Be warm but professional. Keep it brief (30 seconds max). Do NOT ask any more questions.`,
      },
    });
  }, [stopAudioPlayback, sendEvent]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMutedRef.current;
    isMutedRef.current = newMutedState;
    setIsMuted(newMutedState);
    console.log(newMutedState ? '🔇 Microphone muted' : '🔊 Microphone unmuted');
  }, []);

  const getFullTranscript = useCallback((): TranscriptEntry[] => {
    // Filter out empty entries (unfilled placeholders from speech_started)
    return transcript.filter(entry => entry.text && entry.text.trim().length > 0);
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    transcript,
    error,
    isAISpeaking,
    elapsedTime,
    isMuted,
    connect,
    disconnect,
    concludeInterview,
    getFullTranscript,
    toggleMute,
    inputAudioLevel,
    outputAudioLevel,
  };
}

