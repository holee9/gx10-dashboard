import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import type { FullStatus, MetricsData, Alert } from '../types';

// Reset the store before each test
beforeEach(() => {
  useStore.setState({
    status: null,
    metrics: null,
    metricsHistory: [],
    connected: false,
    lastUpdate: null,
    error: null,
    alerts: [],
    alertThresholds: {
      cpu: { warning: 80, critical: 90 },
      gpu_temp: { warning: 75, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
    },
    alertsEnabled: true,
    persistenceEnabled: true,
  });
});

describe('useStore', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStore.getState();

      expect(state.status).toBeNull();
      expect(state.metrics).toBeNull();
      expect(state.metricsHistory).toEqual([]);
      expect(state.connected).toBe(false);
      expect(state.lastUpdate).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should have default alert thresholds', () => {
      const state = useStore.getState();

      expect(state.alertThresholds).toEqual({
        cpu: { warning: 80, critical: 90 },
        gpu_temp: { warning: 75, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 85, critical: 95 },
      });
    });

    it('should have alerts enabled by default', () => {
      const state = useStore.getState();
      expect(state.alertsEnabled).toBe(true);
    });
  });

  describe('setStatus action', () => {
    it('should update status and lastUpdate', () => {
      const mockStatus: FullStatus = {
        timestamp: '2024-01-15T10:00:00Z',
        system: {
          hostname: 'test-host',
          uptime: 3600,
          os: 'Linux',
          kernel: '5.15.0',
          arch: 'x86_64',
        },
        cpu: {
          usage: 50,
          cores: 8,
          temperature: 60,
        },
        memory: {
          total: 16000000000,
          used: 8000000000,
          free: 8000000000,
          percentage: 50,
        },
        disk: [
          {
            total: 500000000000,
            used: 250000000000,
            free: 250000000000,
            percentage: 50,
            mountPoint: '/',
          },
        ],
        gpu: null,
        brain: {
          active: 'code',
          started_at: '2024-01-15T09:00:00Z',
          uptime_seconds: 3600,
        },
        ollama: {
          status: 'running',
          models_loaded: ['llama2'],
        },
      };

      useStore.getState().setStatus(mockStatus);
      const state = useStore.getState();

      expect(state.status).toEqual(mockStatus);
      expect(state.lastUpdate).not.toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('setMetrics action', () => {
    it('should update metrics and add to history', () => {
      const mockMetrics: MetricsData = {
        timestamp: '2024-01-15T10:00:00Z',
        cpu: {
          usage: 65,
          temperature: 55,
        },
        memory: {
          used: 8000000000,
          percentage: 50,
        },
        gpu: {
          utilization: 70,
          memory_used: 4000,
          temperature: 65,
          power_draw: 150,
        },
        brain: {
          active: 'code',
        },
        ollama: {
          models_loaded: ['llama2'],
        },
      };

      useStore.getState().setMetrics(mockMetrics);
      const state = useStore.getState();

      expect(state.metrics).toEqual(mockMetrics);
      expect(state.metricsHistory).toHaveLength(1);
      expect(state.metricsHistory[0].cpu).toBe(65);
      expect(state.metricsHistory[0].memory).toBe(50);
      expect(state.metricsHistory[0].gpu).toBe(70);
    });

    it('should maintain history up to MAX_HISTORY limit', () => {
      const MAX_HISTORY = 60;

      // Add more than MAX_HISTORY entries
      for (let i = 0; i < MAX_HISTORY + 10; i++) {
        const mockMetrics: MetricsData = {
          timestamp: `2024-01-15T10:${String(i).padStart(2, '0')}:00Z`,
          cpu: { usage: i, temperature: 50 },
          memory: { used: 8000000000, percentage: 50 },
          gpu: null,
          brain: { active: 'code' },
          ollama: { models_loaded: [] },
        };
        useStore.getState().setMetrics(mockMetrics);
      }

      const state = useStore.getState();
      expect(state.metricsHistory).toHaveLength(MAX_HISTORY);
    });

    it('should handle metrics without GPU data', () => {
      const mockMetrics: MetricsData = {
        timestamp: '2024-01-15T10:00:00Z',
        cpu: { usage: 50, temperature: null },
        memory: { used: 8000000000, percentage: 50 },
        gpu: null,
        brain: { active: 'code' },
        ollama: { models_loaded: [] },
      };

      useStore.getState().setMetrics(mockMetrics);
      const state = useStore.getState();

      expect(state.metricsHistory[0].gpu).toBeNull();
    });
  });

  describe('Alert generation from metrics', () => {
    it('should generate warning alert when threshold exceeded', () => {
      const mockMetrics: MetricsData = {
        timestamp: '2024-01-15T10:00:00Z',
        cpu: { usage: 85, temperature: 60 }, // Above warning threshold (80)
        memory: { used: 8000000000, percentage: 50 },
        gpu: null,
        brain: { active: 'code' },
        ollama: { models_loaded: [] },
      };

      useStore.getState().setMetrics(mockMetrics);
      const state = useStore.getState();

      expect(state.alerts.length).toBeGreaterThan(0);
      expect(state.alerts[0].type).toBe('cpu');
      expect(state.alerts[0].severity).toBe('warning');
    });

    it('should generate critical alert when critical threshold exceeded', () => {
      const mockMetrics: MetricsData = {
        timestamp: '2024-01-15T10:00:00Z',
        cpu: { usage: 95, temperature: 60 }, // Above critical threshold (90)
        memory: { used: 8000000000, percentage: 50 },
        gpu: null,
        brain: { active: 'code' },
        ollama: { models_loaded: [] },
      };

      useStore.getState().setMetrics(mockMetrics);
      const state = useStore.getState();

      expect(state.alerts.length).toBeGreaterThan(0);
      expect(state.alerts[0].severity).toBe('critical');
    });

    it('should not generate alerts when disabled', () => {
      useStore.getState().setAlertsEnabled(false);

      const mockMetrics: MetricsData = {
        timestamp: '2024-01-15T10:00:00Z',
        cpu: { usage: 95, temperature: 60 },
        memory: { used: 8000000000, percentage: 95 },
        gpu: null,
        brain: { active: 'code' },
        ollama: { models_loaded: [] },
      };

      useStore.getState().setMetrics(mockMetrics);
      const state = useStore.getState();

      expect(state.alerts).toHaveLength(0);
    });
  });

  describe('dismissAlert action', () => {
    it('should mark alert as dismissed', () => {
      const mockAlert: Alert = {
        id: 'test-alert-1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage high',
        value: 85,
        threshold: 80,
        timestamp: '2024-01-15T10:00:00Z',
        dismissed: false,
      };

      useStore.setState({ alerts: [mockAlert] });
      useStore.getState().dismissAlert('test-alert-1');
      const state = useStore.getState();

      expect(state.alerts[0].dismissed).toBe(true);
    });

    it('should not affect other alerts when dismissing one', () => {
      const alerts: Alert[] = [
        {
          id: 'test-alert-1',
          type: 'cpu',
          severity: 'warning',
          message: 'CPU usage high',
          value: 85,
          threshold: 80,
          timestamp: '2024-01-15T10:00:00Z',
          dismissed: false,
        },
        {
          id: 'test-alert-2',
          type: 'memory',
          severity: 'warning',
          message: 'Memory usage high',
          value: 85,
          threshold: 80,
          timestamp: '2024-01-15T10:00:00Z',
          dismissed: false,
        },
      ];

      useStore.setState({ alerts });
      useStore.getState().dismissAlert('test-alert-1');
      const state = useStore.getState();

      expect(state.alerts[0].dismissed).toBe(true);
      expect(state.alerts[1].dismissed).toBe(false);
    });
  });

  describe('clearAlerts action', () => {
    it('should clear all alerts', () => {
      const alerts: Alert[] = [
        {
          id: 'test-alert-1',
          type: 'cpu',
          severity: 'warning',
          message: 'CPU usage high',
          value: 85,
          threshold: 80,
          timestamp: '2024-01-15T10:00:00Z',
          dismissed: false,
        },
        {
          id: 'test-alert-2',
          type: 'memory',
          severity: 'critical',
          message: 'Memory usage critical',
          value: 95,
          threshold: 90,
          timestamp: '2024-01-15T10:00:00Z',
          dismissed: false,
        },
      ];

      useStore.setState({ alerts });
      useStore.getState().clearAlerts();
      const state = useStore.getState();

      expect(state.alerts).toHaveLength(0);
    });
  });

  describe('setAlertThresholds action', () => {
    it('should update alert thresholds', () => {
      const newThresholds = {
        cpu: { warning: 70, critical: 85 },
        gpu_temp: { warning: 70, critical: 80 },
        memory: { warning: 75, critical: 85 },
        disk: { warning: 80, critical: 90 },
      };

      useStore.getState().setAlertThresholds(newThresholds);
      const state = useStore.getState();

      expect(state.alertThresholds).toEqual(newThresholds);
    });
  });

  describe('Connection state', () => {
    it('should update connected state', () => {
      useStore.getState().setConnected(true);
      expect(useStore.getState().connected).toBe(true);

      useStore.getState().setConnected(false);
      expect(useStore.getState().connected).toBe(false);
    });

    it('should update error state', () => {
      useStore.getState().setError('Connection failed');
      expect(useStore.getState().error).toBe('Connection failed');

      useStore.getState().setError(null);
      expect(useStore.getState().error).toBeNull();
    });
  });

  describe('updateBrainMode action', () => {
    it('should update brain mode in status', () => {
      const mockStatus: FullStatus = {
        timestamp: '2024-01-15T10:00:00Z',
        system: {
          hostname: 'test-host',
          uptime: 3600,
          os: 'Linux',
          kernel: '5.15.0',
          arch: 'x86_64',
        },
        cpu: { usage: 50, cores: 8, temperature: 60 },
        memory: { total: 16000000000, used: 8000000000, free: 8000000000, percentage: 50 },
        disk: [],
        gpu: null,
        brain: { active: 'code', started_at: '2024-01-15T09:00:00Z', uptime_seconds: 3600 },
        ollama: { status: 'running', models_loaded: [] },
      };

      useStore.setState({ status: mockStatus });
      useStore.getState().updateBrainMode('vision');
      const state = useStore.getState();

      expect(state.status?.brain.active).toBe('vision');
    });

    it('should not update if status is null', () => {
      useStore.getState().updateBrainMode('vision');
      const state = useStore.getState();

      expect(state.status).toBeNull();
    });
  });
});
