/**
 * Generates metadata for the page, including Farcaster Frame metadata
 * @param {string|null} imageParam - Optional image filename from query parameter
 * @param {string|null} overlayId - Optional overlay ID from query parameter
 * @returns {Object} Page metadata including frame information
 */
export async function generateMetadata(imageParam, overlayId) {
  // Base URL for the CDN/image storage
  const cdnBaseUrl = 'https://images.kasra.codes';
  
  // Default image if no parameter is provided
  const defaultImageUrl = `${cdnBaseUrl}/touch-grass/rectangle.png`;
  
  // If an image parameter is provided, use it directly
  // The imageParam could be a full path like "touch-grass/977233-1616161616.png"
  const imageUrl = imageParam 
    ? `${cdnBaseUrl}/touch-grass/${imageParam}` 
    : defaultImageUrl;
  
  console.log('Frame image URL:', imageUrl);
  
  // Default button name
  let buttonName = "Touch Grass";
  
  // If overlayId is provided, get the overlay name from the database
  if (overlayId) {
    try {
      // Dynamically import the db module to prevent server component issues
      const { getOverlayById } = await import('./db');
      const overlay = await getOverlayById(overlayId);
      
      if (overlay && overlay.name) {
        buttonName = overlay.name;
      }
    } catch (error) {
      console.error('Error fetching overlay by ID:', error);
      // If there's an error, we'll fall back to the default name
    }
  }
  
  // Generate the frame metadata - following exact structure from FRAME_INTEGRATION.md
  const frameMetadata = {
    version: "next",
    imageUrl: imageUrl,
    button: {
      title: buttonName,
      action: {
        type: "launch_frame",
        name: buttonName,
        url: process.env.NEXT_PUBLIC_BASE_URL,
        splashImageUrl: `${cdnBaseUrl}/touch-grass/square.png`,
        splashBackgroundColor: "#000000"
      }
    }
  };
  
  // Return the complete metadata object
  return {
    title: "Touch Grass",
    description: "Create and share your Touch Grass moment",
    other: {
      'fc:frame': JSON.stringify(frameMetadata)
    }
  };
} 