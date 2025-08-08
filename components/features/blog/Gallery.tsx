'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Icon } from '@/components/ui/Icon';
import { ProductItem, AuthorInfo } from '@/utils/blog/contentParser';

// Import Swiper styles
import 'swiper/css';

interface BlogPostGalleryProps {
  products: ProductItem[];
  author?: AuthorInfo;
  mobile: boolean;
  tablet: boolean;
}

// Responsive utility functions
const getResponsiveClasses = {
  title: (mobile: boolean, tablet: boolean) => {
    if (mobile) return 'text-xl';
    if (tablet) return 'text-xl mb-4';
    return 'text-2xl mb-6';
  },
  padding: (mobile: boolean) => mobile ? 'p-4' : 'p-6 lg:p-8',
  text: (mobile: boolean) => mobile ? 'text-sm' : 'text-base lg:text-lg',
  button: (mobile: boolean) => mobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base',
  tag: (mobile: boolean) => mobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
};

function getMaxWidth(mobile: boolean, tablet: boolean): string {
  if (mobile) return '100vw';
  if (tablet) return '100vw';
  return 'calc(100vw - 270px)';
}

export const Gallery = memo(function Gallery({
  products,
  author,
  mobile,
  tablet
}: BlogPostGalleryProps) {
  return (
    <motion.section
      className="mb-8 w-full overflow-hidden max-w-screen"
      style={{ 
        maxWidth: getMaxWidth(mobile, tablet),
        width: '100%',
        position: 'relative'
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
    >
 
      <div 
        className="relative overflow-hidden" 
        style={{ 
          width: '100%',
          maxWidth: getMaxWidth(mobile, tablet)
        }}
      >
        <Swiper
          modules={[Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          loop={false}
          className="w-full"
          style={{
            width: '100%',
            maxWidth: getMaxWidth(mobile, tablet),
            height: 'auto',
            overflow: 'hidden',
            position: 'relative'
          }}
          allowTouchMove={true}
          resistance={false}
          watchOverflow={true}
          centeredSlides={true}
          grabCursor={true}
        >
          {products.map((product, index) => (
            <SwiperSlide key={`product-${product.url || product.title || index}`} style={{ width: '100%' }}>
              <div className={`relative w-full aspect-square sm:aspect-[4/2] lg:aspect-[4/1]
                }`}>
                {/* Background layer with parallax */}


                {/* Main image layer */}
                <div
                  className="relative "
                >
                  <Image
                    src={product.url}
                    alt={product.title}
                    fill
                    className="object-cover "
                    priority={index === 0}
                  />
                </div>
                <div
                  className="absolute inset-0"
                >
                  <Image
                    src={product.url}
                    alt={product.title}
                    fill
                    className="object-cover filter blur-[1px] scale-100 bg-[#5c5049] "
                    priority={index === 0}
                  />
                </div>

                {/* Content overlay */}
                <div
                  className="absolute inset-0 flex flex-col justify-end z-20"
                >
                  <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <motion.div
                      className={`text-white ${getResponsiveClasses.padding(mobile)}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      {/* Tags */}
                      <div className={`flex flex-wrap mb-3 ${mobile ? 'gap-1' : 'gap-2'}`}>
                        {product.tag.map((tag: string, tagIndex: number) => (
                          <motion.span
                            key={`tag-${tag}-${tagIndex}`}
                            className={`bg-black/60 rounded-md inline-flex items-center gap-1 backdrop-blur-sm ${getResponsiveClasses.tag(mobile)}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: tagIndex * 0.1 }}
                          >
                            <Icon name="Tag" size={12} />
                            {tag}
                          </motion.span>
                        ))}
                      </div>

                      {/* Title and Description */}
                      <h2 className={`font-bold mb-2 ${mobile ? 'text-xl' : 'text-2xl lg:text-3xl'}`}>
                        {product.title}
                      </h2>
                      <p className={`opacity-90 ${getResponsiveClasses.text(mobile)} mb-4`}>
                        {product.description}
                      </p>
                    </motion.div>

                    {/* Author Info with glassmorphism */}
                    {author && (
                      <motion.div
                        className={`text-white flex items-center justify-between bg-[linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.4))] backdrop-blur-md w-full ${mobile ? 'p-3' : 'p-4'
                          }`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <div className="flex items-center">
                          <div className="rounded-lg bg-white overflow-hidden mr-3 w-10 h-10">
                            <Image
                              src={author.profileImage}
                              alt="프로필 이미지"
                              width={40}
                              height={40}
                              className="object-cover w-full h-full p-1"
                            />
                          </div>
                          <div>
                            <p className={`font-medium ${mobile ? 'text-sm' : 'text-base'}`}>
                              {author.name}
                            </p>
                            <p className={`text-gray-300 line-clamp-1 ${mobile ? 'text-xs' : 'text-sm'}`}>
                              {author.description}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          className={`bg-[var(--blog-accent)] text-white rounded-lg  transition-all ${getResponsiveClasses.button(mobile)}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          구매
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
});

Gallery.displayName = 'Gallery';