'use client';

import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ContentSection } from '@/utils/blog/contentParser';

interface AccentSectionProps {
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
  if (mobile && !tablet) return 'text-base';
  if (tablet) return 'text-lg';
  return 'text-xl';
}

function getTextSize(mobile: boolean, tablet: boolean): string {
  if (mobile && !tablet) return 'text-[var(--text-color)] text-sm opacity-80';
  if (tablet) return 'text-base opacity-80';
  return 'text-base opacity-80';
}

export const AccentSection = memo(forwardRef<HTMLElement, AccentSectionProps>(
  function AccentSection({ section, mobile, tablet, isInView }, ref) {
    return (
      <motion.section
        ref={ref}
        className="blog-content-section mb-8"
        variants={fadeInVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div className="border-l-4 border-[var(--blog-accent)] p-2 mb-2">
          <h4 className={`font-semibold text-[var(--title)] ${getTitleSize(mobile, tablet)}`}>
            {section.title}
          </h4>
        </motion.div>
        
        <motion.div 
          className="pl-2"
          variants={fadeInVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <p className={getTextSize(mobile, tablet)}>
            {section.context.split('\\n').map((line: string, i: number) => (
              <motion.span
                key={`accent-line-${i}-${line.substring(0, 10)}`}
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
  }
));

AccentSection.displayName = 'AccentSection';