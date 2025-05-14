/**
 * ObstacleManager - Handles game obstacles, hazards and difficulty progression
 */

import { useCallback, useEffect, useRef } from 'react';

// Obstacle types
export enum ObstacleType {
  SPIKE = 'spike',
  MOVING_SPIKE = 'moving-spike',
  COLLAPSING_BRIDGE = 'collapsing-bridge',
  VARIABLE_GROUND = 'variable-ground',
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  // For moving obstacles
  direction?: number;
  speed?: number;
  // For collapsing bridges
  integrity?: number;
  collapseDelay?: number;
  // For variable ground
  elevation?: number;
}

interface ObstacleManagerProps {
  gameWidth: number;
  gameHeight: number;
  playerScore: number;
  groundHeight: number;
  onAddObstacle: (obstacle: Obstacle) => void;
  onRemoveObstacle: (id: string) => void;
  onUpdateObstacles: (updateFn: (obstacles: Obstacle[]) => Obstacle[]) => void;
}

export const ObstacleManager: React.FC<ObstacleManagerProps> = ({
  gameWidth,
  gameHeight,
  playerScore,
  groundHeight,
  onAddObstacle,
  onRemoveObstacle,
  onUpdateObstacles,
}) => {
  // Reference to track obstacle generation timing
  const lastObstacleTime = useRef<number>(0);
  const spawnRateRef = useRef<number>(2500); // Time between obstacles in ms
  const obstacleSpeed = useRef<number>(3); // Horizontal movement speed

  // Calculate difficulty based on score
  const getDifficulty = useCallback(() => {
    // Difficulty increases with score, affecting spawn rate and speed
    const baseDifficulty = Math.min(1, playerScore / 100);
    
    // Update spawn rate (faster as difficulty increases)
    spawnRateRef.current = Math.max(800, 2500 - 1700 * baseDifficulty);
    
    // Update speed (faster as difficulty increases)
    obstacleSpeed.current = 3 + 4 * baseDifficulty;
    
    return baseDifficulty;
  }, [playerScore]);

  // Generate a random obstacle based on current difficulty
  const generateObstacle = useCallback(() => {
    const difficulty = getDifficulty();
    const obstacleId = `obstacle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Weighted obstacle type selection based on difficulty
    const typeRandom = Math.random();
    let type: ObstacleType;
    
    if (typeRandom < 0.4) {
      type = ObstacleType.SPIKE;
    } else if (typeRandom < 0.7) {
      type = ObstacleType.MOVING_SPIKE;
    } else if (typeRandom < 0.85) {
      type = ObstacleType.VARIABLE_GROUND;
    } else {
      type = ObstacleType.COLLAPSING_BRIDGE;
    }
    
    // Base obstacle properties
    const obstacle: Obstacle = {
      id: obstacleId,
      type,
      x: gameWidth, // Start at the right edge
      y: 0, // Will be set based on type
      width: 0, // Will be set based on type
      height: 0, // Will be set based on type
      active: true,
    };
    
    // Configure obstacle based on type
    switch (type) {
      case ObstacleType.SPIKE:
        obstacle.width = 20;
        obstacle.height = 30 + Math.random() * 20;
        obstacle.y = gameHeight - groundHeight - obstacle.height;
        break;
        
      case ObstacleType.MOVING_SPIKE:
        obstacle.width = 20;
        obstacle.height = 20 + Math.random() * 30;
        obstacle.y = gameHeight - groundHeight - obstacle.height - (Math.random() * 30);
        obstacle.direction = Math.random() > 0.5 ? 1 : -1; // Up or down
        obstacle.speed = 1 + difficulty * 2; // Vertical movement speed
        break;
        
      case ObstacleType.COLLAPSING_BRIDGE:
        obstacle.width = 80 + Math.random() * 60;
        obstacle.height = 15;
        obstacle.y = gameHeight - groundHeight;
        obstacle.integrity = 100; // Will decrease when player is on it
        obstacle.collapseDelay = 500 - difficulty * 300; // Time before collapse starts (ms)
        break;
        
      case ObstacleType.VARIABLE_GROUND:
        obstacle.width = 100 + Math.random() * 150;
        obstacle.height = groundHeight;
        obstacle.y = gameHeight - groundHeight;
        obstacle.elevation = Math.round(20 + Math.random() * 40 * difficulty); // How much the ground changes
        break;
    }
    
    onAddObstacle(obstacle);
  }, [gameWidth, gameHeight, groundHeight, onAddObstacle, getDifficulty]);

  // Update obstacle positions and states
  const updateObstacles = useCallback(() => {
    onUpdateObstacles((obstacles) => {
      return obstacles.map(obstacle => {
        // Move obstacle left (basic movement)
        const newX = obstacle.x - obstacleSpeed.current;
        
        // If obstacle is off-screen, mark it for removal
        if (newX + obstacle.width < 0) {
          return { ...obstacle, active: false };
        }
        
        // Update based on obstacle type
        switch (obstacle.type) {
          case ObstacleType.MOVING_SPIKE:
            // Move up and down within bounds
            let newY = obstacle.y + (obstacle.direction || 1) * (obstacle.speed || 1);
            const minY = gameHeight - groundHeight - obstacle.height - 50;
            const maxY = gameHeight - groundHeight - obstacle.height;
            
            // Reverse direction if hitting bounds
            if (newY <= minY || newY >= maxY) {
              return {
                ...obstacle,
                x: newX,
                y: newY <= minY ? minY : maxY,
                direction: (obstacle.direction || 1) * -1,
              };
            }
            
            return { ...obstacle, x: newX, y: newY };
            
          default:
            return { ...obstacle, x: newX };
        }
      }).filter(obstacle => obstacle.active);
    });
  }, [gameHeight, groundHeight, onUpdateObstacles]);

  // Spawn obstacles at intervals
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      // Check if it's time to spawn a new obstacle
      if (!lastObstacleTime.current || timestamp - lastObstacleTime.current > spawnRateRef.current) {
        generateObstacle();
        lastObstacleTime.current = timestamp;
      }
      
      // Update existing obstacles
      updateObstacles();
      
      // Continue the loop
      requestAnimationFrame(gameLoop);
    };
    
    const animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [generateObstacle, updateObstacles]);

  // Component doesn't render anything directly
  return null;
};

export default ObstacleManager; 