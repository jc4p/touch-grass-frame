import { NextResponse } from 'next/server';
import { uploadImageToR2 } from '@/lib/r2';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Set appropriate response caching (prevents caching of API responses)
export const fetchCache = 'force-no-store';

// Set a maximum duration for this route (30 seconds)
export const maxDuration = 30; // in seconds

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

export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const image = formData.get('image');
    const userFid = formData.get('userFid') || '977233'; // Get userFid from form data or use default
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' }, 
        { status: 400 }
      );
    }
    
    // Convert the File object to a buffer
    const buffer = Buffer.from(await image.arrayBuffer());
    
    // Upload to R2 with the userFid
    const imageUrl = await uploadImageToR2(buffer, userFid);
    
    // Return the URL of the uploaded image with CORS headers
    const response = NextResponse.json({ 
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl 
    });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorResponse = NextResponse.json(
      { error: error.message || 'Something went wrong' }, 
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
} 