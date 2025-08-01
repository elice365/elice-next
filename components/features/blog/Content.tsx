'use client';

import { memo, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';

interface BlogPostContentProps {
  sections: ContentSection[];
  mobile: boolean;
  tablet: boolean;
}

export const Content = memo(function Content({
  sections,
  mobile,
  tablet
}: BlogPostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div 
      ref={containerRef}
      className={`${
        mobile && !tablet ? 'bg-[var(--color-modal)] rounded-xl p-5' :
        tablet ? 'bg-[var(--color-modal)] rounded-xl p-6' :
        'bg-[var(--color-modal)] rounded-xl p-8 shadow-sm'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {sections.map((section, index) => (
        <ContentSectionItem
          key={index}
          section={section}
          index={index}
          mobile={mobile}
          tablet={tablet}
        />
      ))}
    </motion.div>
  );
});

interface ContentSectionItemProps {
  section: ContentSection;
  index: number;
  mobile: boolean;
  tablet: boolean;
}

const ContentSectionItem = memo(function ContentSectionItem({
  section,
  index,
  mobile,
  tablet
}: ContentSectionItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (index === 0) {
    // First section - primary content
    return (
      <motion.section
        ref={ref}
        className="blog-content-section"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h3 
          className={`font-bold text-[var(--title)] ${
            mobile && !tablet ? 'text-lg mb-2' :
            tablet ? 'text-lg mb-3' :
            'text-xl mb-3'
          }`}
          variants={itemVariants}
        >
          {section.title}
        </motion.h3>
        <motion.div variants={itemVariants}>
          <p className={`text-[var(--text-color)] leading-relaxed ${
            mobile && !tablet ? 'text-sm mb-4' :
            tablet ? 'text-base' :
            'text-lg'
          }`}>
            {section.context.split('\\n').map((line: string, i: number) => (
              <motion.span
                key={i}
                className="block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {line}
                {i < section.context.split('\\n').length - 1 && <br />}
              </motion.span>
            ))}
          </p>
        </motion.div>
      </motion.section>
    );
  }

  // Other sections with accent border
  return (
    <motion.section
      ref={ref}
      className="blog-content-section"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <motion.div 
        className={`border-l-4 border-[var(--blog-accent)] pl-4 py-2 ${
          mobile && !tablet ? 'opacity-70' : 'mb-3'
        } hover:border-[var(--blog-accent)]/80 transition-colors duration-300`}
        variants={itemVariants}
      >
        <h4 className={`font-bold text-[var(--title)] ${
          mobile && !tablet ? 'mb-1 text-base' :
          tablet ? 'text-base' :
          'text-lg'
        }`}>
          {section.title}
        </h4>
      </motion.div>
      
      <motion.div 
        className={`${
          mobile && !tablet ? 'pl-2 py-2 mb-4 opacity-80' :
          tablet ? 'pl-3' :
          'pl-4'
        }`}
        variants={itemVariants}
      >
        <p className={`text-[var(--text-color)] leading-relaxed ${
          mobile && !tablet ? 'text-gray-600 text-sm' :
          tablet ? 'text-base opacity-90' :
          'text-base opacity-90'
        }`}>
          {section.context.split('\\n').map((line: string, i: number) => (
            <motion.span
              key={i}
              className="block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: isInView ? i * 0.05 : 0,
                duration: 0.3
              }}
            >
              {line}
              {i < section.context.split('\\n').length - 1 && <br />}
            </motion.span>
          ))}
        </p>
      </motion.div>
    </motion.section>
  );
});

ContentSectionItem.displayName = 'ContentSectionItem';
Content.displayName = 'Content';