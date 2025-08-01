import { Metadata } from "next";
import { ImageMeta } from "@/types/image";
import { getTranslations } from "next-intl/server";
import { metaImage } from "@/utils/parse/metaImage";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {

  const t = await getTranslations("metaData");
  const ogRawImages = t.raw("openGraph.images") as ImageMeta[];
  const twitterRawImages = t.raw("twitter.images") as ImageMeta[];

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("openGraph.title"),
      description: t("openGraph.description"),
      url: t("openGraph.url"),
      type: "website",
      images: metaImage(ogRawImages),
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
      images: metaImage(twitterRawImages),
    },
    icons: {
      icon: t("icons.icon"),
    },
  };
}

export default async function Page() {
  return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Elice</h1>
        <p className="text-lg text-muted-foreground">
          This is the main homepage using the main layout.
        </p>
      </div>
  );
}
