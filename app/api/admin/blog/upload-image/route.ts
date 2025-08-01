import { NextRequest } from 'next/server';
import { handler } from '@/lib/request';
import { setMessage, setRequest } from '@/lib/response';
import { APIResult, AuthInfo } from '@/types/api';
import * as BlogDB from '@/lib/db/blog';
import { uploadImageToR2 } from '@/lib/services/cloudflare/r2';

/* ------------------------------------------------------------------
 * POST /api/admin/blog/upload-image
 * Upload image to Cloudflare R2
 * ---------------------------------------------------------------- */
const uploadImage = async (request: NextRequest, _context: AuthInfo): Promise<APIResult> => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;

    console.log('Upload request:', { 
      hasFile: !!file, 
      hasPostId: !!postId, 
      fileType: file?.type,
      fileSize: file?.size 
    });

    if (!file || !postId) {
      return setMessage('InvalidField', 'File and postId required', 400);
    }

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return setMessage('InvalidField', 'Invalid file type', 400);
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return setMessage('InvalidField', 'File too large (max 10MB)', 400);
    }

    // Get post to verify it exists
    const post = await BlogDB.getPostById(postId);
    if (!post) {
      return setMessage('NotFound', 'Post not found', 404);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}.${extension}`;
    const imagePath = `post/${post.uid}/images/${filename}`;

    let imageUrl: string;
    
    // Check if R2 is configured
    const hasR2Config = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
    
    if (hasR2Config) {
      // Convert file to buffer for R2 upload
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudflare R2
      const uploadResponse = await uploadImageToR2(buffer, imagePath, file.type);
      
      if (!uploadResponse.success) {
        return setMessage('NetworkError', 'Failed to upload image to R2', 500);
      }
      
      imageUrl = uploadResponse.url;
    } else {
      // Fallback for development - return a placeholder URL
      console.warn('R2 not configured, using placeholder URL');
      imageUrl = `https://cdn.elice.pro/${imagePath}`;
    }

    const result = {
      image: {
        id: `img-${timestamp}`,
        url: imageUrl,
        filename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        r2Uploaded: hasR2Config
      }
    };

    return setRequest(result);

  } catch (error) {
    console.error('Image upload error:', error);
    return setMessage('NetworkError', 'Image upload failed', 500);
  }
};

/* ------------------------------------------------------------------
 * Export handlers
 * ---------------------------------------------------------------- */
export const POST = handler(uploadImage, {
  auth: true,
  roles: ['admin']
});