/**
 * Face detection and expression recognition utilities
 * Note: This uses the face-api.js library which needs to be installed:
 * npm install face-api.js
 */

import * as faceapi from 'face-api.js';

// Face recognition states
interface FaceManager {
  isInitialized: boolean;
  videoElement: HTMLVideoElement | null;
  stream: MediaStream | null;
  detectionInterval: number | null;
  onSmileDetected: (() => void) | null;
  onBlinkDetected: (() => void) | null;
  lastSmileTime: number;
  lastBlinkTime: number;
  minExpressionInterval: number; // Minimum ms between expression triggers
}

// Face manager singleton
export const faceManager: FaceManager = {
  isInitialized: false,
  videoElement: null,
  stream: null,
  detectionInterval: null,
  onSmileDetected: null,
  onBlinkDetected: null,
  lastSmileTime: 0,
  lastBlinkTime: 0,
  minExpressionInterval: 1000, // 1 second between triggers to prevent rapid firing
};

/**
 * Load face recognition models
 */
const loadModels = async () => {
  try {
    // Load models from the public directory
    const MODEL_URL = '/models';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    return false;
  }
};

/**
 * Initialize face detection
 * @param videoElement The video element to use for face detection
 * @param onSmileDetected Callback when smile is detected
 * @param onBlinkDetected Callback when blink is detected
 */
export const initFaceDetection = async (
  videoElement: HTMLVideoElement,
  onSmileDetected?: () => void,
  onBlinkDetected?: () => void
): Promise<boolean> => {
  try {
    // If already initialized, clean up first
    if (faceManager.isInitialized) {
      cleanupFaceDetection();
    }
    
    // Load models if not already loaded
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
      return false;
    }
    
    // Get camera stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // Front camera
        width: { ideal: 320 },
        height: { ideal: 240 }
      }
    });
    
    // Set up video element
    videoElement.srcObject = stream;
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
    
    // Set callback functions
    faceManager.onSmileDetected = onSmileDetected || null;
    faceManager.onBlinkDetected = onBlinkDetected || null;
    
    // Store references
    faceManager.videoElement = videoElement;
    faceManager.stream = stream;
    faceManager.isInitialized = true;
    
    // Start detection loop
    startDetectionLoop();
    
    return true;
  } catch (error) {
    console.error('Error initializing face detection:', error);
    return false;
  }
};

/**
 * Start the face detection loop
 */
const startDetectionLoop = () => {
  // Clear any existing interval
  if (faceManager.detectionInterval !== null) {
    clearInterval(faceManager.detectionInterval);
  }
  
  // Set up detection interval (every 100ms)
  faceManager.detectionInterval = window.setInterval(async () => {
    if (!faceManager.videoElement || !faceManager.isInitialized) {
      return;
    }
    
    try {
      // Detect faces
      const detections = await faceapi.detectAllFaces(
        faceManager.videoElement,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions();
      
      // Process detected faces
      if (detections.length > 0) {
        const detection = detections[0]; // Use first face detected
        
        // Check for smile
        if (faceManager.onSmileDetected && 
            detection.expressions.happy > 0.7 && 
            Date.now() - faceManager.lastSmileTime > faceManager.minExpressionInterval) {
          
          faceManager.lastSmileTime = Date.now();
          faceManager.onSmileDetected();
        }
        
        // Check for blink by analyzing eye landmarks
        if (faceManager.onBlinkDetected && detection.landmarks) {
          const landmarks = detection.landmarks.positions;
          
          // Eye landmarks
          const leftEyeTop = landmarks[37].y;
          const leftEyeBottom = landmarks[41].y;
          const rightEyeTop = landmarks[43].y;
          const rightEyeBottom = landmarks[47].y;
          
          // Calculate eye openness
          const leftEyeOpenness = leftEyeBottom - leftEyeTop;
          const rightEyeOpenness = rightEyeBottom - rightEyeTop;
          
          // If eyes are almost closed, trigger blink
          if (leftEyeOpenness < 2 && rightEyeOpenness < 2 && 
              Date.now() - faceManager.lastBlinkTime > faceManager.minExpressionInterval) {
            
            faceManager.lastBlinkTime = Date.now();
            faceManager.onBlinkDetected();
          }
        }
      }
    } catch (error) {
      console.warn('Face detection error:', error);
    }
  }, 100);
};

/**
 * Clean up face detection resources
 */
export const cleanupFaceDetection = () => {
  // Stop detection interval
  if (faceManager.detectionInterval !== null) {
    clearInterval(faceManager.detectionInterval);
    faceManager.detectionInterval = null;
  }
  
  // Stop camera stream
  if (faceManager.stream) {
    faceManager.stream.getTracks().forEach(track => track.stop());
    faceManager.stream = null;
  }
  
  // Reset video element
  if (faceManager.videoElement) {
    faceManager.videoElement.srcObject = null;
    faceManager.videoElement = null;
  }
  
  // Reset callback functions
  faceManager.onSmileDetected = null;
  faceManager.onBlinkDetected = null;
  
  // Reset state
  faceManager.isInitialized = false;
}; 