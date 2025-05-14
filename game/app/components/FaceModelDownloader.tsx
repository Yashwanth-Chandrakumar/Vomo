/**
 * FaceModelDownloader - Component to help users download face-api.js models
 */

import React, { useState } from 'react';
import { FaDownload, FaCheck, FaFrown } from 'react-icons/fa';

// Required models for face detection
const requiredModels = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

// Source URL for models
const modelSourceUrl = 'https://github.com/justadudewhohacks/face-api.js/tree/master/weights';

interface FaceModelDownloaderProps {
  onComplete: () => void;
}

const FaceModelDownloader: React.FC<FaceModelDownloaderProps> = ({ onComplete }) => {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if models are already available
  const checkModelsExist = async () => {
    try {
      // Try to fetch one of the model files to see if they're already available
      const testResponse = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
      if (testResponse.ok) {
        setDownloadStatus('complete');
        onComplete();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Create models directory and download models
  const downloadModels = async () => {
    setDownloadStatus('downloading');
    setErrorMessage(null);

    try {
      // Check if models already exist
      const modelsExist = await checkModelsExist();
      if (modelsExist) return;

      // In a real app, this would involve downloading the models
      // For now, we'll just inform the user to download them manually
      
      // Simulating a download process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Cannot download models this way due to security restrictions
      // Inform user instead
      setDownloadStatus('error');
      setErrorMessage(
        'Due to browser security restrictions, models cannot be downloaded automatically. ' +
        'Please download the models manually and place them in the public/models directory.'
      );
    } catch (error) {
      setDownloadStatus('error');
      setErrorMessage('Failed to download models. Please try again or download manually.');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">Face Detection Models</h2>
      
      {downloadStatus === 'idle' && (
        <div>
          <p className="mb-4">
            To use face detection features, you need to download the required models.
          </p>
          <button
            onClick={downloadModels}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaDownload /> Download Models
          </button>
        </div>
      )}
      
      {downloadStatus === 'downloading' && (
        <div>
          <p className="mb-4">Downloading models...</p>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div className="w-1/2 h-full bg-blue-500 rounded animate-pulse"></div>
          </div>
        </div>
      )}
      
      {downloadStatus === 'complete' && (
        <div>
          <p className="flex items-center gap-2 text-green-600 mb-4">
            <FaCheck /> Models downloaded successfully!
          </p>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Continue
          </button>
        </div>
      )}
      
      {downloadStatus === 'error' && (
        <div>
          <p className="flex items-center gap-2 text-red-600 mb-2">
            <FaFrown /> {errorMessage}
          </p>
          <div className="mt-4 bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Manual Download Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Download the following files from <a href={modelSourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>:</li>
              <ul className="list-disc pl-5 space-y-1 my-2">
                {requiredModels.map(model => (
                  <li key={model}>{model}</li>
                ))}
              </ul>
              <li>Create a folder named 'models' in the 'public' directory of this project</li>
              <li>Place the downloaded files in the 'public/models' folder</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={downloadModels}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={checkModelsExist}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Check Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceModelDownloader; 