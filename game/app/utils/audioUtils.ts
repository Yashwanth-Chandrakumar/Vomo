/**
 * Audio utilities for microphone-based game control
 */

// Smoothing factor for the audio intensity (0-1)
// Lower values mean more smoothing/slower response
const SMOOTHING_FACTOR = 0.3;

// Minimum audio intensity threshold to trigger a jump
const MIN_INTENSITY_THRESHOLD = 0.05;

// Maximum intensity value (for normalization)
const MAX_INTENSITY = 0.8;

interface AudioManager {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
  microphone: MediaStreamAudioSourceNode | null;
  isInitialized: boolean;
  smoothedIntensity: number;
}

// Singleton audio manager
export const audioManager: AudioManager = {
  audioContext: null,
  analyser: null,
  dataArray: null,
  microphone: null,
  isInitialized: false,
  smoothedIntensity: 0,
};

/**
 * Initialize microphone access and audio processing
 * @returns Promise that resolves when audio is initialized
 */
export const initAudio = async (): Promise<boolean> => {
  try {
    if (audioManager.isInitialized) {
      return true;
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Create audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Connect microphone to analyzer
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    // Store references
    audioManager.audioContext = audioContext;
    audioManager.analyser = analyser;
    audioManager.dataArray = dataArray;
    audioManager.microphone = microphone;
    audioManager.isInitialized = true;
    
    return true;
  } catch (error) {
    console.error("Error initializing audio:", error);
    return false;
  }
};

/**
 * Get the current audio intensity (0-1) with smoothing
 * @returns Normalized and smoothed audio intensity between 0-1
 */
export const getAudioIntensity = (): number => {
  if (!audioManager.isInitialized || !audioManager.analyser || !audioManager.dataArray) {
    return 0;
  }

  // Get frequency data
  audioManager.analyser.getByteFrequencyData(audioManager.dataArray);
  
  // Calculate average intensity
  const sum = Array.from(audioManager.dataArray).reduce((acc, val) => acc + val, 0);
  const rawIntensity = sum / audioManager.dataArray.length / 255; // Normalize to 0-1
  
  // Apply smoothing using exponential moving average
  audioManager.smoothedIntensity = 
    SMOOTHING_FACTOR * rawIntensity + 
    (1 - SMOOTHING_FACTOR) * audioManager.smoothedIntensity;

  // Normalize to 0-1 range with upper bound
  const normalizedIntensity = Math.min(audioManager.smoothedIntensity / MAX_INTENSITY, 1);
  
  return normalizedIntensity;
};

/**
 * Determine if audio intensity exceeds jump threshold
 * @returns Boolean indicating if jump should occur
 */
export const shouldJump = (): boolean => {
  const intensity = getAudioIntensity();
  return intensity > MIN_INTENSITY_THRESHOLD;
};

/**
 * Map audio intensity to jump height
 * @returns Jump force/height (0-1)
 */
export const getJumpPower = (): number => {
  const intensity = getAudioIntensity();
  
  // Only return values above threshold
  if (intensity <= MIN_INTENSITY_THRESHOLD) {
    return 0;
  }
  
  // Map from threshold->1 to 0.3->1 (minimum and maximum jump power)
  const minJumpPower = 0.3;
  const normalizedIntensity = (intensity - MIN_INTENSITY_THRESHOLD) / 
                              (1 - MIN_INTENSITY_THRESHOLD);
  
  return minJumpPower + normalizedIntensity * (1 - minJumpPower);
};

/**
 * Clean up audio resources
 */
export const cleanupAudio = (): void => {
  if (audioManager.microphone) {
    audioManager.microphone.disconnect();
  }
  
  if (audioManager.audioContext) {
    audioManager.audioContext.close();
  }
  
  audioManager.isInitialized = false;
}; 