# Microphone Flappy Bird

A browser-based "Flappy Bird"-style game controlled by the user's microphone input. Make noise to make the bird jump, with louder noises causing higher jumps!

## Features

- **Microphone Controls**: Use your voice or any sound to control the bird's jump height
- **Progressive Hazards**: Navigate through various obstacles like spikes, moving spikes, collapsing bridges, and variable ground
- **Optional Face Detection**: Use facial expressions (smile, blink) for special abilities
- **Score Tracking**: High scores are saved locally, with API endpoints for online score persistence
- **Responsive Design**: Adjustable game size that works on different screen sizes

## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API
- **Face Detection**: face-api.js (optional feature)
- **Testing**: Jest with React Testing Library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd game
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to http://localhost:3000

### Accessing Your Microphone

The game requires microphone access to work. When prompted by your browser, please allow microphone access. If you deny access, you can still play the game using keyboard controls (spacebar).

### Face Detection Setup (Optional)

To enable face detection for additional controls:

1. Download face-api.js models from [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) 
2. Create a `public/models` directory and place the downloaded model files there
3. Enable face detection in the game settings

## How to Play

1. Make noise into your microphone to make the bird jump
2. Louder noises make the bird jump higher
3. Avoid obstacles and survive as long as possible
4. Your score increases the longer you survive
5. Press Space or Click to start/restart the game

## Testing

Run the test suite:

```
npm test
# or
yarn test
```

## API Endpoints

The game includes simple API endpoints for score persistence:

- `GET /api/scores` - Get top scores (queryParam: `limit`)
- `POST /api/scores` - Save a new score (body: `{ playerName: string, score: number }`)
- `DELETE /api/scores` - Delete all scores (admin only)

## Project Structure

- `/app` - Main application code
  - `/components` - React components
    - `Game.tsx` - Main game component
    - `GameEngine.tsx` - Game loop, physics, and rendering
    - `ObstacleManager.tsx` - Obstacle generation and management
  - `/utils` - Utility functions
    - `audioUtils.ts` - Microphone access and audio processing
    - `faceUtils.ts` - Face detection and expression recognition
  - `/api` - API routes for score persistence
  - `page.js` - Main page component

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original Flappy Bird game
- Built with Next.js and Tailwind CSS
- Face detection powered by face-api.js
