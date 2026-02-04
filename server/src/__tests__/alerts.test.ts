import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAlerts,
  getThresholds,
  setThresholds,
  resetThresholds,
  DEFAULT_THRESHOLDS,
  type MetricsData,
  type AlertThresholds,
} from '../services/alerts.js';

// Note: The alerts service uses shallow copies, so we need to be careful
// about mutating returned objects in tests

describe('Alert Service', () => {
  // Reset thresholds before each test suite to ensure clean state
  beforeEach(() => {
    // Reset to known values by setting explicit thresholds
    setThresholds({
      cpu: { warning: 80, critical: 90 },
      gpu_temp: { warning: 75, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 85, critical: 95 },
    });
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should have correct default threshold structure', () => {
      expect(DEFAULT_THRESHOLDS.cpu).toBeDefined();
      expect(DEFAULT_THRESHOLDS.gpu_temp).toBeDefined();
      expect(DEFAULT_THRESHOLDS.memory).toBeDefined();
      expect(DEFAULT_THRESHOLDS.disk).toBeDefined();
    });
  });

  describe('getThresholds', () => {
    it('should return current thresholds', () => {
      const thresholds = getThresholds();
      expect(thresholds.cpu.warning).toBe(80);
      expect(thresholds.cpu.critical).toBe(90);
    });

    it('should return thresholds with all required types', () => {
      const thresholds = getThresholds();
      expect(thresholds).toHaveProperty('cpu');
      expect(thresholds).toHaveProperty('gpu_temp');
      expect(thresholds).toHaveProperty('memory');
      expect(thresholds).toHaveProperty('disk');
    });
  });

  describe('setThresholds', () => {
    it('should update specific thresholds', () => {
      const newCpuThreshold = { warning: 70, critical: 85 };
      const updated = setThresholds({ cpu: newCpuThreshold });

      expect(updated.cpu).toEqual(newCpuThreshold);
      expect(updated.memory).toEqual(DEFAULT_THRESHOLDS.memory);
    });

    it('should update multiple thresholds at once', () => {
      const updates: Partial<AlertThresholds> = {
        cpu: { warning: 70, critical: 85 },
        memory: { warning: 75, critical: 88 },
      };
      const updated = setThresholds(updates);

      expect(updated.cpu).toEqual(updates.cpu);
      expect(updated.memory).toEqual(updates.memory);
    });

    it('should preserve unmodified thresholds', () => {
      setThresholds({ cpu: { warning: 70, critical: 85 } });
      const thresholds = getThresholds();

      expect(thresholds.gpu_temp).toEqual(DEFAULT_THRESHOLDS.gpu_temp);
      expect(thresholds.disk).toEqual(DEFAULT_THRESHOLDS.disk);
    });
  });

  describe('resetThresholds', () => {
    it('should reset thresholds to defaults', () => {
      setThresholds({
        cpu: { warning: 50, critical: 60 },
        memory: { warning: 50, critical: 60 },
      });

      const reset = resetThresholds();
      expect(reset).toEqual(DEFAULT_THRESHOLDS);
    });
  });

  describe('checkAlerts', () => {
    const createMetrics = (overrides: Partial<MetricsData> = {}): MetricsData => ({
      timestamp: '2024-01-15T10:00:00Z',
      cpu: { usage: 50, temperature: null },
      memory: { used: 8000000000, percentage: 50 },
      gpu: null,
      brain: { active: 'code' },
      ollama: { models_loaded: [] },
      ...overrides,
    });

    it('should return empty array when all values are below thresholds', () => {
      const metrics = createMetrics();
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(0);
    });

    it('should return CPU warning when CPU exceeds warning threshold', () => {
      // Use explicit thresholds to ensure consistent behavior
      const thresholds: AlertThresholds = {
        cpu: { warning: 80, critical: 90 },
        gpu_temp: { warning: 75, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 85, critical: 95 },
      };
      const metrics = createMetrics({
        cpu: { usage: 85, temperature: null },
      });
      const alerts = checkAlerts(metrics, thresholds);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('cpu');
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].threshold).toBe(80);
    });

    it('should return CPU critical when CPU exceeds critical threshold', () => {
      const metrics = createMetrics({
        cpu: { usage: 95, temperature: null },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('cpu');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].threshold).toBe(90);
    });

    it('should return memory warning when memory exceeds warning threshold', () => {
      const metrics = createMetrics({
        memory: { used: 8000000000, percentage: 85 },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('memory');
      expect(alerts[0].severity).toBe('warning');
    });

    it('should return memory critical when memory exceeds critical threshold', () => {
      const metrics = createMetrics({
        memory: { used: 8000000000, percentage: 95 },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('memory');
      expect(alerts[0].severity).toBe('critical');
    });

    it('should return GPU temperature warning when GPU temp exceeds warning threshold', () => {
      const metrics = createMetrics({
        gpu: {
          utilization: 50,
          memory_used: 4000,
          temperature: 80,
          power_draw: 150,
        },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('gpu_temp');
      expect(alerts[0].severity).toBe('warning');
    });

    it('should return GPU temperature critical when GPU temp exceeds critical threshold', () => {
      const metrics = createMetrics({
        gpu: {
          utilization: 50,
          memory_used: 4000,
          temperature: 90,
          power_draw: 150,
        },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('gpu_temp');
      expect(alerts[0].severity).toBe('critical');
    });

    it('should not check GPU temperature when GPU is null', () => {
      const metrics = createMetrics({ gpu: null });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(0);
    });

    it('should return multiple alerts when multiple thresholds are exceeded', () => {
      const metrics = createMetrics({
        cpu: { usage: 95, temperature: null },
        memory: { used: 8000000000, percentage: 95 },
        gpu: {
          utilization: 50,
          memory_used: 4000,
          temperature: 90,
          power_draw: 150,
        },
      });
      const alerts = checkAlerts(metrics);

      expect(alerts).toHaveLength(3);
      expect(alerts.map((a) => a.type)).toContain('cpu');
      expect(alerts.map((a) => a.type)).toContain('memory');
      expect(alerts.map((a) => a.type)).toContain('gpu_temp');
    });

    it('should use custom thresholds when provided', () => {
      const customThresholds: AlertThresholds = {
        cpu: { warning: 50, critical: 60 },
        gpu_temp: { warning: 50, critical: 60 },
        memory: { warning: 50, critical: 60 },
        disk: { warning: 50, critical: 60 },
      };

      // CPU at 55 should trigger warning (> 50), memory at 30 should not trigger
      const metrics = createMetrics({
        cpu: { usage: 55, temperature: null },
        memory: { used: 8000000000, percentage: 30 },
      });
      const alerts = checkAlerts(metrics, customThresholds);

      // Only CPU should trigger (memory is below threshold)
      const cpuAlerts = alerts.filter((a) => a.type === 'cpu');
      expect(cpuAlerts).toHaveLength(1);
      expect(cpuAlerts[0].type).toBe('cpu');
      expect(cpuAlerts[0].severity).toBe('warning');
      expect(cpuAlerts[0].threshold).toBe(50);
    });

    it('should include value in alert', () => {
      const thresholds: AlertThresholds = {
        cpu: { warning: 80, critical: 90 },
        gpu_temp: { warning: 75, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 85, critical: 95 },
      };
      const metrics = createMetrics({
        cpu: { usage: 85.5, temperature: null },
      });
      const alerts = checkAlerts(metrics, thresholds);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].value).toBe(85.5);
    });

    it('should include message in alert', () => {
      const thresholds: AlertThresholds = {
        cpu: { warning: 80, critical: 90 },
        gpu_temp: { warning: 75, critical: 85 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 85, critical: 95 },
      };
      const metrics = createMetrics({
        cpu: { usage: 85, temperature: null },
      });
      const alerts = checkAlerts(metrics, thresholds);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].message).toContain('CPU usage');
      expect(alerts[0].message).toContain('85.0%');
    });
  });
});
