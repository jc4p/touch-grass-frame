import { NextResponse } from 'next/server';
import { getApprovedOverlays } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Helper function to set CORS headers for iframe compatibility
function setCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  try {
    const overlays = await getApprovedOverlays(true);
    
    const response = NextResponse.json({
      success: true,
      overlays
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching overlays:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch overlays' 
      }, 
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}