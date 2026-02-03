import { Router, Request, Response } from 'express';
import { getSystemInfo, getCpuInfo, getMemoryInfo, getDiskInfo } from '../services/system.js';
import { getGpuInfo, getGpuProcesses } from '../services/nvidia.js';
import { getBrainStatus } from '../services/brain.js';
import { getOllamaStatus } from '../services/ollama.js';

const router = Router();

// GET /api/status - Full system status
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [system, cpu, memory, disk, gpu, brain, ollama] = await Promise.all([
      getSystemInfo(),
      getCpuInfo(),
      getMemoryInfo(),
      getDiskInfo(),
      getGpuInfo(),
      getBrainStatus(),
      getOllamaStatus(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      system,
      cpu,
      memory,
      disk,
      gpu,
      brain,
      ollama: {
        status: ollama.status,
        version: ollama.version,
        models_loaded: ollama.running_models.map(m => m.name),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/status/system - System info only
router.get('/system', async (_req: Request, res: Response) => {
  try {
    const system = await getSystemInfo();
    res.json(system);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/status/gpu - GPU info with processes
router.get('/gpu', async (_req: Request, res: Response) => {
  try {
    const [gpu, processes] = await Promise.all([getGpuInfo(), getGpuProcesses()]);

    res.json({
      gpu,
      processes,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get GPU info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
