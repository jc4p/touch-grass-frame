import { NextResponse } from 'next/server';
import { createOverlay } from '@/lib/db';
import { uploadImageToR2 } from '@/lib/r2';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 30; // in seconds

export async function POST(request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Get the form values
    const name = formData.get('name');
    const shareText = formData.get('shareText');
    const darkModeImage = formData.get('darkModeImage');
    const lightModeImage = formData.get('lightModeImage');
    const userFid = formData.get('userFid') || '977233'; // Default if not provided
    
    // Validate required fields
    if (!name || !shareText || !darkModeImage) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Name, share text, and dark mode image are required' 
        }, 
        { status: 400 }
      );
    }
    
    // Generate unique timestamps for the images
    const darkModeTimestamp = Math.floor(Date.now() / 1000);
    const lightModeTimestamp = darkModeTimestamp + 1;
    
    // Convert the File objects to buffers
    const darkModeBuffer = Buffer.from(await darkModeImage.arrayBuffer());
    
    // Upload dark mode image to R2
    const darkModeImagePath = `overlay-${userFid}-${darkModeTimestamp}.png`;
    const darkModeImageUrl = await uploadImageToR2(darkModeBuffer, userFid, darkModeImagePath);
    
    // Upload light mode image to R2 if provided
    let lightModeImageUrl = null;
    if (lightModeImage) {
      const lightModeBuffer = Buffer.from(await lightModeImage.arrayBuffer());
      const lightModeImagePath = `overlay-${userFid}-${lightModeTimestamp}.png`;
      lightModeImageUrl = await uploadImageToR2(lightModeBuffer, userFid, lightModeImagePath);
    }
    
    // Create the overlay in the database
    const overlay = await createOverlay({
      name: name.toUpperCase(), // Store name in uppercase
      share_text: shareText,
      dark_mode_image_url: darkModeImageUrl,
      light_mode_image_url: lightModeImageUrl,
      created_by: userFid
    });
    
    return NextResponse.json({
      success: true,
      message: 'Overlay created successfully',
      overlay
    });
  } catch (error) {
    console.error('Error creating overlay:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create overlay' 
      }, 
      { status: 500 }
    );
  }
}