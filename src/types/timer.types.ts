/**
 * FocusFlow Types — Timer / Focus Sessions / Statistics
 */

// ─── Timer Core ────────────────────────────────────────────────────────────────

export type TimerMode = 'FOCUS' | 'BREAK' | 'LONG_BREAK';
export type TimerStatus = 'idle' | 'running' | 'paused';
export type SessionMode = 'focus' | 'break' | 'long break';
export type CompletionStatus = 'completed' | 'interrupted' | 'skipped';

// ─── Settings Limits ───────────────────────────────────────────────────────────

export const SETTINGS_LIMITS = {
  focusTime: { min: 5, max: 120, step: 1, default: 25 },
  shortBreakTime: { min: 1, max: 30, step: 1, default: 5 },
  longBreakTime: { min: 5, max: 30, step: 1, default: 15 },
  cycles: { min: 1, max: 10, step: 1, default: 4 },
} as const;

// ─── Focus Session ─────────────────────────────────────────────────────────────

export interface FocusSession {
  _id: string;
  user: string;
  duration: number;               // configured duration in minutes
  actualCompletedMinutes: number;  // actual completed minutes
  startTime: string;               // ISO string
  endTime: string;                 // ISO string
  date: string;                    // YYYY-MM-DD local date
  day: string;                     // e.g. "Mon", "Tue"
  week: number;                    // ISO week number
  month: string;                   // e.g. "Jan", "Feb"
  year: number;                    // e.g. 2026
  mode: SessionMode;
  completionStatus: CompletionStatus;
  interrupted: boolean;
  task: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  duration: number;
  actualCompletedMinutes: number;
  startTime: Date | string;
  endTime: Date | string;
  date: Date | string;
  mode: SessionMode;
  interrupted: boolean;
  task?: string | null;
}

// ─── Graph Data ────────────────────────────────────────────────────────────────

export interface GraphPoint {
  x: number;
  y: number;
  val: number;
}

export interface GraphData {
  points: GraphPoint[];
  path: string;
  areaPath: string;
  labels: string[];
  highestPoint: GraphPoint;
}

export interface TodayHourlyData {
  hour: number;     // 0-23
  label: string;    // e.g. "06 AM"
  minutes: number;  // total focus minutes in that hour
}

export interface WeekDayData {
  day: string;      // "Mon" - "Sun"
  minutes: number;
}

export interface MonthData {
  month: string;    // "Jan" - "Dec"
  minutes: number;
}

// ─── Activity Summary ──────────────────────────────────────────────────────────

export interface ActivitySummary {
  totalFocusTime: number;    // total minutes
  totalSessions: number;     // count
  avgSessionDuration: number; // minutes per session (rounded)
  bestDayTime: number;       // minutes
}

// ─── Timer State ───────────────────────────────────────────────────────────────

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingTime: number;        // seconds
  totalDuration: number;        // seconds
  sessionStartTime: number | null; // Date.now() timestamp
  pauseTime: number | null;
  elapsedTime: number;          // seconds
  completedPomodoros: number;

  // Stats (derived from sessions)
  todayFocusTime: number;
  todayFocusCount: number;
  totalFocusTime: number;
  totalSessions: number;
  avgSessionDuration: number;
  bestDayTime: number;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  switchMode: (mode: TimerMode) => void;
  tick: () => void;
  setDurations: (focus: number, shortBreak: number, longBreak: number) => void;
  hydrateTimer: () => Promise<void>;
}
