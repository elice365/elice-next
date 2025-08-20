/**
 * Date formatting utilities for consistent rendering
 */

/**
 * Format date to Korean locale short format (MM/DD)
 * Use this for SSR-safe date formatting
 */
export function formatDateShort(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format date to Korean locale with year (YYYY.MM.DD)
 */
export function formatDateFull(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format date to ISO string for consistency
 */
export function formatDateISO(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  } catch (error) {
    return '';
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * Note: This should only be used in client components
 */
export function getRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}일 전`;
    } else if (diffInHours > 0) {
      return `${diffInHours}시간 전`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}분 전`;
    } else {
      return '방금 전';
    }
  } catch (error) {
    return '';
  }
}