/**
 * ScoreBoard - Component to display high scores
 */

import React, { useState, useEffect } from 'react';
import { FaMedal, FaTrophy, FaUserAlt } from 'react-icons/fa';

interface Score {
  id: string;
  playerName: string;
  score: number;
  date: string;
}

interface ScoreBoardProps {
  localHighScore: number;
  onClose?: () => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ localHighScore, onClose }) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Fetch scores from the API
  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/scores?limit=10');
        
        if (!response.ok) {
          throw new Error('Failed to fetch scores');
        }
        
        const data = await response.json();
        setScores(data);
        setError(null);
      } catch (err) {
        setError('Failed to load scores. Please try again later.');
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, [submitSuccess]);

  // Submit score to the API
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score: localHighScore,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit score');
      }
      
      setSubmitSuccess(true);
      setPlayerName('');
      setError(null);
    } catch (err) {
      setError('Failed to submit score. Please try again.');
      console.error('Error submitting score:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-sky-700 flex items-center gap-2">
          <FaTrophy className="text-amber-500" /> High Scores
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        )}
      </div>
      
      {/* Local high score */}
      <div className="bg-amber-50 p-3 rounded-lg mb-4">
        <h3 className="font-bold text-amber-800 mb-1">Your High Score</h3>
        <div className="text-2xl text-amber-700">{localHighScore}</div>
      </div>
      
      {/* Submit score form */}
      {!submitSuccess && (
        <form onSubmit={handleSubmitScore} className="mb-6">
          <h3 className="font-bold mb-2">Submit Your Score</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
              maxLength={20}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </form>
      )}
      
      {submitSuccess && (
        <div className="bg-green-50 p-3 rounded-lg mb-4 text-green-700">
          Score submitted successfully!
        </div>
      )}
      
      {/* Score list */}
      <div>
        <h3 className="font-bold mb-2">Global Top Scores</h3>
        
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading scores...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No scores yet. Be the first!</div>
        ) : (
          <div className="space-y-1">
            {scores.map((score, index) => (
              <div 
                key={score.id}
                className={`flex items-center p-2 rounded ${index < 3 ? 'bg-amber-50' : 'bg-gray-50'}`}
              >
                <div className="w-8 text-center">
                  {index === 0 ? (
                    <FaMedal className="text-amber-500 text-xl mx-auto" />
                  ) : index === 1 ? (
                    <FaMedal className="text-gray-400 text-xl mx-auto" />
                  ) : index === 2 ? (
                    <FaMedal className="text-amber-700 text-xl mx-auto" />
                  ) : (
                    <span className="text-gray-500 font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 ml-2">
                  <div className="flex items-center">
                    <FaUserAlt className="text-gray-400 mr-1" />
                    <span className="font-medium">{score.playerName}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(score.date)}</div>
                </div>
                <div className="text-xl font-bold text-sky-700">{score.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBoard; 