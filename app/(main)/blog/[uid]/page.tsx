import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { ImageMeta } from "@/types/image";
import { metaImage } from "@/utils/parse/metaImage";
import { PostDetail } from "@/components/features/blog/PostDetail";
import { PostDetailResponse, PostContent } from "@/types/post";

export const dynamic = 'force-dynamic';

interface BlogDetailPageProps {
  params: Promise<{
    uid: string;
  }>;
}

// Fetch post data for metadata and content
async function fetchPostData(uid: string, language: string = 'ko') {
  try {
    // Fetch post metadata from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'post',
        uid,
        language,
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.data.post) {
      return null;
    }

    return result.data as PostDetailResponse;
  } catch (error) {
    // Failed to fetch post data
    return null;
  }
}

// Fetch content from CDN
async function fetchPostContent(uid: string, language: string = 'ko'): Promise<PostContent | null> {
  try {
    const response = await fetch(`https://cdn.elice.pro/post/${uid}/${language}.json`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const content = await response.json();
    return {
      language,
      data: content,
    };
  } catch (error) {
    // Failed to fetch post content from CDN
    return null;
  }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metaData");
  const resolvedParams = await params;
  const postData = await fetchPostData(resolvedParams.uid, locale);
  
  if (!postData) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const { post } = postData;
  const ogRawImages = t.raw("openGraph.images") as ImageMeta[];
  const twitterRawImages = t.raw("twitter.images") as ImageMeta[];
  
  const baseTitle = t("title");
  const fullTitle = `${post.title} | ${baseTitle}`;
  const description = post.description || "Read this insightful blog post.";
  const postUrl = `${t("openGraph.url")}/blog/${resolvedParams.uid}`;
  
  // Use post image if available, otherwise use default
  const getPostImageUrl = (images: string[] | any): string | null => {
    // Handle new array format
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    // Handle legacy object format
    if (images && typeof images === 'object') {
      if (images.main) return images.main;
      if (images.thumbnail) return images.thumbnail;
    }
    // Handle string format
    if (typeof images === 'string') return images;
    
    return null;
  };
  
  const postImage = getPostImageUrl(post.images);
  const ogImages = postImage 
    ? [{ url: postImage, width: 1200, height: 630, alt: post.title }]
    : metaImage(ogRawImages);
  const twitterImages = postImage 
    ? [{ url: postImage, width: 1200, height: 630, alt: post.title }]
    : metaImage(twitterRawImages);

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      url: postUrl,
      type: "article",
      images: ogImages,
      publishedTime: post.createdTime.toString(),
      modifiedTime: post.updatedTime?.toString(),
      authors: ['Elice'],
      section: post.category?.name,
      tags: post.tags.map(tag => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description,
      images: twitterImages,
    },
    icons: {
      icon: t("icons.icon"),
    },
    alternates: {
      canonical: `/blog/${resolvedParams.uid}`,
    },
    other: {
      "robots": "index, follow",
      "og:site_name": baseTitle,
      "article:section": post.category?.name || "Blog",
      "article:tag": post.tags.map(tag => tag.name).join(", "),
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const locale = await getLocale();
  const blogT = await getTranslations("router");
  const resolvedParams = await params;
  
  // Fetch post data and content
  const [postData, content] = await Promise.all([
    fetchPostData(resolvedParams.uid, locale),
    fetchPostContent(resolvedParams.uid, locale),
  ]);

  // If post doesn't exist, show 404
  if (!postData) {
    notFound();
  }

  const { post } = postData;
  const postContent = content;

  return (
    <>
      <div className="min-h-screen bg-[var(--color-panel)] transition-colors duration-300">
        {/* Breadcrumb */}
        <div className="bg-[var(--background)] border-b border-[var(--border-color)] shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <a 
                    href="/blog" 
                    className="text-[var(--text-color)] hover:text-[var(--hover-primary)] transition-colors duration-300 hover-shimmer overflow-hidden px-1 py-0.5 rounded"
                  >
                    {blogT("blog")}
                  </a>
                </li>
                <li>
                  <span className="text-[var(--text-color)] opacity-40">/</span>
                </li>
                {post.category && (
                  <>
                    <li>
                      <span className="text-[var(--text-color)] bg-[var(--selecter)] px-2 py-1 rounded-full text-xs">
                        {post.category.name}
                      </span>
                    </li>
                    <li>
                      <span className="text-[var(--text-color)] opacity-40">/</span>
                    </li>
                  </>
                )}
                <li>
                  <span className="text-[var(--title)] font-medium truncate max-w-xs">
                    {post.title}
                  </span>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PostDetail post={post} content={postContent} />
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "image": Array.isArray(post.images) ? post.images : [post.images || "https://cdn.elice.pro/images/logo.jpg"],
            "author": {
              "@type": "Organization",
              "name": "Elice",
              "logo": {
                "@type": "ImageObject",
                "url": "https://cdn.elice.pro/images/logo.jpg"
              }
            },
            "publisher": {
              "@type": "Organization",
              "name": "Elice",
              "logo": {
                "@type": "ImageObject",
                "url": "https://cdn.elice.pro/images/logo.jpg",
                "width": 600,
                "height": 60
              }
            },
            "datePublished": post.createdTime,
            "dateModified": post.updatedTime || post.createdTime,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_URLNEXT_PUBLIC_URL}/blog/${resolvedParams.uid}`
            },
            "url": `${process.env.NEXT_PUBLIC_URLNEXT_PUBLIC_URL}/blog/${resolvedParams.uid}`,
            "wordCount": postContent?.data?.content?.length || 0,
            "genre": post.category?.name || "Technology",
            "keywords": post.tags.map(tag => tag.name).join(", "),
            "articleSection": post.category?.name || "Blog",
            "articleBody": postContent?.data?.content || post.description,
            "interactionStatistic": [
              {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": post.likeCount
              },
              {
                "@type": "InteractionCounter", 
                "interactionType": "https://schema.org/ViewAction",
                "userInteractionCount": post.views
              }
            ]
          }),
        }}
      />
    </>
  );
}