/**
 * OpenAI Realtime API TypeScript Types
 * 
 * These types model the WebSocket events and payloads for OpenAI's Realtime API.
 * Reference: https://platform.openai.com/docs/guides/realtime
 */

// ============================================
// SESSION TYPES
// ============================================

export type Voice = 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';
export type Modality = 'text' | 'audio';

export interface TurnDetection {
  type: 'server_vad';
  threshold?: number; // 0.0 to 1.0, default 0.5
  prefix_padding_ms?: number; // default 300
  silence_duration_ms?: number; // default 500
}

export interface Tool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface SessionConfig {
  type?: 'realtime'; // Required for GA API session.update
  modalities?: Modality[];
  instructions?: string;
  voice?: Voice;
  input_audio_format?: AudioFormat;
  output_audio_format?: AudioFormat;
  input_audio_transcription?: {
    model: 'whisper-1';
  } | null;
  turn_detection?: TurnDetection | null;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
}

export interface Session {
  id: string;
  object: 'realtime.session';
  model: string;
  modalities: Modality[];
  instructions: string;
  voice: Voice;
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  input_audio_transcription: { model: 'whisper-1' } | null;
  turn_detection: TurnDetection | null;
  tools: Tool[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number | 'inf';
}

// ============================================
// CONVERSATION ITEM TYPES
// ============================================

export type ItemType = 'message' | 'function_call' | 'function_call_output';
export type ItemRole = 'user' | 'assistant' | 'system';
export type ItemStatus = 'completed' | 'in_progress' | 'incomplete';

export interface TextContent {
  type: 'text';
  text: string;
}

export interface AudioContent {
  type: 'audio';
  audio?: string; // base64 encoded
  transcript?: string;
}

export interface InputTextContent {
  type: 'input_text';
  text: string;
}

export interface InputAudioContent {
  type: 'input_audio';
  audio?: string; // base64 encoded
  transcript?: string;
}

export type ContentPart = TextContent | AudioContent | InputTextContent | InputAudioContent;

export interface ConversationItem {
  id: string;
  object: 'realtime.item';
  type: ItemType;
  status: ItemStatus;
  role: ItemRole;
  content: ContentPart[];
}

export interface Conversation {
  id: string;
  object: 'realtime.conversation';
}

// ============================================
// RESPONSE TYPES
// ============================================

export type ResponseStatus = 'in_progress' | 'completed' | 'cancelled' | 'incomplete' | 'failed';

export interface ResponseUsage {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  input_token_details?: {
    cached_tokens: number;
    text_tokens: number;
    audio_tokens: number;
  };
  output_token_details?: {
    text_tokens: number;
    audio_tokens: number;
  };
}

export interface Response {
  id: string;
  object: 'realtime.response';
  status: ResponseStatus;
  status_details: { type: string; reason?: string } | null;
  output: ConversationItem[];
  usage: ResponseUsage | null;
}

// ============================================
// CLIENT EVENTS (sent to server)
// ============================================

export interface SessionUpdateEvent {
  type: 'session.update';
  session: Partial<SessionConfig>;
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // base64 encoded PCM16 audio
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  previous_item_id?: string;
  item: {
    type: ItemType;
    role?: ItemRole;
    content?: Array<{
      type: 'input_text' | 'input_audio';
      text?: string;
      audio?: string;
    }>;
  };
}

export interface ConversationItemTruncateEvent {
  type: 'conversation.item.truncate';
  item_id: string;
  content_index: number;
  audio_end_ms: number;
}

export interface ConversationItemDeleteEvent {
  type: 'conversation.item.delete';
  item_id: string;
}

export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: Modality[];
    instructions?: string;
    voice?: Voice;
    output_audio_format?: AudioFormat;
    tools?: Tool[];
    tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; name: string };
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

export interface ResponseCancelEvent {
  type: 'response.cancel';
}

export type ClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ConversationItemTruncateEvent
  | ConversationItemDeleteEvent
  | ResponseCreateEvent
  | ResponseCancelEvent;

// ============================================
// SERVER EVENTS (received from server)
// ============================================

export interface ErrorEvent {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
    param: string | null;
    event_id: string | null;
  };
}

export interface SessionCreatedEvent {
  type: 'session.created';
  session: Session;
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: Session;
}

export interface ConversationCreatedEvent {
  type: 'conversation.created';
  conversation: Conversation;
}

export interface InputAudioBufferCommittedEvent {
  type: 'input_audio_buffer.committed';
  previous_item_id: string;
  item_id: string;
}

export interface InputAudioBufferClearedEvent {
  type: 'input_audio_buffer.cleared';
}

export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
  item_id: string;
}

export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created';
  previous_item_id: string | null;
  item: ConversationItem;
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent {
  type: 'conversation.item.input_audio_transcription.completed';
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface ConversationItemInputAudioTranscriptionFailedEvent {
  type: 'conversation.item.input_audio_transcription.failed';
  item_id: string;
  content_index: number;
  error: {
    type: string;
    code: string;
    message: string;
    param: string | null;
  };
}

export interface ConversationItemTruncatedEvent {
  type: 'conversation.item.truncated';
  item_id: string;
  content_index: number;
  audio_end_ms: number;
}

export interface ConversationItemDeletedEvent {
  type: 'conversation.item.deleted';
  item_id: string;
}

export interface ResponseCreatedEvent {
  type: 'response.created';
  response: Response;
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: Response;
}

export interface ResponseOutputItemAddedEvent {
  type: 'response.output_item.added';
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseOutputItemDoneEvent {
  type: 'response.output_item.done';
  response_id: string;
  output_index: number;
  item: ConversationItem;
}

export interface ResponseContentPartAddedEvent {
  type: 'response.content_part.added';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: ContentPart;
}

export interface ResponseContentPartDoneEvent {
  type: 'response.content_part.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: ContentPart;
}

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseTextDoneEvent {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio chunk
}

export interface ResponseAudioDoneEvent {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

export interface ResponseFunctionCallArgumentsDeltaEvent {
  type: 'response.function_call_arguments.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  delta: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent {
  type: 'response.function_call_arguments.done';
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  arguments: string;
}

export interface RateLimitsUpdatedEvent {
  type: 'rate_limits.updated';
  rate_limits: Array<{
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
  }>;
}

export type ServerEvent =
  | ErrorEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | ConversationCreatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ConversationItemCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ConversationItemTruncatedEvent
  | ConversationItemDeletedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseContentPartAddedEvent
  | ResponseContentPartDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | RateLimitsUpdatedEvent;

// ============================================
// CONNECTION TYPES
// ============================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'ready' | 'live' | 'ended' | 'error';

export interface RealtimeSessionResponse {
  id: string;
  object: 'realtime.session';
  model: string;
  modalities: Modality[];
  instructions: string;
  voice: Voice;
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  input_audio_transcription: { model: 'whisper-1' } | null;
  turn_detection: TurnDetection | null;
  tools: Tool[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number | string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export interface CreateSessionResponse {
  url: string;
  client_secret: string;
  expires_at: number;
}

// ============================================
// TRANSCRIPT TYPES
// ============================================

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isComplete: boolean;
}

