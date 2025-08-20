-- Migration script to move existing post data to post_translations table
-- This should be run after the PostTranslation table is created

-- Insert existing Korean data into post_translations table
INSERT INTO post_translations (uid, post_id, locale, title, description, created_time, updated_time)
SELECT 
  gen_random_uuid() as uid,
  uid as post_id,
  'ko' as locale,
  title,
  description,
  created_time,
  updated_time
FROM posts
WHERE NOT EXISTS (
  SELECT 1 FROM post_translations 
  WHERE post_translations.post_id = posts.uid 
  AND post_translations.locale = 'ko'
);

-- Optionally, create placeholder entries for other languages
-- This helps with admin interface display
INSERT INTO post_translations (uid, post_id, locale, title, description, created_time, updated_time)
SELECT 
  gen_random_uuid() as uid,
  posts.uid as post_id,
  lang.locale,
  posts.title || ' (' || lang.locale || ')' as title,
  posts.description || ' - Translation needed' as description,
  NOW() as created_time,
  NOW() as updated_time
FROM posts
CROSS JOIN (VALUES ('en'), ('ja'), ('ru')) AS lang(locale)
WHERE NOT EXISTS (
  SELECT 1 FROM post_translations 
  WHERE post_translations.post_id = posts.uid 
  AND post_translations.locale = lang.locale
);