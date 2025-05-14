/**
 * Tests for audioUtils.ts
 */

import { audioManager, initAudio, getAudioIntensity, shouldJump, getJumpPower, cleanupAudio } from './audioUtils';

// Mock global objects that are not available in test environment
const mockAnalyserNode = {
  fftSize: 0,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn((array) => {
    // Simulate filling the array with frequency data (between 0-255)
    for (let i = 0; i < array.length; i++) {
      // Simulate different audio intensity patterns
      if (global.mockAudioIntensity === 'low') {
        array[i] = Math.floor(Math.random() * 30); // Low intensity
      } else if (global.mockAudioIntensity === 'medium') {
        array[i] = Math.floor(30 + Math.random() * 100); // Medium intensity
      } else if (global.mockAudioIntensity === 'high') {
        array[i] = Math.floor(150 + Math.random() * 105); // High intensity
      } else {
        array[i] = 0; // Default silent
      }
    }
  }),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  createAnalyser: jest.fn(() => mockAnalyserNode),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  close: jest.fn(),
};

const mockMediaStream = {
  getAudioTracks: jest.fn(() => [
    { stop: jest.fn() }
  ]),
};

// Declare mock audio intensity global
declare global {
  var mockAudioIntensity: 'silent' | 'low' | 'medium' | 'high';
}

// Setup mocks
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset global mock setting
  global.mockAudioIntensity = 'silent';
  
  // Reset audio manager
  audioManager.audioContext = null;
  audioManager.analyser = null;
  audioManager.dataArray = null;
  audioManager.microphone = null;
  audioManager.isInitialized = false;
  audioManager.smoothedIntensity = 0;
  
  // Setup global navigator mock
  Object.defineProperty(global, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
      },
    },
    writable: true,
  });
  
  // Setup AudioContext mock
  Object.defineProperty(global, 'AudioContext', {
    value: jest.fn(() => mockAudioContext),
    writable: true,
  });
});

describe('Audio Utilities', () => {
  describe('initAudio', () => {
    it('should initialize audio context and analyzer', async () => {
      const result = await initAudio();
      
      expect(result).toBe(true);
      expect(audioManager.isInitialized).toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        })
      });
      expect(global.AudioContext).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalled();
    });
    
    it('should return false if getUserMedia fails', async () => {
      // Override mock to simulate failure
      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied')),
          },
        },
        writable: true,
      });
      
      const result = await initAudio();
      
      expect(result).toBe(false);
      expect(audioManager.isInitialized).toBe(false);
    });
  });
  
  describe('getAudioIntensity', () => {
    beforeEach(async () => {
      // Setup initialized audio manager
      await initAudio();
    });
    
    it('should return 0 if audio is not initialized', () => {
      // Override initialization flag
      audioManager.isInitialized = false;
      
      const intensity = getAudioIntensity();
      
      expect(intensity).toBe(0);
    });
    
    it('should return low intensity for quiet sounds', () => {
      global.mockAudioIntensity = 'low';
      
      const intensity = getAudioIntensity();
      
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThan(0.3);
    });
    
    it('should return high intensity for loud sounds', () => {
      global.mockAudioIntensity = 'high';
      
      const intensity = getAudioIntensity();
      
      expect(intensity).toBeGreaterThanOrEqual(0.4);
    });
    
    it('should apply smoothing to intensity values', () => {
      // First get a high intensity
      global.mockAudioIntensity = 'high';
      const firstIntensity = getAudioIntensity();
      
      // Then switch to low
      global.mockAudioIntensity = 'low';
      const secondIntensity = getAudioIntensity();
      
      // Due to smoothing, the second value should not drop immediately to very low
      expect(secondIntensity).toBeGreaterThan(0.1);
      expect(secondIntensity).toBeLessThan(firstIntensity);
    });
  });
  
  describe('shouldJump', () => {
    beforeEach(async () => {
      // Setup initialized audio manager
      await initAudio();
    });
    
    it('should return false for silent or low intensity sounds', () => {
      global.mockAudioIntensity = 'silent';
      expect(shouldJump()).toBe(false);
      
      global.mockAudioIntensity = 'low';
      expect(shouldJump()).toBe(false);
    });
    
    it('should return true for sounds above threshold', () => {
      global.mockAudioIntensity = 'medium';
      
      // May need to call multiple times due to smoothing
      getAudioIntensity();
      getAudioIntensity();
      
      expect(shouldJump()).toBe(true);
      
      global.mockAudioIntensity = 'high';
      expect(shouldJump()).toBe(true);
    });
  });
  
  describe('getJumpPower', () => {
    beforeEach(async () => {
      // Setup initialized audio manager
      await initAudio();
    });
    
    it('should return 0 for sounds below threshold', () => {
      global.mockAudioIntensity = 'silent';
      expect(getJumpPower()).toBe(0);
      
      global.mockAudioIntensity = 'low';
      expect(getJumpPower()).toBe(0);
    });
    
    it('should return higher values for louder sounds', () => {
      // Set medium intensity and allow smoothing to stabilize
      global.mockAudioIntensity = 'medium';
      getAudioIntensity();
      getAudioIntensity();
      const mediumPower = getJumpPower();
      
      // Set high intensity and allow smoothing to stabilize
      global.mockAudioIntensity = 'high';
      getAudioIntensity();
      getAudioIntensity();
      const highPower = getJumpPower();
      
      expect(mediumPower).toBeGreaterThan(0);
      expect(highPower).toBeGreaterThan(mediumPower);
      expect(highPower).toBeLessThanOrEqual(1);
    });
  });
  
  describe('cleanupAudio', () => {
    beforeEach(async () => {
      // Setup initialized audio manager
      await initAudio();
    });
    
    it('should clean up audio resources', () => {
      expect(audioManager.isInitialized).toBe(true);
      
      cleanupAudio();
      
      expect(audioManager.isInitialized).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
}); 