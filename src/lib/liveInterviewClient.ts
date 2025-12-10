/**
 * LiveInterviewClient - WebSocket client for OpenAI Realtime API
 * 
 * This class handles:
 * - WebSocket connection lifecycle management
 * - Microphone audio capture via Web Audio API
 * - Real-time audio streaming to OpenAI
 * - Audio playback from AI responses
 * - Transcript streaming
 * - Full-duplex communication (no muting during AI speech)
 */

import type {
  ServerEvent,
  ClientEvent,
  ConnectionStatus,
  TranscriptEntry,
  CreateSessionResponse,
} from '../types/openai-realtime';

// ============================================
// TYPES
// ============================================

export interface LiveInterviewClientConfig {
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onTranscriptUpdate?: (entries: TranscriptEntry[]) => void;
  onAudioLevelChange?: (level: number, source: 'input' | 'output') => void;
  onError?: (error: Error) => void;
  onSessionStarted?: () => void;
  onSessionEnded?: () => void;
  onInterviewConcluded?: () => void; // Called when AI finishes conclusion message
}

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

// ============================================
// LIVE INTERVIEW CLIENT CLASS
// ============================================

export class LiveInterviewClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  // Playback queue for AI audio responses - each entry tracks its origin
  private audioPlaybackQueue: Array<{
    buffer: AudioBuffer;
    responseId: string | null;
    generation: number;
  }> = [];
  private isPlaying = false;
  private currentPlaybackSource: AudioBufferSourceNode | null = null;
  
  // Gapless audio playback scheduling
  private nextPlaybackTime: number = 0;
  private playbackStarted: boolean = false;
  private readonly PREBUFFER_COUNT = 3; // Wait for 3 chunks before starting playback
  
  // Barge-in control
  private isInterrupted: boolean = false;
  private scheduledSources: AudioBufferSourceNode[] = []; // Track all scheduled sources
  private currentResponseId: string | null = null;
  private interruptedAt: number = 0; // Timestamp of last interruption
  private readonly INTERRUPT_COOLDOWN_MS = 500; // Ignore audio for 500ms after interruption
  private cancelledResponseIds: Set<string> = new Set(); // Track cancelled response IDs to reject late audio
  private interruptionGeneration: number = 0; // Increments on each interruption - used to invalidate old audio
  private currentAudioGeneration: number = 0; // The generation that's currently allowed to play
  
  // Master gain node for instant muting
  private masterGainNode: GainNode | null = null;
  
  // State
  private connectionStatus: ConnectionStatus = 'disconnected';
  private transcript: TranscriptEntry[] = [];
  private currentAssistantItemId: string | null = null;
  private currentUserItemId: string | null = null;
  private greetingTriggered: boolean = false;
  
  // Timer
  private startTime: number = 0;
  private readonly MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  private isInterviewEnded: boolean = false;
  
  // Accumulated audio data for decoding
  private pendingAudioChunks: string[] = [];
  
  // Configuration
  private config: LiveInterviewClientConfig;
  private jobContext: JobContext | null = null;
  private userProfile: UserProfile | null = null;

  constructor(config: LiveInterviewClientConfig = {}) {
    this.config = config;
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Initialize and start a live interview session
   */
  async start(
    jobContext: JobContext,
    userProfile: UserProfile
  ): Promise<void> {
    this.jobContext = jobContext;
    this.userProfile = userProfile;
    this.greetingTriggered = false; // Reset for new session
    this.isInterrupted = false; // Reset interrupted state
    this.currentResponseId = null;
    this.cancelledResponseIds.clear(); // Clear cancelled response tracking
    this.interruptionGeneration = 0; // Reset generation counter
    this.currentAudioGeneration = 0; // Reset accepted generation
    this.resetAudioPlayback(); // Reset audio state
    
    try {
      this.setConnectionStatus('connecting');
      
      // Request microphone permission and get session credentials in parallel
      const [sessionData] = await Promise.all([
        this.createSession(),
        this.requestMicrophonePermission(),
      ]);
      
      // Connect to WebSocket
      await this.connectWebSocket(sessionData);
      
      // Setup audio pipeline after WebSocket is connected
      await this.setupAudioPipeline();
      
      this.config.onSessionStarted?.();
    } catch (error) {
      this.setConnectionStatus('error');
      this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Stop the interview session and cleanup resources
   */
  async stop(): Promise<void> {
    this.setConnectionStatus('ended');
    
    // Stop audio worklet
    if (this.audioWorkletNode) {
      this.audioWorkletNode.port.postMessage({ type: 'stop' });
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Disconnect master gain node
    if (this.masterGainNode) {
      this.masterGainNode.disconnect();
      this.masterGainNode = null;
    }
    
    // Disconnect source node
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // Stop any playing audio
    if (this.currentPlaybackSource) {
      this.currentPlaybackSource.stop();
      this.currentPlaybackSource = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear state
    this.resetAudioPlayback();
    this.pendingAudioChunks = [];
    
    this.config.onSessionEnded?.();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current transcript
   */
  getTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  /**
   * Get elapsed time in milliseconds since interview started
   */
  getElapsedTime(): number {
    if (this.startTime === 0) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get elapsed time formatted as MM:SS
   */
  getFormattedTime(): string {
    const elapsed = this.getElapsedTime();
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    const elapsed = this.getElapsedTime();
    return Math.max(0, this.MAX_DURATION_MS - elapsed);
  }

  /**
   * Check if the interview has exceeded the max duration
   */
  isTimeUp(): boolean {
    return this.getElapsedTime() >= this.MAX_DURATION_MS;
  }

  /**
   * Check if interview has ended
   */
  hasEnded(): boolean {
    return this.isInterviewEnded;
  }

  /**
   * Get the full transcript for analysis
   */
  getFullTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  /**
   * Conclude the interview naturally
   * The AI will thank the candidate and end the interview professionally
   */
  concludeInterview(): void {
    if (this.isInterviewEnded) {
      console.log('⚠️ Interview already concluded');
      return;
    }
    
    console.log('🏁 Concluding interview...');
    this.isInterviewEnded = true;
    
    // Stop any ongoing audio playback
    this.stopAudioPlayback();
    
    // Send a response.create with conclusion instructions
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions: `The interview time is up. Please conclude the interview now by:
1. Thanking the candidate for their time and answers
2. Briefly summarizing that you've covered the key areas
3. Explaining that they will receive feedback shortly
4. Wishing them well

Be warm but professional. Keep the conclusion brief (30 seconds max). Do NOT ask any more questions.`,
      },
    });
    
    // The interview will fully stop when onInterviewConcluded callback is called
    // This happens after the AI finishes its conclusion message
  }

  /**
   * Called when the AI has finished its conclusion message
   * This triggers the transition to the results phase
   */
  private onConclusionComplete(): void {
    console.log('✅ Interview conclusion complete');
    this.config.onInterviewConcluded?.();
  }

  // ============================================
  // PRIVATE: SESSION MANAGEMENT
  // ============================================

  /**
   * Request an ephemeral session token from the backend
   */
  private async createSession(): Promise<CreateSessionResponse> {
    const response = await fetch('/api/openai-realtime-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create session: ${error}`);
    }
    
    const sessionData = await response.json();
    
    // Check if session was created successfully
    if (sessionData.status === 'error') {
      throw new Error(sessionData.message || 'Failed to create session');
    }
    
    console.log('✅ Session created with voice:', sessionData.voice || 'ash');
    
    return sessionData;
  }

  /**
   * Connect to OpenAI Realtime WebSocket
   * Uses the ephemeral token for authentication via Authorization header simulation
   */
  private connectWebSocket(sessionData: CreateSessionResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      // For the OpenAI Realtime GA API, we use the ephemeral token directly
      // The WebSocket URL includes the model, and auth is done via subprotocol
      // Format: openai-insecure-api-key.{ephemeral_key}
      const wsUrl = sessionData.url;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      // Create WebSocket with the ephemeral key authentication
      // The subprotocol format allows browser WebSocket to pass authentication
      this.ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${sessionData.client_secret}`,
      ]);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected to OpenAI Realtime API');
        this.setConnectionStatus('ready');
        // Don't configure here - wait for session.created event
        resolve();
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        if (this.connectionStatus !== 'ended') {
          this.setConnectionStatus('disconnected');
        }
      };
      
      this.ws.onerror = (event) => {
        console.error('🔌 WebSocket error:', event);
        reject(new Error('WebSocket connection failed'));
      };
      
      this.ws.onmessage = (event) => {
        this.handleServerEvent(JSON.parse(event.data) as ServerEvent);
      };
    });
  }

  /**
   * Configure the session with interviewer persona and context
   * Since we use client_secrets endpoint, ALL session config must be done here via session.update
   */
  private configureSession(): void {
    const instructions = this.buildInterviewerInstructions();
    
    console.log('📝 Configuring session with full configuration...');
    console.log('📝 Job context:', this.jobContext?.companyName, '-', this.jobContext?.position);
    console.log('📝 User profile:', this.userProfile?.firstName, this.userProfile?.lastName);
    
    // Send session.update with configuration
    // IMPORTANT: 'type: realtime' is REQUIRED or the API will reject the update!
    // NOTE: input_audio_transcription is NOT supported by this API version (causes unknown_parameter error)
    // User transcription must be handled differently or may not be available
    const sessionUpdate = {
      type: 'session.update',
      session: {
        type: 'realtime',  // REQUIRED - API rejects without this
        instructions: instructions,
      },
    };
    
    console.log('📤 Sending session.update with:');
    console.log('   - type: realtime (required)');
    console.log('   - instructions: ' + instructions.length + ' chars');
    this.sendEvent(sessionUpdate as ClientEvent);
    
    console.log('⏳ Waiting for session.updated confirmation before starting interview...');
    
    // Fallback: if session.updated doesn't arrive within 3 seconds, start anyway
    // This handles cases where the update might fail silently
    setTimeout(() => {
      if (this.connectionStatus === 'ready' || this.connectionStatus === 'connected') {
        console.warn('⚠️ session.updated not received after 3s, starting interview anyway...');
        this.triggerInitialGreeting();
        this.setConnectionStatus('live');
      }
    }, 3000);
  }
  
  /**
   * Trigger the AI to start the interview with a greeting
   */
  private triggerInitialGreeting(): void {
    // Prevent triggering twice
    if (this.greetingTriggered) {
      console.log('⚠️ Greeting already triggered, skipping...');
      return;
    }
    this.greetingTriggered = true;
    
    // Start the timer
    this.startTime = Date.now();
    console.log('⏱️ Interview timer started');
    
    console.log('🎤 Triggering AI to start the interview...');
    
    const userName = this.userProfile?.firstName || 'the candidate';
    const position = this.jobContext?.position || 'the position';
    const company = this.jobContext?.companyName || 'the company';
    
    // Use response.create with specific instructions for the greeting
    // This ensures the AI knows exactly how to start even if session.update failed
    this.sendEvent({
      type: 'response.create',
      response: {
        instructions: `You are Sarah Mitchell, a Senior HR Interview Manager conducting a professional interview. 
        
START THE INTERVIEW NOW by:
1. Greeting ${userName} professionally (NOT casually - do NOT say "hey what's up" or similar)
2. Introducing yourself as "Sarah Mitchell" or just "Sarah", the interviewer for the ${position} role at ${company}
3. Briefly explaining you'll be asking questions about their background and experience
4. Asking your first interview question about their professional background

IMPORTANT: Your name is Sarah Mitchell. Never say "[Interviewer Name]" - always use your actual name.
Be warm but professional. Speak clearly and at a measured pace like a real interviewer would.`,
      },
    });
    
    console.log('✅ Initial greeting triggered with interviewer instructions');
  }

  /**
   * Build the interviewer instructions with user and job context
   */
  private buildInterviewerInstructions(): string {
    const { jobContext, userProfile } = this;
    
    // Build user context string
    const userContextParts: string[] = [];
    if (userProfile?.firstName || userProfile?.lastName) {
      userContextParts.push(`Name: ${[userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ')}`);
    }
    if (userProfile?.currentPosition) {
      userContextParts.push(`Current Position: ${userProfile.currentPosition}`);
    }
    if (userProfile?.yearsOfExperience) {
      userContextParts.push(`Years of Experience: ${userProfile.yearsOfExperience}`);
    }
    if (userProfile?.skills && userProfile.skills.length > 0) {
      userContextParts.push(`Key Skills: ${userProfile.skills.slice(0, 10).join(', ')}`);
    }
    if (userProfile?.education) {
      userContextParts.push(`Education: ${userProfile.education}`);
    }
    if (userProfile?.cvText) {
      // Truncate CV text to avoid token limits
      const truncatedCV = userProfile.cvText.slice(0, 2000);
      userContextParts.push(`Resume Summary:\n${truncatedCV}`);
    }
    
    const userContext = userContextParts.length > 0 
      ? `\n\n## Candidate Profile\n${userContextParts.join('\n')}`
      : '';
    
    // Build job context string
    const jobContextParts: string[] = [];
    if (jobContext?.companyName) {
      jobContextParts.push(`Company: ${jobContext.companyName}`);
    }
    if (jobContext?.position) {
      jobContextParts.push(`Position: ${jobContext.position}`);
    }
    if (jobContext?.jobDescription) {
      // Truncate job description to avoid token limits
      const truncatedJD = jobContext.jobDescription.slice(0, 1500);
      jobContextParts.push(`Job Description:\n${truncatedJD}`);
    }
    if (jobContext?.requirements && jobContext.requirements.length > 0) {
      jobContextParts.push(`Key Requirements: ${jobContext.requirements.slice(0, 8).join(', ')}`);
    }
    
    const jobContextStr = jobContextParts.length > 0
      ? `\n\n## Position Details\n${jobContextParts.join('\n')}`
      : '';

    return `# Senior HR Interview Manager - Mock Interview Session

You are Sarah Mitchell, an elite Senior HR Interview Manager conducting a professional mock interview session. Your role is to provide a realistic, challenging, yet supportive interview experience that prepares candidates for real-world interviews.

## Your Identity
- Your name is Sarah Mitchell
- You have 15 years of experience in talent acquisition
- You specialize in technical and leadership roles
- When introducing yourself, say "My name is Sarah Mitchell" or just "I'm Sarah"

## Your Persona
- You are warm but professional, creating a comfortable yet formal interview atmosphere
- You speak clearly and at a measured pace, as a real interviewer would
- You use natural conversational fillers occasionally ("That's interesting...", "I see...")
- You take brief pauses to "think" before responding, simulating real interview dynamics
- You maintain a balance between being encouraging and appropriately challenging

## Interview Structure
1. **Opening** (1-2 minutes): Introduce yourself and the interview format. Make the candidate comfortable.
2. **Background Questions** (3-4 minutes): Explore their experience and career journey.
3. **Technical/Role-Specific Questions** (5-7 minutes): Deep dive into skills relevant to the position.
4. **Behavioral Questions** (5-7 minutes): Use STAR method prompts to assess soft skills.
5. **Situational Questions** (3-4 minutes): Present hypothetical scenarios relevant to the role.
6. **Candidate Questions** (2-3 minutes): Allow them to ask questions about the role/company.
7. **Closing** (1 minute): Thank them and explain next steps.

## Question Guidelines
- Start with easier questions and progressively increase difficulty
- Ask follow-up questions to probe deeper into their answers
- If an answer is vague, politely ask for specific examples
- Relate questions to the specific job requirements when possible
- Include at least one challenging question that tests critical thinking

## Response Style
- Keep your responses concise (2-4 sentences typically)
- Acknowledge their answers before moving to the next question
- Provide brief, constructive feedback when appropriate
- Never interrupt the candidate mid-sentence
- If they struggle, offer gentle guidance without giving away answers

## Important Rules
- Stay in character as an interviewer throughout the session
- Do not break the fourth wall or acknowledge this is AI
- Do not provide interview tips or coaching during the interview
- Save detailed feedback for the end of the session
- Be culturally sensitive and avoid any potentially biased questions
- Focus on job-relevant competencies only
${userContext}
${jobContextStr}

## Starting the Interview
Begin by warmly greeting the candidate by name, introducing yourself as "Sarah Mitchell" (or just "Sarah"), the interviewer for the ${jobContext?.position || 'position'} at ${jobContext?.companyName || 'the company'}. Briefly explain the interview format, then smoothly transition into your first question about their background.

IMPORTANT: Never say "[Interviewer Name]" - your name is Sarah Mitchell.`;
  }

  // ============================================
  // PRIVATE: AUDIO PIPELINE
  // ============================================

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<void> {
    console.log('🎤 Requesting microphone permission...');
    
    try {
      // First, enumerate devices to see what's available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      console.log('🎤 Available microphones:', audioInputs.map(d => `${d.label || 'Unknown'} (${d.deviceId.slice(0, 8)}...)`));
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Don't force sample rate - let the browser choose optimal
        },
      });
      
      // Verify the audio track is enabled
      const audioTracks = this.mediaStream.getAudioTracks();
      console.log('✅ Microphone access granted');
      console.log('🎤 Number of audio tracks:', audioTracks.length);
      
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        const settings = track.getSettings();
        console.log('🎤 Track label:', track.label);
        console.log('🎤 Track enabled:', track.enabled);
        console.log('🎤 Track muted:', track.muted);
        console.log('🎤 Track readyState:', track.readyState);
        console.log('🎤 Sample rate:', settings.sampleRate);
        console.log('🎤 Channel count:', settings.channelCount);
        console.log('🎤 Device ID:', settings.deviceId?.slice(0, 20) + '...');
        
        // Ensure the track is enabled
        if (!track.enabled) {
          track.enabled = true;
          console.log('🎤 Track was disabled, now enabled');
        }
        
        // Listen for track ending
        track.onended = () => {
          console.error('❌ Audio track ended unexpectedly!');
        };
        
        track.onmute = () => {
          console.warn('⚠️ Audio track was muted!');
        };
        
        track.onunmute = () => {
          console.log('✅ Audio track unmuted');
        };
      } else {
        console.error('❌ No audio tracks in media stream!');
      }
    } catch (error) {
      console.error('❌ Microphone permission denied or error:', error);
      throw new Error('Microphone access is required for the interview. Please allow microphone access and try again.');
    }
  }

  /**
   * Setup the audio capture and playback pipeline
   */
  private async setupAudioPipeline(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('No media stream available');
    }
    
    // Create audio context for both capture and playback
    this.audioContext = new AudioContext({
      sampleRate: 48000, // Standard browser rate
    });
    
    // Create master gain node for instant muting during barge-in
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = 1; // Start at full volume
    this.masterGainNode.connect(this.audioContext.destination);
    console.log('🔊 Master gain node created for barge-in control');
    
    // IMPORTANT: Resume AudioContext if suspended (browser security policy)
    if (this.audioContext.state === 'suspended') {
      console.log('🔊 AudioContext is suspended, resuming...');
      await this.audioContext.resume();
      console.log('✅ AudioContext resumed, state:', this.audioContext.state);
    }
    
    // Load the audio worklet processor
    await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
    
    // Create source node from microphone
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create audio worklet node for processing
    this.audioWorkletNode = new AudioWorkletNode(
      this.audioContext,
      'audio-realtime-processor'
    );
    
    // Log when worklet is ready
    console.log('🎤 Audio worklet processor loaded and ready');
    
    // Track audio sending for debugging
    let audioChunkCount = 0;
    let lastAudioLog = Date.now();
    let maxVolumeInPeriod = 0;
    let loggedFirstChunk = false;
    
    // Handle messages from the worklet (audio chunks and volume levels)
    this.audioWorkletNode.port.onmessage = (event) => {
      const { type, audio, level } = event.data;
      
      if (type === 'audio') {
        if (this.ws?.readyState === WebSocket.OPEN) {
          // Log first chunk details for debugging
          if (!loggedFirstChunk) {
            console.log('🎤 First audio chunk details:');
            console.log('   - Base64 length:', audio.length);
            console.log('   - First 50 chars:', audio.substring(0, 50));
            loggedFirstChunk = true;
          }
          
          // Send audio chunk to OpenAI
          this.sendEvent({
            type: 'input_audio_buffer.append',
            audio,
          });
          audioChunkCount++;
          
          // Log every 5 seconds to confirm audio is being sent
          const now = Date.now();
          if (now - lastAudioLog > 5000) {
            console.log(`🎤 Audio streaming: ${audioChunkCount} chunks sent in last 5s, max volume: ${maxVolumeInPeriod.toFixed(3)}`);
            audioChunkCount = 0;
            maxVolumeInPeriod = 0;
            lastAudioLog = now;
          }
        } else {
          console.warn('⚠️ WebSocket not open, cannot send audio. State:', this.ws?.readyState);
        }
      } else if (type === 'volume') {
        // Track max volume for debugging
        if (level > maxVolumeInPeriod) {
          maxVolumeInPeriod = level;
        }
        // Update input volume visualization
        this.config.onAudioLevelChange?.(level, 'input');
      } else if (type === 'debug') {
        // Debug messages from worklet
        console.log('🔬 Worklet debug:', event.data.message);
      }
    };
    
    // Connect the audio pipeline: mic -> worklet
    this.sourceNode.connect(this.audioWorkletNode);
    
    // IMPORTANT: Connect worklet to destination to ensure audio flows through
    // We use a GainNode with 0 gain to prevent feedback while still processing
    const silentGain = this.audioContext.createGain();
    silentGain.gain.value = 0; // Silent - no audio to speakers
    this.audioWorkletNode.connect(silentGain);
    silentGain.connect(this.audioContext.destination);
    
    console.log('✅ Audio pipeline connected: microphone -> worklet -> (silent) -> destination');
    
    // Add an AnalyserNode to independently verify audio is flowing
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    this.sourceNode.connect(analyser);
    
    // Check audio levels periodically using the analyser
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkAudioInterval = setInterval(() => {
      if (!this.audioContext || this.audioContext.state !== 'running') {
        clearInterval(checkAudioInterval);
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      const maxLevel = Math.max(...dataArray);
      if (maxLevel > 0) {
        console.log('📊 Analyser confirms audio signal present, max level:', maxLevel);
        clearInterval(checkAudioInterval); // Only log once when we detect audio
      }
    }, 2000);
    
    // Set status to live once audio is flowing
    this.setConnectionStatus('live');
  }

  // ============================================
  // PRIVATE: AUDIO PLAYBACK
  // ============================================

  /**
   * Decode and play audio from base64 PCM16
   * Uses gapless playback with precise scheduling
   */
  private async playAudioChunk(base64Audio: string, responseId?: string): Promise<void> {
    if (!this.audioContext) return;
    
    // === STRICT BARGE-IN VALIDATION ===
    // These checks are intentionally aggressive to prevent ANY old audio from playing
    
    // 1. FIRST CHECK: If interrupted, REJECT ALL AUDIO - no exceptions!
    //    This is the most important check. When user is speaking, NO AI audio should play.
    if (this.isInterrupted) {
      // Don't even log frequently to avoid console spam
      return;
    }
    
    // 2. Check generation counter - reject audio from before the latest interruption
    //    This catches audio that was "in flight" when we interrupted
    if (this.currentAudioGeneration !== this.interruptionGeneration) {
      console.log('🔇 Rejecting audio from old generation:', this.currentAudioGeneration, 'current:', this.interruptionGeneration);
      return;
    }
    
    // 3. Check cooldown period after interruption - give time for old audio to clear
    if (this.interruptedAt > 0) {
      const timeSinceInterrupt = Date.now() - this.interruptedAt;
      if (timeSinceInterrupt < this.INTERRUPT_COOLDOWN_MS) {
        return; // Silent reject during cooldown
      }
      // Cooldown passed, clear the timestamp
      this.interruptedAt = 0;
    }
    
    // 4. If responseId is provided, validate it strictly
    if (responseId) {
      // Reject if from a cancelled response
      if (this.cancelledResponseIds.has(responseId)) {
        console.log('🔇 Rejecting audio from CANCELLED response:', responseId);
        return;
      }
      // Reject if doesn't match current response
      if (this.currentResponseId && responseId !== this.currentResponseId) {
        console.log('🔇 Rejecting audio from OLD response:', responseId, '(current:', this.currentResponseId, ')');
        return;
      }
    }
    
    // 5. If we had an interruption recently but no responseId, be extra cautious
    //    Only allow if we've explicitly accepted this generation
    if (!responseId && this.interruptionGeneration > 0 && this.currentAudioGeneration < this.interruptionGeneration) {
      console.log('🔇 Rejecting audio without responseId after interruption');
      return;
    }
    
    // Debug: log state on first chunk
    if (!this.playbackStarted) {
      console.log('🔊 Playing first chunk. Gen:', this.currentAudioGeneration, 'Response:', responseId);
    }
    
    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert PCM16 to Float32 for Web Audio API
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        // Convert from Int16 range to Float32 range
        float32[i] = pcm16[i] / 32768;
      }
      
      // Create audio buffer (24kHz mono from OpenAI)
      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      
      // Add to queue WITH tracking info - this enables validation at scheduling time
      this.audioPlaybackQueue.push({
        buffer: audioBuffer,
        responseId: responseId || null,
        generation: this.currentAudioGeneration,
      });
      
      // Start playback after collecting enough chunks (pre-buffering)
      if (!this.playbackStarted && this.audioPlaybackQueue.length >= this.PREBUFFER_COUNT) {
        this.playbackStarted = true;
        this.nextPlaybackTime = this.audioContext.currentTime + 0.05; // Small initial delay
        this.scheduleQueuedAudio();
      } else if (this.playbackStarted) {
        // Already playing, schedule this chunk
        this.scheduleQueuedAudio();
      }
      
      // Calculate and report output volume
      const rms = Math.sqrt(float32.reduce((sum, s) => sum + s * s, 0) / float32.length);
      const normalizedVolume = Math.min(1, rms * 3);
      this.config.onAudioLevelChange?.(normalizedVolume, 'output');
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  }

  /**
   * Schedule all queued audio buffers for gapless playback
   */
  private scheduleQueuedAudio(): void {
    if (!this.audioContext || !this.masterGainNode || this.audioPlaybackQueue.length === 0 || this.isInterrupted) {
      return;
    }
    
    // Check generation BEFORE scheduling any audio
    if (this.currentAudioGeneration !== this.interruptionGeneration) {
      console.log('🔇 scheduleQueuedAudio: Generation mismatch, clearing queue');
      this.audioPlaybackQueue = [];
      return;
    }
    
    // Schedule all queued buffers
    while (this.audioPlaybackQueue.length > 0) {
      // Check for interruption BEFORE each buffer - handles rapid interrupts
      if (this.isInterrupted || this.currentAudioGeneration !== this.interruptionGeneration) {
        console.log('🔇 scheduleQueuedAudio: Interrupted mid-scheduling, clearing remaining queue');
        this.audioPlaybackQueue = [];
        return;
      }
      
      const entry = this.audioPlaybackQueue.shift()!;
      
      // VALIDATE EACH BUFFER at scheduling time (second line of defense)
      // This catches any buffers that snuck into the queue before state was updated
      if (entry.generation !== this.interruptionGeneration) {
        console.log('🔇 Skipping buffer from old generation:', entry.generation, 'current:', this.interruptionGeneration);
        continue; // Skip this buffer, move to next
      }
      
      if (entry.responseId && entry.responseId !== this.currentResponseId) {
        console.log('🔇 Skipping buffer from old response:', entry.responseId, 'current:', this.currentResponseId);
        continue; // Skip this buffer, move to next
      }
      
      if (entry.responseId && this.cancelledResponseIds.has(entry.responseId)) {
        console.log('🔇 Skipping buffer from cancelled response:', entry.responseId);
        continue; // Skip this buffer, move to next
      }
      
      // Create buffer source
      const source = this.audioContext.createBufferSource();
      source.buffer = entry.buffer;
      
      // Connect through master gain node (allows instant muting)
      source.connect(this.masterGainNode);
      
      // Track this source so we can stop it later
      this.scheduledSources.push(source);
      
      // Schedule to play at the exact time the previous chunk ends
      const currentTime = this.audioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextPlaybackTime);
      
      source.start(startTime);
      
      // Update next playback time (duration = samples / sampleRate)
      this.nextPlaybackTime = startTime + entry.buffer.duration;
      
      this.isPlaying = true;
      this.currentPlaybackSource = source;
      
      // Cleanup when done
      source.onended = () => {
        // Remove from tracked sources
        const index = this.scheduledSources.indexOf(source);
        if (index > -1) {
          this.scheduledSources.splice(index, 1);
        }
        
        // Check if all sources are done
        if (this.scheduledSources.length === 0 && this.audioPlaybackQueue.length === 0) {
          this.isPlaying = false;
          this.currentPlaybackSource = null;
        }
      };
    }
  }
  
  /**
   * Reset audio playback state (called when response ends)
   */
  private resetAudioPlayback(): void {
    this.playbackStarted = false;
    this.nextPlaybackTime = 0;
    this.audioPlaybackQueue = [];
    this.isPlaying = false;
    this.scheduledSources = [];
  }
  
  /**
   * Force stop all audio sources without changing interrupted state
   */
  private stopAllAudioSources(): void {
    // Stop all tracked sources
    for (const source of this.scheduledSources) {
      try {
        source.onended = null;
        source.stop(0);
        source.disconnect();
      } catch (e) { /* ignore */ }
    }
    this.scheduledSources = [];
    
    // Stop current source
    if (this.currentPlaybackSource) {
      try {
        this.currentPlaybackSource.onended = null;
        this.currentPlaybackSource.stop(0);
        this.currentPlaybackSource.disconnect();
      } catch (e) { /* ignore */ }
      this.currentPlaybackSource = null;
    }
    
    this.isPlaying = false;
  }
  
  /**
   * Recreate the master gain node - this is the NUCLEAR option
   * By disconnecting the old gain node, ANY scheduled sources connected to it
   * will have no path to the speakers, ensuring complete silence
   */
  private recreateMasterGain(): void {
    if (!this.audioContext) return;
    
    // Disconnect old gain node - this SEVERS the connection for all sources
    if (this.masterGainNode) {
      try {
        this.masterGainNode.disconnect();
      } catch (e) { /* ignore */ }
    }
    
    // Create fresh gain node
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = 1; // Full volume for new audio
    this.masterGainNode.connect(this.audioContext.destination);
    
    console.log('🔊 Master gain node RECREATED - old sources orphaned');
  }
  
  /**
   * Stop audio playback immediately (for barge-in/interruption)
   */
  private stopAudioPlayback(): void {
    console.log('🔇 STOP AUDIO - sources:', this.scheduledSources.length, 'queue:', this.audioPlaybackQueue.length);
    
    // Set interrupted flag and timestamp FIRST
    this.isInterrupted = true;
    this.interruptedAt = Date.now();
    
    // NUCLEAR OPTION: Recreate the master gain node
    // This DISCONNECTS the old gain node, orphaning any scheduled sources
    // Even if we miss some sources in our tracking, they can't play without a gain node
    this.recreateMasterGain();
    
    // Stop and DISCONNECT ALL scheduled sources (belt and suspenders)
    const sourcesToStop = [...this.scheduledSources];
    this.scheduledSources = []; // Clear immediately
    
    for (const source of sourcesToStop) {
      try {
        source.onended = null; // Remove callback to prevent any interference
        source.stop(0);
        source.disconnect();
      } catch (e) {
        // Ignore - source might already be stopped
      }
    }
    
    // Stop the currently playing source
    if (this.currentPlaybackSource) {
      try {
        this.currentPlaybackSource.onended = null;
        this.currentPlaybackSource.stop(0);
        this.currentPlaybackSource.disconnect();
      } catch (e) {
        // Ignore
      }
      this.currentPlaybackSource = null;
    }
    
    // Clear the queue
    this.audioPlaybackQueue = [];
    
    // Reset playback state
    this.playbackStarted = false;
    this.nextPlaybackTime = 0;
    this.isPlaying = false;
    
    console.log('🔇 Audio STOPPED and CLEARED');
  }

  // ============================================
  // PRIVATE: EVENT HANDLING
  // ============================================

  /**
   * Handle events from the server
   */
  private handleServerEvent(event: ServerEvent): void {
    // Log events for debugging (except audio deltas which are too frequent)
    if (event.type !== 'response.audio.delta') {
      console.log('📨 Server event:', event.type);
    }
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created:', event.session.id);
        // NOW configure the session with our interviewer persona
        // This ensures the session exists before we try to update it
        console.log('📝 Session ready, now configuring interviewer persona...');
        this.configureSession();
        break;
        
      case 'session.updated':
        console.log('✅ Session updated successfully!');
        // Log the session config to see what was actually applied
        const session = (event as any).session;
        if (session) {
          console.log('📝 Session config:', {
            hasInstructions: !!session.instructions,
            instructionsLength: session.instructions?.length || 0,
            inputAudioTranscription: session.input_audio_transcription,
            turnDetection: session.turn_detection?.type,
          });
        }
        // NOW trigger the greeting since session is confirmed configured
        this.triggerInitialGreeting();
        break;
        
      case 'error':
        const errorMsg = event.error.message || '';
        
        // Ignore "no active response" errors - these happen when cancelling and are expected
        if (errorMsg.includes('no active response')) {
          console.log('ℹ️ No active response to cancel (this is normal after barge-in)');
          break;
        }
        
        console.error('❌ SERVER ERROR:', event.error);
        console.error('❌ Error type:', event.error.type);
        console.error('❌ Error code:', event.error.code);
        console.error('❌ Error message:', errorMsg);
        
        // Check if this is a session configuration error
        if (errorMsg.includes('session') || 
            errorMsg.includes('Unknown parameter') ||
            errorMsg.includes('Invalid value') ||
            errorMsg.includes('Missing required parameter') ||
            errorMsg.includes('instructions')) {
          console.warn('⚠️ SESSION CONFIG ERROR - Instructions may not be applied!');
        } else {
          // Only show non-configuration errors to user
          this.config.onError?.(new Error(errorMsg));
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        // User started speaking - implement barge-in (interrupt AI)
        this.currentUserItemId = event.item_id;
        console.log('🎤🎤🎤 BARGE-IN TRIGGERED 🎤🎤🎤');
        console.log('   isPlaying:', this.isPlaying, 'sources:', this.scheduledSources.length);
        console.log('   currentResponseId:', this.currentResponseId);
        console.log('   generation:', this.interruptionGeneration);
        
        // INCREMENT GENERATION COUNTER - This invalidates ALL audio from before this moment
        this.interruptionGeneration++;
        console.log('   ✅ Generation incremented to:', this.interruptionGeneration);
        
        // Track the current response as cancelled BEFORE stopping playback
        // This ensures any late audio from this response will be rejected
        if (this.currentResponseId) {
          this.cancelledResponseIds.add(this.currentResponseId);
          console.log('   ✅ Added to cancelled responses:', this.currentResponseId);
        }
        
        // ALWAYS stop AI audio playback immediately (client-side)
        this.stopAudioPlayback();
        console.log('   ✅ stopAudioPlayback() called');
        
        // Server-side: Cancel the response
        this.sendEvent({
          type: 'response.cancel',
        });
        console.log('   ✅ response.cancel sent');
        
        // Server-side: Truncate the assistant's item if we have one
        // This properly handles conversation state
        if (this.currentAssistantItemId) {
          this.sendEvent({
            type: 'conversation.item.truncate',
            item_id: this.currentAssistantItemId,
            content_index: 0,
            audio_end_ms: 0, // Truncate all audio
          } as any);
          console.log('🔇 Truncated assistant item:', this.currentAssistantItemId);
        }
        
        console.log('🔇 BARGE-IN complete');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        console.log('🎤 User stopped speaking');
        break;
      
      case 'input_audio_buffer.committed':
        // Audio buffer was committed - this happens after speech is detected
        console.log('🎤 Audio buffer committed, item:', (event as any).item_id);
        // Update the current user item ID if provided
        if ((event as any).item_id) {
          this.currentUserItemId = (event as any).item_id;
        }
        break;
        
      case 'conversation.item.input_audio_transcription.delta':
        // User's speech transcription streaming delta
        const transcriptDelta = (event as any).delta || (event as any).transcript;
        console.log('📝 User transcription delta:', transcriptDelta);
        if (transcriptDelta) {
          const itemId = (event as any).item_id || this.currentUserItemId;
          if (itemId) {
            const existingIndex = this.transcript.findIndex(e => e.id === itemId);
            if (existingIndex === -1) {
              // Create new entry
              this.addTranscriptEntry({
                id: itemId,
                role: 'user',
                text: transcriptDelta,
                timestamp: Date.now(),
                isComplete: false,
              });
            } else {
              // Append to existing entry
              this.transcript[existingIndex].text += transcriptDelta;
              this.config.onTranscriptUpdate?.([...this.transcript]);
            }
          }
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        // User's speech was transcribed - NOW create the entry with text
        console.log('📝 User transcription COMPLETED:', event.transcript);
        if (event.transcript && event.transcript.trim()) {
          // Create or update entry with actual transcript
          const existingIndex = this.transcript.findIndex(e => e.id === event.item_id);
          if (existingIndex === -1) {
            // Create new entry with the transcript
            this.addTranscriptEntry({
              id: event.item_id,
              role: 'user',
              text: event.transcript,
              timestamp: Date.now(),
              isComplete: true,
            });
          } else {
            // Update existing entry with final transcript
            this.transcript[existingIndex].text = event.transcript;  // Replace with final
            this.transcript[existingIndex].isComplete = true;
            this.config.onTranscriptUpdate?.([...this.transcript]);
          }
        }
        break;
        
      case 'conversation.item.input_audio_transcription.failed':
        // User's speech transcription failed - log for debugging
        const transcriptionError = (event as any).error;
        console.error('❌ User transcription failed:', transcriptionError);
        console.error('   Item ID:', event.item_id);
        console.error('   Error type:', transcriptionError?.type);
        console.error('   Error code:', transcriptionError?.code);
        console.error('   Error message:', transcriptionError?.message);
        // Don't show error to user - transcription failure is not critical
        // The interview can continue, we just won't have the user's text
        break;
        
      case 'response.created':
        // AI is starting a new response
        const newResponseId = (event as any).response?.id || `resp_${Date.now()}`;
        console.log('🤖 NEW RESPONSE:', newResponseId);
        console.log('   Previous generation:', this.currentAudioGeneration, 'Interruption generation:', this.interruptionGeneration);
        
        // Clear any leftover audio from previous response
        this.stopAllAudioSources();
        this.audioPlaybackQueue = [];
        this.playbackStarted = false;
        this.nextPlaybackTime = 0;
        
        // Update state for new response
        this.currentAssistantItemId = null;
        this.currentResponseId = newResponseId;
        
        // ACCEPT THE NEW GENERATION - This is the key to allowing new audio
        // We set currentAudioGeneration to match interruptionGeneration, which
        // signals that audio for this response is allowed to play
        this.currentAudioGeneration = this.interruptionGeneration;
        console.log('   ✅ Accepted generation:', this.currentAudioGeneration);
        
        // NOW reset isInterrupted - the new response is ready
        // This is safe because we've updated the generation counter
        this.isInterrupted = false;
        
        // Restore gain for new audio
        if (this.masterGainNode && this.audioContext) {
          this.masterGainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        }
        
        console.log('🔊 Ready for audio');
        break;
        
      case 'response.output_item.added':
        // New output item from AI - just track ID, don't create entry yet
        if (event.item.role === 'assistant') {
          this.currentAssistantItemId = event.item.id;
          console.log('🤖 AI output item added:', event.item.id);
        }
        break;
      
      // GA API sends conversation.item.created or conversation.item.added for new items
      case 'conversation.item.created':
      case 'conversation.item.added':
        console.log('📝 Conversation item:', event.item?.role, event.item?.id);
        // Track assistant item ID
        if (event.item && event.item.role === 'assistant') {
          this.currentAssistantItemId = event.item.id;
        }
        // Extract any text content from the item
        if (event.item?.content) {
          for (const part of event.item.content) {
            if (part.type === 'text' && part.text) {
              console.log('📝 Got text content:', part.text);
              this.addOrUpdateAssistantEntry(event.item.id, part.text);
            }
            if (part.type === 'audio' && part.transcript) {
              console.log('📝 Got audio transcript:', part.transcript);
              this.addOrUpdateAssistantEntry(event.item.id, part.transcript);
            }
          }
        }
        break;
      
      case 'conversation.item.done':
        // Item is complete - mark it
        console.log('✅ Conversation item done:', event.item?.id);
        if (event.item?.id) {
          this.updateTranscriptEntry(event.item.id, { isComplete: true });
        }
        break;
        
      case 'response.audio_transcript.delta':
        // AI audio transcript delta - update transcript
        if (this.currentAssistantItemId) {
          this.appendToTranscriptEntry(event.item_id, event.delta);
        }
        break;
      
      // GA API might use response.text.delta for text responses
      case 'response.text.delta':
        if (this.currentAssistantItemId) {
          this.appendToTranscriptEntry(event.item_id, event.delta);
        }
        break;
        
      case 'response.audio.delta':
        // AI audio chunk - play it (pass response_id to filter old responses)
        this.playAudioChunk(event.delta, (event as any).response_id);
        break;
      
      // GA API audio delta event (might be named differently)
      case 'response.output_audio.delta':
        if ((event as any).delta) {
          this.playAudioChunk((event as any).delta, (event as any).response_id);
        }
        break;
        
      case 'response.audio.done':
      case 'response.output_audio.done':
        // AI finished speaking this chunk
        console.log('🔊 Audio done');
        break;
      
      // GA API transcript events
      case 'response.output_audio_transcript.delta':
        // Real-time transcript of AI speech
        const delta = (event as any).delta;
        if (delta) {
          const itemId = (event as any).item_id || this.currentAssistantItemId;
          if (itemId) {
            this.addOrUpdateAssistantEntry(itemId, delta);
          }
        }
        break;
        
      case 'response.output_audio_transcript.done':
        // Final transcript of AI speech
        const transcript = (event as any).transcript;
        console.log('📝 AI transcript complete:', transcript?.substring(0, 50) + '...');
        if (transcript) {
          const itemId = (event as any).item_id || this.currentAssistantItemId;
          if (itemId) {
            // Replace with final transcript
            const existingIndex = this.transcript.findIndex(e => e.id === itemId);
            if (existingIndex !== -1) {
              this.transcript[existingIndex].text = transcript;
              this.transcript[existingIndex].isComplete = true;
              this.config.onTranscriptUpdate?.([...this.transcript]);
            } else {
              this.addTranscriptEntry({
                id: itemId,
                role: 'assistant',
                text: transcript,
                timestamp: Date.now(),
                isComplete: true,
              });
            }
          }
        }
        break;
      
      case 'response.content_part.done':
        // Content part completed - might contain audio or text
        console.log('📦 Content part done:', (event as any).part?.type);
        const part = (event as any).part;
        if (part?.type === 'audio' && part?.transcript && this.currentAssistantItemId) {
          this.updateTranscriptEntry(this.currentAssistantItemId, { text: part.transcript });
        }
        break;
      
      case 'response.output_item.done':
        // Output item completed
        console.log('📦 Output item done');
        break;
        
      case 'response.done':
        // AI finished responding
        console.log('✅ RESPONSE DONE:', this.currentResponseId);
        if (this.currentAssistantItemId) {
          this.updateTranscriptEntry(this.currentAssistantItemId, { isComplete: true });
        }
        this.currentAssistantItemId = null;
        
        // Reset ALL state for next response
        this.resetAudioPlayback();
        this.isInterrupted = false;
        this.interruptedAt = 0;
        
        // Clean up: remove this response from cancelled set (if it was there)
        // and clear old entries to prevent memory leaks
        if (this.currentResponseId) {
          this.cancelledResponseIds.delete(this.currentResponseId);
        }
        // Keep only the last 10 cancelled IDs to prevent unbounded growth
        if (this.cancelledResponseIds.size > 10) {
          const idsArray = Array.from(this.cancelledResponseIds);
          this.cancelledResponseIds = new Set(idsArray.slice(-10));
        }
        
        this.currentResponseId = null;
        
        // Make sure gain is at 1 for next response
        if (this.masterGainNode && this.audioContext) {
          this.masterGainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        }
        
        // If interview was being concluded, notify that conclusion is complete
        if (this.isInterviewEnded) {
          console.log('🏁 Interview conclusion message delivered');
          this.onConclusionComplete();
        } else {
          console.log('   Ready for next response');
        }
        break;
        
      case 'response.cancelled':
        // Response was cancelled (due to barge-in)
        const cancelledResponseId = (event as any).response?.id;
        console.log('🔇 Response cancelled:', cancelledResponseId);
        
        // CRITICAL: Only reset if this is the CURRENT response being cancelled
        // If this is an OLD response that was already cancelled, ignore it!
        // Otherwise we'd reset the state for the NEW response that's already playing
        if (cancelledResponseId && cancelledResponseId !== this.currentResponseId) {
          console.log('   ℹ️ Ignoring - this is an old cancelled response, not current');
          break;
        }
        
        // Also check if it's in our cancelled set (we already handled it)
        if (cancelledResponseId && this.cancelledResponseIds.has(cancelledResponseId)) {
          console.log('   ℹ️ Ignoring - already in cancelled set');
          break;
        }
        
        this.currentAssistantItemId = null;
        this.resetAudioPlayback();
        break;
        
      case 'rate_limits.updated':
        // Rate limit info - could display to user if needed
        break;
        
      default:
        // Log unknown events for debugging with more detail
        const eventData = event as any;
        console.log('📨 Unhandled event:', event.type);
        
        // SPECIAL: Log any event related to transcription for debugging
        if (event.type.includes('transcription') || event.type.includes('transcript')) {
          console.log('🎯 TRANSCRIPTION-RELATED EVENT DETECTED:', event.type);
          console.log('   Full event data:', JSON.stringify(eventData, null, 2));
        }
        
        // Check if this event has audio data
        // GUARDED: Only play if NOT interrupted and has a valid response_id
        if (eventData.delta && typeof eventData.delta === 'string' && eventData.delta.length > 100) {
          console.log('   🔊 This event might contain audio! Delta length:', eventData.delta.length);
          // Only play audio from unknown events if:
          // 1. We're not interrupted
          // 2. We have a valid response_id that matches current
          if (!this.isInterrupted && eventData.response_id && eventData.response_id === this.currentResponseId) {
            this.playAudioChunk(eventData.delta, eventData.response_id);
          } else {
            console.log('   🔇 Skipping audio from unknown event (interrupted or mismatched response_id)');
          }
        }
        if (eventData.audio) {
          console.log('   🔊 Event has audio field:', typeof eventData.audio);
        }
        if (eventData.transcript) {
          console.log('   📝 Event has transcript:', eventData.transcript);
        }
        break;
    }
  }

  /**
   * Send an event to the server
   */
  private sendEvent(event: ClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  // ============================================
  // PRIVATE: TRANSCRIPT MANAGEMENT
  // ============================================

  /**
   * Add a new transcript entry
   */
  private addTranscriptEntry(entry: TranscriptEntry): void {
    this.transcript.push(entry);
    this.config.onTranscriptUpdate?.([...this.transcript]);
  }

  /**
   * Update an existing transcript entry
   */
  private updateTranscriptEntry(id: string, updates: Partial<TranscriptEntry>): void {
    const index = this.transcript.findIndex(e => e.id === id);
    if (index !== -1) {
      this.transcript[index] = { ...this.transcript[index], ...updates };
      this.config.onTranscriptUpdate?.([...this.transcript]);
    }
  }

  /**
   * Append text to an existing transcript entry
   */
  private appendToTranscriptEntry(id: string, text: string): void {
    const index = this.transcript.findIndex(e => e.id === id);
    if (index !== -1) {
      this.transcript[index].text += text;
      this.config.onTranscriptUpdate?.([...this.transcript]);
    }
  }

  /**
   * Add or update an assistant transcript entry
   * Only creates entry if we have actual text to show
   */
  private addOrUpdateAssistantEntry(id: string, text: string): void {
    if (!text || !text.trim()) return;
    
    const existingIndex = this.transcript.findIndex(e => e.id === id);
    if (existingIndex === -1) {
      // Create new entry
      this.addTranscriptEntry({
        id,
        role: 'assistant',
        text,
        timestamp: Date.now(),
        isComplete: false,
      });
    } else {
      // Append to existing entry
      this.transcript[existingIndex].text += text;
      this.config.onTranscriptUpdate?.([...this.transcript]);
    }
  }

  // ============================================
  // PRIVATE: STATE MANAGEMENT
  // ============================================

  /**
   * Update and broadcast connection status
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.config.onConnectionStatusChange?.(status);
  }
}

// Export a factory function for convenience
export function createLiveInterviewClient(
  config: LiveInterviewClientConfig = {}
): LiveInterviewClient {
  return new LiveInterviewClient(config);
}

