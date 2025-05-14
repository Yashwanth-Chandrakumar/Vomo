/**
 * GameEngine - Core game loop, physics, and rendering
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { initAudio, getJumpPower, shouldJump, cleanupAudio } from '../utils/audioUtils';
import ObstacleManager, { Obstacle, ObstacleType } from './ObstacleManager';

// Game configuration constants
const GRAVITY = 0.5;
const MAX_JUMP_VELOCITY = -15;
const GROUND_HEIGHT = 50;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const INITIAL_GAME_SPEED = 5;

// Game states
enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  PAUSED
}

interface GameEngineProps {
  width: number;
  height: number;
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  width, 
  height,
  onScoreChange,
  onGameOver
}) => {
  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  
  // Player state
  const playerRef = useRef({
    x: width * 0.2,
    y: height - GROUND_HEIGHT - PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    jumpPower: 0,
  });
  
  // Obstacles state
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Initialize audio
  useEffect(() => {
    const setupAudio = async () => {
      const success = await initAudio();
      setAudioInitialized(success);
    };
    
    if (gameState === GameState.PLAYING && !audioInitialized) {
      setupAudio();
    }
    
    return () => {
      cleanupAudio();
    };
  }, [gameState, audioInitialized]);
  
  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappyBirdHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);
  
  // Game over handler
  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAME_OVER);
    
    // Update high score if necessary
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyBirdHighScore', score.toString());
    }
    
    if (onGameOver) {
      onGameOver(score);
    }
  }, [score, highScore, onGameOver]);
  
  // Add obstacle callback
  const handleAddObstacle = useCallback((obstacle: Obstacle) => {
    setObstacles(prev => [...prev, obstacle]);
  }, []);
  
  // Remove obstacle callback
  const handleRemoveObstacle = useCallback((id: string) => {
    setObstacles(prev => prev.filter(obstacle => obstacle.id !== id));
  }, []);
  
  // Update obstacles callback
  const handleUpdateObstacles = useCallback((updateFn: (obstacles: Obstacle[]) => Obstacle[]) => {
    setObstacles(updateFn);
  }, []);
  
  // Check collision between player and obstacles
  const checkCollision = useCallback((playerX: number, playerY: number) => {
    const playerHitbox = {
      left: playerX,
      right: playerX + PLAYER_WIDTH,
      top: playerY,
      bottom: playerY + PLAYER_HEIGHT,
    };
    
    for (const obstacle of obstacles) {
      const obstacleHitbox = {
        left: obstacle.x,
        right: obstacle.x + obstacle.width,
        top: obstacle.y,
        bottom: obstacle.y + obstacle.height,
      };
      
      // Check for collision
      if (
        playerHitbox.right > obstacleHitbox.left &&
        playerHitbox.left < obstacleHitbox.right &&
        playerHitbox.bottom > obstacleHitbox.top &&
        playerHitbox.top < obstacleHitbox.bottom
      ) {
        // Special handling for variable ground
        if (obstacle.type === ObstacleType.VARIABLE_GROUND) {
          // Adjust player to stand on variable ground
          playerRef.current.y = obstacleHitbox.top - PLAYER_HEIGHT;
          playerRef.current.velocityY = 0;
          playerRef.current.isJumping = false;
          return false; // Not a collision
        }
        
        // Special handling for collapsing bridge
        if (obstacle.type === ObstacleType.COLLAPSING_BRIDGE && obstacle.integrity && obstacle.integrity > 0) {
          // Player is on the bridge but it hasn't collapsed yet
          if (playerHitbox.bottom <= obstacleHitbox.top + 5) {
            playerRef.current.y = obstacleHitbox.top - PLAYER_HEIGHT;
            playerRef.current.velocityY = 0;
            playerRef.current.isJumping = false;
            
            // Decrease bridge integrity when player is on it
            setObstacles(prev => prev.map(o => {
              if (o.id === obstacle.id && o.integrity) {
                return { ...o, integrity: o.integrity - 1 };
              }
              return o;
            }));
            
            return false;
          }
        }
        
        // Collision with hazard
        return true;
      }
    }
    
    return false;
  }, [obstacles]);
  
  // Reset game state
  const resetGame = useCallback(() => {
    playerRef.current = {
      x: width * 0.2,
      y: height - GROUND_HEIGHT - PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      jumpPower: 0,
    };
    
    setObstacles([]);
    setScore(0);
    setGameState(GameState.PLAYING);
  }, [width, height]);
  
  // Start game
  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;
    
    const deltaTime = timestamp - (lastTimeRef.current || timestamp);
    lastTimeRef.current = timestamp;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, width, height);
    
    // Draw ground
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Draw player
    ctx.fillStyle = '#FF0000'; // Red
    ctx.fillRect(
      playerRef.current.x, 
      playerRef.current.y, 
      PLAYER_WIDTH, 
      PLAYER_HEIGHT
    );
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case ObstacleType.SPIKE:
          ctx.fillStyle = '#FF5733'; // Orange-red
          ctx.beginPath();
          ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          ctx.fill();
          break;
          
        case ObstacleType.MOVING_SPIKE:
          ctx.fillStyle = '#C70039'; // Darker red
          ctx.beginPath();
          ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
          ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          ctx.fill();
          break;
          
        case ObstacleType.COLLAPSING_BRIDGE:
          // Color based on integrity
          const integrity = obstacle.integrity || 0;
          const alpha = Math.max(0.2, integrity / 100);
          ctx.fillStyle = `rgba(150, 75, 0, ${alpha})`; // Brown with alpha
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
          
        case ObstacleType.VARIABLE_GROUND:
          ctx.fillStyle = '#556B2F'; // Dark olive green
          const elevation = obstacle.elevation || 0;
          ctx.fillRect(
            obstacle.x, 
            obstacle.y - elevation, 
            obstacle.width, 
            obstacle.height + elevation
          );
          break;
      }
    });
    
    // Draw score
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Process player physics
    if (gameState === GameState.PLAYING) {
      // Check for jump input via microphone
      if (audioInitialized) {
        if (!playerRef.current.isJumping && shouldJump()) {
          playerRef.current.isJumping = true;
          playerRef.current.jumpPower = getJumpPower();
          playerRef.current.velocityY = MAX_JUMP_VELOCITY * playerRef.current.jumpPower;
        }
      }
      
      // Apply gravity
      playerRef.current.velocityY += GRAVITY;
      playerRef.current.y += playerRef.current.velocityY;
      
      // Ground collision
      if (playerRef.current.y > height - GROUND_HEIGHT - PLAYER_HEIGHT) {
        playerRef.current.y = height - GROUND_HEIGHT - PLAYER_HEIGHT;
        playerRef.current.velocityY = 0;
        playerRef.current.isJumping = false;
      }
      
      // Check obstacle collision
      if (checkCollision(playerRef.current.x, playerRef.current.y)) {
        handleGameOver();
      }
      
      // Update score
      setScore(prev => prev + 1);
      if (onScoreChange) {
        onScoreChange(score + 1);
      }
    }
    
    // Display game over or menu text
    if (gameState === GameState.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 40);
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, width / 2, height / 2);
      ctx.fillText(`High Score: ${highScore}`, width / 2, height / 2 + 30);
      ctx.fillText('Click or press Space to play again', width / 2, height / 2 + 70);
    } else if (gameState === GameState.MENU) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Microphone Flappy Bird', width / 2, height / 2 - 40);
      ctx.font = '20px Arial';
      ctx.fillText('Make noise to jump. Louder noise = Higher jump', width / 2, height / 2);
      ctx.fillText('Click or press Space to start', width / 2, height / 2 + 40);
    }
    
    // Continue animation loop
    if (gameState !== GameState.PAUSED) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [width, height, gameState, obstacles, score, highScore, audioInitialized, checkCollision, handleGameOver, onScoreChange]);
  
  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  // Keyboard and click event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
          startGame();
        }
      }
    };
    
    const handleClick = () => {
      if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
        startGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, startGame]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-400 rounded"
        role="presentation"
      />
      
      {gameState === GameState.PLAYING && (
        <ObstacleManager
          gameWidth={width}
          gameHeight={height}
          playerScore={score}
          groundHeight={GROUND_HEIGHT}
          onAddObstacle={handleAddObstacle}
          onRemoveObstacle={handleRemoveObstacle}
          onUpdateObstacles={handleUpdateObstacles}
        />
      )}
    </div>
  );
};

export default GameEngine; 