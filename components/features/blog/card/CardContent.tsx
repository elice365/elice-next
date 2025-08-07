import { memo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { PostType } from '@/types/post';

interface CardContentProps {
  post: PostType;
  mobile: boolean;
  tablet: boolean;
  formatDate: (date: Date) => string;
}

export const CardContent = memo(function CardContent({ 
  post, 
  mobile, 
  tablet, 
  formatDate 
}: CardContentProps) {
  const paddingClass = getPaddingClass(mobile, tablet);

  return (
    <div className={`${paddingClass} space-y-3`}>
      <CardTitle title={post.title} mobile={mobile} tablet={tablet} />
      <CardDescription description={post.description} mobile={mobile} />
      <CardStats 
        post={post} 
        mobile={mobile} 
        formatDate={formatDate} 
      />
    </div>
  );
});

function getPaddingClass(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'p-4';
  if (tablet) return 'p-5';
  return 'p-6';
}

interface CardTitleProps {
  title: string;
  mobile: boolean;
  tablet: boolean;
}

const CardTitle = memo(function CardTitle({ title, mobile, tablet }: CardTitleProps) {
  const titleClassName = getTitleClassName(mobile, tablet);

  return (
    <h3 className={titleClassName}>
      {title}
    </h3>
  );
});

function getTitleClassName(mobile: boolean, tablet: boolean): string {
  const baseClasses = 'text-[var(--title)] font-bold leading-snug transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis';
  
  let sizeClass = 'text-xl';
  if (mobile) {
    sizeClass = 'text-base';
  } else if (tablet) {
    sizeClass = 'text-lg';
  }
  
  const hoverClass = !mobile ? 'group-hover:text-[var(--hover-text)]' : '';
  
  return `${baseClasses} ${sizeClass} ${hoverClass}`.trim();
}

interface CardDescriptionProps {
  description: string;
  mobile: boolean;
}

const CardDescription = memo(function CardDescription({ description, mobile }: CardDescriptionProps) {
  const descriptionClassName = getDescriptionClassName(mobile);

  return (
    <p className={descriptionClassName}>
      {description}
    </p>
  );
});

function getDescriptionClassName(mobile: boolean): string {
  const baseClasses = 'text-[var(--text-color)] opacity-75 line-clamp-2 leading-relaxed h-12';
  const sizeClass = mobile ? 'text-sm' : 'text-sm md:text-[15px]';
  const trackingClass = !mobile ? 'tracking-wide' : '';
  
  return `${baseClasses} ${sizeClass} ${trackingClass}`.trim();
}

interface CardStatsProps {
  post: PostType;
  mobile: boolean;
  formatDate: (date: Date) => string;
}

const CardStats = memo(function CardStats({ post, mobile, formatDate }: CardStatsProps) {
  const containerClassName = getStatsContainerClassName(mobile);

  return (
    <div className={containerClassName}>
      <StatsItems post={post} mobile={mobile} />
      <DateDisplay date={post.createdTime} mobile={mobile} formatDate={formatDate} />
    </div>
  );
});

function getStatsContainerClassName(mobile: boolean): string {
  const baseClasses = 'flex items-center justify-between border-t border-[var(--border-color)]/50';
  const paddingClass = mobile ? 'pt-3' : 'pt-4';
  
  return `${baseClasses} ${paddingClass}`.trim();
}

interface StatsItemsProps {
  post: PostType;
  mobile: boolean;
}

const StatsItems = memo(function StatsItems({ post, mobile }: StatsItemsProps) {
  const containerClassName = getStatsItemsContainerClassName(mobile);

  return (
    <div className={containerClassName}>
      <StatItem 
        icon="Eye" 
        value={post.views.toLocaleString()} 
        mobile={mobile} 
      />
      <StatItem 
        icon="Heart" 
        value={post.likeCount.toString()} 
        mobile={mobile} 
        filled={post.isLiked} 
      />
      {!mobile && (
        <StatItem 
          icon="MessageSquare" 
          value={(post.comments || 0).toString()} 
          mobile={mobile} 
        />
      )}
    </div>
  );
});

function getStatsItemsContainerClassName(mobile: boolean): string {
  const baseClasses = 'flex items-center text-[var(--text-color)] opacity-70';
  const gapClass = mobile ? 'gap-2' : 'gap-3 md:gap-4';
  const sizeClass = mobile ? 'text-[11px]' : 'text-xs';
  
  return `${baseClasses} ${gapClass} ${sizeClass}`.trim();
}

interface StatItemProps {
  icon: string;
  value: string;
  mobile: boolean;
  filled?: boolean;
}

const StatItem = memo(function StatItem({ icon, value, mobile, filled = false }: StatItemProps) {
  const itemClassName = getStatItemClassName(mobile);

  return (
    <motion.span 
      className={itemClassName}
      whileHover={!mobile ? { scale: 1.05 } : {}}
    >
      <Icon 
        name={icon} 
        size={mobile ? 12 : 15} 
        className="opacity-80" 
        fill={filled ? 'currentColor' : 'none'} 
      />
      <span className="font-medium">{value}</span>
    </motion.span>
  );
});

function getStatItemClassName(mobile: boolean): string {
  const baseClasses = 'flex items-center transition-all duration-300 hover:text-[var(--blog-accent)] hover:opacity-100';
  const gapClass = mobile ? 'gap-1' : 'gap-1.5';
  const cursorClass = !mobile ? 'cursor-pointer' : '';
  
  return `${baseClasses} ${gapClass} ${cursorClass}`.trim();
}

interface DateDisplayProps {
  date: Date;
  mobile: boolean;
  formatDate: (date: Date) => string;
}

const DateDisplay = memo(function DateDisplay({ date, mobile, formatDate }: DateDisplayProps) {
  const dateClassName = getDateClassName(mobile);

  return (
    <time className={dateClassName}>
      {formatDate(date)}
    </time>
  );
});

function getDateClassName(mobile: boolean): string {
  const baseClasses = 'text-[var(--text-color)] opacity-60 font-medium';
  const sizeClass = mobile ? 'text-[11px]' : 'text-xs';
  
  return `${baseClasses} ${sizeClass}`.trim();
}

CardContent.displayName = 'CardContent';