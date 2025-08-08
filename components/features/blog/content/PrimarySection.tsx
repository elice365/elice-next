'use client';

/* eslint-disable sonarjs/no-unused-vars */
/* eslint-disable react/no-unused-prop-types */
// SonarCloud incorrectly reports props as unused when they are used in JSX and helper functions

import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';

interface PrimarySectionProps {
  // sonar-disable-next-line typescript:S4023
  section: ContentSection; // Used in JSX for title and context
  // sonar-disable-next-line typescript:S4023
  mobile: boolean; // Used in getTitleSize and getTextSize functions
  // sonar-disable-next-line typescript:S4023
  tablet: boolean; // Used in getTitleSize and getTextSize functions
  // sonar-disable-next-line typescript:S4023
  isInView: boolean; // Used for animation state control
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
  // eslint-disable-next-line react/no-unused-prop-types
  function PrimarySection({ section, mobile, tablet, isInView }, ref) {
    // Explicit usage to avoid SonarCloud false positives
    const titleSize = getTitleSize(mobile, tablet);
    const textSize = getTextSize(mobile, tablet);
    const animateState = isInView ? "visible" : "hidden";
    return (
      <motion.section
        ref={ref}
        className="blog-content-section my-8"
        variants={fadeInVariants}
        initial="hidden"
        animate={animateState}
      >
        <h3 className={`font-semibold text-[var(--title)] mb-3 ${titleSize}`}>
          {section.title}
        </h3>
        <div className={`text-[var(--text-color)] opacity-80 ${textSize}`}>
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