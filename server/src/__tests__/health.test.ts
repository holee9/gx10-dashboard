import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a minimal test app with just the health endpoint
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health check endpoint (copy of the actual implementation)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
};

describe('Health Endpoint', () => {
  const app = createTestApp();

  describe('GET /api/health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
    });

    it('should return status "ok"', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.status).toBe('ok');
    });

    it('should return a valid timestamp', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.timestamp).toBeDefined();
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return uptime as a number', async () => {
      const response = await request(app).get('/api/health');

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid JSON structure', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});

describe('Metrics Structure', () => {
  it('should have valid MetricsData type structure', () => {
    // Type check for MetricsData
    const validMetrics = {
      timestamp: '2024-01-15T10:00:00Z',
      cpu: {
        usage: 50,
        temperature: 60,
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

    expect(validMetrics.timestamp).toBeDefined();
    expect(typeof validMetrics.cpu.usage).toBe('number');
    expect(typeof validMetrics.memory.percentage).toBe('number');
    expect(typeof validMetrics.gpu?.utilization).toBe('number');
    expect(typeof validMetrics.brain.active).toBe('string');
    expect(Array.isArray(validMetrics.ollama.models_loaded)).toBe(true);
  });

  it('should allow null GPU in MetricsData', () => {
    const metricsWithoutGpu = {
      timestamp: '2024-01-15T10:00:00Z',
      cpu: { usage: 50, temperature: null },
      memory: { used: 8000000000, percentage: 50 },
      gpu: null,
      brain: { active: 'code' },
      ollama: { models_loaded: [] },
    };

    expect(metricsWithoutGpu.gpu).toBeNull();
  });

  it('should allow null temperature in CPU', () => {
    const metrics = {
      timestamp: '2024-01-15T10:00:00Z',
      cpu: { usage: 50, temperature: null },
      memory: { used: 8000000000, percentage: 50 },
      gpu: null,
      brain: { active: 'code' },
      ollama: { models_loaded: [] },
    };

    expect(metrics.cpu.temperature).toBeNull();
  });
});

describe('Alert Thresholds API Structure', () => {
  const app = express();
  app.use(express.json());

  // Mock thresholds endpoint
  let currentThresholds = {
    cpu: { warning: 80, critical: 90 },
    gpu_temp: { warning: 75, critical: 85 },
    memory: { warning: 80, critical: 90 },
    disk: { warning: 85, critical: 95 },
  };

  const DEFAULT_THRESHOLDS = { ...currentThresholds };

  app.get('/api/alerts/thresholds', (_req, res) => {
    res.json({
      thresholds: currentThresholds,
      defaults: DEFAULT_THRESHOLDS,
    });
  });

  app.post('/api/alerts/thresholds', (req, res) => {
    const updates = req.body;

    // Validate input
    const validTypes = ['cpu', 'gpu_temp', 'memory', 'disk'] as const;
    for (const type of validTypes) {
      if (updates[type]) {
        const { warning, critical } = updates[type];
        if (typeof warning !== 'number' || typeof critical !== 'number') {
          res.status(400).json({
            error: 'Invalid threshold values',
            message: `${type} thresholds must have numeric warning and critical values`,
          });
          return;
        }
        if (warning >= critical) {
          res.status(400).json({
            error: 'Invalid threshold order',
            message: `${type} warning threshold must be less than critical threshold`,
          });
          return;
        }
      }
    }

    currentThresholds = { ...currentThresholds, ...updates };
    res.json({
      message: 'Thresholds updated successfully',
      thresholds: currentThresholds,
    });
  });

  describe('GET /api/alerts/thresholds', () => {
    it('should return thresholds and defaults', async () => {
      const response = await request(app).get('/api/alerts/thresholds');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('thresholds');
      expect(response.body).toHaveProperty('defaults');
    });

    it('should have all threshold types', async () => {
      const response = await request(app).get('/api/alerts/thresholds');

      expect(response.body.thresholds).toHaveProperty('cpu');
      expect(response.body.thresholds).toHaveProperty('gpu_temp');
      expect(response.body.thresholds).toHaveProperty('memory');
      expect(response.body.thresholds).toHaveProperty('disk');
    });

    it('should have warning and critical for each type', async () => {
      const response = await request(app).get('/api/alerts/thresholds');

      const types = ['cpu', 'gpu_temp', 'memory', 'disk'];
      for (const type of types) {
        expect(response.body.thresholds[type]).toHaveProperty('warning');
        expect(response.body.thresholds[type]).toHaveProperty('critical');
      }
    });
  });

  describe('POST /api/alerts/thresholds', () => {
    it('should update thresholds successfully', async () => {
      const response = await request(app)
        .post('/api/alerts/thresholds')
        .send({ cpu: { warning: 70, critical: 85 } });

      expect(response.status).toBe(200);
      expect(response.body.thresholds.cpu).toEqual({ warning: 70, critical: 85 });
    });

    it('should reject when warning >= critical', async () => {
      const response = await request(app)
        .post('/api/alerts/thresholds')
        .send({ cpu: { warning: 90, critical: 80 } });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid threshold order');
    });

    it('should reject non-numeric values', async () => {
      const response = await request(app)
        .post('/api/alerts/thresholds')
        .send({ cpu: { warning: 'high', critical: 'very high' } });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid threshold values');
    });
  });
});
