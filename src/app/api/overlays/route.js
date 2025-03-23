import { NextResponse } from 'next/server';
import { getApprovedOverlays } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const overlays = await getApprovedOverlays(true);
    
    return NextResponse.json({
      success: true,
      overlays
    });
  } catch (error) {
    console.error('Error fetching overlays:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch overlays' 
      }, 
      { status: 500 }
    );
  }
}