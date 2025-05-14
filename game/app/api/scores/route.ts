/**
 * API routes for score persistence
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for scores (would be replaced with a database in production)
let scores: { 
  id: string; 
  playerName: string; 
  score: number; 
  date: string;
}[] = [];

// Get top scores
export async function GET(req: NextRequest) {
  // Extract limit from search params (default to 10)
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  // Sort scores by score (descending) and take top N
  const topScores = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return NextResponse.json(topScores);
}

// Save a new score
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.playerName || typeof body.score !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request. Required fields: playerName (string) and score (number)' },
        { status: 400 }
      );
    }
    
    // Create new score entry
    const newScore = {
      id: crypto.randomUUID(),
      playerName: body.playerName,
      score: body.score,
      date: new Date().toISOString(),
    };
    
    // Add to scores array
    scores.push(newScore);
    
    // Return the created score
    return NextResponse.json(newScore, { status: 201 });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    );
  }
}

// Delete all scores (for testing/admin purposes)
export async function DELETE(req: NextRequest) {
  // In a real app, you would check for admin privileges here
  scores = [];
  return NextResponse.json({ message: 'All scores deleted' });
} 