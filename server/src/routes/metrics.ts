import { Router, Request, Response } from 'express';
import { getCpuInfo, getMemoryInfo, getDiskInfo } from '../services/system.js';
import { getGpuInfo } from '../services/nvidia.js';
import { getOllamaStatus, getOllamaModels, getOllamaRunningModels } from '../services/ollama.js';
import { getVisionStatus, getVisionModels } from '../services/vision.js';
import { getStorageStatus } from '../services/storage.js';
import { getNetworkStatus } from '../services/network.js';
import {
  getGpuProcesses,
  getCpuCores,
  getDetailedMemory,
  getTopProcesses,
  getTopProcessesByMemory,
} from '../services/processes.js';

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

// GET /api/metrics/storage - Storage status (SSD, external disks)
router.get('/storage', async (_req: Request, res: Response) => {
  try {
    const storage = await getStorageStatus();
    res.json(storage);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get storage status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/network - Network interfaces status
router.get('/network', async (_req: Request, res: Response) => {
  try {
    const network = await getNetworkStatus();
    res.json(network);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get network status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/cpu/cores - Per-core CPU usage
router.get('/cpu/cores', async (_req: Request, res: Response) => {
  try {
    const cores = await getCpuCores();
    res.json({ cores });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get CPU core info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/metrics/memory/detailed - Detailed memory info
router.get('/memory/detailed', async (_req: Request, res: Response) => {
  try {
    const memory = await getDetailedMemory();
    res.json(memory);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get detailed memory info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/processes/gpu - GPU process list
router.get('/processes/gpu', async (_req: Request, res: Response) => {
  try {
    const processes = await getGpuProcesses();
    res.json({ processes });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get GPU processes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/processes/cpu - Top CPU processes
router.get('/processes/cpu', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const processes = await getTopProcesses(limit);
    res.json({ processes });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get top CPU processes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/processes/memory - Top memory processes
router.get('/processes/memory', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const processes = await getTopProcessesByMemory(limit);
    res.json({ processes });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get top memory processes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
