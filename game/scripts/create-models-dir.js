/**
 * Script to create the required directory structure for face-api.js models
 */

const fs = require('fs');
const path = require('path');

// Define paths
const modelsDir = path.join(__dirname, '..', 'public', 'models');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicDir);
}

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  console.log('Creating models directory...');
  fs.mkdirSync(modelsDir);
  
  // Create a README.md file with instructions
  const readmePath = path.join(modelsDir, 'README.md');
  
  const readmeContent = `# Face-API.js Models

This directory is for face-api.js model files used for face detection and expression recognition.

## Required Models

Please download the following files from the face-api.js repository:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_expression_model-weights_manifest.json
- face_expression_model-shard1

## Download Instructions

1. Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download each of the required files
3. Place them in this directory (public/models)
4. Restart the application

No further configuration is needed once the files are in place.
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log('Created README.md with instructions');
  
  console.log('Models directory created at:', modelsDir);
  console.log('Please follow the instructions in the README.md file to download the required model files.');
} else {
  console.log('Models directory already exists at:', modelsDir);
}

console.log('Setup complete!'); 