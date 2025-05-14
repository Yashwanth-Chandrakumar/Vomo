// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock window.requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => callback(Date.now()), 0);
};

// Mock window.cancelAnimationFrame
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  fill: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  font: '',
  textAlign: '',
  fillText: jest.fn(),
}));

// Mock MediaDevices API
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() }
      ]),
    }),
  },
  writable: true,
});

// Mock the AudioContext API
class MockAnalyserNode {
  constructor() {
    this.fftSize = 0;
    this.frequencyBinCount = 128;
    this.getByteFrequencyData = jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = 0;
      }
    });
  }
  connect() {}
  disconnect() {}
}

class MockAudioContext {
  constructor() {
    this.createAnalyser = jest.fn(() => new MockAnalyserNode());
    this.createMediaStreamSource = jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
    }));
    this.close = jest.fn();
  }
}

global.AudioContext = MockAudioContext;

// Mock Web Audio API
global.MediaStreamAudioSourceNode = jest.fn().mockImplementation(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
}); 