import { ImageMeta } from "@/types/image";

export const metaImage = (images: ImageMeta[]) =>
  images.map(({ url, width, height, alt }) => ({
    url,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
    alt,
  }));