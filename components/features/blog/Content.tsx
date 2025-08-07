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
    <div 
      ref={containerRef}
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
    </div>
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

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  if (index === 0) {
    // First section - primary content
    return (
      <motion.section
        ref={ref}
        className="blog-content-section my-8"
        variants={fadeInVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <h3 className={`font-semibold text-[var(--title)] mb-3 ${
          mobile && !tablet ? 'text-lg mb-3' :
          tablet ? 'text-xl ' :
          'text-2xl '
        }`}>
          {section.title}
        </h3>
        <div className={`text-[var(--text-color)] opacity-80 ${
          mobile && !tablet ? 'text-sm' :
          tablet ? 'text-base' :
          'text-lg'
        }`}>
          {section.context.split('\\n').map((line: string, i: number) => (
            <p key={i} className="">
              {line}
            </p>
          ))}
        </div>
      </motion.section>
    );
  }

  // Other sections with accent border
  return (
    <motion.section
      ref={ref}
      className="blog-content-section mb-8"
      variants={fadeInVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <motion.div className="border-l-4 border-[var(--blog-accent)] p-2 mb-2">
        <h4 className={`font-semibold text-[var(--title)] ${
          mobile && !tablet ? 'text-base' :
          tablet ? 'text-lg ' :
          'text-xl'
        }`}>
          {section.title}
        </h4>
      </motion.div>
      
      <motion.div 
        className="pl-2"
        variants={fadeInVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <p className={`text-[var(--text-color)]  ${
          mobile && !tablet ? 'text-[var(--text-color)] text-sm opacity-80' :
          tablet ? 'text-base opacity-80' :
          'text-base opacity-80'
        }`}>
          {section.context.split('\\n').map((line: string, i: number) => (
            <motion.span
              key={i}
              className="block "
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