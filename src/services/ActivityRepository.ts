import { getCompletedSessions } from './db';
import { FocusSession } from '../types/timer.types';

export class ActivityRepository {
  /**
   * Retrieves all completed focus sessions, sanitizing the data to remove
   * any corrupted, invalid, or non-focus sessions.
   */
  static getValidFocusSessions(): FocusSession[] {
    try {
      const rawSessions = getCompletedSessions();
      
      return rawSessions.filter(session => {
        // Must be a focus session
        if (session.mode !== 'focus') return false;
        
        // Must be completed
        if (session.completionStatus !== 'completed') return false;

        // Ensure duration is present (fallback to actualCompletedMinutes if duration is not there)
        const duration = session.duration || (session as any).actualCompletedMinutes;
        
        // Must have valid duration (> 0 and < 1440 minutes / 24 hours to prevent crazy data)
        if (typeof duration !== 'number' || duration <= 0 || duration > 1440) return false;

        // Must have valid startTime and endTime
        if (!session.startTime || isNaN(new Date(session.startTime).getTime())) return false;
        if (!session.endTime || isNaN(new Date(session.endTime).getTime())) return false;

        return true;
      });
    } catch (error) {
      console.error("ActivityRepository: Failed to get valid focus sessions", error);
      return [];
    }
  }
}
