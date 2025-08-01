import { LoginPage } from '@/components/pages/Login';
import { ImageMeta } from '@/types/image';
import { metaImage } from '@/utils/parse/metaImage';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {

  const m = await getTranslations("metaData");
  const t = await getTranslations("router");
  const ogRawImages = m.raw("openGraph.images") as ImageMeta[];
  const twitterRawImages = m.raw("twitter.images") as ImageMeta[];

  return {
    title: m("title"),
    description: m("description"),
    openGraph: {
      title: m("openGraph.title") + " "+ t("login"),
      description: m("openGraph.description"),
      url: m("openGraph.url")+"/login",
      type: "website",
      images: metaImage(ogRawImages),
    },
    twitter: {
      card: "summary_large_image",
      title: m("twitter.title"),
      description: m("twitter.description"),
      images: metaImage(twitterRawImages),
    },
    icons: {
      icon: m("icons.icon"),
    },
  };
}

export default function Login (){
  return <LoginPage />;
};

