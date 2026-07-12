import * as SQLite from 'expo-sqlite';
import { UserSettings } from '../types/auth.types';
import { FocusSession } from '../types/timer.types';
import { defaultSettings } from '../constants/defaultSettings';

// Initialize Database
let db: SQLite.SQLiteDatabase;

try {
  db = SQLite.openDatabaseSync('focusflow.db');
} catch (e) {
  console.error("Failed to open database", e);
}

// ─── Schema Setup ─────────────────────────────────────────────────────────────

export const initDB = () => {
  if (!db) return;
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        focusDuration INTEGER,
        breakDuration INTEGER,
        cycles INTEGER,
        notificationsEnabled INTEGER,
        amoledMode INTEGER,
        autoStartFocus INTEGER,
        
        -- Additional settings to keep the app working seamlessly
        longBreakTime INTEGER,
        theme TEXT,
        soundType TEXT,
        soundVolume REAL,
        browserNotifications INTEGER,
        autoStartBreaks INTEGER,
        hasCompletedOnboarding INTEGER,
        timerSoundEnabled INTEGER,
        backgroundMusic TEXT,
        language TEXT
      );

      CREATE TABLE IF NOT EXISTS Sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        startTime INTEGER,
        endTime INTEGER,
        duration INTEGER,
        mode TEXT,
        completed INTEGER,
        createdAt INTEGER
      );
    `);

    // Ensure at least one settings row exists
    const settingsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM Settings');
    if (settingsCount && settingsCount.count === 0) {
      db.runSync(`
        INSERT INTO Settings (
          id, focusDuration, breakDuration, cycles, notificationsEnabled, amoledMode, autoStartFocus,
          longBreakTime, theme, soundType, soundVolume, browserNotifications, autoStartBreaks,
          hasCompletedOnboarding, timerSoundEnabled, backgroundMusic, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        1, 
        defaultSettings.focusTime, 
        defaultSettings.shortBreakTime, 
        defaultSettings.cycles, 
        defaultSettings.notifications ? 1 : 0, 
        defaultSettings.theme === 'amoled' ? 1 : 0, 
        defaultSettings.autoStartTimers ? 1 : 0,
        defaultSettings.longBreakTime,
        defaultSettings.theme,
        defaultSettings.soundType,
        defaultSettings.soundVolume,
        defaultSettings.browserNotifications ? 1 : 0,
        defaultSettings.autoStartBreaks ? 1 : 0,
        defaultSettings.hasCompletedOnboarding ? 1 : 0,
        defaultSettings.timerSoundEnabled ? 1 : 0,
        defaultSettings.backgroundMusic,
        defaultSettings.language
      ]);
    }
  } catch (error) {
    console.error("Database initialization failed", error);
  }
};

// ─── User Functions ──────────────────────────────────────────────────────────

export const getUser = () => {
  if (!db) return null;
  return db.getFirstSync<{ id: number; username: string; createdAt: number }>('SELECT * FROM User LIMIT 1');
};

export const createUser = (username: string) => {
  if (!db) return;
  db.runSync('INSERT INTO User (username, createdAt) VALUES (?, ?)', [username, Date.now()]);
};

export const deleteUser = () => {
  if (!db) return;
  db.runSync('DELETE FROM User');
  db.runSync('DELETE FROM Sessions');
  // Reset settings
  updateSettings(defaultSettings);
};

// ─── Settings Functions ──────────────────────────────────────────────────────

export const getSettings = (): UserSettings => {
  if (!db) return defaultSettings;
  const row = db.getFirstSync<any>('SELECT * FROM Settings WHERE id = 1');
  if (!row) return defaultSettings;
  
  return {
    focusTime: row.focusDuration,
    shortBreakTime: row.breakDuration,
    longBreakTime: row.longBreakTime,
    cycles: row.cycles,
    theme: row.amoledMode === 1 ? 'amoled' : (row.theme || 'dark'),
    soundType: row.soundType,
    soundVolume: row.soundVolume,
    browserNotifications: row.browserNotifications === 1,
    autoStartBreaks: row.autoStartBreaks === 1,
    autoStartTimers: row.autoStartFocus === 1,
    hasCompletedOnboarding: row.hasCompletedOnboarding === 1,
    timerSoundEnabled: row.timerSoundEnabled === 1,
    backgroundMusic: row.backgroundMusic,
    language: row.language,
    notifications: row.notificationsEnabled === 1,
  };
};

export const updateSettings = (settings: Partial<UserSettings>) => {
  if (!db) return;
  const current = getSettings();
  const merged = { ...current, ...settings };
  
  db.runSync(`
    UPDATE Settings 
    SET 
      focusDuration = ?,
      breakDuration = ?,
      cycles = ?,
      notificationsEnabled = ?,
      amoledMode = ?,
      autoStartFocus = ?,
      longBreakTime = ?,
      theme = ?,
      soundType = ?,
      soundVolume = ?,
      browserNotifications = ?,
      autoStartBreaks = ?,
      hasCompletedOnboarding = ?,
      timerSoundEnabled = ?,
      backgroundMusic = ?,
      language = ?
    WHERE id = 1
  `, [
    merged.focusTime,
    merged.shortBreakTime,
    merged.cycles,
    merged.notifications ? 1 : 0,
    merged.theme === 'amoled' ? 1 : 0,
    merged.autoStartTimers ? 1 : 0,
    merged.longBreakTime,
    merged.theme,
    merged.soundType,
    merged.soundVolume,
    merged.browserNotifications ? 1 : 0,
    merged.autoStartBreaks ? 1 : 0,
    merged.hasCompletedOnboarding ? 1 : 0,
    merged.timerSoundEnabled ? 1 : 0,
    merged.backgroundMusic,
    merged.language
  ]);
};

// ─── Session Functions ───────────────────────────────────────────────────────

export const insertSession = (session: FocusSession) => {
  if (!db) return;
  db.runSync(`
    INSERT OR REPLACE INTO Sessions (id, date, startTime, endTime, duration, mode, completed, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    session._id,
    session.date,
    session.startTime,
    session.endTime,
    session.duration,
    session.mode,
    session.completed ? 1 : 0,
    Date.now()
  ]);
};

export const getCompletedSessions = (): FocusSession[] => {
  if (!db) return [];
  const rows = db.getAllSync<any>('SELECT * FROM Sessions WHERE completed = 1 ORDER BY startTime DESC');
  return rows.map(row => ({
    _id: row.id,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration,
    mode: row.mode,
    completed: row.completed === 1
  }));
};


