/**
 * Game - Main game component that manages game state and renders the game engine
 */

import React, { useState, useEffect, useRef } from 'react';
import GameEngine from './GameEngine';
import FaceModelDownloader from './FaceModelDownloader';
import ScoreBoard from './ScoreBoard';
import { FaMedal, FaMicrophone, FaCamera, FaCog, FaSmile, FaTrophy } from 'react-icons/fa';
import { initFaceDetection, cleanupFaceDetection } from '../utils/faceUtils';

interface GameProps {
  enableFaceControls?: boolean;
}

const Game: React.FC<GameProps> = ({ enableFaceControls = false }) => {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScoreBoard, setShowScoreBoard] = useState<boolean>(false);
  const [gameWidth, setGameWidth] = useState<number>(800);
  const [gameHeight, setGameHeight] = useState<number>(600);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [faceControlsEnabled, setFaceControlsEnabled] = useState<boolean>(enableFaceControls);
  const [showFaceModelDownloader, setShowFaceModelDownloader] = useState<boolean>(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState<boolean>(false);
  const [lastSmileTime, setLastSmileTime] = useState<number>(0);
  const [isSmiling, setIsSmiling] = useState<boolean>(false);

  // Video element for face detection
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappyBirdHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    // Adjust game size for responsive design
    const handleResize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 1000);
      const maxHeight = Math.min(window.innerHeight - 200, 800);
      
      setGameWidth(maxWidth);
      setGameHeight(maxHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle score change
  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  // Handle game over
  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('flappyBirdHighScore', finalScore.toString());
    }
  };

  // Check microphone permission
  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      setMicPermission(true);
    } catch (err) {
      setMicPermission(false);
    }
  };

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop all tracks to release the camera
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
    } catch (err) {
      setCameraPermission(false);
    }
  };

  // Request permissions on mount
  useEffect(() => {
    checkMicPermission();
    if (faceControlsEnabled) {
      checkCameraPermission();
    }
  }, [faceControlsEnabled]);

  // Request microphone permission
  const requestMicPermission = async () => {
    await checkMicPermission();
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    await checkCameraPermission();
    
    if (faceControlsEnabled && !faceModelsLoaded) {
      setShowFaceModelDownloader(true);
    }
  };

  // Handle smile detection
  const handleSmileDetected = () => {
    // Throttle smile detection
    if (Date.now() - lastSmileTime > 1000) {
      setLastSmileTime(Date.now());
      setIsSmiling(true);
      
      // Reset smile state after a short delay
      setTimeout(() => {
        setIsSmiling(false);
      }, 2000);
      
      // Any game effects when smiling could be triggered here
      console.log('Smile detected!');
    }
  };

  // Initialize face detection
  useEffect(() => {
    if (faceControlsEnabled && cameraPermission && faceModelsLoaded && videoRef.current) {
      initFaceDetection(videoRef.current, handleSmileDetected);
    }
    
    return () => {
      if (faceControlsEnabled) {
        cleanupFaceDetection();
      }
    };
  }, [faceControlsEnabled, cameraPermission, faceModelsLoaded]);

  // Toggle face controls
  const toggleFaceControls = () => {
    if (!faceControlsEnabled) {
      // Enabling face controls
      setFaceControlsEnabled(true);
      
      if (cameraPermission && !faceModelsLoaded) {
        setShowFaceModelDownloader(true);
      } else if (!cameraPermission) {
        requestCameraPermission();
      }
    } else {
      // Disabling face controls
      setFaceControlsEnabled(false);
      cleanupFaceDetection();
    }
  };

  // Handle face model download completion
  const handleFaceModelsLoaded = () => {
    setFaceModelsLoaded(true);
    setShowFaceModelDownloader(false);
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (showScoreBoard) {
      setShowScoreBoard(false);
    }
  };

  // Toggle scoreboard panel
  const toggleScoreBoard = () => {
    setShowScoreBoard(!showScoreBoard);
    if (showSettings) {
      setShowSettings(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-b from-sky-400 to-sky-200 p-5">
      <div className="flex flex-col w-full max-w-4xl gap-4">
        {/* Header */}
        <div className="flex justify-between items-center w-full p-4 bg-white/80 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-sky-700">Mic Flappy Bird</h1>
            <div className="ml-4 text-gray-600">
              {micPermission === null ? (
                <span className="flex items-center gap-1">
                  <FaMicrophone className="text-yellow-500" /> Checking...
                </span>
              ) : micPermission ? (
                <span className="flex items-center gap-1">
                  <FaMicrophone className="text-green-500" /> Microphone ready
                </span>
              ) : (
                <button 
                  onClick={requestMicPermission} 
                  className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <FaMicrophone /> Allow microphone
                </button>
              )}
            </div>
            
            {faceControlsEnabled && (
              <div className="ml-4 text-gray-600">
                {cameraPermission === null ? (
                  <span className="flex items-center gap-1">
                    <FaCamera className="text-yellow-500" /> Checking...
                  </span>
                ) : cameraPermission ? (
                  <span className="flex items-center gap-1">
                    <FaCamera className="text-green-500" /> Camera ready
                  </span>
                ) : (
                  <button 
                    onClick={requestCameraPermission} 
                    className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FaCamera /> Allow camera
                  </button>
                )}
              </div>
            )}

            {isSmiling && (
              <div className="ml-2 animate-pulse">
                <FaSmile className="text-yellow-500 text-xl" />
              </div>
            )}
          </div>
          
          <div className="flex gap-4 items-center">
            <button
              onClick={toggleScoreBoard}
              className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
            >
              <FaTrophy className="text-amber-500" />
              <span>High Score: {highScore}</span>
            </button>
            <button 
              onClick={toggleSettings}
              className="p-2 text-gray-600 rounded-full hover:bg-gray-200"
            >
              <FaCog />
            </button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-full p-4 bg-white/80 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-gray-700">Game Width</label>
                <input 
                  type="range" 
                  min="400" 
                  max="1200" 
                  value={gameWidth} 
                  onChange={(e) => setGameWidth(parseInt(e.target.value))}
                  className="w-full"
                />
                <span>{gameWidth}px</span>
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Game Height</label>
                <input 
                  type="range" 
                  min="300" 
                  max="900" 
                  value={gameHeight} 
                  onChange={(e) => setGameHeight(parseInt(e.target.value))}
                  className="w-full"
                />
                <span>{gameHeight}px</span>
              </div>
              <div className="col-span-full">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faceControlsEnabled}
                    onChange={toggleFaceControls}
                    className="form-checkbox rounded text-blue-500"
                  />
                  <span>Enable Face Controls (Experimental)</span>
                </label>
                {faceControlsEnabled && (
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, you can smile to activate special abilities
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Score Board */}
        {showScoreBoard && (
          <div className="w-full">
            <ScoreBoard 
              localHighScore={highScore} 
              onClose={() => setShowScoreBoard(false)} 
            />
          </div>
        )}
        
        {/* Face Model Downloader */}
        {showFaceModelDownloader && (
          <div className="w-full">
            <FaceModelDownloader onComplete={handleFaceModelsLoaded} />
          </div>
        )}
        
        {/* Game Container */}
        <div className="w-full flex justify-center">
          <div className="p-2 bg-white rounded-lg shadow-xl">
            <GameEngine 
              width={gameWidth} 
              height={gameHeight} 
              onScoreChange={handleScoreChange}
              onGameOver={handleGameOver}
            />
          </div>
        </div>
        
        {/* Hidden video element for face detection */}
        {faceControlsEnabled && (
          <video 
            ref={videoRef}
            className="hidden"
            width="320"
            height="240"
            muted
            playsInline
          />
        )}
        
        {/* Instructions */}
        <div className="w-full p-4 bg-white/80 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">How to Play</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Make noise into your microphone to make the bird jump</li>
            <li>Louder noises make the bird jump higher</li>
            <li>Avoid obstacles and survive as long as possible</li>
            <li>Press Space or Click to start/restart the game</li>
            {faceControlsEnabled && (
              <li>Smile to activate special abilities (experimental)</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Game; 