/**
 * Blog List Helper Functions
 * Extracted from List.tsx for better maintainability and testability
 */

// Default images array for posts without images
export const DEFAULT_POST_IMAGES = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%239ca3af'%3EBlog Post 1%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%236b7280'%3EBlog Post 2%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23d1d5db'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='20' fill='%234b5563'%3EBlog Post 3%3C/text%3E%3C/svg%3E"
];

// Helper functions to avoid nested ternary operators
export function getListPadding(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'p-4';
  if (tablet) return 'p-5';
  return 'p-6';
}

export function getTitleTextSize(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'text-base';
  if (tablet) return 'text-lg';
  return 'text-xl';
}

export function getImageDimensions(mobile: boolean, tablet: boolean): string {
  if (mobile) return 'w-full h-48';
  if (tablet) return 'w-28 h-28';
  return 'w-32 h-32';
}

export function getMetaClassNames(mobile: boolean): string {
  const gap = mobile ? 'gap-3 text-[11px]' : 'gap-4 text-xs';
  const wrap = mobile ? 'flex-wrap' : '';
  return `${gap} ${wrap}`;
}

/**
 * Responsive class name builders
 */
export function getImageContainerClasses(mobile: boolean, tablet: boolean): string {
  const base = 'relative overflow-hidden rounded-lg';
  const dimensions = getImageDimensions(mobile, tablet);
  return `${base} ${dimensions}`;
}

export function getContentClasses(mobile: boolean): string {
  return mobile ? 'col-span-5' : 'col-span-5 sm:col-span-3';
}

export function getGridClasses(mobile: boolean, tablet: boolean): string {
  const base = 'group grid grid-cols-5 gap-3';
  const padding = getListPadding(mobile, tablet);
  return `${base} ${padding}`;
}