import { Router, Request, Response } from 'express';
import {
  getConfig,
  updateConfig,
  resetConfig,
  getDefaultConfig,
  DashboardConfig,
} from '../config.js';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', (_req: Request, res: Response) => {
  try {
    const config = getConfig();
    const defaults = getDefaultConfig();
    res.json({
      config,
      defaults,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/settings - Update settings
router.put('/', (req: Request, res: Response) => {
  try {
    const updates: Partial<DashboardConfig> = req.body;

    // Validate server settings
    if (updates.server) {
      if (updates.server.port !== undefined) {
        if (typeof updates.server.port !== 'number' || updates.server.port < 1 || updates.server.port > 65535) {
          res.status(400).json({
            error: 'Invalid port value',
            message: 'Port must be a number between 1 and 65535',
          });
          return;
        }
      }
      if (updates.server.updateInterval !== undefined) {
        if (typeof updates.server.updateInterval !== 'number' || updates.server.updateInterval < 500) {
          res.status(400).json({
            error: 'Invalid update interval',
            message: 'Update interval must be at least 500ms',
          });
          return;
        }
      }
    }

    // Validate alert settings
    if (updates.alerts?.thresholds) {
      const validTypes = ['cpu', 'gpu_temp', 'memory', 'disk'] as const;
      for (const type of validTypes) {
        const threshold = updates.alerts.thresholds[type];
        if (threshold) {
          const { warning, critical } = threshold;
          if (warning !== undefined && (typeof warning !== 'number' || warning < 0 || warning > 100)) {
            res.status(400).json({
              error: 'Invalid threshold value',
              message: `${type} warning threshold must be a number between 0 and 100`,
            });
            return;
          }
          if (critical !== undefined && (typeof critical !== 'number' || critical < 0 || critical > 100)) {
            res.status(400).json({
              error: 'Invalid threshold value',
              message: `${type} critical threshold must be a number between 0 and 100`,
            });
            return;
          }
          // If both are provided, ensure warning < critical
          if (warning !== undefined && critical !== undefined && warning >= critical) {
            res.status(400).json({
              error: 'Invalid threshold order',
              message: `${type} warning threshold must be less than critical threshold`,
            });
            return;
          }
        }
      }
    }

    const updatedConfig = updateConfig(updates);
    res.json({
      message: 'Settings updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/settings/reset - Reset to defaults
router.post('/reset', (_req: Request, res: Response) => {
  try {
    const config = resetConfig();
    res.json({
      message: 'Settings reset to defaults',
      config,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
