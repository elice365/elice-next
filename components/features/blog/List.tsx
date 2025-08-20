'use client';

import { memo } from 'react';
import { useAppSelector } from '@/stores/hook';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import type { BlogListItemProps, BlogListProps } from '@/types/blog/components';
import { BlogListItem } from './list/index';


export const ListItem = memo(function ListItem({ post }: BlogListItemProps) {
  const { mobile, tablet } = useAppSelector((state) => state.device);

  return (
    <motion.div
      whileHover={!mobile ? { x: 4 } : {}}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative group"
    >
      <BlogListItem post={post} mobile={mobile} tablet={tablet} />
    </motion.div>
  );
});


export const List = memo(function List({ posts, className = '' }: BlogListProps) {
  const { mobile } = useAppSelector((state) => state.device);

  if (posts.length === 0) {
    return (
      <motion.div 
        className={`flex flex-col items-center justify-center ${mobile ? 'py-12' : 'py-16'} text-center px-4`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <Icon name="FileText" className={`${mobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto text-[#5c5049] opacity-20 mb-4`} />
          <motion.div
            className={`absolute inset-0 ${mobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto border-2 border-[#5c5049]/20 rounded-full`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        <h3 className={`${mobile ? 'text-lg' : 'text-xl'} font-bold text-[var(--title)] mb-2`}>
          게시글이 없습니다
        </h3>
        <p className={`text-[var(--text-color)] opacity-70 ${mobile ? 'text-sm' : 'text-base'}`}>
          새로운 게시글이 곧 업데이트됩니다
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {posts.map((post, index) => (
        <motion.div
          key={post.uid}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <ListItem post={post} />
        </motion.div>
      ))}
    </div>
  );
});

ListItem.displayName = 'ListItem';
List.displayName = 'List';