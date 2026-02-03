import { Router, Request, Response } from 'express';
import {
  getBrainStatus,
  switchBrain,
  getBrainHistory,
  checkBrainScriptsAvailable,
  BrainMode,
} from '../services/brain.js';

const router = Router();

// GET /api/brain - Current brain status
router.get('/', async (_req: Request, res: Response) => {
  try {
    const status = await getBrainStatus();
    const scriptsAvailable = await checkBrainScriptsAvailable();

    res.json({
      ...status,
      scripts_available: scriptsAvailable,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get brain status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/brain/switch - Switch brain mode
router.post('/switch', async (req: Request, res: Response) => {
  try {
    const { target } = req.body as { target?: string };

    if (!target || (target !== 'code' && target !== 'vision')) {
      res.status(400).json({
        error: 'Invalid target',
        message: 'Target must be "code" or "vision"',
      });
      return;
    }

    const result = await switchBrain(target as BrainMode);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to switch brain',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/brain/history - Switch history
router.get('/history', (_req: Request, res: Response) => {
  try {
    const history = getBrainHistory();
    res.json({ history });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get brain history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
