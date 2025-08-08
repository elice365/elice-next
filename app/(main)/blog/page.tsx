import { Metadata } from "next";
import { ImageMeta } from "@/types/image";
import { getTranslations } from "next-intl/server";
import { metaImage } from "@/utils/parse/metaImage";
import { BlogLayout } from "@/components/layout/Blog";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaData");
  const blogT = await getTranslations("router");
  const ogRawImages = t.raw("openGraph.images") as ImageMeta[];
  const twitterRawImages = t.raw("twitter.images") as ImageMeta[];

  const blogTitle = blogT("blog");
  const baseTitle = t("title");
  const fullTitle = `${blogTitle} | ${baseTitle}`;
  const description = "Discover insightful articles, tutorials, and updates from our blog.";

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: fullTitle,
      description: description,
      url: `${t("openGraph.url")}/blog`,
      type: "website",
      images: metaImage(ogRawImages),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description,
      images: metaImage(twitterRawImages),
    },
    icons: {
      icon: t("icons.icon"),
    },
    alternates: {
      canonical: "/blog",
    },
    other: {
      "robots": "index, follow",
      "og:site_name": baseTitle,
      "article:section": "Blog",
    },
  };
}

export default async function BlogPage() {
  const blogT = await getTranslations("router");
  
  return (
    <div className="min-h-screen w-full bg-[var(--color-panel)] transition-colors duration-300">

      {/* Blog Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogLayout className="w-full" />
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": `${blogT("blog")} | Elice`,
            "description": "Discover insightful articles, tutorials, and updates from our blog.",
            "url": `${process.env.NEXT_PUBLIC_URL}/blog`,
            "publisher": {
              "@type": "Organization",
              "name": "Elice",
              "logo": {
                "@type": "ImageObject",
                "url": "https://cdn.elice.pro/images/logo.jpg",
                "width": 1200,
                "height": 630
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_URL}/blog`
            }
          }),
        }}
      />
    </div>
  );
}