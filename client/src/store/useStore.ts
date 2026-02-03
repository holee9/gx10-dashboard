import { create } from 'zustand';
import type { FullStatus, MetricsData } from '../types';

interface MetricsHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  gpu: number | null;
}

interface DashboardStore {
  // Data
  status: FullStatus | null;
  metrics: MetricsData | null;
  metricsHistory: MetricsHistory[];

  // Connection state
  connected: boolean;
  lastUpdate: string | null;
  error: string | null;

  // Actions
  setStatus: (status: FullStatus) => void;
  setMetrics: (metrics: MetricsData) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  updateBrainMode: (mode: 'code' | 'vision') => void;
}

const MAX_HISTORY = 60; // 2 minutes of data at 2-second intervals

export const useStore = create<DashboardStore>((set) => ({
  status: null,
  metrics: null,
  metricsHistory: [],
  connected: false,
  lastUpdate: null,
  error: null,

  setStatus: (status) =>
    set({
      status,
      lastUpdate: new Date().toISOString(),
      error: null,
    }),

  setMetrics: (metrics) =>
    set((state) => {
      const newHistory: MetricsHistory = {
        timestamp: metrics.timestamp,
        cpu: metrics.cpu.usage,
        memory: metrics.memory.percentage,
        gpu: metrics.gpu?.utilization ?? null,
      };

      const history = [...state.metricsHistory, newHistory].slice(-MAX_HISTORY);

      return {
        metrics,
        metricsHistory: history,
        lastUpdate: new Date().toISOString(),
        error: null,
      };
    }),

  setConnected: (connected) => set({ connected }),

  setError: (error) => set({ error }),

  updateBrainMode: (mode) =>
    set((state) => {
      if (!state.status) return state;
      return {
        status: {
          ...state.status,
          brain: {
            ...state.status.brain,
            active: mode,
          },
        },
      };
    }),
}));
