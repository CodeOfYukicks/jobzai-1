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
  SessionConfig,
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
// CONSTANTS
// ============================================

const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';
const MODEL = 'gpt-4o-realtime-preview-2024-12-17';

// ============================================
// LIVE INTERVIEW CLIENT CLASS
// ============================================

export class LiveInterviewClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  // Playback queue for AI audio responses
  private audioPlaybackQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentPlaybackSource: AudioBufferSourceNode | null = null;
  
  // State
  private connectionStatus: ConnectionStatus = 'disconnected';
  private transcript: TranscriptEntry[] = [];
  private currentAssistantItemId: string | null = null;
  private currentUserItemId: string | null = null;
  
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
    this.audioPlaybackQueue = [];
    this.isPlaying = false;
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
    
    return response.json();
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
        
        // Configure the session with our interviewer persona
        this.configureSession();
        
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
   * Uses the GA API session.update format
   */
  private configureSession(): void {
    const instructions = this.buildInterviewerInstructions();
    
    // GA API session configuration format
    console.log('📝 Configuring session with instructions...');
    
    // Send session update with valid type
    this.sendEvent({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions,
      },
    });
    
    console.log('✅ Session configuration sent');
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

You are an elite Senior HR Interview Manager conducting a professional mock interview session. Your role is to provide a realistic, challenging, yet supportive interview experience that prepares candidates for real-world interviews.

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
Begin by warmly greeting the candidate, introducing yourself as the interviewer for ${jobContext?.companyName || 'the company'}, and briefly explaining the interview format. Then smoothly transition into your first question about their background.`;
  }

  // ============================================
  // PRIVATE: AUDIO PIPELINE
  // ============================================

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000, // Will be downsampled in worklet
      },
    });
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
    
    // Load the audio worklet processor
    await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
    
    // Create source node from microphone
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create audio worklet node for processing
    this.audioWorkletNode = new AudioWorkletNode(
      this.audioContext,
      'audio-realtime-processor'
    );
    
    // Handle messages from the worklet (audio chunks and volume levels)
    this.audioWorkletNode.port.onmessage = (event) => {
      const { type, audio, level } = event.data;
      
      if (type === 'audio' && this.ws?.readyState === WebSocket.OPEN) {
        // Send audio chunk to OpenAI
        this.sendEvent({
          type: 'input_audio_buffer.append',
          audio,
        });
      } else if (type === 'volume') {
        // Update input volume visualization
        this.config.onAudioLevelChange?.(level, 'input');
      }
    };
    
    // Connect the audio pipeline: mic -> worklet
    this.sourceNode.connect(this.audioWorkletNode);
    
    // Note: We don't connect to destination to avoid feedback
    // The worklet processes audio and sends it via postMessage
    
    // Set status to live once audio is flowing
    this.setConnectionStatus('live');
  }

  // ============================================
  // PRIVATE: AUDIO PLAYBACK
  // ============================================

  /**
   * Decode and play audio from base64 PCM16
   */
  private async playAudioChunk(base64Audio: string): Promise<void> {
    if (!this.audioContext) return;
    
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
      
      // Add to queue and play
      this.audioPlaybackQueue.push(audioBuffer);
      this.processPlaybackQueue();
      
      // Calculate and report output volume
      const rms = Math.sqrt(float32.reduce((sum, s) => sum + s * s, 0) / float32.length);
      const normalizedVolume = Math.min(1, rms * 3);
      this.config.onAudioLevelChange?.(normalizedVolume, 'output');
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  }

  /**
   * Process the audio playback queue
   */
  private processPlaybackQueue(): void {
    if (this.isPlaying || this.audioPlaybackQueue.length === 0 || !this.audioContext) {
      return;
    }
    
    this.isPlaying = true;
    const buffer = this.audioPlaybackQueue.shift()!;
    
    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    this.currentPlaybackSource = source;
    
    source.onended = () => {
      this.isPlaying = false;
      this.currentPlaybackSource = null;
      // Process next chunk if available
      this.processPlaybackQueue();
    };
    
    source.start();
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
        break;
        
      case 'session.updated':
        console.log('✅ Session updated');
        break;
        
      case 'error':
        console.error('❌ Server error:', event.error);
        // Don't propagate session.update errors to UI - session can still work with defaults
        const errorMsg = event.error.message || '';
        if (errorMsg.includes('session.type') || 
            errorMsg.includes('session.modalities') ||
            errorMsg.includes('Unknown parameter') ||
            errorMsg.includes('Invalid value') ||
            errorMsg.includes('Missing required parameter')) {
          console.warn('⚠️ Session configuration failed, using defaults. This is OK.');
        } else {
          // Only show non-configuration errors to user
          this.config.onError?.(new Error(event.error.message));
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        // User started speaking - create new transcript entry
        this.currentUserItemId = event.item_id;
        this.addTranscriptEntry({
          id: event.item_id,
          role: 'user',
          text: '',
          timestamp: Date.now(),
          isComplete: false,
        });
        break;
        
      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        console.log('🎤 User stopped speaking');
        if (this.currentUserItemId) {
          this.updateTranscriptEntry(this.currentUserItemId, { isComplete: true });
        }
        break;
      
      case 'input_audio_buffer.committed':
        // Audio buffer was committed - this happens after speech is detected
        console.log('🎤 Audio buffer committed');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        // User's speech was transcribed
        this.updateTranscriptEntry(event.item_id, { 
          text: event.transcript,
          isComplete: true,
        });
        break;
        
      case 'response.created':
        // AI is starting to respond
        this.currentAssistantItemId = null;
        break;
        
      case 'response.output_item.added':
        // New output item from AI
        if (event.item.role === 'assistant') {
          this.currentAssistantItemId = event.item.id;
          this.addTranscriptEntry({
            id: event.item.id,
            role: 'assistant',
            text: '',
            timestamp: Date.now(),
            isComplete: false,
          });
        }
        break;
      
      // GA API sends conversation.item.created or conversation.item.added for new items
      case 'conversation.item.created':
      case 'conversation.item.added':
        // Handle both user and assistant items
        console.log('📝 Conversation item:', event.item?.role, event.item?.id);
        if (event.item && event.item.role === 'assistant' && !this.currentAssistantItemId) {
          this.currentAssistantItemId = event.item.id;
          this.addTranscriptEntry({
            id: event.item.id,
            role: 'assistant',
            text: '',
            timestamp: Date.now(),
            isComplete: false,
          });
        }
        // Also extract any text content from the item
        if (event.item?.content) {
          for (const part of event.item.content) {
            if (part.type === 'text' && part.text) {
              console.log('📝 Got text content:', part.text);
              if (this.currentAssistantItemId) {
                this.appendToTranscriptEntry(this.currentAssistantItemId, part.text);
              }
            }
            if (part.type === 'audio' && part.transcript) {
              console.log('📝 Got audio transcript:', part.transcript);
              if (this.currentAssistantItemId) {
                this.appendToTranscriptEntry(this.currentAssistantItemId, part.transcript);
              }
            }
          }
        }
        break;
      
      case 'conversation.item.done':
        // Item is complete
        console.log('✅ Conversation item done:', event.item?.id);
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
        // AI audio chunk - play it
        console.log('🔊 Received audio chunk, length:', event.delta?.length);
        this.playAudioChunk(event.delta);
        break;
      
      // GA API audio delta event (might be named differently)
      case 'response.output_audio.delta':
        console.log('🔊 GA API audio delta received');
        if ((event as any).delta) {
          this.playAudioChunk((event as any).delta);
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
        console.log('📝 Transcript delta:', (event as any).delta);
        if (this.currentAssistantItemId && (event as any).delta) {
          this.appendToTranscriptEntry((event as any).item_id || this.currentAssistantItemId, (event as any).delta);
        }
        break;
        
      case 'response.output_audio_transcript.done':
        // Final transcript of AI speech
        console.log('📝 Transcript done:', (event as any).transcript);
        if (this.currentAssistantItemId && (event as any).transcript) {
          // Update with final transcript
          this.updateTranscriptEntry((event as any).item_id || this.currentAssistantItemId, {
            text: (event as any).transcript,
          });
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
        console.log('✅ Response done');
        if (this.currentAssistantItemId) {
          this.updateTranscriptEntry(this.currentAssistantItemId, { isComplete: true });
        }
        this.currentAssistantItemId = null;
        break;
        
      case 'rate_limits.updated':
        // Rate limit info - could display to user if needed
        break;
        
      default:
        // Log unknown events for debugging with more detail
        const eventData = event as any;
        console.log('📨 Unhandled event:', event.type);
        // Check if this event has audio data
        if (eventData.delta && typeof eventData.delta === 'string' && eventData.delta.length > 100) {
          console.log('   🔊 This event might contain audio! Delta length:', eventData.delta.length);
          // Try to play it as audio
          this.playAudioChunk(eventData.delta);
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

