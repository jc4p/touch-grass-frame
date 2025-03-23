import { NextResponse } from 'next/server';
import { incrementUsageCount, getOverlayById } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Overlay ID is required' 
        }, 
        { status: 400 }
      );
    }

    // Verify the overlay exists
    const overlay = await getOverlayById(id);
    if (!overlay) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Overlay not found' 
        }, 
        { status: 404 }
      );
    }
    
    // Increment the usage count
    await incrementUsageCount(id);
    
    return NextResponse.json({
      success: true,
      message: 'Usage count incremented successfully'
    });
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to increment usage count' 
      }, 
      { status: 500 }
    );
  }
}