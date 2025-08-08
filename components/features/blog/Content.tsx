'use client';

import { memo, useRef } from 'react';
import { useInView } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';
import { PrimarySection } from './content/PrimarySection';
import { AccentSection } from './content/AccentSection';

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