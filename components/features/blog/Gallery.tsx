'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade, Parallax } from 'swiper/modules';
import { Icon } from '@/components/ui/Icon';
import { ProductItem, AuthorInfo } from '@/utils/blog/contentParser';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/parallax';

interface BlogPostGalleryProps {
  products: ProductItem[];
  author?: AuthorInfo;
  mobile: boolean;
  tablet: boolean;
}

export const Gallery = memo(function Gallery({
  products,
  author,
  mobile,
  tablet
}: BlogPostGalleryProps) {
  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
    >
      {(!mobile || tablet) && (
        <h2 className={`font-semibold text-[var(--title)] ${
          tablet ? 'text-xl mb-4' : 'text-2xl mb-6'
        } flex items-center gap-2`}>
          <span className="text-[var(--blog-accent)]">상품이미지</span>
        </h2>
      )}

      <div className="relative rounded-xl overflow-hidden shadow-lg group">
        <Swiper
          modules={[Autoplay, Navigation, Pagination, EffectFade, Parallax]}
          spaceBetween={0}
          slidesPerView={1}
          effect="fade"
          parallax={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          loop
          navigation={!mobile}
          pagination={{ 
            clickable: true,
            dynamicBullets: true
          }}
          className="blog-product-swiper"
        >
          {products.map((product, index) => (
            <SwiperSlide key={index}>
              <div className={`relative ${
                mobile ? 'aspect-square' : 'aspect-[4/3]'
              }`}>
                {/* Background layer with parallax */}
                <div 
                  className="absolute inset-0"
                  data-swiper-parallax="-40%"
                >
                  <Image
                    src={product.url}
                    alt={product.title}
                    fill
                    className="object-cover filter blur-sm scale-110"
                    priority={index === 0}
                  />
                </div>

                {/* Main image layer */}
                <div 
                  className="relative z-10 h-full"
                  data-swiper-parallax="0"
                >
                  <Image
                    src={product.url}
                    alt={product.title}
                    fill
                    className="object-cover rounded-lg"
                    priority={index === 0}
                  />
                </div>

                {/* Content overlay with parallax */}
                <div 
                  className="absolute inset-0 flex flex-col justify-end z-20"
                  data-swiper-parallax="40%"
                >
                  <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <motion.div 
                      className={`text-white ${
                        mobile ? 'p-4' : 'p-6 lg:p-8'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      {/* Tags */}
                      <div className={`flex flex-wrap mb-3 ${
                        mobile ? 'gap-1' : 'gap-2'
                      }`}>
                        {product.tag.map((tag: string, tagIndex: number) => (
                          <motion.span
                            key={tagIndex}
                            className={`bg-black/60 rounded-md inline-flex items-center gap-1 backdrop-blur-sm ${
                              mobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
                            }`}
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
                      <h2 className={`font-bold mb-2 ${
                        mobile ? 'text-xl' : 'text-2xl lg:text-3xl'
                      }`}>
                        {product.title}
                      </h2>
                      <p className={`opacity-90 ${
                        mobile ? 'text-sm mb-4' : 'text-base lg:text-lg mb-4'
                      }`}>
                        {product.description}
                      </p>
                    </motion.div>

                    {/* Author Info with glassmorphism */}
                    {author && (
                      <motion.div 
                        className={`text-white flex items-center justify-between bg-white/10 backdrop-blur-md w-full ${
                          mobile ? 'p-3' : 'p-4'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <div className="flex items-center">
                          <div className="rounded-lg bg-gray-500 overflow-hidden mr-3 w-10 h-10">
                            <Image
                              src={author.profileImage}
                              alt="프로필 이미지"
                              width={40}
                              height={40}
                              className="object-cover aspect-square p-1"
                            />
                          </div>
                          <div>
                            <p className={`font-medium ${
                              mobile ? 'text-sm' : 'text-base'
                            }`}>
                              {author.name}
                            </p>
                            <p className={`text-gray-300 ${
                              mobile ? 'text-xs line-clamp-1' : 'text-sm line-clamp-1'
                            }`}>
                              {author.description}
                            </p>
                          </div>
                        </div>
                        <motion.button 
                          className={`bg-[var(--blog-accent)] text-white rounded-lg hover-shimmer transition-all ${
                            mobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          구매
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Interactive overlay on hover */}
                <div className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div
                    className="bg-white/20 backdrop-blur-md rounded-full p-3 cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="Search" size={20} className="text-white" />
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .blog-product-swiper {
          border-radius: ${mobile && !tablet ? '8px' : '12px'};
          overflow: hidden;
        }
        
        .blog-product-swiper .swiper-button-next,
        .blog-product-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.5);
          width: ${mobile ? '32px' : '40px'};
          height: ${mobile ? '32px' : '40px'};
          border-radius: 50%;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }
        
        .blog-product-swiper .swiper-button-next:hover,
        .blog-product-swiper .swiper-button-prev:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: scale(1.1);
        }
        
        .blog-product-swiper .swiper-button-next::after,
        .blog-product-swiper .swiper-button-prev::after {
          font-size: ${mobile ? '14px' : '16px'};
        }
        
        .blog-product-swiper .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
          width: ${mobile ? '6px' : '8px'};
          height: ${mobile ? '6px' : '8px'};
          transition: all 0.3s ease;
        }
        
        .blog-product-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: var(--blog-accent);
          width: ${mobile ? '20px' : '24px'};
          border-radius: 4px;
        }
        
        .blog-product-swiper .swiper-pagination {
          bottom: ${mobile ? '10px' : '15px'};
        }
      `}</style>
    </motion.section>
  );
});

Gallery.displayName = 'Gallery';