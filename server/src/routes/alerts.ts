import { Router, Request, Response } from 'express';
import {
  getThresholds,
  setThresholds,
  resetThresholds,
  DEFAULT_THRESHOLDS,
  AlertThresholds,
} from '../services/alerts.js';

const router = Router();

// GET /api/alerts/thresholds - Return current thresholds
router.get('/thresholds', (_req: Request, res: Response) => {
  try {
    const thresholds = getThresholds();
    res.json({
      thresholds,
      defaults: DEFAULT_THRESHOLDS,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get alert thresholds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/alerts/thresholds - Update thresholds
router.post('/thresholds', (req: Request, res: Response) => {
  try {
    const updates: Partial<AlertThresholds> = req.body;

    // Validate input
    const validTypes = ['cpu', 'gpu_temp', 'memory', 'disk'] as const;
    for (const type of validTypes) {
      if (updates[type]) {
        const { warning, critical } = updates[type]!;
        if (typeof warning !== 'number' || typeof critical !== 'number') {
          res.status(400).json({
            error: 'Invalid threshold values',
            message: `${type} thresholds must have numeric warning and critical values`,
          });
          return;
        }
        if (warning < 0 || warning > 100 || critical < 0 || critical > 100) {
          res.status(400).json({
            error: 'Invalid threshold range',
            message: `${type} thresholds must be between 0 and 100`,
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

    const updatedThresholds = setThresholds(updates);
    res.json({
      message: 'Thresholds updated successfully',
      thresholds: updatedThresholds,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update alert thresholds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/alerts/thresholds/reset - Reset to defaults
router.post('/thresholds/reset', (_req: Request, res: Response) => {
  try {
    const thresholds = resetThresholds();
    res.json({
      message: 'Thresholds reset to defaults',
      thresholds,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset alert thresholds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
