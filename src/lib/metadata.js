/**
 * Generates metadata for the page, including Farcaster Frame metadata
 * @param {string|null} imageParam - Optional image filename from query parameter
 * @returns {Object} Page metadata including frame information
 */
export function generateMetadata(imageParam) {
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
  
  // Generate the frame metadata - following exact structure from FRAME_INTEGRATION.md
  const frameMetadata = {
    version: "next",
    imageUrl: imageUrl,
    button: {
      title: "Touch Grass",
      action: {
        type: "launch_frame",
        name: "Touch Grass",
        url: process.env.NEXT_PUBLIC_BASE_URL,
        splashImageUrl: `${cdnBaseUrl}/touch-grass/splash.png`,
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