-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE IF NOT EXISTS "posts" (
    "uid" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "created_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" TIMESTAMP NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "category_id" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tags" (
    "uid" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "likes" (
    "uid" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "categories" (
    "uid" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "post_views" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Many-to-Many relationship for posts and tags)
CREATE TABLE IF NOT EXISTS "post_tags" (
    "post_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY ("post_id", "tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "likes_user_id_post_id_key" ON "likes"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "post_views_post_id_user_id_idx" ON "post_views"("post_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "post_views_post_id_ip_user_agent_idx" ON "post_views"("post_id", "ip", "user_agent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_post_tags_post_id" ON "post_tags"("post_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_post_tags_tag_id" ON "post_tags"("tag_id");

-- CreateIndex (Additional performance indexes)
CREATE INDEX IF NOT EXISTS "posts_category_id_idx" ON "posts"("category_id");
CREATE INDEX IF NOT EXISTS "posts_created_time_idx" ON "posts"("created_time");
CREATE INDEX IF NOT EXISTS "posts_type_idx" ON "posts"("type");
CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_likes_post_id" ON "likes"("post_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("uid") ON DELETE CASCADE ON UPDATE CASCADE;