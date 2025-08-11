'use client';

import { memo, useRef } from 'react';
import { useInView } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';
import type { BlogPostContentProps, ContentSectionItemProps } from '@/types/blog/components';
import { PrimarySection } from './content/PrimarySection';
import { AccentSection } from './content/AccentSection';


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
          key={`section-${section.title?.substring(0, 20)}-${index}`}
          section={section}
          index={index}
          mobile={mobile}
          tablet={tablet}
        />
      ))}
    </div>
  );
});


const ContentSectionItem = memo(function ContentSectionItem({
  section,
  index,
  mobile,
  tablet
}: ContentSectionItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (index === 0) {
    return (
      <PrimarySection
        ref={ref}
        section={section}
        mobile={mobile}
        tablet={tablet}
        isInView={isInView}
      />
    );
  }

  return (
    <AccentSection
      ref={ref}
      section={section}
      mobile={mobile}
      tablet={tablet}
      isInView={isInView}
    />
  );
});

ContentSectionItem.displayName = 'ContentSectionItem';
Content.displayName = 'Content';