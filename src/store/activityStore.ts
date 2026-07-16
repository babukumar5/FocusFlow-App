import { create } from 'zustand';
import { ActivityService } from '../services/ActivityService';
import { FullActivityData } from '../services/StatisticsCalculator';

export interface ActivityState extends FullActivityData {
  refresh: () => void;
}

const emptyCard = { label: '', value: '', subtitle: '' };
const emptySummary = { card1: emptyCard, card2: emptyCard, card3: emptyCard, card4: emptyCard };

export const useActivityStore = create<ActivityState>((set) => ({
  summary: {
    week: emptySummary,
    year: emptySummary,
  },
  graphs: {
    week: { labels: [], values: [], sessions: [], tooltipLabels: [] },
    year: { labels: [], values: [], sessions: [], tooltipLabels: [] },
  },

  refresh: () => {
    const fullState = ActivityService.getFullActivityState();
    
    set({
      summary: fullState.summary,
      graphs: fullState.graphs,
    });
  }
}));
