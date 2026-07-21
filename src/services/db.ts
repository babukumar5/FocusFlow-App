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
        browserNotifications INTEGER,
        autoStartBreaks INTEGER,
        hasCompletedOnboarding INTEGER,
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
          longBreakTime, theme, browserNotifications, autoStartBreaks,
          hasCompletedOnboarding, backgroundMusic, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        1, 
        defaultSettings.focusTime, 
        defaultSettings.shortBreakTime, 
        defaultSettings.cycles, 
        0, 
        0, 
        0,
        defaultSettings.longBreakTime,
        defaultSettings.theme,
        defaultSettings.browserNotifications ? 1 : 0,
        defaultSettings.autoStartBreaks ? 1 : 0,
        defaultSettings.hasCompletedOnboarding ? 1 : 0,
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
  try {
    return db.getFirstSync<{ id: number; username: string; createdAt: number }>('SELECT * FROM User LIMIT 1');
  } catch (error) {
    console.error("Database: Failed to get user", error);
    return null;
  }
};

export const createUser = (username: string) => {
  if (!db) return;
  try {
    db.runSync('INSERT INTO User (username, createdAt) VALUES (?, ?)', [username, Date.now()]);
  } catch (error) {
    console.error("Database: Failed to create user", error);
  }
};

export const deleteUser = () => {
  if (!db) return;
  try {
    db.runSync('DELETE FROM User');
    db.runSync('DELETE FROM Sessions');
    // Reset settings
    updateSettings(defaultSettings);
  } catch (error) {
    console.error("Database: Failed to delete user", error);
  }
};

// ─── Settings Functions ──────────────────────────────────────────────────────

export const getSettings = (): UserSettings => {
  if (!db) return defaultSettings;
  try {
    const row = db.getFirstSync<any>('SELECT * FROM Settings WHERE id = 1');
    if (!row) return defaultSettings;
    
    return {
      focusTime: row.focusDuration ?? defaultSettings.focusTime,
      shortBreakTime: row.breakDuration ?? defaultSettings.shortBreakTime,
      longBreakTime: row.longBreakTime ?? defaultSettings.longBreakTime,
      cycles: row.cycles ?? defaultSettings.cycles,
      theme: row.theme || defaultSettings.theme,
      browserNotifications: row.browserNotifications === 1,
      autoStartBreaks: row.autoStartBreaks === 1,
      hasCompletedOnboarding: row.hasCompletedOnboarding === 1,
      backgroundMusic: row.backgroundMusic ?? defaultSettings.backgroundMusic,
      language: row.language ?? defaultSettings.language,
    };
  } catch (error) {
    console.error("Database: Failed to get settings", error);
    return defaultSettings;
  }
};

export const updateSettings = (settings: Partial<UserSettings>) => {
  if (!db) return;
  try {
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
        browserNotifications = ?,
        autoStartBreaks = ?,
        hasCompletedOnboarding = ?,
        backgroundMusic = ?,
        language = ?
      WHERE id = 1
    `, [
      merged.focusTime,
      merged.shortBreakTime,
      merged.cycles,
      0,
      0,
      0,
      merged.longBreakTime,
      merged.theme,
      merged.browserNotifications ? 1 : 0,
      merged.autoStartBreaks ? 1 : 0,
      merged.hasCompletedOnboarding ? 1 : 0,
      merged.backgroundMusic,
      merged.language
    ]);
  } catch (error) {
    console.error("Database: Failed to update settings", error);
  }
};

// ─── Session Functions ───────────────────────────────────────────────────────

export const insertSession = (session: FocusSession) => {
  if (!db) return;
  try {
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
      session.completionStatus === 'completed' ? 1 : 0,
      Date.now()
    ]);
  } catch (error) {
    console.error("Database: Failed to insert session", error);
  }
};

export const getCompletedSessions = (): FocusSession[] => {
  if (!db) return [];
  try {
    const rows = db.getAllSync<any>('SELECT * FROM Sessions WHERE completed = 1 ORDER BY startTime DESC');
    return rows.map(row => {
      const startTimeStr = new Date(row.startTime).toISOString();
      return {
        _id: row.id,
        date: row.date,
        startTime: startTimeStr,
        endTime: new Date(row.endTime).toISOString(),
        duration: row.duration,
        actualCompletedMinutes: row.duration,
        mode: row.mode as any,
        completionStatus: (row.completed === 1 ? 'completed' : 'interrupted') as any,
        interrupted: row.completed !== 1,
        user: 'local-user',
        day: '',
        week: 0,
        month: '',
        year: new Date(row.startTime).getFullYear(),
        task: null,
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.createdAt).toISOString(),
      };
    });
  } catch (error) {
    console.error("Database: Failed to get completed sessions", error);
    return [];
  }
};


