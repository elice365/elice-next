import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 client configuration
const getR2Client = () => {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

// Upload file to R2
export const uploadToR2 = async (
  file: Buffer | Uint8Array | string,
  key: string,
  contentType: string = 'application/octet-stream'
) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    const response = await client.send(command);
    return {
      success: true,
      url: `https://cdn.elice.pro/${key}`,
      etag: response.ETag
    };
  } catch (error) {
    console.error('Failed to upload to R2:', error);
    throw error;
  }
};

// Delete file from R2
export const deleteFromR2 = async (key: string) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    throw error;
  }
};

// List files in R2
export const listR2Files = async (prefix: string, maxKeys: number = 1000) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  try {
    const response = await client.send(command);
    return {
      success: true,
      files: response.Contents || [],
      truncated: response.IsTruncated,
      keyCount: response.KeyCount
    };
  } catch (error) {
    console.error('Failed to list R2 files:', error);
    throw error;
  }
};

// Get file from R2
export const getFromR2 = async (key: string) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);
    const bodyString = await response.Body?.transformToString();
    return {
      success: true,
      body: bodyString,
      contentType: response.ContentType,
      lastModified: response.LastModified
    };
  } catch (error) {
    console.error('Failed to get from R2:', error);
    throw error;
  }
};

// Upload JSON content to R2
export const uploadJsonToR2 = async (content: any, key: string) => {
  const jsonString = JSON.stringify(content, null, 2);
  return uploadToR2(jsonString, key, 'application/json');
};

// Upload image to R2
export const uploadImageToR2 = async (
  file: Buffer,
  key: string,
  contentType: string
) => {
  return uploadToR2(file, key, contentType);
};

// Helper to generate CDN URL
export const getCDNUrl = (key: string) => {
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_URL;
  return `${cdnDomain}/${key}`;
};