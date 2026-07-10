/**
 * Formats seconds into MM:SS format
 * @param seconds Total seconds
 * @returns Formatted string MM:SS
 */
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * Formats minutes into human readable duration (e.g. 2h 15m)
 * @param minutes Total minutes
 * @returns Formatted string
 */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};
