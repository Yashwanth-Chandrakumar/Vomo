/**
 * Test API route for checking if the API is working
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple response to confirm API is working
  return NextResponse.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
} 