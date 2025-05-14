/**
 * Tests for GameEngine component
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GameEngine from './GameEngine';
import * as audioUtils from '../utils/audioUtils';

// Mock ObstacleManager component
jest.mock('./ObstacleManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => null),
    ObstacleType: {
      SPIKE: 'spike',
      MOVING_SPIKE: 'moving-spike',
      COLLAPSING_BRIDGE: 'collapsing-bridge',
      VARIABLE_GROUND: 'variable-ground',
    },
  };
});

// Mock audio utilities
jest.mock('../utils/audioUtils', () => ({
  initAudio: jest.fn().mockResolvedValue(true),
  getJumpPower: jest.fn().mockReturnValue(0.8),
  shouldJump: jest.fn().mockReturnValue(false),
  cleanupAudio: jest.fn(),
  audioManager: {
    isInitialized: false,
  },
}));

// Mock canvas context
const mockContext = {
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
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  return setTimeout(() => callback(Date.now()), 0);
});

const mockCancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock canvas element
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('GameEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should render canvas with correct dimensions', () => {
    render(<GameEngine width={800} height={600} />);
    
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });
  
  it('should initialize with menu state', () => {
    render(<GameEngine width={800} height={600} />);
    
    // Should display menu text
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Microphone Flappy Bird'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  it('should start game on space key press', () => {
    render(<GameEngine width={800} height={600} />);
    
    // Press space to start game
    fireEvent.keyDown(window, { code: 'Space' });
    
    // Should initialize audio
    expect(audioUtils.initAudio).toHaveBeenCalled();
    
    // Game loop should be running
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
  
  it('should start game on click', () => {
    render(<GameEngine width={800} height={600} />);
    
    // Click to start game
    fireEvent.click(screen.getByRole('presentation'));
    
    // Game loop should be running
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
  
  it('should load high score from localStorage', () => {
    // Mock localStorage to return a high score
    mockLocalStorage.getItem.mockReturnValue('100');
    
    render(<GameEngine width={800} height={600} />);
    
    // Start game and trigger game over
    fireEvent.click(screen.getByRole('presentation'));
    
    // Advance time to update game state
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Force game over
    act(() => {
      // Mock collision detection to force game over
      const checkCollisionCall = jest.spyOn(React, 'useCallback').mock.calls.find(
        call => call[0].toString().includes('checkCollision')
      );
      
      if (checkCollisionCall && typeof checkCollisionCall[0] === 'function') {
        const checkCollisionFn = checkCollisionCall[0];
        jest.spyOn(checkCollisionFn, 'call').mockReturnValue(true);
      }
      
      jest.advanceTimersByTime(100);
    });
    
    // Should display high score text
    expect(mockContext.fillText).toHaveBeenCalledWith(
      expect.stringContaining('High Score: 100'),
      expect.any(Number),
      expect.any(Number)
    );
  });
  
  it('should handle player physics', () => {
    render(<GameEngine width={800} height={600} />);
    
    // Start game
    fireEvent.click(screen.getByRole('presentation'));
    
    // Get reference to player object
    const playerRef = {
      current: {
        x: 160,
        y: 510,
        velocityY: 0,
        isJumping: false,
        jumpPower: 0,
      }
    };
    
    // Mock useRef to return our player reference
    jest.spyOn(React, 'useRef').mockReturnValueOnce(playerRef);
    
    // Simulate jump
    (audioUtils.shouldJump as jest.Mock).mockReturnValue(true);
    
    // Advance time to update physics
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Player should be jumping
    expect(playerRef.current.isJumping).toBe(true);
    expect(playerRef.current.velocityY).toBeLessThan(0);
    
    // Apply gravity over multiple frames
    for (let i = 0; i < 10; i++) {
      act(() => {
        jest.advanceTimersByTime(16); // ~60fps
      });
    }
    
    // Velocity should increase (gravity effect)
    expect(playerRef.current.velocityY).toBeGreaterThan(0);
  });
  
  it('should call onScoreChange when score changes', () => {
    const mockOnScoreChange = jest.fn();
    
    render(<GameEngine width={800} height={600} onScoreChange={mockOnScoreChange} />);
    
    // Start game
    fireEvent.click(screen.getByRole('presentation'));
    
    // Advance time to update score
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should have called onScoreChange
    expect(mockOnScoreChange).toHaveBeenCalled();
  });
  
  it('should call onGameOver when game ends', () => {
    const mockOnGameOver = jest.fn();
    
    render(<GameEngine width={800} height={600} onGameOver={mockOnGameOver} />);
    
    // Start game
    fireEvent.click(screen.getByRole('presentation'));
    
    // Simulate collision to trigger game over
    act(() => {
      // Find and call the handleGameOver function
      const gameOverCall = jest.spyOn(React, 'useCallback').mock.calls.find(
        call => call[0].toString().includes('handleGameOver')
      );
      
      if (gameOverCall && typeof gameOverCall[0] === 'function') {
        gameOverCall[0]();
      }
      
      jest.advanceTimersByTime(100);
    });
    
    // Should have called onGameOver
    expect(mockOnGameOver).toHaveBeenCalled();
  });
  
  it('should clean up resources on unmount', () => {
    const { unmount } = render(<GameEngine width={800} height={600} />);
    
    // Start game
    fireEvent.click(screen.getByRole('presentation'));
    
    // Advance time to start game loop
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Unmount component
    unmount();
    
    // Should clean up animation frame
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
    
    // Should clean up audio resources
    expect(audioUtils.cleanupAudio).toHaveBeenCalled();
  });
}); 