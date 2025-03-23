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
} 