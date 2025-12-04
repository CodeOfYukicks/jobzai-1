/**
 * AudioWorkletProcessor for real-time PCM16 audio encoding
 * 
 * This processor captures audio from the microphone, converts Float32 samples
 * to PCM16 format, downsamples from the browser's sample rate (usually 48kHz)
 * to 24kHz for OpenAI Realtime API, and emits chunks for WebSocket transmission.
 * 
 * The OpenAI Realtime API expects:
 * - Format: PCM16 (16-bit signed integer)
 * - Sample Rate: 24000 Hz
 * - Channels: Mono (1 channel)
 */

class AudioRealtimeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Buffer to accumulate samples before sending
    // We want to send chunks roughly every 100ms for low latency
    // At 24kHz, that's 2400 samples per chunk
    this.bufferSize = 2400;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Track if we're recording
    this.isRecording = true;
    
    // Volume level for visualization (0-1)
    this.volumeLevel = 0;
    this.volumeSampleCount = 0;
    this.volumeAccumulator = 0;
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'stop') {
        this.isRecording = false;
      } else if (event.data.type === 'start') {
        this.isRecording = true;
      }
    };
  }

  /**
   * Convert Float32 audio sample to PCM16
   * Float32 range: -1.0 to 1.0
   * PCM16 range: -32768 to 32767
   */
  floatTo16BitPCM(float32) {
    // Clamp the value to prevent overflow
    const clamped = Math.max(-1, Math.min(1, float32));
    // Convert to 16-bit signed integer
    return clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
  }

  /**
   * Downsample audio from source sample rate to target sample rate
   * Uses linear interpolation for smooth downsampling
   */
  downsample(inputBuffer, inputSampleRate, outputSampleRate) {
    if (inputSampleRate === outputSampleRate) {
      return inputBuffer;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputBuffer.length / ratio);
    const output = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      // Linear interpolation between samples
      output[i] = inputBuffer[srcIndexFloor] * (1 - fraction) + 
                  inputBuffer[srcIndexCeil] * fraction;
    }
    
    return output;
  }

  /**
   * Convert Float32Array to PCM16 and then to base64 string
   * Note: btoa is not available in AudioWorkletGlobalScope, so we implement our own base64 encoder
   */
  encodeToBase64PCM16(float32Array) {
    // Create PCM16 buffer (2 bytes per sample)
    const pcm16Buffer = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      pcm16Buffer[i] = this.floatTo16BitPCM(float32Array[i]);
    }
    
    // Convert to Uint8Array for base64 encoding
    const uint8Array = new Uint8Array(pcm16Buffer.buffer);
    
    // Base64 encoding without btoa (not available in AudioWorklet)
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < uint8Array.length) {
      const byte1 = uint8Array[i++] || 0;
      const byte2 = uint8Array[i++] || 0;
      const byte3 = uint8Array[i++] || 0;
      
      const triplet = (byte1 << 16) | (byte2 << 8) | byte3;
      
      result += base64Chars[(triplet >> 18) & 0x3F];
      result += base64Chars[(triplet >> 12) & 0x3F];
      result += (i > uint8Array.length + 1) ? '=' : base64Chars[(triplet >> 6) & 0x3F];
      result += (i > uint8Array.length) ? '=' : base64Chars[triplet & 0x3F];
    }
    
    return result;
  }

  /**
   * Calculate RMS volume level for visualization
   */
  calculateVolume(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Process incoming audio data
   * Called by the Web Audio API with 128 samples at a time
   */
  process(inputs, outputs, parameters) {
    // Get the first input channel (mono)
    const input = inputs[0];
    if (!input || input.length === 0) {
      // Log occasionally if no input
      if (Math.random() < 0.001) {
        this.port.postMessage({ type: 'debug', message: 'No input data received' });
      }
      return true;
    }
    
    const channelData = input[0];
    if (!channelData || channelData.length === 0) {
      if (Math.random() < 0.001) {
        this.port.postMessage({ type: 'debug', message: 'Empty channel data' });
      }
      return true;
    }
    
    // Skip if not recording
    if (!this.isRecording) {
      return true;
    }
    
    // Check if we're getting actual audio (not silence)
    // Log once every few seconds
    if (!this.lastNonSilenceCheck) this.lastNonSilenceCheck = 0;
    this.lastNonSilenceCheck++;
    if (this.lastNonSilenceCheck >= 3000) { // ~every 3 seconds at 128 samples/call
      let hasSound = false;
      let maxSample = 0;
      for (let i = 0; i < channelData.length; i++) {
        const abs = Math.abs(channelData[i]);
        if (abs > maxSample) maxSample = abs;
        if (abs > 0.001) hasSound = true;
      }
      this.port.postMessage({ 
        type: 'debug', 
        message: `Audio check - hasSound: ${hasSound}, maxSample: ${maxSample.toFixed(6)}` 
      });
      this.lastNonSilenceCheck = 0;
    }
    
    // Accumulate volume for visualization
    for (let i = 0; i < channelData.length; i++) {
      this.volumeAccumulator += channelData[i] * channelData[i];
      this.volumeSampleCount++;
    }
    
    // Send volume update every ~50ms (at 48kHz, that's about 2400 samples)
    if (this.volumeSampleCount >= 2400) {
      const rms = Math.sqrt(this.volumeAccumulator / this.volumeSampleCount);
      // Normalize to 0-1 range with some amplification for visibility
      const normalizedVolume = Math.min(1, rms * 3);
      this.port.postMessage({
        type: 'volume',
        level: normalizedVolume
      });
      this.volumeAccumulator = 0;
      this.volumeSampleCount = 0;
    }
    
    // Copy samples to buffer
    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];
      
      // When buffer is full, process and send
      if (this.bufferIndex >= this.bufferSize) {
        // Downsample from current sample rate (usually 48kHz) to 24kHz
        // sampleRate is a global in AudioWorkletGlobalScope
        const downsampled = this.downsample(this.buffer, sampleRate, 24000);
        
        // Encode to base64 PCM16
        const base64Audio = this.encodeToBase64PCM16(downsampled);
        
        // Send to main thread
        this.port.postMessage({
          type: 'audio',
          audio: base64Audio
        });
        
        // Reset buffer
        this.bufferIndex = 0;
      }
    }
    
    // Keep processor alive
    return true;
  }
}

// Register the processor
registerProcessor('audio-realtime-processor', AudioRealtimeProcessor);

