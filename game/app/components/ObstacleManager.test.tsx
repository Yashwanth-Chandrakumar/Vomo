/**
 * Tests for ObstacleManager component
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import ObstacleManager, { ObstacleType, Obstacle } from './ObstacleManager';

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  return setTimeout(() => callback(Date.now()), 0);
});

const mockCancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Setup mock props for ObstacleManager
const mockProps = {
  gameWidth: 800,
  gameHeight: 600,
  playerScore: 0,
  groundHeight: 50,
  onAddObstacle: jest.fn(),
  onRemoveObstacle: jest.fn(),
  onUpdateObstacles: jest.fn(),
};

describe('ObstacleManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should generate obstacles at intervals', () => {
    render(<ObstacleManager {...mockProps} />);
    
    // Fast-forward time to trigger obstacle generation
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Should have called onAddObstacle at least once
    expect(mockProps.onAddObstacle).toHaveBeenCalled();
    
    // Check that the obstacle has expected properties
    const obstacleArg = mockProps.onAddObstacle.mock.calls[0][0];
    expect(obstacleArg).toHaveProperty('id');
    expect(obstacleArg).toHaveProperty('type');
    expect(obstacleArg).toHaveProperty('x', 800); // Starting at game width
    expect(obstacleArg).toHaveProperty('active', true);
  });
  
  it('should generate different types of obstacles', () => {
    // Mock random to control obstacle type generation
    const mockMath = Object.create(global.Math);
    mockMath.random = jest.fn();
    global.Math = mockMath;
    
    // Test spike generation
    mockMath.random.mockReturnValueOnce(0.2); // For type selection
    mockMath.random.mockReturnValueOnce(0.5); // For obstacle properties
    
    render(<ObstacleManager {...mockProps} />);
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Check first call was a spike
    expect(mockProps.onAddObstacle).toHaveBeenCalled();
    expect(mockProps.onAddObstacle.mock.calls[0][0].type).toBe(ObstacleType.SPIKE);
    
    mockProps.onAddObstacle.mockClear();
    
    // Test moving spike generation
    mockMath.random.mockReturnValueOnce(0.5); // For type selection
    mockMath.random.mockReturnValueOnce(0.5); // For height
    mockMath.random.mockReturnValueOnce(0.5); // For y position
    mockMath.random.mockReturnValueOnce(0.7); // For direction
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Check second call was a moving spike
    expect(mockProps.onAddObstacle).toHaveBeenCalled();
    expect(mockProps.onAddObstacle.mock.calls[0][0].type).toBe(ObstacleType.MOVING_SPIKE);
    expect(mockProps.onAddObstacle.mock.calls[0][0].direction).toBe(1);
    
    mockProps.onAddObstacle.mockClear();
    
    // Test variable ground generation
    mockMath.random.mockReturnValueOnce(0.8); // For type selection
    mockMath.random.mockReturnValueOnce(0.5); // For width
    mockMath.random.mockReturnValueOnce(0.5); // For elevation
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Check third call was variable ground
    expect(mockProps.onAddObstacle).toHaveBeenCalled();
    expect(mockProps.onAddObstacle.mock.calls[0][0].type).toBe(ObstacleType.VARIABLE_GROUND);
    
    mockProps.onAddObstacle.mockClear();
    
    // Test collapsing bridge generation
    mockMath.random.mockReturnValueOnce(0.9); // For type selection
    mockMath.random.mockReturnValueOnce(0.5); // For width
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Check fourth call was a collapsing bridge
    expect(mockProps.onAddObstacle).toHaveBeenCalled();
    expect(mockProps.onAddObstacle.mock.calls[0][0].type).toBe(ObstacleType.COLLAPSING_BRIDGE);
    expect(mockProps.onAddObstacle.mock.calls[0][0].integrity).toBe(100);
  });
  
  it('should update obstacles position and state', () => {
    render(<ObstacleManager {...mockProps} />);
    
    // Fast-forward time to trigger obstacle update
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should have called onUpdateObstacles
    expect(mockProps.onUpdateObstacles).toHaveBeenCalled();
    
    // Test the update function provided to onUpdateObstacles
    const updateFn = mockProps.onUpdateObstacles.mock.calls[0][0];
    
    // Create mock obstacles array
    const mockObstacles: Obstacle[] = [
      {
        id: 'test-obstacle-1',
        type: ObstacleType.SPIKE,
        x: 500,
        y: 550,
        width: 20,
        height: 30,
        active: true,
      },
      {
        id: 'test-obstacle-2',
        type: ObstacleType.MOVING_SPIKE,
        x: 300,
        y: 530,
        width: 20,
        height: 20,
        active: true,
        direction: 1,
        speed: 2,
      },
      {
        id: 'test-obstacle-3',
        type: ObstacleType.SPIKE,
        x: -30, // Off screen
        y: 550,
        width: 20,
        height: 30,
        active: true,
      },
    ];
    
    // Apply the update function
    const updatedObstacles = updateFn(mockObstacles);
    
    // Check obstacles were updated correctly
    expect(updatedObstacles.length).toBe(2); // Off-screen obstacle should be filtered out
    
    // Check first obstacle moved left
    expect(updatedObstacles[0].x).toBeLessThan(mockObstacles[0].x);
    
    // Check moving spike moved both horizontally and vertically
    expect(updatedObstacles[1].x).toBeLessThan(mockObstacles[1].x);
    expect(updatedObstacles[1].y).not.toBe(mockObstacles[1].y);
  });
  
  it('should adjust difficulty based on score', () => {
    // Render with low score
    const { unmount } = render(<ObstacleManager {...mockProps} />);
    
    // Fast-forward to generate obstacle
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Store spawned obstacle
    const lowScoreObstacle = mockProps.onAddObstacle.mock.calls[0][0];
    
    unmount();
    mockProps.onAddObstacle.mockClear();
    
    // Render with high score (affects difficulty)
    render(<ObstacleManager {...mockProps} playerScore={100} />);
    
    // Fast-forward to generate obstacle
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Store spawned obstacle at higher difficulty
    const highScoreObstacle = mockProps.onAddObstacle.mock.calls[0][0];
    
    // For moving spikes, speed should be higher with higher score
    if (lowScoreObstacle.type === ObstacleType.MOVING_SPIKE && 
        highScoreObstacle.type === ObstacleType.MOVING_SPIKE) {
      expect(highScoreObstacle.speed).toBeGreaterThan(lowScoreObstacle.speed!);
    }
    
    // For collapsing bridges, collapse delay should be shorter with higher score
    if (lowScoreObstacle.type === ObstacleType.COLLAPSING_BRIDGE && 
        highScoreObstacle.type === ObstacleType.COLLAPSING_BRIDGE) {
      expect(highScoreObstacle.collapseDelay).toBeLessThan(lowScoreObstacle.collapseDelay!);
    }
  });
  
  it('should clean up animation frame on unmount', () => {
    const { unmount } = render(<ObstacleManager {...mockProps} />);
    
    // Fast-forward time to start the animation loop
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should have called requestAnimationFrame at least once
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
    
    // Unmount component
    unmount();
    
    // Should have called cancelAnimationFrame
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
}); 