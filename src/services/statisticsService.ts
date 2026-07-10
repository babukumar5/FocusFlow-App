/**
 * FocusFlow — Statistics Service
 * 
 * Pure functions for computing graph data and activity summaries.
 * All date operations use LOCAL timezone.
 * No side effects — these are pure transformations of session data.
 */

import { FocusSession, TodayHourlyData, WeekDayData, MonthData, ActivitySummary } from '../types/timer.types';
import { getLocalDateString, getStartOfWeek, getEndOfWeek, getHourLabel } from '../utils/dateUtils';

// ─── Today Graph: Hourly Buckets (00-23) for current local date ─────────────

/**
 * Compute focus minutes per hour for today.
 * Returns all 24 hours with focus minutes (most will be 0).
 * Used by the Today tab graph which shows last 6 hours.
 */
export const computeTodayHourlyData = (sessions: FocusSession[]): TodayHourlyData[] => {
  const todayStr = getLocalDateString(new Date());
  
  // Initialize all 24 hours
  const hourlyMap: number[] = new Array(24).fill(0);
  
  // Filter to today's completed focus sessions
  const todaySessions = sessions.filter(
    s => s.mode === 'focus' && s.completionStatus === 'completed' && s.date === todayStr
  );
  
  todaySessions.forEach(session => {
    const startDate = new Date(session.startTime);
    const hour = startDate.getHours();
    if (hour >= 0 && hour < 24) {
      hourlyMap[hour] += session.actualCompletedMinutes;
    }
  });
  
  return hourlyMap.map((minutes, hour) => ({
    hour,
    label: getHourLabel(hour),
    minutes,
  }));
};

/**
 * Get the last 6 hours of today data for the Today graph.
 */
export const computeTodayGraphData = (sessions: FocusSession[]): { labels: string[]; values: number[] } => {
  const now = new Date();
  const currentHour = now.getHours();
  const hourlyData = computeTodayHourlyData(sessions);
  
  const labels: string[] = [];
  const values: number[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const hour = currentHour - i;
    if (hour >= 0) {
      const data = hourlyData[hour];
      labels.push(data.label);
      values.push(data.minutes);
    } else {
      // Wrap around to previous day hours — show 0
      const wrappedHour = 24 + hour;
      labels.push(getHourLabel(wrappedHour));
      values.push(0);
    }
  }
  
  return { labels, values };
};

// ─── Week Graph: Mon-Sun buckets for current ISO week ───────────────────────

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Compute focus minutes per weekday for the current week (Mon-Sun).
 */
export const computeWeekData = (sessions: FocusSession[]): WeekDayData[] => {
  const weekStart = getStartOfWeek(new Date());
  const weekEnd = getEndOfWeek(new Date());
  
  const dailyMap: number[] = new Array(7).fill(0);
  
  const weekSessions = sessions.filter(s => {
    if (s.mode !== 'focus' || s.completionStatus !== 'completed') return false;
    const sessionDate = new Date(s.startTime);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });
  
  weekSessions.forEach(session => {
    const sessionDate = new Date(session.startTime);
    const dayOfWeek = sessionDate.getDay();
    // Map JS day (0=Sun) to Mon=0, Tue=1, ..., Sun=6
    const mappedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    dailyMap[mappedIndex] += session.actualCompletedMinutes;
  });
  
  return WEEK_DAY_LABELS.map((day, idx) => ({
    day,
    minutes: dailyMap[idx],
  }));
};

export const computeWeekGraphData = (sessions: FocusSession[]): { labels: string[]; values: number[] } => {
  const weekData = computeWeekData(sessions);
  return {
    labels: weekData.map(d => d.day),
    values: weekData.map(d => d.minutes),
  };
};

// ─── Year Graph: Jan-Dec for current year ──────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Compute focus minutes per month for the current year.
 */
export const computeYearData = (sessions: FocusSession[]): MonthData[] => {
  const currentYear = new Date().getFullYear();
  const monthlyMap: number[] = new Array(12).fill(0);
  
  const yearSessions = sessions.filter(s => {
    if (s.mode !== 'focus' || s.completionStatus !== 'completed') return false;
    return s.year === currentYear;
  });
  
  yearSessions.forEach(session => {
    const sessionDate = new Date(session.startTime);
    const month = sessionDate.getMonth();
    monthlyMap[month] += session.actualCompletedMinutes;
  });
  
  return MONTH_LABELS.map((month, idx) => ({
    month,
    minutes: monthlyMap[idx],
  }));
};

export const computeYearGraphData = (sessions: FocusSession[]): { labels: string[]; values: number[] } => {
  const yearData = computeYearData(sessions);
  return {
    labels: yearData.map(d => d.month),
    values: yearData.map(d => d.minutes),
  };
};

// ─── Activity Summary ──────────────────────────────────────────────────────

/**
 * Compute activity summary statistics from all sessions.
 */
export const computeActivitySummary = (sessions: FocusSession[]): ActivitySummary => {
  const focusSessions = sessions.filter(
    s => s.mode === 'focus' && s.completionStatus === 'completed'
  );
  
  if (focusSessions.length === 0) {
    return {
      totalFocusTime: 0,
      totalSessions: 0,
      avgSessionDuration: 0,
      bestDayTime: 0,
    };
  }
  
  let totalTime = 0;
  const dailyTotals: Record<string, number> = {};
  
  focusSessions.forEach(session => {
    totalTime += session.actualCompletedMinutes;
    const dateKey = session.date;
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + session.actualCompletedMinutes;
  });
  
  const bestDayTime = Math.max(0, ...Object.values(dailyTotals));
  
  return {
    totalFocusTime: totalTime,
    totalSessions: focusSessions.length,
    avgSessionDuration: Math.round(totalTime / focusSessions.length),
    bestDayTime,
  };
};

/**
 * Compute today-specific stats.
 */
export const computeTodayStats = (sessions: FocusSession[]): { todayFocusTime: number; todayFocusCount: number } => {
  const todayStr = getLocalDateString(new Date());
  
  const todaySessions = sessions.filter(
    s => s.mode === 'focus' && s.completionStatus === 'completed' && s.date === todayStr
  );
  
  let todayTime = 0;
  todaySessions.forEach(s => {
    todayTime += s.actualCompletedMinutes;
  });
  
  return {
    todayFocusTime: todayTime,
    todayFocusCount: todaySessions.length,
  };
};
