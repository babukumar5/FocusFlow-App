/**
 * FocusFlow — Statistics Calculator
 * 
 * Pure functions for computing graph data and activity summaries.
 * All date operations use LOCAL timezone.
 */

import { FocusSession } from '../types/timer.types';
import { getLocalDateString } from '../utils/dateUtils';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export interface StatCardData {
  value: string | number;
  label: string;
  subtitle: string;
}

export interface TabSummary {
  card1: StatCardData;
  card2: StatCardData;
  card3: StatCardData;
  card4: StatCardData;
}

export interface FullActivityData {
  summary: {
    week: TabSummary;
    year: TabSummary;
  };
  graphs: {
    week: { labels: string[]; values: number[]; sessions: number[]; tooltipLabels: string[] };
    year: { labels: string[]; values: number[]; sessions: number[]; tooltipLabels: string[] };
  };
}

export class StatisticsCalculator {
  // Simple caching mechanism
  private static lastSessionsRef: FocusSession[] | null = null;
  private static cachedData: FullActivityData | null = null;
  private static lastComputeDate: string | null = null;

  static computeFullActivityData(sessions: FocusSession[]): FullActivityData {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    if (this.lastSessionsRef === sessions && this.cachedData && this.lastComputeDate === todayStr) {
      return this.cachedData;
    }
    
    // --- Week Graph Data and Week Sessions ---
    const { labels: weekLabels, values: weekValues, dateStrings: weekDateStrings, tooltipLabels: weekTooltipLabels } = this.computeWeekGraphData(now);
    
    // Filter sessions for this week
    const weekSessions = sessions.filter(s => weekDateStrings.includes(s.date));
    
    let weekTotalTime = 0;
    const weekSessionsCountPerDay = new Array(7).fill(0);

    weekSessions.forEach(session => {
      const dur = session.actualCompletedMinutes || session.duration || 0;
      weekTotalTime += dur;
      
      const idx = weekDateStrings.indexOf(session.date);
      if (idx !== -1) {
        weekValues[idx] += dur;
        weekSessionsCountPerDay[idx] += 1;
      }
    });

    const weekBestSessionValue = Math.max(...weekValues, 0);

    const currentStreak = this.calculateCurrentStreak(sessions, getLocalDateString(now));

    const weekSummary: TabSummary = {
      card1: { label: 'Focus Time', value: this.formatMinutes(weekTotalTime), subtitle: 'Total focus time this week' },
      card2: { label: 'Sessions', value: weekSessions.length, subtitle: 'Total sessions this week' },
      card3: { label: 'Current Streak', value: `${currentStreak} Day${currentStreak === 1 ? '' : 's'}`, subtitle: 'Consecutive days with at least one focus session.' },
      card4: { label: 'Best Focus Day', value: this.formatMinutes(weekBestSessionValue), subtitle: 'Highest focus time in one day this week' },
    };

    // --- Year Summary and Year Graph ---
    const currentYear = now.getFullYear();
    const yearSessions = sessions.filter(s => new Date(s.startTime).getFullYear() === currentYear);
    
    let yearTotalTime = 0;
    const monthlyTotals = new Array(12).fill(0);
    const monthlySessionsCount = new Array(12).fill(0);
    
    yearSessions.forEach(s => {
      const dur = s.actualCompletedMinutes || s.duration || 0;
      yearTotalTime += dur;
      const month = new Date(s.startTime).getMonth();
      monthlyTotals[month] += dur;
      monthlySessionsCount[month] += 1;
    });

    const bestMonthVal = Math.max(...monthlyTotals, 0);

    const longestStreakYear = this.calculateLongestStreak(yearSessions);

    const yearTooltipLabels = MONTH_LABELS.map(m => m);

    const yearSummary: TabSummary = {
      card1: { label: 'Focus Time', value: this.formatMinutes(yearTotalTime), subtitle: 'Total focus time this year' },
      card2: { label: 'Sessions', value: yearSessions.length, subtitle: 'Total sessions this year' },
      card3: { label: 'Longest Streak', value: `${longestStreakYear} Day${longestStreakYear === 1 ? '' : 's'}`, subtitle: 'Longest consecutive-day streak this year.' },
      card4: { label: 'Best Focus Month', value: this.formatMinutes(bestMonthVal), subtitle: 'Highest focus time in one month' },
    };

    // --- Graphs ---
    const weekGraph = { labels: weekLabels, values: weekValues, sessions: weekSessionsCountPerDay, tooltipLabels: weekTooltipLabels };
    const yearGraph = { labels: [...MONTH_LABELS], values: monthlyTotals, sessions: monthlySessionsCount, tooltipLabels: yearTooltipLabels };

    this.cachedData = {
      summary: { week: weekSummary, year: yearSummary },
      graphs: { week: weekGraph, year: yearGraph }
    };
    
    this.lastSessionsRef = sessions;
    this.lastComputeDate = todayStr;
    return this.cachedData;
  }

  private static formatMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private static computeWeekGraphData(now: Date): { labels: string[]; values: number[]; dateStrings: string[]; tooltipLabels: string[] } {
    const labels: string[] = [];
    const values: number[] = new Array(7).fill(0);
    const dateStrings: string[] = [];
    const tooltipLabels: string[] = [];

    // Find the Monday of the current week
    const currentDay = now.getDay();
    // In JS getDay(), 0 is Sunday, 1 is Monday.
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const ds = getLocalDateString(d);
      dateStrings.push(ds);

      labels.push(`${DAY_LABELS[i]}\n${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`);
      tooltipLabels.push(`${DAY_LABELS[i]}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`);
    }

    return { labels, values, dateStrings, tooltipLabels };
  }

  private static calculateCurrentStreak(sessions: FocusSession[], todayStr: string): number {
    const dates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
    if (dates.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date(todayStr);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0; // Streak broken
    }

    let expectedDateStr = dates[0];
    for (const d of dates) {
      if (d === expectedDateStr) {
        currentStreak++;
        const prev = new Date(expectedDateStr);
        prev.setDate(prev.getDate() - 1);
        expectedDateStr = getLocalDateString(prev);
      } else {
        break;
      }
    }

    return currentStreak;
  }

  private static calculateLongestStreak(sessions: FocusSession[]): number {
    const dates = Array.from(new Set(sessions.map(s => s.date))).sort();
    if (dates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const expectedNext = new Date(prevDate);
      expectedNext.setDate(prevDate.getDate() + 1);
      
      if (dates[i] === getLocalDateString(expectedNext)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }
}
