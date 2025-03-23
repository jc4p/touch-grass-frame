import * as frame from '@farcaster/frame-sdk'

export async function initializeFrame() {
  const user = await frame.sdk.context.user

  // Handle potential API structure issue mentioned in FRAME_INTEGRATION.md
  let userInfo = user;
  if (user && user.user) {
    userInfo = user.user;
  }

  if (!userInfo || !userInfo.fid) {
    // most likely not in a frame
    console.log('Not in a frame or no FID available');
    return;
  }

  window.userFid = userInfo.fid;
  console.log('User FID set:', window.userFid);
  
  // Don't call ready() here, we'll call it after overlay is loaded
  window.frameReady = async () => {
    try {
      await frame.sdk.actions.ready();
      console.log('Frame ready called');
    } catch (error) {
      console.error('Error calling frame ready:', error);
    }
  };
} 