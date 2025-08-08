'use client';

import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';

interface PrimarySectionProps {
  section: ContentSection;
  mobile: boolean;
  tablet: boolean;
  isInView: boolean;
}

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

function getTitleSize(mobile: boolean, tablet: boolean): string {
  if (mobile && !tablet) return 'text-lg mb-3';
  if (tablet) return 'text-xl';
  return 'text-2xl';
}

function getTextSize(mobile: boolean, tablet: boolean): string {
  if (mobile && !tablet) return 'text-sm';
  if (tablet) return 'text-base';
  return 'text-lg';
}

export const PrimarySection = memo(forwardRef<HTMLElement, PrimarySectionProps>(
  function PrimarySection({ section, mobile, tablet, isInView }, ref) {
    return (
      <motion.section
        ref={ref}
        className="blog-content-section my-8"
        variants={fadeInVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <h3 className={`font-semibold text-[var(--title)] mb-3 ${getTitleSize(mobile, tablet)}`}>
          {section.title}
        </h3>
        <div className={`text-[var(--text-color)] opacity-80 ${getTextSize(mobile, tablet)}`}>
          {section.context.split('\\n').map((line: string, i: number) => (
            <p key={`primary-line-${i}-${line.substring(0, 10)}`} className="">
              {line}
            </p>
          ))}
        </div>
      </motion.section>
    );
  }
));

PrimarySection.displayName = 'PrimarySection';