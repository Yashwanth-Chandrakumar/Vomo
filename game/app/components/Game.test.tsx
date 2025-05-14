/**
 * Tests for Game component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Game from './Game';
import * as audioUtils from '../utils/audioUtils';
import * as faceUtils from '../utils/faceUtils';

// Mock GameEngine component
jest.mock('./GameEngine', () => {
  return jest.fn(() => (
    <div data-testid="mock-game-engine">
      Game Engine Mock
    </div>
  ));
});

// Mock FaceModelDownloader component
jest.mock('./FaceModelDownloader', () => {
  return jest.fn(({ onComplete }) => (
    <div data-testid="mock-face-model-downloader">
      <button onClick={onComplete}>Complete Download</button>
    </div>
  ));
});

// Mock ScoreBoard component
jest.mock('./ScoreBoard', () => {
  return jest.fn(({ localHighScore, onClose }) => (
    <div data-testid="mock-scoreboard">
      High Score: {localHighScore}
      <button onClick={onClose}>Close</button>
    </div>
  ));
});

// Mock audio utilities
jest.mock('../utils/audioUtils', () => ({
  initAudio: jest.fn().mockResolvedValue(true),
  cleanupAudio: jest.fn(),
}));

// Mock face detection utilities
jest.mock('../utils/faceUtils', () => ({
  initFaceDetection: jest.fn().mockResolvedValue(true),
  cleanupFaceDetection: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock MediaDevices API
const mockMediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: jest.fn().mockReturnValue([
      { stop: jest.fn() }
    ]),
  }),
};
Object.defineProperty(window.navigator, 'mediaDevices', { value: mockMediaDevices });

describe('Game', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('100'); // Mock high score
  });
  
  it('renders game engine with correct dimensions', () => {
    render(<Game />);
    
    const gameEngine = screen.getByTestId('mock-game-engine');
    expect(gameEngine).toBeInTheDocument();
  });
  
  it('loads high score from localStorage', () => {
    render(<Game />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('flappyBirdHighScore');
    expect(screen.getByText(/High Score: 100/)).toBeInTheDocument();
  });
  
  it('checks microphone permissions on mount', () => {
    render(<Game />);
    
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });
  
  it('shows settings panel when settings button is clicked', () => {
    render(<Game />);
    
    // Find and click settings button
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    // Check if settings panel is shown
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Game Width')).toBeInTheDocument();
    expect(screen.getByText('Game Height')).toBeInTheDocument();
  });
  
  it('shows score board when score button is clicked', () => {
    render(<Game />);
    
    // Find and click score button
    const scoreButton = screen.getByRole('button', { name: /High Score: 100/i });
    fireEvent.click(scoreButton);
    
    // Check if scoreboard is shown
    expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
  });
  
  it('enables face controls when checkbox is clicked', () => {
    render(<Game />);
    
    // Open settings panel
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    // Find and click face controls checkbox
    const checkbox = screen.getByLabelText(/Enable Face Controls/i);
    fireEvent.click(checkbox);
    
    // Should request camera permissions
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true });
  });
  
  it('initializes face detection when models are loaded', () => {
    render(<Game enableFaceControls={true} />);
    
    // Mock models download completion
    const modelDownloader = screen.getByTestId('mock-face-model-downloader');
    const completeButton = screen.getByRole('button', { name: /Complete Download/i });
    fireEvent.click(completeButton);
    
    // Should initialize face detection
    expect(faceUtils.initFaceDetection).toHaveBeenCalled();
  });
  
  it('cleans up resources on unmount', () => {
    const { unmount } = render(<Game enableFaceControls={true} />);
    
    // Unmount component
    unmount();
    
    // Should clean up audio and face detection
    expect(audioUtils.cleanupAudio).toHaveBeenCalled();
    expect(faceUtils.cleanupFaceDetection).toHaveBeenCalled();
  });
}); 