import { Router, Request, Response } from 'express';
import { getCpuInfo, getMemoryInfo, getDiskInfo } from '../services/system.js';
import { getGpuInfo } from '../services/nvidia.js';
import { getOllamaStatus, getOllamaModels, getOllamaRunningModels } from '../services/ollama.js';
import { getVisionStatus, getVisionModels } from '../services/vision.js';

const router = Router();

// GET /api/metrics - Quick metrics for real-time updates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [cpu, memory, gpu] = await Promise.all([getCpuInfo(), getMemoryInfo(), getGpuInfo()]);

    res.json({
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpu.usage,
        temperature: cpu.temperature,
      },
      memory: {
        used: memory.used,
        percentage: memory.percentage,
      },
      gpu: gpu
        ? {
            utilization: gpu.utilization,
            memory_used: gpu.memory_used,
            temperature: gpu.temperature,
            power_draw: gpu.power_draw,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/disk - Disk usage
router.get('/disk', async (_req: Request, res: Response) => {
  try {
    const disk = await getDiskInfo();
    res.json({ disk });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get disk info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/ollama - Ollama status
router.get('/ollama', async (_req: Request, res: Response) => {
  try {
    const status = await getOllamaStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Ollama status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/ollama/models - All installed models
router.get('/ollama/models', async (_req: Request, res: Response) => {
  try {
    const models = await getOllamaModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Ollama models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/ollama/ps - Running models
router.get('/ollama/ps', async (_req: Request, res: Response) => {
  try {
    const models = await getOllamaRunningModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get running models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/ollama/health - Health check
router.get('/ollama/health', async (_req: Request, res: Response) => {
  try {
    const status = await getOllamaStatus();
    res.json({
      healthy: status.status === 'running',
      status: status.status,
      version: status.version,
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/vision - Vision Brain status
router.get('/vision', async (_req: Request, res: Response) => {
  try {
    const status = await getVisionStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Vision status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/vision/models - Vision models
router.get('/vision/models', async (_req: Request, res: Response) => {
  try {
    const models = await getVisionModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Vision models',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
