import * as frame from '@farcaster/frame-sdk'

export async function initializeFrame() {
  try {
    const user = await frame.sdk.context.user;

    // Handle potential nested user object
    const userInfo = user.user ? user.user : user;

    if (!userInfo || !userInfo.fid) {
      // most likely not in a frame
      console.log("Not in a frame context");
      return;
    }

    // Set user FID in window for global access
    window.userFid = userInfo.fid;
    
    // Call the ready function to remove splash screen when in a frame
    await frame.sdk.actions.ready();
    
    console.log("Frame initialized with FID:", userInfo.fid);
    
    // Set up permissions for iframe integration
    if (document.domain) {
      // Enable document domain for cross-origin iframe communication if needed
      try {
        // Only modify if we're in a cross-origin context
        if (window.parent !== window) {
          console.log("Setting up for iframe context");
        }
      } catch (e) {
        console.error("Error setting up iframe permissions:", e);
      }
    }
  } catch (error) {
    console.error("Error initializing frame:", error);
  }
}