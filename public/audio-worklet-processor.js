// AudioWorklet processor for real-time PCM capture with client-side silence filtering
// This runs in the AudioWorklet thread (separate from main thread)

class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.chunkSize = 8000; // default ~0.5s at 16kHz
    this.stopped = false;
    this.silenceThreshold = 0.007; // RMS threshold for silence detection
    this.skipSilence = false; // Whether to skip sending silent chunks
    
    this.port.onmessage = (e) => {
      if (e.data && e.data.chunkSize) {
        const cs = e.data.chunkSize;
        if (typeof cs === 'number' && cs >= 512 && cs <= 32000) {
          this.chunkSize = cs;
        }
      }
      if (e.data && e.data.silenceThreshold !== undefined) {
        this.silenceThreshold = e.data.silenceThreshold;
      }
      if (e.data && e.data.skipSilence !== undefined) {
        this.skipSilence = e.data.skipSilence;
      }
      if (e.data && e.data.stop) {
        this.stopped = true;
      }
    };
  }

  // Calculate RMS (Root Mean Square) of audio samples
  calculateRMS(samples) {
    if (!samples || samples.length === 0) return 0;
    let sum = 0;
    for (const sample of samples) {
      sum += sample * sample;
    }
    return Math.sqrt(sum / samples.length);
  }

  // eslint-disable-next-line consistent-return
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) {
      // If asked to stop and buffer empty, end; otherwise continue
      return !(this.stopped && this.buffer.length === 0);
    }

    // Mono channel
    const channel = input[0];
    this.buffer.push(new Float32Array(channel));

    // Check if we have enough samples
    const totalSamples = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    if (totalSamples >= this.chunkSize) {
      // Combine buffers
      const combined = new Float32Array(totalSamples);
      let offset = 0;
      for (const buf of this.buffer) {
        combined.set(buf, offset);
        offset += buf.length;
      }

      // Calculate RMS to detect silence
      const rms = this.calculateRMS(combined);
      
      // If skip silence is enabled and this chunk is silent, don't send it
      if (this.skipSilence && rms < this.silenceThreshold) {
        // Skip this chunk entirely
        this.port.postMessage({ skipped: true, rms: rms, threshold: this.silenceThreshold });
        this.buffer = [];
      } else {
        // Send to main thread with RMS info
        this.port.postMessage({ pcm: combined, rms: rms });
        this.buffer = [];
      }
    }

    // If stopped and buffer flushed, we can end processing, otherwise keep alive
    return !(this.stopped && this.buffer.length === 0);
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor);

