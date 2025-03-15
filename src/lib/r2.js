import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure the S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads an image to Cloudflare R2
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {string} userFid - The user's FID for creating a unique filename
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadImageToR2(imageBuffer, userFid) {
  // Create a filename using the userFid and timestamp in linux seconds
  const timestamp = Math.floor(Date.now() / 1000); // Convert to seconds
  const objectKey = `touch-grass/${userFid}-${timestamp}.png`;
  
  // Upload to Cloudflare R2
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      Body: Buffer.from(imageBuffer),
      ContentType: 'image/png',
      ACL: 'public-read',
    })
  );
  
  // Construct the public URL for the uploaded image
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${objectKey}`;
  
  return publicUrl;
} 