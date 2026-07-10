/**
 * FocusFlow — Date Utilities
 * All date operations use LOCAL timezone to prevent midnight boundary bugs.
 */

/**
 * Returns a YYYY-MM-DD string in the device's local timezone.
 * This fixes the UTC bug where late-night sessions appear on the wrong day.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the ISO 8601 week number for a given date.
 */
export const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Returns the start of the current ISO week (Monday 00:00:00 local).
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns the end of the current ISO week (Sunday 23:59:59.999 local).
 */
export const getEndOfWeek = (date: Date = new Date()): Date => {
  const monday = getStartOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Returns short day name (Mon, Tue, etc.) for a Date.
 */
export const getDayName = (date: Date): string => {
  return DAY_NAMES[date.getDay()];
};

/**
 * Returns short month name (Jan, Feb, etc.) for a Date.
 */
export const getMonthName = (date: Date): string => {
  return MONTH_NAMES[date.getMonth()];
};

/**
 * Returns hour label in "06 AM" format.
 */
export const getHourLabel = (hour: number): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${String(h).padStart(2, '0')} ${ampm}`;
};

// ─── Legacy exports (used by existing code) ─────────────────────────────────

export const dateUtils = {
  isToday: (dateString: string | Date | null): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  },
  
  formatDate: (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  
  startOfDay: (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
};
