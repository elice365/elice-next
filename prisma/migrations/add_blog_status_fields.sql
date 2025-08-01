-- Add status and publishedAt fields to posts table
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP;

-- Add createdAt field to likes table
ALTER TABLE "likes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_posts_status" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "idx_posts_published_at" ON "posts"("published_at");
CREATE INDEX IF NOT EXISTS "idx_likes_created_at" ON "likes"("created_at");