import { ActivityRepository } from './ActivityRepository';
import { StatisticsCalculator, FullActivityData } from './StatisticsCalculator';

export class ActivityService {
  /**
   * Utility to fetch sessions and compute all stats in one go
   * Useful for initializing a store state
   */
  static getFullActivityState(): FullActivityData {
    const sessions = ActivityRepository.getValidFocusSessions();
    return StatisticsCalculator.computeFullActivityData(sessions);
  }
}
